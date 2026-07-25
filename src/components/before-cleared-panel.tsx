import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2, Calculator, TrendingDown } from "lucide-react";
import {
  listPriorPermits,
  createPriorPermit,
  deletePriorPermit,
  PRIOR_TRADES,
  type PriorPermitRow,
  type PriorTrade,
} from "@/lib/prior-permits-api";
import { fmtUsd, parseDollarsToCents } from "@/lib/manual-fees";
import { toast } from "sonner";

const OBSIDIAN = "#153157";
const GREEN = "#16a34a";

function todayYm() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function BeforeClearedPanel({ withClearedTotal }: { withClearedTotal: number }) {
  const [rows, setRows] = useState<PriorPermitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // form state
  const [permitNo, setPermitNo] = useState("");
  const [label, setLabel] = useState("");
  const [datePulled, setDatePulled] = useState(todayYm());
  const [trades, setTrades] = useState<PriorTrade[]>([]);

  useEffect(() => {
    let alive = true;
    listPriorPermits()
      .then((r) => alive && setRows(r))
      .catch(() => toast.error("Failed to load prior permits"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const beforeTotal = useMemo(() => rows.reduce((s, r) => s + r.total_cents, 0), [rows]);
  const savings = beforeTotal - withClearedTotal;
  const avgPerPermit = rows.length > 0 ? savings / rows.length : 0;

  // annualized projection based on cadence of logged prior permits
  const projectedAnnual = useMemo(() => {
    if (rows.length < 2) return null;
    const dates = rows
      .map((r) => r.date_pulled)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);
    if (dates.length < 2) return null;
    const spanMs = dates[dates.length - 1] - dates[0];
    if (spanMs <= 0) return null;
    const spanYears = spanMs / (365.25 * 24 * 60 * 60 * 1000);
    if (spanYears < 0.08) return null; // avoid wild extrapolation
    return savings / spanYears;
  }, [rows, savings]);

  const formTotal = useMemo(() => trades.reduce((s, t) => s + t.fee_cents, 0), [trades]);

  function toggleTrade(t: string) {
    setTrades((cur) => {
      if (cur.find((x) => x.trade === t)) return cur.filter((x) => x.trade !== t);
      return [...cur, { trade: t, fee_cents: 0 }];
    });
  }

  function setTradeFee(t: string, val: string) {
    const cents = parseDollarsToCents(val);
    setTrades((cur) => cur.map((x) => (x.trade === t ? { ...x, fee_cents: cents } : x)));
  }

  function resetForm() {
    setPermitNo("");
    setLabel("");
    setDatePulled(todayYm());
    setTrades([]);
  }

  async function save() {
    if (!label.trim()) return toast.error("Add a project nickname or address");
    if (trades.length === 0) return toast.error("Select at least one trade");
    try {
      const row = await createPriorPermit({
        permit_number: permitNo || null,
        project_label: label.trim(),
        trades,
        total_cents: formTotal,
        date_pulled: datePulled || null,
      });
      setRows((r) => [row, ...r]);
      setFormOpen(false);
      resetForm();
      toast.success("Prior permit logged");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this prior permit?")) return;
    try {
      await deletePriorPermit(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="space-y-8">
      {/* Savings Summary */}
      <div
        className="rounded-[3px] border overflow-hidden"
        style={{ background: OBSIDIAN, color: "#fff", borderColor: OBSIDIAN }}
      >
        <div className="p-6 sm:p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} /> Savings Summary
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                Before Cleard
              </div>
              <div
                className="mt-2 tabular-nums"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 500, letterSpacing: "-0.01em" }}
              >
                {fmtUsd(beforeTotal)}
              </div>
              <div className="text-[11px] text-white/50 mt-1">
                {rows.length} prior permit{rows.length === 1 ? "" : "s"} logged
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                With Cleard
              </div>
              <div
                className="mt-2 tabular-nums"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 500, letterSpacing: "-0.01em" }}
              >
                {fmtUsd(withClearedTotal)}
              </div>
              <div className="text-[11px] text-white/50 mt-1">Permit + Cleard fees, live system</div>
            </div>
            <div
              className="rounded-[3px] p-5 border"
              style={{
                background: "rgba(22,163,74,0.14)",
                borderColor: "rgba(22,163,74,0.5)",
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: "#86efac" }}>
                Total Savings
              </div>
              <div
                className="mt-2 tabular-nums"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 48,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: savings >= 0 ? "#4ade80" : "#fca5a5",
                }}
              >
                {savings >= 0 ? "" : "−"}
                {fmtUsd(Math.abs(savings))}
              </div>
              <div className="text-[11px] text-white/60 mt-1">
                {rows.length > 0 && `Avg ${fmtUsd(Math.abs(avgPerPermit))} / permit`}
                {projectedAnnual !== null && (
                  <>
                    {" · "}Projected {fmtUsd(Math.abs(projectedAnnual))} / yr
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 sm:px-8 py-4 flex flex-wrap gap-3 items-center justify-between bg-black/10">
          <div className="text-[11px] text-white/55">
            Log every permit you pulled before Cleard to build your baseline.
          </div>
          <div className="flex gap-2">
            <Link
              to="/fee-calculator"
              search={{ mode: "savings" } as any}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-white/20 text-white/90 hover:bg-white/10 font-mono text-[10px] uppercase tracking-[0.14em]"
            >
              <Calculator className="h-3.5 w-3.5" /> Calculate Savings
            </Link>
            <button
              onClick={() => setFormOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ background: "#B6DAEA", color: OBSIDIAN }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Prior Permit
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="border border-obsidian/15 bg-white rounded-[3px] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60 mb-4">
            New Prior Permit
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Project / Address *">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. 123 Ocean Blvd or Smith Residence"
                className="w-full px-3 py-2 border border-obsidian/20 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
              />
            </Field>
            <Field label="Permit #">
              <input
                value={permitNo}
                onChange={(e) => setPermitNo(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-obsidian/20 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
              />
            </Field>
            <Field label="Date Pulled">
              <input
                type="month"
                value={datePulled.slice(0, 7)}
                onChange={(e) => setDatePulled(e.target.value + "-01")}
                className="w-full px-3 py-2 border border-obsidian/20 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--sky)]/40"
              />
            </Field>
          </div>

          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-2">
              Trades Included
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRIOR_TRADES.map((t) => {
                const on = !!trades.find((x) => x.trade === t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTrade(t)}
                    className="px-2.5 py-1 rounded-[3px] border font-mono text-[10px] uppercase tracking-[0.12em]"
                    style={{
                      background: on ? OBSIDIAN : "transparent",
                      color: on ? "#fff" : OBSIDIAN,
                      borderColor: on ? OBSIDIAN : "rgba(21,49,87,0.25)",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {trades.length > 0 && (
            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-2">
                Fee Paid Per Trade
              </div>
              <div className="border border-obsidian/10 rounded-[3px] divide-y divide-obsidian/10">
                {trades.map((t) => (
                  <div key={t.trade} className="grid grid-cols-[1fr_160px] gap-3 items-center px-3 py-2">
                    <div className="text-sm text-obsidian">{t.trade}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-obsidian/50 text-sm">$</span>
                      <input
                        type="number"
                        value={t.fee_cents === 0 ? "" : (t.fee_cents / 100).toString()}
                        onChange={(e) => setTradeFee(t.trade, e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1 border border-obsidian/20 rounded-[3px] text-sm text-right font-mono tabular-nums"
                      />
                    </div>
                  </div>
                ))}
                <div
                  className="grid grid-cols-[1fr_160px] gap-3 items-center px-3 py-2.5"
                  style={{ background: OBSIDIAN, color: "#fff" }}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em]">Total Paid</div>
                  <div className="text-right font-mono tabular-nums font-semibold">{fmtUsd(formTotal)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="px-4 py-2 rounded-[3px] border border-obsidian/20 text-obsidian text-sm hover:bg-obsidian/5"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-4 py-2 rounded-[3px] text-sm font-medium"
              style={{ background: OBSIDIAN, color: "#fff" }}
            >
              Save Prior Permit
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
        <div
          className="grid gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ background: OBSIDIAN, color: "#fff", gridTemplateColumns: "1.4fr 1.6fr 0.7fr 0.9fr 32px" }}
        >
          <div>Project</div>
          <div>Trades</div>
          <div>Date</div>
          <div className="text-right">Total Paid</div>
          <div></div>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-obsidian/60">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-obsidian/60">
            No prior permits logged yet. Click "Add Prior Permit" to start building your baseline.
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={r.id}
              className="grid gap-4 px-5 py-3 items-center text-sm border-t border-obsidian/10 first:border-t-0"
              style={{
                gridTemplateColumns: "1.4fr 1.6fr 0.7fr 0.9fr 32px",
                background: i % 2 === 1 ? "rgba(21,49,87,0.025)" : "#fff",
              }}
            >
              <div className="min-w-0">
                <div className="text-obsidian font-medium truncate">{r.project_label}</div>
                {r.permit_number && (
                  <div className="text-[11px] text-obsidian/50 font-mono">{r.permit_number}</div>
                )}
              </div>
              <div className="text-[12px] text-obsidian/75 truncate">
                {r.trades.map((t) => t.trade).join(", ")}
              </div>
              <div className="font-mono text-[12px] text-obsidian/70">
                {r.date_pulled ? new Date(r.date_pulled).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
              </div>
              <div className="text-right font-mono tabular-nums text-obsidian">
                {fmtUsd(r.total_cents)}
              </div>
              <button
                onClick={() => remove(r.id)}
                className="text-obsidian/40 hover:text-oxblood"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
        {rows.length > 0 && (
          <div
            className="grid gap-4 px-5 py-3 items-center font-mono tabular-nums border-t-2"
            style={{
              gridTemplateColumns: "1.4fr 1.6fr 0.7fr 0.9fr 32px",
              background: OBSIDIAN,
              color: "#fff",
              borderColor: OBSIDIAN,
            }}
          >
            <div className="uppercase text-[10px] tracking-[0.16em]">Total · {rows.length} permits</div>
            <div></div>
            <div></div>
            <div className="text-right font-semibold" style={{ color: "#B6DAEA" }}>
              {fmtUsd(beforeTotal)}
            </div>
            <div></div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-obsidian/45" style={{ color: savings >= 0 ? undefined : GREEN }}>
        &nbsp;
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60 block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
