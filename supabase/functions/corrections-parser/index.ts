// Agent 7 — Corrections parser. Two actions, and the split between them IS the approval gate:
//
//   action 'parse'  — invoked by the pg_net trigger on every new correction_notices row (and
//                     by staff for a manual re-parse). Reads the letter, has claude-sonnet-5
//                     categorise each comment and draft the acknowledgment, validates the
//                     result against closed sets, and writes ONE correction_plans row in
//                     'draft_pending_approval'. Nothing leaves Cleard.
//   action 'send'   — invoked ONLY by the release trigger, which only fires when
//                     approve_correction_plan() moved the plan to 'approved'. Queues the
//                     acknowledgment with the existing email_outbox dispatcher.
//
// The function cannot approve anything itself, and the send path refuses a plan that is not
// already approved by a staff member, so no bug in the UI can mail the building department or
// the GC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { CallerAuthError, requireStaffCaller, type Caller } from "../_shared/caller-auth.ts";
import { errorMessage } from "../_shared/errors.ts";
import { pdfText } from "../_shared/pdf-text.ts";
import {
  SYSTEM_PROMPT,
  countNumberedComments,
  parsePlan,
  planTotals,
  userPrompt,
  type CorrectionPlan,
  type LetterContext,
} from "../_shared/correction-parse.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const AI_URL =
  Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = Deno.env.get("CORRECTIONS_MODEL") ?? "claude-sonnet-5";
const STORAGE_BUCKET = Deno.env.get("PERMIT_FILES_BUCKET") ?? "permit-files";
const APP_BASE_URL = (
  Deno.env.get("APP_BASE_URL") ?? "https://clearedbyfloridian.lovable.app"
).replace(/\/$/, "");
const FIRM_EMAIL = Deno.env.get("CLEARD_FIRM_EMAIL") ?? "info@cleard.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

// Explicit generics: bare ReturnType<typeof createClient> resolves the schema parameter to
// `never`, which no real client satisfies.
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = ReturnType<typeof createClient<any, "public", any>>;

type NoticeRow = {
  id: string;
  tenant_id: string | null;
  permit_id: string;
  submission_id: string | null;
  municipality_slug: string | null;
  notice_label: string | null;
  document_path: string | null;
  raw_text: string | null;
  status: string;
};

async function notifyStaff(
  admin: SupabaseAdmin,
  permitId: string,
  title: string,
  body: string,
): Promise<number> {
  const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const recipients = (admins ?? []) as Array<{ user_id: string }>;
  if (recipients.length === 0) {
    console.warn(`no admin recipients for notification: ${title}`);
    return 0;
  }
  const { error } = await admin.from("notifications").insert(
    recipients.map((r) => ({
      user_id: r.user_id,
      kind: "permit_correction",
      title,
      body,
      permit_id: permitId,
    })),
  );
  if (error) throw error;
  return recipients.length;
}

/**
 * The letter text. `raw_text` is what the portal page showed; when the notice is a downloaded
 * file, the PDF's text layer is extracted here. A letter we cannot read is not guessed at.
 */
async function letterText(admin: SupabaseAdmin, notice: NoticeRow): Promise<string> {
  const inline = (notice.raw_text ?? "").trim();
  if (inline.length >= 80) return inline;

  if (notice.document_path) {
    const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(notice.document_path);
    if (error) throw new Error(`could not download ${notice.document_path}: ${error.message}`);
    const bytes = new Uint8Array(await data.arrayBuffer());
    const extracted = await pdfText(bytes);
    const combined = [inline, extracted].filter((s) => s && s.trim()).join("\n\n").trim();
    if (combined.length >= 80) return combined;
    throw new Error(
      `no readable text in ${notice.document_path} — the notice is probably a scan; ` +
        "paste the letter text on the notice to parse it",
    );
  }

  if (inline) return inline;
  throw new Error("correction notice has neither text nor a stored document");
}

async function draftWithModel(ctx: LetterContext): Promise<{ plan: CorrectionPlan; model: string }> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured — cannot draft a correction plan");
  }
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(ctx) },
      ],
    }),
  });
  if (!resp.ok) {
    throw new Error(`AI gateway returned ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  }
  const body = (await resp.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) throw new Error("AI gateway returned an empty response");
  // Throws on anything vague or out-of-vocabulary rather than posting a half plan for
  // approval.
  return { plan: parsePlan(content), model: body.model ?? MODEL };
}

// --- action: parse ---------------------------------------------------------

async function handleParse(admin: SupabaseAdmin, body: { notice_id?: string }) {
  const noticeId = body.notice_id;
  if (!noticeId) return json({ error: "notice_id required" }, 400);

  const { data: noticeRow, error: noticeErr } = await admin
    .from("correction_notices")
    .select("*")
    .eq("id", noticeId)
    .maybeSingle();
  if (noticeErr) throw noticeErr;
  if (!noticeRow) return json({ error: "correction notice not found" }, 404);
  const notice = noticeRow as NoticeRow;

  const { data: livePlan } = await admin
    .from("correction_plans")
    .select("id, status")
    .eq("notice_id", notice.id)
    .in("status", ["draft_pending_approval", "approved", "sending", "sent"])
    .maybeSingle();
  if (livePlan) {
    return json({
      ok: true,
      note: "this notice already has a plan awaiting or past approval",
      plan: livePlan,
    });
  }

  const { data: permitRow } = await admin
    .from("permits")
    .select("*")
    .eq("id", notice.permit_id)
    .maybeSingle();
  const permit = (permitRow ?? {}) as Record<string, unknown>;

  const { data: submissionRow } = notice.submission_id
    ? await admin
        .from("municipality_submissions")
        .select("confirmation_number, municipality_slug, draft")
        .eq("id", notice.submission_id)
        .maybeSingle()
    : { data: null };
  const submission = (submissionRow ?? null) as {
    confirmation_number: string | null;
    municipality_slug: string | null;
    draft: { municipality?: { city_name?: string; intake_email?: string; intake_cc?: string[] } };
  } | null;

  const slug = notice.municipality_slug ?? submission?.municipality_slug ?? null;
  const { data: targetRow } = slug
    ? await admin
        .from("municipality_submission_targets")
        .select("slug, city_name, intake_email, intake_cc")
        .eq("slug", slug)
        .maybeSingle()
    : { data: null };
  const target = (targetRow ?? null) as {
    slug: string;
    city_name: string | null;
    intake_email: string | null;
    intake_cc: string[] | null;
  } | null;

  await admin.from("correction_notices").update({ status: "parsing" }).eq("id", notice.id);

  let text: string;
  try {
    text = await letterText(admin, notice);
  } catch (err) {
    const reason = errorMessage(err);
    await admin.from("correction_notices").update({ status: "new" }).eq("id", notice.id);
    await notifyStaff(
      admin,
      notice.permit_id,
      `Correction notice could not be read — ${permit.project_name ?? notice.permit_id}`,
      `${reason}. Open the permit to add the letter text: ${APP_BASE_URL}/portal/permits/${notice.permit_id}`,
    );
    return json({ error: reason }, 422);
  }

  const ctx: LetterContext = {
    municipality: target?.city_name ?? slug,
    permit_label: (permit.project_name as string) ?? null,
    job_address: (permit.job_address as string) ?? null,
    record_number: submission?.confirmation_number ?? (permit.permit_number as string) ?? null,
    notice_label: notice.notice_label,
    letter_text: text,
  };

  let plan: CorrectionPlan;
  let model: string;
  try {
    ({ plan, model } = await draftWithModel(ctx));
  } catch (err) {
    const reason = errorMessage(err);
    await admin.from("correction_notices").update({ status: "new" }).eq("id", notice.id);
    await notifyStaff(
      admin,
      notice.permit_id,
      `Correction letter needs manual handling — ${permit.project_name ?? notice.permit_id}`,
      `Automatic parsing failed: ${reason}. The letter is on the permit: ${APP_BASE_URL}/portal/permits/${notice.permit_id}`,
    );
    return json({ error: reason }, 502);
  }

  const totals = planTotals(plan);
  const numbered = countNumberedComments(text);

  const ackTo =
    target?.intake_email ??
    submission?.draft?.municipality?.intake_email ??
    (permit.correction_reply_email as string) ??
    null;

  const { data: inserted, error: insErr } = await admin
    .from("correction_plans")
    .insert({
      tenant_id: notice.tenant_id,
      permit_id: notice.permit_id,
      notice_id: notice.id,
      municipality_slug: slug,
      status: "draft_pending_approval",
      plan,
      totals,
      item_count: plan.items.length,
      overall_complexity: plan.overall_complexity,
      letter_excerpt: text.slice(0, 4000),
      model,
      numbered_comments_found: numbered,
      ack_to_email: ackTo,
      ack_cc_emails: target?.intake_cc ?? submission?.draft?.municipality?.intake_cc ?? [],
      ack_subject: plan.acknowledgment.subject,
      ack_body: plan.acknowledgment.body,
    })
    .select("*")
    .single();
  if (insErr) {
    if ((insErr as { code?: string }).code === "23505") {
      return json({ error: "this notice already has a live plan" }, 409);
    }
    throw insErr;
  }
  const planRow = inserted as { id: string };

  await admin.from("correction_notices").update({ status: "parsed" }).eq("id", notice.id);

  await admin.from("correction_plan_events").insert({
    plan_id: planRow.id,
    event_type: "drafted",
    actor_label: "Cleard automation",
    detail: {
      model,
      items: plan.items.length,
      numbered_comments_found: numbered,
      letter_chars: text.length,
    },
  });

  const mismatch =
    numbered > 0 && numbered !== plan.items.length
      ? ` The letter appears to number ${numbered} comment(s) but the draft lists ${plan.items.length} — check before approving.`
      : "";

  const notified = await notifyStaff(
    admin,
    notice.permit_id,
    `Approval needed — correction response for ${permit.project_name ?? permit.job_address ?? "permit"}`,
    `${plan.items.length} correction item(s), ${plan.overall_complexity} complexity` +
      `${totals.third_party_items > 0 ? `, ${totals.third_party_items} needing an engineer or architect` : ""}. ` +
      `Nothing is sent to the GC or ${target?.city_name ?? "the building department"} until a staff member approves: ` +
      `${APP_BASE_URL}/portal/permits/${notice.permit_id}${mismatch}`,
  );

  await admin.from("activity_events").insert({
    tenant_id: notice.tenant_id,
    permit_id: notice.permit_id,
    event_type: "correction_plan_drafted",
    actor_label: "Cleard automation",
    summary: `Parsed ${plan.items.length} correction item(s) — awaiting staff approval`,
    details: { plan_id: planRow.id, model, notified, totals },
  });

  return json({ plan: inserted, requires_approval: true });
}

// --- action: send (post-approval only) -------------------------------------

async function handleSend(admin: SupabaseAdmin, body: { plan_id?: string }) {
  const planId = body.plan_id;
  if (!planId) return json({ error: "plan_id required" }, 400);

  const { data, error } = await admin
    .from("correction_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return json({ error: "correction plan not found" }, 404);

  const row = data as {
    id: string;
    permit_id: string;
    tenant_id: string | null;
    status: string;
    approved_by: string | null;
    ack_to_email: string | null;
    ack_cc_emails: string[] | null;
    ack_subject: string | null;
    ack_body: string | null;
    plan: CorrectionPlan;
  };

  // A duplicate trigger delivery, not a gate violation.
  if (row.status === "sending" || row.status === "sent") {
    return json({ ok: true, note: `already ${row.status}`, plan_id: row.id });
  }

  // The gate, enforced again at send time: no staff approval, no external communication.
  if (row.status !== "approved" || !row.approved_by) {
    return json(
      {
        error: "correction plan is not approved — refusing to send",
        status: row.status,
        approved: Boolean(row.approved_by),
      },
      409,
    );
  }
  if (!row.ack_to_email) {
    await markFailed(admin, row.id, "no acknowledgment recipient on the plan");
    return json({ error: "no acknowledgment recipient" }, 422);
  }
  if (!row.ack_subject || !row.ack_body) {
    await markFailed(admin, row.id, "the approved acknowledgment letter is empty");
    return json({ error: "acknowledgment letter is empty" }, 422);
  }

  const { error: claimErr, data: claimed } = await admin
    .from("correction_plans")
    .update({ status: "sending" })
    .eq("id", row.id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (claimErr) throw claimErr;
  // Someone (a duplicate trigger delivery) already moved it on.
  if (!claimed) return json({ ok: true, note: "already being sent", plan_id: row.id });

  const { data: outbox, error: obErr } = await admin
    .from("email_outbox")
    .insert({
      kind: "permit_correction_ack",
      to_email: row.ack_to_email,
      cc_emails: row.ack_cc_emails ?? [],
      subject: row.ack_subject,
      body_text: `${row.ack_body}\n\n-- \n${FIRM_EMAIL}`,
      status: "queued",
      tenant_id: row.tenant_id,
    })
    .select("id")
    .single();
  if (obErr) {
    await markFailed(admin, row.id, `could not queue the acknowledgment: ${obErr.message}`);
    throw obErr;
  }

  await admin
    .from("correction_plans")
    .update({ status: "sent", sent_at: new Date().toISOString(), outbox_id: (outbox as { id: string }).id })
    .eq("id", row.id);

  await admin.from("correction_plan_events").insert({
    plan_id: row.id,
    event_type: "acknowledgment_queued",
    actor_label: "Cleard automation",
    detail: { to: row.ack_to_email, outbox_id: (outbox as { id: string }).id },
  });

  await admin.from("activity_events").insert({
    tenant_id: row.tenant_id,
    permit_id: row.permit_id,
    event_type: "correction_acknowledgment_sent",
    actor_label: "Cleard automation",
    summary: `Acknowledgment queued to ${row.ack_to_email} after staff approval`,
    details: { plan_id: row.id, items: row.plan?.items?.length ?? null },
  });

  return json({ ok: true, queued_for: "email_dispatcher", plan_id: row.id });
}

async function markFailed(admin: SupabaseAdmin, id: string, reason: string) {
  await admin.from("correction_plans").update({ status: "failed", last_error: reason }).eq("id", id);
  await admin.from("correction_plan_events").insert({
    plan_id: id,
    event_type: "failed",
    actor_label: "Cleard automation",
    detail: { reason },
  });
}

// --- action: status (what the UI polls) ------------------------------------

async function handleStatus(admin: SupabaseAdmin, body: { permit_id?: string }) {
  if (!body.permit_id) return json({ error: "permit_id required" }, 400);
  const { data, error } = await admin
    .from("correction_plans")
    .select("*")
    .eq("permit_id", body.permit_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return json({ plans: data ?? [] });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // Runs under the service role and can reach a building department, so it decides who may
    // ask: the pg_net triggers (service key) or a signed-in staff user.
    const caller: Caller = await requireStaffCaller(req, {
      supabaseUrl: SUPABASE_URL,
      serviceKey: SERVICE_KEY,
    });
    void caller;

    const bodyJson = (await req.json().catch(() => ({}))) as {
      action?: string;
      notice_id?: string;
      plan_id?: string;
      permit_id?: string;
    };
    switch (bodyJson.action ?? "parse") {
      case "parse":
        return await handleParse(admin, bodyJson);
      case "send":
        return await handleSend(admin, bodyJson);
      case "status":
        return await handleStatus(admin, bodyJson);
      default:
        return json({ error: `unknown action '${bodyJson.action}'` }, 400);
    }
  } catch (err) {
    if (err instanceof CallerAuthError) return json({ error: err.message }, err.status);
    console.error("corrections-parser failed", err);
    return json({ error: errorMessage(err) }, 500);
  }
});
