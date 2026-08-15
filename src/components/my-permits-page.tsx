import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import {
  ChevronDown,
  ChevronRight,
  Search,
  AlertTriangle,
  Plus,
  FileText,
  RefreshCw,
  Flag,
  ArrowUpRight,
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
import { syncAllPermits, getLastRun, formatRelative } from "@/lib/permit-sync";
import { getVendor, isVendorManaged } from "@/lib/project-vendors";
import {
  listLocalPermitDrafts,
  discardLocalPermitDrafts,
  type LocalPermitDraft,
} from "@/lib/permit-drafts";
import { PageShell, Panel, SearchInput, Segmented, EmptyState } from "@/components/ui-kit";
import {
  CDS,
  Kpi,
  KpiBar,
  Reveal,
  SkeletonRows,
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

type SortKey = "id" | "address" | "jurisdiction" | "type" | "stage" | "assigned" | "updated";

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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "updated",
    dir: "desc",
  });
  const internal = isInternalUser();

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
      const rows = await listPermits();
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
  }, []);

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
        case "id":
          return p.permit_number ?? p.id;
        case "address":
          return p.job_address ?? "";
        case "jurisdiction":
          return p.municipality ?? p.county ?? "";
        case "type":
          return p.permit_type ?? "";
        case "stage":
          return STATUS_LABEL[p.status] ?? p.status;
        case "assigned":
          return getVendor(p.project_name) ?? "Cléared";
        default:
          return p.updated_at;
      }
    };
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...staged].sort(
      (a, b) => String(val(a, sort.key)).localeCompare(String(val(b, sort.key))) * dir,
    );
  }, [staged, sort]);

  const counts = useMemo(
    () => ({
      total: filtered.length,
      active: filtered.filter((p) => !["permit_issued", "cancelled"].includes(p.status)).length,
      issued: filtered.filter((p) => p.status === "permit_issued").length,
      blocked: filtered.filter((p) => ["on_hold", "corrections_required"].includes(p.status)).length,
    }),
    [filtered],
  );

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const showDrafts = drafts.length > 0 && (stage === null || stage === "drafts");

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
              {rows.length} shown
            </span>
          </>
        }
      >
        <KpiBar>
          <Kpi label="Total permits" value={counts.total} />
          <Kpi label="Active" value={counts.active} tone="teal" />
          <Kpi label="Blocked" value={counts.blocked} tone={counts.blocked > 0 ? "red" : "gray"} />
          <Kpi label="Issued" value={counts.issued} tone="blue" />
        </KpiBar>

        <StagePipeline stages={stages} active={stage} onSelect={(k) => setStage(k as StageKey | null)} />

        {permits.length === 0 && drafts.length === 0 && !loading ? (
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
          <div className="space-y-4">
            {showDrafts && (
              <Reveal>
                <div style={{ background: CDS.white, border: `1px solid ${CDS.border}` }}>
                  <div
                    className="flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${CDS.border}`, padding: "10px 12px" }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: CDS.black }}>Drafts</span>
                    <Tag>{drafts.length} not submitted</Tag>
                    <button
                      type="button"
                      onClick={() => {
                        discardLocalPermitDrafts();
                        setDrafts([]);
                      }}
                      className="ml-auto"
                      style={{ fontSize: 11, color: CDS.gray, background: "none", border: "none" }}
                    >
                      Discard all
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {drafts.map((d, i) => (
                      <Link
                        key={i}
                        to="/portal/permits/new"
                        className="cds-card-hover min-w-0"
                        style={{
                          borderRight: `1px solid ${CDS.border}`,
                          borderBottom: `1px solid ${CDS.border}`,
                          padding: "12px 14px",
                        }}
                      >
                        <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: CDS.black }}>
                          {d.projectName || "Untitled draft"}
                        </div>
                        <div className="truncate" style={{ fontSize: 11.5, color: CDS.gray, marginTop: 2 }}>
                          {d.jobAddress || "Address not entered"}
                        </div>
                        <div
                          className="mt-2 flex items-center gap-2 truncate"
                          style={{ fontSize: 11, color: CDS.grayLt }}
                        >
                          {d.permitType && <span className="truncate">{d.permitType}</span>}
                          {d.municipality && <span className="truncate">· {d.municipality}</span>}
                          <span className="ml-auto shrink-0 tabular-nums">
                            {d.savedAt ? new Date(d.savedAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {stage !== "drafts" && (
              <Reveal>
                <div className="min-w-0 overflow-x-auto" style={{ background: CDS.white, border: `1px solid ${CDS.border}` }}>
                  <table className="cds-table">
                    <thead>
                      <tr>
                        <th style={{ width: 28 }} aria-label="Expand" />
                        <SortTh label="ID" k="id" sort={sort} onSort={toggleSort} />
                        <SortTh label="Address" k="address" sort={sort} onSort={toggleSort} />
                        <SortTh label="Jurisdiction" k="jurisdiction" sort={sort} onSort={toggleSort} />
                        <SortTh label="Type" k="type" sort={sort} onSort={toggleSort} />
                        <SortTh label="Stage" k="stage" sort={sort} onSort={toggleSort} />
                        <SortTh label="Assigned" k="assigned" sort={sort} onSort={toggleSort} />
                        <SortTh label="Last updated" k="updated" sort={sort} onSort={toggleSort} />
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && rows.length === 0 && (
                        <tr>
                          <td colSpan={9}>
                            <SkeletonRows rows={6} />
                          </td>
                        </tr>
                      )}
                      {!loading && rows.length === 0 && (
                        <tr>
                          <td colSpan={9} style={{ color: CDS.grayLt, fontSize: 12.5 }}>
                            No permits in this stage.
                          </td>
                        </tr>
                      )}
                      {rows.map((p) => {
                        const c = permitCompleteness(p);
                        const vendor = getVendor(p.project_name);
                        const isOpen = expanded === p.id;
                        return (
                          <>
                            <tr key={p.id}>
                              <td>
                                <button
                                  type="button"
                                  aria-label={isOpen ? "Collapse detail" : "Expand detail"}
                                  onClick={() => setExpanded(isOpen ? null : p.id)}
                                  style={{ background: "none", border: "none", color: CDS.grayLt, padding: 0 }}
                                >
                                  {isOpen ? (
                                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                                  )}
                                </button>
                              </td>
                              <td className="cds-cell-id">{p.permit_number ?? p.id.slice(0, 8).toUpperCase()}</td>
                              <td className="cds-cell-primary">
                                <button
                                  type="button"
                                  onClick={() => setExpanded(isOpen ? null : p.id)}
                                  className="max-w-[280px] truncate text-left"
                                  style={{ background: "none", border: "none", color: CDS.black, fontWeight: 500 }}
                                >
                                  {p.job_address || p.project_name}
                                </button>
                                <div className="max-w-[280px] truncate" style={{ fontSize: 11, color: CDS.grayLt }}>
                                  {p.project_name}
                                </div>
                              </td>
                              <td>{p.municipality ?? p.county ?? "—"}</td>
                              <td>{p.permit_type ?? "—"}</td>
                              <td>
                                <Tag tone={toneForStatus(STATUS_LABEL[p.status] ?? p.status)}>
                                  {STATUS_LABEL[p.status] ?? p.status}
                                </Tag>
                              </td>
                              <td>{vendor ?? "Cléared"}</td>
                              <td className="tabular-nums">{new Date(p.updated_at).toLocaleDateString()}</td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  {internal && escalatedIds.has(p.id) && (
                                    <Tag tone="danger">
                                      <Flag className="mr-1 inline h-2.5 w-2.5" /> Escalated
                                    </Tag>
                                  )}
                                  {!vendor && c.missingFields.length > 0 && (
                                    <Tag tone="danger">
                                      <AlertTriangle className="mr-1 inline h-2.5 w-2.5" />
                                      {c.missingFields.length}
                                    </Tag>
                                  )}
                                  {!vendor && c.missingDocs.length > 0 && (
                                    <Tag tone="neutral">
                                      <FileText className="mr-1 inline h-2.5 w-2.5" />
                                      {c.missingDocs.length}
                                    </Tag>
                                  )}
                                  {c.percent === 100 && <Tag tone="success">Complete</Tag>}
                                </div>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr key={`${p.id}-detail`}>
                                <td colSpan={9} style={{ background: CDS.off, padding: 0 }}>
                                  <PermitDetail
                                    permit={p}
                                    completeness={c}
                                    vendor={vendor}
                                    updating={updatingId === p.id}
                                    onStatus={(s) => changeStatus(p.id, s)}
                                  />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Reveal>
            )}
          </div>
        )}
      </PageShell>
    </PortalShell>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === k;
  return (
    <th
      className="cds-sortable"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      onClick={() => onSort(k)}
      style={{ color: active ? CDS.black : undefined }}
    >
      {label}
      <span style={{ marginLeft: 4, opacity: active ? 1 : 0.25 }}>
        {active && sort.dir === "desc" ? "▾" : "▴"}
      </span>
    </th>
  );
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
    <div className="grid grid-cols-1 gap-px lg:grid-cols-3" style={{ background: CDS.border }}>
      <div style={{ background: CDS.off, padding: 16 }}>
        <DetailHead>Timeline</DetailHead>
        <ul className="space-y-1.5">
          {timeline.map((t) => (
            <li key={t.label} className="flex items-baseline gap-2" style={{ fontSize: 12.5, color: CDS.gray }}>
              <span style={{ width: 8, height: 8, background: CDS.teal, display: "inline-block" }} />
              <span style={{ color: CDS.black, fontWeight: 500 }}>{t.label}</span>
              <span className="ml-auto tabular-nums" style={{ fontSize: 11.5 }}>
                {new Date(t.at as string).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 min-w-0 flex-1" style={{ background: CDS.off2 }}>
            <div style={{ height: "100%", width: `${completeness.percent}%`, background: CDS.teal }} />
          </div>
          <span className="tabular-nums" style={{ fontSize: 11, color: CDS.gray }}>
            {completeness.done}/{completeness.total}
          </span>
        </div>
      </div>

      <div style={{ background: CDS.off, padding: 16 }}>
        <DetailHead>Documents</DetailHead>
        {docs.length === 0 ? (
          <p style={{ fontSize: 12.5, color: CDS.grayLt }}>No documents attached.</p>
        ) : (
          <ul className="space-y-1.5">
            {docs.slice(0, 6).map((d) => (
              <li key={d.key} className="flex min-w-0 items-center gap-2" style={{ fontSize: 12.5 }}>
                <span className="min-w-0 flex-1 truncate" style={{ color: CDS.black }}>
                  {d.label}
                </span>
                <Tag tone={toneForStatus(d.status === "uploaded" ? "verified" : d.status)}>
                  {d.status.replace("_", " ")}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ background: CDS.off, padding: 16 }}>
        <DetailHead>Notes & controls</DetailHead>
        <p style={{ fontSize: 12.5, color: CDS.gray }}>
          {permit.additional_notes || permit.description || "No notes on this permit."}
        </p>
        {vendor && (
          <p style={{ fontSize: 11.5, color: CDS.grayLt, marginTop: 6 }}>
            Managed by {vendor} — record copy only.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={permit.status}
            disabled={updating}
            onChange={(e) => onStatus(e.target.value as PermitStatus)}
            aria-label="Change status"
            style={{ fontSize: 13, padding: "8px 10px" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Link to="/portal/permits/$id" params={{ id: permit.id }} className="p-btn p-btn-ghost">
            Open permit <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: CDS.grayLt,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
