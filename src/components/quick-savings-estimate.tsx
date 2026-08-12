import { useMemo, useState } from "react";
import { TrendingDown } from "lucide-react";

const OBSIDIAN = "#153157";
const GREEN = "#16a34a";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The original one-screen savings estimate: enter a construction value, answer
 * whether a private provider is on file, and see the expected permit fee plus
 * the statutory savings under FS §553.791(2)(b).
 */
export function QuickSavingsEstimate() {
  const [valueStr, setValueStr] = useState("");
  const [ppOnFile, setPpOnFile] = useState(true);

  const value = Number(valueStr) || 0;
  const standard = useMemo(() => value * 0.015, [value]);
  const reduced = useMemo(() => standard * 0.85, [standard]);
  const expected = ppOnFile ? reduced : standard;
  const savings = ppOnFile ? standard - reduced : 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-obsidian/10 pb-6">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} /> Quick Estimate
        </div>
        <h2 className="display-serif mt-3 text-3xl sm:text-4xl text-obsidian">
          What will this permit cost?
        </h2>
        <p className="mt-2 text-sm text-obsidian/60">
          One construction value, one question — your expected permit fee and the private-provider
          reduction you&apos;re owed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-5">
          <div>
            <label className="eyebrow text-obsidian/55 block">Construction Value ($)</label>
            <input
              type="number"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder="4,125,000"
              className="mt-2 w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px] font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="eyebrow text-obsidian/55 block">Private Provider on file?</label>
            <div className="mt-2 inline-flex border border-obsidian/15 bg-white rounded-[3px] overflow-hidden">
              {[
                { v: true, label: "Yes" },
                { v: false, label: "No" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPpOnFile(opt.v)}
                  className="px-5 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: ppOnFile === opt.v ? "var(--obsidian)" : "transparent",
                    color: ppOnFile === opt.v ? "var(--paper)" : "var(--obsidian)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-obsidian/55">
              {ppOnFile
                ? "Private-provider fee reduction required under FS §553.791(2)(b)."
                : "Without a private provider on file, the full municipal fee applies."}
            </p>
          </div>
        </div>

        <aside
          className="rounded-[3px] p-6"
          style={{ background: OBSIDIAN, color: "#fff" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            Expected Permit Fee
          </div>
          <div
            className="mt-1 tabular-nums"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {fmt(expected)}
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            Construction value × 1.5%{ppOnFile ? " less the 15% private-provider reduction" : ""}.
          </p>

          <div className="mt-6 border-t border-white/15 pt-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
              You Save
            </div>
            <div
              className="mt-1 tabular-nums"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 36,
                fontWeight: 600,
                color: savings > 0 ? GREEN : "#fff",
              }}
            >
              {fmt(savings)}
            </div>
            <p className="mt-1 text-[11px] text-white/45">
              {savings > 0
                ? "Statutory reduction vs. filing without a private provider."
                : "Switch Private Provider to “Yes” to see your savings."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
