import { useEffect, useState } from "react";
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
import { FileSignature, Loader2, Download, Stamp } from "lucide-react";
import { toast } from "sonner";

/* Frontend-only Lien Release UI.
   PDF generation and the SignWell / BlueNotary calls are wired separately by
   engineering; requests here are held in local state + localStorage. */

export type ReleaseType =
  | "partial_conditional"
  | "partial_unconditional"
  | "final_conditional"
  | "final_unconditional";

export const RELEASE_TYPE_LABEL: Record<ReleaseType, string> = {
  partial_conditional: "Partial Conditional Release",
  partial_unconditional: "Partial Unconditional Release",
  final_conditional: "Final / Full Conditional Release",
  final_unconditional: "Final / Full Unconditional Release",
};

const RELEASE_TYPE_ORDER: ReleaseType[] = [
  "partial_conditional",
  "partial_unconditional",
  "final_conditional",
  "final_unconditional",
];

function isConditional(t: ReleaseType) {
  return t === "partial_conditional" || t === "final_conditional";
}

export type ReleaseStatus =
  | "draft"
  | "sent_for_signature"
  | "signed"
  | "notarization_requested"
  | "notarized"
  | "complete";

export type LienReleaseEntry = {
  id: string;
  type: ReleaseType;
  claimantName: string;
  ownerName: string;
  projectAddress: string;
  throughDate: string;
  amount: string;
  recipientEmail: string;
  status: ReleaseStatus;
  requestedAt: string;
};

export function releaseStatusBadge(status: ReleaseStatus): { label: string; className: string } {
  switch (status) {
    case "sent_for_signature":
      return {
        label: "Sent for Signature",
        className: "border-[#D4A017]/40 bg-[#D4A017]/12 text-[#8A6A0B]",
      };
    case "signed":
      return { label: "Signed", className: "border-[#0072CE]/40 bg-[#0072CE]/12 text-[#005AA3]" };
    case "notarization_requested":
      return {
        label: "Notarization Requested",
        className: "border-[#D4A017]/40 bg-[#D4A017]/12 text-[#8A6A0B]",
      };
    case "notarized":
      return {
        label: "Notarized",
        className: "border-[#6B3FA0]/40 bg-[#6B3FA0]/12 text-[#54317E]",
      };
    case "complete":
      return {
        label: "Complete",
        className: "border-[#2E7D32]/40 bg-[#2E7D32]/12 text-[#1F5E23]",
      };
    default:
      return { label: "Draft", className: "border-black/15 bg-black/5 text-black/60" };
  }
}

export function LienReleaseStatusBadge({ status }: { status: ReleaseStatus }) {
  const badge = releaseStatusBadge(status);
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

const STORE_PREFIX = "cleard:lien-releases:";

function loadEntries(projectId: string): LienReleaseEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_PREFIX + projectId);
    return raw ? (JSON.parse(raw) as LienReleaseEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(projectId: string, entries: LienReleaseEntry[]) {
  try {
    window.localStorage.setItem(STORE_PREFIX + projectId, JSON.stringify(entries));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

export function LienReleasesTab({
  projectId,
  projectName,
  claimantName,
  ownerName,
  projectAddress,
}: {
  projectId: string;
  projectName?: string;
  claimantName: string;
  ownerName: string;
  projectAddress: string;
}) {
  const [entries, setEntries] = useState<LienReleaseEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setEntries(loadEntries(projectId));
  }, [projectId]);

  function update(next: LienReleaseEntry[]) {
    setEntries(next);
    saveEntries(projectId, next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[3px] border border-black/12 bg-white p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-black/55">
            Fla. Stat. §713 · Waiver &amp; Release of Lien
          </div>
          <h2 className="display-serif mt-1 text-2xl text-black">Lien Releases</h2>
          <p className="mt-1 text-sm text-black/60">
            {projectName ? `${projectName} · ` : ""}Prepare conditional and unconditional releases,
            send them for signature, and route signed releases to a notary.
          </p>
        </div>
        <Button
          className="rounded-[3px] bg-[#9C6B3F] text-white hover:bg-[#8A5D35]"
          onClick={() => setOpen(true)}
        >
          <FileSignature className="mr-2 h-4 w-4" /> Request Lien Release
        </Button>
      </div>

      <section className="rounded-[3px] border border-black/12 bg-white">
        <div className="border-b border-black/10 px-5 py-4">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-black">
            Lien Releases
          </h3>
        </div>
        {entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileSignature className="mx-auto h-5 w-5 text-black/30" />
            <p className="mt-3 text-sm text-black/55">
              No lien releases requested yet. Request one above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <Th>Type</Th>
                  <Th>Claimant</Th>
                  <Th>Through Date</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-black/8 last:border-0">
                    <td className="px-4 py-3 text-black">{RELEASE_TYPE_LABEL[e.type]}</td>
                    <td className="px-4 py-3 text-black/70">
                      <div>{e.claimantName}</div>
                      <div className="font-mono text-[10px] text-black/50">{e.recipientEmail}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-black/65">
                      {e.throughDate || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-black/65">
                      {isConditional(e.type) && e.amount ? e.amount : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LienReleaseStatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3">
                      {e.status === "complete" ? (
                        <button
                          type="button"
                          onClick={() => toast.info("Signed release PDF will download once generated.")}
                          className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#9C6B3F]/40 px-2.5 py-1 text-xs font-medium text-[#9C6B3F] hover:bg-[#9C6B3F]/8"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      ) : e.status === "signed" ? (
                        <button
                          type="button"
                          onClick={() => {
                            update(
                              entries.map((r) =>
                                r.id === e.id ? { ...r, status: "notarization_requested" } : r,
                              ),
                            );
                            toast.success("Sent to notary — signer will receive a session invitation");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#9C6B3F]/40 px-2.5 py-1 text-xs font-medium text-[#9C6B3F] hover:bg-[#9C6B3F]/8"
                        >
                          <Stamp className="h-3.5 w-3.5" /> Send to Notary
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/40">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <RequestLienReleaseDialog
        open={open}
        onOpenChange={setOpen}
        claimantName={claimantName}
        ownerName={ownerName}
        projectAddress={projectAddress}
        onCreated={(entry) => update([entry, ...entries])}
      />
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

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1.5 rounded-[3px] border border-black/12 bg-black/[0.03] px-3 py-2 text-sm text-black/70">
        {value || "—"}
      </div>
    </div>
  );
}

function RequestLienReleaseDialog({
  open,
  onOpenChange,
  claimantName,
  ownerName,
  projectAddress,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  claimantName: string;
  ownerName: string;
  projectAddress: string;
  onCreated: (entry: LienReleaseEntry) => void;
}) {
  const [type, setType] = useState<ReleaseType>("partial_conditional");
  const [throughDate, setThroughDate] = useState("");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setType("partial_conditional");
      setThroughDate("");
      setAmount("");
      setEmail("");
      setBusy(false);
    }
  }, [open]);

  async function submit() {
    if (!throughDate) {
      toast.error("Select a through date");
      return;
    }
    if (isConditional(type) && !amount.trim()) {
      toast.error("Amount is required for conditional releases");
      return;
    }
    if (!email.trim()) {
      toast.error("Recipient email is required");
      return;
    }
    setBusy(true);
    // Mocked: release PDF generation + SignWell send (wired live later)
    await new Promise((r) => setTimeout(r, 900));
    onCreated({
      id: crypto.randomUUID(),
      type,
      claimantName,
      ownerName,
      projectAddress,
      throughDate,
      amount: amount.trim(),
      recipientEmail: email.trim(),
      status: "sent_for_signature",
      requestedAt: new Date().toISOString(),
    });
    setBusy(false);
    onOpenChange(false);
    toast.success("Release sent for signature");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[3px]">
        <DialogHeader>
          <DialogTitle className="display-serif text-2xl text-black">
            Request Lien Release
          </DialogTitle>
          <DialogDescription className="text-sm text-black/65">
            Project details are pre-filled from this project. The recipient signs electronically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Release Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReleaseType)}
              className="mt-1.5 block w-full rounded-[3px] border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none"
            >
              {RELEASE_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {RELEASE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <ReadOnly label="Claimant Name" value={claimantName} />
          <ReadOnly label="Owner Name" value={ownerName} />
          <ReadOnly label="Project Address" value={projectAddress} />

          <div>
            <Label className="text-xs">Through Date</Label>
            <Input
              type="date"
              className="mt-1.5 rounded-[3px]"
              value={throughDate}
              onChange={(e) => setThroughDate(e.target.value)}
            />
          </div>

          {isConditional(type) && (
            <div>
              <Label className="text-xs">Amount</Label>
              <Input
                className="mt-1.5 rounded-[3px]"
                placeholder="$0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label className="text-xs">Recipient Email</Label>
            <Input
              type="email"
              className="mt-1.5 rounded-[3px]"
              placeholder="who signs this release"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <Button
          disabled={busy}
          onClick={submit}
          className="mt-2 w-full rounded-[3px] bg-[#9C6B3F] text-white hover:bg-[#8A5D35]"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Send for Signature
        </Button>
      </DialogContent>
    </Dialog>
  );
}
