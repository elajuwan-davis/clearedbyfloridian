import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PROJECTS } from "@/lib/projects-data";
import {
  FEE_TYPES,
  addFee,
  updateFee,
  parseDollarsToCents,
  type ManualFee,
  type ManualFeeType,
} from "@/lib/manual-fees";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  lockProject?: boolean;
  editing?: ManualFee | null;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LogPermitFeeDialog({
  open,
  onOpenChange,
  defaultProjectId,
  lockProject = false,
  editing = null,
}: Props) {
  const [projectId, setProjectId] = useState(defaultProjectId ?? PROJECTS[0]?.id ?? "");
  const [feeType, setFeeType] = useState<ManualFeeType>("Total Permit Fee");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setProjectId(editing.projectId);
      setFeeType(editing.feeType);
      setAmount((editing.amountCents / 100).toFixed(2));
      setNotes(editing.notes ?? "");
      setDate(editing.datePaid);
    } else {
      setProjectId(defaultProjectId ?? PROJECTS[0]?.id ?? "");
      setFeeType("Total Permit Fee");
      setAmount("");
      setNotes("");
      setDate(today());
    }
  }, [open, editing, defaultProjectId]);

  function save() {
    const cents = parseDollarsToCents(amount);
    if (!projectId || cents <= 0) return;
    if (editing) {
      updateFee(editing.id, { projectId, feeType, amountCents: cents, notes, datePaid: date });
    } else {
      addFee({ projectId, feeType, amountCents: cents, notes, datePaid: date });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">
          {editing ? "Edit Permit Fee" : "Log Permit Fee"}
        </DialogTitle>
        <p className="mt-1 text-xs text-obsidian/55">
          Record a fee paid or invoiced through a municipal portal.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <Label className="eyebrow text-obsidian/55">Project</Label>
            <select
              value={projectId}
              disabled={lockProject}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-2 block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none disabled:opacity-60"
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.city}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow text-obsidian/55">Fee Type</Label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value as ManualFeeType)}
                className="mt-2 block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
              >
                {FEE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="eyebrow text-obsidian/55">Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1250.00"
                className="mt-2 font-mono tabular-nums rounded-[3px]"
              />
            </div>
          </div>

          <div>
            <Label className="eyebrow text-obsidian/55">Date Paid / Invoiced</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 rounded-[3px]"
            />
          </div>

          <div>
            <Label className="eyebrow text-obsidian/55">Notes (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Pulled from PSL portal manually"
              className="mt-2 block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[3px]">Cancel</Button>
          <Button variant="dark" onClick={save} className="rounded-[3px]">
            {editing ? "Save changes" : "Log fee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
