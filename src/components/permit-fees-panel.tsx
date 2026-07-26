import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Save } from "lucide-react";

type Props = {
  permitId: string;
  estimatedCents: number | null;
  actualCents: number | null;
  paidDate: string | null;
  paymentMethod: string | null;
  onChanged?: () => void;
};

function toCents(v: string): number | null {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return null;
  return Math.round(n * 100);
}
function fromCents(c: number | null): string {
  if (c == null) return "";
  return (c / 100).toFixed(2);
}

export function PermitFeesPanel(props: Props) {
  const [est, setEst] = useState(fromCents(props.estimatedCents));
  const [actual, setActual] = useState(fromCents(props.actualCents));
  const [paid, setPaid] = useState(props.paidDate ?? "");
  const [method, setMethod] = useState(props.paymentMethod ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.from("permits").update({
        estimated_fee_cents: toCents(est),
        actual_fee_cents: toCents(actual),
        fee_paid_date: paid || null,
        fee_payment_method: method || null,
      } as any).eq("id", props.permitId);
      if (error) throw error;
      toast.success("Fees saved");
      props.onChanged?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally { setSaving(false); }
  }

  const variance = props.actualCents != null && props.estimatedCents != null
    ? props.actualCents - props.estimatedCents : null;

  return (
    <div className="bg-white border border-obsidian/10 rounded-[3px] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-obsidian">
        <DollarSign className="w-4 h-4" /> Permit Fees
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-xs">
          <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Estimated ($)</span>
          <input value={est} onChange={(e) => setEst(e.target.value)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" placeholder="0.00" />
        </label>
        <label className="text-xs">
          <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Actual ($)</span>
          <input value={actual} onChange={(e) => setActual(e.target.value)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" placeholder="0.00" />
        </label>
        <label className="text-xs">
          <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Paid Date</span>
          <input type="date" value={paid} onChange={(e) => setPaid(e.target.value)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-obsidian/60 uppercase tracking-[0.14em] font-mono text-[10px] mb-1">Method</span>
          <input value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm" placeholder="Check / ACH / Card" />
        </label>
      </div>
      {variance != null && (
        <div className="text-xs text-obsidian/70">
          Variance: <span className={variance > 0 ? "text-red-700 font-medium" : "text-emerald-700 font-medium"}>${(variance/100).toFixed(2)}</span>
        </div>
      )}
      <button disabled={saving} onClick={save} className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-3 py-1.5 text-xs font-medium">
        <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save Fees"}
      </button>
    </div>
  );
}
