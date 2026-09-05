import { PlanGate } from "@/components/feature-lock";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FileText, Plus, PenLine, Eye, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  LIEN_DOC_TYPES,
  addLienDoc,
  getLienSettings,
  listLienDocs,
  markLienDocSent,
  renderLienDocText,
  subscribeLienStore,
  type LienDoc,
  type LienDocStatus,
  type LienDocType,
} from "@/lib/lien-rights-store";
import { PROJECTS, fullAddress, type Project } from "@/lib/projects-data";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/portal/lien-rights/documents")({
  head: () => ({
    meta: [
      { title: "Lien Documents — Cleard" },
      {
        name: "description",
        content: "Generate and track Florida Statute 713 lien documents for every project.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PlanGate feature="lien_rights">
      <LienDocumentsPage />
    </PlanGate>
  ),
});

const statusTone: Record<LienDocStatus, MetricTone> = {
  Draft: "neutral",
  Sent: "info",
  Recorded: "success",
};

function useLienDocs() {
  return useSyncExternalStore(subscribeLienStore, listLienDocs, listLienDocs);
}

function LienDocumentsPage() {
  const docs = useLienDocs();
  const [genOpen, setGenOpen] = useState(false);
  const [viewing, setViewing] = useState<LienDoc | null>(null);
  const [signing, setSigning] = useState<LienDoc | null>(null);

  return (
    <PageShell
      title="Lien Rights"
      meta={`${docs.length} document${docs.length === 1 ? "" : "s"}`}
      actions={
        <Button size="sm" className="rounded-none" onClick={() => setGenOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Generate Document
        </Button>
      }
    >
      {docs.length === 0 ? (
        <EmptyState
          title="No lien documents yet"
          description="Generate a Notice of Commencement, notice to owner, or lien waiver to get started."
          icon={<FileText className="h-4 w-4" />}
          action={
            <Button size="sm" className="rounded-none" onClick={() => setGenOpen(true)}>
              Generate Document
            </Button>
          }
        />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Project Address</th>
              <th>Generated</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="text-[13px] font-medium">{d.type}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.id} · {d.project}
                  </div>
                </td>
                <td className="text-[12px] text-muted-foreground">{d.address}</td>
                <td className="text-[12px]">{d.generatedAt}</td>
                <td>
                  <StatusChip tone={statusTone[d.status]}>{d.status}</StatusChip>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none"
                      onClick={() => setViewing(d)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none"
                      onClick={() => {
                        markLienDocSent(d.id);
                        setSigning(d);
                      }}
                    >
                      <PenLine className="mr-1.5 h-3.5 w-3.5" /> Send for Signature
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <GenerateDialog open={genOpen} onOpenChange={setGenOpen} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-3xl rounded-none">
          <DialogTitle className="text-[15px] font-semibold">{viewing?.type}</DialogTitle>
          <DialogDescription className="text-[12px]">
            {viewing?.id} · generated {viewing?.generatedAt}
          </DialogDescription>
          <pre
            className="mt-3 max-h-[60vh] overflow-auto border p-4 text-[12px] leading-relaxed"
            style={{ borderColor: "var(--p-border)", backgroundColor: "var(--p-bg)" }}
          >
            {viewing ? renderLienDocText(viewing) : ""}
          </pre>
          <div className="mt-4 flex justify-end">
            <Button size="sm" className="rounded-none" onClick={() => setViewing(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!signing} onOpenChange={(v) => !v && setSigning(null)}>
        <DialogContent className="max-w-md rounded-none">
          <DialogTitle className="text-[15px] font-semibold">E-sign request sent</DialogTitle>
          <DialogDescription className="text-[12px]">
            E-sign request sent via SignWell for {signing?.type} ({signing?.id}).
          </DialogDescription>
          <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: "#9C6B3F" }}>
            <CheckCircle2 className="h-4 w-4" /> Awaiting signature from {signing?.ownerOrGc}.
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" className="rounded-none" onClick={() => setSigning(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function fmtContractAmount(cents: number | undefined): string {
  if (!cents || cents <= 0) return "";
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function GenerateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const session = useSession();
  const claimantDefault =
    getLienSettings().claimant.companyName || session.tenantName || "";
  const projects = PROJECTS;
  const firstProject = projects[0];

  const [projectId, setProjectId] = useState(firstProject?.id ?? "");
  const [type, setType] = useState<LienDocType>(LIEN_DOC_TYPES[0]!);
  const [projectName, setProjectName] = useState(firstProject?.name ?? "");
  const [projectAddress, setProjectAddress] = useState(
    firstProject ? fullAddress(firstProject) : "",
  );
  const [claimant, setClaimant] = useState(claimantDefault);
  const [ownerOrGc, setOwnerOrGc] = useState(firstProject?.client ?? "");
  const [amount, setAmount] = useState(fmtContractAmount(firstProject?.value_cents));
  const [throughDate, setThroughDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<LienDoc | null>(null);

  const isWaiver = type.startsWith("Lien Waiver");

  /** Fill every field from a project record; blanks stay blank (placeholders show). */
  function applyProject(p: Project | undefined) {
    setProjectName(p?.name ?? "");
    setProjectAddress(p ? fullAddress(p) : "");
    setOwnerOrGc(p?.client ?? "");
    setAmount(fmtContractAmount(p?.value_cents));
  }

  // Pre-populate on every open so the user never sees blank fields.
  useEffect(() => {
    if (!open) return;
    const p = projects.find((x) => x.id === projectId) ?? firstProject;
    if (p && p.id !== projectId) setProjectId(p.id);
    applyProject(p);
    setClaimant(getLienSettings().claimant.companyName || session.tenantName || "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session.tenantName]);

  function reset() {
    setType(LIEN_DOC_TYPES[0]!);
    setProjectId(firstProject?.id ?? "");
    applyProject(firstProject);
    setClaimant(claimantDefault);
    setThroughDate("");
    setError(null);
    setCreated(null);
  }


  function submit() {
    if (!projectName.trim() || !projectAddress.trim()) {
      setError("Project name and property address are required.");
      return;
    }
    if (!claimant.trim() || !ownerOrGc.trim() || !amount.trim()) {
      setError("Claimant, owner/GC, and contract amount are required.");
      return;
    }
    if (isWaiver && !throughDate) {
      setError("Through Date is required for lien waivers.");
      return;
    }
    setError(null);
    setCreated(
      addLienDoc({
        type,
        project: projectName.trim(),
        address: projectAddress.trim(),
        claimant: claimant.trim(),
        ownerOrGc: ownerOrGc.trim(),
        contractAmount: amount.trim(),
        ...(isWaiver ? { throughDate } : {}),
      }),
    );
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
        {created ? (
          <>
            <DialogTitle className="text-[15px] font-semibold">Document generated</DialogTitle>
            <DialogDescription className="text-[12px]">
              {created.type} ({created.id}) was added to your lien documents as a Draft.
            </DialogDescription>
            <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: "#9C6B3F" }}>
              <CheckCircle2 className="h-4 w-4" /> {created.project} — {created.address}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button size="sm" variant="outline" className="rounded-none" onClick={reset}>
                Generate another
              </Button>
              <Button
                size="sm"
                className="rounded-none"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="text-[15px] font-semibold">Generate Lien Document</DialogTitle>
            <DialogDescription className="text-[12px]">
              Drafted under Florida Statute 713 using your claimant profile.
            </DialogDescription>

            <div className="mt-4 space-y-3">
              <Field label="Document type">
                <Select value={type} onValueChange={(v) => setType(v as LienDocType)}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIEN_DOC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Project">
                <Select
                  value={projectId}
                  onValueChange={(v) => {
                    setProjectId(v);
                    applyProject(projects.find((p) => p.id === v));
                  }}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Project name">
                <Input
                  className="rounded-none"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project or job name"
                />
              </Field>

              <Field label="Claimant name">
                <Input
                  className="rounded-none"
                  value={claimant}
                  onChange={(e) => setClaimant(e.target.value)}
                  placeholder="Not on file — add your company name"
                />
              </Field>

              <Field label="Owner / GC name">
                <Input
                  className="rounded-none"
                  value={ownerOrGc}
                  onChange={(e) => setOwnerOrGc(e.target.value)}
                  placeholder="Not on file — add owner or general contractor"
                />
              </Field>

              <Field label="Property address">
                <Input
                  className="rounded-none"
                  value={projectAddress}
                  onChange={(e) => setProjectAddress(e.target.value)}
                  placeholder="Not on file — add street, city, FL ZIP"
                />
              </Field>

              <Field label="Contract amount">
                <Input
                  className="rounded-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$865,000"
                />
              </Field>

              {isWaiver && (
                <Field label="Through date">
                  <Input
                    type="date"
                    className="rounded-none"
                    value={throughDate}
                    onChange={(e) => setThroughDate(e.target.value)}
                  />
                </Field>
              )}

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
                Generate
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
