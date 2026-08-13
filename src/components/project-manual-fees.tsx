import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogPermitFeeDialog } from "@/components/log-permit-fee-dialog";
import {
  deleteFee,
  fmtUsd,
  listFeesForProject,
  type ManualFee,
} from "@/lib/manual-fees";

export function ProjectManualFees({ projectId }: { projectId: string }) {
  const [fees, setFees] = useState<ManualFee[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManualFee | null>(null);

  useEffect(() => {
    const refresh = () => {
      void listFeesForProject(projectId)
        .then(setFees)
        .catch(() => setFees([]));
    };
    refresh();
    window.addEventListener("manual-fees:changed", refresh);
    return () => window.removeEventListener("manual-fees:changed", refresh);
  }, [projectId]);

  const total = fees.reduce((s, f) => s + f.amountCents, 0);

  return (
    <div className="border border-obsidian/10 bg-white">
      <div className="flex items-center justify-between border-b border-obsidian/10 bg-paper-warm px-5 py-3">
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
          Logged Fees · Manual
        </div>
        <Button
          variant="dark"
          size="sm"
          className="rounded-[3px]"
          onClick={() => { setEditing(null); setOpen(true); }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Log fee
        </Button>
      </div>

      {fees.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-obsidian/50">
          No manual fees logged for this project yet.
        </div>
      ) : (
        <>
          <ul className="divide-y divide-obsidian/5">
            {fees.map((f) => (
              <li key={f.id} className="flex items-start gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-obsidian">{f.feeType}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                    {f.datePaid}
                  </div>
                  {f.notes && (
                    <div className="mt-1 text-xs text-obsidian/60">{f.notes}</div>
                  )}
                </div>
                <div className="shrink-0 font-mono text-sm tabular-nums text-obsidian">
                  {fmtUsd(f.amountCents)}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => { setEditing(f); setOpen(true); }}
                    className="p-1 text-obsidian/50 hover:text-obsidian"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => { if (confirm("Delete this fee?")) void deleteFee(f.id); }}
                    className="p-1 text-obsidian/50 hover:text-oxblood"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-obsidian/10 bg-paper-warm px-5 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Total logged
            </span>
            <span className="font-mono text-sm tabular-nums text-obsidian">{fmtUsd(total)}</span>
          </div>
        </>
      )}

      <LogPermitFeeDialog
        open={open}
        onOpenChange={setOpen}
        defaultProjectId={projectId}
        lockProject
        editing={editing}
      />
    </div>
  );
}
