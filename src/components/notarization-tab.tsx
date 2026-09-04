import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Stamp, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/* Frontend-only Remote Notarization UI.
   The BlueNotary session endpoint (/api/bluenotary/create-session) is mocked
   here; engineering will wire the live call and persistence separately. */

export type NotarizationStatus = "not_started" | "pending" | "in_session" | "notarized";

export type NotarizationEntry = {
  id: string;
  documentName: string;
  signerFirstName: string;
  signerLastName: string;
  signerEmail: string;
  status: Exclude<NotarizationStatus, "not_started">;
  requestedAt: string;
  sessionUrl: string;
};

const STORE_PREFIX = "cleard:notarizations:";

function loadEntries(projectId: string): NotarizationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_PREFIX + projectId);
    return raw ? (JSON.parse(raw) as NotarizationEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(projectId: string, entries: NotarizationEntry[]) {
  try {
    window.localStorage.setItem(STORE_PREFIX + projectId, JSON.stringify(entries));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

export function statusBadge(status: NotarizationStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "pending":
      return {
        label: "Pending Notarization",
        className: "border-[#D4A017]/40 bg-[#D4A017]/12 text-[#8A6A0B]",
      };
    case "in_session":
      return {
        label: "In Session",
        className: "border-[#0072CE]/40 bg-[#0072CE]/12 text-[#005AA3]",
      };
    case "notarized":
      return {
        label: "Notarized ✓",
        className: "border-[#2E7D32]/40 bg-[#2E7D32]/12 text-[#1F5E23]",
      };
    default:
      return {
        label: "Not Started",
        className: "border-black/15 bg-black/5 text-black/60",
      };
  }
}

export function NotarizationStatusBadge({ status }: { status: NotarizationStatus }) {
  const badge = statusBadge(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${badge.className}`}
    >
      <Stamp className="h-2.5 w-2.5" /> {badge.label}
    </span>
  );
}

export function NotarizationTab({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName?: string;
}) {
  const [entries, setEntries] = useState<NotarizationEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setEntries(loadEntries(projectId));
  }, [projectId]);

  const overall: NotarizationStatus = useMemo(() => {
    if (entries.length === 0) return "not_started";
    if (entries.some((e) => e.status === "in_session")) return "in_session";
    if (entries.some((e) => e.status === "pending")) return "pending";
    return "notarized";
  }, [entries]);

  function addEntry(entry: NotarizationEntry) {
    const next = [entry, ...entries];
    setEntries(next);
    saveEntries(projectId, next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[3px] border border-black/12 bg-white p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/55">
            Remote Online Notarization · Fla. Stat. §117.265
          </div>
          <h2 className="display-serif mt-1 text-2xl text-black">Notarization</h2>
          <p className="mt-1 text-sm text-black/60">
            {projectName ? `${projectName} · ` : ""}Send affidavits and owner authorizations to a
            commissioned Florida notary without leaving the portal.
          </p>
          <div className="mt-3">
            <NotarizationStatusBadge status={overall} />
          </div>
        </div>
        <Button
          className="rounded-[3px] bg-[#9C6B3F] text-white hover:bg-[#8A5D35]"
          onClick={() => setOpen(true)}
        >
          <Stamp className="mr-2 h-4 w-4" /> Request Notarization
        </Button>
      </div>

      <section className="rounded-[3px] border border-black/12 bg-white">
        <div className="border-b border-black/10 px-5 py-4">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-black">
            Notarization Queue
          </h3>
        </div>
        {entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Stamp className="mx-auto h-5 w-5 text-black/30" />
            <p className="mt-3 text-sm text-black/55">No notarizations requested yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <Th>Document Name</Th>
                  <Th>Signer</Th>
                  <Th>Status</Th>
                  <Th>Date Requested</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-black/8 last:border-0">
                    <td className="px-4 py-3 text-black">{e.documentName}</td>
                    <td className="px-4 py-3 text-black/70">
                      <div>
                        {e.signerFirstName} {e.signerLastName}
                      </div>
                      <div className="font-mono text-[10px] text-black/50">{e.signerEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <NotarizationStatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-black/65">
                      {e.requestedAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={e.sessionUrl}
                        className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#9C6B3F]/40 px-2.5 py-1 text-xs font-medium text-[#9C6B3F] hover:bg-[#9C6B3F]/8"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Session
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RequestNotarizationDialog open={open} onOpenChange={setOpen} onCreated={addEntry} />
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-black/55">
      {children}
    </th>
  );
}

function RequestNotarizationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (entry: NotarizationEntry) => void;
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setFirst("");
      setLast("");
      setEmail("");
      setFile(null);
      setBusy(false);
      setDone(false);
    }
  }, [open]);

  async function submit() {
    if (!first.trim() || !last.trim() || !email.trim()) {
      toast.error("Signer name and email are required");
      return;
    }
    if (!file) {
      toast.error("Attach the PDF to be notarized");
      return;
    }
    setBusy(true);
    // Mocked: POST /api/bluenotary/create-session (wired live later)
    await new Promise((r) => setTimeout(r, 900));
    const entry: NotarizationEntry = {
      id: crypto.randomUUID(),
      documentName: file.name,
      signerFirstName: first.trim(),
      signerLastName: last.trim(),
      signerEmail: email.trim(),
      status: "pending",
      requestedAt: new Date().toISOString(),
      sessionUrl: "#",
    };
    setBusy(false);
    setDone(true);
    onCreated(entry);
    toast.success("Sent to notary — signer will receive a session invitation");
    setTimeout(() => onOpenChange(false), 1100);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[3px]">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl text-black">
            Remote Notarization
          </DialogTitle>
          <DialogDescription className="text-sm text-black/65">
            The signer joins an audio-video session with a commissioned Florida notary. The
            notarized PDF returns to this project.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#2E7D32]" />
            <p className="mt-3 text-sm text-black/70">
              Notarization requested. Status is now{" "}
              <span className="font-medium text-black">Pending Notarization</span>.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Signer First Name</Label>
                  <Input
                    className="mt-1.5 rounded-[3px]"
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Signer Last Name</Label>
                  <Input
                    className="mt-1.5 rounded-[3px]"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Signer Email</Label>
                <Input
                  type="email"
                  className="mt-1.5 rounded-[3px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="signer@example.com"
                />
              </div>
              <div>
                <Label className="text-xs">Document (PDF only)</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  className="mt-1.5 rounded-[3px]"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-[3px]"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                className="rounded-[3px] bg-[#9C6B3F] text-white hover:bg-[#8A5D35]"
                onClick={() => void submit()}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Stamp className="mr-2 h-4 w-4" />
                )}
                Send to Notary
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
