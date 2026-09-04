import { PlanGate } from "@/components/feature-lock";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { Download, FileStack, Plus, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell, TableShell, StatusChip, EmptyState, type MetricTone } from "@/components/ui-kit";
import {
  FL_COUNTIES,
  addERecordRequest,
  listERecordRequests,
  listLienDocs,
  subscribeLienStore,
  type ERecordStatus,
} from "@/lib/lien-rights-store";

export const Route = createFileRoute("/portal/lien-rights/e-recording")({
  head: () => ({
    meta: [
      { title: "E-Recording — Cleard" },
      {
        name: "description",
        content: "Submit lien documents for county e-recording and track their status.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PlanGate feature="lien_rights">
      <ERecordingPage />
    </PlanGate>
  ),
});

const tone: Record<ERecordStatus, MetricTone> = {
  Pending: "warning",
  "Submitted to County": "info",
  Recorded: "success",
  Rejected: "danger",
};

function ERecordingPage() {
  const requests = useSyncExternalStore(subscribeLienStore, listERecordRequests, listERecordRequests);
  const [open, setOpen] = useState(false);

  return (
    <PageShell
      title="Lien Rights"
      meta={`${requests.length} e-recording request${requests.length === 1 ? "" : "s"}`}
      actions={
        <Button size="sm" className="rounded-none" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Submit for E-Recording
        </Button>
      }
    >
      {requests.length === 0 ? (
        <EmptyState
          title="No e-recording requests yet"
          description="Generate a document and submit it for recording."
          icon={<FileStack className="h-4 w-4" />}
          action={
            <Button size="sm" className="rounded-none" asChild>
              <Link to="/portal/lien-rights/documents">Go to Documents</Link>
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Document Type</th>
              <th>County</th>
              <th>Submitted</th>
              <th>Status</th>
              <th className="text-right">Recorded Copy</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="text-[13px] font-medium">{r.id}</td>
                <td className="text-[12px]">{r.documentType}</td>
                <td className="text-[12px]">{r.county}</td>
                <td className="text-[12px]">{r.submittedAt}</td>
                <td>
                  <StatusChip tone={tone[r.status]}>{r.status}</StatusChip>
                </td>
                <td className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none"
                    disabled={r.status !== "Recorded"}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download Recorded Copy
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <SubmitDialog open={open} onOpenChange={setOpen} />
    </PageShell>
  );
}

function SubmitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const recordable = listLienDocs().filter((d) => d.status === "Recorded");
  const [docId, setDocId] = useState<string>("");
  const [county, setCounty] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setDocId("");
    setCounty("");
    setError(null);
    setDone(false);
  }

  function submit() {
    if (!docId || !county) {
      setError("Select a document and a county.");
      return;
    }
    setError(null);
    addERecordRequest(docId, county);
    setDone(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg rounded-none">
        {done ? (
          <>
            <DialogTitle className="text-[15px] font-semibold">Request submitted</DialogTitle>
            <DialogDescription className="text-[12px]">
              E-recording request submitted. Cleard will file with the county and upload the recorded
              copy when available.
            </DialogDescription>
            <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: "#9C6B3F" }}>
              <CheckCircle2 className="h-4 w-4" /> Queued for {county} County.
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                size="sm"
                className="rounded-none"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="text-[15px] font-semibold">Submit for E-Recording</DialogTitle>
            <DialogDescription className="text-[12px]">
              Only documents in Recorded status are eligible for county filing.
            </DialogDescription>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  Document
                </Label>
                <div className="mt-1.5">
                  <Select value={docId} onValueChange={setDocId}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue
                        placeholder={
                          recordable.length ? "Select a document" : "No recorded documents available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {recordable.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.id} — {d.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                  County
                </Label>
                <div className="mt-1.5">
                  <Select value={county} onValueChange={setCounty}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Select a county" />
                    </SelectTrigger>
                    <SelectContent>
                      {FL_COUNTIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <p className="text-[12px]" style={{ color: "#C0392B" }}>
                  {error}
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-none"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" className="rounded-none" onClick={submit}>
                Submit
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
