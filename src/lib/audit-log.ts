// Append-only mock audit trail — localStorage-backed, no edit/delete API.
import { PROJECTS } from "./projects-data";

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
  | "escalation.cleared";

export type AuditEvent = {
  id: string;
  ts: string; // ISO
  actor: string;
  action: AuditAction;
  projectId?: string;
  record: string; // human-readable affected record label
  details?: string;
};

const KEY = "cleared.auditLog.v1";
const SEED_FLAG = "cleared.auditLog.seeded.v1";

function read(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
  } catch {
    return [];
  }
}

function write(list: AuditEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("audit-log:changed"));
}

export function logAudit(
  actor: string,
  action: AuditAction,
  opts: { projectId?: string; record: string; details?: string },
): AuditEvent {
  const evt: AuditEvent = {
    id: Math.random().toString(36).slice(2, 10),
    ts: new Date().toISOString(),
    actor,
    action,
    projectId: opts.projectId,
    record: opts.record,
    details: opts.details,
  };
  write([evt, ...read()]);
  return evt;
}

export function listAudit(): AuditEvent[] {
  ensureSeeded();
  return read().sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

function seededHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const ACTORS = ["Elajuwan Wallace", "Eman Youssef", "Jose Ramirez", "Paul Sifford", "System (Auto-Sync)"];
const HIST_ACTIONS: AuditAction[] = [
  "project.created",
  "document.uploaded",
  "fee.added",
  "fee.authorized",
  "inspection.requested",
  "message.sent",
  "permit.submitted",
];

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  const backfill: AuditEvent[] = [];
  PROJECTS.forEach((p, idx) => {
    const n = HIST_ACTIONS.length;
    const count = 2 + (seededHash(p.id) % 3); // 2-4 historical events per project
    for (let i = 0; i < count; i++) {
      const action = HIST_ACTIONS[(seededHash(p.id + i) ) % n];
      const daysAgo = 3 + ((seededHash(p.id + "d" + i)) % 60);
      const ts = new Date(Date.now() - daysAgo * 86400000 - i * 3600000).toISOString();
      const actor = ACTORS[(seededHash(p.id + "a" + i)) % ACTORS.length];
      backfill.push({
        id: `seed-${p.id}-${i}`,
        ts,
        actor,
        action,
        projectId: p.id,
        record: p.name,
        details: actionDetail(action, p.name),
      });
    }
  });
  write([...backfill, ...read()]);
  window.localStorage.setItem(SEED_FLAG, "1");
}

function actionDetail(action: AuditAction, projectName: string): string {
  switch (action) {
    case "project.created": return `Project record opened for ${projectName}`;
    case "document.uploaded": return "Stamped plans uploaded";
    case "fee.added": return "Permit fee line item added";
    case "fee.authorized": return "Fee authorized for payment";
    case "inspection.requested": return "Inspection requested with municipality";
    case "message.sent": return "Status update sent to GC";
    case "permit.submitted": return "Permit application submitted to jurisdiction";
    default: return "";
  }
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
