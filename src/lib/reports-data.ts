// Deterministic analytics derived from PROJECTS — powers /portal/reports.
// All money in cents. All randomness is seeded so numbers are stable across renders.

import { PROJECTS, type Project } from "./projects-data";

function seeded(n: number, min: number, max: number) {
  const x = Math.sin(n * 7919.31) * 10000;
  const frac = x - Math.floor(x);
  return min + Math.abs(frac) * (max - min);
}

const MONTH_ORDER = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthOf(dateStr: string): string {
  return dateStr.split(" ")[0] ?? "—";
}

const CLOSED_STATUSES = new Set(["approved", "permit_issued", "cancelled"]);

// ---------- CSV helper ----------
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

// ---------- Internal: Permit Volume ----------
export type CountRow = { key: string; count: number };

function sortByMonth(rows: CountRow[]): CountRow[] {
  return [...rows].sort((a, b) => MONTH_ORDER.indexOf(a.key) - MONTH_ORDER.indexOf(b.key));
}

function groupCount<T>(items: T[], keyFn: (t: T) => string): CountRow[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => ({ key, count }));
}

export function permitVolumeByMonth(): CountRow[] {
  return sortByMonth(groupCount(PROJECTS, (p) => monthOf(p.submitted_at)));
}

export function permitVolumeByJurisdiction(): CountRow[] {
  return groupCount(PROJECTS, (p) => `${p.county} County`).sort((a, b) => b.count - a.count);
}

export function permitVolumeByTradeType(): CountRow[] {
  const rows: { key: string }[] = [];
  for (const p of PROJECTS) for (const t of p.permit_types) rows.push({ key: t });
  return groupCount(rows, (r) => r.key).sort((a, b) => b.count - a.count);
}

// ---------- Internal: Turnaround time ----------
export type MunicipalityMetric = { municipality: string; value: number; count: number };

export function avgTurnaroundByMunicipality(): MunicipalityMetric[] {
  const byCity = new Map<string, number[]>();
  for (const p of PROJECTS) {
    const days = Math.round(seeded(Number(p.id), 9, 46));
    const list = byCity.get(p.city) ?? [];
    list.push(days);
    byCity.set(p.city, list);
  }
  return Array.from(byCity.entries())
    .map(([municipality, days]) => ({
      municipality,
      value: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
      count: days.length,
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------- Internal: Correction rate ----------
export function correctionRateByMunicipality(): MunicipalityMetric[] {
  const byCity = new Map<string, { total: number; withCorrection: number }>();
  for (const p of PROJECTS) {
    const entry = byCity.get(p.city) ?? { total: 0, withCorrection: 0 };
    entry.total += 1;
    const hasCorrection = seeded(Number(p.id) + 101, 0, 1) < 0.32 || p.status === "corrections_required";
    if (hasCorrection) entry.withCorrection += 1;
    byCity.set(p.city, entry);
  }
  return Array.from(byCity.entries())
    .map(([municipality, e]) => ({
      municipality,
      value: Math.round((e.withCorrection / e.total) * 1000) / 10,
      count: e.total,
    }))
    .sort((a, b) => b.value - a.value);
}

// ---------- Internal: Fee summary ----------
export type FeeMonthRow = { month: string; permitFeesCents: number; clearedRevenueCents: number };

const PER_PROJECT_FEE_CENTS = 45_000; // Cléared flat fee per project
const TX_FEE_RATE = 0.029; // transaction fee on permit fees

export function permitFeeCentsFor(p: Project): number {
  // Deterministic permit fee ~ 1.6%-2.4% of construction value.
  const rate = seeded(Number(p.id) + 7, 0.016, 0.024);
  return Math.round(p.value_cents * rate);
}

export function clearedRevenueCentsFor(p: Project): number {
  const permitFee = permitFeeCentsFor(p);
  return PER_PROJECT_FEE_CENTS + Math.round(permitFee * TX_FEE_RATE);
}

export function feeSummaryByMonth(): FeeMonthRow[] {
  const map = new Map<string, FeeMonthRow>();
  for (const p of PROJECTS) {
    const month = monthOf(p.submitted_at);
    const row = map.get(month) ?? { month, permitFeesCents: 0, clearedRevenueCents: 0 };
    row.permitFeesCents += permitFeeCentsFor(p);
    row.clearedRevenueCents += clearedRevenueCentsFor(p);
    map.set(month, row);
  }
  return Array.from(map.values()).sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
}

// ---------- Internal: Open vs closed over time ----------
export type OpenClosedRow = { month: string; open: number; closed: number };

export function openVsClosedOverTime(): OpenClosedRow[] {
  const months = MONTH_ORDER.filter((m) => PROJECTS.some((p) => monthOf(p.submitted_at) === m));
  let openCum = 0;
  let closedCum = 0;
  return months.map((m) => {
    const inMonth = PROJECTS.filter((p) => monthOf(p.submitted_at) === m);
    const closedInMonth = inMonth.filter((p) => CLOSED_STATUSES.has(p.status)).length;
    openCum += inMonth.length - closedInMonth;
    closedCum += closedInMonth;
    return { month: m, open: openCum, closed: closedCum };
  });
}

// ---------- GC-facing reports ----------
export const DEMO_GC_NAME = "Coastline Builders Group";

/** Projects attributed to a GC — real client match, else a deterministic demo slice. */
export function projectsForGc(gcName: string | null | undefined): { name: string; projects: Project[] } {
  const name = gcName?.trim();
  if (name) {
    const matches = PROJECTS.filter((p) => p.client.toLowerCase().includes(name.toLowerCase()));
    if (matches.length > 0) return { name, projects: matches };
  }
  // Demo fallback: deterministic subset (roughly every 3rd project) attributed to the demo GC.
  const demo = PROJECTS.filter((p) => Number(p.id) % 3 === 0);
  return { name: DEMO_GC_NAME, projects: demo.length ? demo : PROJECTS.slice(0, 6) };
}

export function gcPermitVolumeByMonth(projects: Project[]): CountRow[] {
  return sortByMonth(groupCount(projects, (p) => monthOf(p.submitted_at)));
}

export function gcAvgCycleTimeDays(projects: Project[]): number {
  if (!projects.length) return 0;
  const days = projects.map((p) => Math.round(seeded(Number(p.id), 9, 46)));
  return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
}

export function platformAvgCycleTimeDays(): number {
  const all = avgTurnaroundByMunicipality();
  const totalDays = all.reduce((sum, m) => sum + m.value * m.count, 0);
  const totalCount = all.reduce((sum, m) => sum + m.count, 0);
  return totalCount ? Math.round(totalDays / totalCount) : 0;
}

export type GcCostSummary = {
  permitFeesCents: number;
  clearedFeesCents: number;
  savingsCents: number;
};

export function gcCostSummary(projects: Project[]): GcCostSummary {
  let permitFeesCents = 0;
  let clearedFeesCents = 0;
  for (const p of projects) {
    permitFeesCents += permitFeeCentsFor(p);
    clearedFeesCents += clearedRevenueCentsFor(p);
  }
  // Savings modeled vs. traditional GC self-permitting overhead (~9% of permit fees in staff time
  // and delay carrying costs) net of what they pay Cléared.
  const traditionalOverheadCents = Math.round(permitFeesCents * 0.09) + projects.length * 180_000;
  const savingsCents = Math.max(0, traditionalOverheadCents - clearedFeesCents);
  return { permitFeesCents, clearedFeesCents, savingsCents };
}

export function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
