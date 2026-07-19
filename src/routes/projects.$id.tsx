import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Building2,
  Hash,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Project ${params.id} — Cleared by Flōridian` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    const project = PROJECTS[params.id];
    if (!project) throw notFound();
    return { project };
  },
  notFoundComponent: () => (
    <PortalShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
        <div className="eyebrow text-obsidian/50">404</div>
        <h1 className="display-serif mt-3 text-4xl text-obsidian">Project not found</h1>
        <p className="mt-3 text-sm text-obsidian/60">
          This permit number isn't on file with Cleared.
        </p>
        <Button asChild variant="dark" className="mt-8">
          <Link to="/projects">Back to projects</Link>
        </Button>
      </div>
    </PortalShell>
  ),
  errorComponent: ({ error }) => (
    <PortalShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
        <h1 className="display-serif text-3xl text-obsidian">Something went wrong</h1>
        <p className="mt-3 text-sm text-obsidian/60">{error.message}</p>
      </div>
    </PortalShell>
  ),
  component: ProjectDetailPage,
});

import { toneClass, projectStatusMeta, type BadgeTone } from "@/lib/status-badges";
import { PROJECTS as SEED_PROJECTS, fullAddress } from "@/lib/projects-data";
import { InspectionsSection } from "@/components/inspections-section";
import { ProjectManualFees } from "@/components/project-manual-fees";
type Tone = BadgeTone;


type Project = {
  id: string;
  permit_no: string;
  name: string;
  address: string;
  city: string;
  county: string;
  parcel: string;
  license_type: string;
  gc: string;
  value_cents: number;
  permit_types: string[];
  status: { label: string; tone: Tone };
  submitted_at: string;
  documents: Array<{ id: string; label: string; filename: string; size_kb: number; uploaded_at: string }>;
  messages: Array<{ id: string; author: string; role: string; at: string; body: string; from_cleared?: boolean }>;
  history: Array<{ id: string; label: string; at: string; note?: string; done: boolean }>;
  corrections: Array<{ id: string; round: number; opened_at: string; closed_at?: string; items: string[]; status: { label: string; tone: Tone } }>;
  fees: Array<{ id: string; label: string; sublabel: string; amount_cents: number; status: { label: string; tone: Tone }; invoice_date: string }>;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const PROJECTS: Record<string, Project> = Object.fromEntries(
  SEED_PROJECTS.map((p) => {
    const meta = projectStatusMeta[p.status];
    const slug = slugify(p.name);
    const feePermit = Math.round(p.value_cents * 0.015);
    const proj: Project = {
      id: p.id,
      permit_no: p.permit_no,
      name: p.name,
      address: p.address,
      city: p.city,
      county: p.county,
      parcel: `${p.county.slice(0, 2).toUpperCase()}-2026-${String(4400 + Number(p.id)).slice(-4)}`,
      license_type: "CGC — Certified General Contractor",
      gc: p.client,
      value_cents: p.value_cents,
      permit_types: p.permit_types,
      status: { label: meta.label, tone: meta.tone },
      submitted_at: p.submitted_at,
      documents: [
        { id: "d1", label: "Construction Plans", filename: `${slug}-plans.pdf`, size_kb: 12400, uploaded_at: p.submitted_at },
        { id: "d2", label: "Boundary Survey", filename: `${slug}-survey.pdf`, size_kb: 1180, uploaded_at: p.submitted_at },
        { id: "d3", label: "Notice of Commencement", filename: `noc-${slug}.pdf`, size_kb: 340, uploaded_at: p.submitted_at },
      ],
      messages: [
        { id: "m1", author: p.client, role: `Client · ${p.client}`, at: `${p.submitted_at} · 9:14 AM`, body: `Intake submitted for ${p.name}${p.scope ? ` — ${p.scope}` : ""}.` },
        { id: "m2", author: "Cleared", role: "Private Provider", from_cleared: true, at: `${p.submitted_at} · 11:02 AM`, body: `Affidavit filed with ${p.county} County. Statutory 10-business-day clock started.` },
      ],
      history: [
        { id: "h1", label: "Project created", at: p.submitted_at, done: true },
        { id: "h2", label: "LPOA executed", at: p.submitted_at, done: true },
        { id: "h3", label: "Affidavit filed with AHJ", at: p.submitted_at, note: `${p.county} County — 10 business day clock started`, done: true },
        { id: "h4", label: "Fees invoiced", at: p.submitted_at, done: true },
        { id: "h5", label: "Plan review", at: p.status === "in_review" ? "In progress" : "Complete", done: p.status !== "in_review" },
        { id: "h6", label: "Permit issued", at: p.status === "permit_issued" ? p.submitted_at : "Pending", done: p.status === "permit_issued" },
      ],
      corrections: [],
      fees: [
        { id: "f1", label: "Permitting Fee", sublabel: "Construction value × 1.5%", amount_cents: feePermit, status: { label: "Invoiced", tone: "sky" }, invoice_date: p.submitted_at },
        { id: "f2", label: "Private Provider & Admin Fee", sublabel: "Flat statutory administration", amount_cents: 885_600, status: { label: "Invoiced", tone: "sky" }, invoice_date: p.submitted_at },
      ],
    };
    return [p.id, proj];
  }),
);


const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMoneyWhole = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function ProjectDetailPage() {
  const { project } = Route.useLoaderData() as { project: Project };

  const [reply, setReply] = useState("");

  const totalFees = project.fees.reduce((s, f) => s + f.amount_cents, 0);

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-8 py-12">
        {/* Back */}
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55 transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="h-3 w-3" />
          All Projects
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-6 border-b border-obsidian/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-obsidian/50">
                {project.permit_no}
              </span>
              <span className={`inline-flex items-center border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${toneClass[project.status.tone]}`}>
                {project.status.label}
              </span>
            </div>
            <h1 className="display-serif mt-3 text-5xl text-obsidian">{project.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-obsidian/65">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-obsidian/45" />
                {project.address}, {project.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-obsidian/45" />
                {project.county} County
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-obsidian/45" />
                Filed {project.submitted_at}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" className="rounded-[3px]">
              <Download className="mr-2 h-4 w-4" />
              Permit packet
            </Button>
            <Button variant="dark">
              <Send className="mr-2 h-4 w-4" />
              Message Cleared
            </Button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN */}
          <div className="space-y-12 min-w-0">
            {/* Project Info */}
            <DetailSection step="01" title="Project Information">
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 border border-obsidian/10 bg-white p-6 sm:grid-cols-2">
                <InfoRow label="General Contractor" value={project.gc} />
                <InfoRow label="License Class" value={project.license_type} />
                <InfoRow label="Parcel Control" value={project.parcel} mono />
                <InfoRow label="Construction Value" value={fmtMoneyWhole(project.value_cents)} mono />
                <InfoRow
                  label="Permit Types"
                  value={
                    <div className="flex flex-wrap gap-1">
                      {project.permit_types.map((t) => (
                        <span key={t} className="border border-obsidian/15 bg-paper-warm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-obsidian/70">
                          {t}
                        </span>
                      ))}
                    </div>
                  }
                />
                <InfoRow label="Job Site Address" value={`${project.address}, ${project.city}, FL`} />
              </div>
            </DetailSection>

            {/* Documents */}
            <DetailSection step="02" title="Documents" description={`${project.documents.length} files on file`}>
              <div className="divide-y divide-obsidian/5 border border-obsidian/10 bg-white">
                {project.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-obsidian/15 bg-paper-warm">
                      <FileText className="h-4 w-4 text-obsidian/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-obsidian">{d.label}</div>
                      <div className="mt-0.5 font-mono text-xs text-obsidian/55">
                        {d.filename} · {(d.size_kb / 1024).toFixed(1)} MB · uploaded {d.uploaded_at}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-[3px]">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </DetailSection>

            {/* Messages */}
            <DetailSection step="03" title="Messages" description="Thread with Cleared plan review">
              <div className="border border-obsidian/10 bg-white">
                <div className="divide-y divide-obsidian/5">
                  {project.messages.map((m) => (
                    <div key={m.id} className="px-6 py-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-obsidian">{m.author}</span>
                          {m.from_cleared && (
                            <span className="border border-sky/30 bg-sky/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-sky">
                              Cleared
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                          {m.at}
                        </span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                        {m.role}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-obsidian/80">{m.body}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-obsidian/10 bg-paper-warm px-6 py-4">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to Cleared…"
                    rows={3}
                    className="block w-full resize-none border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                      Encrypted in transit
                    </span>
                    <Button type="button" variant="dark" size="sm" disabled={reply.trim().length === 0}>
                      <Send className="mr-2 h-3.5 w-3.5" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* Inspections */}
            <DetailSection step="04" title="Inspections" description="Pool inspection sequence · 601–610">
              <InspectionsSection projectId={project.id} allPassedSeed={false} />
            </DetailSection>

            {/* Correction Rounds */}
            <DetailSection
              step="05"
              title="Correction Rounds"
              description="48-hour response window per round"
            >
              <div className="space-y-4">
                {project.corrections.length === 0 ? (
                  <div className="border border-dashed border-obsidian/20 bg-white px-6 py-10 text-center">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                    <div className="mt-3 text-sm text-obsidian/65">No correction rounds opened.</div>
                  </div>
                ) : (
                  project.corrections.map((c) => (
                    <div key={c.id} className="border border-obsidian/10 bg-white">
                      <div className="flex items-center justify-between gap-4 border-b border-obsidian/10 bg-paper-warm px-6 py-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-oxblood" />
                          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-obsidian/70">
                            Round {String(c.round).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                            Opened {c.opened_at}
                          </span>
                        </div>
                        <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] ${toneClass[c.status.tone]}`}>
                          {c.status.label}
                        </span>
                      </div>
                      <ol className="divide-y divide-obsidian/5">
                        {c.items.map((item, i) => (
                          <li key={i} className="flex gap-4 px-6 py-4">
                            <span className="font-mono text-xs tabular-nums text-obsidian/40">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm text-obsidian/80">{item}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="border-t border-obsidian/10 px-6 py-4">
                        <Button variant="dark" size="sm">
                          Upload response
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DetailSection>

            {/* Manual Permit Fees */}
            <DetailSection step="06" title="Permit Fees" description="Manually logged county fees">
              <ProjectManualFees projectId={project.id} />
            </DetailSection>
          </div>

          {/* RIGHT COLUMN — sticky */}
          <aside className="space-y-10">
            {/* Status History */}
            <DetailSection step="A" title="Status History">
              <ol className="relative space-y-5 border-l border-obsidian/15 pl-6">
                {project.history.map((h) => (
                  <li key={h.id} className="relative">
                    <span
                      className={`absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        h.done ? "border-obsidian bg-obsidian" : "border-obsidian/25 bg-white"
                      }`}
                    >
                      {h.done ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      ) : (
                        <Circle className="h-1.5 w-1.5 text-obsidian/30" />
                      )}
                    </span>
                    <div className={`text-sm font-medium ${h.done ? "text-obsidian" : "text-obsidian/50"}`}>
                      {h.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                      {h.at}
                    </div>
                    {h.note && (
                      <div className="mt-1 text-xs text-obsidian/60">{h.note}</div>
                    )}
                  </li>
                ))}
              </ol>
            </DetailSection>

            {/* Fee Summary */}
            <DetailSection step="B" title="Fee Summary">
              <div className="border border-obsidian/15 bg-paper-warm">
                <div className="border-b border-obsidian/10 px-5 py-3">
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
                    Itemized · Auto-Invoiced
                  </div>
                </div>
                <div className="divide-y divide-obsidian/5 px-5">
                  {project.fees.map((f) => (
                    <div key={f.id} className="py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm text-obsidian">{f.label}</div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                            {f.sublabel}
                          </div>
                        </div>
                        <div className="shrink-0 font-mono text-sm tabular-nums text-obsidian">
                          {fmtMoney(f.amount_cents)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] ${toneClass[f.status.tone]}`}>
                          {f.status.label}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                          {f.invoice_date}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-baseline justify-between py-4">
                    <div>
                      <div className="font-medium text-obsidian">Total</div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                        {project.fees.length} line items
                      </div>
                    </div>
                    <div className="display-serif text-2xl text-obsidian tabular-nums">
                      {fmtMoneyWhole(totalFees)}
                    </div>
                  </div>
                </div>
              </div>

              {/* LPOA badge */}
              <div className="mt-4 flex items-start gap-3 border border-obsidian/10 bg-white px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-obsidian">LPOA on file</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                    FL Statute 553.791 · Affidavit executed
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 border border-obsidian/10 bg-white px-4 py-3">
                <Hash className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/40" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-obsidian">{project.permit_no}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                    Cleared file number
                  </div>
                </div>
              </div>
            </DetailSection>
          </aside>
        </div>
      </div>
    </PortalShell>
  );
}

function DetailSection({
  step, title, description, children,
}: { step: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-sky">
          {step}
        </span>
        <h2 className="display-serif text-2xl text-obsidian">{title}</h2>
        {description && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
            · {description}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function InfoRow({
  label, value, mono,
}: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/50">
        {label}
      </div>
      <div className={`mt-1.5 text-sm text-obsidian ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </div>
    </div>
  );
}
