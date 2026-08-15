import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PRIOR_TRADES } from "@/lib/prior-permits-api";
import { fmtUsd, parseDollarsToCents } from "@/lib/manual-fees";
import { Panel, Segmented } from "@/components/ui-kit";

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
  const [clearedFee, setClearedFee] = useState("8856");
  const [clearedMode, setClearedMode] = useState<"flat" | "pct">("flat");
  const [clearedPct, setClearedPct] = useState("1.5");
  const [constructionValue, setConstructionValue] = useState("");

  const perTradeTotal = useMemo(() => trades.reduce((s, t) => s + t.amount_cents, 0), [trades]);

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
    <Panel
      title="Bundle vs. per-trade"
      meta={
        positive
          ? `Saves ${fmtUsd(savings)} bundled`
          : savings < 0
            ? `Bundle costs ${fmtUsd(-savings)} more`
            : "No difference yet"
      }
    >
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {/* Per-trade */}
        <div className="p-plate flex min-w-0 flex-col gap-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Per-trade approach
            </span>
            <button
              onClick={addTrade}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> Trade
            </button>
          </div>
          <div className="max-h-[180px] space-y-1.5 overflow-auto pr-0.5">
            {trades.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_100px_20px] items-center gap-1.5">
                <select
                  value={t.trade}
                  onChange={(e) => updateTrade(t.id, { trade: e.target.value })}
                  className="p-inset h-7 min-w-0 bg-transparent px-1.5 text-[12px]"
                >
                  {PRIOR_TRADES.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={t.amount_cents === 0 ? "" : (t.amount_cents / 100).toString()}
                  onChange={(e) =>
                    updateTrade(t.id, { amount_cents: parseDollarsToCents(e.target.value) })
                  }
                  placeholder="0.00"
                  className="p-inset h-7 w-full bg-transparent px-1.5 text-right text-[12px] tabular-nums"
                />
                <button
                  onClick={() => removeTrade(t.id)}
                  disabled={trades.length === 1}
                  className="text-muted-foreground transition-colors hover:text-[#F87171] disabled:opacity-25"
                  aria-label="Remove trade"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-auto border-t pt-2" style={{ borderColor: "var(--p-border)" }}>
            <div className="text-[11px] text-muted-foreground">Per-trade total</div>
            <div className="text-[20px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
              {fmtUsd(perTradeTotal)}
            </div>
          </div>
        </div>

        {/* Bundled */}
        <div className="p-plate flex min-w-0 flex-col gap-2 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              Bundled via Cleard
            </span>
            <Segmented
              value={clearedMode}
              onChange={setClearedMode}
              options={[
                { value: "flat", label: "Flat" },
                { value: "pct", label: "%" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Row label="Construction value">
              <input
                type="number"
                value={constructionValue}
                onChange={(e) => setConstructionValue(e.target.value)}
                placeholder="0"
                className="p-inset h-7 w-full bg-transparent px-1.5 text-right text-[12px] tabular-nums"
              />
            </Row>
            <Row label="Master GC permit fee">
              <input
                type="number"
                value={gcFee}
                onChange={(e) => setGcFee(e.target.value)}
                placeholder="0.00"
                className="p-inset h-7 w-full bg-transparent px-1.5 text-right text-[12px] tabular-nums"
              />
            </Row>
            <Row label={clearedMode === "flat" ? "Cleard fee ($)" : "Cleard fee (%)"}>
              <input
                type="number"
                step={clearedMode === "flat" ? "1" : "0.1"}
                value={clearedMode === "flat" ? clearedFee : clearedPct}
                onChange={(e) =>
                  clearedMode === "flat"
                    ? setClearedFee(e.target.value)
                    : setClearedPct(e.target.value)
                }
                className="p-inset h-7 w-full bg-transparent px-1.5 text-right text-[12px] tabular-nums"
              />
            </Row>
          </div>
          <div className="mt-auto border-t pt-2" style={{ borderColor: "var(--p-border)" }}>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>GC permit {fmtUsd(gcFeeCents)}</span>
              <span>Cleard {fmtUsd(clearedFeeCents)}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Bundled total</div>
            <div className="text-[20px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
              {fmtUsd(bundledTotal)}
            </div>
          </div>
        </div>

        {/* Delta */}
        <div className="p-plate flex min-w-0 flex-col justify-center gap-1.5 px-3 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {positive ? "You save" : savings < 0 ? "Bundle costs more" : "Difference"}
          </span>
          <div
            className={`text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${
              positive ? "text-[#4ADE80]" : savings < 0 ? "text-[#FBBF24]" : ""
            }`}
          >
            {fmtUsd(Math.abs(savings))}
          </div>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Estimates only — permit fees vary by municipality, valuation, and statutory surcharges.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_110px] items-center gap-2">
      <span className="truncate text-[12px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
