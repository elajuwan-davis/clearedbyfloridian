import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { listAudit, type AuditEvent } from "@/lib/audit-log";
import type { Project } from "@/lib/projects-data";

const ACTION_LABEL: Record<string, string> = {
  "project.created": "Project Created",
  "project.status_changed": "Status Changed",
  "project.deleted": "Project Deleted",
  "document.uploaded": "Document Uploaded",
  "document.downloaded": "Document Downloaded",
  "document.deleted": "Document Deleted",
  "fee.added": "Fee Added",
  "fee.authorized": "Fee Authorized",
  "fee.paid": "Fee Paid",
  "message.sent": "Message Sent",
  "inspection.requested": "Inspection Requested",
  "inspection.scheduled": "Inspection Scheduled",
  "inspection.result": "Inspection Result",
  "ntbo.filed": "NTBO Filed",
  "permit.submitted": "Permit Submitted",
  "permit.issued": "Permit Issued",
  "user.login": "User Login",
  "user.logout": "User Logout",
  "staff.assigned": "Staff Assigned",
  "escalation.set": "Escalated",
  "escalation.cleared": "Escalation Cleared",
};

function actionTone(action: string): string {
  if (action.startsWith("escalation.set")) return "border-red-500/40 bg-red-50 text-red-800";
  if (action.includes("deleted")) return "border-red-500/30 bg-red-50 text-red-700";
  if (action.includes("issued") || action.includes("paid")) return "border-emerald-600/40 bg-emerald-50 text-emerald-800";
  return "border-obsidian/15 bg-paper-warm text-obsidian/70";
}

export function ProjectAuditTab({ project }: { project: Project }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const refresh = () => setEvents(listAudit().filter((e) => e.projectId === project.id));
    refresh();
    window.addEventListener("audit-log:changed", refresh);
    return () => window.removeEventListener("audit-log:changed", refresh);
  }, [project.id]);

  return (
    <div className="border border-obsidian/12 bg-white rounded-[3px]">
      <div className="flex items-center gap-2 border-b border-obsidian/10 bg-paper-warm px-4 py-2.5">
        <History className="h-3.5 w-3.5 text-obsidian/60" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">Activity — Read Only</span>
      </div>
      {events.length === 0 ? (
        <div className="p-8 text-center text-sm text-obsidian/45">No activity recorded for this project yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <ul className="divide-y divide-obsidian/10">
            {events.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-[3px] ${actionTone(e.action)}`}>
                    {ACTION_LABEL[e.action] ?? e.action}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian/45">
                    {new Date(e.ts).toLocaleString()}
                  </span>
                </div>
                {e.details && <p className="mt-1.5 text-sm text-obsidian/80">{e.details}</p>}
                <div className="mt-1 text-xs text-obsidian/50">{e.actor}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
