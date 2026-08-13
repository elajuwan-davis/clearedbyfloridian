import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ChevronDown, Search, AlertTriangle, Plus, FileText, RefreshCw, Flag } from "lucide-react";
import { isInternalUser } from "@/lib/is-internal-user";
import { listEscalatedPermitIds } from "@/lib/staff-ops";
import { listPermits, updatePermit, permitCompleteness, type PermitRow, type PermitStatus } from "@/lib/permits-api";
import { syncAllPermits, getLastRun, formatRelative } from "@/lib/permit-sync";
import { getVendor, isVendorManaged } from "@/lib/project-vendors";
import { listLocalPermitDrafts, discardLocalPermitDrafts, type LocalPermitDraft } from "@/lib/permit-drafts";
import {
  PageShell,
  Panel,
  SearchInput,
  Segmented,
  StatusChip,
  EmptyState,
} from "@/components/ui-kit";



type GroupKey = "intake" | "preparing" | "submitted" | "on_hold" | "outsourced" | "issued" | "cancelled";

const GROUPS: Array<{ key: GroupKey; label: string; statuses: PermitStatus[]; borderColor: string }> = [
  { key: "intake", label: "Pre-Check", statuses: ["submitted"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "preparing", label: "Pre-Check — In Review", statuses: ["in_review", "corrections_required"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "submitted", label: "Cleared for Takeoff", statuses: ["approved"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "on_hold", label: "Delayed", statuses: ["on_hold"], borderColor: "oklch(0.72 0.17 65)" },
  { key: "outsourced", label: "Outsourced Permitting", statuses: ["outsourced_permitting"], borderColor: "oklch(0.5 0.2 285)" },
  { key: "issued", label: "En Route", statuses: ["permit_issued"], borderColor: "oklch(0.58 0.16 150)" },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"], borderColor: "oklch(0.5 0.18 25)" },
];


const STATUS_OPTIONS: Array<{ value: PermitStatus; label: string }> = [
  { value: "submitted", label: "Pre-Check" },
  { value: "in_review", label: "Pre-Check — In Review" },
  { value: "approved", label: "Cleared for Takeoff" },
  { value: "on_hold", label: "Delayed" },
  { value: "outsourced_permitting", label: "Outsourced Permitting" },
  { value: "permit_issued", label: "En Route" },
  { value: "cancelled", label: "Cancelled" },
];

export function MyPermitsPage() {
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [management, setManagement] = useState<"all" | "cleared" | "vendor">("all");

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({
    intake: true, preparing: true, submitted: true, on_hold: true, outsourced: true, issued: true, cancelled: false,
  });
  const internal = isInternalUser();

  async function changeStatus(id: string, status: PermitStatus) {
    setUpdatingId(id);
    // optimistic
    setPermits((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await updatePermit(id, { status });
    } catch {
      await refresh();
    } finally {
      setUpdatingId(null);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listPermits();
      setPermits(rows);
    } finally { setLoading(false); }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncAllPermits();
      setLastSync(res.ranAt);
      setSyncMsg(res.updated > 0 ? `Synced · ${res.updated} updated` : "Synced · no changes");
      await refresh();
    } catch {
      setSyncMsg("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  }

  useEffect(() => {
    refresh();
    setLastSync(getLastRun());
  }, []);

  useEffect(() => {
    if (!internal) return;
    listEscalatedPermitIds().then(setEscalatedIds);
    const on = () => { void listEscalatedPermitIds().then(setEscalatedIds); };
    window.addEventListener("staff-ops:changed", on);
    return () => window.removeEventListener("staff-ops:changed", on);
  }, [internal]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let rows = permits;
    if (management !== "all") {
      rows = rows.filter((p) =>
        management === "vendor" ? isVendorManaged(p.project_name) : !isVendorManaged(p.project_name),
      );
    }
    if (!q) return rows;
    return rows.filter((p) => `${p.project_name} ${p.job_address} ${p.county ?? ""} ${p.municipality ?? ""}`.toLowerCase().includes(q));
  }, [permits, query, management]);


  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: filtered.filter((p) => g.statuses.includes(p.status)) })),
    [filtered],
  );

  const counts = useMemo(
    () => ({
      total: filtered.length,
      active: filtered.filter((p) => !["permit_issued", "cancelled"].includes(p.status)).length,
      issued: filtered.filter((p) => p.status === "permit_issued").length,
      blocked: filtered.filter((p) => ["on_hold", "corrections_required"].includes(p.status)).length,
    }),
    [filtered],
  );

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Workspace" }, { label: "Permits" }]}
        title="Permits"
        meta={
          loading
            ? "Loading…"
            : `${permits.length} on file · ${counts.active} active · ${counts.blocked} blocked`
        }
        actions={
          <>
            <span className="hidden text-[11.5px] text-muted-foreground lg:inline">
              {syncMsg ?? `Synced ${formatRelative(lastSync)}`}
            </span>
            <button onClick={handleSync} disabled={syncing} className="p-btn p-btn-ghost">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={1.75} />
              {syncing ? "Syncing" : "Sync"}
            </button>
            <Link to="/portal/permits/new" className="p-btn p-btn-primary">
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New permit
            </Link>
          </>
        }
        toolbar={
          <>
            <div className="p-inset min-w-0 flex-1 sm:max-w-sm">
              <SearchInput value={query} onChange={setQuery} placeholder="Search project, address, county" />
            </div>
            <Segmented
              value={management}
              onChange={setManagement}
              options={[
                { value: "all", label: "All" },
                { value: "cleared", label: "Cléared" },
                { value: "vendor", label: "Vendor" },
              ]}
            />
            <span className="ml-auto hidden text-[11.5px] text-muted-foreground sm:inline">
              {counts.total} shown
            </span>
          </>
        }
      >
        {permits.length === 0 && !loading ? (
          <Panel padded={false}>
            <EmptyState
              icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
              title="No permits yet"
              description="Create your first permit to start the statutory clock."
              action={
                <Link to="/portal/permits/new" className="p-btn p-btn-primary">
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} /> New permit
                </Link>
              }
            />
          </Panel>
        ) : (
          <div className="space-y-3">
            {grouped.map((g) => (
              <section key={g.key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
                  className="flex w-full items-center gap-2 px-1 py-1.5 text-left"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open[g.key] ? "" : "-rotate-90"}`}
                    strokeWidth={2}
                  />
                  <span className="text-[12.5px] font-semibold tracking-[-0.01em]">{g.label}</span>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">
                    {g.items.length}
                  </span>
                </button>
                {open[g.key] &&
                  (g.items.length === 0 ? (
                    <div className="px-1 py-2 text-[11.5px] text-muted-foreground">Empty stage.</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {g.items.map((p) => {
                        const c = permitCompleteness(p);
                        const vendor = getVendor(p.project_name);
                        const barColor =
                          c.percent === 100 ? "#22C55E" : c.percent >= 60 ? "#3B82F6" : c.percent >= 30 ? "#F59E0B" : "#EF4444";
                        return (
                          <div
                            key={p.id}
                            className="p-plate p-hover-plate group flex min-w-0 flex-col overflow-hidden"
                          >
                            <Link
                              to="/portal/permits/$id"
                              params={{ id: p.id }}
                              className="min-w-0 flex-1 px-3 pb-2 pt-2.5"
                            >
                              <div className="flex min-w-0 items-start gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[13px] font-medium leading-tight">
                                    {p.project_name}
                                  </div>
                                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                                    {p.job_address}
                                  </div>
                                </div>
                              </div>


                              {/* Grouped metadata — one quiet line, no badge pile */}
                              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                {p.permit_type && <span className="truncate">{p.permit_type}</span>}
                                {p.municipality && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <span className="truncate">{p.municipality}</span>
                                  </>
                                )}
                                {vendor && (
                                  <>
                                    <span className="opacity-40">·</span>
                                    <span className="truncate" title={`Managed by ${vendor} — record copy only`}>
                                      {vendor}
                                    </span>
                                  </>
                                )}
                                <span className="ml-auto shrink-0 tabular-nums">
                                  {new Date(p.updated_at).toLocaleDateString()}
                                </span>
                              </div>

                              {(internal && escalatedIds.has(p.id)) ||
                              (!vendor && (c.missingFields.length > 0 || c.missingDocs.length > 0)) ? (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  {internal && escalatedIds.has(p.id) && (
                                    <StatusChip tone="danger">
                                      <Flag className="h-2.5 w-2.5" /> Escalated
                                    </StatusChip>
                                  )}
                                  {!vendor && c.missingFields.length > 0 && (
                                    <StatusChip tone="danger">
                                      <AlertTriangle className="h-2.5 w-2.5" /> {c.missingFields.length}
                                    </StatusChip>
                                  )}
                                  {!vendor && c.missingDocs.length > 0 && (
                                    <StatusChip tone="warning">
                                      <FileText className="h-2.5 w-2.5" /> {c.missingDocs.length}
                                    </StatusChip>
                                  )}
                                </div>
                              ) : null}
                            </Link>

                            {/* Slim footer: progress + status control, revealed on hover */}
                            <div className="flex items-center gap-2 px-3 pb-2.5">
                              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                                <div className="h-full" style={{ width: `${c.percent}%`, background: barColor }} />
                              </div>
                              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                {c.done}/{c.total}
                              </span>
                              <select
                                value={p.status}
                                disabled={updatingId === p.id}
                                onChange={(e) => changeStatus(p.id, e.target.value as PermitStatus)}
                                title="Change status"
                                aria-label="Change status"
                                className="w-[26px] shrink-0 border-0 bg-transparent px-0 text-[11px] text-muted-foreground opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </section>
            ))}
          </div>
        )}
      </PageShell>
    </PortalShell>
  );
}

