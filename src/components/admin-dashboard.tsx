import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  AlertTriangle,
  Stamp,
  DollarSign,
  ArrowUpRight,
  Users,
  Building2,
  MessageSquare,
  Search,
  Mail,
  UserPlus,
  Plus,
  ListChecks,
  Send,
  Activity,
  CalendarDays,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode, useActiveTenantId } from "@/lib/view-mode-context";
import { shouldListNoPermits } from "@/lib/tenant-scope";
import { projectStatusMeta, type ProjectStatus as Status } from "@/lib/status-badges";
import { useMyIdentity, greetingForNow } from "@/lib/profile-api";
import {
  PageShell,
  Surface,
  SectionHeader,
  StatTile,
  StatusChip,
  EmptyState,
  LoadingRow,
} from "@/components/ui-kit";

const statusMeta = projectStatusMeta;


const COUNTIES = ["Palm Beach", "Martin", "St. Lucie", "Indian River", "Broward", "Miami-Dade"] as const;

type PermitLite = {
  id: string;
  permit_number: string | null;
  project_name: string;
  job_address: string | null;
  county: string | null;
  municipality: string | null;
  status: string;
  construction_value_cents: number | null;
  submitted_date: string | null;
  created_at: string;
  created_by: string | null;
  tenant_id: string | null;
};

type TenantLite = { id: string; name: string; status: string; created_at: string };
type MemberLite = { user_id: string; tenant_id: string; role: string; created_at: string };
type ProfileLite = { id: string; email: string | null; display_name: string | null; full_name: string | null };
type InvoiceLite = { fee_cents: number; processing_fee_cents: number; status: string };

const fmtMoneyWhole = (cents: number) =>
  `$${Math.round(cents / 100).toLocaleString("en-US")}`;

function daysSince(iso: string | null) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 86_400_000));
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [permits, setPermits] = useState<PermitLite[]>([]);
  const [tenants, setTenants] = useState<TenantLite[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [invoices, setInvoices] = useState<InvoiceLite[]>([]);
  const [openThreads, setOpenThreads] = useState(0);
  const [adminUnread, setAdminUnread] = useState(0);
  const [invites, setInvites] = useState<{ open: number; accepted: number }>({ open: 0, accepted: 0 });
  const [accessRequests, setAccessRequests] = useState<{ pending: number; total: number }>({ pending: 0, total: 0 });

  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [countyFilter, setCountyFilter] = useState<"all" | (typeof COUNTIES)[number]>("all");
  const [clientFilter, setClientFilter] = useState<"all" | string>("all");
  const { setSelectedTenantId } = useViewMode();
  const activeTenantId = useActiveTenantId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const noClient = shouldListNoPermits(activeTenantId);
    (async () => {
      const permitsQuery = noClient
        ? Promise.resolve({ data: [] as PermitLite[] })
        : (() => {
            let q = (supabase.from("permits" as any) as any)
              .select("id, permit_number, project_name, job_address, county, municipality, status, construction_value_cents, submitted_date, created_at, created_by, tenant_id")
              .order("created_at", { ascending: false });
            if (activeTenantId) q = q.eq("tenant_id", activeTenantId);
            return q;
          })();

      const [p, t, m, pr, inv, th, invt, ar] = await Promise.all([
        permitsQuery,
        (supabase.from("tenants" as any) as any).select("id, name, status, created_at"),
        (supabase.from("tenant_members" as any) as any).select("user_id, tenant_id, role, created_at"),
        (supabase.from("profiles" as any) as any).select("id, email, display_name, full_name"),
        (supabase.from("service_fee_invoices" as any) as any).select("fee_cents, processing_fee_cents, status"),
        (supabase.from("message_threads" as any) as any).select("status, admin_unread"),
        (supabase.from("tenant_invites" as any) as any).select("uses, revoked_at"),
        (supabase.from("access_requests" as any) as any).select("status"),
      ]);
      if (cancelled) return;
      setPermits((((p as any).data ?? []) as PermitLite[]));
      setTenants(((t.data ?? []) as TenantLite[]));
      setMembers(((m.data ?? []) as MemberLite[]));
      setProfiles(((pr.data ?? []) as ProfileLite[]));
      setInvoices(((inv.data ?? []) as InvoiceLite[]));
      const threads = (th.data ?? []) as Array<{ status: string; admin_unread: number }>;
      setOpenThreads(threads.filter((x) => x.status === "open").length);
      setAdminUnread(threads.reduce((n, x) => n + (x.admin_unread ?? 0), 0));
      const inviteRows = (invt.data ?? []) as Array<{ uses: number | null; revoked_at: string | null }>;
      setInvites({
        open: inviteRows.filter((i) => !i.revoked_at && Number(i.uses ?? 0) === 0).length,
        accepted: inviteRows.reduce((n, i) => n + Number(i.uses ?? 0), 0),
      });
      const arRows = (ar.data ?? []) as Array<{ status: string }>;
      setAccessRequests({
        pending: arRows.filter((r) => r.status === "pending").length,
        total: arRows.length,
      });
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [activeTenantId]);


  const tenantName = useMemo(() => {
    const map = new Map<string, string>();
    tenants.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [tenants]);

  const userName = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.display_name || p.full_name || ""));
    return map;
  }, [profiles]);

  const userEmail = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => { if (p.email) map.set(p.id, p.email); });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return permits.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (countyFilter !== "all" && (r.county ?? "") !== countyFilter) return false;
      if (clientFilter !== "all" && (r.tenant_id ?? "") !== clientFilter) return false;
      if (!q) return true;
      return `${r.project_name} ${r.permit_number ?? ""} ${r.job_address ?? ""} ${tenantName.get(r.tenant_id ?? "") ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [permits, statusFilter, countyFilter, clientFilter, query, tenantName]);

  const activeCount = permits.filter((r) => r.status !== "permit_issued" && r.status !== "cancelled").length;
  const correctionsCount = permits.filter((r) => r.status === "corrections_required").length;
  const issuedCount = permits.filter((r) => r.status === "permit_issued").length;
  const outstandingFeesCents = invoices
    .filter((f) => f.status !== "paid" && f.status !== "refunded")
    .reduce((s, f) => s + Number(f.fee_cents ?? 0) + Number(f.processing_fee_cents ?? 0), 0);

  // Per-client rollup
  const clientRows = useMemo(() => {
    return tenants
      .map((t) => {
        const tp = permits.filter((p) => p.tenant_id === t.id);
        return {
          id: t.id,
          name: t.name,
          status: t.status,
          created_at: t.created_at,
          accounts: members.filter((m) => m.tenant_id === t.id).length,
          permits: tp.length,
          active: tp.filter((p) => p.status !== "permit_issued" && p.status !== "cancelled").length,
          issued: tp.filter((p) => p.status === "permit_issued").length,
          value: tp.reduce((s, p) => s + Number(p.construction_value_cents ?? 0), 0),
        };
      })
      .sort((a, b) => b.permits - a.permits || a.name.localeCompare(b.name));
  }, [tenants, permits, members]);

  // Per-account rollup (permits added by user)
  const accountRows = useMemo(() => {
    return members
      .map((m) => ({
        user_id: m.user_id,
        name:
          userName.get(m.user_id) ||
          userEmail.get(m.user_id) ||
          `User ${m.user_id.slice(0, 8)}`,
        email: userEmail.get(m.user_id) ?? "",
        client: tenantName.get(m.tenant_id) ?? "—",
        role: m.role,
        joined: m.created_at,
        permits: permits.filter((p) => p.created_by === m.user_id).length,
      }))
      .sort((a, b) => b.permits - a.permits || a.name.localeCompare(b.name));
  }, [members, permits, userName, userEmail, tenantName]);


  const me = useMyIdentity();
  const [greeting, setGreeting] = useState(() => greetingForNow());
  useEffect(() => {
    const id = setInterval(() => setGreeting(greetingForNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Status tabs mirror the filter — same data, one visual language.
  const statusTabs = useMemo(() => {
    const counts = new Map<string, number>();
    permits.forEach((p) => counts.set(p.status, (counts.get(p.status) ?? 0) + 1));
    return (Object.keys(statusMeta) as Status[])
      .filter((s) => (counts.get(s) ?? 0) > 0)
      .map((s) => ({ status: s, label: statusMeta[s].label, count: counts.get(s) ?? 0 }));
  }, [permits]);

  const donut = useMemo(() => {
    const buckets: Array<{ name: string; value: number; color: string }> = [
      { name: "Pre-check", value: permits.filter((p) => ["submitted", "in_review", "pending"].includes(p.status)).length, color: "#9A7B2E" },
      { name: "En route", value: permits.filter((p) => ["inspection_scheduled", "permit_issued"].includes(p.status)).length, color: "#673147" },
      { name: "Corrections", value: correctionsCount, color: "#7A5C8A" },
      { name: "On hold", value: permits.filter((p) => p.status === "on_hold").length, color: "#8C3B3B" },
      { name: "Cleared", value: permits.filter((p) => ["approved", "inspection_complete", "resubmitted", "resubmitted_to_county", "correction_response_under_review"].includes(p.status)).length, color: "#673147" },
    ];
    return buckets.filter((b) => b.value > 0);
  }, [permits, correctionsCount]);

  // Recent activity is a presentation of the rows already loaded above.
  const recent = useMemo(() => {
    const events = [
      ...permits.slice(0, 12).map((p) => ({
        at: p.created_at,
        title: p.project_name,
        detail: `Permit filed · ${statusMeta[p.status as Status]?.label ?? p.status.replace(/_/g, " ")}`,
        tone: "info" as const,
      })),
      ...tenants.slice(0, 6).map((t) => ({
        at: t.created_at,
        title: t.name,
        detail: "Client company added",
        tone: "success" as const,
      })),
    ];
    return events
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [permits, tenants]);

  const totalValueCents = permits.reduce((s, p) => s + Number(p.construction_value_cents ?? 0), 0);
  const countiesActive = new Set(permits.map((p) => p.county).filter(Boolean)).size;
  const onTime = permits.length
    ? Math.round(
        (permits.filter((p) => p.status !== "corrections_required" && p.status !== "on_hold").length /
          permits.length) *
          100,
      )
    : 0;

  return (
    <PortalShell>
      <PageShell
          crumbs={[{ label: "Cleard Operations" }, { label: "Dashboard" }]}
          title={<>{greeting}{me.firstName ? `, ${me.firstName}` : ""}.</>}
          actions={
            <>
              <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground sm:inline-flex">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
                {today}
              </span>
              <Link to="/portal/permits/new" className="p-btn p-btn-primary">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                New permit
              </Link>
            </>
          }
      >
        {/* Executive summary */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label="Permits in review"
            value={activeCount}
            context={`${permits.length} total on file`}
            icon={<FolderOpen className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="info"
          />
          <StatTile
            label="Corrections pending"
            value={correctionsCount}
            context="Awaiting client action"
            icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="warning"
          />
          <StatTile
            label="Permits issued"
            value={issuedCount}
            context={`${onTime}% on time`}
            icon={<Stamp className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="success"
          />
          <StatTile
            label="Unread conversations"
            value={adminUnread}
            context={`${openThreads} open threads`}
            icon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="purple"
            to="/messages"
          />
          <StatTile
            label="Outstanding fees"
            value={fmtMoneyWhole(outstandingFeesCents)}
            context="Invoiced + overdue"
            icon={<DollarSign className="h-3.5 w-3.5" strokeWidth={1.75} />}
            tone="danger"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Client companies" value={tenants.length} context={`${tenants.filter((t) => t.status === "active").length} active`} icon={<Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />} />
          <StatTile label="User accounts" value={members.length} context="Across all clients" icon={<Users className="h-3.5 w-3.5" strokeWidth={1.75} />} />
          <StatTile label="Open invites" value={invites.open} context={`${invites.accepted} accepted`} icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.75} />} to="/admin/invites" />
          <StatTile label="Access requests" value={accessRequests.pending} context={`${accessRequests.total} all time`} icon={<UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />} tone="warning" to="/admin/invites" />
        </div>

        {/* Queue + critical panel */}
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Surface padded={false} flat className="min-w-0">
            <SectionHeader
              title="Active permits"
              meta={`${filtered.length} of ${permits.length}`}
              action={
                <Link to="/portal/permits" className="text-muted-foreground transition-colors hover:text-foreground">
                  View all
                </Link>
              }
            />

            {/* One filter bar — search, status tabs, county, client */}
            <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-3" style={{ borderColor: "var(--p-border)" }}>
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search permits, projects, clients, addresses…"
                  className="h-8 w-full border pl-8 pr-3 text-[13px] outline-none focus:border-white/15"
                />
              </div>
              <Select value={countyFilter} onValueChange={(v) => setCountyFilter(v as typeof countyFilter)}>
                <SelectTrigger className="h-8 w-[150px] rounded-[10px] text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All counties</SelectItem>
                  {COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select
                value={clientFilter}
                onValueChange={(v) => {
                  setClientFilter(v);
                  setSelectedTenantId(v === "all" ? null : v);
                }}
              >
                <SelectTrigger className="h-8 w-[170px] rounded-[10px] text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="p-noscroll flex items-center gap-1 overflow-x-auto px-4 py-2.5">
              <TabChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="All" count={permits.length} />
              {statusTabs.map((t) => (
                <TabChip
                  key={t.status}
                  active={statusFilter === t.status}
                  onClick={() => setStatusFilter(t.status)}
                  label={t.label}
                  count={t.count}
                />
              ))}
            </div>

            {loading ? (
              <LoadingRow label="Loading permits" />
            ) : activeTenantId === "__none__" && permits.length === 0 ? (
              <EmptyState title="No client selected" description="Select a client to view their permits." />
            ) : filtered.length === 0 ? (
              <EmptyState title="No permits match these filters" description="Clear the search or pick a different status to widen the queue." />
            ) : (
              <div className="overflow-auto" style={{ maxHeight: 520 }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>County</th>
                      <th>Status</th>
                      <th className="text-right">Value</th>
                      <th className="text-right">Age</th>
                      <th>Client</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const meta = statusMeta[r.status as Status] ?? { label: r.status.replace(/_/g, " "), tone: "neutral" as const };
                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="font-medium">{r.project_name}</div>
                            <div className="mt-0.5 text-[12px] text-muted-foreground">{r.job_address}</div>
                          </td>
                          <td className="text-muted-foreground">{r.county ?? r.municipality ?? "—"}</td>
                          <td><StatusChip tone={meta.tone}>{meta.label}</StatusChip></td>
                          <td className="text-right tabular-nums">{fmtMoneyWhole(Number(r.construction_value_cents ?? 0))}</td>
                          <td className="text-right tabular-nums text-muted-foreground">{daysSince(r.submitted_date ?? r.created_at)}d</td>
                          <td className="text-muted-foreground">{tenantName.get(r.tenant_id ?? "") ?? "—"}</td>
                          <td className="text-right">
                            <Link
                              to="/portal/permits/$id"
                              params={{ id: r.id }}
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
                <QuickAction to="/admin/invites" icon={<ListChecks className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Review queue" badge={correctionsCount || undefined} />
                <QuickAction to="/portal/permits/new" icon={<Plus className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Add new permit" />
                <QuickAction to="/messages" icon={<Send className="h-3.5 w-3.5" strokeWidth={1.75} />} label="Send message" badge={adminUnread || undefined} />
              </div>
            </Surface>

            <Surface padded={false} flat>
              <SectionHeader
                title="Recent activity"
                action={<Link to="/admin/audit" className="text-muted-foreground transition-colors hover:text-foreground">View all</Link>}
              />
              {recent.length === 0 ? (
                <EmptyState title="Nothing yet" description="Activity appears as permits and clients are added." icon={<Activity className="h-4 w-4" strokeWidth={1.75} />} />
              ) : (
                <ul className="flex flex-col gap-3 px-4 pb-4">
                  {recent.map((e, i) => (
                    <li key={`${e.title}-${i}`} className="flex min-w-0 items-start gap-2.5">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: e.tone === "success" ? "#673147" : "#673147" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{e.title}</div>
                        <div className="truncate text-[12px] text-muted-foreground">{e.detail}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDate(e.at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </div>
        </div>

        {/* Analytics + rollups */}
        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <Surface padded={false} flat className="min-w-0">
            <SectionHeader title="Client companies" />
            {clientRows.length === 0 ? (
              <EmptyState title="No client companies yet" />
            ) : (
              <div className="overflow-auto" style={{ maxHeight: 300 }}>
                <table className="p-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th className="text-right">Permits</th>
                      <th className="text-right">Active</th>
                      <th className="text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientRows.map((c) => (
                      <tr key={c.id}>
                        <td className="max-w-[180px] truncate">{c.name}</td>
                        <td className="text-right tabular-nums text-muted-foreground">{c.permits}</td>
                        <td className="text-right tabular-nums text-muted-foreground">{c.active}</td>
                        <td className="text-right tabular-nums">{fmtMoneyWhole(c.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>

          <Surface padded={false} flat className="min-w-0">
            <SectionHeader title="Today's snapshot" />
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              <Snapshot value={String(activeCount)} label="Active permits" context={`${permits.length} on file`} />
              <Snapshot value={String(issuedCount)} label="Issued" context="All time" />
              <Snapshot value={fmtMoneyWhole(totalValueCents)} label="Portfolio value" context="Construction value" />
              <Snapshot value={String(countiesActive)} label="Counties active" context="Palm Beach + Treasure Coast" />
              <div className="col-span-2 p-inset p-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">On-time completion</span>
                  <span className="font-medium tabular-nums">{onTime}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full" style={{ width: `${onTime}%`, backgroundColor: "#673147" }} />
                </div>
              </div>
            </div>
          </Surface>

          <Surface padded={false} flat className="min-w-0">
            <SectionHeader title="Permit status overview" meta={`${permits.length} total`} />
            <div className="flex items-center gap-4 px-4 pb-4">
              <div className="relative h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut.length ? donut : [{ name: "None", value: 1, color: "#1E3434" }]}
                      dataKey="value"
                      innerRadius={48}
                      outerRadius={66}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(donut.length ? donut : [{ name: "None", value: 1, color: "#1E3434" }]).map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-[22px] font-semibold leading-none tabular-nums">{permits.length}</div>
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
                    <span className="w-9 text-right tabular-nums text-muted-foreground">
                      {permits.length ? Math.round((d.value / permits.length) * 100) : 0}%
                    </span>
                  </li>
                ))}
                {donut.length === 0 && <li className="text-[12px] text-muted-foreground">No permits yet.</li>}
              </ul>
            </div>
          </Surface>
        </div>

        {/* Accounts */}
        <Surface padded={false} flat className="mt-3">
          <SectionHeader title="User accounts" meta={`${accountRows.length} across all clients`} />
          {accountRows.length === 0 ? (
            <EmptyState title="No accounts yet" />
          ) : (
            <div className="overflow-auto" style={{ maxHeight: 340 }}>
              <table className="p-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Client</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th className="text-right">Permits</th>
                  </tr>
                </thead>
                <tbody>
                  {accountRows.map((a) => (
                    <tr key={a.user_id}>
                      <td>
                        <div className="font-medium">{a.name}</div>
                        {a.email && <div className="mt-0.5 text-[12px] text-muted-foreground">{a.email}</div>}
                      </td>
                      <td className="text-muted-foreground">{a.client}</td>
                      <td><StatusChip tone="neutral">{a.role.replace(/_/g, " ")}</StatusChip></td>
                      <td className="text-muted-foreground">{fmtDate(a.joined)}</td>
                      <td className="text-right tabular-nums">{a.permits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Surface>
      </PageShell>
    </PortalShell>
  );
}

/* ─────────── local presentation helpers ─────────── */

function TabChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] transition-colors"
      style={{
        backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? "var(--p-text)" : "var(--p-text-2)",
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
      <span className="tabular-nums opacity-60">{count}</span>
    </button>
  );
}

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
