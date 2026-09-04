import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Loader2 } from "lucide-react";
import { listResubmittals, createResubmittal, type PermitResubmittal } from "@/lib/resubmittals-api";

export function ResubmittalPanel({ permitId, tenantId, permitStatus, onResubmitted }: { permitId: string; tenantId: string | null; permitStatus: string; onResubmitted?: () => void }) {
  const [rows, setRows] = useState<PermitResubmittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listResubmittals(permitId).then(setRows).catch(() => toast.error("Failed to load resubmittals")).finally(() => setLoading(false));
  }, [permitId]);

  const canResubmit = permitStatus === "corrections_required";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) { toast.error("Add correction notes"); return; }
    setSaving(true);
    try {
      const r = await createResubmittal({ permit_id: permitId, tenant_id: tenantId, correction_notes: notes });
      setRows((prev) => [r, ...prev]);
      setNotes("");
      toast.success(`Resubmitted (v${r.version}). Status returned to Cleared for Takeoff.`);
      onResubmitted?.();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {canResubmit && (
        <form onSubmit={submit} className="bg-white border border-red-500/40 rounded-[3px] p-4 space-y-3">
          <div className="text-sm font-medium text-obsidian">Resubmit After Corrections</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="What did the municipality flag? What was corrected?"
            className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" />
          <button disabled={saving} type="submit" className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-3 py-1.5 text-xs font-medium">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Resubmit
          </button>
        </form>
      )}

      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-2">Resubmittal History</div>
        {loading ? <div className="text-sm text-obsidian/50">Loading…</div>
          : rows.length === 0 ? <div className="text-sm text-obsidian/50 ">No resubmittals yet.</div>
          : (
            <div className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px] bg-white">
              {rows.map((r) => (
                <div key={r.id} className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-obsidian">Version {r.version}</div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">{new Date(r.resubmitted_at).toLocaleString()}</div>
                  </div>
                  {r.correction_notes && <div className="text-xs text-obsidian/70 mt-1 whitespace-pre-wrap">{r.correction_notes}</div>}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
