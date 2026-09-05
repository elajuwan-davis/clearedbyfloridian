import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, FileCheck2, HardHat } from "lucide-react";
import { PageShell, StatTile, StatusChip, TableShell, EmptyState } from "@/components/ui-kit";
import { AdminOnly } from "@/components/admin-only";
import { PROJECTS } from "@/lib/projects-data";
import {
  LIEN_DEADLINES,
  MILESTONE_RULE,
  daysRemaining,
  deadlineStatus,
  listERecordRequests,
  type DeadlineStatus,
} from "@/lib/lien-rights-store";
import {
  COMPLIANCE_SERVICES,
  listComplianceRequests,
  setComplianceRequestStatus,
  type ComplianceRequest,
  type ComplianceRequestStatus,
} from "@/lib/compliance-requests";

export const Route = createFileRoute("/admin/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance Queue — Cleard Admin" },
      { name: "description", content: "Internal compliance deadlines and document workflows." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AdminCompliancePage />
    </AdminOnly>
  ),
});

const deadlineTone: Record<DeadlineStatus, "success" | "warning" | "danger" | "neutral"> = {
  "On Track": "success",
  "Due Soon": "warning",
  Overdue: "danger",
  Complete: "neutral",
};

const requestTone: Record<ComplianceRequestStatus, "warning" | "info" | "success"> = {
  Pending: "warning",
  "In Progress": "info",
  Complete: "success",
};

const NEXT_STATUS: Record<ComplianceRequestStatus, ComplianceRequestStatus | null> = {
  Pending: "In Progress",
  "In Progress": "Complete",
  Complete: null,
};

function AdminCompliancePage() {
  const [requests, setRequests] = useState<ComplianceRequest[]>([]);

  useEffect(() => {
    setRequests(listComplianceRequests());
  }, []);

  const deadlines = useMemo(
    () => [...LIEN_DEADLINES].sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [],
  );

  const overdue = deadlines.filter((d) => deadlineStatus(d) === "Overdue").length;
  const dueThisWeek = deadlines.filter((d) => {
    const days = daysRemaining(d.deadline);
    return deadlineStatus(d) !== "Complete" && days >= 0 && days <= 7;
  }).length;
  const recorded = listERecordRequests().filter((r) => r.status === "Recorded").length;

  return (
    <PageShell
      title="Compliance Queue"
      meta={`${requests.length} GC requests · ${deadlines.length} tracked deadlines`}
      crumbs={[{ label: "Admin", to: "/admin/invites" }, { label: "Compliance Queue" }]}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active projects"
          value={PROJECTS.length}
          icon={<HardHat className="h-3.5 w-3.5" />}
        />
        <StatTile
          label="Overdue"
          value={overdue}
          tone="danger"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
        <StatTile
          label="Due this week"
          value={dueThisWeek}
          tone="warning"
          icon={<CalendarClock className="h-3.5 w-3.5" />}
        />
        <StatTile
          label="Recorded"
          value={recorded}
          tone="success"
          icon={<FileCheck2 className="h-3.5 w-3.5" />}
        />
      </div>

      <h2 className="mt-8 mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        GC requests
      </h2>
      {requests.length === 0 ? (
        <div className="p-surface-flat">
          <EmptyState
            title="No requests in the queue"
            description="Compliance service requests submitted by contractors land here."
          />
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Project</th>
              <th>Service</th>
              <th>Detail</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const next = NEXT_STATUS[r.status];
              return (
                <tr key={r.id}>
                  <td className="text-[13px] font-medium">{r.project_name}</td>
                  <td className="text-[12px]">
                    {COMPLIANCE_SERVICES.find((s) => s.key === r.service)?.title ?? r.service}
                  </td>
                  <td className="text-[12px] text-muted-foreground">
                    {r.detail ?? "—"}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </td>
                  <td className="text-[12px]">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <StatusChip tone={requestTone[r.status]}>{r.status}</StatusChip>
                  </td>
                  <td>
                    {next ? (
                      <button
                        type="button"
                        onClick={() => {
                          setComplianceRequestStatus(r.id, next);
                          setRequests(listComplianceRequests());
                        }}
                        className="px-2.5 py-1.5 text-[11.5px] font-medium text-white"
                        style={{ backgroundColor: "#9C6B3F", borderRadius: 3 }}
                      >
                        {next === "In Progress" ? "Start" : "Mark complete"}
                      </button>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <h2 className="mt-8 mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Deadlines
      </h2>
      {deadlines.length === 0 ? (
        <div className="p-surface-flat">
          <EmptyState
            title="No tracked deadlines"
            description="Statutory deadlines appear here once project dates are recorded."
          />
        </div>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Project</th>
              <th>Document type</th>
              <th>Due date</th>
              <th>Days left</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((d, i) => {
              const status = deadlineStatus(d);
              return (
                <tr key={`${d.project}-${d.milestone}-${i}`}>
                  <td className="text-[13px] font-medium">{d.project}</td>
                  <td>
                    <div className="text-[13px]">{d.milestone}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {MILESTONE_RULE[d.milestone] ?? ""}
                    </div>
                  </td>
                  <td className="text-[12px]">{d.deadline}</td>
                  <td className="text-[12px]">
                    {status === "Complete" ? "—" : daysRemaining(d.deadline)}
                  </td>
                  <td>
                    <StatusChip tone={deadlineTone[status]}>{status}</StatusChip>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1.5">
                      {["Generate", "Send", "Record"].map((a) => (
                        <a
                          key={a}
                          href="/portal/lien-rights/documents"
                          className="border px-2 py-1 text-[11px]"
                          style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
                        >
                          {a}
                        </a>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href="/portal/lien-rights/documents"
          className="border px-3 py-2 text-[12px]"
          style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
        >
          Generate documents
        </a>
        <a
          href="/portal/notary-queue"
          className="border px-3 py-2 text-[12px]"
          style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
        >
          Notarization queue
        </a>
        <a
          href="/portal/lien-rights/e-recording"
          className="border px-3 py-2 text-[12px]"
          style={{ borderColor: "var(--p-border)", borderRadius: 3 }}
        >
          E-recording queue
        </a>
      </div>
    </PageShell>
  );
}
