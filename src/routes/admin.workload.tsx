import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, Flag, AlertTriangle, Loader2 } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { useSession } from "@/lib/use-session";
import { listStaffAdmins, getAllOps, type ProjectOps, type StaffMember } from "@/lib/staff-ops";
import { supabase } from "@/integrations/supabase/client";
import { projectStatusMeta, type ProjectStatus } from "@/lib/status-badges";
import { PageShell, TableShell, StatusChip, EmptyState } from "@/components/ui-kit";
import type { MetricTone } from "@/components/ui-kit";

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

const statusTone: Record<string, MetricTone> = {
  sky: "info",
  amber: "warning",
  oxblood: "danger",
  emerald: "success",
  dark: "neutral",
  neutral: "neutral",
};

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
  staff: StaffMember;
  open: WorkloadItem[];
  escalated: WorkloadItem[];
  all: WorkloadItem[];
};

function WorkloadPage() {
  const navigate = useNavigate();
  const session = useSession();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staff, ops] = await Promise.all([listStaffAdmins(), getAllOps()]);
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
        staff.map((member) => {
          const mine = items.filter(
            (i) => i.ops.assigneeEmail?.toLowerCase() === member.email.toLowerCase(),
          );
          const open = mine.filter((i) => OPEN_STATUSES.has(i.permit.status));
          const escalated = mine.filter((i) => i.ops.escalated);
          return { staff: member, open, escalated, all: mine };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workload");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.loading) return;
    if (!session.isAdmin) {
      navigate({ to: "/portal/permits" });
      return;
    }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("staff-ops:changed", refresh);
    return () => window.removeEventListener("staff-ops:changed", refresh);
  }, [load, navigate, session.loading, session.isAdmin]);

  if (session.loading || !session.isAdmin) return null;

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="Staff Workload"
        meta="Open assignments by admin account · amber/red flags 15+ open jobs"
        width="narrow"
      >
        {error && (
          <div className="p-plate mb-3 p-3 text-[12.5px] text-[var(--p-danger)]">
            Could not load workload: {error}
          </div>
        )}

        {loading ? (
          <div className="inline-flex items-center gap-2 px-1 py-6 text-[12.5px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading admin roster…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No admin accounts found" />
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Role</th>
                <th>Open Assignments</th>
                <th>Escalated</th>
                <th className="w-[1%]" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ staff, open, escalated, all }) => {
                const overloaded = open.length >= 15;
                const heavy = open.length >= 10 && open.length < 15;
                const isOpen = !!expanded[staff.id];
                return (
                  <Fragment key={staff.id}>
                    <tr>
                      <td className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium">{staff.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{staff.email}</div>
                      </td>
                      <td className="text-[12.5px] text-muted-foreground">
                        {staff.role ? staff.role : "—"}
                      </td>
                      <td>
                        <StatusChip tone={overloaded ? "danger" : heavy ? "warning" : "neutral"}>
                          {overloaded && <AlertTriangle className="h-3 w-3" />}
                          {open.length}
                        </StatusChip>
                      </td>
                      <td>
                        {escalated.length > 0 ? (
                          <StatusChip tone="danger">
                            <Flag className="h-3 w-3" /> {escalated.length}
                          </StatusChip>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [staff.id]: !e[staff.id] }))}
                          className="p-btn p-btn-quiet p-btn-sm"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          {all.length} total
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={5} className="bg-[var(--p-card-2)]">
                          {all.length === 0 ? (
                            <p className="py-2 text-[12.5px] text-muted-foreground">No permits assigned.</p>
                          ) : (
                            <ul className="p-divide py-1">
                              {all.map(({ ops, permit }) => {
                                const status = permit.status as ProjectStatus;
                                const meta = projectStatusMeta[status] ?? {
                                  label: permit.status,
                                  tone: "neutral" as const,
                                };
                                const place = permit.municipality || permit.city || permit.job_address;
                                return (
                                  <li key={permit.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                                    <Link to="/portal/permits/$id" params={{ id: permit.id }} className="text-[12.5px] hover:underline">
                                      {permit.project_name} · {place}
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      {ops.escalated && (
                                        <StatusChip tone="danger">
                                          <Flag className="h-2.5 w-2.5" /> Escalated
                                        </StatusChip>
                                      )}
                                      <StatusChip tone={statusTone[meta.tone] ?? "neutral"}>{meta.label}</StatusChip>
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
          </TableShell>
        )}
      </PageShell>
    </PortalShell>
  );
}
