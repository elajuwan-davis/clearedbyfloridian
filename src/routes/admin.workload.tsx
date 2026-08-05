import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, Flag, AlertTriangle, Loader2 } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { useSession } from "@/lib/use-session";
import { listStaffAdmins, getAllOps, type StaffMember } from "@/lib/staff-ops";
import { getProjectById } from "@/lib/projects-data";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";
import { isVendorManaged } from "@/lib/project-vendors";


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
  const session = useSession();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (session.loading) return;
    if (!session.isAdmin) {
      navigate({ to: "/portal/permits" });
      return;
    }
    let cancelled = false;
    setStaffLoading(true);
    listStaffAdmins()
      .then((rows) => {
        if (cancelled) return;
        setStaff(rows);
        setStaffError(null);
        setStaffLoading(false);
        setTick((t) => t + 1);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStaffError(err instanceof Error ? err.message : "Failed to load staff");
        setStaffLoading(false);
      });
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("staff-ops:changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("staff-ops:changed", refresh);
    };
  }, [navigate, session.loading, session.isAdmin]);

  const rows = useMemo(() => {
    const ops = getAllOps();
    return staff.map((member) => {
      const mine = ops.filter((o) => o.assigneeId === member.id);
      const projects = mine
        .map((o) => ({ ops: o, project: getProjectById(o.projectId) }))
        // Vendor-managed projects are record copies only — never staff work items.
        .filter((r) => !!r.project && !isVendorManaged(r.project.name));
      const active = projects.filter((r) => ACTIVE_STATUSES.has(r.project!.status));
      const escalated = projects.filter((r) => r.ops.escalated);
      return { staff: member, active, escalated, all: projects };
    });
  }, [tick, staff]);


  if (session.loading || !session.isAdmin) return null;

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="label-eyebrow text-obsidian/50">Admin · Internal Ops</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Staff Workload</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Assignment load across active Cléared projects. An amber or red indicator flags staff carrying 15 or more active jobs.
        </p>

        {staffError && (
          <p className="mt-6 rounded-[3px] border border-red-500/40 bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load admin roster: {staffError}
          </p>
        )}

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
              {staffLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-obsidian/50">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading admin roster…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-obsidian/50">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                rows.map(({ staff: member, active, escalated, all }) => {
                  const overloaded = active.length >= 15;
                  const heavy = active.length >= 10 && active.length < 15;
                  const isOpen = !!expanded[member.id];
                  return (
                    <Fragment key={member.id}>
                      <tr className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-obsidian">
                          <div>{member.name}</div>
                          <div className="mt-0.5 font-mono text-[10px] font-normal normal-case tracking-normal text-obsidian/45">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-obsidian/70">
                          {member.role ? member.role : <span className="text-obsidian/35">—</span>}
                        </td>
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
                            onClick={() => setExpanded((e) => ({ ...e, [member.id]: !e[member.id] }))}
                            className="inline-flex min-h-[44px] items-center gap-1 rounded-[3px] px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60 hover:text-obsidian"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            {all.length} total
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-border bg-paper-warm/40">
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
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
