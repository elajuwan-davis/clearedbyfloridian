import { useMemo, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Bundle, BundleTrade } from "@/lib/bundle";

export function BundlePartialSubmitDialog({
  open,
  bundle,
  onClose,
  onSubmit,
}: {
  open: boolean;
  bundle: Bundle;
  onClose: () => void;
  onSubmit: (opts: { selectedKeys: string[]; note: string }) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const trades = bundle.trades;
  const pendingList = useMemo(
    () => trades.filter((t) => !selected.has(t.key)).map((t) => t.label),
    [trades, selected],
  );

  if (!open) return null;

  function toggle(key: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await onSubmit({
        selectedKeys: Array.from(selected),
        note: note || `Remaining trades: ${pendingList.join(", ")} — to be submitted when subs complete.`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-obsidian/60 p-4">
      <div className="w-full max-w-lg bg-white border border-obsidian/15 rounded-[3px] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-obsidian/10">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-obsidian">Partial Submit</div>
          <button onClick={onClose} className="text-obsidian/50 hover:text-obsidian" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="text-sm text-obsidian/75">Which trades are ready to submit now?</div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {trades.map((t: BundleTrade) => {
              const isSigned = t.signature_status === "signed";
              return (
                <label key={t.key} className="flex items-center gap-3 border border-obsidian/12 rounded-[3px] px-3 py-2 cursor-pointer hover:bg-obsidian/[0.02]">
                  <input
                    type="checkbox"
                    checked={selected.has(t.key)}
                    onChange={() => toggle(t.key)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-obsidian">{t.label}</div>
                    <div className="text-[11px] text-obsidian/55 font-mono uppercase tracking-[0.12em]">
                      {t.sub_snapshot?.company ?? "No sub assigned"} · {t.signature_status}
                    </div>
                  </div>
                  {!isSigned && (
                    <span title="Signature not yet completed" className="text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">Note</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Remaining trades: ${pendingList.join(", ") || "—"}`}
              className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-obsidian/10 bg-obsidian/[0.02]">
          <button
            onClick={onClose}
            disabled={saving}
            className="border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || selected.size === 0}
            className="bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-50"
          >
            {saving ? "Submitting…" : `Submit ${selected.size || ""} Trade${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
