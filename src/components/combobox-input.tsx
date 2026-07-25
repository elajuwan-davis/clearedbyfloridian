import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

type Option = { value: string; label: string; sublabel?: string };

type Props = {
  value: string;
  onChange: (value: string, option?: Option) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  allowFreeform?: boolean;
  emptyHint?: string;
};

/**
 * Searchable combo input — user can type freely or pick from list.
 * Freeform entries are permitted when allowFreeform is true (default).
 */
export function ComboboxInput({
  value,
  onChange,
  options,
  placeholder,
  className,
  allowFreeform = true,
  emptyHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

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
    if (!q) return options.slice(0, 50);
    return options
      .filter((o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? "").toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, options]);

  const inputCls =
    "block w-full border border-obsidian/15 bg-white pl-3 pr-16 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <input
        className={inputCls}
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (allowFreeform) onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); setOpen(false); }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); onChange(""); }}
            className="p-1 text-obsidian/40 hover:text-obsidian"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-1 text-obsidian/40 hover:text-obsidian"
          aria-label="Toggle"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-obsidian/15 rounded-[3px] shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-obsidian/50">
              {emptyHint ?? (allowFreeform ? "No matches — press Enter to use as freeform" : "No matches")}
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setQuery(o.label);
                  onChange(o.label, o);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-obsidian/5 flex items-start gap-2"
              >
                {o.label.toLowerCase() === query.toLowerCase() ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-obsidian truncate">{o.label}</span>
                  {o.sublabel && (
                    <span className="block text-[11px] text-obsidian/50 truncate">{o.sublabel}</span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
