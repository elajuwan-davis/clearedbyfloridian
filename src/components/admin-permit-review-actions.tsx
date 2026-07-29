// Admin-only Accept / Flag for Correction actions for self-service permit submissions.
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Flag, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { updatePermit, type PermitRow } from "@/lib/permits-api";

type Props = {
  permit: PermitRow & { submission_source?: string | null };
  onUpdated: (row: PermitRow) => void;
};

export function AdminPermitReviewActions({ permit, onUpdated }: Props) {
  const session = useSession();
  const [busy, setBusy] = useState<"accept" | "flag" | null>(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [message, setMessage] = useState("");

  const isSelfService = (permit.submission_source ?? "self_service") === "self_service";
  if (session.loading || !session.isAdmin || !isSelfService) return null;
  if (permit.status !== ("draft" as PermitRow["status"])) return null;

  const actorLabel = session.email ?? null;

  async function accept() {
    setBusy("accept");
    try {
      const updated = await updatePermit(permit.id, { status: "submitted" as PermitRow["status"] });
      const { error } = await supabase.from("activity_events" as any).insert({
        permit_id: permit.id,
        tenant_id: permit.tenant_id ?? null,
        event_type: "permit_accepted",
        actor_id: session.userId,
        actor_label: actorLabel,
        summary: "Submission accepted — Cleared for Takeoff",
        details: { actor_user_id: session.userId, new_status: "submitted" },
      } as any);
      if (error) throw error;
      onUpdated(updated);
      toast.success("Accepted — Cleared for Takeoff");
    } catch (e) {
      toast.error("Accept failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(null);
    }
  }

  async function flag() {
    if (!message.trim()) { toast.error("Add a correction note first."); return; }
    setBusy("flag");
    try {
      const updated = await updatePermit(permit.id, { status: "corrections_required" as PermitRow["status"] });
      const { error } = await supabase.from("permit_updates" as any).insert({
        permit_id: permit.id,
        tenant_id: permit.tenant_id ?? null,
        message: message.trim(),
        visible_to_client: true,
        created_by: session.userId,
        created_by_label: actorLabel,
      } as any);
      if (error) throw error;
      await supabase.from("activity_events" as any).insert({
        permit_id: permit.id,
        tenant_id: permit.tenant_id ?? null,
        event_type: "permit_flagged",
        actor_id: session.userId,
        actor_label: actorLabel,
        summary: "Flagged for correction",
        details: { actor_user_id: session.userId, new_status: "corrections_required", message: message.trim() },
      } as any);
      onUpdated(updated);
      setFlagOpen(false);
      setMessage("");
      toast.success("Flagged — Delayed, note sent to client");
    } catch (e) {
      toast.error("Flag failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Staff Review</div>
          <div className="mt-1 text-sm text-obsidian/70">
            Self-service submission awaiting review (Pre-Check).
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={accept}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-60"
          >
            {busy === "accept" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Accept
          </button>
          <button
            onClick={() => setFlagOpen((v) => !v)}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 border border-red-600/30 text-red-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50 disabled:opacity-60"
          >
            {flagOpen ? <X className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />} Flag for Correction
          </button>
        </div>
      </div>

      {flagOpen && (
        <div className="mt-5 border border-red-500/30 bg-red-50 rounded-[3px] p-4">
          <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-red-900">
            Correction note (visible to client)
          </label>
          <textarea
            value={message}
            onChange={(ev) => setMessage(ev.target.value)}
            rows={4}
            className="mt-2 w-full border border-red-500/30 bg-white rounded-[3px] px-3 py-2 text-sm text-obsidian outline-none focus:border-red-600"
            placeholder="Describe what needs to be corrected before this submission can be accepted."
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={flag}
              disabled={busy !== null}
              className="inline-flex items-center gap-2 bg-red-700 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white rounded-[3px] disabled:opacity-60"
            >
              {busy === "flag" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />} Send & Mark Delayed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
