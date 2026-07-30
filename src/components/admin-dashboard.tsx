import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  AlertTriangle,
  Stamp,
  DollarSign,
  Filter,
  ArrowUpRight,
  Users,
  Building2,
  MessageSquare,
  Search,
  Loader2,
  Mail,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { projectStatusMeta, toneClass, type ProjectStatus as Status } from "@/lib/status-badges";


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
type ProfileLite = { id: string; display_name: string | null; full_name: string | null };
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, t, m, pr, inv, th, invt, ar] = await Promise.all([
        (supabase.from("permits" as any) as any)
          .select("id, permit_number, project_name, job_address, county, municipality, status, construction_value_cents, submitted_date, created_at, created_by, tenant_id")
          .order("created_at", { ascending: false }),
        (supabase.from("tenants" as any) as any).select("id, name, status, created_at"),
        (supabase.from("tenant_members" as any) as any).select("user_id, tenant_id, role, created_at"),
        (supabase.from("profiles" as any) as any).select("id, display_name, full_name"),
        (supabase.from("service_fee_invoices" as any) as any).select("fee_cents, processing_fee_cents, status"),
        (supabase.from("message_threads" as any) as any).select("status, admin_unread"),
        (supabase.from("tenant_invites" as any) as any).select("uses, revoked_at"),
        (supabase.from("access_requests" as any) as any).select("status"),
      ]);
      if (cancelled) return;
      setPermits(((p.data ?? []) as PermitLite[]));
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
  }, []);


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
        name: userName.get(m.user_id) || `User ${m.user_id.slice(0, 8)}`,
        client: tenantName.get(m.tenant_id) ?? "—",
        role: m.role,
        joined: m.created_at,
        permits: permits.filter((p) => p.created_by === m.user_id).length,
      }))
      .sort((a, b) => b.permits - a.permits || a.name.localeCompare(b.name));
  }, [members, permits, userName, tenantName]);

  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="border-b border-obsidian/10 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-obsidian/50">Cleard Operations</span>
            <span className="border border-oxblood/30 bg-oxblood/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-oxblood">
              Admin · Staff Only
            </span>
          </div>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <h1 className="display-serif text-4xl sm:text-5xl text-obsidian">
              Operations <em>Desk</em>
            </h1>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-[3px]">
                <Link to="/admin/review-queue">Review queue</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-[3px]">
                <Link to="/admin/contractors">Contractor registry</Link>
              </Button>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-obsidian/60">
            Live portfolio across Palm Beach and the Treasure Coast — every client account, permit
            and invoiced fee, straight from the database.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Permits" value={String(activeCount)} sublabel={`${permits.length} total on file`} icon={<FolderOpen className="h-4 w-4" />} />
          <StatCard label="Corrections Pending" value={String(correctionsCount)} icon={<AlertTriangle className="h-4 w-4" />} accent="warn" />
          <StatCard label="Permits Issued" value={String(issuedCount)} icon={<Stamp className="h-4 w-4" />} accent="sky" />
          <StatCard label="Outstanding Fees" value={fmtMoneyWhole(outstandingFeesCents)} sublabel="Invoiced + overdue" icon={<DollarSign className="h-4 w-4" />} mono />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Client Companies" value={String(tenants.length)} sublabel={`${tenants.filter((t) => t.status === "active").length} active`} icon={<Building2 className="h-4 w-4" />} />
          <StatCard label="User Accounts" value={String(members.length)} sublabel="Across all clients" icon={<Users className="h-4 w-4" />} />
          <StatCard label="Open Conversations" value={String(openThreads)} sublabel={`${adminUnread} unread for staff`} icon={<MessageSquare className="h-4 w-4" />} />
          <StatCard label="Open Invites" value={String(invites.open)} sublabel={`${invites.accepted} accepted`} icon={<Mail className="h-4 w-4" />} />
          <StatCard label="Access Requests" value={String(accessRequests.pending)} sublabel={`${accessRequests.total} all time`} icon={<UserPlus className="h-4 w-4" />} accent="warn" />
          <StatCard label="Approved Permits" value={String(permits.filter((r) => r.status === "approved" || r.status === "permit_issued").length)} sublabel="Approved or issued" icon={<Stamp className="h-4 w-4" />} accent="sky" />
        </div>


        {/* Filters */}
        <div className="mt-10 flex flex-wrap items-end gap-4 border-b border-obsidian/10 pb-5">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
            <Filter className="h-3.5 w-3.5" />
            Filter Queue
          </div>
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian/40" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search project, permit no. or client…"
              className="h-10 rounded-[3px] border-obsidian/15 bg-white pl-9"
            />
          </div>
          <div className="min-w-[180px]">
            <Label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(statusMeta) as Status[]).map((s) => (
                  <SelectItem key={s} value={s}>{statusMeta[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[170px]">
            <Label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">County</Label>
            <Select value={countyFilter} onValueChange={(v) => setCountyFilter(v as typeof countyFilter)}>
              <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All counties</SelectItem>
                {COUNTIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[190px]">
            <Label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">Client</Label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clients</SelectItem>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
            {filtered.length} of {permits.length} permits
          </div>
        </div>

        {/* Permit queue */}
        <div className="mt-6 overflow-hidden border border-obsidian/15 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--obsidian)" }}>
                <tr>
                  <Th>Project</Th>
                  <Th>County</Th>
                  <Th align="right">Value</Th>
                  <Th>Status</Th>
                  <Th>Client</Th>
                  <Th>Age</Th>
                  <Th align="right"> </Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-obsidian/55">
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-obsidian/55">
                      No permits match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const meta = statusMeta[r.status as Status] ?? { label: r.status.replace(/_/g, " "), tone: "neutral" as const };
                    return (
                      <tr key={r.id} className="border-b border-obsidian/5 transition-colors hover:bg-paper-warm/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-obsidian">{r.project_name}</div>
                          <div className="mt-0.5 text-xs text-obsidian/55">{r.job_address}</div>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                            {r.permit_number ?? "—"} · filed {fmtDate(r.submitted_date ?? r.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-obsidian/75">{r.county ?? r.municipality ?? "—"}</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums text-obsidian">
                          {fmtMoneyWhole(Number(r.construction_value_cents ?? 0))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-obsidian/80">
                          {tenantName.get(r.tenant_id ?? "") ?? "—"}
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                            {userName.get(r.created_by ?? "") || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs tabular-nums text-obsidian/65">
                          {daysSince(r.submitted_date ?? r.created_at)}d
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/portal/permits/$id"
                            params={{ id: r.id }}
                            className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-sky transition-opacity hover:opacity-70"
                          >
                            Open <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clients + accounts */}
        <div className="mt-12 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="border border-obsidian/15 bg-white">
            <header className="border-b border-obsidian/10 px-5 py-4">
              <div className="eyebrow text-obsidian/50">Client Companies</div>
              <h2 className="display-serif mt-1 text-2xl text-obsidian">By permit volume</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-warm/60">
                  <tr>
                    <Th light>Client</Th>
                    <Th light align="right">Accounts</Th>
                    <Th light align="right">Permits</Th>
                    <Th light align="right">Active</Th>
                    <Th light align="right">Value</Th>
                  </tr>
                </thead>
                <tbody>
                  {clientRows.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-obsidian/50">No client companies yet.</td></tr>
                  ) : clientRows.map((c) => (
                    <tr key={c.id} className="border-b border-obsidian/5">
                      <td className="px-5 py-3">
                        <div className="text-obsidian">{c.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                          {c.status} · joined {fmtDate(c.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-obsidian/80">{c.accounts}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-obsidian/80">{c.permits}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-obsidian/80">{c.active}</td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-obsidian/80">{fmtMoneyWhole(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border border-obsidian/15 bg-white">
            <header className="border-b border-obsidian/10 px-5 py-4">
              <div className="eyebrow text-obsidian/50">User Accounts</div>
              <h2 className="display-serif mt-1 text-2xl text-obsidian">Permits added by user</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-warm/60">
                  <tr>
                    <Th light>Account</Th>
                    <Th light>Client</Th>
                    <Th light>Role</Th>
                    <Th light align="right">Permits</Th>
                  </tr>
                </thead>
                <tbody>
                  {accountRows.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-obsidian/50">No accounts yet.</td></tr>
                  ) : accountRows.map((a) => (
                    <tr key={a.user_id} className="border-b border-obsidian/5">
                      <td className="px-5 py-3">
                        <div className="text-obsidian">{a.name}</div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                          joined {fmtDate(a.joined)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-obsidian/75">{a.client}</td>
                      <td className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60">
                        {a.role.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3 text-right font-mono tabular-nums text-obsidian/80">{a.permits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}

/* ─────────── building blocks ─────────── */
function StatCard({
  label, value, sublabel, icon, accent, mono,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: "sky" | "warn";
  mono?: boolean;
}) {
  return (
    <div className="relative overflow-hidden p-5 text-paper" style={{ backgroundColor: "var(--obsidian)" }}>
      {accent && (
        <span
          aria-hidden
          className="absolute right-0 top-0 h-12 w-12"
          style={{
            background: accent === "sky"
              ? "linear-gradient(225deg, color-mix(in oklab, var(--sky) 35%, transparent), transparent 60%)"
              : "linear-gradient(225deg, color-mix(in oklab, var(--oxblood) 40%, transparent), transparent 60%)",
          }}
        />
      )}
      <div className="flex items-center gap-2 text-paper/55">
        <span className="text-paper/60">{icon}</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div
        className={`mt-4 text-paper ${mono ? "font-mono text-3xl tabular-nums" : "display-serif text-4xl"}`}
        style={accent === "sky" ? { color: "var(--sky)" } : undefined}
      >
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/45">{sublabel}</div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
  light,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  light?: boolean;
}) {
  return (
    <th
      className={`px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${
        light ? "text-obsidian/55" : "text-paper/60"
      }`}
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}
