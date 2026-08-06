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
import { projectStatusMeta, type ProjectStatus as Status } from "@/lib/status-badges";
import { useMyIdentity, greetingForNow } from "@/lib/profile-api";
import {
  PageHeader,
  Surface,
  SectionHeader,
  StatTile,
  StatusChip,
  TableShell,
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
        (supabase.from("profiles" as any) as any).select("id, email, display_name, full_name"),
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

