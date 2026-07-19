import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  type Inspection,
  type InspectionStatus,
  buildInspections,
  loadInspections,
  saveInspections,
  passedCount,
  POOL_INSPECTION_COUNT,
} from "@/lib/inspections";

type Props = {
  projectId: string;
  allPassedSeed?: boolean;
};

const STATUS_META: Record<
  InspectionStatus,
  { label: string; pill: string }
> = {
  passed: {
    label: "Passed",
    pill: "bg-[#16a34a] text-white border-[#16a34a]",
  },
  pending: {
    label: "Pending",
    pill: "bg-[#6b7280] text-white border-[#6b7280]",
  },
  corrections: {
    label: "Corrections Required",
    pill: "bg-[#dc2626] text-white border-[#dc2626]",
  },
};

export function InspectionsSection({ projectId, allPassedSeed = false }: Props) {
  const seed = useMemo(() => buildInspections(allPassedSeed), [allPassedSeed]);
  const [items, setItems] = useState<Inspection[]>(seed);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setItems(loadInspections(projectId, seed));
  }, [projectId, seed]);

  function update(code: string, patch: Partial<Inspection>) {
    setItems((prev) => {
      const next = prev.map((i) => (i.code === code ? { ...i, ...patch } : i));
      saveInspections(projectId, next);
      return next;
    });
  }

  const passed = passedCount(items);
  const pct = Math.round((passed / POOL_INSPECTION_COUNT) * 100);

  return (
    <div>
      <div className="border border-obsidian/10 bg-white">
        <div className="border-b border-obsidian/10 bg-paper-warm px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-obsidian/70">
              {passed} of {POOL_INSPECTION_COUNT} inspections passed
            </div>
            <div className="font-mono text-[11px] tabular-nums text-obsidian/55">{pct}%</div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-[2px] bg-obsidian/10">
            <div
              className="h-full bg-[#16a34a] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ul className="divide-y divide-obsidian/5">
          {items.map((ins) => {
            const meta = STATUS_META[ins.status];
            const isOpen = expanded[ins.code];
            return (
              <li key={ins.code} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex h-8 min-w-[3rem] items-center justify-center bg-[#153157] px-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-white rounded-[3px]">
                    {ins.code}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((e) => ({ ...e, [ins.code]: !e[ins.code] }))
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-obsidian">{ins.name}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-obsidian/40 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {!isOpen && (
                      <div className="mt-0.5 text-xs text-obsidian/55 truncate">
                        {ins.description}
                      </div>
                    )}
                  </button>
                  <span
                    className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] rounded-[3px] ${meta.pill}`}
                  >
                    {meta.label}
                  </span>
                  <select
                    value={ins.status}
                    onChange={(e) =>
                      update(ins.code, {
                        status: e.target.value as InspectionStatus,
                        ...(e.target.value !== "corrections" ? { notes: undefined } : {}),
                      })
                    }
                    className="border border-obsidian/15 bg-white px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="passed">Passed</option>
                    <option value="corrections">Corrections Required</option>
                  </select>
                </div>

                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-obsidian/75">
                    {ins.description}
                  </p>
                )}

                {ins.status === "corrections" && (
                  <div className="mt-3">
                    <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1.5">
                      Correction notes
                    </label>
                    <textarea
                      value={ins.notes ?? ""}
                      onChange={(e) => update(ins.code, { notes: e.target.value })}
                      rows={2}
                      placeholder="Describe the correction required by the inspector…"
                      className="block w-full border border-[#dc2626]/40 bg-red-50/40 px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-[#dc2626] focus:outline-none rounded-[3px]"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
