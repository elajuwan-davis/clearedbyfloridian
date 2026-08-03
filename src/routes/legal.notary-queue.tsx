import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { AdminOnly } from "@/components/admin-only";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarClock, CheckCircle2, Scale, Stamp, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  NOTARY_EVT,
  completeNotary,
  failNotary,
  listNotaryRequests,
  notaryBadge,
  scheduleNotary,
  type NotaryRequest,
} from "@/lib/notary-requests";
import { addDoc } from "@/lib/project-documents";

export const Route = createFileRoute("/legal/notary-queue")({
  head: () => ({
    meta: [
      { title: "Remote Notary Queue — Cleard" },
      {
        name: "description",
        content: "Schedule and track Remote Online Notarization sessions for permit documents.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <RemoteNotaryQueuePage />
    </AdminOnly>
  ),
});

function RemoteNotaryQueuePage() {
  const [reqs, setReqs] = useState<NotaryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState<NotaryRequest | null>(null);

  const refresh = useCallback(async () => {
    try {
      setReqs(await listNotaryRequests());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load notary queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onEvt = () => void refresh();
    window.addEventListener(NOTARY_EVT, onEvt);
    return () => window.removeEventListener(NOTARY_EVT, onEvt);
  }, [refresh]);

  async function complete(r: NotaryRequest) {
    const filename = `notarized-${r.documentName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
    try {
      await completeNotary(r.id, filename);
      try {
        await addDoc({
          projectId: r.permitId,
          type: "Civil / Other",
          filename: `[Notarized] ${filename}`,
          uploadedBy: "Cleard Notary",
        });
        toast.success("Notarized — copy filed to the project Document Vault");
      } catch {
        toast.success("Notarization marked complete");
      }
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete");
    }
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Internal · Legal
            </div>
            <h1 className="display-serif mt-2 text-4xl text-obsidian">Remote Notary Queue</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Documents awaiting Remote Online Notarization pursuant to Florida Statute §117.265.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-[3px] gap-1.5">
            <Link to="/legal">
              <Scale className="h-3.5 w-3.5" /> Legal Library
            </Link>
          </Button>
        </div>

        <div className="mt-8 overflow-x-auto border border-obsidian/12 bg-white rounded-[3px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-obsidian/10 bg-paper-warm text-left">
                <Th>Document</Th>
                <Th>Project</Th>
                <Th>GC</Th>
                <Th>Requested</Th>
                <Th>Session</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-obsidian/55">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && reqs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Stamp className="mx-auto h-5 w-5 text-obsidian/35" />
                    <div className="mt-2 text-sm text-obsidian/55">
                      No documents in the notary queue.
                    </div>
                  </td>
                </tr>
              )}
              {reqs.map((r) => {
                const badge = notaryBadge(r.status);
                return (
                  <tr key={r.id} className="border-b border-obsidian/8 last:border-0 align-top">
                    <td className="px-4 py-3 text-obsidian">{r.documentName}</td>
                    <td className="px-4 py-3">
                      <Link
                        to="/portal/permits/$id"
                        params={{ id: r.permitId }}
                        className="text-sky-700 hover:underline"
                      >
                        {r.projectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-obsidian/70">
                      {r.clientName ?? r.createdBy}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-obsidian/70">
                      {r.createdAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      {r.sessionAt ? (
                        <div className="text-xs text-obsidian/75">
                          <div className="font-mono tabular-nums">
                            {r.sessionAt.replace("T", " ")}
                          </div>
                          <div className="text-obsidian/55">
                            {r.provider} · {r.confirmationNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-obsidian/45">—</span>
                      )}
                      {r.failureReason && (
                        <div className="mt-1 text-xs text-red-700">{r.failureReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] ${badge.className}`}
                      >
                        {badge.iconSeal && <Stamp className="h-2.5 w-2.5" />} {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {(r.status === "requested" || r.status === "failed") && (
                          <Button
                            size="sm"
                            variant="dark"
                            className="rounded-[3px] gap-1.5"
                            onClick={() => setScheduling(r)}
                          >
                            <CalendarClock className="h-3.5 w-3.5" /> Schedule Notary Session
                          </Button>
                        )}
                        {r.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="dark"
                              className="rounded-[3px] gap-1.5"
                              onClick={() => void complete(r)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Notarized
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-[3px] gap-1.5"
                              onClick={async () => {
                                try {
                                  await failNotary(
                                    r.id,
                                    "Signer did not appear for the RON session.",
                                  );
                                  toast.error("Session marked failed");
                                  await refresh();
                                } catch (e) {
                                  toast.error(
                                    e instanceof Error ? e.message : "Failed to update",
                                  );
                                }
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Failed
                            </Button>
                          </>
                        )}
                        {r.status === "completed" && r.notarizedFilename && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
                            {r.notarizedFilename}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleDialog
        req={scheduling}
        onClose={() => setScheduling(null)}
        onSaved={refresh}
      />
    </PortalShell>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-obsidian/55">
      {children}
    </th>
  );
}

function ScheduleDialog({
  req,
  onClose,
  onSaved,
}: {
  req: NotaryRequest | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [sessionAt, setSessionAt] = useState("");
  const [provider, setProvider] = useState("Cleard In-House RON");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (req) {
      setSessionAt("");
      setConfirmation("");
    }
  }, [req]);

  return (
    <Dialog open={req !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-[3px]">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl text-obsidian">
            Schedule Notary Session
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-obsidian/65">
          {req?.documentName} · {req?.projectName}
        </p>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Session date &amp; time</Label>
            <Input
              type="datetime-local"
              className="mt-1.5 rounded-[3px]"
              value={sessionAt}
              onChange={(e) => setSessionAt(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Notary provider</Label>
            <Input
              className="mt-1.5 rounded-[3px]"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Confirmation number</Label>
            <Input
              className="mt-1.5 rounded-[3px]"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="RON-2026-04812"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-[3px]" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="dark"
            className="rounded-[3px]"
            disabled={busy}
            onClick={async () => {
              if (!req) return;
              if (!sessionAt) return toast.error("Pick a session date and time");
              setBusy(true);
              try {
                await scheduleNotary(req.id, {
                  sessionAt,
                  provider: provider.trim(),
                  confirmationNumber: confirmation.trim() || "pending",
                });
                toast.success("Notary session scheduled");
                await onSaved();
                onClose();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to schedule");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
