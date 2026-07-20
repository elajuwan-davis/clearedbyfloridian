import { useEffect, useMemo, useState } from "react";
import { Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, MapPin, Building2, Hash, ExternalLink, Download,
  Upload, FileText, Trash2, Plus, MessageSquare, Users, DollarSign,
  ClipboardCheck, LayoutGrid, Pencil, CheckCircle2, Circle, AlertTriangle,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PROJECTS, getProjectById, fullAddress, type Project } from "@/lib/projects-data";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";
import { findPortalForAddress } from "@/lib/municipalities";
import { InspectionsSection } from "@/components/inspections-section";
import { ProjectManualFees } from "@/components/project-manual-fees";
import { LogPermitFeeDialog } from "@/components/log-permit-fee-dialog";
import { loadSubLibrary, coiStatus, coiLifecycleStatus, type SubRecord } from "@/lib/subcontractor-library";
import { addNote, deleteNote, listNotes, type ProjectNote } from "@/lib/project-notes";
import { DOC_TYPES, addDoc, deleteDoc, listDocs, type DocType, type ProjectDoc } from "@/lib/project-documents";
import { isInternalUser } from "@/lib/is-internal-user";
import { notificationsEnabled, setNotificationsEnabled } from "@/lib/client-notifications";
import { Bell, BellOff } from "lucide-react";

import { isPermitTypeComplete } from "@/lib/permit-type-status";
import { PCNLookupDialog } from "@/components/pcn-lookup-dialog";
import { GenerateNTBODialog, GenerateOwnerAuthDialog } from "@/components/generate-form-dialogs";
import { SendForSignatureDialog } from "@/components/send-for-signature-dialog";
import { RequestNotaryDialog } from "@/components/request-notary-dialog";
import { GenerateLienWaiverDialog } from "@/components/generate-lien-waiver-dialog";
import { LIEN_WAIVER_EVT, WAIVER_TYPE_LABEL, listWaivers, waiverBadge, type LienWaiver } from "@/lib/lien-waivers";
import { FileSignature } from "lucide-react";

import { getPCN } from "@/lib/project-pcn";
import { FileSignature, FileCheck2, MapPinned, Send, Stamp } from "lucide-react";
import { getSignatureForDoc, sigBadge, sigStatusForDocument, SIG_EVT } from "@/lib/signature-requests";
import { notaryForDoc, notaryBadge, NOTARY_EVT } from "@/lib/notary-requests";
import { getPortalRole, canRequestNotary } from "@/lib/portal-role";

const fmtMoneyWhole = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function projectDetailLoader({ params }: { params: { id: string } }) {
  const project = getProjectById(params.id);
  if (!project) throw notFound();
  return { project };
}

export function ProjectDetailNotFound() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">404</div>
        <h1 className="display-serif mt-3 text-4xl text-obsidian">Project not found</h1>
        <Button asChild variant="dark" className="mt-8 rounded-[3px]">
          <Link to="/portal/permits">Back to My Permits</Link>
        </Button>
      </div>
    </PortalShell>
  );
}

export function ProjectDetail({ project }: { project: Project }) {
  const meta = projectStatusMeta[project.status];
  const portal = findPortalForAddress(`${project.address}, ${project.city}`);
  const internal = isInternalUser();

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8 lg:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
          <Link to="/portal/permits" className="inline-flex items-center gap-1.5 hover:text-obsidian">
            <ArrowLeft className="h-3 w-3" /> My Permits
          </Link>
          <span className="text-obsidian/25">/</span>
          <span className="text-obsidian/80 truncate">{project.name}</span>
        </nav>

        {/* Header */}
        <header className="mt-6 border-b border-obsidian/10 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] rounded-[3px] ${toneClass[meta.tone]}`}>
              {meta.label}
            </span>
            <span className="inline-flex items-center border border-obsidian/15 bg-paper-warm px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 rounded-[3px]">
              {project.county} County
            </span>
            <span className="inline-flex items-center border border-obsidian/15 bg-paper-warm px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 rounded-[3px]">
              {project.city}
            </span>
            {project.permit_no && (
              <span className="inline-flex items-center gap-1 border border-obsidian/15 bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian rounded-[3px]">
                <Hash className="h-2.5 w-2.5" /> {project.permit_no}
              </span>
            )}
            {project.id.startsWith("hs-") && (
              <span
                className="inline-flex items-center gap-1 border border-[#ff7a59]/40 bg-[#ff7a59]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#c34a2f] rounded-[3px]"
                title="Auto-created from a HubSpot Closed Won deal"
              >
                Created from HubSpot deal
              </span>
            )}
          </div>
          <h1 className="display-serif mt-4 text-4xl lg:text-5xl text-obsidian">{project.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm text-obsidian/70">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-obsidian/45" />
              {fullAddress(project)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-obsidian/45" />
              {project.client}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <DollarSign className="h-3.5 w-3.5 text-obsidian/45" />
              {fmtMoneyWhole(project.value_cents)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" className="rounded-[3px]">
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Project
            </Button>
            {portal?.url ? (
              <a href={portal.url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 border border-[#153157] bg-[#153157] px-3 py-1.5 text-xs font-medium text-white rounded-[3px] hover:opacity-90">
                <ExternalLink className="h-3.5 w-3.5" /> Open {portal.name} Portal
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 border border-obsidian/15 bg-paper-warm px-3 py-1.5 text-xs text-obsidian/50 rounded-[3px]">
                City portal link unavailable
              </span>
            )}
            {internal && <ClientNotificationsToggle projectId={project.id} />}
          </div>

        </header>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-[3px] bg-paper-warm p-1">
            <TabTrigger value="overview" icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Overview" />
            <TabTrigger value="inspections" icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Inspections" />
            <TabTrigger value="documents" icon={<FileText className="h-3.5 w-3.5" />} label="Documents" />
            <TabTrigger value="subs" icon={<Users className="h-3.5 w-3.5" />} label="Subcontractors" />
            <TabTrigger value="fees" icon={<DollarSign className="h-3.5 w-3.5" />} label="Permit Fees" />
            <TabTrigger value="notes" icon={<MessageSquare className="h-3.5 w-3.5" />} label="Notes" />
          </TabsList>

          <TabsContent value="overview" className="mt-6"><OverviewTab project={project} /></TabsContent>
          <TabsContent value="inspections" className="mt-6">
            <InspectionsSection
              projectId={project.id}
              allPassedSeed={false}
              projectAddress={`${project.address}, ${project.city}`}
              municipality={portal}
            />

          </TabsContent>
          <TabsContent value="documents" className="mt-6"><DocumentsTab project={project} /></TabsContent>
          <TabsContent value="subs" className="mt-6"><SubsTab project={project} /></TabsContent>
          <TabsContent value="fees" className="mt-6"><FeesTab project={project} internal={internal} /></TabsContent>
          <TabsContent value="notes" className="mt-6"><NotesTab project={project} /></TabsContent>
        </Tabs>
      </div>
    </PortalShell>
  );
}

function TabTrigger({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 rounded-[3px] px-3 py-2 text-xs font-medium data-[state=active]:bg-[#153157] data-[state=active]:text-white data-[state=active]:shadow-sm"
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
}

/* -------------------------------- OVERVIEW -------------------------------- */

function OverviewTab({ project }: { project: Project }) {
  const meta = projectStatusMeta[project.status];
  const stages = [
    { key: "intake", label: "Intake", statuses: ["submitted", "pending"] },
    { key: "review", label: "Plan Review", statuses: ["in_review", "corrections_required", "correction_response_under_review"] },
    { key: "resub", label: "Resubmitted", statuses: ["resubmitted", "resubmitted_to_county", "approved"] },
    { key: "issued", label: "Permit Issued", statuses: ["permit_issued", "inspection_scheduled", "inspection_complete"] },
  ];
  const currentIdx = Math.max(0, stages.findIndex((s) => s.statuses.includes(project.status)));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Info */}
      <div className="space-y-6 min-w-0">
        <SectionCard title="Project Information">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <InfoRow label="General Contractor" value={project.client} />
            <InfoRow label="Permit Number" value={project.permit_no} mono />
            <InfoRow label="Municipality" value={project.city} />
            <InfoRow label="County" value={`${project.county} County`} />
            <InfoRow label="Construction Value" value={fmtMoneyWhole(project.value_cents)} mono />
            <InfoRow label="Filed" value={project.submitted_at} />
            <div className="sm:col-span-2">
              <InfoRow label="Job Site Address" value={fullAddress(project)} />
            </div>
            {project.scope && (
              <div className="sm:col-span-2">
                <InfoRow label="Scope" value={project.scope} />
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Permit Types">
          <div className="flex flex-wrap gap-2">
            {project.permit_types.map((t) => {
              const complete = isPermitTypeComplete({ id: project.id, status: project.status }, t)
                || project.status === "permit_issued";
              return (
                <span
                  key={t}
                  className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.1em] rounded-[3px] ${
                    complete
                      ? "border-emerald-600/40 bg-emerald-50 text-emerald-800"
                      : "border-red-600/40 bg-red-50 text-red-800"
                  }`}
                >
                  {t} · {complete ? "complete" : "outstanding"}
                </span>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Timeline */}
      <aside>
        <SectionCard title="Timeline">
          <ol className="relative space-y-5 border-l border-obsidian/15 pl-6">
            {stages.map((s, i) => {
              const done = i < currentIdx;
              const current = i === currentIdx;
              return (
                <li key={s.key} className="relative">
                  <span
                    className={`absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      done || current ? "border-[#153157] bg-[#153157]" : "border-obsidian/25 bg-white"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> : <Circle className="h-1.5 w-1.5 text-white/70" />}
                  </span>
                  <div className={`text-sm font-medium ${done || current ? "text-obsidian" : "text-obsidian/50"}`}>{s.label}</div>
                  {current && (
                    <div className={`mt-1 inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] ${toneClass[meta.tone]}`}>
                      {meta.label}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </SectionCard>
      </aside>
    </div>
  );
}

/* -------------------------------- DOCUMENTS ------------------------------- */

function DocumentsTab({ project }: { project: Project }) {
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [open, setOpen] = useState(false);
  const [ntboOpen, setNtboOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [pcnOpen, setPcnOpen] = useState(false);
  const [pcn, setPcnLocal] = useState("");
  const [tick, setTick] = useState(0);
  const [sigDialog, setSigDialog] = useState<{ documentName: string; docId?: string } | null>(null);
  const [notaryDialog, setNotaryDialog] = useState<{ documentName: string; docId?: string } | null>(null);
  const role = typeof window !== "undefined" ? getPortalRole() : "gc";
  const showNotary = canRequestNotary(role);

  useEffect(() => {
    const refresh = () => {
      setDocs(listDocs(project.id));
      setPcnLocal(getPCN(project.id));
      setTick((t) => t + 1);
    };
    refresh();
    const evts = ["project-docs:changed", "project-pcn:changed", SIG_EVT, NOTARY_EVT];
    evts.forEach((e) => window.addEventListener(e, refresh));
    return () => evts.forEach((e) => window.removeEventListener(e, refresh));
  }, [project.id]);

  const byType = useMemo(() => {
    const map: Record<string, ProjectDoc[]> = {};
    for (const t of DOC_TYPES) map[t] = [];
    for (const d of docs) (map[d.type] ??= []).push(d);
    return map;
  }, [docs]);

  const ntboSig = useMemo(() => sigStatusForDocument(project.id, "NTBO"), [project.id, tick]);
  const ownerSig = useMemo(() => sigStatusForDocument(project.id, "Owner Authorization"), [project.id, tick]);

  return (
    <div className="space-y-6">
      {/* Generate Forms — pre-filled private provider PDFs */}
      <div className="border border-obsidian/12 bg-white rounded-[3px]">
        <div className="flex items-center justify-between border-b border-obsidian/10 bg-paper-warm px-4 py-2.5">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/70">
            Generate Forms
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/55">
              PCN: {pcn || <span className="text-amber-700">not set</span>}
            </span>
            <Button variant="outline" size="sm" className="rounded-[3px]" onClick={() => setPcnOpen(true)}>
              <MapPinned className="mr-1.5 h-3.5 w-3.5" /> Look Up PCN
            </Button>
          </div>
        </div>
        <div className="p-4 grid gap-3 sm:grid-cols-2">
          <GenerateCard
            icon={<FileSignature className="h-4 w-4 text-obsidian/60" />}
            title="Generate NTBO"
            subtitle="Notice to Building Official — pre-filled with project + firm data."
            meta="Form 61G20-2.005 · §553.791"
            sigStatus={ntboSig ? sigBadge(ntboSig.status) : null}
            onGenerate={() => setNtboOpen(true)}
            onSend={() => setSigDialog({ documentName: "NTBO" })}
          />
          <GenerateCard
            icon={<FileCheck2 className="h-4 w-4 text-obsidian/60" />}
            title="Generate Owner Auth"
            subtitle="Private Provider Owner Authorization & Indemnification."
            meta="FL Statute §553.791"
            sigStatus={ownerSig ? sigBadge(ownerSig.status) : null}
            onGenerate={() => setOwnerOpen(true)}
            onSend={() => setSigDialog({ documentName: "Owner Authorization" })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-obsidian/60">{docs.length} document{docs.length === 1 ? "" : "s"} on file</div>
        <Button variant="dark" size="sm" className="rounded-[3px]" onClick={() => setOpen(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Document
        </Button>
      </div>


      <div className="space-y-3">
        {DOC_TYPES.map((type) => {
          const items = byType[type] ?? [];
          return (
            <div key={type} className="border border-obsidian/10 bg-white">
              <div className="flex items-center justify-between border-b border-obsidian/10 bg-paper-warm px-4 py-2.5">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/70">{type}</div>
                <span className="font-mono text-[10px] text-obsidian/45">{items.length}</span>
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-5 text-center text-xs text-obsidian/45">
                  Pending — not yet uploaded.
                </div>
              ) : (
                <ul className="divide-y divide-obsidian/5">
                  {items.map((d) => {
                    const sig = getSignatureForDoc(d.id);
                    const notary = notaryForDoc(d.id);
                    return (
                      <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <FileText className="h-4 w-4 shrink-0 text-obsidian/50" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm text-obsidian truncate">{d.filename}</div>
                            {sig && (
                              <span
                                title={sig.signedBy ? `${sig.signedBy} · ${sig.signedAt?.slice(0, 10)}` : sig.recipientEmail}
                                className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${sigBadge(sig.status).className}`}
                              >
                                {sigBadge(sig.status).label}
                              </span>
                            )}
                            {notary && (
                              <span
                                className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] inline-flex items-center gap-1 ${notaryBadge(notary.status).className}`}
                              >
                                {notaryBadge(notary.status).iconSeal && <Stamp className="h-2.5 w-2.5" />}
                                {notaryBadge(notary.status).label}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                            {d.uploadedAt} · {d.uploadedBy}
                            {d.status === "pending" && <span className="ml-2 text-amber-700">· pending</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline" size="sm" className="h-7 rounded-[3px] text-[11px]"
                            onClick={() => setSigDialog({ documentName: d.filename, docId: d.id })}
                          >
                            <Send className="h-3 w-3 mr-1" /> Send for Signature
                          </Button>
                          {showNotary && (
                            <Button
                              variant="outline" size="sm" className="h-7 rounded-[3px] text-[11px]"
                              onClick={() => setNotaryDialog({ documentName: d.filename, docId: d.id })}
                            >
                              <Stamp className="h-3 w-3 mr-1" /> Request Notary
                            </Button>
                          )}
                          <button className="p-1 text-obsidian/45 hover:text-obsidian" aria-label="Download">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 text-obsidian/45 hover:text-oxblood"
                            aria-label="Delete"
                            onClick={() => { if (confirm("Remove this document?")) deleteDoc(d.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <UploadDocDialog open={open} onOpenChange={setOpen} projectId={project.id} />
      <PCNLookupDialog open={pcnOpen} onOpenChange={setPcnOpen} project={project} />
      <GenerateNTBODialog open={ntboOpen} onOpenChange={setNtboOpen} project={project} />
      <GenerateOwnerAuthDialog open={ownerOpen} onOpenChange={setOwnerOpen} project={project} />
      {sigDialog && (
        <SendForSignatureDialog
          open={!!sigDialog}
          onOpenChange={(v) => !v && setSigDialog(null)}
          project={project}
          documentName={sigDialog.documentName}
          docId={sigDialog.docId}
        />
      )}
      {notaryDialog && (
        <RequestNotaryDialog
          open={!!notaryDialog}
          onOpenChange={(v) => !v && setNotaryDialog(null)}
          project={project}
          documentName={notaryDialog.documentName}
          docId={notaryDialog.docId}
        />
      )}
    </div>
  );
}

function GenerateCard({
  icon, title, subtitle, meta, sigStatus, onGenerate, onSend,
}: {
  icon: React.ReactNode; title: string; subtitle: string; meta: string;
  sigStatus: { label: string; className: string } | null;
  onGenerate: () => void; onSend: () => void;
}) {
  return (
    <div className="border border-obsidian/12 rounded-[3px] p-4 bg-paper-warm/40">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm font-semibold text-obsidian">{title}</div>
        {sigStatus && (
          <span className={`ml-auto font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${sigStatus.className}`}>
            {sigStatus.label}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs text-obsidian/60">{subtitle}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">{meta}</div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="dark" className="rounded-[3px] h-7 text-[11px]" onClick={onGenerate}>
          <Download className="h-3 w-3 mr-1" /> Generate PDF
        </Button>
        <Button size="sm" variant="outline" className="rounded-[3px] h-7 text-[11px]" onClick={onSend}>
          <Send className="h-3 w-3 mr-1" /> Send for Signature
        </Button>
      </div>
    </div>
  );
}


function UploadDocDialog({
  open, onOpenChange, projectId,
}: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string }) {
  const [type, setType] = useState<DocType>(DOC_TYPES[0]);
  const [filename, setFilename] = useState("");

  function save() {
    if (!filename.trim()) return;
    addDoc({
      projectId,
      type,
      filename: filename.trim(),
      uploadedBy: localStorage.getItem("cleared_demo_user") || "Team",
    });
    setFilename("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Upload Document</DialogTitle>
        <div className="mt-4 space-y-3">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">Document type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocType)}
              className="mt-1.5 block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
            >
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">File</label>
            <input
              type="file"
              onChange={(e) => setFilename(e.target.files?.[0]?.name ?? "")}
              className="mt-1.5 block w-full text-sm"
            />
            {filename && <div className="mt-1 font-mono text-[11px] text-obsidian/60">{filename}</div>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[3px]">Cancel</Button>
          <Button variant="dark" onClick={save} className="rounded-[3px]" disabled={!filename.trim()}>Upload</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------ SUBCONTRACTORS ---------------------------- */

function SubsTab({ project }: { project: Project }) {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [waivers, setWaivers] = useState<LienWaiver[]>([]);
  const [waiverFor, setWaiverFor] = useState<SubRecord | null>(null);
  const propertyAddress = `${project.address}, ${project.city}, FL`;

  useEffect(() => { setSubs(loadSubLibrary()); }, []);
  useEffect(() => {
    const refresh = () => setWaivers(listWaivers(project.id));
    refresh();
    window.addEventListener(LIEN_WAIVER_EVT, refresh);
    return () => window.removeEventListener(LIEN_WAIVER_EVT, refresh);
  }, [project.id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="text-sm text-obsidian/60">
          {subs.length} subcontractor{subs.length === 1 ? "" : "s"} in your library
        </div>
        <Button asChild variant="dark" size="sm" className="rounded-[3px]">
          <Link to="/portal/subcontractors/new" search={{ projectId: project.id } as never}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Subcontractor
          </Link>
        </Button>
      </div>

      {subs.length === 0 ? (
        <div className="border border-dashed border-obsidian/20 bg-white p-10 text-center">
          <Users className="mx-auto h-6 w-6 text-obsidian/40" />
          <div className="mt-3 text-sm text-obsidian/60">No subcontractors linked yet.</div>
        </div>
      ) : (
        <div className="border border-obsidian/10 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-warm">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Trade</th>
                <th className="px-4 py-2.5">License</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">COI</th>
                <th className="px-4 py-2.5 text-right">Lien Waiver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian/5">
              {subs.map((s) => {
                const coi = coiStatus(s);
                const lifecycle = coiLifecycleStatus(s);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-obsidian">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{s.companyName}</span>
                        {lifecycle === "expired" && (
                          <span className="inline-flex items-center border border-red-600/40 bg-red-50 text-red-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] rounded-[3px]">
                            COI Expired
                          </span>
                        )}
                        {lifecycle === "expiring_soon" && (
                          <span className="inline-flex items-center border border-amber-600/40 bg-amber-50 text-amber-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] rounded-[3px]">
                            COI Expiring
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-obsidian/70">{s.trade || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-obsidian/70">{s.licenseNumber || "—"}</td>
                    <td className="px-4 py-3 text-obsidian/70">
                      {[s.contactFirstName, s.contactLastName].filter(Boolean).join(" ") || s.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-[3px] ${
                        coi === "on-file"
                          ? "border-emerald-600/40 bg-emerald-50 text-emerald-800"
                          : coi === "expired"
                          ? "border-red-600/40 bg-red-50 text-red-800"
                          : "border-amber-600/40 bg-amber-50 text-amber-800"
                      }`}>
                        {coi === "on-file" ? "On file" : coi === "expired" ? "Expired" : "Missing"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setWaiverFor(s)}
                        className="inline-flex items-center gap-1.5 border border-obsidian bg-obsidian px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white rounded-[3px] hover:bg-obsidian/90"
                      >
                        <FileSignature className="h-3 w-3" /> Generate Waiver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Lien Waivers section */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-obsidian/70">
            Lien Waivers
          </h3>
          <span className="font-mono text-[10px] text-obsidian/50">Florida Statute §713.20</span>
        </div>
        {waivers.length === 0 ? (
          <div className="border border-dashed border-obsidian/20 bg-white p-6 text-center text-sm text-obsidian/60">
            No lien waivers generated yet. Use "Generate Waiver" above to send one via Signwell.
          </div>
        ) : (
          <div className="border border-obsidian/10 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-warm">
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                  <th className="px-4 py-2.5">Subcontractor</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Payment Date</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian/5">
                {waivers.map((w) => {
                  const b = waiverBadge(w.status);
                  return (
                    <tr key={w.id}>
                      <td className="px-4 py-3 font-medium text-obsidian">{w.subCompany}</td>
                      <td className="px-4 py-3 text-obsidian/70">{WAIVER_TYPE_LABEL[w.waiverType]}</td>
                      <td className="px-4 py-3 font-mono text-obsidian/80">${w.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-obsidian/70">{w.paymentDate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] rounded-[3px] ${b.className}`}>
                          {b.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {waiverFor && (
        <GenerateLienWaiverDialog
          sub={waiverFor}
          projectId={project.id}
          propertyAddress={propertyAddress}
          onClose={() => setWaiverFor(null)}
        />
      )}
    </div>
  );
}


/* --------------------------------- FEES ----------------------------------- */

function FeesTab({ project, internal }: { project: Project; internal: boolean }) {
  const [openLog, setOpenLog] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="dark" size="sm" className="rounded-[3px]" onClick={() => setOpenLog(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Fee
        </Button>
        {internal && (
          <Button variant="outline" size="sm" className="rounded-[3px] border-oxblood/40 text-oxblood hover:bg-oxblood/5">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Contest Fee
          </Button>
        )}
      </div>
      <ProjectManualFees projectId={project.id} />
      <LogPermitFeeDialog open={openLog} onOpenChange={setOpenLog} defaultProjectId={project.id} lockProject />
    </div>
  );
}

/* --------------------------------- NOTES ---------------------------------- */

function NotesTab({ project }: { project: Project }) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    const refresh = () => setNotes(listNotes(project.id));
    refresh();
    window.addEventListener("project-notes:changed", refresh);
    return () => window.removeEventListener("project-notes:changed", refresh);
  }, [project.id]);

  function post() {
    if (!body.trim()) return;
    const author = localStorage.getItem("cleared_demo_user") || "Team";
    addNote(project.id, author, body);
    setBody("");
  }

  return (
    <div className="space-y-4">
      <div className="border border-obsidian/10 bg-white p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
          Internal note · Visible to Flōridian staff only
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Leave a note for the team about this project…"
          className="mt-2 block w-full resize-none border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none"
        />
        <div className="mt-3 flex justify-end">
          <Button variant="dark" size="sm" className="rounded-[3px]" disabled={!body.trim()} onClick={post}>
            Post note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="border border-dashed border-obsidian/20 bg-white p-10 text-center text-sm text-obsidian/50">
          No notes yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="border border-obsidian/10 bg-white p-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-medium text-obsidian">{n.author}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-obsidian/80">{n.body}</p>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => { if (confirm("Delete this note?")) deleteNote(n.id); }}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45 hover:text-oxblood"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------- PRIMITIVES ------------------------------ */

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-obsidian/10 bg-white">
      <div className="border-b border-obsidian/10 bg-paper-warm px-5 py-2.5">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">{title}</div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">{label}</div>
      <div className={`mt-1.5 text-sm text-obsidian ${mono ? "font-mono tabular-nums" : ""}`}>{value || "—"}</div>
    </div>
  );
}

function ClientNotificationsToggle({ projectId }: { projectId: string }) {
  const [on, setOn] = useState(() => notificationsEnabled(projectId));
  function toggle() {
    const next = !on;
    setNotificationsEnabled(projectId, next);
    setOn(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      title="Internal only — auto-emails to client on key milestones"
      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs rounded-[3px] font-mono uppercase tracking-[0.12em] ${
        on
          ? "border-emerald-600/40 bg-emerald-50 text-emerald-800"
          : "border-obsidian/15 bg-paper-warm text-obsidian/60"
      }`}
    >
      {on ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
      Client notifications: {on ? "ON" : "OFF"}
    </button>
  );
}

// Keeps a stable import so tree-shakers don't drop PROJECTS re-export uses.

export const _ALL_PROJECTS = PROJECTS;
