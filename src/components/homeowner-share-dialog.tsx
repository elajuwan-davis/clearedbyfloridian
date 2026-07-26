import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Share2 } from "lucide-react";

export function HomeownerShareDialog({ permitId, existingToken, onToken }: { permitId: string; existingToken: string | null; onToken?: (t: string) => void }) {
  const [token, setToken] = useState<string | null>(existingToken);
  const [busy, setBusy] = useState(false);

  const url = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/homeowner/${token}` : null;

  async function generate() {
    setBusy(true);
    try {
      const t = crypto.randomUUID();
      const { error } = await supabase.from("permits").update({ homeowner_share_token: t } as any).eq("id", permitId);
      if (error) throw error;
      setToken(t); onToken?.(t);
      toast.success("Share link created");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white border border-obsidian/10 rounded-[3px] p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-obsidian">
        <Share2 className="w-4 h-4" /> Share Status with Homeowner
      </div>
      {url ? (
        <div className="flex items-center gap-2">
          <input readOnly value={url} className="flex-1 border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-xs font-mono bg-obsidian/5" />
          <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }} className="inline-flex items-center gap-1 border border-obsidian/20 rounded-[3px] px-2 py-1.5 text-xs">
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
      ) : (
        <button disabled={busy} onClick={generate} className="inline-flex items-center gap-2 bg-obsidian text-white rounded-[3px] px-3 py-1.5 text-xs font-medium">
          <Share2 className="w-3 h-3" /> {busy ? "Generating…" : "Generate Read-Only Link"}
        </button>
      )}
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">
        Homeowner sees address, status timeline, and Victoria summary. No login. No Flōridian branding.
      </div>
    </div>
  );
}
