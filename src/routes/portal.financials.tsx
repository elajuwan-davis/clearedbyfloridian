import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ChevronDown, ChevronRight, Pencil, Check, X } from "lucide-react";
import { listPermits, updatePermit, type PermitRow, type PermitStatus } from "@/lib/permits-api";
import { listAllFees, fmtUsd, parseDollarsToCents, type ManualFee } from "@/lib/manual-fees";
import { BeforeClearedPanel } from "@/components/before-cleared-panel";
import { toast } from "sonner";

export const Route = createFileRoute("/portal/financials")({
  head: () => ({
    meta: [
      { title: "Permit Financials — Cleard" },
      { name: "description", content: "Running financial summary across all permits — municipal permit fees plus Cleard service fees." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FinancialsPage,
});

const OBSIDIAN = "#153157";

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

const STATUS_TONE: Record<PermitStatus, string> = {
  submitted: "bg-sky-600/10 text-sky-700 border-sky-600/30",
  in_review: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  corrections_required: "bg-oxblood/10 text-oxblood border-oxblood/30",
  approved: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
  permit_issued: "bg-obsidian text-white border-obsidian",
  on_hold: "bg-neutral-500/10 text-neutral-700 border-neutral-500/30",
  outsourced_permitting: "bg-violet-600/10 text-violet-700 border-violet-600/30",
  cancelled: "bg-neutral-400/10 text-neutral-600 border-neutral-400/30",
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
      n.has(id) ? n.delete(id) : n.add(id);
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <header className="border-b border-obsidian/10 pb-8">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} /> Finance
        </div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Permit Financials</h1>
        <p className="mt-3 text-sm text-obsidian/60 max-w-2xl">
          Running summary of municipal permit fees and Cleard service fees across every project.
        </p>
      </header>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-obsidian/10">
        {([
          { k: "with", l: "With Cleard" },
          { k: "before", l: "Before Cleard" },
        ] as const).map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] border-b-2 -mb-px transition-colors"
              style={{
                borderColor: active ? OBSIDIAN : "transparent",
                color: active ? OBSIDIAN : "rgba(21,49,87,0.5)",
              }}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {tab === "before" ? (
        <div className="mt-8">
          <BeforeClearedPanel withClearedTotal={totals.combined} />
        </div>
      ) : (
      <>
      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Permit Fees" value={fmtUsd(totals.permitFees)} accent />
        <SummaryCard label="Total Cleard Fees" value={fmtUsd(totals.clearedFees)} accent />
        <SummaryCard label="Combined Investment" value={fmtUsd(totals.combined)} dark />
        <SummaryCard label="Active Permits" value={String(totals.active)} accent />
      </div>

      {/* Filters */}
      <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60 block mb-1.5">
            Status
          </label>
          <div className="flex flex-wrap gap-1">
            {(["all", "pending", "permit_issued", "on_hold"] as const).map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] border transition-colors"
                  style={{
                    background: active ? OBSIDIAN : "transparent",
                    color: active ? "#fff" : OBSIDIAN,
                    borderColor: active ? OBSIDIAN : "rgba(21,49,87,0.2)",
                  }}
                >
                  {s === "all" ? "All" : s === "pending" ? "Pending" : s === "permit_issued" ? "Issued" : "On Hold"}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60 block mb-1.5">
            Municipality
          </label>
          <select
            value={muni}
            onChange={(e) => setMuni(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-obsidian/20 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
          >
            <option value="all">All municipalities</option>
            {municipalities.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60 block mb-1.5">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-obsidian/20 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60 block mb-1.5">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-obsidian/20 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
        <div
          className="grid gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ background: OBSIDIAN, color: "#fff", gridTemplateColumns: "24px 1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr 0.9fr" }}
        >
          <div></div>
          <div>Project</div>
          <div>Municipality</div>
          <div>Status</div>
          <div className="text-right">Permit Fee(s)</div>
          <div className="text-right">Cleard Fee</div>
          <div className="text-right">Total</div>
          <div>Permit #</div>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-obsidian/60">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-obsidian/60">No projects match these filters.</div>
        ) : (
          filtered.map((p, i) => {
            const projFees = feesByProject.get(p.id) ?? [];
            const permitFeeTotal = projFees.reduce((s, f) => s + f.amountCents, 0);
            const clearedFee = p.cleared_fee_cents ?? 0;
            const total = permitFeeTotal + clearedFee;
            const isOpen = expanded.has(p.id);
            const alt = i % 2 === 1;
            const editing = editId === p.id;
            return (
              <div key={p.id} className="border-t border-obsidian/10 first:border-t-0">
                <div
                  className="grid gap-4 px-5 py-3.5 items-center text-sm"
                  style={{
                    gridTemplateColumns: "24px 1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr 0.9fr",
                    background: alt ? "rgba(21,49,87,0.025)" : "#fff",
                  }}
                >
                  <button
                    onClick={() => toggle(p.id)}
                    disabled={projFees.length === 0}
                    className="text-obsidian/50 hover:text-obsidian disabled:opacity-20"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="text-obsidian font-medium truncate">{p.project_name}</div>
                    <div className="text-[11px] text-obsidian/50 truncate">{p.job_address}</div>
                  </div>
                  <div className="text-obsidian/75 text-[13px]">{p.municipality || "—"}</div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_TONE[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <div
                    className="text-right font-mono text-obsidian tabular-nums"
                    title={
                      projFees.length
                        ? projFees.map((f) => `${f.feeType}: ${fmtUsd(f.amountCents)}`).join("\n")
                        : "No fees logged"
                    }
                  >
                    {fmtUsd(permitFeeTotal)}
                    {projFees.length > 0 && (
                      <div className="text-[10px] text-obsidian/50 font-sans">
                        {projFees.length} entr{projFees.length === 1 ? "y" : "ies"}
                      </div>
                    )}
                  </div>
                  <div className="text-right font-mono text-obsidian tabular-nums">
                    {editing ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-obsidian/60">$</span>
                        <input
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          autoFocus
                          className="w-20 px-1.5 py-0.5 text-right text-sm border border-obsidian/30 rounded-[3px]"
                        />
                        <button onClick={() => saveEdit(p.id)} className="text-emerald-700 hover:text-emerald-800" aria-label="Save">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditId(null)} className="text-obsidian/50 hover:text-oxblood" aria-label="Cancel">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{fmtUsd(clearedFee)}</span>
                        <button
                          onClick={() => openEdit(p)}
                          className="text-obsidian/40 hover:text-obsidian"
                          aria-label="Edit Cleard fee"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-right font-mono text-obsidian tabular-nums font-semibold">{fmtUsd(total)}</div>
                  <div className="font-mono text-[12px] text-obsidian/75">{p.permit_number || "—"}</div>
                </div>
                {isOpen && projFees.length > 0 && (
                  <div className="px-5 py-3 border-t border-obsidian/10 bg-obsidian/[0.02]">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-2">
                      Fee Breakdown
                    </div>
                    <div className="space-y-1">
                      {projFees.map((f) => (
                        <div key={f.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] gap-4 text-[13px] text-obsidian/80">
                          <div>{f.feeType}</div>
                          <div className="font-mono text-[12px] text-obsidian/60">{f.datePaid}</div>
                          <div className="text-obsidian/50 text-[12px] truncate">{f.notes || ""}</div>
                          <div className="text-right font-mono tabular-nums">{fmtUsd(f.amountCents)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div
            className="grid gap-4 px-5 py-4 border-t-2 items-center text-sm font-mono tabular-nums"
            style={{
              gridTemplateColumns: "24px 1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr 0.9fr",
              background: OBSIDIAN,
              color: "#fff",
              borderColor: OBSIDIAN,
            }}
          >
            <div></div>
            <div className="uppercase text-[10px] tracking-[0.16em]">
              Filtered Totals · {filtered.length} project{filtered.length === 1 ? "" : "s"}
            </div>
            <div></div>
            <div></div>
            <div className="text-right">{fmtUsd(filteredTotals.permitFees)}</div>
            <div className="text-right">{fmtUsd(filteredTotals.clearedFees)}</div>
            <div className="text-right font-semibold text-[15px]" style={{ color: "#B6DAEA" }}>
              {fmtUsd(filteredTotals.combined)}
            </div>
            <div></div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent, dark }: { label: string; value: string; accent?: boolean; dark?: boolean }) {
  return (
    <div
      className="rounded-[3px] border p-5"
      style={
        dark
          ? { background: OBSIDIAN, color: "#fff", borderColor: OBSIDIAN }
          : { background: "#fff", borderColor: "rgba(21,49,87,0.15)", borderLeft: accent ? `3px solid ${OBSIDIAN}` : undefined }
      }
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: dark ? "rgba(255,255,255,0.7)" : "rgba(21,49,87,0.6)" }}
      >
        {label}
      </div>
      <div
        className="mt-2 tabular-nums"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "34px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: dark ? "#B6DAEA" : OBSIDIAN,
        }}
      >
        {value}
      </div>
    </div>
  );
}
