import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { SubRecord } from "@/lib/subcontractor-library";
import {
  WAIVER_TYPE_LABEL,
  type WaiverType,
  createWaiver,
  isConditional,
} from "@/lib/lien-waivers";
import { sendForSignature } from "@/lib/signature-requests";
import { addNote } from "@/lib/project-notes";

type Props = {
  sub: SubRecord;
  projectId: string;
  propertyAddress: string;
  onClose: () => void;
  onDone?: () => void;
};

export function GenerateLienWaiverDialog({ sub, projectId, propertyAddress, onClose, onDone }: Props) {
  const [waiverType, setWaiverType] = useState<WaiverType>("conditional_progress");
  const [amount, setAmount] = useState<string>("");
  const today = new Date().toISOString().slice(0, 10);
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [throughDate, setThroughDate] = useState<string>(today);
  const [busy, setBusy] = useState(false);

  const conditional = isConditional(waiverType);
  const amountNum = Number(amount);
  const canSubmit = !!amount && !Number.isNaN(amountNum) && amountNum > 0 && !!paymentDate && (!conditional || !!throughDate);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    const waiver = createWaiver({
      projectId,
      subId: sub.id,
      subCompany: sub.companyName,
      subEmail: sub.email,
      waiverType,
      amount: amountNum,
      paymentDate,
      throughDate: conditional ? throughDate : undefined,
      propertyAddress,
    });

    // Routing through SignWell needs a live permit record; for demo projects the waiver is
    // still stored, it just is not sent.
    let routed = false;
    if (sub.email) {
      try {
        await sendForSignature({
          permitId: projectId,
          documentName: `Lien Waiver — ${WAIVER_TYPE_LABEL[waiverType]} — ${sub.companyName}`,
          recipientEmail: sub.email,
          recipientName: sub.companyName,
          recipientRole: "Subcontractor",
          message: `Please sign this ${WAIVER_TYPE_LABEL[waiverType]} for ${propertyAddress}. Executed pursuant to Florida Statute §713.20.`,
        });
        routed = true;
      } catch (e) {
        toast.error(
          "Waiver stored, but not sent for signature: " +
            (e instanceof Error ? e.message : String(e)),
        );
      }
    }

    addNote(
      projectId,
      "System",
      `${routed ? "Lien waiver sent via SignWell" : "Lien waiver generated"}: ${WAIVER_TYPE_LABEL[waiverType]} — ${sub.companyName} — $${amountNum.toLocaleString()}`
    ).catch(() => {});
    void waiver;
    setBusy(false);
    onDone?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-obsidian/15 bg-white rounded-[3px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-obsidian/10 px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Generate Lien Waiver</div>
            <div className="mt-1 font-semibold text-obsidian">{sub.companyName}</div>
            <div className="text-xs text-obsidian/60">{sub.email || "No email on file — waiver will be stored only"}</div>
          </div>
          <button type="button" onClick={onClose} className="text-obsidian/50 hover:text-obsidian"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">Waiver type</label>
            <select
              value={waiverType}
              onChange={(e) => setWaiverType(e.target.value as WaiverType)}
              className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            >
              {(Object.keys(WAIVER_TYPE_LABEL) as WaiverType[]).map((t) => (
                <option key={t} value={t}>{WAIVER_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">Amount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">Payment date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
              />
            </div>
          </div>

          {conditional && (
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 mb-1.5">Through date</label>
              <input
                type="date"
                value={throughDate}
                onChange={(e) => setThroughDate(e.target.value)}
                className="block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:border-obsidian/40 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-obsidian/55">Conditional waivers cover labor/materials through this date.</p>
            </div>
          )}

          <div className="border border-obsidian/10 bg-paper-warm px-3 py-2.5 rounded-[3px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Property address</div>
            <div className="mt-1 text-sm text-obsidian">{propertyAddress}</div>
          </div>

          <p className="text-[11px] italic text-obsidian/60">
            This waiver is executed pursuant to Florida Statute §713.20.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-obsidian/10 px-5 py-3">
          <button type="button" onClick={onClose} className="border border-obsidian/15 bg-white px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-obsidian rounded-[3px] hover:border-obsidian/40">
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || busy}
            onClick={submit}
            className="border border-obsidian bg-obsidian px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-white rounded-[3px] hover:bg-obsidian/90 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Generate & Send via Signwell"}
          </button>
        </div>
      </div>
    </div>
  );
}
