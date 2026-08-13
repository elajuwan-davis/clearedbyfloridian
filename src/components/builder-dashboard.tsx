import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
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
  CalendarDays,
  Send,
  ClipboardList,
  Activity,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { CoiAlertsWidget } from "@/components/coi-alerts-widget";
import { AlertsList } from "@/components/alerts-list";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";

import { projectStatusMeta as statusMeta } from "@/lib/status-badges";
import {
  PageShell,
  Surface,
  SectionHeader,
  StatTile,
  StatusChip,
  EmptyState,
} from "@/components/ui-kit";

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
  const [loading, setLoading] = useState(true);
  const alerts = useExpirationAlerts();

  useEffect(() => {
    listPermits()
      .then(setPermits)
      .catch(() => {})
      .finally(() => setLoading(false));
    listThreads()
      .then((t) => setUnread(t.reduce((n, x) => n + (x.client_unread ?? 0), 0)))
      .catch(() => {});
    const id = setInterval(() => setGreeting(greetingForNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const active = permits.filter((p) => !CLOSED.has(p.status));
  const issued = permits.filter((p) => p.status === "permit_issued").length;
  const corrections = permits.filter((p) => p.status === "corrections_required").length;
  const portfolioCents = permits.reduce((s, p) => s + Number(p.construction_value_cents ?? 0), 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const rows = active.slice(0, 12).map((p) => ({
    id: p.id,
    permit_no: p.permit_number ?? `CLR-${p.id.slice(0, 8).toUpperCase()}`,
    name: p.project_name,
    address: p.job_address,
    county: p.county ?? p.municipality ?? "—",
    value_cents: Number(p.construction_value_cents ?? 0),
    status: p.status as ProjectStatus,
    updated: relTime(p.updated_at),
  }));

  const donut = useMemo(() => {
    const buckets = [
      { name: "In review", value: permits.filter((p) => ["submitted", "in_review", "pending"].includes(p.status)).length, color: "#F59E0B" },
      { name: "Corrections", value: corrections, color: "#A78BFA" },
      { name: "On hold", value: permits.filter((p) => p.status === "on_hold").length, color: "#EF4444" },
      { name: "Issued", value: issued, color: "#22C55E" },
      { name: "Approved", value: permits.filter((p) => p.status === "approved").length, color: "#3B82F6" },
    ];
    return buckets.filter((b) => b.value > 0);
  }, [permits, corrections, issued]);

  const recent = useMemo(
    () =>
      [...permits]
        .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
        .slice(0, 6)
        .map((p) => ({
          title: p.project_name,
          detail: statusMeta[p.status as ProjectStatus]?.label ?? p.status.replace(/_/g, " "),
          at: relTime(p.updated_at),
        })),
    [permits],
  );

  const needsVerification = false;
  const needsLpoa = false;

  return (
    <PortalShell>
      <PageShell
          crumbs={[{ label: "Workspace" }, { label: "Dashboard" }]}
          title={<>{greeting}{me.firstName ? `, ${me.firstName}` : ""}.</>}
          actions={
            <>
              <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground sm:inline-flex">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
                {today}
              </span>
              <Link to="/portal/permits/new" className="p-btn p-btn-primary">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                New project
              </Link>
            </>
          }
      >
        {/* Banners */}
        {(needsVerification || needsLpoa) && (
          <div className="mb-3 space-y-2">
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
          <Surface padded={false} flat className="mb-3">
            <SectionHeader
              title="Expiring licenses & insurance"
              meta={`${alerts.length} item${alerts.length === 1 ? "" : "s"}`}
            />
            <div className="px-1 pb-2">
              <AlertsList alerts={alerts} />
            </div>
          </Surface>
        )}

        <div className="mb-3">
          <CoiAlertsWidget />
        </div>

        {/* Executive summary */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Active permits"
            value={active.length}
            context={`${permits.length} total projects`}
            icon={<FolderOpen className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="info"
          />
          <StatTile
            label="Permits issued"
            value={issued}
            context="Cleared for construction"
            icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="success"
          />
          <StatTile
            label="Corrections pending"
            value={corrections}
            context="Needs your response"
            icon={<AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="warning"
          />
          <StatTile
            label="Unread messages"
            value={unread}
            context="From the Cleard desk"
            icon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="purple"
            to="/messages"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Surface padded={false} flat className="min-w-0">
            <SectionHeader
              title="Active permits"
              meta={`${rows.length} shown`}
              action={
                <Link to="/portal/permits" className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                  View all <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                </Link>
              }
            />
            {loading ? (
              <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">Loading permits…</div>
            ) : rows.length === 0 ? (
              <EmptyState
                title="No active permits"
                description="Start a new project and Cleard will handle the filing end to end."
                action={<Link to="/portal/permits/new" className="p-btn p-btn-primary">New project</Link>}
              />
            ) : (
              <div className="overflow-auto" style={{ maxHeight: 520 }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Permit no.</th>
                      <th>County</th>
                      <th>Status</th>
                      <th className="text-right">Value</th>
                      <th className="text-right">Updated</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const meta = statusMeta[p.status] ?? { label: String(p.status).replace(/_/g, " "), tone: "neutral" as const };
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="font-medium">{p.name}</div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">{p.address}</div>
                          </td>
                          <td className="font-mono text-[12px] text-muted-foreground">{p.permit_no}</td>
                          <td className="text-muted-foreground">{p.county}</td>
                          <td><StatusChip tone={meta.tone}>{meta.label}</StatusChip></td>
                          <td className="text-right tabular-nums">{fmtMoney(p.value_cents)}</td>
                          <td className="text-right text-muted-foreground">{p.updated}</td>
                          <td className="text-right">
                            <Link
                              to="/portal/permits/$id"
                              params={{ id: p.id }}
                              className="p-btn p-btn-ghost h-7 px-2 text-[12px]"
                            >
                              Open <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>

          <div className="flex min-w-0 flex-col gap-3">
            <Surface padded={false} flat>
              <SectionHeader title="Quick actions" />
              <div className="flex flex-col gap-1 px-3 pb-3">
                <QuickAction to="/portal/permits/new" icon={<Plus className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Start a new permit" />
                <QuickAction to="/portal/inspections" icon={<ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Schedule inspection" />
                <QuickAction to="/messages" icon={<Send className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Message the desk" badge={unread || undefined} />
                <QuickAction to="/portal/compliance" icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Compliance documents" />
              </div>
            </Surface>

            <Surface padded={false} flat>
              <SectionHeader title="Permit status overview" meta={`${permits.length} total`} />
              <div className="flex items-center gap-4 px-4 pb-4">
                <div className="relative h-[130px] w-[130px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donut.length ? donut : [{ name: "None", value: 1, color: "#1A2436" }]}
                        dataKey="value"
                        innerRadius={44}
                        outerRadius={62}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {(donut.length ? donut : [{ name: "None", value: 1, color: "#1A2436" }]).map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <div className="text-[20px] font-semibold leading-none tabular-nums">{permits.length}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">Total</div>
                    </div>
                  </div>
                </div>
                <ul className="min-w-0 flex-1 space-y-2">
                  {donut.map((d) => (
                    <li key={d.name} className="flex min-w-0 items-center gap-2 text-[12px]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.name}</span>
                      <span className="tabular-nums">{d.value}</span>
                    </li>
                  ))}
                  {donut.length === 0 && <li className="text-[12px] text-muted-foreground">No permits yet.</li>}
                </ul>
              </div>
            </Surface>

            <Surface padded={false} flat>
              <SectionHeader title="Recent activity" />
              {recent.length === 0 ? (
                <EmptyState title="Nothing yet" description="Updates appear as your permits move." icon={<Activity className="h-4 w-4" strokeWidth={1.75} />} />
              ) : (
                <ul className="flex flex-col gap-3 px-4 pb-4">
                  {recent.map((e, i) => (
                    <li key={`${e.title}-${i}`} className="flex min-w-0 items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{e.title}</div>
                        <div className="truncate text-[12px] text-muted-foreground">{e.detail}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{e.at}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </div>
        </div>

        <Surface padded={false} flat className="mt-3">
          <SectionHeader title="Portfolio" meta="Across all projects" />
          <div className="grid grid-cols-2 gap-2 px-4 pb-4 md:grid-cols-4">
            <Snapshot value={String(permits.length)} label="Projects" context="All time" />
            <Snapshot value={String(active.length)} label="In progress" context="Open with Cleard" />
            <Snapshot value={String(issued)} label="Permits issued" context="Ready to build" />
            <Snapshot value={fmtMoney(portfolioCents)} label="Portfolio value" context="Construction value" />
          </div>
        </Surface>
      </PageShell>
    </PortalShell>
  );
}

/* ─────────── local presentation helpers ─────────── */

function QuickAction({
  to,
  icon,
  label,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to as never}
      className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] transition-colors hover:bg-white/[0.05]"
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? <span className="p-chip p-chip-info">{badge}</span> : null}
    </Link>
  );
}

function Snapshot({ value, label, context }: { value: string; label: string; context?: string }) {
  return (
    <div className="p-inset p-3">
      <div className="text-[18px] font-semibold leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 truncate text-[12px]">{label}</div>
      {context && <div className="truncate text-[11px] text-muted-foreground">{context}</div>}
    </div>
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
  const accent = isWarn ? "#F59E0B" : "#3B82F6";
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
      style={{
        backgroundColor: isWarn ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
        borderColor: isWarn ? "rgba(245,158,11,0.24)" : "rgba(59,130,246,0.24)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium">{title}</div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
      <Link to={href as never} className="p-btn p-btn-ghost w-full sm:w-auto">
        {cta}
      </Link>
    </div>
  );
}
