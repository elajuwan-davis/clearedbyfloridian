import { supabase } from "@/integrations/supabase/client";

export type AlertKind =
  | "stale_permit"
  | "new_municipality_requirement"
  | "correction_deadline"
  | "lien_release_reminder"
  | "inspection_upcoming"
  | "co_issued"
  | "other";

export type AlertSeverity = "info" | "warning" | "critical" | "success";

export type VictoriaAlert = {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  permit_id: string | null;
  kind: AlertKind | string;
  severity: AlertSeverity;
  title: string;
  body: string | null;
  action_url: string | null;
  dedupe_key: string | null;
  acknowledged_at: string | null;
  created_at: string;
};

export const ALERT_KIND_LABEL: Record<string, string> = {
  stale_permit: "Stale Permit",
  new_municipality_requirement: "New Requirement",
  correction_deadline: "Correction Deadline",
  lien_release_reminder: "Lien Release",
  inspection_upcoming: "Upcoming Inspection",
  co_issued: "CO Issued",
  other: "Notice",
};

export async function listAlerts(opts?: { permitId?: string; kind?: string; limit?: number }): Promise<VictoriaAlert[]> {
  let q: any = supabase.from("victoria_alerts" as any).select("*").order("created_at", { ascending: false });
  if (opts?.permitId) q = q.eq("permit_id", opts.permitId);
  if (opts?.kind) q = q.eq("kind", opts.kind);
  q = q.limit(opts?.limit ?? 200);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown) as VictoriaAlert[];
}

export async function unreadAlertCount(): Promise<number> {
  const { count } = await supabase
    .from("victoria_alerts" as any)
    .select("*", { count: "exact", head: true })
    .is("acknowledged_at", null);
  return count ?? 0;
}

export async function acknowledgeAlert(id: string): Promise<void> {
  await supabase.from("victoria_alerts" as any).update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
}

export async function acknowledgeAllAlerts(): Promise<void> {
  await supabase.from("victoria_alerts" as any).update({ acknowledged_at: new Date().toISOString() }).is("acknowledged_at", null);
}

export type AlertInsert = {
  tenant_id: string | null;
  user_id?: string | null;
  permit_id?: string | null;
  kind: AlertKind;
  severity?: AlertSeverity;
  title: string;
  body?: string;
  action_url?: string;
  dedupe_key?: string;
};

export async function createAlert(a: AlertInsert): Promise<void> {
  await supabase.from("victoria_alerts" as any).insert({
    tenant_id: a.tenant_id,
    user_id: a.user_id ?? null,
    permit_id: a.permit_id ?? null,
    kind: a.kind,
    severity: a.severity ?? "info",
    title: a.title,
    body: a.body ?? null,
    action_url: a.action_url ?? null,
    dedupe_key: a.dedupe_key ?? null,
  });
  // Best-effort silent — a duplicate dedupe_key raises a unique-violation; that's expected.
}

export function severityBadge(s: AlertSeverity): { className: string; dot: string } {
  switch (s) {
    case "critical": return { className: "border-red-500/40 bg-red-50 text-red-900", dot: "bg-red-600" };
    case "warning": return { className: "border-amber-500/40 bg-amber-50 text-amber-900", dot: "bg-amber-600" };
    case "success": return { className: "border-emerald-600/40 bg-emerald-50 text-emerald-900", dot: "bg-emerald-600" };
    default: return { className: "border-obsidian/20 bg-obsidian/5 text-obsidian/80", dot: "bg-obsidian/60" };
  }
}
