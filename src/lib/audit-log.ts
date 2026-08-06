// Append-only audit trail backed by public.activity_events.
import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "project.created"
  | "project.status_changed"
  | "project.deleted"
  | "document.uploaded"
  | "document.downloaded"
  | "document.deleted"
  | "fee.added"
  | "fee.authorized"
  | "fee.paid"
  | "message.sent"
  | "inspection.requested"
  | "inspection.scheduled"
  | "inspection.result"
  | "ntbo.filed"
  | "permit.submitted"
  | "permit.issued"
  | "user.login"
  | "user.logout"
  | "staff.assigned"
  | "escalation.set"
  | "escalation.cleared"
  | string;

export type AuditEvent = {
  id: string;
  ts: string;
  actor: string;
  action: AuditAction;
  projectId?: string;
  record: string;
  details?: string;
};

const EVT = "audit-log:changed";

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

type ActivityRow = {
  id: string;
  created_at: string;
  actor_label: string | null;
  event_type: string;
  permit_id: string | null;
  summary: string | null;
  details: Record<string, unknown> | null;
};

function mapRow(row: ActivityRow): AuditEvent {
  const detailText =
    typeof row.details?.message === "string"
      ? row.details.message
      : typeof row.details?.details === "string"
        ? row.details.details
        : undefined;
  return {
    id: row.id,
    ts: row.created_at,
    actor: row.actor_label || "Unknown",
    action: row.event_type,
    projectId: row.permit_id ?? undefined,
    record: row.summary || row.event_type,
    details: detailText,
  };
}

function isUuid(s: string | undefined): s is string {
  return !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function logAudit(
  actor: string,
  action: AuditAction,
  opts: { projectId?: string; record: string; details?: string; tenantId?: string | null },
): Promise<AuditEvent | null> {
  const { data: auth } = await supabase.auth.getUser();
  const insert = {
    event_type: action,
    actor_label: actor,
    actor_id: auth?.user?.id ?? null,
    permit_id: isUuid(opts.projectId) ? opts.projectId : null,
    tenant_id: opts.tenantId ?? null,
    summary: opts.record,
    details: opts.details ? { details: opts.details } : {},
  };
  const { data, error } = await (supabase.from("activity_events" as any) as any)
    .insert(insert)
    .select("id, created_at, actor_label, event_type, permit_id, summary, details")
    .single();
  if (error || !data) {
    console.error("[audit] insert failed", error?.message);
    return null;
  }
  notifyChanged();
  return mapRow(data as ActivityRow);
}

export async function listAudit(opts?: { permitId?: string; limit?: number }): Promise<AuditEvent[]> {
  let q = (supabase.from("activity_events" as any) as any)
    .select("id, created_at, actor_label, event_type, permit_id, summary, details")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);
  if (opts?.permitId) q = q.eq("permit_id", opts.permitId);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as ActivityRow[]).map(mapRow);
}

export function toCsv(events: AuditEvent[]): string {
  const header = ["Timestamp", "Actor", "Action", "Project", "Record", "Details"];
  const rows = events.map((e) => [
    e.ts,
    e.actor,
    e.action,
    e.projectId ?? "",
    e.record,
    e.details ?? "",
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
