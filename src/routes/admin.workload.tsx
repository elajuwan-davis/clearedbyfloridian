import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Flag, Users, AlertTriangle } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { isInternalUser } from "@/lib/is-internal-user";
import { CLEARED_STAFF, getAllOps, getStaffById } from "@/lib/staff-ops";
import { PROJECTS, getProjectById } from "@/lib/projects-data";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";

export const Route = createFileRoute("/admin/workload")({
  head: () => ({
    meta: [
      { title: "Staff Workload · Admin — Cléared" },
      { name: "description", content: "Internal ops view of staff assignments, priority load and escalations across active Cléared projects." },
      { property: "og:title", content: "Staff Workload · Admin — Cléared" },
      { property: "og:description", content: "Internal ops view of staff assignments, priority load and escalations across active Cléared projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkloadPage,
});

const ACTIVE_STATUSES = new Set([
  "submitted", "pending", "in_review", "corrections_required",
  "correction_response_under_review", "resubmitted", "resubmitted_to_county",
  "approved", "inspection_scheduled", "on_hold",
]);

function WorkloadPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [internal, setInternal] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ok = isInternalUser();
    setInternal(ok);
    setReady(true);
    if (!ok) navigate({ to: "/portal/permits" });
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("staff-ops:changed", refresh);
    return () => window.removeEventListener("staff-ops:changed", refresh);
  }, [navigate]);

  const rows = useMemo(() => {
    const ops = getAllOps();
    return CLEARED_STAFF.map((staff) => {
      const mine = ops.filter((o) => o.assigneeId === staff.id);
      const projects = mine
        .map((o) => ({ ops: o, project: getProjectById(o.projectId) }))
        .filter((r) => !!r.project);
      const active = projects.filter((r) => ACTIVE_STATUSES.has(r.project!.status));
      const escalated = projects.filter((r) => r.ops.escalated);
      return { staff, active, escalated, all: projects };
    });
  }, [tick]);

  if (!ready || !internal) return null;

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="label-eyebrow text-obsidian/50">Admin · Internal Ops</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Staff Workload</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Assignment load across active Cléared projects. An amber or red indicator flags staff carrying 15 or more active jobs.
        </p>

        <div className="mt-8 overflow-x-auto rounded-[3px] border border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-paper-warm text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active Projects</th>
                <th className="px-4 py-3">Escalated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ staff, active, escalated, all }) => {
                const overloaded = active.length >= 15;
                const heavy = active.length >= 10 && active.length < 15;
                const isOpen = !!expanded[staff.id];
                return (
                  <>
                    <tr key={staff.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-obsidian">{staff.name}</td>
                      <td className="px-4 py-3 text-obsidian/70">{staff.role}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 font-mono text-[11px] tabular-nums ${
                          overloaded ? "border-red-500/50 bg-red-50 text-red-800"
                          : heavy ? "border-amber-500/50 bg-amber-50 text-amber-800"
                          : "border-obsidian/15 bg-white text-obsidian/70"
                        }`}>
                          {overloaded && <AlertTriangle className="h-3 w-3" />}
                          {active.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {escalated.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-red-500/40 bg-red-50 px-2 py-1 font-mono text-[11px] tabular-nums text-red-800">
                            <Flag className="h-3 w-3" /> {escalated.length}
                          </span>
                        ) : (
                          <span className="text-obsidian/40">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [staff.id]: !e[staff.id] }))}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-[3px] px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60 hover:text-obsidian"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          {all.length} total
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${staff.id}-detail`} className="border-b border-border bg-paper-warm/40">
                        <td colSpan={5} className="px-4 py-3">
                          {all.length === 0 ? (
                            <p className="text-sm text-obsidian/50">No projects assigned.</p>
                          ) : (
                            <ul className="space-y-2">
                              {all.map(({ ops, project }) => {
                                const meta = projectStatusMeta[project!.status];
                                return (
                                  <li key={project!.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian/10 pb-2 last:border-0 last:pb-0">
                                    <Link to="/projects/$id" params={{ id: project!.id }} className="text-sm text-obsidian hover:underline">
                                      {project!.name} · {project!.city}
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      {ops.escalated && (
                                        <span className="inline-flex items-center gap-1 rounded-[3px] border border-red-500/40 bg-red-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red-800">
                                          <Flag className="h-2.5 w-2.5" /> Escalated
                                        </span>
                                      )}
                                      <span className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                                        {meta.label}
                                      </span>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
