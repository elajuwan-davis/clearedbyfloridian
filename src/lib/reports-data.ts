// Analytics from live permits / inspections / service_fee_invoices — powers /portal/reports.

import { supabase } from "@/integrations/supabase/client";

export type CountRow = { key: string; count: number };
export type MunicipalityMetric = { municipality: string; value: number; count: number };
export type FeeMonthRow = { month: string; permitFeesCents: number; clearedRevenueCents: number };
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

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CLOSED_STATUSES = new Set(["approved", "permit_issued", "cancelled"]);

export function csv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = csv(headers, rows);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function monthKey(dateStr: string | null | undefined): string | null {
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

export async function fetchReportPermits(): Promise<ReportPermit[]> {
  const { data, error } = await (supabase.from("permits" as any) as any)
    .select(
      "id, project_name, municipality, county, city, permit_type, status, submitted_date, issued_date, actual_fee_cents, estimated_fee_cents, cleared_fee_cents, tenant_id, contractor_company",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ReportPermit[];
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

/** Correction-round distribution: % of permits that hit corrections_required (or related), by municipality. */
export function correctionRateByMunicipality(permits: ReportPermit[]): MunicipalityMetric[] {
  const byCity = new Map<string, { total: number; withCorrection: number }>();
  for (const p of permits) {
    const entry = byCity.get(placeOf(p)) ?? { total: 0, withCorrection: 0 };
    entry.total += 1;
    if (
      p.status === "corrections_required" ||
      p.status === "correction_response_under_review" ||
      p.status === "resubmitted" ||
      p.status === "resubmitted_to_county"
    ) {
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
    const hit =
      p.status === "corrections_required" ||
      p.status === "correction_response_under_review" ||
      p.status === "resubmitted" ||
      p.status === "resubmitted_to_county";
    if (hit) onePlus += 1;
    else zero += 1;
  }
  return [
    { key: "0 rounds", count: zero },
    { key: "1+ rounds", count: onePlus },
  ];
}

export async function feeSummaryByMonth(): Promise<FeeMonthRow[]> {
  const { data: invoices } = await (supabase.from("service_fee_invoices" as any) as any)
    .select("fee_cents, processing_fee_cents, status, paid_at, created_at, project_value_cents");
  const { data: permits } = await (supabase.from("permits" as any) as any)
    .select("submitted_date, actual_fee_cents, estimated_fee_cents");

  const map = new Map<string, FeeMonthRow>();

  for (const inv of (invoices ?? []) as Array<{
    fee_cents: number;
    processing_fee_cents: number;
    status: string;
    paid_at: string | null;
    created_at: string | null;
  }>) {
    const month = monthKey(inv.paid_at || inv.created_at);
    if (!month) continue;
    const row = map.get(month) ?? { month, permitFeesCents: 0, clearedRevenueCents: 0 };
    row.clearedRevenueCents += (inv.fee_cents ?? 0) + (inv.processing_fee_cents ?? 0);
    map.set(month, row);
  }

  for (const p of (permits ?? []) as Array<{
    submitted_date: string | null;
    actual_fee_cents: number | null;
    estimated_fee_cents: number | null;
  }>) {
    const month = monthKey(p.submitted_date);
    if (!month) continue;
    const fee = p.actual_fee_cents ?? p.estimated_fee_cents ?? 0;
    const row = map.get(month) ?? { month, permitFeesCents: 0, clearedRevenueCents: 0 };
    row.permitFeesCents += fee;
    map.set(month, row);
  }

  return Array.from(map.values()).sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
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

export const DEMO_GC_NAME = "Your company";

export async function projectsForGc(
  gcName: string | null | undefined,
): Promise<{ name: string; projects: ReportPermit[] }> {
  const all = await fetchReportPermits();
  const name = gcName?.trim();
  if (name) {
    const matches = all.filter(
      (p) =>
        (p.contractor_company || "").toLowerCase().includes(name.toLowerCase()) ||
        p.project_name.toLowerCase().includes(name.toLowerCase()),
    );
    if (matches.length > 0) return { name, projects: matches };
  }
  return { name: name || DEMO_GC_NAME, projects: all };
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

export type GcCostSummary = {
  permitFeesCents: number;
  clearedFeesCents: number;
  savingsCents: number;
};

export async function gcCostSummary(projects: ReportPermit[]): Promise<GcCostSummary> {
  let permitFeesCents = 0;
  for (const p of projects) {
    permitFeesCents += p.actual_fee_cents ?? p.estimated_fee_cents ?? 0;
  }

  const ids = projects.map((p) => p.id);
  let clearedFeesCents = 0;
  if (ids.length) {
    const { data } = await (supabase.from("service_fee_invoices" as any) as any)
      .select("fee_cents, processing_fee_cents, permit_id")
      .in("permit_id", ids);
    for (const inv of (data ?? []) as Array<{ fee_cents: number; processing_fee_cents: number }>) {
      clearedFeesCents += (inv.fee_cents ?? 0) + (inv.processing_fee_cents ?? 0);
    }
  }

  const traditionalOverheadCents = Math.round(permitFeesCents * 0.09) + projects.length * 180_000;
  const savingsCents = Math.max(0, traditionalOverheadCents - clearedFeesCents);
  return { permitFeesCents, clearedFeesCents, savingsCents };
}
