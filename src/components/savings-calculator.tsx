import { useMemo, useState } from "react";
import { Calculator, TrendingDown, ArrowRight, Plus, Trash2 } from "lucide-react";
import { PRIOR_TRADES } from "@/lib/prior-permits-api";
import { fmtUsd, parseDollarsToCents } from "@/lib/manual-fees";

const OBSIDIAN = "#153157";
const GREEN = "#16a34a";
const AMBER = "#d97706";

type TradeFee = { id: string; trade: string; amount_cents: number };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function SavingsCalculator() {
  const [trades, setTrades] = useState<TradeFee[]>([
    { id: uid(), trade: "House", amount_cents: 0 },
    { id: uid(), trade: "Pool", amount_cents: 0 },
  ]);
  const [gcFee, setGcFee] = useState("");
  const [clearedFee, setClearedFee] = useState("8856"); // Cléared flat admin fee default
  const [clearedMode, setClearedMode] = useState<"flat" | "pct">("flat");
  const [clearedPct, setClearedPct] = useState("1.5");
  const [constructionValue, setConstructionValue] = useState("");

  const perTradeTotal = useMemo(
    () => trades.reduce((s, t) => s + t.amount_cents, 0),
    [trades],
  );

  const gcFeeCents = parseDollarsToCents(gcFee);
  const cv = Number(constructionValue) || 0;

  const clearedFeeCents = useMemo(() => {
    if (clearedMode === "flat") return parseDollarsToCents(clearedFee);
    const pct = Number(clearedPct) || 0;
    return Math.round(cv * (pct / 100) * 100);
  }, [clearedMode, clearedFee, clearedPct, cv]);

  const bundledTotal = gcFeeCents + clearedFeeCents;
  const savings = perTradeTotal - bundledTotal;
  const positive = savings > 0;

  function addTrade() {
    const used = new Set(trades.map((t) => t.trade));
    const next = PRIOR_TRADES.find((t) => !used.has(t)) ?? "Other";
    setTrades((cur) => [...cur, { id: uid(), trade: next, amount_cents: 0 }]);
  }
  function removeTrade(id: string) {
    setTrades((cur) => cur.filter((t) => t.id !== id));
  }
  function updateTrade(id: string, patch: Partial<TradeFee>) {
    setTrades((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-obsidian/10 pb-6">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} /> Savings Mode
        </div>
        <h2 className="display-serif mt-3 text-3xl sm:text-4xl text-obsidian">Bundle vs. Per-Trade</h2>
        <p className="mt-2 text-sm text-obsidian/60">
          Compare a traditional per-trade permit approach with a bundled GC permit filed through Cléared.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
        {/* LEFT — Per-trade */}
        <section className="border border-obsidian/15 bg-white rounded-[3px] p-5 flex flex-col">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/60">
            Per-Trade Approach
          </div>
          <div className="display-serif text-2xl text-obsidian mt-1">Separate Permits, One Per Trade</div>
          <p className="mt-1 text-[11px] text-obsidian/50">
            Enter each trade's individual permit fee.
          </p>

          <div className="mt-4 space-y-2 flex-1">
            {trades.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_140px_28px] gap-2 items-center">
                <select
                  value={t.trade}
                  onChange={(e) => updateTrade(t.id, { trade: e.target.value })}
                  className="px-2.5 py-1.5 border border-obsidian/15 rounded-[3px] text-sm bg-white"
                >
                  {PRIOR_TRADES.map((tr) => (
                    <option key={tr} value={tr}>{tr}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-obsidian/50 text-sm">$</span>
                  <input
                    type="number"
                    value={t.amount_cents === 0 ? "" : (t.amount_cents / 100).toString()}
                    onChange={(e) =>
                      updateTrade(t.id, { amount_cents: parseDollarsToCents(e.target.value) })
                    }
                    placeholder="0.00"
                    className="w-full px-2 py-1.5 border border-obsidian/15 rounded-[3px] text-sm text-right font-mono tabular-nums"
                  />
                </div>
                <button
                  onClick={() => removeTrade(t.id)}
                  disabled={trades.length === 1}
                  className="text-obsidian/40 hover:text-oxblood disabled:opacity-20"
                  aria-label="Remove trade"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addTrade}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sky hover:opacity-70 mt-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add trade
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-obsidian/10">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">
              Per-Trade Total
            </div>
            <div
              className="mt-1 tabular-nums text-obsidian"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              {fmtUsd(perTradeTotal)}
            </div>
          </div>
        </section>

        {/* MIDDLE — savings badge */}
        <div className="flex lg:flex-col items-center justify-center gap-3 py-4">
          <ArrowRight className="hidden lg:block h-6 w-6 text-obsidian/25" />
          <div
            className="rounded-[3px] px-5 py-6 text-center min-w-[220px] border"
            style={{
              background: positive ? "rgba(22,163,74,0.08)" : savings < 0 ? "rgba(217,119,6,0.08)" : "rgba(21,49,87,0.04)",
              borderColor: positive ? "rgba(22,163,74,0.35)" : savings < 0 ? "rgba(217,119,6,0.35)" : "rgba(21,49,87,0.15)",
            }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: positive ? GREEN : savings < 0 ? AMBER : OBSIDIAN }}>
              {positive ? "You Save" : savings < 0 ? "Bundle costs more" : "No difference yet"}
            </div>
            <div
              className="mt-2 tabular-nums"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 48,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: positive ? GREEN : savings < 0 ? AMBER : OBSIDIAN,
              }}
            >
              {fmtUsd(Math.abs(savings))}
            </div>
            <div className="mt-1 text-[11px] text-obsidian/55">
              by bundling through Cléared
            </div>
          </div>
          <ArrowRight className="hidden lg:block h-6 w-6 text-obsidian/25 rotate-180" />
        </div>

        {/* RIGHT — Bundled */}
        <section
          className="rounded-[3px] p-5 flex flex-col"
          style={{ background: OBSIDIAN, color: "#fff" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
            Bundled via Cléared
          </div>
          <div className="display-serif text-2xl mt-1">One Master GC Permit</div>
          <p className="mt-1 text-[11px] text-white/50">
            Single filing covers all trades under the GC permit.
          </p>

          <div className="mt-4 space-y-3 flex-1">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55 block mb-1">
                Construction Value (optional)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-white/50 text-sm">$</span>
                <input
                  type="number"
                  value={constructionValue}
                  onChange={(e) => setConstructionValue(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1.5 rounded-[3px] text-sm text-right font-mono tabular-nums text-white bg-white/5 border border-white/15 placeholder:text-white/30"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55 block mb-1">
                Master GC Permit Fee
              </label>
              <div className="flex items-center gap-1">
                <span className="text-white/50 text-sm">$</span>
                <input
                  type="number"
                  value={gcFee}
                  onChange={(e) => setGcFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 rounded-[3px] text-sm text-right font-mono tabular-nums text-white bg-white/5 border border-white/15 placeholder:text-white/30"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                Typical: construction value × 1.5% (before HB 803 reduction).
              </p>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55 block mb-1">
                Cléared Service Fee
              </label>
              <div className="flex gap-2">
                <div className="inline-flex border border-white/15 rounded-[3px] overflow-hidden">
                  {(["flat", "pct"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setClearedMode(m)}
                      className="px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] font-mono"
                      style={{
                        background: clearedMode === m ? "#B6DAEA" : "transparent",
                        color: clearedMode === m ? OBSIDIAN : "rgba(255,255,255,0.75)",
                      }}
                    >
                      {m === "flat" ? "Flat $" : "% of Value"}
                    </button>
                  ))}
                </div>
                {clearedMode === "flat" ? (
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-white/50 text-sm">$</span>
                    <input
                      type="number"
                      value={clearedFee}
                      onChange={(e) => setClearedFee(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-[3px] text-sm text-right font-mono tabular-nums text-white bg-white/5 border border-white/15"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={clearedPct}
                      onChange={(e) => setClearedPct(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-[3px] text-sm text-right font-mono tabular-nums text-white bg-white/5 border border-white/15"
                    />
                    <span className="text-white/50 text-sm">%</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/40 mt-1">
                {clearedMode === "flat"
                  ? "Default: $8,856 flat admin fee."
                  : `= ${fmtUsd(clearedFeeCents)} on ${fmtUsd(Math.round(cv * 100))} construction value.`}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="grid grid-cols-2 gap-3 text-[11px] text-white/60">
              <div className="flex justify-between">
                <span>GC Permit</span>
                <span className="font-mono tabular-nums text-white">{fmtUsd(gcFeeCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cléared</span>
                <span className="font-mono tabular-nums text-white">{fmtUsd(clearedFeeCents)}</span>
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55 mt-3">
              Bundled Total
            </div>
            <div
              className="mt-1 tabular-nums"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 500, letterSpacing: "-0.01em", color: "#B6DAEA" }}
            >
              {fmtUsd(bundledTotal)}
            </div>
          </div>
        </section>
      </div>

      <p className="text-[11px] text-obsidian/50">
        <Calculator className="inline h-3 w-3 mr-1 -mt-0.5" strokeWidth={1.5} />
        Estimates only. Actual permit fees vary by municipality, construction valuation, and applicable statutory surcharges.
      </p>
    </div>
  );
}
