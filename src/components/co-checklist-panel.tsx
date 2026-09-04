import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, PartyPopper } from "lucide-react";
import { ensureCoItems, listCoItems, toggleCoItem, coProgress, type CoItem } from "@/lib/co-checklist";
import { useSession } from "@/lib/use-session";

type Props = { permitId: string; projectName: string; tenantId: string | null };

export function CoChecklistPanel({ permitId, projectName, tenantId }: Props) {
  const { isAdmin } = useSession();
  const [items, setItems] = useState<CoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Only admins can insert seed rows — GCs just read whatever exists.
        const rows = isAdmin ? await ensureCoItems(permitId, tenantId) : await listCoItems(permitId);
        if (!cancelled) setItems(rows);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message ?? "Could not load CO checklist");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [permitId, tenantId, isAdmin]);

  async function onToggle(it: CoItem) {
    if (!isAdmin) return;
    setBusyKey(it.item_key);
    try {
      const updated = await toggleCoItem(it, projectName, tenantId);
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      const prog = coProgress(items.map((r) => (r.id === updated.id ? updated : r)));
      if (prog.issued) toast.success("Certificate of Occupancy — all items complete");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update item");
    } finally {
      setBusyKey(null);
    }
  }

  const c = coProgress(items);

  if (loading) return <div className="text-obsidian/60 text-sm p-6">Loading CO checklist…</div>;

  return (
    <div className="space-y-4">
      {c.issued && (
        <div className="rounded-[3px] border border-emerald-600/40 bg-emerald-50 p-4 flex items-center gap-3">
          <PartyPopper className="w-5 h-5 text-emerald-700" />
          <div>
            <div className="text-sm font-medium text-emerald-900">Certificate of Occupancy issued</div>
            <div className="text-xs text-emerald-800/80">Every item on the CO checklist is complete for {projectName}.</div>
          </div>
        </div>
      )}

      <div className="bg-white border border-obsidian/10 rounded-[3px] p-5">
        <div className="flex flex-wrap items-baseline gap-3 justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">CO Checklist</div>
            <div className="mt-1 text-sm text-obsidian/70">
              {c.done} of {c.total} items complete — {c.issued ? "CO issued." : "CO pending."}
            </div>
          </div>
          <div className="font-mono text-[11px] tabular-nums text-obsidian/60">{c.percent}%</div>
        </div>
        <div className="mt-3 h-2 bg-obsidian/10 rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${c.percent}%`, background: c.issued ? "#10b981" : "#000000" }} />
        </div>
      </div>

      <ul className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px] bg-white">
        {items.map((it) => (
          <li key={it.id} className="flex items-start gap-3 p-4">
            <button
              disabled={!isAdmin || busyKey === it.item_key}
              onClick={() => onToggle(it)}
              className={`mt-[2px] shrink-0 ${isAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              title={isAdmin ? "Toggle item" : "Only Flōridian admin can toggle items"}
            >
              {busyKey === it.item_key
                ? <Loader2 className="w-5 h-5 animate-spin text-obsidian/50" />
                : it.complete
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  : <Circle className="w-5 h-5 text-obsidian/30" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={`text-sm ${it.complete ? "text-obsidian/60 line-through" : "text-obsidian"}`}>{it.item_label}</div>
              {it.complete && it.completed_at && (
                <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.1em] text-emerald-800/70">
                  {new Date(it.completed_at).toLocaleDateString()} · {it.completed_by_label ?? "admin"}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!isAdmin && (
        <div className="text-[11px] text-obsidian/50 ">Only Flōridian admin can check off CO items. Contact your admin to update status.</div>
      )}
    </div>
  );
}
