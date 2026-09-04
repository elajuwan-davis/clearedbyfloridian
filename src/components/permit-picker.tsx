import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import type { PermitRow } from "@/lib/permits-api";

/** Shared permit search picker — extracted from Bid Review for reuse. */
export function PermitPicker({
  permits,
  onClose,
  onPick,
  title = "Select a Permit",
  eyebrow = "Choose Permit",
}: {
  permits: PermitRow[];
  onClose: () => void;
  onPick: (p: PermitRow) => void;
  title?: string;
  eyebrow?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = permits.filter((p) => {
    if (!q.trim()) return true;
    const s = `${p.project_name} ${p.job_address} ${p.permit_number ?? ""}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-white rounded-[3px] shadow-2xl my-16">
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian/10">
          <div>
            <div className="eyebrow text-obsidian/50">{eyebrow}</div>
            <h2 className="display-serif text-xl text-obsidian mt-1">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-[3px] hover:bg-obsidian/5" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-obsidian/10">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by project, address, or permit #…"
            className="w-full border border-obsidian/20 rounded-[3px] px-3 py-2 text-sm"
          />
        </div>
        <div className="max-h-[420px] overflow-y-auto divide-y divide-obsidian/5">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-sm text-obsidian/50 text-center">
              No matching permits.
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => onPick(p)}
                className="w-full text-left px-6 py-3 hover:bg-obsidian/5 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-obsidian truncate">{p.project_name}</div>
                  <div className="text-xs text-obsidian/60 truncate">{p.job_address}</div>
                </div>
                {p.permit_number && (
                  <div className="font-mono text-[10px] text-obsidian/50 shrink-0">{p.permit_number}</div>
                )}
                <ChevronRight className="h-4 w-4 text-obsidian/40 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
