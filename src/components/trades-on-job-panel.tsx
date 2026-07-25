import { Users, AlertTriangle } from "lucide-react";

export type TradeEntry = { trade: string; companyName: string };

/**
 * Compact "who else is on the job" panel. Trade + company only — never
 * contact details, license numbers, or rates.
 *
 * Consolidation signals:
 * - Duplicate trades: flags the trade if two different companies cover it.
 * - >4 unique subs: nudges the GC that the project may be over-fragmented.
 */
export function TradesOnJobPanel({
  trades,
  title = "Trades on this Job",
  emptyLabel = "No other trades on this job yet.",
}: {
  trades: TradeEntry[];
  title?: string;
  emptyLabel?: string;
}) {
  // Detect duplicate trades — same trade covered by 2+ different companies.
  const byTrade = new Map<string, Set<string>>();
  for (const t of trades) {
    if (!t.companyName?.trim()) continue;
    const set = byTrade.get(t.trade) ?? new Set<string>();
    set.add(t.companyName.trim().toLowerCase());
    byTrade.set(t.trade, set);
  }
  const duplicateTrades = new Set(
    Array.from(byTrade.entries()).filter(([, set]) => set.size > 1).map(([k]) => k),
  );
  const uniqueCompanies = new Set(
    trades.map((t) => t.companyName?.trim().toLowerCase()).filter(Boolean),
  );
  const overFragmented = uniqueCompanies.size > 4;

  return (
    <div className="border border-obsidian/10 bg-white rounded-[3px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-3.5 w-3.5 text-obsidian/60" />
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">{title}</div>
      </div>
      {trades.length === 0 ? (
        <div className="text-[13px] text-obsidian/55">{emptyLabel}</div>
      ) : (
        <>
          <ul className="divide-y divide-obsidian/8">
            {trades.map((t, i) => {
              const dup = duplicateTrades.has(t.trade);
              return (
                <li key={`${t.trade}-${t.companyName}-${i}`} className="py-2.5 flex items-baseline justify-between gap-4">
                  <span className={`font-mono text-[10px] uppercase tracking-[0.14em] min-w-[8ch] ${dup ? "text-oxblood" : "text-obsidian/55"}`}>
                    {t.trade}{dup && " ⚠"}
                  </span>
                  <span className="text-[13px] text-obsidian text-right flex-1">{t.companyName}</span>
                </li>
              );
            })}
          </ul>
          {duplicateTrades.size > 0 && (
            <div className="mt-4 flex items-start gap-2 border-l-2 border-oxblood/60 bg-oxblood/5 px-3 py-2 rounded-r-[3px]">
              <AlertTriangle className="h-3.5 w-3.5 text-oxblood shrink-0 mt-0.5" />
              <div className="text-[11px] text-obsidian/80 leading-relaxed">
                Multiple subs on the same trade — consider consolidating to a single company.
              </div>
            </div>
          )}
          {overFragmented && (
            <div className="mt-3 flex items-start gap-2 border-l-2 border-obsidian/40 bg-obsidian/5 px-3 py-2 rounded-r-[3px]">
              <AlertTriangle className="h-3.5 w-3.5 text-obsidian/70 shrink-0 mt-0.5" />
              <div className="text-[11px] text-obsidian/80 leading-relaxed">
                {uniqueCompanies.size} unique subs on this job — fragmentation slows inspections. Consolidate where possible.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

