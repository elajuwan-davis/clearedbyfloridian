import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  FileSignature,
  Plus,
  ArrowUpRight,
  FolderOpen,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

// Mock — replace with profiles + projects queries when wired
const mockBuilder = { first_name: "Javier", license_verified: false, coi_verified: true, lpoa_signed: false };

const stats = [
  { label: "Total Projects", value: 7, icon: FolderOpen, accent: false },
  { label: "Permits Issued", value: 4, icon: ShieldCheck, accent: true },
  { label: "Corrections Pending", value: 2, icon: AlertCircle, accent: false },
  { label: "Messages Unread", value: 5, icon: MessageSquare, accent: false },
];

import { projectStatusMeta as statusMeta, type BadgeTone } from "@/lib/status-badges";
type ProjectStatus = keyof typeof statusMeta;


const projects: Array<{
  id: string;
  permit_no: string;
  name: string;
  address: string;
  county: string;
  value_cents: number;
  status: ProjectStatus;
  updated: string;
}> = [
  { id: "1", permit_no: "CLR-2026-0142", name: "Ocean Ridge Estate", address: "1247 Banyan Trail", county: "Palm Beach", value_cents: 412_500_000, status: "in_review", updated: "2h ago" },
  { id: "2", permit_no: "CLR-2026-0138", name: "Sewall's Point Residence", address: "84 Mariner's Cay", county: "Martin", value_cents: 287_000_000, status: "corrections_required", updated: "1d ago" },
  { id: "3", permit_no: "CLR-2026-0131", name: "Jupiter Island Pool & Cabana", address: "3920 South Beach Rd", county: "Martin", value_cents: 156_800_000, status: "permit_issued", updated: "3d ago" },
  { id: "4", permit_no: "CLR-2026-0129", name: "Manalapan New Build", address: "1500 S Ocean Blvd", county: "Palm Beach", value_cents: 894_200_000, status: "submitted", updated: "5d ago" },
  { id: "5", permit_no: "CLR-2026-0122", name: "Stuart Riverfront Addition", address: "212 St Lucie Crescent", county: "Martin", value_cents: 198_400_000, status: "approved", updated: "1w ago" },
  { id: "6", permit_no: "CLR-2026-0118", name: "Vero Beach Hardscape", address: "770 Ocean Dr", county: "Indian River", value_cents: 124_900_000, status: "permit_issued", updated: "2w ago" },
];

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const needsVerification = !mockBuilder.license_verified || !mockBuilder.coi_verified;
  const needsLpoa = !mockBuilder.lpoa_signed;

  return (
    <PortalShell>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <div>
          <div className="label-eyebrow mb-3">Builder dashboard</div>
          <h1 className="display-serif text-5xl leading-[1.05]">
            {greeting}, <em>{mockBuilder.first_name}</em>.
          </h1>
        </div>
        <Button
          asChild
          className="h-11 px-5 rounded-[3px] font-subline tracking-wide gap-2"
          style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
        >
          <Link to="/portal/new-permit">
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            New Project
          </Link>
        </Button>
      </div>

      {/* Banners */}
      {(needsVerification || needsLpoa) && (
        <div className="space-y-3 mb-10">
          {needsVerification && (
            <Banner
              tone="warn"
              icon={AlertTriangle}
              title="Verification pending"
              body="License and COI documents are under review. Submittal to county is paused until cleared."
              cta="Upload documents"
              href="/portal"
            />
          )}
          {needsLpoa && (
            <Banner
              tone="sky"
              icon={FileSignature}
              title="LPOA signature required"
              body="Limited Power of Attorney must be signed before Cleared can act as private provider on your behalf."
              cta="Review & sign"
              href="/portal"
            />
          )}
        </div>
      )}

      {/* Stat cards — obsidian, one with sky accent */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Projects */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <div className="label-eyebrow mb-1.5">Active permits</div>
          <h2 className="display-serif text-2xl">Your projects</h2>
        </div>
        <Link
          to="/portal/projects"
          className="font-subline text-[12px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </PortalShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof FolderOpen;
  accent: boolean;
}) {
  return (
    <div
      className="relative p-5 overflow-hidden"
      style={{
        backgroundColor: "var(--obsidian)",
        color: "var(--paper)",
        borderRadius: "3px",
        border: accent
          ? "1px solid color-mix(in oklab, var(--sky) 40%, transparent)"
          : "1px solid color-mix(in oklab, var(--paper) 6%, transparent)",
      }}
    >
      {accent && (
        <>
          <div
            aria-hidden
            className="absolute -top-12 -right-12 h-32 w-32 rounded-full"
            style={{
              background: "radial-gradient(circle, color-mix(in oklab, var(--sky) 25%, transparent), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ backgroundColor: "var(--sky)" }}
          />
        </>
      )}
      <div className="relative flex items-center justify-between mb-6">
        <div
          className="font-mono text-[10px] tracking-[0.18em] uppercase"
          style={{
            color: accent
              ? "color-mix(in oklab, var(--sky) 90%, transparent)"
              : "color-mix(in oklab, var(--paper) 55%, transparent)",
          }}
        >
          {label}
        </div>
        <Icon
          className="h-3.5 w-3.5"
          strokeWidth={1.5}
          style={{
            color: accent
              ? "var(--sky)"
              : "color-mix(in oklab, var(--paper) 40%, transparent)",
          }}
        />
      </div>
      <div className="relative font-display text-4xl tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function ProjectCard({
  project,
}: {
  project: {
    id: string;
    permit_no: string;
    name: string;
    address: string;
    county: string;
    value_cents: number;
    status: ProjectStatus;
    updated: string;
  };
}) {
  const meta = statusMeta[project.status];
  return (
    <Link
      to="/portal/projects"
      className="group block p-5 bg-card border hairline transition-colors hover:bg-secondary"
      style={{ borderRadius: "3px" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
          {project.permit_no}
        </div>
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      </div>
      <div className="display-serif text-xl leading-tight mb-1">{project.name}</div>
      <div className="text-sm text-muted-foreground mb-5">{project.address}</div>
      <div className="flex items-end justify-between pt-3 border-t hairline">
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-0.5">
            {project.county} County
          </div>
          <div className="font-mono text-xs tabular-nums">{fmtMoney(project.value_cents)}</div>
        </div>
        <div className="font-mono text-[10px] tracking-wide text-muted-foreground">
          {project.updated}
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  const styles: Record<BadgeTone, React.CSSProperties> = {
    neutral: {
      color: "var(--muted-foreground)",
      backgroundColor: "color-mix(in oklab, var(--ink) 5%, transparent)",
      borderColor: "color-mix(in oklab, var(--ink) 10%, transparent)",
    },
    sky: {
      color: "color-mix(in oklab, var(--sky) 50%, var(--ink))",
      backgroundColor: "color-mix(in oklab, var(--sky) 14%, transparent)",
      borderColor: "color-mix(in oklab, var(--sky) 30%, transparent)",
    },
    amber: {
      color: "oklch(0.48 0.13 75)",
      backgroundColor: "oklch(0.9 0.09 75 / 0.45)",
      borderColor: "oklch(0.7 0.12 75 / 0.45)",
    },
    oxblood: {
      color: "var(--accent)",
      backgroundColor: "color-mix(in oklab, var(--accent) 8%, transparent)",
      borderColor: "color-mix(in oklab, var(--accent) 30%, transparent)",
    },
    emerald: {
      color: "oklch(0.45 0.12 155)",
      backgroundColor: "oklch(0.92 0.05 155 / 0.5)",
      borderColor: "oklch(0.7 0.1 155 / 0.4)",
    },
    dark: {
      color: "var(--paper-warm, #f8f4ec)",
      backgroundColor: "var(--ink)",
      borderColor: "var(--ink)",
    },
  };
  return (
    <span
      className="font-mono text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5 border"
      style={{ ...styles[tone], borderRadius: "2px", borderWidth: "1px", borderStyle: "solid" }}
    >
      {children}
    </span>
  );
}


function Banner({
  tone,
  icon: Icon,
  title,
  body,
  cta,
  href,
}: {
  tone: "warn" | "sky";
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  const isWarn = tone === "warn";
  return (
    <div
      className="flex items-start gap-4 p-5 border"
      style={{
        borderRadius: "3px",
        backgroundColor: isWarn
          ? "color-mix(in oklab, var(--accent) 6%, transparent)"
          : "color-mix(in oklab, var(--sky) 8%, transparent)",
        borderColor: isWarn
          ? "color-mix(in oklab, var(--accent) 30%, transparent)"
          : "color-mix(in oklab, var(--sky) 35%, transparent)",
      }}
    >
      <div
        className="grid place-items-center h-9 w-9 shrink-0"
        style={{
          backgroundColor: isWarn
            ? "color-mix(in oklab, var(--accent) 15%, transparent)"
            : "color-mix(in oklab, var(--sky) 18%, transparent)",
          color: isWarn ? "var(--accent)" : "color-mix(in oklab, var(--sky) 50%, var(--ink))",
          borderRadius: "3px",
        }}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: isWarn ? "var(--accent)" : "color-mix(in oklab, var(--sky) 50%, var(--ink))" }}
          >
            {isWarn ? "Action required" : "Awaiting signature"}
          </div>
        </div>
        <div className="text-[15px] font-medium mb-0.5">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
      <Link
        to={href}
        className="shrink-0 self-center font-subline text-[12px] tracking-[0.1em] uppercase px-3 py-2 border transition-colors hover:bg-foreground hover:text-background"
        style={{ borderColor: "var(--foreground)", color: "var(--foreground)", borderRadius: "3px" }}
      >
        {cta}
      </Link>
    </div>
  );
}
