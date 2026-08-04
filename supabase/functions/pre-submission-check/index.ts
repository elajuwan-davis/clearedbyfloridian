// Agent 4 — Pre-Submission Completeness.
//
// Invoked directly by the "Route for Signatures" staff action and re-run by the
// submit gate ({ permit_id }). There is no pg_net trigger for this one — it is a
// staff-initiated gate, not a reaction to a row change.
//
// Every check is a boolean data query. The only model call in this function is an
// ADVISORY read of the plan set (claude-haiku-4-5) layered on top of the deterministic
// format checks; it can add a warning but it cannot flip a pass to a fail, and if the
// model is unavailable the check still resolves deterministically.
//
// Checks:
//   1. required_forms    → permits.documents + Agent 2's document_bundle_report
//   2. signatures        → signature_requests (all routed requests signed)
//   3. plans_format      → PDF parsed with pdf-lib: page count + sheet dimensions
//   4. fee_collected     → service_fee_invoices.status
//   5. nto_ready         → nto_filings.pdf_path + status
//   6. license_active    → LIVE /api/verify-license (Agent 1's result is not trusted)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const APP_BASE_URL = (
  Deno.env.get("APP_BASE_URL") ?? "https://clearedbyfloridian.lovable.app"
).replace(/\/$/, "");
const AI_URL =
  Deno.env.get("AI_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
const PLAN_REVIEW_MODEL = Deno.env.get("PLAN_REVIEW_MODEL") ?? "anthropic/claude-haiku-4-5";
const BUCKET = "permit-files";

// A plan sheet is at least tabloid (11x17in = 792x1224pt). Anything letter-sized is a
// document printed to PDF, not a drawing set.
const MIN_SHEET_POINTS = { short: 780, long: 1200 };

type Check = {
  key: string;
  label: string;
  pass: boolean;
  blocking: boolean;
  reason: string;
  data?: Record<string, unknown>;
};

type PermitDoc = {
  key: string;
  label: string;
  required: boolean;
  status: string;
  filename: string | null;
  path?: string | null;
  size?: number | null;
  mime?: string | null;
};

type PermitRow = {
  id: string;
  tenant_id: string | null;
  project_name: string | null;
  job_address: string | null;
  municipality: string | null;
  license_number: string | null;
  documents: PermitDoc[] | null;
  document_bundle_path: string | null;
  document_bundle_report: {
    unfillable_fields?: unknown[];
    missing_documents?: unknown[];
    forms?: Array<{ key?: string; label?: string; generated?: boolean }>;
  } | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- 1. required forms present (Agent 2's output) ---------------------------

function checkRequiredForms(permit: PermitRow): Check {
  const docs = permit.documents ?? [];
  const missingRequired = docs
    .filter((d) => d.required && d.status !== "uploaded" && d.status !== "not_applicable")
    .map((d) => d.label || d.key);

  const report = permit.document_bundle_report ?? null;
  const unfillable = (report?.unfillable_fields ?? []) as unknown[];
  const bundled = Boolean(permit.document_bundle_path);

  if (!bundled) {
    return {
      key: "required_forms",
      label: "Required forms present",
      pass: false,
      blocking: true,
      reason:
        "No generated document bundle on the permit — document-generation (Agent 2) has not produced the jurisdiction forms yet.",
      data: { missing_required: missingRequired },
    };
  }
  if (missingRequired.length > 0) {
    return {
      key: "required_forms",
      label: "Required forms present",
      pass: false,
      blocking: true,
      reason: `Required document(s) not uploaded: ${missingRequired.join(", ")}.`,
      data: { missing_required: missingRequired },
    };
  }
  if (unfillable.length > 0) {
    return {
      key: "required_forms",
      label: "Required forms present",
      pass: false,
      blocking: true,
      reason: `Bundle generated with ${unfillable.length} field(s) that could not be filled: ${unfillable
        .slice(0, 5)
        .map((f) => (typeof f === "string" ? f : JSON.stringify(f)))
        .join(", ")}.`,
      data: { unfillable_fields: unfillable },
    };
  }
  return {
    key: "required_forms",
    label: "Required forms present",
    pass: true,
    blocking: true,
    reason: `Bundle present at ${permit.document_bundle_path} with every required document uploaded.`,
  };
}

// --- 2. signatures obtained (SignWell ledger) -------------------------------

type SignatureRow = {
  document_name: string;
  recipient_email: string;
  status: string;
  status_source: string;
  signed_at: string | null;
};

function checkSignatures(rows: SignatureRow[]): Check {
  if (rows.length === 0) {
    return {
      key: "signatures",
      label: "Signatures obtained",
      pass: false,
      blocking: true,
      reason: "No signature requests routed for this permit.",
    };
  }
  const outstanding = rows.filter((r) => r.status !== "signed");
  if (outstanding.length > 0) {
    const detail = outstanding
      .map((r) => `${r.document_name} → ${r.recipient_email} (${r.status})`)
      .join("; ");
    return {
      key: "signatures",
      label: "Signatures obtained",
      pass: false,
      blocking: true,
      reason: `${outstanding.length} signature(s) outstanding: ${detail}.`,
      data: { outstanding },
    };
  }
  const manual = rows.filter((r) => r.status_source !== "provider").length;
  return {
    key: "signatures",
    label: "Signatures obtained",
    pass: true,
    blocking: true,
    reason:
      manual > 0
        ? `All ${rows.length} signature(s) recorded as signed — ${manual} staff-attested (SignWell is not connected, so no provider confirmation exists).`
        : `All ${rows.length} signature(s) confirmed by SignWell.`,
    data: { total: rows.length, staff_attested: manual },
  };
}

// --- 3. plans uploaded in the correct format --------------------------------

const PLAN_KEYS = ["plan", "drawing", "sheet", "blueprint"];
const isPlanDoc = (d: PermitDoc) =>
  PLAN_KEYS.some((k) => `${d.key} ${d.label}`.toLowerCase().includes(k));

async function checkPlansFormat(
  admin: ReturnType<typeof createClient>,
  permit: PermitRow,
): Promise<Check> {
  const plans = (permit.documents ?? []).filter(
    (d) => isPlanDoc(d) && d.status === "uploaded" && d.path,
  );
  if (plans.length === 0) {
    return {
      key: "plans_format",
      label: "Plans uploaded in correct format",
      pass: false,
      blocking: true,
      reason: "No plan set uploaded.",
    };
  }

  const problems: string[] = [];
  const inspected: Array<Record<string, unknown>> = [];

  for (const plan of plans) {
    const name = plan.filename ?? plan.path ?? plan.key;
    if (!/\.pdf$/i.test(name) && plan.mime !== "application/pdf") {
      problems.push(`${name}: not a PDF (${plan.mime ?? "unknown type"}).`);
      continue;
    }
    const { data: file, error } = await admin.storage.from(BUCKET).download(plan.path!);
    if (error || !file) {
      problems.push(`${name}: stored file could not be read (${error?.message ?? "missing"}).`);
      continue;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let pdf: PDFDocument;
    try {
      pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch (err) {
      problems.push(`${name}: not a readable PDF (${String(err)}).`);
      continue;
    }
    const pages = pdf.getPages();
    if (pages.length === 0) {
      problems.push(`${name}: PDF has no pages.`);
      continue;
    }
    const sizes = pages.map((p) => {
      const { width, height } = p.getSize();
      return { short: Math.min(width, height), long: Math.max(width, height) };
    });
    const undersized = sizes.filter(
      (s) => s.short < MIN_SHEET_POINTS.short || s.long < MIN_SHEET_POINTS.long,
    );
    if (undersized.length > 0) {
      problems.push(
        `${name}: ${undersized.length} of ${pages.length} sheet(s) smaller than 11x17 in — plans must be submitted at sheet size.`,
      );
    }
    inspected.push({ name, pages: pages.length, sheet_points: sizes[0], bytes: bytes.length });
  }

  if (problems.length > 0) {
    return {
      key: "plans_format",
      label: "Plans uploaded in correct format",
      pass: false,
      blocking: true,
      reason: problems.join(" "),
      data: { inspected },
    };
  }

  // Advisory only: the deterministic result above already decided the pass.
  const advisory = await planAdvisory(inspected);
  return {
    key: "plans_format",
    label: "Plans uploaded in correct format",
    pass: true,
    blocking: true,
    reason:
      `${inspected.length} plan file(s) are sheet-size PDFs` +
      (advisory ? ` — reviewer note: ${advisory}` : "."),
    data: { inspected, advisory },
  };
}

async function planAdvisory(inspected: Array<Record<string, unknown>>): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;
  try {
    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PLAN_REVIEW_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You review plan-set metadata for a Florida permit submittal. Reply with at most two sentences noting anything a plans examiner would reject on format grounds (single-sheet sets, mixed sheet sizes, suspiciously small files). Never state a verdict — the pass/fail decision is made elsewhere. If nothing stands out, reply exactly: none.",
          },
          { role: "user", content: JSON.stringify(inspected) },
        ],
      }),
    });
    if (!resp.ok) return null;
    const body = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = (body.choices?.[0]?.message?.content ?? "").trim();
    return !text || /^none\.?$/i.test(text) ? null : text;
  } catch {
    return null;
  }
}

// --- 4. fee collected -------------------------------------------------------

function checkFee(
  invoices: Array<{ status: string; fee_cents: number; paid_at: string | null }>,
): Check {
  if (invoices.length === 0) {
    return {
      key: "fee_collected",
      label: "Cleard fee collected",
      pass: false,
      blocking: true,
      reason: "No service fee invoice exists for this permit.",
    };
  }
  const paid = invoices.find((i) => i.status === "paid");
  if (!paid) {
    return {
      key: "fee_collected",
      label: "Cleard fee collected",
      pass: false,
      blocking: true,
      reason: `Fee invoice is ${invoices[0].status}, not paid.`,
      data: { statuses: invoices.map((i) => i.status) },
    };
  }
  return {
    key: "fee_collected",
    label: "Cleard fee collected",
    pass: true,
    blocking: true,
    reason: `Fee of $${(paid.fee_cents / 100).toFixed(2)} paid${paid.paid_at ? ` on ${paid.paid_at.slice(0, 10)}` : ""}.`,
  };
}

// --- 5. NTO ready -----------------------------------------------------------

const NTO_READY_STATUSES = ["ready", "generated", "sent", "filed", "recorded"];

function checkNto(
  nto: { status: string; pdf_path: string | null; sent_at: string | null } | null,
): Check {
  if (!nto) {
    return {
      key: "nto_ready",
      label: "NTO ready",
      pass: false,
      blocking: true,
      reason: "No NTO filing record for this permit.",
    };
  }
  if (!nto.pdf_path) {
    return {
      key: "nto_ready",
      label: "NTO ready",
      pass: false,
      blocking: true,
      reason: `NTO record exists (${nto.status}) but no generated PDF is stored.`,
    };
  }
  if (!NTO_READY_STATUSES.includes(nto.status)) {
    return {
      key: "nto_ready",
      label: "NTO ready",
      pass: false,
      blocking: true,
      reason: `NTO status is ${nto.status}.`,
    };
  }
  return {
    key: "nto_ready",
    label: "NTO ready",
    pass: true,
    blocking: true,
    reason: `NTO ${nto.status} with PDF at ${nto.pdf_path}.`,
  };
}

// --- 6. license still active (live re-check) --------------------------------

async function checkLicenseLive(permit: PermitRow): Promise<Check> {
  const ln = (permit.license_number ?? "").trim();
  if (!ln) {
    return {
      key: "license_active",
      label: "GC license active (live DBPR re-check)",
      pass: false,
      blocking: true,
      reason: "No license number on the permit.",
    };
  }
  try {
    const resp = await fetch(`${APP_BASE_URL}/api/verify-license?ln=${encodeURIComponent(ln)}`, {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) {
      return {
        key: "license_active",
        label: "GC license active (live DBPR re-check)",
        pass: false,
        blocking: true,
        reason: `DBPR lookup returned ${resp.status} — license could not be re-verified, so submission stays blocked.`,
      };
    }
    const result = (await resp.json()) as {
      status: string;
      holder_name?: string;
      expiration?: string;
    };
    if (result.status !== "active") {
      return {
        key: "license_active",
        label: "GC license active (live DBPR re-check)",
        pass: false,
        blocking: true,
        reason: `License ${ln} is ${result.status}${result.expiration ? ` (expiration ${result.expiration})` : ""}.`,
        data: result,
      };
    }
    return {
      key: "license_active",
      label: "GC license active (live DBPR re-check)",
      pass: true,
      blocking: true,
      reason: `License ${ln} active${result.expiration ? `, expires ${result.expiration}` : ""} as of this check.`,
      data: result,
    };
  } catch (err) {
    return {
      key: "license_active",
      label: "GC license active (live DBPR re-check)",
      pass: false,
      blocking: true,
      reason: `DBPR re-check failed (${String(err)}) — submission stays blocked until the license can be confirmed.`,
    };
  }
}

// --- handler ----------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      permit_id?: string;
      record?: { id?: string };
    };
    const permitId = body.permit_id ?? body.record?.id;
    if (!permitId) return json({ error: "permit_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data: permit, error } = await admin
      .from("permits")
      .select(
        "id, tenant_id, project_name, job_address, municipality, license_number, documents, document_bundle_path, document_bundle_report",
      )
      .eq("id", permitId)
      .maybeSingle();
    if (error) throw error;
    if (!permit) return json({ error: "permit not found" }, 404);
    const row = permit as PermitRow;

    const [{ data: sigs }, { data: invoices }, { data: nto }] = await Promise.all([
      admin
        .from("signature_requests")
        .select("document_name, recipient_email, status, status_source, signed_at")
        .eq("permit_id", permitId),
      admin
        .from("service_fee_invoices")
        .select("status, fee_cents, paid_at")
        .eq("permit_id", permitId)
        .order("created_at", { ascending: false }),
      admin
        .from("nto_filings")
        .select("status, pdf_path, sent_at")
        .eq("permit_id", permitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const checks: Check[] = [
      checkRequiredForms(row),
      checkSignatures((sigs ?? []) as SignatureRow[]),
      await checkPlansFormat(admin, row),
      checkFee(
        (invoices ?? []) as Array<{ status: string; fee_cents: number; paid_at: string | null }>,
      ),
      checkNto(nto as { status: string; pdf_path: string | null; sent_at: string | null } | null),
      await checkLicenseLive(row),
    ];

    const blockers = checks.filter((c) => c.blocking && !c.pass);
    const status: "pass" | "blocked" = blockers.length === 0 ? "pass" : "blocked";
    const report = {
      status,
      checked_at: new Date().toISOString(),
      signwell_configured: false,
      checks,
      blocking_reasons: blockers.map((c) => `${c.label}: ${c.reason}`),
    };

    const { error: upErr } = await admin
      .from("permits")
      .update({
        pre_submission_status: status,
        pre_submission_report: report,
        pre_submission_checked_at: report.checked_at,
      })
      .eq("id", permitId);
    if (upErr) throw upErr;

    await admin.from("activity_events").insert({
      tenant_id: row.tenant_id ?? null,
      permit_id: permitId,
      event_type: "pre_submission_check",
      actor_label: "Cleard automation",
      summary:
        status === "pass"
          ? "Pre-submission check passed — Submit enabled"
          : `Pre-submission check blocked (${blockers.length} item(s))`,
      details: report,
    });

    return json({ permit_id: permitId, status, report });
  } catch (err) {
    console.error("pre-submission-check failed", err);
    return json({ error: String(err) }, 500);
  }
});
