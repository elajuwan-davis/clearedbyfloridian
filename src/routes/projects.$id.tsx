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
      <div className="mx-auto max-w-3xl px-8 py-24 text-center">
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
      <div className="mx-auto max-w-3xl px-8 py-24 text-center">
        <h1 className="display-serif text-3xl text-obsidian">Something went wrong</h1>
        <p className="mt-3 text-sm text-obsidian/60">{error.message}</p>
      </div>
    </PortalShell>
  ),
  component: ProjectDetailPage,
});

type Tone = "neutral" | "sky" | "warn" | "ok";
const toneClass: Record<Tone, string> = {
  neutral: "bg-paper-warm text-obsidian/70 border-obsidian/15",
  sky: "bg-sky/10 text-sky border-sky/30",
  warn: "bg-oxblood/10 text-oxblood border-oxblood/30",
  ok: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
};

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

const PROJECTS: Record<string, Project> = {
  "1": {
    id: "1",
    permit_no: "CLR-2026-0142",
    name: "Ocean Ridge Estate",
    address: "1247 Banyan Trail",
    city: "Ocean Ridge",
    county: "Palm Beach",
    parcel: "12-43-46-04-01-000-0140",
    license_type: "CGC — Certified General Contractor",
    gc: "Coastline Builders Group",
    value_cents: 412_500_000,
    permit_types: ["Building", "Electrical", "Plumbing"],
    status: { label: "In review", tone: "sky" },
    submitted_at: "May 28, 2026",
    documents: [
      { id: "d1", label: "Construction Plans", filename: "ocean-ridge-plans-r3.pdf", size_kb: 18420, uploaded_at: "May 28, 2026" },
      { id: "d2", label: "Boundary Survey", filename: "survey-1247-banyan.pdf", size_kb: 1240, uploaded_at: "May 28, 2026" },
      { id: "d3", label: "Notice of Commencement", filename: "noc-recorded-PB-2026-04421.pdf", size_kb: 380, uploaded_at: "May 29, 2026" },
      { id: "d4", label: "Energy Calculations", filename: "energy-calcs-FBC.pdf", size_kb: 920, uploaded_at: "May 30, 2026" },
    ],
    messages: [
      { id: "m1", author: "Marcus Hale", role: "GC · Coastline Builders Group", at: "May 28, 2026 · 9:14 AM", body: "Filing submitted. Plans are R3, signed and sealed by Atelier Vance." },
      { id: "m2", author: "Cleared", role: "Private Provider", from_cleared: true, at: "May 28, 2026 · 11:02 AM", body: "Affidavit filed with Palm Beach County. Statutory clock started — permit or written citation due by June 11." },
      { id: "m3", author: "Cleared", role: "Plan Review", from_cleared: true, at: "June 1, 2026 · 2:48 PM", body: "Plan review complete. Minor structural notation on Sheet S-201 — see Correction Round 1." },
      { id: "m4", author: "Marcus Hale", role: "GC · Coastline Builders Group", at: "June 3, 2026 · 8:22 AM", body: "Atelier returning revised S-201 tomorrow. Will upload upon receipt." },
    ],
    history: [
      { id: "h1", label: "Project created", at: "May 27, 2026 · 4:11 PM", done: true },
      { id: "h2", label: "LPOA executed", at: "May 27, 2026 · 4:18 PM", note: "Affidavit of agency signed by qualifying agent", done: true },
      { id: "h3", label: "Affidavit filed with AHJ", at: "May 28, 2026 · 11:02 AM", note: "Palm Beach County — 10 business day clock started", done: true },
      { id: "h4", label: "Fees invoiced", at: "May 28, 2026 · 11:04 AM", done: true },
      { id: "h5", label: "Plan review complete", at: "June 1, 2026 · 2:48 PM", note: "1 correction round opened", done: true },
      { id: "h6", label: "Awaiting GC correction response", at: "In progress", done: false },
      { id: "h7", label: "Resubmittal to county", at: "Pending", done: false },
      { id: "h8", label: "Permit issued", at: "Pending", done: false },
    ],
    corrections: [
      {
        id: "c1",
        round: 1,
        opened_at: "June 1, 2026",
        items: [
          "Sheet S-201 — clarify beam B-12 connection detail at column line C/4 per FBC 2306.2",
          "Sheet E-301 — confirm AFCI protection for bedroom branch circuits per NEC 210.12(A)",
        ],
        status: { label: "Open · 48-hour clock", tone: "warn" },
      },
    ],
    fees: [
      { id: "f1", label: "Permitting Fee", sublabel: "Construction value × 1.5%", amount_cents: 6_187_500, status: { label: "Invoiced", tone: "sky" }, invoice_date: "May 28, 2026" },
      { id: "f2", label: "Private Provider & Admin Fee", sublabel: "Flat statutory administration", amount_cents: 885_600, status: { label: "Invoiced", tone: "sky" }, invoice_date: "May 28, 2026" },
    ],
  },
  "2": {
    id: "2",
    permit_no: "CLR-2026-0138",
    name: "Jupiter Island Residence",
    address: "88 Beach Rd",
    city: "Jupiter Island",
    county: "Martin",
    parcel: "33-40-42-04-000-000-0220",
    license_type: "CGC — Certified General Contractor",
    gc: "Coastline Builders Group",
    value_cents: 687_200_000,
    permit_types: ["Building", "Mechanical"],
    status: { label: "Corrections required", tone: "warn" },
    submitted_at: "May 21, 2026",
    documents: [
      { id: "d1", label: "Construction Plans", filename: "jupiter-island-plans-r2.pdf", size_kb: 22140, uploaded_at: "May 21, 2026" },
      { id: "d2", label: "Boundary Survey", filename: "survey-88-beach.pdf", size_kb: 1410, uploaded_at: "May 21, 2026" },
    ],
    messages: [
      { id: "m1", author: "Cleared", role: "Plan Review", from_cleared: true, at: "May 26, 2026 · 3:10 PM", body: "Plan review complete — 4 items requiring response. See Round 1." },
    ],
    history: [
      { id: "h1", label: "Affidavit filed", at: "May 21, 2026", done: true },
      { id: "h2", label: "Fees invoiced", at: "May 21, 2026", done: true },
      { id: "h3", label: "Plan review", at: "May 26, 2026", done: true },
      { id: "h4", label: "Awaiting corrections", at: "In progress", done: false },
    ],
    corrections: [
      {
        id: "c1",
        round: 1,
        opened_at: "May 26, 2026",
        items: [
          "Sheet A-101 — dimension string at east elevation",
          "Sheet M-201 — equipment schedule mismatch w/ load calcs",
          "Energy compliance form FL-ECC missing signature page",
          "Wind load report — confirm Risk Category II per ASCE 7-22",
        ],
        status: { label: "Open · 48-hour clock", tone: "warn" },
      },
    ],
    fees: [
      { id: "f1", label: "Permitting Fee", sublabel: "Construction value × 1.5%", amount_cents: 10_308_000, status: { label: "Invoiced", tone: "sky" }, invoice_date: "May 21, 2026" },
      { id: "f2", label: "Private Provider & Admin Fee", sublabel: "Flat statutory administration", amount_cents: 885_600, status: { label: "Paid", tone: "ok" }, invoice_date: "May 21, 2026" },
    ],
  },
};

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

            {/* Correction Rounds */}
            <DetailSection
              step="04"
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
