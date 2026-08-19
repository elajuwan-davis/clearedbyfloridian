// Unified deadline model — derived from real permit / inspection / invoice / NTO dates.

import { supabase } from "@/integrations/supabase/client";
import { CLEARED_STAFF } from "@/lib/staff-ops";
import { isInternalUser } from "@/lib/is-internal-user";

export type DeadlineKind =
  | "permit_expiration"
  | "inspection"
  | "correction_response"
  | "fee_due"
  | "ntbo_filing";

export type DeadlineColor = "red" | "blue" | "amber" | "green" | "grey";

export type Deadline = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  kind: DeadlineKind;
  projectId: string;
  projectName: string;
  description: string;
  assignedStaff: string;
  tab: string;
};

export const DEADLINE_KIND_META: Record<
  DeadlineKind,
  { label: string; color: DeadlineColor; tab: string }
> = {
  permit_expiration: { label: "Permit expiration", color: "red", tab: "overview" },
  inspection: { label: "Inspection", color: "blue", tab: "inspections" },
  correction_response: { label: "Correction response", color: "amber", tab: "revisions" },
  fee_due: { label: "Fee due", color: "green", tab: "fees" },
  ntbo_filing: { label: "NTBO filing", color: "grey", tab: "compliance" },
};

export const DEADLINE_COLOR_CLASSES: Record<
  DeadlineColor,
  { dot: string; badge: string; chip: string }
> = {
  red: {
    dot: "bg-[#C23B2E]",
    badge: "bg-[#C23B2E]/10 text-[#C23B2E] border-[#C23B2E]/25",
    chip: "bg-[#C23B2E]/10 text-[#C23B2E] border-[#C23B2E]/20",
  },
  blue: {
    dot: "bg-[var(--sky)]",
    badge: "bg-[var(--sky)]/10 text-[var(--sky)] border-[var(--sky)]/25",
    chip: "bg-[var(--sky)]/10 text-[var(--sky)] border-[var(--sky)]/20",
  },
  amber: {
    dot: "bg-[var(--amber)]",
    badge: "bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/25",
    chip: "bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/20",
  },
  green: {
    dot: "bg-[var(--green)]",
    badge: "bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/25",
    chip: "bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20",
  },
  grey: {
    dot: "bg-obsidian/70",
    badge: "bg-obsidian/8 text-obsidian border-obsidian/20",
    chip: "bg-obsidian/8 text-obsidian border-obsidian/20",
  },
};

export type DeadlineScope = "staff" | "gc";

function currentScope(): DeadlineScope {
  return isInternalUser() ? "staff" : "gc";
}

function toDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function addDaysIso(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function staffFor(permitId: string): string {
  let h = 0;
  for (let i = 0; i < permitId.length; i++) h = (h * 31 + permitId.charCodeAt(i)) | 0;
  const s = CLEARED_STAFF[Math.abs(h) % CLEARED_STAFF.length];
  return s?.name ?? "Staff";
}

type PermitSnap = {
  id: string;
  project_name: string;
  status: string;
  expiration_date: string | null;
  updated_at: string;
  permit_number: string | null;
};

export async function listDeadlines(opts?: { scope?: DeadlineScope }): Promise<Deadline[]> {
  const scope = opts?.scope ?? currentScope();
  const out: Deadline[] = [];

  const { data: permits } = await (supabase.from("permits" as any) as any)
    .select("id, project_name, status, expiration_date, updated_at, permit_number")
    .neq("status", "cancelled");
  const permitList = (permits ?? []) as PermitSnap[];
  const byId = new Map(permitList.map((p) => [p.id, p]));

  for (const p of permitList) {
    const exp = toDay(p.expiration_date);
    if (exp) {
      out.push({
        id: `exp-${p.id}`,
        date: exp,
        kind: "permit_expiration",
        projectId: p.id,
        projectName: p.project_name,
        description: `Permit ${p.permit_number || p.id.slice(0, 8)} expires without an active inspection (FBC 105.4.1)`,
        assignedStaff: staffFor(p.id),
        tab: DEADLINE_KIND_META.permit_expiration.tab,
      });
    }
    if (p.status === "corrections_required") {
      const base = toDay(p.updated_at) ?? new Date().toISOString().slice(0, 10);
      out.push({
        id: `corr-${p.id}`,
        date: addDaysIso(base, 10),
        kind: "correction_response",
        projectId: p.id,
        projectName: p.project_name,
        description: "Response due to plan reviewer comments",
        assignedStaff: staffFor(p.id),
        tab: DEADLINE_KIND_META.correction_response.tab,
      });
    }
  }

  const { data: inspections } = await (supabase.from("permit_inspections" as any) as any)
    .select("id, permit_id, inspection_type, scheduled_date, requested_date, result");
  for (const row of (inspections ?? []) as Array<{
    id: string;
    permit_id: string;
    inspection_type: string;
    scheduled_date: string | null;
    requested_date: string | null;
    result: string | null;
  }>) {
    if (row.result && row.result !== "pending" && row.result !== "scheduled") continue;
    const date = toDay(row.scheduled_date) || toDay(row.requested_date);
    if (!date) continue;
    const p = byId.get(row.permit_id);
    if (!p) continue;
    out.push({
      id: `insp-${row.id}`,
      date,
      kind: "inspection",
      projectId: p.id,
      projectName: p.project_name,
      description: `${row.inspection_type} inspection scheduled`,
      assignedStaff: staffFor(p.id),
      tab: DEADLINE_KIND_META.inspection.tab,
    });
  }

  const { data: invoices } = await (supabase.from("service_fee_invoices" as any) as any)
    .select("id, permit_id, status, paid_at, created_at")
    .neq("status", "paid");
  for (const inv of (invoices ?? []) as Array<{
    id: string;
    permit_id: string;
    status: string;
    paid_at: string | null;
    created_at: string | null;
  }>) {
    if (inv.paid_at) continue;
    const created = toDay(inv.created_at);
    if (!created) continue;
    const p = byId.get(inv.permit_id);
    if (!p) continue;
    out.push({
      id: `fee-${inv.id}`,
      date: addDaysIso(created, 14),
      kind: "fee_due",
      projectId: p.id,
      projectName: p.project_name,
      description: "Outstanding service fee balance due",
      assignedStaff: staffFor(p.id),
      tab: DEADLINE_KIND_META.fee_due.tab,
    });
  }

  const { data: ntos } = await (supabase.from("nto_filings" as any) as any)
    .select("id, permit_id, status, first_work_date, sent_at");
  for (const n of (ntos ?? []) as Array<{
    id: string;
    permit_id: string;
    status: string;
    first_work_date: string | null;
    sent_at: string | null;
  }>) {
    if (n.sent_at || n.status === "filed" || n.status === "sent") continue;
    const date = toDay(n.first_work_date);
    if (!date) continue;
    const p = byId.get(n.permit_id);
    if (!p) continue;
    out.push({
      id: `nto-${n.id}`,
      date,
      kind: "ntbo_filing",
      projectId: p.id,
      projectName: p.project_name,
      description: "Notice to Building Official filing due",
      assignedStaff: staffFor(p.id),
      tab: DEADLINE_KIND_META.ntbo_filing.tab,
    });
  }

  out.sort((a, b) => a.date.localeCompare(b.date));

  // RLS already scopes GC tenants; staff sees all. Keep scope hook for callers.
  void scope;
  return out;
}
