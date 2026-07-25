import { Users } from "lucide-react";

export type TradeEntry = { trade: string; companyName: string };

/**
 * Compact "who else is on the job" panel. Trade + company only — never
 * contact details, license numbers, or rates.
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
  return (
    <div className="border border-obsidian/10 bg-white rounded-[3px] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-3.5 w-3.5 text-obsidian/60" />
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">{title}</div>
      </div>
      {trades.length === 0 ? (
        <div className="text-[13px] text-obsidian/55">{emptyLabel}</div>
      ) : (
        <ul className="divide-y divide-obsidian/8">
          {trades.map((t, i) => (
            <li key={`${t.trade}-${t.companyName}-${i}`} className="py-2.5 flex items-baseline justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 min-w-[8ch]">{t.trade}</span>
              <span className="text-[13px] text-obsidian text-right flex-1">{t.companyName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
