import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  Flag,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { isInternalUser } from "@/lib/is-internal-user";
import { listEscalatedPermitIds } from "@/lib/staff-ops";
import {
  listPermits,
  updatePermit,
  permitCompleteness,
  type PermitRow,
  type PermitStatus,
} from "@/lib/permits-api";
import { useActiveTenantId } from "@/lib/view-mode-context";
import { syncAllPermits, getLastRun, formatRelative } from "@/lib/permit-sync";
import { getVendor, isVendorManaged } from "@/lib/project-vendors";
import {
  listLocalPermitDrafts,
  discardLocalPermitDrafts,
  type LocalPermitDraft,
} from "@/lib/permit-drafts";
import { PageShell, Panel, SearchInput, Segmented, EmptyState, KV } from "@/components/ui-kit";
import {
  CDS,
  Kpi,
  KpiBar,
  Reveal,
  SidePanel,
  SkeletonCards,
  StagePipeline,
  Tag,
  toneForStatus,
  type PipelineStage,
} from "@/components/cds-kit";

/** Stage keys mirror the real permit statuses — no new data, just a view. */
type StageKey = "drafts" | PermitStatus;

const STAGES: Array<{ key: StageKey; label: string; countColor?: string }> = [
  { key: "drafts", label: "Intake" },
  { key: "submitted", label: "Submitted" },
  { key: "in_review", label: "In Review" },
  { key: "corrections_required", label: "Corrections", countColor: CDS.red },
  { key: "approved", label: "Approved" },
  { key: "outsourced_permitting", label: "Outsourced" },
  { key: "permit_issued", label: "Issued", countColor: CDS.tealText },
  { key: "on_hold", label: "Delayed", countColor: CDS.red },
  { key: "cancelled", label: "Cancelled" },
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

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  corrections_required: "Corrections",
  approved: "Approved",
  on_hold: "Delayed",
  outsourced_permitting: "Outsourced",
  permit_issued: "Issued",
  cancelled: "Cancelled",
};

type SortKey = "updated" | "address" | "jurisdiction" | "stage" | "assigned";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "updated", label: "Last updated" },
  { value: "address", label: "Address" },
  { value: "jurisdiction", label: "Jurisdiction" },
  { value: "stage", label: "Stage" },
  { value: "assigned", label: "Assigned to" },
];

/** What the contractor should do next, from real permit state only. */
function nextAction(p: PermitRow, c: ReturnType<typeof permitCompleteness>, vendor: string | null) {
  if (vendor) return { label: `Managed by ${vendor}`, tone: "neutral" as const };
  if (p.status === "corrections_required") return { label: "Respond to corrections", tone: "danger" as const };
  if (p.status === "on_hold") return { label: "Delayed — check with Cleard", tone: "danger" as const };
  if (p.status === "cancelled") return { label: "Cancelled", tone: "neutral" as const };
  if (c.missingFields.length > 0)
    return { label: `${c.missingFields.length} field${c.missingFields.length === 1 ? "" : "s"} missing`, tone: "danger" as const };
  if (c.missingDocs.length > 0)
    return { label: `${c.missingDocs.length} document${c.missingDocs.length === 1 ? "" : "s"} to upload`, tone: "info" as const };
  if (p.status === "permit_issued") return { label: "Permit issued", tone: "success" as const };
  if (p.status === "approved") return { label: "Approved — awaiting issue", tone: "success" as const };
  return { label: "Waiting on jurisdiction", tone: "info" as const };
}

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
  const [drafts, setDrafts] = useState<LocalPermitDraft[]>([]);
  const [stage, setStage] = useState<StageKey | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const internal = isInternalUser();
  const activeTenantId = useActiveTenantId();

  useEffect(() => {
    setDrafts(listLocalPermitDrafts());
    const on = () => setDrafts(listLocalPermitDrafts());
    window.addEventListener("focus", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("storage", on);
    };
  }, []);

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
      const rows = await listPermits(activeTenantId);
      setPermits(rows);
    } finally {
      setLoading(false);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantId]);

  useEffect(() => {
    if (!internal) return;
    listEscalatedPermitIds().then(setEscalatedIds);
    const on = () => {
      void listEscalatedPermitIds().then(setEscalatedIds);
    };
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
    return rows.filter((p) =>
      `${p.project_name} ${p.job_address} ${p.county ?? ""} ${p.municipality ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [permits, query, management]);

  const stages: PipelineStage[] = useMemo(
    () =>
      STAGES.map((s) => ({
        key: s.key,
        label: s.label,
        countColor: s.countColor,
        count:
          s.key === "drafts" ? drafts.length : filtered.filter((p) => p.status === s.key).length,
      })),
    [filtered, drafts.length],
  );

  const staged = useMemo(
    () => (stage && stage !== "drafts" ? filtered.filter((p) => p.status === stage) : filtered),
    [filtered, stage],
  );

  const rows = useMemo(() => {
    const val = (p: PermitRow, key: SortKey) => {
      switch (key) {
        case "address":
          return p.job_address ?? "";
        case "jurisdiction":
          return p.municipality ?? p.county ?? "";
        case "stage":
          return STATUS_LABEL[p.status] ?? p.status;
        case "assigned":
          return getVendor(p.project_name) ?? "Cleard";
        default:
          return p.updated_at;
      }
    };
    const dir = sortKey === "updated" ? -1 : 1;
    return [...staged].sort(
      (a, b) => String(val(a, sortKey)).localeCompare(String(val(b, sortKey))) * dir,
    );
  }, [staged, sortKey]);

  const counts = useMemo(
    () => ({
      total: filtered.length,
      active: filtered.filter((p) => !["permit_issued", "cancelled"].includes(p.status)).length,
      issued: filtered.filter((p) => p.status === "permit_issued").length,
      blocked: filtered.filter((p) => ["on_hold", "corrections_required"].includes(p.status)).length,
    }),
    [filtered],
  );

  const selected = useMemo(
    () => permits.find((p) => p.id === selectedId) ?? null,
    [permits, selectedId],
  );

  const showDrafts = drafts.length > 0 && (stage === null || stage === "drafts");

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Workspace" }, { label: "Permits" }]}
        title="My Permits"
        meta={
          loading
            ? "Loading…"
            : `${permits.length} on file · ${counts.active} active · ${counts.blocked} blocked`
        }
        actions={
          <>
            <span className="hidden text-[12px] text-muted-foreground lg:inline">
              {syncMsg ?? `Synced ${formatRelative(lastSync)}`}
            </span>
            <button onClick={handleSync} disabled={syncing} className="p-btn p-btn-secondary">
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
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <SearchInput value={query} onChange={setQuery} placeholder="Search project, address, county" />
            </div>
            <Segmented
              value={management}
              onChange={setManagement}
              options={[
                { value: "all", label: "All" },
                { value: "cleared", label: "Cleard" },
                { value: "vendor", label: "Vendor" },
              ]}
            />
            <label className="ml-auto flex items-center gap-2 text-[12px] text-muted-foreground">
              Sort
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort permits"
                className="!h-8 !min-h-0 text-[13px]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        }
      >
        <KpiBar>
          <Kpi label="Total permits" value={counts.total} />
          <Kpi label="Active" value={counts.active} tone="blue" />
          <Kpi label="Needs attention" value={counts.blocked} tone={counts.blocked > 0 ? "red" : "gray"} />
          <Kpi label="Issued" value={counts.issued} tone="teal" />
        </KpiBar>

        <StagePipeline
          stages={stages}
          active={stage}
          onSelect={(k) => setStage(k as StageKey | null)}
          hideEmpty
        />

        {permits.length === 0 && drafts.length === 0 && !loading ? (
          <Panel padded={false}>
            {activeTenantId === "__none__" ? (
              <EmptyState
                icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
                title="No client selected"
                description="Select a client to view their permits."
              />
            ) : (
              <EmptyState
                icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
                title="No permits yet"
                description="Start your first permit here — Victoria can fill the form for you if you'd rather talk it through than type it."
                action={
                  <Link to="/portal/permits/new" className="p-btn p-btn-primary">
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Start a new permit
                  </Link>
                }
              />
            )}
          </Panel>
        ) : (
          <div className="space-y-6">
            {showDrafts && (
              <Reveal>
                <section>
                  <header className="mb-2 flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold">Drafts</h2>
                    <Tag>{drafts.length} not submitted</Tag>
                    <button
                      type="button"
                      onClick={() => {
                        discardLocalPermitDrafts();
                        setDrafts([]);
                      }}
                      className="p-btn p-btn-quiet p-btn-sm ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Discard all
                    </button>
                  </header>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {drafts.map((d, i) => (
                      <Link
                        key={i}
                        to="/portal/permits/new"
                        className="p-surface p-hover-plate block min-w-0 p-4"
                        style={{ borderStyle: "dashed", borderColor: "rgba(0,0,0,0.18)" }}
                      >
                        <div className="truncate text-[14px] font-semibold">
                          {d.projectName || "Untitled draft"}
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {d.jobAddress || "Address not entered"}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
                          <span className="truncate">
                            {[d.permitType, d.municipality].filter(Boolean).join(" · ") || "Continue intake"}
                          </span>
                          <span className="ml-auto shrink-0 tabular-nums">
                            {d.savedAt ? new Date(d.savedAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            {stage !== "drafts" && (
              <section>
                <header className="mb-2 flex items-baseline gap-2">
                  <h2 className="text-[14px] font-semibold">
                    {stage ? STAGES.find((s) => s.key === stage)?.label ?? "Permits" : "All permits"}
                  </h2>
                  <span className="text-[12px] text-muted-foreground">{rows.length} shown</span>
                </header>

                {loading && rows.length === 0 ? (
                  <SkeletonCards count={6} />
                ) : rows.length === 0 ? (
                  <Panel padded={false}>
                    <EmptyState
                      icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
                      title="Nothing in this stage"
                      description="Try another stage or clear the search."
                    />
                  </Panel>
                ) : (
                  <ul className="grid grid-cols-1 gap-3">
                    {rows.map((p, i) => {
                      const c = permitCompleteness(p);
                      const vendor = getVendor(p.project_name);
                      const action = nextAction(p, c, vendor);
                      const stageLabel = STATUS_LABEL[p.status] ?? p.status;
                      const escalated = internal && escalatedIds.has(p.id);
                      return (
                        <Reveal key={p.id} as="li" delay={Math.min(i, 10) * 40}>
                          <article
                            className="p-surface p-hover-plate grid min-w-0 cursor-pointer grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1.4fr)_auto] lg:items-center"
                            style={escalated ? { borderColor: "rgba(192,57,43,0.35)" } : undefined}
                            onClick={() => setSelectedId(p.id)}
                            aria-selected={selectedId === p.id}
                          >
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-[15px] font-semibold">
                                  {p.job_address || p.project_name}
                                </span>
                                {escalated && (
                                  <Tag tone="danger">
                                    <Flag className="h-2.5 w-2.5" /> Escalated
                                  </Tag>
                                )}
                              </div>
                              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground">
                                <span className="tabular-nums font-medium" style={{ color: CDS.copper }}>
                                  {p.permit_number ?? p.id.slice(0, 8).toUpperCase()}
                                </span>
                                {p.job_address && p.project_name && (
                                  <span className="truncate">{p.project_name}</span>
                                )}
                              </div>
                            </div>

                            <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-1 text-[12.5px] lg:grid-cols-1">
                              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: CDS.copper }} strokeWidth={1.75} />
                                <span className="truncate">{p.municipality ?? p.county ?? "Jurisdiction TBD"}</span>
                              </span>
                              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5 shrink-0" style={{ color: CDS.copper }} strokeWidth={1.75} />
                                <span className="truncate">{p.permit_type ?? "Type TBD"}</span>
                              </span>
                              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                <UserRound className="h-3.5 w-3.5 shrink-0" style={{ color: CDS.copper }} strokeWidth={1.75} />
                                <span className="truncate">{vendor ?? "Cleard"}</span>
                              </span>
                              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: CDS.copper }} strokeWidth={1.75} />
                                <span className="truncate tabular-nums">
                                  Updated {new Date(p.updated_at).toLocaleDateString()}
                                </span>
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-2 text-[12px]">
                                <span className="truncate font-medium" style={{ color: toneColor(action.tone) }}>
                                  {action.label}
                                </span>
                                {!vendor && (
                                  <span className="shrink-0 tabular-nums text-muted-foreground">{c.percent}%</span>
                                )}
                              </div>
                              {!vendor && (
                                <div
                                  className="p-progress mt-1.5"
                                  data-tone={c.percent === 100 ? "success" : action.tone === "danger" ? "danger" : undefined}
                                  aria-label={`${c.done} of ${c.total} intake items complete`}
                                >
                                  <span style={{ width: `${c.percent}%` }} />
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                              <Tag tone={toneForStatus(stageLabel)}>{stageLabel}</Tag>
                              <Link
                                to="/portal/permits/$id"
                                params={{ id: p.id }}
                                onClick={(e) => e.stopPropagation()}
                                className="p-btn p-btn-quiet p-btn-sm ml-auto lg:ml-0"
                              >
                                Open <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                              </Link>
                            </div>
                          </article>
                        </Reveal>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </PageShell>

      <SidePanel
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected ? selected.job_address || selected.project_name : ""}
        meta={
          selected
            ? `${selected.permit_number ?? selected.id.slice(0, 8).toUpperCase()} · ${STATUS_LABEL[selected.status] ?? selected.status}`
            : undefined
        }
        width={440}
        footer={
          selected && (
            <Link to="/portal/permits/$id" params={{ id: selected.id }} className="p-btn p-btn-primary">
              Open permit <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          )
        }
      >
        {selected && (
          <PermitDetail
            permit={selected}
            completeness={permitCompleteness(selected)}
            vendor={getVendor(selected.project_name)}
            updating={updatingId === selected.id}
            onStatus={(s) => changeStatus(selected.id, s)}
          />
        )}
      </SidePanel>
    </PortalShell>
  );
}

function toneColor(tone: "danger" | "success" | "info" | "neutral") {
  switch (tone) {
    case "danger":
      return CDS.red;
    case "success":
      return CDS.tealText;
    case "info":
      return CDS.copper;
    default:
      return CDS.gray;
  }
}

function PermitDetail({
  permit,
  completeness,
  vendor,
  updating,
  onStatus,
}: {
  permit: PermitRow;
  completeness: ReturnType<typeof permitCompleteness>;
  vendor: string | null;
  updating: boolean;
  onStatus: (s: PermitStatus) => void;
}) {
  const docs = permit.documents ?? [];
  const timeline = [
    { label: "Created", at: permit.created_at },
    { label: "Submitted", at: permit.submitted_date },
    { label: "Last update", at: permit.updated_at },
  ].filter((t) => Boolean(t.at));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        <KV label="Jurisdiction">{permit.municipality ?? permit.county ?? "—"}</KV>
        <KV label="Permit type">{permit.permit_type ?? "—"}</KV>
        <KV label="Assigned to">{vendor ?? "Cleard"}</KV>
        <KV label="Project">{permit.project_name || "—"}</KV>
      </section>

      {!vendor && (
        <section>
          <DetailHead>Intake completeness</DetailHead>
          <div className="flex items-center gap-3">
            <div className="p-progress" data-tone={completeness.percent === 100 ? "success" : undefined}>
              <span style={{ width: `${completeness.percent}%` }} />
            </div>
            <span className="shrink-0 tabular-nums text-[12px] text-muted-foreground">
              {completeness.done}/{completeness.total}
            </span>
          </div>
          {completeness.missingFields.length > 0 && (
            <ul className="mt-3 space-y-1">
              {completeness.missingFields.map((f) => (
                <li key={f.key} className="flex items-center gap-2 text-[12.5px]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: CDS.red }} strokeWidth={1.75} />
                  <span className="truncate">{f.label}</span>
                </li>
              ))}
            </ul>
          )}
          {completeness.missingDocs.length > 0 && (
            <ul className="mt-2 space-y-1">
              {completeness.missingDocs.map((f) => (
                <li key={f.key} className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: CDS.copper }} strokeWidth={1.75} />
                  <span className="truncate">{f.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <DetailHead>Timeline</DetailHead>
        <ol className="relative ml-1.5 space-y-3 border-l pl-4" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
          {timeline.map((t) => (
            <li key={t.label} className="relative flex items-baseline gap-2 text-[12.5px]">
              <span
                className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2"
                style={{ borderColor: CDS.copper, background: "#FFFFFF" }}
              />
              <span className="font-medium">{t.label}</span>
              <span className="ml-auto tabular-nums text-muted-foreground">
                {new Date(t.at as string).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <DetailHead>Documents</DetailHead>
        {docs.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">No documents attached.</p>
        ) : (
          <ul className="p-divide p-surface">
            {docs.map((d) => (
              <li key={d.key} className="flex min-w-0 items-center gap-2 px-3 py-2 text-[12.5px]">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{d.label}</span>
                <Tag tone={toneForStatus(d.status === "uploaded" ? "verified" : d.status)}>
                  {d.status.replace("_", " ")}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <DetailHead>Notes</DetailHead>
        <p className="text-[12.5px] text-muted-foreground">
          {permit.additional_notes || permit.description || "No notes on this permit."}
        </p>
        {vendor && (
          <p className="mt-1.5 text-[12px] text-muted-foreground">Managed by {vendor} — record copy only.</p>
        )}
      </section>

      <section>
        <DetailHead>Status</DetailHead>
        <select
          value={permit.status}
          disabled={updating}
          onChange={(e) => onStatus(e.target.value as PermitStatus)}
          aria-label="Change status"
          className="w-full"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}

function DetailHead({ children }: { children: React.ReactNode }) {
  return <div className="p-eyebrow mb-2">{children}</div>;
}
