import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";

type Props = {
  values: string[];
  onToggle: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  hint?: (value: string) => string | undefined;
};

/**
 * Compact searchable multi-select — type to filter, click to select, selected
 * items render as removable chips. Replaces long click-through option grids.
 */
export function MultiSelectCombobox({
  values,
  onToggle,
  options,
  placeholder = "Search to select…",
  className,
  hint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <div
        className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-[3px] border border-obsidian/15 bg-white px-2 py-1.5"
        onClick={() => setOpen(true)}
      >
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#153157] px-2 py-1 text-[11px] font-medium text-white"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(v);
              }}
              aria-label={`Remove ${v}`}
              className="text-white/70 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[120px] flex-1 items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-obsidian/35" />
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder={values.length ? "Add more…" : placeholder}
            className="w-full bg-transparent py-0.5 text-sm text-obsidian placeholder:text-obsidian/40 focus:outline-none"
          />
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-obsidian/35" />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-[3px] border border-obsidian/15 bg-white shadow-lg">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-obsidian/45">No matches.</div>
          )}
          {filtered.map((o) => {
            const selected = values.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => onToggle(o)}
                title={hint?.(o)}
                className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-[13px] text-obsidian hover:bg-obsidian/[0.04]"
              >
                <span>{o}</span>
                {selected && <Check className="mt-0.5 h-3.5 w-3.5 text-[#153157]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
