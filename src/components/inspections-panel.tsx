import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
import {
  listInspections,
  createInspection,
  updateInspection,
  deleteInspection,
  INSPECTION_TYPES,
  labelFor,
  currentInspectionStage,
  type PermitInspection,
  type InspectionType,
} from "@/lib/inspections-api";

export function InspectionsPanel({ permitId, tenantId, permitStatus }: { permitId: string; tenantId: string | null; permitStatus: string }) {
  const [rows, setRows] = useState<PermitInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<InspectionType>("rough");
  const [requested, setRequested] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canSchedule = permitStatus === "permit_issued";

  useEffect(() => {
    listInspections(permitId).then(setRows).catch(() => toast.error("Failed to load inspections")).finally(() => setLoading(false));
  }, [permitId]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const row = await createInspection({
        permit_id: permitId,
        tenant_id: tenantId,
        inspection_type: type,
        requested_date: requested || null,
        notes: notes || null,
      });
      setRows((prev) => [row, ...prev]);
      setNotes("");
      setRequested("");
      toast.success("Inspection requested");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function markResult(id: string, result: "passed" | "failed") {
    const row = await updateInspection(id, { result } as any);
    setRows((prev) => prev.map((r) => (r.id === id ? row : r)));
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this inspection record?")) return;
    await deleteInspection(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const stage = currentInspectionStage(rows);

  return (
    <div className="space-y-4">
      {stage && (
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/60">
          Victoria — Current Stage: <span className="text-obsidian">{stage}</span>
        </div>
      )}

      {canSchedule ? (
        <form onSubmit={onAdd} className="bg-white border border-obsidian/10 rounded-[3px] p-4 space-y-3">
          <div className="text-sm font-medium text-obsidian">Schedule Inspection</div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs">
              <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as InspectionType)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm">
                {INSPECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Requested Date</span>
              <input type="date" value={requested} onChange={(e) => setRequested(e.target.value)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs md:col-span-1">
              <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Notes</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" placeholder="Optional" />
            </label>
          </div>
          <button disabled={saving} type="submit" className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-3 py-1.5 text-xs font-medium">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />} Request Inspection
          </button>
        </form>
      ) : (
        <div className="rounded-[3px] border border-obsidian/10 bg-obsidian/5 p-3 text-xs text-obsidian/70">
          Inspections can be scheduled once the permit is <strong>En Route</strong>.
        </div>
      )}

      <div>
        {loading ? (
          <div className="text-sm text-obsidian/50 p-4">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-obsidian/50 p-4 italic">No inspections yet.</div>
        ) : (
          <div className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px] bg-white">
            {rows.map((r) => (
              <div key={r.id} className="p-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-obsidian">{labelFor(r.inspection_type)}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50 mt-1">
                    Requested {r.requested_date ?? "—"} · Scheduled {r.scheduled_date ?? "—"}
                  </div>
                  {r.notes && <div className="text-xs text-obsidian/70 mt-1">{r.notes}</div>}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em]">
                  <ResultBadge result={r.result} />
                  {r.result !== "passed" && (
                    <button onClick={() => markResult(r.id, "passed")} className="text-emerald-700 hover:underline">Pass</button>
                  )}
                  {r.result !== "failed" && (
                    <button onClick={() => markResult(r.id, "failed")} className="text-red-700 hover:underline">Fail</button>
                  )}
                  <button onClick={() => onDelete(r.id)} className="text-obsidian/50 hover:text-obsidian">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  const cls =
    result === "passed" ? "bg-emerald-50 border-emerald-500/40 text-emerald-800"
    : result === "failed" ? "bg-red-50 border-red-500/40 text-red-800"
    : "bg-obsidian/5 border-obsidian/20 text-obsidian/70";
  return <span className={`px-1.5 py-0.5 border rounded-[3px] ${cls}`}>{result ?? "pending"}</span>;
}
