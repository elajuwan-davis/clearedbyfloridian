import { PlanGate } from "@/components/feature-lock";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { PageShell, TableShell, StatusChip, type MetricTone } from "@/components/ui-kit";
import {
  LIEN_DEADLINES,
  MILESTONE_RULE,
  daysRemaining,
  deadlineStatus,
  type DeadlineStatus,
} from "@/lib/lien-rights-store";

export const Route = createFileRoute("/portal/lien-rights/deadlines")({
  head: () => ({
    meta: [
      { title: "Lien Deadlines — Cleard" },
      {
        name: "description",
        content: "Track Florida Statute 713 lien deadlines across every active project.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PlanGate feature="lien_rights">
      <LienDeadlinesPage />
    </PlanGate>
  ),
});

const tone: Record<DeadlineStatus, MetricTone> = {
  "On Track": "success",
  "Due Soon": "warning",
  Overdue: "danger",
  Complete: "neutral",
};

function LienDeadlinesPage() {
  const rows = [...LIEN_DEADLINES].sort((a, b) => a.deadline.localeCompare(b.deadline));

  return (
    <PageShell title="Compliance" meta={`${rows.length} tracked milestones`}>
      <div
        className="mb-4 flex items-start gap-2.5 border px-4 py-3 text-[12px] leading-relaxed"
        style={{ borderColor: "var(--p-border)", backgroundColor: "var(--p-bg)" }}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#9C6B3F" }} />
        <span>
          Deadlines are calculated under Florida Statute 713. Consult a licensed Florida
          construction attorney before filing any lien document.
        </span>
      </div>

      <TableShell>
        <thead>
          <tr>
            <th>Project</th>
            <th>Milestone</th>
            <th>Deadline Date</th>
            <th>Days Remaining</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const status = deadlineStatus(r);
            const days = daysRemaining(r.deadline);
            return (
              <tr key={`${r.project}-${r.milestone}-${i}`}>
                <td className="text-[13px] font-medium">{r.project}</td>
                <td>
                  <div className="text-[13px]">{r.milestone}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {MILESTONE_RULE[r.milestone] ?? ""}
                  </div>
                </td>
                <td className="text-[12px]">{r.deadline}</td>
                <td className="text-[12px]">
                  {status === "Complete"
                    ? "—"
                    : days < 0
                      ? `${Math.abs(days)} days overdue`
                      : `${days} days`}
                </td>
                <td>
                  <StatusChip tone={tone[status]}>{status}</StatusChip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
    </PageShell>
  );
}
