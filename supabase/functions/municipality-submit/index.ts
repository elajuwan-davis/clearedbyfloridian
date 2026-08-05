// Agent 5 — Municipality Submission. Pilot: City of Plantation (Accela Citizen Access).
//
// Two actions, and the split between them IS the approval gate:
//
//   action 'draft'   — staff clicked "Submit to Municipality". Re-runs Agent 4's
//                      pre-submission-check, resolves the target municipality, builds a
//                      draft of exactly what will be filed, and stops. Nothing leaves
//                      Cleard. Staff are notified that an approval is waiting.
//   action 'execute' — invoked ONLY by the pg_net release trigger, which only fires when
//                      approve_municipality_submission() moved the row to 'approved'.
//                      Email-intake targets are filed here (through the existing
//                      email_outbox dispatcher); portal targets are handed to the
//                      Playwright worker, which can only claim approved rows.
//
// The function never approves anything itself and refuses to execute a row that is not
// already approved by a staff member, so a bug in the UI cannot file a permit.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { CallerAuthError, requireStaffCaller, type Caller } from "../_shared/caller-auth.ts";
import { errorMessage } from "../_shared/errors.ts";
import {
  draftDocuments,
  emailDraft,
  portalFields,
  resolveTargetFor,
  type PermitRow,
  type Target,
} from "../_shared/submission-draft.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FUNCTIONS_BASE = (
  Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? `${SUPABASE_URL}/functions/v1`
).replace(/\/$/, "");
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

// select('*'): the columns the agents add arrive across several migrations, and a draft
// should not fail because one of them has not been applied yet.
async function loadPermit(admin: SupabaseAdmin, permitId: string): Promise<PermitRow | null> {
  const { data, error } = await admin.from("permits").select("*").eq("id", permitId).maybeSingle();
  if (error) throw error;
  return (data as PermitRow) ?? null;
}

/** Re-runs Agent 4's gate. A draft is never built from a stale verdict. */
async function runPreSubmissionCheck(permitId: string) {
  const res = await fetch(`${FUNCTIONS_BASE}/pre-submission-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ permit_id: permitId }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    report?: { blocking_reasons?: string[] };
    error?: string;
  };
  if (!res.ok) {
    throw new Error(`pre-submission-check failed (${res.status}): ${body.error ?? "unknown"}`);
  }
  return body;
}

async function notifyStaff(admin: SupabaseAdmin, permitId: string, title: string, body: string) {
  const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const recipients = (admins ?? []) as Array<{ user_id: string }>;
  if (recipients.length === 0) {
    console.warn(`no admin recipients for notification: ${title}`);
    return 0;
  }
  const { error } = await admin.from("notifications").insert(
    recipients.map((r) => ({
      user_id: r.user_id,
      kind: "municipality_submission",
      title,
      body,
      permit_id: permitId,
    })),
  );
  if (error) throw error;
  return recipients.length;
}

// --- action: draft ---------------------------------------------------------

async function handleDraft(
  admin: SupabaseAdmin,
  caller: Caller,
  body: { permit_id?: string; municipality_slug?: string; test_only?: boolean },
) {
  const permitId = body.permit_id;
  if (!permitId) return json({ error: "permit_id required" }, 400);
  // A rehearsal: the row travels the whole approval path and can never be filed (handleExecute
  // stops it, claim_municipality_submission() will not claim it, and a trigger refuses to let
  // it reach 'submitting'/'submitted' or take a confirmation number).
  const testOnly = body.test_only === true;

  const permit = await loadPermit(admin, permitId);
  if (!permit) return json({ error: "permit not found" }, 404);

  const { data: targetRows, error: targetErr } = await admin
    .from("municipality_submission_targets")
    .select("*")
    .order("slug");
  if (targetErr) throw targetErr;
  const { target, error: targetError } = resolveTargetFor(
    permit,
    (targetRows ?? []) as Target[],
    body.municipality_slug,
  );
  if (!target) return json({ error: targetError }, 422);

  const check = await runPreSubmissionCheck(permitId);
  // The pre-submission gate exists to stop an incomplete package reaching a building
  // department. A rehearsal reaches no one, and requiring a permit to be genuinely
  // file-ready would mean the gate could only ever be exercised on a real job.
  if (!testOnly && check.status !== "pass") {
    return json(
      {
        error: "pre-submission checks are not passing — nothing was drafted",
        blocking_reasons: check.report?.blocking_reasons ?? [],
        report: check.report,
      },
      409,
    );
  }

  const documents = draftDocuments(permit);
  if (!testOnly && documents.length === 0) {
    return json({ error: "no documents to file — the generated bundle is missing" }, 409);
  }

  const draft = {
    built_at: new Date().toISOString(),
    ...(testOnly ? { test_only: true } : {}),
    municipality: {
      slug: target.slug,
      city_name: target.city_name,
      channel: target.channel,
      driver: target.driver,
      portal_url: target.portal_url,
      intake_email: target.intake_email,
      intake_cc: target.intake_cc ?? [],
    },
    permit: {
      id: permit.id,
      project_name: permit.project_name,
      job_address: permit.job_address,
      permit_type: permit.permit_type,
      owner_name: permit.owner_name,
      contractor_company: permit.contractor_company,
      license_number: permit.license_number,
      construction_value_cents: permit.construction_value_cents,
      work_description: permit.scope_concise || permit.description,
    },
    documents,
    portal_fields: target.channel === "portal" ? portalFields(permit, target, FIRM_EMAIL) : null,
    email: target.channel === "email" ? emailDraft(permit, target, documents, FIRM_EMAIL) : null,
  };

  const { data: inserted, error: insErr } = await admin
    .from("municipality_submissions")
    .insert({
      tenant_id: permit.tenant_id,
      permit_id: permit.id,
      municipality_slug: target.slug,
      channel: target.channel,
      status: "draft_pending_approval",
      draft,
      pre_submission_report: check.report ?? null,
      // Attribution comes from the verified caller, never from the request body.
      created_by: caller.userId,
    })
    .select("*")
    .single();
  if (insErr) {
    // The partial unique index means "there is already a live submission for this permit".
    if ((insErr as { code?: string }).code === "23505") {
      const { data: existing } = await admin
        .from("municipality_submissions")
        .select("*")
        .eq("permit_id", permit.id)
        .in("status", ["draft_pending_approval", "approved", "submitting", "submitted"])
        .maybeSingle();
      return json(
        {
          error: "this permit already has a live submission",
          submission: existing ?? null,
        },
        409,
      );
    }
    throw insErr;
  }
  const submission = inserted as { id: string };

  await admin.from("municipality_submission_events").insert({
    submission_id: submission.id,
    event_type: "drafted",
    actor_label: "Cleard automation",
    detail: {
      documents: documents.length,
      channel: target.channel,
      test_only: testOnly,
      pre_submission_status: check.status,
    },
  });

  const notified = await notifyStaff(
    admin,
    permit.id,
    `${testOnly ? "Rehearsal (nothing will be filed) — " : ""}Approval needed — file ${permit.project_name ?? permit.job_address ?? "permit"} with ${target.city_name}`,
    `${documents.length} document(s) are ready to file via ${
      target.channel === "portal" ? target.portal_url : target.intake_email
    }. Nothing is submitted until a staff member approves: ${APP_BASE_URL}/portal/permits/${permit.id}${
      testOnly
        ? "\n\nThis is a test_only rehearsal row: approving it exercises the gate and files nothing."
        : ""
    }`,
  );

  await admin.from("activity_events").insert({
    tenant_id: permit.tenant_id,
    permit_id: permit.id,
    event_type: "municipality_submission_drafted",
    actor_label: "Cleard automation",
    summary: `Drafted ${target.city_name} submission — awaiting staff approval${
      testOnly ? " (rehearsal, nothing will be filed)" : ""
    }`,
    details: {
      submission_id: submission.id,
      channel: target.channel,
      notified,
      test_only: testOnly,
    },
  });

  return json({ submission: inserted, requires_approval: true, test_only: testOnly });
}

// --- action: execute (post-approval only) ----------------------------------

async function handleExecute(admin: SupabaseAdmin, body: { submission_id?: string }) {
  const id = body.submission_id;
  if (!id) return json({ error: "submission_id required" }, 400);

  const { data, error } = await admin
    .from("municipality_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return json({ error: "submission not found" }, 404);

  const sub = data as {
    id: string;
    permit_id: string;
    tenant_id: string | null;
    channel: "portal" | "email";
    status: string;
    approved_by: string | null;
    draft: {
      test_only?: boolean;
      email?: { to?: string; cc?: string[]; subject?: string; body_text?: string } | null;
      documents?: Array<{ label: string; path: string }>;
      municipality?: { city_name?: string; portal_url?: string };
    };
  };

  // The gate, enforced again at execution time: no approval, no filing.
  if (sub.status !== "approved" || !sub.approved_by) {
    return json(
      {
        error: "submission is not approved — refusing to file",
        status: sub.status,
        approved: Boolean(sub.approved_by),
      },
      409,
    );
  }

  // A rehearsal row proves the gate and the trigger chain without a filing: it stops here,
  // before the portal queue and before anything reaches email_outbox. claim_municipality_
  // submission() skips it too, so the worker never sees it either.
  if (sub.draft?.test_only === true) {
    await admin.from("municipality_submission_events").insert({
      submission_id: sub.id,
      event_type: "test_only_no_action",
      actor_label: "Cleard automation",
      detail: { channel: sub.channel, filed: false },
    });
    await admin
      .from("municipality_submissions")
      .update({
        status: "failed",
        last_error: "draft.test_only is true — rehearsal row, nothing was filed",
      })
      .eq("id", sub.id);
    return json({ ok: true, test_only: true, filed: false, submission_id: sub.id });
  }

  if (sub.channel === "portal") {
    // Playwright needs a browser, which an edge function does not have. The approved row
    // stays claimable by the portal worker, which is the only thing that can file it.
    await admin.from("municipality_submission_events").insert({
      submission_id: sub.id,
      event_type: "queued_for_portal_worker",
      actor_label: "Cleard automation",
      detail: { portal_url: sub.draft?.municipality?.portal_url ?? null },
    });
    return json({ ok: true, queued_for: "portal_worker", submission_id: sub.id });
  }

  const email = sub.draft?.email;
  if (!email?.to) {
    await markFailed(admin, sub.id, "email target has no intake address in the draft");
    return json({ error: "email target has no intake address" }, 422);
  }

  // An email filing with nothing attached is not a filing; the building department would
  // just have to ask for the package.
  const attachments = (sub.draft?.documents ?? []).filter((d) => d?.path);
  if (attachments.length === 0) {
    await markFailed(admin, sub.id, "no documents to attach — nothing would be filed");
    return json({ error: "submission has no documents to attach" }, 422);
  }

  const { data: outbox, error: obErr } = await admin
    .from("email_outbox")
    .insert({
      kind: "generic",
      to_email: email.to,
      cc_emails: email.cc ?? [],
      subject: email.subject ?? "Permit application",
      body_text: email.body_text ?? "",
      attachments: attachments.map((d) => ({ label: d.label, path: d.path })),
      status: "queued",
      tenant_id: sub.tenant_id,
    })
    .select("id")
    .single();
  if (obErr) {
    await markFailed(admin, sub.id, `email_outbox insert failed: ${obErr.message}`);
    throw obErr;
  }

  // Queued is not filed. The outbox dispatcher's result promotes this row to 'submitted'
  // (or 'failed') through trg_email_outbox_submission_result, so an application that never
  // left Resend never reads as filed with the department.
  const { error: upErr } = await admin
    .from("municipality_submissions")
    .update({
      status: "submitting",
      email_outbox_id: (outbox as { id: string }).id,
      attempts: 1,
    })
    .eq("id", sub.id);
  if (upErr) throw upErr;

  await admin.from("municipality_submission_events").insert({
    submission_id: sub.id,
    event_type: "queued_for_email_dispatch",
    actor_label: "Cleard automation",
    detail: {
      to: email.to,
      outbox_id: (outbox as { id: string }).id,
      attachments: (sub.draft?.documents ?? []).length,
    },
  });

  return json({
    ok: true,
    queued_for: "email_dispatcher",
    channel: "email",
    submission_id: sub.id,
  });
}

async function markFailed(admin: SupabaseAdmin, id: string, reason: string) {
  await admin
    .from("municipality_submissions")
    .update({ status: "failed", last_error: reason })
    .eq("id", id);
  await admin.from("municipality_submission_events").insert({
    submission_id: id,
    event_type: "failed",
    actor_label: "Cleard automation",
    detail: { reason },
  });
}

// --- action: status (what the UI polls) ------------------------------------

async function handleStatus(admin: SupabaseAdmin, body: { permit_id?: string }) {
  // The caller is already verified staff or service (see Deno.serve below).
  if (!body.permit_id) return json({ error: "permit_id required" }, 400);
  const { data, error } = await admin
    .from("municipality_submissions")
    .select("*")
    .eq("permit_id", body.permit_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return json({ submission: data ?? null });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Supabase not configured" }, 503);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // This function runs under the service role and reaches a municipality, so it decides
    // who may ask: the pg_net release trigger (service key) or a signed-in staff user.
    const caller = await requireStaffCaller(req, {
      supabaseUrl: SUPABASE_URL,
      serviceKey: SERVICE_KEY,
    });

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      permit_id?: string;
      submission_id?: string;
      municipality_slug?: string;
      test_only?: boolean;
    };
    switch (body.action ?? "draft") {
      case "draft":
        return await handleDraft(admin, caller, body);
      case "execute":
        return await handleExecute(admin, body);
      case "status":
        return await handleStatus(admin, body);
      default:
        return json({ error: `unknown action '${body.action}'` }, 400);
    }
  } catch (err) {
    if (err instanceof CallerAuthError) return json({ error: err.message }, err.status);
    console.error("municipality-submit failed", err);
    return json({ error: errorMessage(err) }, 500);
  }
});
