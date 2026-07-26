import { AlertTriangle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { daysUntilExpiration, expirationState } from "@/lib/permit-expiration";

export function ExpirationBanner({ permitId, expirationDate, extensionRequestedAt, onChange }: {
  permitId: string;
  expirationDate: string | null;
  extensionRequestedAt: string | null;
  onChange?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const state = expirationState(expirationDate);
  const days = daysUntilExpiration(expirationDate);
  if (state === "unknown" || state === "safe") return null;

  async function requestExtension() {
    setBusy(true);
    try {
      const { error } = await supabase.from("permits").update({ extension_requested_at: new Date().toISOString() } as any).eq("id", permitId);
      if (error) throw error;
      toast.success("Extension request logged");
      onChange?.();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  }

  const isExpired = state === "expired";
  const cls = isExpired
    ? "border-red-500/40 bg-red-50 text-red-900"
    : "border-amber-500/40 bg-amber-50 text-amber-900";

  return (
    <div className={`rounded-[3px] border p-3 flex items-start gap-3 ${cls}`}>
      {isExpired ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <Clock className="w-4 h-4 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">
          {isExpired
            ? `This permit expired on ${expirationDate}.`
            : `This permit expires on ${expirationDate} — ${days} day${days === 1 ? "" : "s"} remaining.`}
        </div>
        <div className="text-xs mt-1 opacity-80">
          {extensionRequestedAt
            ? `Extension requested ${new Date(extensionRequestedAt).toLocaleDateString()}.`
            : "Request an extension before the permit lapses."}
        </div>
      </div>
      {!extensionRequestedAt && (
        <button disabled={busy} onClick={requestExtension} className="text-[10px] font-mono uppercase tracking-[0.14em] bg-obsidian text-white rounded-[3px] px-2 py-1">
          {busy ? "…" : "Request Extension"}
        </button>
      )}
    </div>
  );
}
