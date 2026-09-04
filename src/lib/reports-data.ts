// Analytics from live permits / inspections / service_fee_invoices — powers /portal/reports.

import { supabase } from "@/integrations/supabase/client";
import {
  csv,
  DEMO_GC_NAME,
  gcCostSummaryFrom,
  matchGcProjects,
  monthKey,
  MONTH_ORDER,
  type GcCostSummary,
  type ReportPermit,
} from "./reports-aggregations";

export type { CountRow, MunicipalityMetric, OpenClosedRow, ReportPermit, GcCostSummary } from "./reports-aggregations";
export {
  csv,
  fmtMoney,
  permitVolumeByMonth,
  permitVolumeByJurisdiction,
  permitVolumeByTradeType,
  avgTurnaroundByMunicipality,
  correctionRateByMunicipality,
  correctionRoundDistribution,
  openVsClosedOverTime,
  gcPermitVolumeByMonth,
  gcAvgCycleTimeDays,
  platformAvgCycleTimeDays,
  DEMO_GC_NAME,
} from "./reports-aggregations";

export type FeeMonthRow = { month: string; permitFeesCents: number; clearedRevenueCents: number };

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

export async function fetchReportPermits(): Promise<ReportPermit[]> {
  const { data, error } = await (supabase.from("permits" as any) as any)
    .select(
      "id, project_name, municipality, county, city, permit_type, status, submitted_date, issued_date, actual_fee_cents, estimated_fee_cents, cleared_fee_cents, tenant_id, contractor_company",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as ReportPermit[];
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

export async function projectsForGc(
  gcName: string | null | undefined,
): Promise<{ name: string; projects: ReportPermit[] }> {
  const all = await fetchReportPermits();
  const name = gcName?.trim();
  if (name) {
    const matches = matchGcProjects(all, name);
    if (matches.length > 0) return { name, projects: matches };
  }
  return { name: name || DEMO_GC_NAME, projects: all };
}

export async function gcCostSummary(projects: ReportPermit[]): Promise<GcCostSummary> {
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

  return gcCostSummaryFrom(projects, clearedFeesCents);
}
