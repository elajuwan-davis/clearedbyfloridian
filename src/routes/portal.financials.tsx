import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  DollarSign,
  Receipt,
  FolderOpen,
} from "lucide-react";
import { listPermits, updatePermit, type PermitRow, type PermitStatus } from "@/lib/permits-api";
import { listAllFees, fmtUsd, parseDollarsToCents, type ManualFee } from "@/lib/manual-fees";
import { BeforeClearedPanel } from "@/components/before-cleared-panel";
import {
  PageShell,
  MetricRow,
  StatTile,
  StatusChip,
  Panel,
  Segmented,
  TableShell,
  type MetricTone,
} from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/financials")({
  head: () => ({
    meta: [
      { title: "Permit Financials — Cleard" },
      {
        name: "description",
        content:
          "Running financial summary across all permits — municipal permit fees plus Cleard service fees.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinancialsPage,
});

type StatusFilter = "all" | "pending" | "permit_issued" | "on_hold";

const STATUS_LABEL: Record<PermitStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  corrections_required: "Corrections",
  approved: "Approved",
  permit_issued: "Permit Issued",
  on_hold: "On Hold",
  outsourced_permitting: "Outsourced",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<PermitStatus, MetricTone> = {
  submitted: "info",
  in_review: "warning",
  corrections_required: "danger",
  approved: "success",
  permit_issued: "success",
  on_hold: "neutral",
  outsourced_permitting: "purple",
  cancelled: "neutral",
};

// "Pending" = anything not issued / on_hold / cancelled
function bucketOf(status: PermitStatus): "pending" | "permit_issued" | "on_hold" | "other" {
  if (status === "permit_issued") return "permit_issued";
  if (status === "on_hold") return "on_hold";
  if (status === "cancelled") return "other";
  return "pending";
}

function isActive(status: PermitStatus) {
  return status !== "on_hold" && status !== "cancelled";
}

function FinancialsPage() {
  const [tab, setTab] = useState<"with" | "before">("with");
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [fees, setFees] = useState<ManualFee[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [muni, setMuni] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  useEffect(() => {
    let alive = true;
    listPermits()
      .then((rows) => alive && setPermits(rows))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => alive && setLoading(false));
    const refreshFees = () => setFees(listAllFees());
    refreshFees();
    window.addEventListener("manual-fees:changed", refreshFees);
    return () => {
      alive = false;
      window.removeEventListener("manual-fees:changed", refreshFees);
    };
  }, []);

  const feesByProject = useMemo(() => {
    const m = new Map<string, ManualFee[]>();
    for (const f of fees) {
      const arr = m.get(f.projectId) ?? [];
      arr.push(f);
      m.set(f.projectId, arr);
    }
    return m;
  }, [fees]);

  const municipalities = useMemo(() => {
    const set = new Set<string>();
    for (const p of permits) if (p.municipality) set.add(p.municipality);
    return Array.from(set).sort();
  }, [permits]);

  const filtered = useMemo(() => {
    return permits.filter((p) => {
      if (statusFilter !== "all") {
        const b = bucketOf(p.status);
        if (statusFilter === "pending" && b !== "pending") return false;
        if (statusFilter === "permit_issued" && b !== "permit_issued") return false;
        if (statusFilter === "on_hold" && b !== "on_hold") return false;
      }
      if (muni !== "all" && p.municipality !== muni) return false;
      const d = p.submitted_date || p.created_at?.slice(0, 10);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      return true;
    });
  }, [permits, statusFilter, muni, from, to]);

  // Totals across all projects (unfiltered — always visible summary)
  const totals = useMemo(() => {
    let permitFees = 0;
    let clearedFees = 0;
    let active = 0;
    for (const p of permits) {
      permitFees += (feesByProject.get(p.id) ?? []).reduce((s, f) => s + f.amountCents, 0);
      clearedFees += p.cleared_fee_cents ?? 0;
      if (isActive(p.status)) active += 1;
    }
    return { permitFees, clearedFees, combined: permitFees + clearedFees, active };
  }, [permits, feesByProject]);

  const filteredTotals = useMemo(() => {
    let permitFees = 0;
    let clearedFees = 0;
    for (const p of filtered) {
      permitFees += (feesByProject.get(p.id) ?? []).reduce((s, f) => s + f.amountCents, 0);
      clearedFees += p.cleared_fee_cents ?? 0;
    }
    return { permitFees, clearedFees, combined: permitFees + clearedFees };
  }, [filtered, feesByProject]);

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function openEdit(p: PermitRow) {
    setEditId(p.id);
    setEditVal(((p.cleared_fee_cents ?? 0) / 100).toFixed(2));
  }

  async function saveEdit(id: string) {
    const cents = parseDollarsToCents(editVal);
    try {
      const updated = await updatePermit(id, { cleared_fee_cents: cents });
      setPermits((rows) => rows.map((r) => (r.id === id ? updated : r)));
      setEditId(null);
      toast.success("Cleard fee updated");
    } catch (err) {
      toast.error("Failed to save fee");
      console.error(err);
    }
  }

  return (
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Finance" }]}
      title="Financials"
      meta={
        loading
          ? "Loading…"
          : `${permits.length} projects · ${totals.active} active · ${fmtUsd(totals.combined)} combined`
      }
      actions={
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "with", label: "With Cléared" },
            { value: "before", label: "Before Cléared" },
          ]}
        />
      }
      toolbar={
        tab === "with" ? (
          <>
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "permit_issued", label: "Issued" },
                { value: "on_hold", label: "On hold" },
              ]}
            />
            <select
              value={muni}
              onChange={(e) => setMuni(e.target.value)}
              className="p-inset h-7 max-w-[190px] bg-transparent px-2 text-[12px]"
            >
              <option value="all">All municipalities</option>
              {municipalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="date"
              aria-label="From date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="p-inset h-7 bg-transparent px-2 text-[12px]"
            />
            <input
              type="date"
              aria-label="To date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="p-inset h-7 bg-transparent px-2 text-[12px]"
            />
            <span className="ml-auto hidden text-[11.5px] text-muted-foreground sm:inline">
              {filtered.length} shown
            </span>
          </>
        ) : undefined
      }
    >
      {tab === "before" ? (
        <BeforeClearedPanel withClearedTotal={totals.combined} />
      ) : (
        <>
          <MetricRow className="lg:grid-cols-4 xl:grid-cols-4">
            <StatTile
              label="Permit fees"
              value={fmtUsd(totals.permitFees)}
              context="Municipal, all projects"
              icon={<Receipt className="h-3 w-3" strokeWidth={1.75} />}
              tone="info"
            />
            <StatTile
              label="Cléared fees"
              value={fmtUsd(totals.clearedFees)}
              context="Service fees on file"
              icon={<DollarSign className="h-3 w-3" strokeWidth={1.75} />}
              tone="purple"
            />
            <StatTile
              label="Combined"
              value={fmtUsd(totals.combined)}
              context="Total investment"
              icon={<TrendingUp className="h-3 w-3" strokeWidth={1.75} />}
              tone="success"
            />
            <StatTile
              label="Active permits"
              value={String(totals.active)}
              context={`${permits.length} on file`}
              icon={<FolderOpen className="h-3 w-3" strokeWidth={1.75} />}
              tone="neutral"
            />
          </MetricRow>

          <Panel
            title="Fees by project"
            meta={`${filtered.length} shown · ${fmtUsd(filteredTotals.combined)}`}
            padded={false}
          >
            <TableShell>
              <thead>
                <tr>
                  <th className="w-8" />
                  <th>Project</th>
                  <th className="hidden md:table-cell">Municipality</th>
                  <th>Status</th>
                  <th className="text-right">Permit fees</th>
                  <th className="text-right">Cléared fee</th>
                  <th className="text-right">Total</th>
                  <th className="hidden lg:table-cell">Permit #</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No projects match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const projFees = feesByProject.get(p.id) ?? [];
                    const permitFeeTotal = projFees.reduce((s, f) => s + f.amountCents, 0);
                    const clearedFee = p.cleared_fee_cents ?? 0;
                    const total = permitFeeTotal + clearedFee;
                    const isOpen = expanded.has(p.id);
                    const editing = editId === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr>
                          <td>
                            <button
                              onClick={() => toggle(p.id)}
                              disabled={projFees.length === 0}
                              className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-25"
                              aria-label={isOpen ? "Collapse" : "Expand"}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="min-w-0">
                            <div className="truncate font-medium">{p.project_name}</div>
                            <div className="truncate text-[11.5px] text-muted-foreground">
                              {p.job_address}
                            </div>
                          </td>
                          <td className="hidden text-muted-foreground md:table-cell">
                            {p.municipality || "—"}
                          </td>
                          <td>
                            <StatusChip tone={STATUS_TONE[p.status]}>
                              {STATUS_LABEL[p.status]}
                            </StatusChip>
                          </td>
                          <td
                            className="text-right tabular-nums"
                            title={
                              projFees.length
                                ? projFees
                                    .map((f) => `${f.feeType}: ${fmtUsd(f.amountCents)}`)
                                    .join("\n")
                                : "No fees logged"
                            }
                          >
                            {fmtUsd(permitFeeTotal)}
                            {projFees.length > 0 && (
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                ({projFees.length})
                              </span>
                            )}
                          </td>
                          <td className="text-right tabular-nums">
                            {editing ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-muted-foreground">$</span>
                                <input
                                  value={editVal}
                                  onChange={(e) => setEditVal(e.target.value)}
                                  autoFocus
                                  className="p-inset h-6 w-20 bg-transparent px-1.5 text-right text-[12px]"
                                />
                                <button
                                  onClick={() => saveEdit(p.id)}
                                  className="text-[#4ADE80]"
                                  aria-label="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditId(null)}
                                  className="text-muted-foreground hover:text-[#F87171]"
                                  aria-label="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5">
                                {fmtUsd(clearedFee)}
                                <button
                                  onClick={() => openEdit(p)}
                                  className="text-muted-foreground transition-colors hover:text-foreground"
                                  aria-label="Edit Cléared fee"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                              </span>
                            )}
                          </td>
                          <td className="text-right font-semibold tabular-nums">{fmtUsd(total)}</td>
                          <td className="hidden text-muted-foreground lg:table-cell">
                            {p.permit_number || "—"}
                          </td>
                        </tr>
                        {isOpen && projFees.length > 0 && (
                          <tr>
                            <td />
                            <td colSpan={7} className="py-2">
                              <div className="space-y-1">
                                {projFees.map((f) => (
                                  <div
                                    key={f.id}
                                    className="grid grid-cols-[1.4fr_0.8fr_1fr_auto] items-center gap-3 text-[12px] text-muted-foreground"
                                  >
                                    <span className="truncate text-foreground">{f.feeType}</span>
                                    <span className="tabular-nums">{f.datePaid}</span>
                                    <span className="truncate">{f.notes || ""}</span>
                                    <span className="text-right tabular-nums text-foreground">
                                      {fmtUsd(f.amountCents)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr>
                    <td />
                    <td className="font-semibold">Filtered totals</td>
                    <td className="hidden md:table-cell" />
                    <td />
                    <td className="text-right tabular-nums">{fmtUsd(filteredTotals.permitFees)}</td>
                    <td className="text-right tabular-nums">{fmtUsd(filteredTotals.clearedFees)}</td>
                    <td className="text-right font-semibold tabular-nums text-[#4ADE80]">
                      {fmtUsd(filteredTotals.combined)}
                    </td>
                    <td className="hidden lg:table-cell" />
                  </tr>
                </tfoot>
              )}
            </TableShell>
          </Panel>
        </>
      )}
    </PageShell>
  );
}
