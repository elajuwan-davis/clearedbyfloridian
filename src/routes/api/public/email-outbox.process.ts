// Email outbox worker — invoked on a schedule (pg_cron) or on demand.
// Pulls up to N queued emails whose next_attempt_at has arrived, tries to
// send each via Resend (through the Lovable connector gateway), and applies
// exponential backoff on failure. Uses the Supabase service role because
// email_outbox is tenant-scoped and this route runs unauthenticated.
//
// Security: x-cron-secret header must match the private CRON_SECRET (server-only
// project key). The route only touches the internal outbox table and does
// not return PII beyond message IDs and error strings.
import { createFileRoute } from "@tanstack/react-router";

const FROM_ADDRESS = "Cleard <info@cleard.com>";
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;
const BUCKET = "permit-files";
// Resend caps a message at 40MB; stay well inside it, base64 inflates by ~4/3.
const MAX_ATTACHMENT_BYTES = 18 * 1024 * 1024;

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function backoffSeconds(attempts: number): number {
  // 1m, 5m, 15m, 60m, 240m
  const ladder = [60, 300, 900, 3600, 14400];
  return ladder[Math.min(attempts, ladder.length - 1)];
}

type OutboxRow = {
  id: string;
  kind: string;
  to_email: string;
  to_name: string | null;
  cc_emails: string[] | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  attempts: number;
  status: string;
  related_submittal_id: string | null;
  tenant_id: string | null;
  /** Storage paths in permit-files, written by whoever queued the email. */
  attachments: Array<{ label?: string; path?: string; filename?: string }> | null;
};

type LoadedAttachment = { filename: string; content: string };

/** Only the storage read this worker needs, so it does not depend on the generated schema. */
type StorageReader = {
  storage: {
    from: (bucket: string) => {
      download: (
        path: string,
      ) => Promise<{ data: Blob | null; error: { message: string } | null }>;
    };
  };
};

/**
 * Attachments are stored as bucket paths, not bytes: a permit application emailed to a
 * building department is worthless without them, so a failure to load one aborts the send
 * rather than delivering an empty application.
 */
async function loadAttachments(
  admin: StorageReader,
  row: OutboxRow,
): Promise<{ ok: true; files: LoadedAttachment[] } | { ok: false; error: string; retriable: boolean }> {
  const wanted = (row.attachments ?? []).filter((a) => a?.path);
  if (wanted.length === 0) return { ok: true, files: [] };

  const files: LoadedAttachment[] = [];
  let total = 0;
  for (const att of wanted) {
    const path = att.path as string;
    const { data, error } = await admin.storage.from(BUCKET).download(path);
    if (error || !data) {
      return {
        ok: false,
        retriable: true,
        error: `attachment ${path} could not be read: ${error?.message ?? "no data"}`,
      };
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    total += bytes.byteLength;
    if (total > MAX_ATTACHMENT_BYTES) {
      return {
        ok: false,
        retriable: false,
        error: `attachments exceed ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB — send the package as a shared link instead`,
      };
    }
    files.push({
      filename: att.filename ?? path.split("/").pop() ?? `${att.label ?? "attachment"}.pdf`,
      content: Buffer.from(bytes).toString("base64"),
    });
  }
  return { ok: true, files };
}

async function sendViaResend(
  row: OutboxRow,
  attachments: LoadedAttachment[],
): Promise<{ ok: true; providerId: string | null } | { ok: false; error: string; retriable: boolean }> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return {
      ok: false,
      retriable: false,
      error:
        "Email provider is not configured. Add the Resend connector to send from info@cleard.com.",
    };
  }
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [row.to_email],
      cc: row.cc_emails && row.cc_emails.length ? row.cc_emails : undefined,
      subject: row.subject,
      text: row.body_text,
      html: row.body_html ?? undefined,
      attachments: attachments.length ? attachments : undefined,
      headers: row.related_submittal_id
        ? { "X-Cleard-Submittal": row.related_submittal_id }
        : undefined,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    // 4xx = permanent (bad address, blocked domain); 5xx / 429 = retriable
    const retriable = res.status >= 500 || res.status === 429;
    return { ok: false, retriable, error: `Resend ${res.status}: ${text.slice(0, 400)}` };
  }
  let providerId: string | null = null;
  try {
    const j = JSON.parse(text) as { id?: string };
    providerId = j.id ?? null;
  } catch {
    /* ignore */
  }
  return { ok: true, providerId };
}

export const Route = createFileRoute("/api/public/email-outbox/process")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Private cron secret (never shipped to the client) gates this worker.
        const cronSecret = process.env.CRON_SECRET;
        const provided = request.headers.get("x-cron-secret");
        if (!cronSecret || !provided || provided.length !== cronSecret.length || provided !== cronSecret) {
          return unauthorized();
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const nowIso = new Date().toISOString();
        const { data: due, error } = await supabaseAdmin
          .from("email_outbox" as any)
          .select("*")
          .in("status", ["queued", "retry"])
          .lte("next_attempt_at", nowIso)
          .order("created_at", { ascending: true })
          .limit(BATCH_SIZE);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const rows = (due ?? []) as unknown as OutboxRow[];
        let sent = 0;
        let failed = 0;
        let deferred = 0;

        for (const row of rows) {
          const attempts = (row.attempts ?? 0) + 1;
          const attemptAt = new Date().toISOString();
          // Claim the row so parallel invocations don't double-send.
          const claim = await (supabaseAdmin.from("email_outbox" as any) as any)
            .update({
              status: "sending",
              last_attempt_at: attemptAt,
              attempts,
            })
            .eq("id", row.id)
            .eq("status", row.status)
            .select("id")
            .maybeSingle();
          if (!claim.data) continue; // someone else grabbed it

          const loaded = await loadAttachments(supabaseAdmin, row);
          const result = loaded.ok ? await sendViaResend(row, loaded.files) : loaded;
          if (result.ok) {
            await (supabaseAdmin.from("email_outbox" as any) as any)
              .update({
                status: "sent",
                sent_at: new Date().toISOString(),
                error: null,
                provider_message_id: result.providerId,
              })
              .eq("id", row.id);
            sent++;
          } else if (result.retriable && attempts < MAX_ATTEMPTS) {
            const nextAt = new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString();
            await (supabaseAdmin.from("email_outbox" as any) as any)
              .update({
                status: "retry",
                next_attempt_at: nextAt,
                error: result.error,
              })
              .eq("id", row.id);
            deferred++;
          } else {
            await (supabaseAdmin.from("email_outbox" as any) as any)
              .update({
                status: "failed",
                error: result.error,
              })
              .eq("id", row.id);
            failed++;
          }
        }

        return new Response(
          JSON.stringify({ processed: rows.length, sent, failed, deferred }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
