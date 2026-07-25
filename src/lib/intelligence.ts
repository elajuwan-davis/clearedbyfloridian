// Platform-wide intelligence layer for Victoria.
//
// Every permit + HOA submittal writes a row to `submittal_intelligence`.
// Every correction / flag received writes a row to `submittal_corrections`.
// Aggregations power the Victoria intelligence bar and the "Common Corrections"
// tab on each municipality card.
import { supabase } from "@/integrations/supabase/client";

export type IntelSource = "permit" | "hoa";
export type IntelOutcome = "approved" | "denied" | "expired" | "pending" | "in_review" | "corrections";

export type IntelligenceRow = {
  id: string;
  tenant_id: string | null;
  source: IntelSource;
  permit_id: string | null;
  hoa_submittal_id: string | null;
  municipality_slug: string | null;
  municipality_name: string | null;
  jurisdiction: string | null;
  trades: string[];
  scope_of_work: string | null;
  submitted_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  days_to_first_response: number | null;
  days_to_resolution: number | null;
  permit_fee_cents: number | null;
  final_outcome: IntelOutcome | null;
  hoa_community: string | null;
  homeowner_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CorrectionRow = {
  id: string;
  intelligence_id: string | null;
  tenant_id: string | null;
  municipality_slug: string | null;
  municipality_name: string | null;
  trade: string | null;
  source: "municipality" | "hoa" | "private_provider";
  correction_text: string;
  code_section: string | null;
  document_type_flagged: string | null;
  reason_category: string | null;
  resolution_notes: string | null;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
};

export type MunicipalityStats = {
  sample_size: number;
  avg_days_to_response: number | null;
  avg_days_to_resolution: number | null;
  avg_permit_fee_cents: number | null;
  approval_rate: number | null;
};

const I = () => supabase.from("submittal_intelligence" as any) as any;
const C = () => supabase.from("submittal_corrections" as any) as any;

/** Normalize a municipality name into a stable slug used across intelligence tables. */
export function slugifyMunicipality(name: string | null | undefined): string | null {
  if (!name) return null;
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ------------------------------------------------------------------
// Auto-log: called at the moment a permit or HOA submittal is created.
// ------------------------------------------------------------------
export async function logPermitIntelligence(input: {
  tenantId: string | null;
  permitId: string;
  municipalityName: string | null;
  jurisdiction?: string | null;
  trades: string[];
  scopeOfWork?: string | null;
  submittedDate?: string | null;
  permitFeeCents?: number | null;
}): Promise<void> {
  try {
    await I().insert({
      tenant_id: input.tenantId,
      source: "permit" as IntelSource,
      permit_id: input.permitId,
      municipality_slug: slugifyMunicipality(input.municipalityName),
      municipality_name: input.municipalityName,
      jurisdiction: input.jurisdiction ?? null,
      trades: input.trades ?? [],
      scope_of_work: input.scopeOfWork ?? null,
      submitted_at: input.submittedDate ?? new Date().toISOString(),
      permit_fee_cents: input.permitFeeCents ?? null,
      final_outcome: "pending" as IntelOutcome,
    });
  } catch {
    // Non-blocking — intelligence logging never fails a user submission.
  }
}

export async function logHoaIntelligence(input: {
  tenantId: string | null;
  hoaSubmittalId: string;
  community: string | null;
  city: string | null;
  projectType: string | null;
  homeownerName?: string | null;
}): Promise<void> {
  try {
    await I().insert({
      tenant_id: input.tenantId,
      source: "hoa" as IntelSource,
      hoa_submittal_id: input.hoaSubmittalId,
      municipality_slug: slugifyMunicipality(input.city),
      municipality_name: input.city,
      trades: input.projectType ? [input.projectType] : [],
      scope_of_work: input.projectType,
      submitted_at: new Date().toISOString(),
      hoa_community: input.community,
      homeowner_name: input.homeownerName ?? null,
      final_outcome: "pending" as IntelOutcome,
    });
  } catch {
    // no-op
  }
}

// ------------------------------------------------------------------
// Resolution: called by admin when a permit is approved / denied /
// corrections received. Updates the existing intelligence row.
// ------------------------------------------------------------------
export async function resolveIntelligenceForPermit(
  permitId: string,
  patch: {
    outcome?: IntelOutcome;
    firstResponseAt?: string | null;
    resolvedAt?: string | null;
    permitFeeCents?: number | null;
    notes?: string | null;
  },
): Promise<void> {
  const { data: existing } = await I().select("*").eq("permit_id", permitId).maybeSingle();
  const row = existing as IntelligenceRow | null;
  if (!row) return;

  const submitted = row.submitted_at ? new Date(row.submitted_at).getTime() : null;
  const firstRes = patch.firstResponseAt ? new Date(patch.firstResponseAt).getTime() : null;
  const resolved = patch.resolvedAt ? new Date(patch.resolvedAt).getTime() : null;
  const DAY = 1000 * 60 * 60 * 24;

  const update: Partial<IntelligenceRow> = {};
  if (patch.outcome) update.final_outcome = patch.outcome;
  if (patch.firstResponseAt !== undefined) update.first_response_at = patch.firstResponseAt;
  if (patch.resolvedAt !== undefined) update.resolved_at = patch.resolvedAt;
  if (patch.permitFeeCents !== undefined) update.permit_fee_cents = patch.permitFeeCents;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (submitted && firstRes) update.days_to_first_response = +((firstRes - submitted) / DAY).toFixed(1);
  if (submitted && resolved) update.days_to_resolution = +((resolved - submitted) / DAY).toFixed(1);

  await I().update(update).eq("id", row.id);
}

// ------------------------------------------------------------------
// Correction logging — feeds cross-tenant common-corrections pool
// ------------------------------------------------------------------
export async function logCorrection(input: {
  intelligenceId?: string | null;
  tenantId?: string | null;
  municipalityName: string;
  trade: string | null;
  correctionText: string;
  codeSection?: string | null;
  documentTypeFlagged?: string | null;
  reasonCategory?: string | null;
  source?: "municipality" | "hoa" | "private_provider";
}): Promise<CorrectionRow> {
  const slug = slugifyMunicipality(input.municipalityName);
  const { data, error } = await C()
    .insert({
      intelligence_id: input.intelligenceId ?? null,
      tenant_id: input.tenantId ?? null,
      municipality_slug: slug,
      municipality_name: input.municipalityName,
      trade: input.trade,
      correction_text: input.correctionText,
      code_section: input.codeSection ?? null,
      document_type_flagged: input.documentTypeFlagged ?? null,
      reason_category: input.reasonCategory ?? null,
      source: input.source ?? "municipality",
      occurrences: 1,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CorrectionRow;
}

// ------------------------------------------------------------------
// Read helpers used by the Victoria panel + Common Corrections tab
// ------------------------------------------------------------------
export async function getMunicipalityStats(slug: string): Promise<MunicipalityStats> {
  const { data, error } = await (supabase as any).rpc("intel_municipality_stats", { _slug: slug });
  if (error) return { sample_size: 0, avg_days_to_response: null, avg_days_to_resolution: null, avg_permit_fee_cents: null, approval_rate: null };
  const row = Array.isArray(data) ? data[0] : data;
  return (
    row ?? { sample_size: 0, avg_days_to_response: null, avg_days_to_resolution: null, avg_permit_fee_cents: null, approval_rate: null }
  );
}

export async function getCommonCorrections(slug: string, trade?: string | null, limit = 10): Promise<CorrectionRow[]> {
  const { data, error } = await (supabase as any).rpc("intel_common_corrections", {
    _slug: slug,
    _trade: trade ?? null,
    _limit: limit,
  });
  if (error) return [];
  return (data ?? []) as CorrectionRow[];
}

export async function getRecentCorrectionsFor(
  slug: string,
  trades: string[],
  limit = 5,
): Promise<CorrectionRow[]> {
  if (!slug) return [];
  let q = C().select("*").eq("municipality_slug", slug).order("last_seen_at", { ascending: false }).limit(limit);
  if (trades.length) q = q.in("trade", trades);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as CorrectionRow[];
}

// ------------------------------------------------------------------
// Trade-specific static advisory rules — surfaced by Victoria even
// before enough historical data exists in a jurisdiction.
// ------------------------------------------------------------------
export type ScopeFlag = {
  severity: "info" | "watch" | "critical";
  match: { trades?: string[]; counties?: string[]; municipalities?: string[] };
  message: string;
};

export const SCOPE_FLAGS: ScopeFlag[] = [
  {
    severity: "critical",
    match: { trades: ["Pool", "Spa", "Pool / Spa Construction"], counties: ["Palm Beach", "Martin", "St. Lucie", "Broward", "Miami-Dade"] },
    message: "Pool permits in HVHZ counties typically require signed & sealed structural drawings from a Florida PE.",
  },
  {
    severity: "watch",
    match: { trades: ["Electrical"] },
    message: "Broward and Miami-Dade require arc-fault protection documentation (2023 NEC adoption).",
  },
  {
    severity: "watch",
    match: { trades: ["Fence"] },
    message: "If fence is adjacent to a drainage easement, a notarized Removal Agreement is required by most PBC HOAs.",
  },
  {
    severity: "info",
    match: { trades: ["Plumbing"] },
    message: "Backflow preventer certification is a common Plumbing correction in Palm Beach County.",
  },
  {
    severity: "info",
    match: { trades: ["Structural", "Hardscape", "Addition"] },
    message: "Structural additions in HVHZ zones require wind-load calcs stamped by a Florida PE.",
  },
];

export function evaluateScopeFlags(trades: string[], municipality: { name?: string | null; county?: string | null } | null): ScopeFlag[] {
  const out: ScopeFlag[] = [];
  const tradeSet = new Set(trades.map((t) => t.toLowerCase()));
  for (const flag of SCOPE_FLAGS) {
    if (flag.match.trades && !flag.match.trades.some((t) => tradeSet.has(t.toLowerCase()))) continue;
    if (flag.match.counties && municipality?.county && !flag.match.counties.includes(municipality.county)) continue;
    if (flag.match.municipalities && municipality?.name && !flag.match.municipalities.includes(municipality.name)) continue;
    out.push(flag);
  }
  return out;
}
