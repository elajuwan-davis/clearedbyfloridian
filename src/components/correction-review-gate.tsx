// Agent 7 — the runtime approval gate for corrections, in the UI.
//
// The parser drafts; it never sends. Staff see every item it read out of the letter, the
// acknowledgment it wants to send and exactly who it would go to, and nothing leaves Cleard
// until someone taps Approve & send. Approval is an RPC only Cleard staff may execute, and
// the release happens in a database trigger rather than here.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/use-session";
import {
  CATEGORY_LABELS,
  approveCorrectionPlan,
  correctionPlanBadge,
  listCorrectionPlanEvents,
  listCorrectionPlans,
  rejectCorrectionPlan,
  type CorrectionPlanEvent,
  type CorrectionPlanRow,
} from "@/lib/corrections";

type Props = { permitId: string };

export function CorrectionReviewGate({ permitId }: Props) {
  const { isAdmin, loading } = useSession();
  const [plans, setPlans] = useState<CorrectionPlanRow[]>([]);
  const [events, setEvents] = useState<CorrectionPlanEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    const rows = await listCorrectionPlans(permitId).catch(() => []);
    setPlans(rows);
    setEvents(rows[0] ? await listCorrectionPlanEvents(rows[0].id).catch(() => []) : []);
  }, [permitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const latest = plans[0] ?? null;

  // Parsing and sending both happen outside the browser (trigger → edge function → mailer).
  useEffect(() => {
    if (!latest || !["approved", "sending"].includes(latest.status)) return;
    const t = setInterval(() => void refresh(), 8_000);
    return () => clearInterval(t);
  }, [latest, refresh]);

  if (loading || !isAdmin || plans.length === 0) return null;

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setBusy(false);
    }
  }

  const pending = latest?.status === "draft_pending_approval";
  const badge = latest ? correctionPlanBadge(latest.status) : null;
  const plan = latest?.plan;
  const mismatch =
    latest?.numbered_comments_found &&
    latest.numbered_comments_found > 0 &&
    latest.numbered_comments_found !== latest.item_count
      ? `The letter appears to number ${latest.numbered_comments_found} comment(s), the draft lists ${latest.item_count}.`
      : null;

  return (
    <div id="correction-review" className="rounded-[3px] border border-obsidian/12 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-obsidian">Correction response</div>
        {badge && (
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        {latest?.overall_complexity && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
            {latest.item_count} item(s) · {latest.overall_complexity} complexity
          </span>
        )}
      </div>

      {pending && (
        <div className="mt-3 flex gap-2 rounded-[3px] border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Nothing has been sent. The acknowledgment reaches the building department only when a
          staff member approves it below.
        </div>
      )}

      {mismatch && (
        <div className="mt-2 flex gap-2 rounded-[3px] border border-amber-200 bg-white p-2 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {mismatch} Check the letter before approving.
        </div>
      )}

      {plan && (
        <div className="mt-3 space-y-3 text-xs text-obsidian/80">
          <div>{plan.summary}</div>
          {plan.resubmittal_due && (
            <div>
              <span className="font-semibold text-obsidian">Resubmittal due:</span>{" "}
              {plan.resubmittal_due}
            </div>
          )}

          <ol className="space-y-2">
            {plan.items.map((item) => (
              <li
                key={item.ordinal}
                className="rounded-[3px] border border-obsidian/10 bg-obsidian/[0.02] p-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                    #{item.ordinal} · {CATEGORY_LABELS[item.category] ?? item.category} ·{" "}
                    {item.complexity}
                    {item.estimated_hours !== null ? ` · ~${item.estimated_hours}h` : ""}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                    {item.responsible_party}
                  </span>
                </div>
                <div className="mt-1 text-obsidian/60">“{item.quoted_text}”</div>
                <div className="mt-1 text-obsidian">{item.fix_instruction}</div>
                {item.code_reference && (
                  <div className="mt-1 font-mono text-[10px] text-obsidian/50">
                    {item.code_reference}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <div className="rounded-[3px] border border-obsidian/10 p-2">
            <div className="flex items-center gap-2 font-semibold text-obsidian">
              <Mail className="h-3.5 w-3.5" />
              Acknowledgment to {latest?.ack_to_email ?? "— no recipient on file"}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
              {latest?.ack_subject}
            </div>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-obsidian/80">
              {latest?.ack_body}
            </pre>
          </div>
        </div>
      )}

      {pending && (
        <div className="mt-3 space-y-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the record (optional for approval, required to reject)"
            className="rounded-[3px] text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="dark"
              className="rounded-[3px]"
              disabled={busy || !latest?.ack_to_email}
              title={
                latest?.ack_to_email
                  ? "Approve — the acknowledgment is sent after this"
                  : "No recipient on the plan; add the building department's intake address first"
              }
              onClick={() =>
                act("Approved — acknowledgment queued", () =>
                  approveCorrectionPlan(latest!.id, note || undefined),
                )
              }
            >
              {busy ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Approve &amp; send
            </Button>
            <Button
              variant="outline"
              className="rounded-[3px]"
              disabled={busy}
              onClick={() => {
                if (!note.trim()) {
                  toast.error("Give a reason so the redraft has something to work from");
                  return;
                }
                void act("Rejected — nothing was sent", () =>
                  rejectCorrectionPlan(latest!.id, note.trim()),
                );
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {latest?.rejected_reason && (
        <div className="mt-3 text-xs text-obsidian/60">
          Rejected: {latest.rejected_reason}. Nothing was sent.
        </div>
      )}
      {latest?.last_error && (
        <div className="mt-3 flex gap-2 rounded-[3px] border border-red-200 bg-red-50 p-2 text-xs text-red-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {latest.last_error}
        </div>
      )}

      {events.length > 0 && (
        <ul className="mt-3 space-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
          {events.map((e) => (
            <li key={e.id}>
              {new Date(e.created_at).toLocaleString()} · {e.event_type}
              {e.actor_label ? ` · ${e.actor_label}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
