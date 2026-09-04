// Permit / fee analytics used by /portal/reports. Isolated from reports-data.ts so
// the rules can load under tsx without the Supabase client.
//
// CSV quoting, turnaround averages, correction-rate buckets, and the "savings vs
// traditional overhead" formula all feed staff and GC-facing numbers — a silent
// change here would mis-report cycle time, hide correction-heavy cities, or
// inflate savings.

export type CountRow = { key: string; count: number };
export type MunicipalityMetric = { municipality: string; value: number; count: number };
export type OpenClosedRow = { month: string; open: number; closed: number };

export type ReportPermit = {
  id: string;
  project_name: string;
  municipality: string | null;
  county: string | null;
  city: string | null;
  permit_type: string | null;
  status: string;
  submitted_date: string | null;
  issued_date: string | null;
  actual_fee_cents: number | null;
  estimated_fee_cents: number | null;
  cleared_fee_cents: number;
  tenant_id: string | null;
  contractor_company: string | null;
};

export type GcCostSummary = {
  permitFeesCents: number;
  clearedFeesCents: number;
  savingsCents: number;
};

export const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const CLOSED_STATUSES = new Set(["approved", "permit_issued", "cancelled"]);

/** 9% of municipal fees plus $1,800 per project — the "do it yourself" overhead the savings chart compares against. */
export const TRADITIONAL_OVERHEAD_RATE = 0.09;
export const TRADITIONAL_OVERHEAD_PER_PROJECT_CENTS = 180_000;

export const DEMO_GC_NAME = "Your company";

export function csv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function monthKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return MONTH_ORDER[d.getMonth()] ?? null;
}

function sortByMonth(rows: CountRow[]): CountRow[] {
  return [...rows].sort((a, b) => MONTH_ORDER.indexOf(a.key) - MONTH_ORDER.indexOf(b.key));
}

function groupCount<T>(items: T[], keyFn: (t: T) => string | null): CountRow[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => ({ key, count }));
}

function placeOf(p: ReportPermit): string {
  return p.municipality || p.city || p.county || "Unknown";
}

function daysBetween(a: string, b: string): number | null {
  const start = new Date(a.slice(0, 10) + "T00:00:00").getTime();
  const end = new Date(b.slice(0, 10) + "T00:00:00").getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 86400000);
}

export function permitVolumeByMonth(permits: ReportPermit[]): CountRow[] {
  return sortByMonth(groupCount(permits, (p) => monthKey(p.submitted_date)));
}

export function permitVolumeByJurisdiction(permits: ReportPermit[]): CountRow[] {
  return groupCount(permits, (p) => (p.county ? `${p.county} County` : placeOf(p))).sort(
    (a, b) => b.count - a.count,
  );
}

export function permitVolumeByTradeType(permits: ReportPermit[]): CountRow[] {
  return groupCount(permits, (p) => p.permit_type || "Unspecified").sort((a, b) => b.count - a.count);
}

export function avgTurnaroundByMunicipality(permits: ReportPermit[]): MunicipalityMetric[] {
  const byCity = new Map<string, number[]>();
  for (const p of permits) {
    if (!p.submitted_date || !p.issued_date) continue;
    const days = daysBetween(p.submitted_date, p.issued_date);
    if (days == null) continue;
    const list = byCity.get(placeOf(p)) ?? [];
    list.push(days);
    byCity.set(placeOf(p), list);
  }
  return Array.from(byCity.entries())
    .map(([municipality, days]) => ({
      municipality,
      value: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      count: days.length,
    }))
    .sort((a, b) => b.value - a.value);
}

const CORRECTION_STATUSES = new Set([
  "corrections_required",
  "correction_response_under_review",
  "resubmitted",
  "resubmitted_to_county",
]);

function hitCorrection(status: string): boolean {
  return CORRECTION_STATUSES.has(status);
}

/** Correction-round distribution: % of permits that hit corrections_required (or related), by municipality. */
export function correctionRateByMunicipality(permits: ReportPermit[]): MunicipalityMetric[] {
  const byCity = new Map<string, { total: number; withCorrection: number }>();
  for (const p of permits) {
    const entry = byCity.get(placeOf(p)) ?? { total: 0, withCorrection: 0 };
    entry.total += 1;
    if (hitCorrection(p.status)) {
      entry.withCorrection += 1;
    }
    byCity.set(placeOf(p), entry);
  }
  return Array.from(byCity.entries())
    .map(([municipality, e]) => ({
      municipality,
      value: e.total ? Math.round((e.withCorrection / e.total) * 1000) / 10 : 0,
      count: e.total,
    }))
    .sort((a, b) => b.value - a.value);
}

/** Discrete correction-round buckets for distribution charts. */
export function correctionRoundDistribution(permits: ReportPermit[]): CountRow[] {
  let zero = 0;
  let onePlus = 0;
  for (const p of permits) {
    if (hitCorrection(p.status)) onePlus += 1;
    else zero += 1;
  }
  return [
    { key: "0 rounds", count: zero },
    { key: "1+ rounds", count: onePlus },
  ];
}

export function openVsClosedOverTime(permits: ReportPermit[]): OpenClosedRow[] {
  const months = MONTH_ORDER.filter((m) => permits.some((p) => monthKey(p.submitted_date) === m));
  let openCum = 0;
  let closedCum = 0;
  return months.map((m) => {
    const inMonth = permits.filter((p) => monthKey(p.submitted_date) === m);
    const closedInMonth = inMonth.filter((p) => CLOSED_STATUSES.has(p.status)).length;
    openCum += inMonth.length - closedInMonth;
    closedCum += closedInMonth;
    return { month: m, open: openCum, closed: closedCum };
  });
}

export function matchGcProjects(all: ReportPermit[], gcName: string): ReportPermit[] {
  const name = gcName.toLowerCase();
  return all.filter(
    (p) =>
      (p.contractor_company || "").toLowerCase().includes(name) ||
      p.project_name.toLowerCase().includes(name),
  );
}

export function gcPermitVolumeByMonth(projects: ReportPermit[]): CountRow[] {
  return permitVolumeByMonth(projects);
}

export function gcAvgCycleTimeDays(projects: ReportPermit[]): number {
  const days: number[] = [];
  for (const p of projects) {
    if (!p.submitted_date || !p.issued_date) continue;
    const d = daysBetween(p.submitted_date, p.issued_date);
    if (d != null) days.push(d);
  }
  if (!days.length) return 0;
  return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
}

export function platformAvgCycleTimeDays(permits: ReportPermit[]): number {
  return gcAvgCycleTimeDays(permits);
}

export function permitFeesCentsFrom(
  projects: Array<{ actual_fee_cents: number | null; estimated_fee_cents: number | null }>,
): number {
  let permitFeesCents = 0;
  for (const p of projects) {
    permitFeesCents += p.actual_fee_cents ?? p.estimated_fee_cents ?? 0;
  }
  return permitFeesCents;
}

export function traditionalOverheadCents(permitFeesCents: number, projectCount: number): number {
  return Math.round(permitFeesCents * TRADITIONAL_OVERHEAD_RATE) + projectCount * TRADITIONAL_OVERHEAD_PER_PROJECT_CENTS;
}

export function gcCostSummaryFrom(projects: ReportPermit[], clearedFeesCents: number): GcCostSummary {
  const permitFeesCents = permitFeesCentsFrom(projects);
  const savingsCents = Math.max(0, traditionalOverheadCents(permitFeesCents, projects.length) - clearedFeesCents);
  return { permitFeesCents, clearedFeesCents, savingsCents };
}
