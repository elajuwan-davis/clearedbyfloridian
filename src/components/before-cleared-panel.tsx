import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, TrendingDown, Receipt, DollarSign } from "lucide-react";
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
import { MetricRow, StatTile, Panel, TableShell } from "@/components/ui-kit";

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
    <div className="space-y-2">
      <MetricRow className="mb-2 lg:grid-cols-3 xl:grid-cols-3">
        <StatTile
          label="Before Cleard"
          value={fmtUsd(beforeTotal)}
          context={`${rows.length} prior permit${rows.length === 1 ? "" : "s"} logged`}
          icon={<Receipt className="h-3 w-3" strokeWidth={1.75} />}
          tone="info"
        />
        <StatTile
          label="With Cleard"
          value={fmtUsd(withClearedTotal)}
          context="Permit + Cleard fees, live"
          icon={<DollarSign className="h-3 w-3" strokeWidth={1.75} />}
          tone="purple"
        />
        <StatTile
          label="Total savings"
          value={`${savings >= 0 ? "" : "−"}${fmtUsd(Math.abs(savings))}`}
          context={
            [
              rows.length > 0 ? `Avg ${fmtUsd(Math.abs(avgPerPermit))} / permit` : null,
              projectedAnnual !== null ? `${fmtUsd(Math.abs(projectedAnnual))} / yr` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Log prior permits to build a baseline"
          }
          icon={<TrendingDown className="h-3 w-3" strokeWidth={1.75} />}
          tone={savings >= 0 ? "success" : "danger"}
        />
      </MetricRow>

      <Panel
        title="Prior permits (before Cleard)"
        meta={`${rows.length} logged · ${fmtUsd(beforeTotal)}`}
        action={
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> {formOpen ? "Close" : "Add prior permit"}
          </button>
        }
        padded={false}
      >
        {formOpen && (
          <div
            className="space-y-2 border-b px-3 py-3"
            style={{ borderColor: "var(--p-border)" }}
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Project / address *"
                className="p-inset h-7 bg-transparent px-2 text-[12px]"
              />
              <input
                value={permitNo}
                onChange={(e) => setPermitNo(e.target.value)}
                placeholder="Permit # (optional)"
                className="p-inset h-7 bg-transparent px-2 text-[12px]"
              />
              <input
                type="month"
                aria-label="Date pulled"
                value={datePulled.slice(0, 7)}
                onChange={(e) => setDatePulled(e.target.value + "-01")}
                className="p-inset h-7 bg-transparent px-2 text-[12px]"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {PRIOR_TRADES.map((t) => {
                const on = !!trades.find((x) => x.trade === t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTrade(t)}
                    data-active={on}
                    className="p-inset px-2 py-0.5 text-[11px] data-[active=true]:bg-[color:var(--p-row-hover)] data-[active=true]:text-foreground"
                    style={{ color: on ? undefined : "var(--p-text-3)" }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {trades.length > 0 && (
              <div className="max-h-[160px] space-y-1 overflow-auto pr-0.5">
                {trades.map((t) => (
                  <div
                    key={t.trade}
                    className="grid grid-cols-[1fr_110px] items-center gap-2 text-[12px]"
                  >
                    <span className="truncate">{t.trade}</span>
                    <input
                      type="number"
                      value={t.fee_cents === 0 ? "" : (t.fee_cents / 100).toString()}
                      onChange={(e) => setTradeFee(t.trade, e.target.value)}
                      placeholder="0.00"
                      className="p-inset h-7 w-full bg-transparent px-1.5 text-right text-[12px] tabular-nums"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-muted-foreground">
                Total paid{" "}
                <span className="tabular-nums text-foreground">{fmtUsd(formTotal)}</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                  className="p-inset px-2.5 py-1 text-[11.5px] text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="p-inset bg-[color:var(--p-row-hover)] px-2.5 py-1 text-[11.5px] font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <TableShell maxHeight={280}>
          <thead>
            <tr>
              <th>Project</th>
              <th className="hidden md:table-cell">Trades</th>
              <th className="hidden sm:table-cell">Date</th>
              <th className="text-right">Total paid</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No prior permits logged yet — add one to build your baseline.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="min-w-0">
                    <div className="truncate font-medium">{r.project_label}</div>
                    {r.permit_number && (
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {r.permit_number}
                      </div>
                    )}
                  </td>
                  <td className="hidden max-w-[240px] truncate text-muted-foreground md:table-cell">
                    {r.trades.map((t) => t.trade).join(", ")}
                  </td>
                  <td className="hidden text-muted-foreground sm:table-cell">
                    {r.date_pulled
                      ? new Date(r.date_pulled).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="text-right tabular-nums">{fmtUsd(r.total_cents)}</td>
                  <td>
                    <button
                      onClick={() => remove(r.id)}
                      className="text-muted-foreground transition-colors hover:text-[#F87171]"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td className="font-semibold">Total · {rows.length} permits</td>
                <td className="hidden md:table-cell" />
                <td className="hidden sm:table-cell" />
                <td className="text-right font-semibold tabular-nums">{fmtUsd(beforeTotal)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </TableShell>
      </Panel>
    </div>
  );
}
