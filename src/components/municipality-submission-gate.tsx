// Agent 5 — the runtime approval gate, in the UI.
//
// "Submit to Municipality" drafts; it does not file. The draft shows exactly what would be
// sent (municipality, channel, every document, every portal field value), and a staff
// member has to tap Approve & File before anything reaches the building department. The
// approve call is an RPC that only Cleard staff may execute; the release happens in the
// database trigger, not here.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/use-session";
import {
  approveMunicipalitySubmission,
  draftMunicipalitySubmission,
  listSubmissionEvents,
  loadLatestSubmission,
  rejectMunicipalitySubmission,
  submissionBadge,
  type MunicipalitySubmission,
  type SubmissionEvent,
} from "@/lib/municipality-submit";
import {
  listCorrectionNotices,
  correctionNoticeUrl,
  type CorrectionNotice,
} from "@/lib/permit-status";

type Props = {
  permitId: string;
  /** Agent 4's verdict — a draft is refused server-side too if this is not a pass. */
  preSubmissionPassed: boolean;
};

export function MunicipalitySubmissionGate({ permitId, preSubmissionPassed }: Props) {
  const { isAdmin, loading } = useSession();
  const [submission, setSubmission] = useState<MunicipalitySubmission | null>(null);
  const [events, setEvents] = useState<SubmissionEvent[]>([]);
  const [notices, setNotices] = useState<CorrectionNotice[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    const row = await loadLatestSubmission(permitId).catch(() => null);
    setSubmission(row);
    setEvents(row ? await listSubmissionEvents(row.id).catch(() => []) : []);
    setNotices(await listCorrectionNotices(permitId).catch(() => []));
  }, [permitId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A filing in flight changes state outside the browser (edge function, then worker).
  useEffect(() => {
    if (!submission || !["approved", "submitting"].includes(submission.status)) return;
    const t = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(t);
  }, [submission, refresh]);

  if (loading || !isAdmin) return null;

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

  const draft = submission?.draft;
  const pending = submission?.status === "draft_pending_approval";
  const badge = submission ? submissionBadge(submission.status) : null;

  return (
    <div
      id="municipality-submission"
      className="rounded-[3px] border border-obsidian/12 bg-white p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-obsidian">Municipality submission</div>
        {badge && (
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        {submission?.confirmation_number && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800">
            confirmation {submission.confirmation_number}
          </span>
        )}
        {(!submission || ["rejected", "failed"].includes(submission.status)) && (
          <Button
            variant="dark"
            className="ml-auto rounded-[3px]"
            disabled={busy || !preSubmissionPassed}
            title={
              preSubmissionPassed
                ? "Draft the submission for staff approval"
                : "Blocked until every pre-submission check passes"
            }
            onClick={() =>
              act("Draft ready for approval", () => draftMunicipalitySubmission({ permitId }))
            }
          >
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit to Municipality
          </Button>
        )}
      </div>

      {pending && (
        <div className="mt-3 flex gap-2 rounded-[3px] border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Nothing has been filed. This package is submitted only when a staff member approves it
          below.
        </div>
      )}

      {draft && (
        <div className="mt-3 space-y-2 text-xs text-obsidian/80">
          <div>
            <span className="font-semibold text-obsidian">Municipality:</span>{" "}
            {draft.municipality.city_name} —{" "}
            {draft.municipality.channel === "portal"
              ? draft.municipality.portal_url
              : `email intake ${draft.municipality.intake_email}`}
          </div>
          <div>
            <span className="font-semibold text-obsidian">Permit:</span>{" "}
            {draft.permit.project_name ?? draft.permit.job_address ?? draft.permit.id}
            {draft.permit.permit_type ? ` · ${draft.permit.permit_type}` : ""}
          </div>
          <div>
            <span className="font-semibold text-obsidian">
              Documents ({draft.documents.length}):
            </span>
            <ul className="mt-1 space-y-0.5">
              {draft.documents.map((d) => (
                <li key={d.path} className="font-mono text-[10px] text-obsidian/60">
                  {d.label} — {d.path}
                </li>
              ))}
            </ul>
          </div>
          {draft.portal_fields && (
            <div>
              <span className="font-semibold text-obsidian">Portal fields:</span>
              <ul className="mt-1 space-y-0.5">
                {Object.entries(draft.portal_fields).map(([k, v]) => (
                  <li key={k} className="font-mono text-[10px] text-obsidian/60">
                    {k}: {v === null || v === "" ? "—" : String(v)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {draft.email && (
            <div>
              <span className="font-semibold text-obsidian">Email:</span>{" "}
              <span className="font-mono text-[10px]">{draft.email.subject}</span>
              <pre className="mt-1 whitespace-pre-wrap rounded-[3px] bg-paper-warm p-2 font-mono text-[10px] text-obsidian/70">
                {draft.email.body_text}
              </pre>
            </div>
          )}
        </div>
      )}

      {pending && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Approval note (optional)
            </label>
            <Input
              className="mt-1.5 rounded-[3px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reviewed plans + fee receipt"
            />
          </div>
          <Button
            variant="dark"
            className="rounded-[3px]"
            disabled={busy}
            onClick={() =>
              act("Approved — filing now", async () => {
                await approveMunicipalitySubmission(submission!.id, note.trim() || undefined);
                setNote("");
              })
            }
          >
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Approve &amp; File
          </Button>
          <Button
            variant="outline"
            className="rounded-[3px]"
            disabled={busy}
            onClick={() =>
              act("Draft rejected", () =>
                rejectMunicipalitySubmission(submission!.id, note.trim() || "Rejected by staff"),
              )
            }
          >
            <X className="h-4 w-4 mr-2" /> Reject
          </Button>
        </div>
      )}

      {submission?.last_error && (
        <div className="mt-3 flex gap-2 rounded-[3px] border border-red-200 bg-red-50 p-2 text-xs text-red-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {submission.last_error}
        </div>
      )}

      {/* Agent 6: what the 4-hourly poll last read off the portal, and anything it found. */}
      {submission?.status === "submitted" && (
        <div className="mt-3 rounded-[3px] border border-obsidian/12 bg-parchment/40 p-2 text-xs text-obsidian/75">
          <span className="font-semibold">Portal status</span>{" "}
          {submission.portal_status_raw ?? "not read yet"}
          {submission.portal_status_checked_at && (
            <span className="text-obsidian/50">
              {" "}
              · checked {new Date(submission.portal_status_checked_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {notices.length > 0 && (
        <div className="mt-3 rounded-[3px] border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          <div className="font-semibold">Correction notices</div>
          <ul className="mt-1 space-y-1">
            {notices.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-2">
                <span>{n.notice_label ?? "Correction notice"}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-amber-800">
                  {n.status}
                </span>
                {n.document_path && (
                  <button
                    type="button"
                    className="underline"
                    onClick={async () => {
                      const url = await correctionNoticeUrl(n.document_path!);
                      if (url) window.open(url, "_blank", "noopener");
                      else toast.error("Could not open the notice");
                    }}
                  >
                    open
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {events.length > 0 && (
        <ul className="mt-4 space-y-1">
          {events.map((e) => (
            <li key={e.id} className="font-mono text-[10px] text-obsidian/55">
              {new Date(e.created_at).toLocaleString()} · {e.event_type}
              {e.actor_label ? ` · ${e.actor_label}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
