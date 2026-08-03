// Agent 1 — Intake Validator.
//
// Invoked by the `trg_permits_intake_validator` pg_net trigger on every INSERT into
// `permits` (also callable directly with { permit_id }).
//
// Every pass/fail decision here is a deterministic data lookup. The model is only
// ever asked to phrase the already-decided result in plain English — it never votes
// on the outcome, and an AI failure degrades to a generated summary, never to a
// different status.
//
// Checks:
//   1. address/jurisdiction resolves        → /api/geocode-census (address-lookup.ts's provider)
//   2. GC license active                    → /api/verify-license (the existing DBPR checker)
//   3. GC insurance current                 → gc_insurance_policies
//   4. Cléared registered in municipality   → municipality_registrations
//   5. PAA signed and on file               → paa_signatures

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const APP_BASE_URL = (
  Deno.env.get("APP_BASE_URL") ?? "https://clearedbyfloridian.lovable.app"
).replace(/\/$/, "");
const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const SUMMARY_MODEL = Deno.env.get("INTAKE_VALIDATOR_MODEL") ?? "anthropic/claude-sonnet-5";

const REQUIRED_COVERAGE = ["general_liability", "workers_comp"] as const;
const EXPIRING_SOON_DAYS = 30;

type Severity = "green" | "amber" | "red";

type Check = {
  key: string;
  label: string;
  severity: Severity;
  detail: string;
  data?: Record<string, unknown>;
};

type PermitRow = {
  id: string;
  tenant_id: string | null;
  project_name: string | null;
  job_address: string | null;
  city: string | null;
  county: string | null;
  municipality: string | null;
  license_number: string | null;
  contractor_company: string | null;
  contractor_qualifier: string | null;
};

const worst = (checks: Check[]): Severity =>
  checks.some((c) => c.severity === "red")
    ? "red"
    : checks.some((c) => c.severity === "amber")
      ? "amber"
      : "green";

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const t = Date.parse(date);
  if (Number.isNaN(t)) return null;
  return Math.floor((t - Date.now()) / 86_400_000);
}

// --- 1. address / jurisdiction ---------------------------------------------

type CensusMatch = {
  city?: string;
  county?: string;
  state?: string;
  formatted?: string;
  incorporated?: boolean;
};

async function checkAddress(permit: PermitRow): Promise<Check> {
  const address = (permit.job_address ?? "").trim();
  if (!address || address.toUpperCase() === "TBD") {
    return {
      key: "address",
      label: "Address & jurisdiction",
      severity: "red",
      detail: "No job address on the permit — jurisdiction cannot be resolved.",
    };
  }

  try {
    const resp = await fetch(
      `${APP_BASE_URL}/api/geocode-census?address=${encodeURIComponent(address)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!resp.ok) {
      return {
        key: "address",
        label: "Address & jurisdiction",
        severity: "amber",
        detail: `Address lookup service returned ${resp.status} — jurisdiction unconfirmed.`,
      };
    }
    const json = (await resp.json()) as { matches?: CensusMatch[] };
    const match = (json.matches ?? [])[0];
    if (!match) {
      return {
        key: "address",
        label: "Address & jurisdiction",
        severity: "red",
        detail: `Address "${address}" did not resolve to a Florida jurisdiction.`,
      };
    }

    const jurisdiction =
      match.incorporated && match.city
        ? match.city
        : `${match.county ?? ""} (unincorporated)`.trim();

    if (match.state && match.state !== "FL") {
      return {
        key: "address",
        label: "Address & jurisdiction",
        severity: "red",
        detail: `Address resolves to ${match.state}, outside Florida.`,
        data: { jurisdiction, resolved: match },
      };
    }

    return {
      key: "address",
      label: "Address & jurisdiction",
      severity: "green",
      detail: `Resolved to ${jurisdiction}, ${match.county ?? "unknown county"}.`,
      data: { jurisdiction, resolved: match },
    };
  } catch (err) {
    return {
      key: "address",
      label: "Address & jurisdiction",
      severity: "amber",
      detail: `Address lookup failed: ${String(err)}`,
    };
  }
}

// --- 2. GC license (existing DBPR checker, not a second one) ----------------

async function checkLicense(permit: PermitRow): Promise<Check> {
  const ln = (permit.license_number ?? "").trim();
  if (!ln) {
    return {
      key: "gc_license",
      label: "GC license active (DBPR)",
      severity: "red",
      detail: "No license number on the permit.",
    };
  }

  try {
    const resp = await fetch(`${APP_BASE_URL}/api/verify-license?ln=${encodeURIComponent(ln)}`, {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) {
      return {
        key: "gc_license",
        label: "GC license active (DBPR)",
        severity: "amber",
        detail: `DBPR lookup returned ${resp.status} for ${ln} — verify manually.`,
      };
    }
    const result = (await resp.json()) as {
      status: string;
      holder_name?: string;
      expiration?: string;
      lookup_url?: string;
    };

    const expiresIn = daysUntil(result.expiration);
    if (result.status === "active") {
      if (expiresIn !== null && expiresIn <= EXPIRING_SOON_DAYS) {
        return {
          key: "gc_license",
          label: "GC license active (DBPR)",
          severity: "amber",
          detail: `License ${ln} is active but expires in ${expiresIn} day(s) (${result.expiration}).`,
          data: result,
        };
      }
      return {
        key: "gc_license",
        label: "GC license active (DBPR)",
        severity: "green",
        detail: `License ${ln} active${result.holder_name ? ` — ${result.holder_name}` : ""}${
          result.expiration ? `, expires ${result.expiration}` : ""
        }.`,
        data: result,
      };
    }
    if (result.status === "unknown") {
      return {
        key: "gc_license",
        label: "GC license active (DBPR)",
        severity: "amber",
        detail: `DBPR status for ${ln} could not be read — verify manually at ${result.lookup_url ?? "myfloridalicense.com"}.`,
        data: result,
      };
    }
    return {
      key: "gc_license",
      label: "GC license active (DBPR)",
      severity: "red",
      detail: `License ${ln} is ${result.status}${
        result.expiration ? ` (expired ${result.expiration})` : ""
      } — cannot pull a permit under it.`,
      data: result,
    };
  } catch (err) {
    return {
      key: "gc_license",
      label: "GC license active (DBPR)",
      severity: "amber",
      detail: `DBPR lookup failed: ${String(err)}`,
    };
  }
}

// --- 3. GC insurance -------------------------------------------------------

type SupabaseClient = ReturnType<typeof createClient>;

async function checkInsurance(supabase: SupabaseClient, permit: PermitRow): Promise<Check> {
  if (!permit.tenant_id) {
    return {
      key: "gc_insurance",
      label: "GC insurance current",
      severity: "red",
      detail: "Permit has no tenant — GC insurance cannot be located.",
    };
  }

  const { data, error } = await supabase
    .from("gc_insurance_policy_status")
    .select("coverage_type, carrier_name, policy_number, expiration_date, status")
    .eq("tenant_id", permit.tenant_id);

  if (error) {
    return {
      key: "gc_insurance",
      label: "GC insurance current",
      severity: "amber",
      detail: `Insurance lookup failed: ${error.message}`,
    };
  }

  const rows = (data ?? []) as Array<{
    coverage_type: string;
    carrier_name: string | null;
    policy_number: string | null;
    expiration_date: string;
    status: string;
  }>;

  const missing: string[] = [];
  const expired: string[] = [];
  const expiring: string[] = [];

  for (const coverage of REQUIRED_COVERAGE) {
    const matches = rows
      .filter((r) => r.coverage_type === coverage)
      .sort((a, b) => b.expiration_date.localeCompare(a.expiration_date));
    const latest = matches[0];
    if (!latest) {
      missing.push(coverage);
    } else if (latest.status === "expired") {
      expired.push(`${coverage} expired ${latest.expiration_date}`);
    } else if (latest.status === "expiring_soon") {
      expiring.push(`${coverage} expires ${latest.expiration_date}`);
    }
  }

  if (missing.length || expired.length) {
    return {
      key: "gc_insurance",
      label: "GC insurance current",
      severity: "red",
      detail: [
        missing.length ? `No policy on file for: ${missing.join(", ")}.` : "",
        expired.length ? `Expired: ${expired.join("; ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      data: { missing, expired, expiring },
    };
  }
  if (expiring.length) {
    return {
      key: "gc_insurance",
      label: "GC insurance current",
      severity: "amber",
      detail: `Coverage in force but expiring soon: ${expiring.join("; ")}.`,
      data: { expiring },
    };
  }
  return {
    key: "gc_insurance",
    label: "GC insurance current",
    severity: "green",
    detail: `General liability and workers comp both in force.`,
    data: {
      policies: rows.map((r) => ({
        coverage_type: r.coverage_type,
        expiration_date: r.expiration_date,
      })),
    },
  };
}

// --- 4. Cléared's municipal registration -----------------------------------

async function checkRegistration(
  supabase: SupabaseClient,
  permit: PermitRow,
  resolvedJurisdiction: string | null,
): Promise<Check> {
  const candidates = [permit.municipality, permit.city, resolvedJurisdiction, permit.county]
    .map((c) => (c ?? "").trim())
    .filter(Boolean);

  if (candidates.length === 0) {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "red",
      detail: "No municipality on the permit and none resolved from the address.",
    };
  }

  const { data, error } = await supabase
    .from("municipality_registrations")
    .select("municipality, county, registration_type, registration_number, status, expires_on");

  if (error) {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "amber",
      detail: `Registration lookup failed: ${error.message}`,
    };
  }

  const rows = (data ?? []) as Array<{
    municipality: string;
    county: string | null;
    registration_type: string;
    registration_number: string | null;
    status: string;
    expires_on: string | null;
  }>;

  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+county$/, "")
      .trim();
  const match = rows.find((r) => candidates.some((c) => norm(r.municipality) === norm(c)));

  if (!match) {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "red",
      detail: `Cléared has no registration on file for ${candidates[0]} — register before submitting.`,
      data: { checked: candidates },
    };
  }
  if (match.status === "lapsed") {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "red",
      detail: `Cléared's ${match.municipality} registration is lapsed.`,
      data: match,
    };
  }
  if (match.status === "pending") {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "amber",
      detail: `Cléared's ${match.municipality} registration is still pending approval.`,
      data: match,
    };
  }

  const expiresIn = daysUntil(match.expires_on);
  if (expiresIn !== null && expiresIn < 0) {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "red",
      detail: `Cléared's ${match.municipality} registration expired ${match.expires_on}.`,
      data: match,
    };
  }
  if (expiresIn !== null && expiresIn <= EXPIRING_SOON_DAYS) {
    return {
      key: "municipality_registration",
      label: "Cléared registered with the municipality",
      severity: "amber",
      detail: `Cléared's ${match.municipality} registration expires in ${expiresIn} day(s).`,
      data: match,
    };
  }
  return {
    key: "municipality_registration",
    label: "Cléared registered with the municipality",
    severity: "green",
    detail:
      match.status === "not_required"
        ? `${match.municipality} does not require agent registration.`
        : `Registered with ${match.municipality}${
            match.registration_number ? ` (#${match.registration_number})` : ""
          }.`,
    data: match,
  };
}

// --- 5. PAA ----------------------------------------------------------------

async function checkPaa(supabase: SupabaseClient, permit: PermitRow): Promise<Check> {
  if (!permit.tenant_id) {
    return {
      key: "paa",
      label: "Permit Agent Authorization on file",
      severity: "red",
      detail: "Permit has no tenant — no PAA can be matched to it.",
    };
  }

  const { data, error } = await supabase
    .from("paa_signatures")
    .select("version, signer_name, signer_email, signed_at, envelope_id, revoked_at")
    .eq("tenant_id", permit.tenant_id)
    .is("revoked_at", null)
    .order("signed_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      key: "paa",
      label: "Permit Agent Authorization on file",
      severity: "amber",
      detail: `PAA lookup failed: ${error.message}`,
    };
  }

  const paa = (data ?? [])[0] as
    | {
        version: string;
        signer_name: string;
        signer_email: string;
        signed_at: string;
        envelope_id: string | null;
      }
    | undefined;

  if (!paa) {
    return {
      key: "paa",
      label: "Permit Agent Authorization on file",
      severity: "red",
      detail: "No signed PAA on file for this GC — Cléared cannot sign as agent of record.",
    };
  }

  return {
    key: "paa",
    label: "Permit Agent Authorization on file",
    severity: "green",
    detail: `PAA ${paa.version} signed by ${paa.signer_name} on ${paa.signed_at.slice(0, 10)}.`,
    data: paa,
  };
}

// --- summary (model phrases the result; it does not decide it) --------------

function fallbackSummary(status: Severity, checks: Check[], permit: PermitRow): string {
  const failed = checks.filter((c) => c.severity !== "green");
  const head =
    status === "green"
      ? `${permit.project_name ?? "Permit"} passed all five intake checks and is ready for document generation.`
      : `${permit.project_name ?? "Permit"} is ${status.toUpperCase()} — ${failed.length} item(s) need staff attention.`;
  return [head, ...failed.map((c) => `• ${c.label}: ${c.detail}`)].join("\n");
}

async function composeSummary(
  status: Severity,
  checks: Check[],
  permit: PermitRow,
): Promise<{ summary: string; model: string | null }> {
  const deterministic = fallbackSummary(status, checks, permit);
  if (!LOVABLE_API_KEY) return { summary: deterministic, model: null };

  const system = [
    "You write intake validation summaries for Cléared, a Florida private-provider permitting firm.",
    "The pass/fail decision has already been made by deterministic data lookups and is given to you.",
    "Never change, question, or re-derive the status. Only phrase the result for permitting staff:",
    "two to four sentences, plain professional English, name each failed item and the concrete next",
    "action a staff member should take. No markdown headings, no bullets, no preamble.",
  ].join(" ");

  const user = JSON.stringify({
    permit: {
      project_name: permit.project_name,
      job_address: permit.job_address,
      municipality: permit.municipality ?? permit.city,
      contractor_company: permit.contractor_company,
      license_number: permit.license_number,
    },
    decided_status: status,
    checks: checks.map((c) => ({ label: c.label, severity: c.severity, detail: c.detail })),
  });

  try {
    const resp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!resp.ok) {
      console.error(`AI Gateway ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
      return { summary: deterministic, model: null };
    }
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return { summary: deterministic, model: null };
    return { summary: text.trim(), model: SUMMARY_MODEL };
  } catch (err) {
    console.error("AI summary failed", err);
    return { summary: deterministic, model: null };
  }
}

// --- staff notification ----------------------------------------------------

async function notifyStaff(
  supabase: SupabaseClient,
  permit: PermitRow,
  status: Severity,
  checks: Check[],
  summary: string,
): Promise<number> {
  const failed = checks.filter((c) => c.severity !== "green");
  const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  const recipients = ((admins ?? []) as Array<{ user_id: string }>).map((a) => a.user_id);
  const targets: Array<string | null> = recipients.length > 0 ? recipients : [null];

  const rows = targets.map((user_id) => ({
    user_id,
    kind: "action_required",
    title: `Intake ${status.toUpperCase()} — ${permit.project_name ?? permit.job_address ?? "New permit"}`,
    body: [summary, "", "Failed checks:", ...failed.map((c) => `${c.label}: ${c.detail}`)].join(
      "\n",
    ),
    permit_id: permit.id,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) {
    console.error("notification insert failed", error);
    return 0;
  }
  return rows.length;
}

// --- handler ---------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Supabase not configured", { status: 500 });
  }

  let body: { permit_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  const permitId = body.permit_id;
  if (!permitId) return new Response("Missing permit_id", { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: permitRow, error: permitError } = await supabase
    .from("permits")
    .select(
      "id, tenant_id, project_name, job_address, city, county, municipality, license_number, contractor_company, contractor_qualifier",
    )
    .eq("id", permitId)
    .maybeSingle();

  if (permitError || !permitRow) {
    return new Response(`Permit ${permitId} not found`, { status: 404 });
  }
  const permit = permitRow as unknown as PermitRow;

  const [address, license, insurance, paa] = await Promise.all([
    checkAddress(permit),
    checkLicense(permit),
    checkInsurance(supabase, permit),
    checkPaa(supabase, permit),
  ]);
  const resolvedJurisdiction = (address.data?.jurisdiction as string | undefined) ?? null;
  const registration = await checkRegistration(supabase, permit, resolvedJurisdiction);

  const checks = [address, license, insurance, registration, paa];
  const status = worst(checks);
  const { summary, model } = await composeSummary(status, checks, permit);

  const report = {
    status,
    summary,
    summary_model: model,
    checked_at: new Date().toISOString(),
    resolved_jurisdiction: resolvedJurisdiction,
    checks,
    failed: checks.filter((c) => c.severity !== "green").map((c) => c.key),
  };

  const { error: updateError } = await supabase
    .from("permits")
    .update({
      validation_status: status,
      validation_report: report,
      validated_at: report.checked_at,
    })
    .eq("id", permit.id);

  if (updateError) {
    console.error("permit update failed", updateError);
    return new Response(`Failed to write validation result: ${updateError.message}`, {
      status: 500,
    });
  }

  let notified = 0;
  if (status !== "green") {
    notified = await notifyStaff(supabase, permit, status, checks, summary);
  }

  await supabase.from("activity_events").insert({
    tenant_id: permit.tenant_id,
    permit_id: permit.id,
    event_type: "intake_validated",
    actor_label: "Intake Validator",
    summary,
    details: report,
  });

  return Response.json({ permit_id: permit.id, status, notified, report });
});
