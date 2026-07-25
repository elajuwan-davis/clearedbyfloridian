// Inbound HOA reply webhook. When an HOA replies to a submittal email, the
// mail provider (Resend inbound, Mailgun routes, or a Zapier forward)
// POSTs the parsed message here. We identify the submittal from the
// X-Cleard-Submittal header we set at send time, or fall back to a
// subject-line hint like "Cleard #<id>". HMAC-verified with
// HOA_REPLY_WEBHOOK_SECRET (add in Project Settings → Secrets when wiring
// the provider).
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function badRequest(msg: string) {
  return new Response(msg, { status: 400 });
}
function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function verifySignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractSubmittalId(payload: {
  headers?: Record<string, string>;
  subject?: string;
  in_reply_to?: string;
}): string | null {
  const h = payload.headers ?? {};
  const direct = h["X-Cleard-Submittal"] ?? h["x-cleard-submittal"];
  if (direct) return direct.trim();
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const subjectMatch = payload.subject?.match(uuid)?.[0];
  if (subjectMatch) return subjectMatch;
  const replyMatch = payload.in_reply_to?.match(uuid)?.[0];
  return replyMatch ?? null;
}

export const Route = createFileRoute("/api/public/hoa-reply")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.HOA_REPLY_WEBHOOK_SECRET;
        if (!secret) return unauthorized();
        const raw = await request.text();
        const sig =
          request.headers.get("x-cleard-signature") ||
          request.headers.get("x-webhook-signature");
        if (!verifySignature(raw, sig, secret)) return unauthorized();

        let payload: {
          submittal_id?: string;
          from_email?: string;
          from_name?: string;
          to_email?: string;
          subject?: string;
          text?: string;
          html?: string;
          received_at?: string;
          headers?: Record<string, string>;
          in_reply_to?: string;
          provider_message_id?: string;
        };
        try {
          payload = JSON.parse(raw);
        } catch {
          return badRequest("Invalid JSON");
        }

        const submittalId = payload.submittal_id ?? extractSubmittalId(payload);
        if (!submittalId) return badRequest("No submittal identifier in payload");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: submittal } = await supabaseAdmin
          .from("hoa_submittals" as any)
          .select("id, tenant_id")
          .eq("id", submittalId)
          .maybeSingle();
        if (!submittal) return badRequest("Unknown submittal");

        const s = submittal as unknown as { id: string; tenant_id: string | null };

        const { error: insertErr } = await (supabaseAdmin.from(
          "hoa_submittal_replies" as any,
        ) as any).insert({
          submittal_id: s.id,
          tenant_id: s.tenant_id,
          direction: "inbound",
          from_email: payload.from_email ?? null,
          from_name: payload.from_name ?? null,
          to_email: payload.to_email ?? null,
          subject: payload.subject ?? "(no subject)",
          body_text: payload.text ?? "",
          body_html: payload.html ?? null,
          received_at: payload.received_at ?? new Date().toISOString(),
          provider_message_id: payload.provider_message_id ?? null,
        });
        if (insertErr) {
          return new Response(insertErr.message, { status: 500 });
        }

        await (supabaseAdmin.from("hoa_submittal_events" as any) as any).insert({
          submittal_id: s.id,
          tenant_id: s.tenant_id,
          actor_label: payload.from_email ?? "HOA",
          kind: "hoa_reply_logged",
          summary: `HOA reply received: ${payload.subject ?? "(no subject)"}`,
          details: { via: "webhook" },
        });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
