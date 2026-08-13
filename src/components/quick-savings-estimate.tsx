import { useMemo, useState } from "react";
import { Panel, Segmented } from "@/components/ui-kit";

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Compact one-row savings estimate: construction value + private-provider flag →
 * expected permit fee and the statutory reduction under FS §553.791(2)(b).
 */
export function QuickSavingsEstimate() {
  const [valueStr, setValueStr] = useState("");
  const [pp, setPp] = useState<"yes" | "no">("yes");

  const value = Number(valueStr) || 0;
  const standard = useMemo(() => value * 0.015, [value]);
  const reduced = useMemo(() => standard * 0.85, [standard]);
  const ppOnFile = pp === "yes";
  const expected = ppOnFile ? reduced : standard;
  const savings = ppOnFile ? standard - reduced : 0;

  return (
    <Panel
      title="What will this permit cost?"
      meta="Quick estimate"
      action={
        <Segmented
          value={pp}
          onChange={setPp}
          options={[
            { value: "yes", label: "PP on file" },
            { value: "no", label: "No PP" },
          ]}
        />
      }
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="p-plate flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Construction value
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-muted-foreground">$</span>
            <input
              type="number"
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              placeholder="4,125,000"
              className="p-inset h-7 w-full bg-transparent px-2 text-right text-[13px] tabular-nums"
            />
          </div>
        </label>

        <div className="p-plate flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            Expected permit fee
          </span>
          <div className="text-[20px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {fmt(expected)}
          </div>
          <div className="truncate text-[11.5px] text-muted-foreground">
            Value × 1.5%{ppOnFile ? " less 15% PP reduction" : ""}
          </div>
        </div>

        <div className="p-plate flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            You save
          </span>
          <div
            className={`text-[20px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${
              savings > 0 ? "text-[#4ADE80]" : ""
            }`}
          >
            {fmt(savings)}
          </div>
          <div className="truncate text-[11.5px] text-muted-foreground">
            {savings > 0 ? "FS §553.791(2)(b) reduction" : "Set PP on file to see savings"}
          </div>
        </div>
      </div>
    </Panel>
  );
}
