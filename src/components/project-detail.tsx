import { useEffect, useMemo, useState } from "react";
import { Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft, MapPin, Building2, Hash, ExternalLink, Download,
  Upload, FileText, Trash2, Plus, MessageSquare, Users, DollarSign,
  ClipboardCheck, LayoutGrid, Pencil, CheckCircle2, Circle, AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { RotateCcw, Info } from "lucide-react";
import { ProjectRevisionsTab } from "@/components/project-revisions-tab";
import { ProjectComplianceTab } from "@/components/project-compliance-tab";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MunicipalityContactsPanel } from "@/components/municipal-contacts";

import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PROJECTS, getProjectById, fullAddress, type Project } from "@/lib/projects-data";
import { VENDORS, getVendor, setVendor, type Vendor } from "@/lib/project-vendors";

function VendorManagedBanner({ project }: { project: Project }) {
  const [vendor, setVendorState] = useState<Vendor | null>(null);
  useEffect(() => {
    const sync = () => setVendorState(getVendor(project.name));
    sync();
    window.addEventListener("project-vendors:changed", sync);
    return () => window.removeEventListener("project-vendors:changed", sync);
  }, [project.name]);
  if (!vendor) return null;
  return (
    <div className="mt-4 flex items-start gap-3 rounded-[3px] border border-slate-300 bg-slate-100 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Vendor Managed · Record Copy</div>
        <p className="mt-1 text-sm text-slate-700">
          This permit is managed by {vendor}. Cleard maintains a record copy only.
        </p>
      </div>
    </div>
  );
}

function VendorSelect({ project }: { project: Project }) {
  const [vendor, setVendorState] = useState<Vendor | "">("");
  useEffect(() => {
    setVendorState(getVendor(project.name) ?? "");
  }, [project.name]);
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">Outsourced Vendor</div>
      <select
        value={vendor}
        onChange={(e) => {
          const next = (e.target.value || null) as Vendor | null;
          setVendorState(next ?? "");
          setVendor(project.name, next);
        }}
        className="mt-1.5 w-full max-w-xs border border-obsidian/20 bg-white px-2 py-1.5 text-sm text-obsidian rounded-[3px] focus:outline-none focus:border-obsidian/50"
      >
        <option value="">— No vendor assigned</option>
        {VENDORS.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}

import { projectStatusMeta, toneClass } from "@/lib/status-badges";
import { findPortalForAddress } from "@/lib/municipalities";
import { InspectionsSection } from "@/components/inspections-section";
import { ProjectManualFees } from "@/components/project-manual-fees";
import { LogPermitFeeDialog } from "@/components/log-permit-fee-dialog";
import { loadSubLibrary, coiStatus, coiLifecycleStatus, type SubRecord } from "@/lib/subcontractor-library";
import { addNote, deleteNote, listNotes, type ProjectNote } from "@/lib/project-notes";
import { DOC_TYPES, addDocFile, addDocPlaceholder, deleteDoc, listDocs, getDocViewUrl, getDocDownloadUrl, type DocType, type ProjectDoc } from "@/lib/project-documents";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { revealOwnPortalLogin, savePortalLogin } from "@/lib/portal-logins.functions";
import { toast } from "sonner";
import { isInternalUser } from "@/lib/is-internal-user";
import { notificationsEnabled, setNotificationsEnabled } from "@/lib/client-notifications";
import { Bell, BellOff } from "lucide-react";

import { isPermitTypeComplete } from "@/lib/permit-type-status";
import { PCNLookupDialog } from "@/components/pcn-lookup-dialog";
import { PropertyAppraiserDialog } from "@/components/property-appraiser-dialog";
import { QrCode, Wand2 } from "lucide-react";
import { GenerateNTBODialog, GenerateOwnerAuthDialog } from "@/components/generate-form-dialogs";
import { SendForSignatureDialog } from "@/components/send-for-signature-dialog";
import { RequestNotaryDialog } from "@/components/request-notary-dialog";
import { GenerateLienWaiverDialog } from "@/components/generate-lien-waiver-dialog";
import { LIEN_WAIVER_EVT, WAIVER_TYPE_LABEL, listWaivers, waiverBadge, type LienWaiver } from "@/lib/lien-waivers";


import { getPCN } from "@/lib/project-pcn";
import { FileSignature, FileCheck2, MapPinned, Send, Stamp } from "lucide-react";
import {
  getSignatureForDoc,
  sigBadge,
  sigSourceBadge,
  sigStatusForDocument,
  SIG_EVT,
  type SignatureRequest,
} from "@/lib/signature-requests";
import { notaryForDoc, notaryBadge, NOTARY_EVT } from "@/lib/notary-requests";
import { getPortalRole, canRequestNotary } from "@/lib/portal-role";
import { ProjectInternalOps } from "@/components/project-internal-ops";
import { logAudit } from "@/lib/audit-log";
import { ShieldAlert, History } from "lucide-react";
import { slugifyCity } from "@/lib/municipality-slug";

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

        <VendorManagedBanner project={project} />



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
                className="inline-flex items-center gap-1 border border-[#9a7b2e]/40 bg-[#9a7b2e]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8c3b3b] rounded-[3px]"
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
                 className="inline-flex items-center gap-1.5 border border-[#000000] bg-[#000000] px-3 py-1.5 text-xs font-medium text-white rounded-[3px] hover:opacity-90">
                <ExternalLink className="h-3.5 w-3.5" /> Open {portal.name} Portal
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 border border-obsidian/15 bg-paper-warm px-3 py-1.5 text-xs text-obsidian/50 rounded-[3px]">
                City portal link unavailable
              </span>
            )}
            <PortalLoginPopover project={project} />

            {internal && <ClientNotificationsToggle projectId={project.id} />}
            <HeaderExtras project={project} />
          </div>

        </header>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-[3px] bg-paper-warm p-1">
            <TabTrigger value="overview" icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Overview" />
            <TabTrigger value="revisions" icon={<RotateCcw className="h-3.5 w-3.5" />} label="Revisions" />
            <TabTrigger value="inspections" icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Inspections" />
            <TabTrigger value="documents" icon={<FileText className="h-3.5 w-3.5" />} label="Documents" />
            <TabTrigger value="hoa" icon={<FileSignature className="h-3.5 w-3.5" />} label="HOA Submittal" />
            <TabTrigger value="subs" icon={<Users className="h-3.5 w-3.5" />} label="Subcontractors" />
            <TabTrigger value="compliance" icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Compliance" />
            <TabTrigger value="fees" icon={<DollarSign className="h-3.5 w-3.5" />} label="Permit Fees" />
            <TabTrigger value="notes" icon={<MessageSquare className="h-3.5 w-3.5" />} label="Notes" />
            <TabTrigger value="activity" icon={<History className="h-3.5 w-3.5" />} label="Activity" />
            {internal && <TabTrigger value="internal" icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Internal" />}
          </TabsList>

          <TabsContent value="overview" className="mt-6"><OverviewTab project={project} /></TabsContent>
          <TabsContent value="revisions" className="mt-6"><ProjectRevisionsTab project={project} internal={internal} /></TabsContent>
          <TabsContent value="inspections" className="mt-6">
            <InspectionsSection
              projectId={project.id}
              allPassedSeed={false}
              projectAddress={`${project.address}, ${project.city}`}
              municipality={portal}
            />

          </TabsContent>
          <TabsContent value="documents" className="mt-6"><DocumentsTab project={project} internal={internal} /></TabsContent>
          <TabsContent value="hoa" className="mt-6"><HoaSubmittalTab project={project} /></TabsContent>
          <TabsContent value="subs" className="mt-6"><SubsTab project={project} /></TabsContent>
          <TabsContent value="compliance" className="mt-6"><ProjectComplianceTab /></TabsContent>
          <TabsContent value="fees" className="mt-6"><FeesTab project={project} internal={internal} /></TabsContent>
          <TabsContent value="notes" className="mt-6"><NotesTab project={project} /></TabsContent>
          <TabsContent value="activity" className="mt-6">
            <p className="text-sm text-obsidian/50">Activity for live permits is on the permit detail page.</p>
          </TabsContent>
          {internal && <TabsContent value="internal" className="mt-6"><ProjectInternalOps permitId={project.id} label={project.name} /></TabsContent>}
        </Tabs>
      </div>
    </PortalShell>
  );
}

function HeaderExtras({ project }: { project: Project }) {
  const [apprOpen, setApprOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="rounded-[3px]" onClick={() => setApprOpen(true)}>
        <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Auto-Fill from Appraiser
      </Button>
      {project.permit_no && (
        <Link
          to="/permit-card/$id"
          params={{ id: project.id }}
          target="_blank"
          className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-3 py-1.5 text-xs font-medium text-obsidian rounded-[3px] hover:bg-paper-warm"
        >
          <QrCode className="h-3.5 w-3.5" /> Generate Permit Card
        </Link>
      )}
      <PropertyAppraiserDialog open={apprOpen} onOpenChange={setApprOpen} project={project} />
    </>
  );
}

function TabTrigger({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="gap-1.5 rounded-[3px] px-3 py-2 text-xs font-medium data-[state=active]:bg-[#000000] data-[state=active]:text-white data-[state=active]:shadow-sm"
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
            <div className="sm:col-span-2">
              <VendorSelect project={project} />
            </div>
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
                      done || current ? "border-[#000000] bg-[#000000]" : "border-obsidian/25 bg-white"
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

        <div className="mt-6">
          <MunicipalityContactsPanel city={project.city} county={project.county} />
        </div>
      </aside>

    </div>
  );
}

/* -------------------------------- DOCUMENTS ------------------------------- */

function DocumentsTab({ project, internal }: { project: Project; internal: boolean }) {
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [open, setOpen] = useState(false);
  const [ntboOpen, setNtboOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [pcnOpen, setPcnOpen] = useState(false);
  const [pcn, setPcnLocal] = useState("");
  const [tick, setTick] = useState(0);
  // docPath is a storage path for an uploaded file; docKey is a logical permit document key.
  const [sigDialog, setSigDialog] = useState<{
    documentName: string;
    docPath?: string;
    docKey?: string;
  } | null>(null);
  const [notaryDialog, setNotaryDialog] = useState<{ documentName: string; docId?: string } | null>(null);
  const [notaryByDoc, setNotaryByDoc] = useState<Record<string, Awaited<ReturnType<typeof notaryForDoc>>>>({});
  const [sigByDoc, setSigByDoc] = useState<Record<string, SignatureRequest | undefined>>({});
  const role = typeof window !== "undefined" ? getPortalRole() : "gc";
  const showNotary = canRequestNotary(role);
  const isLivePermit = /^[a-f0-9-]{36}$/i.test(project.id);

  useEffect(() => {
    const refresh = () => {
      void listDocs(project.id).then(async (list) => {
        setDocs(list);
        if (isLivePermit) {
          const entries = await Promise.all(
            list.map(async (d) => [d.id, await notaryForDoc(d.id).catch(() => undefined)] as const),
          );
          const map: Record<string, Awaited<ReturnType<typeof notaryForDoc>>> = {};
          for (const [id, n] of entries) if (n) map[id] = n;
          setNotaryByDoc(map);

          const sigEntries = await Promise.all(
            list.map(
              async (d) => [d.id, await getSignatureForDoc(d.id).catch(() => undefined)] as const,
            ),
          );
          const sigMap: Record<string, SignatureRequest | undefined> = {};
          for (const [id, s] of sigEntries) if (s) sigMap[id] = s;
          setSigByDoc(sigMap);
        } else {
          setNotaryByDoc({});
          setSigByDoc({});
        }
      });
      void getPCN({ projectId: project.id }).then((v) => setPcnLocal(v));
      setTick((t) => t + 1);
    };
    refresh();
    const evts = ["project-docs:changed", "project-pcn:changed", SIG_EVT, NOTARY_EVT];
    evts.forEach((e) => window.addEventListener(e, refresh));
    return () => evts.forEach((e) => window.removeEventListener(e, refresh));
  }, [project.id, isLivePermit]);

  const byType = useMemo(() => {
    const map: Record<string, ProjectDoc[]> = {};
    for (const t of DOC_TYPES) map[t] = [];
    for (const d of docs) (map[d.type] ??= []).push(d);
    return map;
  }, [docs]);

  // Signature state is provider truth from the ledger, so it is fetched, not derived.
  const [ntboSig, setNtboSig] = useState<SignatureRequest | undefined>();
  const [ownerSig, setOwnerSig] = useState<SignatureRequest | undefined>();
  useEffect(() => {
    if (!isLivePermit) {
      setNtboSig(undefined);
      setOwnerSig(undefined);
      return;
    }
    void sigStatusForDocument(project.id, "NTBO").catch(() => undefined).then(setNtboSig);
    void sigStatusForDocument(project.id, "Owner Authorization")
      .catch(() => undefined)
      .then(setOwnerSig);
  }, [project.id, isLivePermit, tick]);

  // SignWell needs a permit record to attach the document and ledger row to.
  function requestSignature(target: { documentName: string; docPath?: string; docKey?: string }) {
    if (!isLivePermit) {
      toast.error("Signature routing requires a live permit record.");
      return;
    }
    setSigDialog(target);
  }

  return (
    <div className="space-y-6">
      {/* Generate Forms — pre-filled private provider PDFs (internal only) */}
      {internal && (
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
            onSend={() => requestSignature({ documentName: "NTBO" })}
          />
          <GenerateCard
            icon={<FileCheck2 className="h-4 w-4 text-obsidian/60" />}
            title="Generate Owner Auth"
            subtitle="Private Provider Owner Authorization & Indemnification."
            meta="FL Statute §553.791"
            sigStatus={ownerSig ? sigBadge(ownerSig.status) : null}
            onGenerate={() => setOwnerOpen(true)}
            onSend={() => requestSignature({ documentName: "Owner Authorization" })}
          />
        </div>
      </div>
      )}

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
                    const sig = sigByDoc[d.id];
                    const notary = notaryByDoc[d.id];
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
                            {sig && sigSourceBadge(sig) && (
                              <span
                                className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-[3px] ${sigSourceBadge(sig)!.className}`}
                              >
                                {sigSourceBadge(sig)!.label}
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
                            onClick={() => requestSignature({ documentName: d.filename, docPath: d.id })}
                          >
                            <Send className="h-3 w-3 mr-1" /> Send for Signature
                          </Button>
                          {showNotary && (
                            <Button
                              variant="outline" size="sm" className="h-7 rounded-[3px] text-[11px]"
                              onClick={() => {
                                if (!isLivePermit) {
                                  toast.error("Notary requests require a live permit record.");
                                  return;
                                }
                                setNotaryDialog({ documentName: d.filename, docId: d.id });
                              }}
                            >
                              <Stamp className="h-3 w-3 mr-1" /> Request Notary
                            </Button>
                          )}
                          {d.status === "uploaded" && (d.size ?? 0) > 0 && (
                            <button
                              className="p-1 text-obsidian/60 hover:text-obsidian"
                              aria-label="View"
                              title="View"
                              onClick={async () => {
                                try {
                                  const url = await getDocViewUrl(d.path);
                                  window.open(url, "_blank", "noopener,noreferrer");
                                } catch (e) {
                                  toast.error("Could not open: " + (e instanceof Error ? e.message : String(e)));
                                }
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {d.status === "uploaded" && (d.size ?? 0) > 0 && (
                            <button
                              className="p-1 text-obsidian/45 hover:text-obsidian"
                              aria-label="Download"
                              title="Download"
                              onClick={async () => {
                                try {
                                  const url = await getDocDownloadUrl(d.path, d.filename);
                                  const a = document.createElement("a");
                                  a.href = url; a.download = d.filename;
                                  document.body.appendChild(a); a.click(); a.remove();
                                } catch (e) {
                                  toast.error("Download failed: " + (e instanceof Error ? e.message : String(e)));
                                }
                              }}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            className="p-1 text-obsidian/45 hover:text-oxblood"
                            aria-label="Delete"
                            onClick={async () => {
                              if (!confirm("Remove this document?")) return;
                              try { await deleteDoc(d.id); } catch (e) {
                                toast.error("Delete failed: " + (e instanceof Error ? e.message : String(e)));
                              }
                            }}
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
      {sigDialog && isLivePermit && (
        <SendForSignatureDialog
          open={!!sigDialog}
          onOpenChange={(v) => !v && setSigDialog(null)}
          project={project}
          documentName={sigDialog.documentName}
          documentKey={sigDialog.docKey}
          documentPath={sigDialog.docPath}
        />
      )}
      {notaryDialog && isLivePermit && (
        <RequestNotaryDialog
          open={!!notaryDialog}
          onOpenChange={(v) => !v && setNotaryDialog(null)}
          permitId={project.id}
          projectName={project.name}
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
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50 MB)");
      return;
    }
    setBusy(true);
    try {
      await addDocFile({
        projectId,
        type,
        file,
        uploadedBy: localStorage.getItem("cleared_demo_user") || "Team",
      });
      toast.success(`Uploaded ${file.name}`);
      void logAudit(localStorage.getItem("cleared_demo_user") || "Team", "document.uploaded", { projectId, record: file.name, details: `${type} uploaded` });
      setFile(null);
      onOpenChange(false);
    } catch (e) {
      toast.error("Upload failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function saveDeferred() {
    if (!file) return;
    setBusy(true);
    try {
      await addDocPlaceholder({
        projectId,
        type,
        filename: file.name,
        uploadedBy: localStorage.getItem("cleared_demo_user") || "Team",
      });
      toast.success("Marked as pending — upload later");
      setFile(null);
      onOpenChange(false);
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
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
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1.5 block w-full text-sm"
            />
            {file && (
              <div className="mt-1 font-mono text-[11px] text-obsidian/60">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[3px]" disabled={busy}>Cancel</Button>
          <Button variant="outline" onClick={saveDeferred} className="rounded-[3px]" disabled={!file || busy}>
            Defer — upload later
          </Button>
          <Button variant="dark" onClick={save} className="rounded-[3px]" disabled={!file || busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
            Upload
          </Button>
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
    const refresh = () => { void listNotes(project.id).then(setNotes); };
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
          Internal note · Visible to Cleard staff only
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

function HoaSubmittalTab({ project }: { project: Project }) {
  const [rows, setRows] = useState<import("@/lib/hoa-submittals").HoaSubmittalRow[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/hoa-submittals").then(async (m) => {
      const all = await m.listHoaSubmittals();
      const address = `${project.address}, ${project.city}`.toLowerCase();
      const scoped = all.filter((r) => (r.property_address ?? "").toLowerCase().includes(project.address.toLowerCase())
        || (r.property_address ?? "").toLowerCase().includes(address));
      if (!cancelled) setRows(scoped);
    }).catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, [project.address, project.city]);

  return (
    <section className="border border-obsidian/10 rounded-[3px] bg-white p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-obsidian">HOA / ARC Submittal</h2>
          <p className="text-sm text-muted-foreground">
            Manage HOA approval alongside the building permit. Cleard pre-fills applicant, address, and scope from this project.
          </p>
        </div>
        <Button asChild variant="dark" className="rounded-[3px] gap-2">
          <Link to="/portal/hoa-submittals/new"><Plus className="h-4 w-4" /> New HOA Submittal</Link>
        </Button>
      </div>
      {rows === null ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No HOA submittals for this project yet.
        </div>
      ) : (
        <ul className="divide-y divide-obsidian/10 border border-obsidian/10 rounded-[3px]">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <Link to="/portal/hoa-submittals/$id" params={{ id: r.id }} className="font-medium text-obsidian hover:underline">
                  {r.hoa_name || r.community_name || r.property_address || "HOA Submittal"}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {[r.project_type, r.village_name].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span className="text-xs uppercase tracking-wide text-obsidian/70">{r.status.replace(/_/g, " ")}</span>
              <Link to="/portal/hoa-submittals/$id" params={{ id: r.id }} className="text-sm text-obsidian underline underline-offset-4">
                Open →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Portal login popover — zero-scroll access to building-dept creds.  */
/* Credentials live in the encrypted vault (gc_portal_logins), never  */
/* in localStorage: plaintext passwords in browser storage are        */
/* readable by any script on the page.                                */
/* ------------------------------------------------------------------ */
function PortalLoginPopover({ project }: { project: Project }) {
  // Must match the vault's canonical slug ("Port St. Lucie" -> "port-st-lucie"),
  // otherwise the reveal misses and a save writes an orphan row.
  const slug = slugifyCity(project.city);
  const reveal = useServerFn(revealOwnPortalLogin);
  const save = useServerFn(savePortalLogin);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{ username: string; password: string } | null>(null);
  const [show, setShow] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setShow(false);
    reveal({ data: { municipality_slug: slug } })
      .then((row) => {
        if (!alive) return;
        setCreds(row ? { username: row.username, password: row.password } : null);
      })
      .catch(() => alive && setCreds(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, slug, reveal]);

  async function onSave() {
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Username and password are both required");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          municipality_slug: slug,
          city_name: project.city,
          username: form.username.trim(),
          password: form.password,
        },
      });
      setCreds({ username: form.username.trim(), password: form.password });
      setForm({ username: "", password: "" });
      setAdding(false);
      toast.success("Portal login saved");
    } catch {
      toast.error("Could not save those credentials");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "border border-obsidian/15 bg-paper-warm px-2.5 py-1.5 text-sm font-mono rounded-[3px] w-full";
  const labelCls = "font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-[#000000] bg-[#000000] px-3 py-1.5 text-xs font-medium text-white rounded-[3px] hover:opacity-90"
        >
          <KeyRound className="h-3.5 w-3.5" /> Portal Login
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 rounded-[3px] border border-obsidian/15 bg-white p-4 shadow-md"
      >
        <div className={labelCls}>{project.city}</div>

        {loading ? (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-obsidian/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading credentials…
          </div>
        ) : creds ? (
          <div className="mt-3 space-y-3">
            <div>
              <div className={labelCls}>Username</div>
              <input readOnly value={creds.username} className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <div className={labelCls}>Password</div>
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  readOnly
                  type={show ? "text" : "password"}
                  value={creds.password}
                  className={inputCls}
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((v) => !v)}
                  className="shrink-0 border border-obsidian/15 bg-paper-warm p-1.5 rounded-[3px] text-obsidian/70 hover:text-obsidian"
                >
                  {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ) : adding ? (
          <div className="mt-3 space-y-2">
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className={inputCls}
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputCls}
            />
            <Button variant="dark" size="sm" className="rounded-[3px]" disabled={saving} onClick={onSave}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null} Save
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-obsidian/60">No portal login saved yet.</p>
            <Button variant="dark" size="sm" className="rounded-[3px]" onClick={() => setAdding(true)}>
              Add credentials
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
