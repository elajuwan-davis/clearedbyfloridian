import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useMyIdentity, greetingForNow } from "@/lib/profile-api";
import { listPermits, type PermitRow } from "@/lib/permits-api";
import { listThreads } from "@/lib/messages-api";
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


import { CoiAlertsWidget } from "@/components/coi-alerts-widget";
import { AlertsList } from "@/components/alerts-list";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";


import { projectStatusMeta as statusMeta, type BadgeTone } from "@/lib/status-badges";
type ProjectStatus = keyof typeof statusMeta;

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const CLOSED = new Set(["approved", "permit_issued", "cancelled"]);

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

export function BuilderDashboard() {
  const me = useMyIdentity();
  const [greeting, setGreeting] = useState(() => greetingForNow());
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [unread, setUnread] = useState(0);
  const alerts = useExpirationAlerts();


  useEffect(() => {
    listPermits().then(setPermits).catch(() => {});
    listThreads()
      .then((t) => setUnread(t.reduce((n, x) => n + (x.client_unread ?? 0), 0)))
      .catch(() => {});
    const id = setInterval(() => setGreeting(greetingForNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const active = permits.filter((p) => !CLOSED.has(p.status));
  const stats = [
    { label: "Total Projects", value: permits.length, icon: FolderOpen, accent: false },
    { label: "Permits Issued", value: permits.filter((p) => p.status === "permit_issued").length, icon: ShieldCheck, accent: true },
    { label: "Corrections Pending", value: permits.filter((p) => p.status === "corrections_required").length, icon: AlertCircle, accent: false },
    { label: "Messages Unread", value: unread, icon: MessageSquare, accent: false },
  ];

  const projects = active.slice(0, 6).map((p) => ({
    id: p.id,
    permit_no: p.permit_number ?? `CLR-${p.id.slice(0, 8).toUpperCase()}`,
    name: p.project_name,
    address: p.job_address,
    county: p.county ?? p.municipality ?? "—",
    value_cents: Number(p.construction_value_cents ?? 0),
    status: (p.status as ProjectStatus),
    updated: relTime(p.updated_at),
  }));

  const needsVerification = false;
  const needsLpoa = false;


  return (
    <PortalShell>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10">
        <div className="min-w-0">
          <div className="label-eyebrow mb-3">Builder dashboard</div>
          <h1 className="display-serif text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
            {greeting}{me.firstName ? <>, <em>{me.firstName}</em></> : null}.
          </h1>
        </div>
        <Button
          asChild
          className="h-11 px-5 rounded-[3px] font-subline tracking-wide gap-2"
          style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
        >
          <Link to="/portal/permits/new">
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
              body="Limited Power of Attorney must be signed before Cleard can act as private provider on your behalf."
              cta="Review & sign"
              href="/portal"
            />
          )}
        </div>
      )}

      {alerts.length > 0 && (
        <section className="border hairline rounded-[3px] bg-background mb-8">
          <div className="flex items-center gap-2 px-4 py-3 border-b hairline">
            <AlertTriangle className="h-4 w-4 text-red-600" strokeWidth={1.75} />
            <div className="font-mono text-[10px] uppercase tracking-[0.18em]">
              Expiring licenses &amp; insurance
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {alerts.length} item{alerts.length === 1 ? "" : "s"}
            </span>
          </div>
          <AlertsList alerts={alerts} />
        </section>
      )}

      <div className="mb-8">
        <CoiAlertsWidget />
      </div>

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
      to="/portal/permits/$id"
      params={{ id: project.id }}

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
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 border"
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
      <div className="flex items-start gap-4 flex-1 min-w-0">
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
      </div>
      <Link
        to={href}
        className="shrink-0 w-full sm:w-auto text-center font-subline text-[12px] tracking-[0.1em] uppercase px-3 py-2 border transition-colors hover:bg-foreground hover:text-background"
        style={{ borderColor: "var(--foreground)", color: "var(--foreground)", borderRadius: "3px" }}
      >
        {cta}
      </Link>
    </div>

  );
}
