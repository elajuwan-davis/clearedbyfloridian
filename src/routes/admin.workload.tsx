import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, Flag, AlertTriangle } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { CLEARED_STAFF, getAllOps, type ProjectOps } from "@/lib/staff-ops";
import { supabase } from "@/integrations/supabase/client";
import { projectStatusMeta, toneClass, type ProjectStatus } from "@/lib/status-badges";

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

const OPEN_STATUSES = new Set<string>([
  "submitted", "pending", "in_review", "corrections_required",
  "correction_response_under_review", "resubmitted", "resubmitted_to_county",
  "approved", "inspection_scheduled", "on_hold", "outsourced_permitting",
]);

type PermitSnap = {
  id: string;
  project_name: string;
  city: string | null;
  municipality: string | null;
  job_address: string;
  status: string;
};

type WorkloadItem = {
  ops: ProjectOps;
  permit: PermitSnap;
};

type StaffRow = {
  staff: (typeof CLEARED_STAFF)[number];
  open: WorkloadItem[];
  escalated: WorkloadItem[];
  all: WorkloadItem[];
};

function WorkloadPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const ops = await getAllOps();
    const permitIds = [...new Set(ops.map((o) => o.permitId))];
    const permitMap = new Map<string, PermitSnap>();

    if (permitIds.length > 0) {
      const { data } = await supabase
        .from("permits")
        .select("id, project_name, city, municipality, job_address, status")
        .in("id", permitIds);
      for (const p of (data ?? []) as PermitSnap[]) {
        permitMap.set(p.id, p);
      }
    }

    const items: WorkloadItem[] = ops
      .map((o) => {
        const permit = permitMap.get(o.permitId);
        return permit ? { ops: o, permit } : null;
      })
      .filter((x): x is WorkloadItem => !!x);

    setRows(
      CLEARED_STAFF.map((staff) => {
        const mine = items.filter(
          (i) => i.ops.assigneeEmail?.toLowerCase() === staff.email.toLowerCase(),
        );
        const open = mine.filter((i) => OPEN_STATUSES.has(i.permit.status));
        const escalated = mine.filter((i) => i.ops.escalated);
        return { staff, open, escalated, all: mine };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const refresh = () => { void load(); };
    window.addEventListener("staff-ops:changed", refresh);
    return () => window.removeEventListener("staff-ops:changed", refresh);
  }, [load]);

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="label-eyebrow text-obsidian/50">Admin · Internal Ops</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Staff Workload</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Open assignment load from staff_assignments, grouped by assignee. An amber or red indicator flags staff carrying 15 or more open jobs.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-obsidian/50">Loading assignments…</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-[3px] border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-paper-warm text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                  <th className="px-4 py-3">Staff</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Open Assignments</th>
                  <th className="px-4 py-3">Escalated</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ staff, open, escalated, all }) => {
                  const overloaded = open.length >= 15;
                  const heavy = open.length >= 10 && open.length < 15;
                  const isOpen = !!expanded[staff.id];
                  return (
                    <Fragment key={staff.id}>
                      <tr className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-obsidian">{staff.name}</td>
                        <td className="px-4 py-3 text-obsidian/70">{staff.role}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 font-mono text-[11px] tabular-nums ${
                            overloaded ? "border-red-500/50 bg-red-50 text-red-800"
                            : heavy ? "border-amber-500/50 bg-amber-50 text-amber-800"
                            : "border-obsidian/15 bg-white text-obsidian/70"
                          }`}>
                            {overloaded && <AlertTriangle className="h-3 w-3" />}
                            {open.length}
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
                        <tr className="border-b border-border bg-paper-warm/40">
                          <td colSpan={5} className="px-4 py-3">
                            {all.length === 0 ? (
                              <p className="text-sm text-obsidian/50">No permits assigned.</p>
                            ) : (
                              <ul className="space-y-2">
                                {all.map(({ ops, permit }) => {
                                  const status = permit.status as ProjectStatus;
                                  const meta = projectStatusMeta[status] ?? {
                                    label: permit.status,
                                    tone: "neutral" as const,
                                  };
                                  const place = permit.municipality || permit.city || permit.job_address;
                                  return (
                                    <li key={permit.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-obsidian/10 pb-2 last:border-0 last:pb-0">
                                      <Link to="/portal/permits/$id" params={{ id: permit.id }} className="text-sm text-obsidian hover:underline">
                                        {permit.project_name} · {place}
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
