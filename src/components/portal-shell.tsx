import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X, Building2, Check, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { NotificationBell } from "@/components/notification-bell";
import { VictoriaWidget } from "@/components/victoria-widget";
import { useSession, setImpersonatedTenant, type AppRole } from "@/lib/use-session";
import { useMyIdentity } from "@/lib/profile-api";
import { listAllTenantsFn } from "@/lib/tenants.functions";
import type { Alert } from "@/lib/expiration-alerts";

type AlertKey = "my-permits" | "request-coi" | "sub-insurance";
type NavLink = { to: string; label: string; alertKey?: AlertKey };
type NavGroup = { label: string; items: NavLink[] };

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/portal/alerts", label: "Victoria Alerts" },
      { to: "/messages", label: "Messages" },
    ],
  },
  {
    label: "Permits",
    items: [
      { to: "/portal/permits", label: "My Permits", alertKey: "my-permits" },
      { to: "/portal/permits/new", label: "New Permit" },
      { to: "/portal/submissions", label: "Submissions" },
      { to: "/portal/inspections", label: "Inspections" },
      { to: "/portal/hoa-submittals", label: "HOA Submittals" },
      { to: "/portal/bid-review", label: "Bid Review" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/portal/contacts", label: "Contacts" },
      { to: "/forms/subcontractors", label: "Subcontractors" },
      { to: "/portal/compliance", label: "Compliance" },
      { to: "/portal/request-coi", label: "Request COI", alertKey: "request-coi" },
      { to: "/portal/request-sub-insurance", label: "Sub Insurance", alertKey: "sub-insurance" },
    ],
  },
  {
    label: "Financials",
    items: [
      { to: "/portal/financials", label: "Financial Overview" },
      { to: "/portal/permit-fees", label: "Permit Fees" },
      { to: "/invoices", label: "Invoices" },
      { to: "/fee-calculator", label: "Savings Calculator" },
    ],
  },
  {
    label: "Documents",
    items: [
      { to: "/forms", label: "Forms" },
      { to: "/portal/building-dept", label: "Building Departments" },
      { to: "/building-dept-logins", label: "Portal Logins" },
      { to: "/portal/notary-queue", label: "Notary Queue" },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/portal/guides", label: "Project Guides" },
      { to: "/municipalities", label: "Municipalities" },
      { to: "/ask-victoria", label: "Ask Victoria" },
      { to: "/portal/reports", label: "Reports" },
      { to: "/portal/blog", label: "Blog" },
      { to: "/portal/feature-requests", label: "Feature Requests" },
      { to: "/portal/marketplace", label: "Marketplace" },
    ],
  },
];

// Subs only see a slim nav — their attached projects + their own compliance uploads.
const subNavGroups: NavGroup[] = [
  {
    label: "Projects",
    items: [{ to: "/sub-portal", label: "My Projects" }],
  },
  {
    label: "Compliance",
    items: [{ to: "/profile", label: "Documents" }],
  },
];

function navGroupsForRole(role: AppRole | null): NavGroup[] {
  if (role === "subcontractor") return subNavGroups;
  return navGroups;
}

const settingsGroup: NavGroup = {
  label: "Account",
  items: [
    { to: "/profile", label: "Profile & Notifications" },
    { to: "/portal/contacts", label: "Contacts" },
  ],
};

const subSettingsGroup: NavGroup = {
  label: "Account",
  items: [{ to: "/profile", label: "Profile" }],
};

// Admin-only entries.
const adminGroup: NavGroup = {
  label: "Admin",
  items: [
    { to: "/admin", label: "Admin Dashboard" },
    { to: "/admin/invites", label: "Invite Pipeline" },
    { to: "/admin/review-queue", label: "Review Queue" },
    { to: "/admin/activity", label: "Activity Log" },
    { to: "/admin/access-requests", label: "Access Requests" },
    { to: "/admin/gc-clients", label: "GC Clients" },
  ],
};

const protectedPortalPrefixes = [
  "/dashboard",
  "/my-permits",
  "/messages",
  "/forms",
  "/invoices",
  "/profile",
  "/building-dept-logins",
  "/ask-victoria",
  "/project-guides",
  "/fee-calculator",
  "/insurance",
  "/admin",
  "/projects",
  "/portal",
  "/lpoa-signing",
];

function isProtectedPortalPath(pathname: string) {
  return protectedPortalPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const roleLabel: Record<string, string> = {
  admin: "Cleard Admin",
  gc_owner: "Account Owner",
  gc_member: "Team Member",
  subcontractor: "Subcontractor",
};

function computeAlertKeys(alerts: Alert[]): Set<AlertKey> {
  const set = new Set<AlertKey>();
  for (const a of alerts) {
    if (a.kind === "coi-expired") set.add("request-coi");
    if (a.kind === "coi-expiring") set.add("sub-insurance");
    if (a.kind === "license-expiring") set.add("my-permits");
  }
  return set;
}

function isItemActive(pathname: string, to: string) {
  if (to === "/portal") return pathname === "/portal" || pathname === "/portal/";
  return pathname === to || pathname.startsWith(to + "/");
}

/** Always-expanded vertical nav — every page visible, large tap targets. */
function SidebarNav({
  pathname,
  alertKeys,
  role,
  isAdmin,
  onNavigate,
}: {
  pathname: string;
  alertKeys: Set<AlertKey>;
  role: AppRole | null;
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  const groups = navGroupsForRole(role);
  const settings = role === "subcontractor" ? subSettingsGroup : settingsGroup;
  const all = [...groups, ...(isAdmin ? [adminGroup] : []), settings];
  return (
    <nav className="py-4">
      {all.map((group) => (
        <div key={group.label} className="mb-6">
          <div
            className="px-5 mb-2 font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: "color-mix(in oklab, var(--paper) 45%, transparent)" }}
          >
            {group.label}
          </div>
          <ul>
            {group.items.map((item, i) => {
              const active = isItemActive(pathname, item.to);
              const alerted = item.alertKey ? alertKeys.has(item.alertKey) : false;
              return (
                <li key={`${item.to}-${i}`}>
                  <Link
                    to={item.to as never}
                    onClick={onNavigate}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-[15px] transition-colors"
                    style={{
                      color: active
                        ? "var(--paper)"
                        : "color-mix(in oklab, var(--paper) 72%, transparent)",
                      fontFamily: "var(--font-subline)",
                      fontWeight: active ? 600 : 400,
                      backgroundColor: active
                        ? "color-mix(in oklab, var(--paper) 12%, transparent)"
                        : "transparent",
                      borderLeft: active ? "3px solid var(--sky)" : "3px solid transparent",
                    }}
                  >
                    <span className="truncate">{item.label}</span>
                    {alerted && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({
  pathname,
  alertKeys,
  role,
  isAdmin,
  displayName,
  email,
  initials,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  alertKeys: Set<AlertKey>;
  role: AppRole | null;
  isAdmin: boolean;
  displayName: string;
  email: string | null;
  initials: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--obsidian)" }}>
      <div
        className="h-16 flex items-center px-5 border-b shrink-0"
        style={{ borderColor: "color-mix(in oklab, var(--paper) 12%, transparent)" }}
      >
        <Link to="/" onClick={onNavigate} className="wordmark text-3xl" style={{ color: "var(--paper)" }}>
          Cleard
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav
          pathname={pathname}
          alertKeys={alertKeys}
          role={role}
          isAdmin={isAdmin}
          onNavigate={onNavigate}
        />
      </div>

      <div
        className="border-t p-4 shrink-0"
        style={{ borderColor: "color-mix(in oklab, var(--paper) 12%, transparent)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-10 w-10 shrink-0 grid place-items-center font-mono text-[12px]"
            style={{ backgroundColor: "var(--sky)", color: "var(--obsidian)", borderRadius: "3px" }}
          >
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14px]" style={{ color: "var(--paper)", fontFamily: "var(--font-subline)" }}>
              {displayName}
            </div>
            <div
              className="truncate font-mono text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
            >
              {roleLabel[role ?? ""] ?? "Client"}
            </div>
          </div>
        </div>
        {email && (
          <div
            className="mt-2 truncate text-[12px]"
            style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
          >
            {email}
          </div>
        )}
        <button
          onClick={onSignOut}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-mono uppercase tracking-[0.15em] rounded-[3px]"
          style={{
            color: "var(--paper)",
            border: "1px solid color-mix(in oklab, var(--paper) 25%, transparent)",
          }}
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "authed" | "anon">("checking");
  const signingOutRef = useRef(false);
  const session = useSession();
  const me = useMyIdentity();

  useEffect(() => {
    let cancelled = false;
    const shouldProtect = isProtectedPortalPath(pathname);

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        try { localStorage.removeItem("cleared_demo_session"); } catch { /* ignore */ }
        setAuthState("anon");
        if (shouldProtect && !signingOutRef.current) {
          navigate({ to: "/login", search: { next: pathname } as never, replace: true });
        }
      } else {
        setAuthState("authed");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        try { localStorage.removeItem("cleared_demo_session"); } catch { /* ignore */ }
        setAuthState("anon");
        if (shouldProtect && !signingOutRef.current) {
          navigate({ to: "/login", search: { next: pathname } as never, replace: true });
        }
      } else {
        setAuthState("authed");
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, pathname]);

  async function handleSignOut() {
    signingOutRef.current = true;
    try {
      localStorage.removeItem("cleared_demo_session");
      localStorage.removeItem("cleared_demo_user");
      localStorage.removeItem("cleared_demo_user_email");
    } catch { /* ignore */ }
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const alerts = useExpirationAlerts();
  const alertKeys = computeAlertKeys(alerts);
  const displayName = me.displayName || session.email || "Account";

  if (authState !== "authed") {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
          {authState === "checking" ? "Verifying session…" : "Redirecting to sign in…"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed left sidebar (desktop) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-[280px]">
        <SidebarBody
          pathname={pathname}
          alertKeys={alertKeys}
          role={session.role}
          isAdmin={session.isAdmin}
          displayName={displayName}
          email={session.email}
          initials={me.initials}
          onSignOut={handleSignOut}
        />
      </aside>

      <div className="lg:pl-[280px]">
        <header
          className="sticky top-0 z-30 h-16 bg-white border-b flex items-center gap-3 px-4 sm:px-6 lg:px-8"
          style={{ borderColor: "color-mix(in oklab, var(--obsidian) 10%, transparent)" }}
        >
          {/* Mobile hamburger + wordmark */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="lg:hidden p-2 rounded-[3px] hover:bg-secondary"
              aria-label="Open navigation"
            >
              {open ? <X className="h-6 w-6" strokeWidth={1.5} /> : <Menu className="h-6 w-6" strokeWidth={1.5} />}
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[300px] border-0">
              <SheetTitle className="sr-only">Portal navigation</SheetTitle>
              <SidebarBody
                pathname={pathname}
                alertKeys={alertKeys}
                role={session.role}
                isAdmin={session.isAdmin}
                displayName={displayName}
                email={session.email}
                initials={me.initials}
                onNavigate={() => setOpen(false)}
                onSignOut={() => {
                  setOpen(false);
                  handleSignOut();
                }}
              />
            </SheetContent>
          </Sheet>

          <Link to="/" className="lg:hidden wordmark text-2xl" style={{ color: "var(--obsidian)" }}>
            Cleard
          </Link>

          {session.tenantName && (
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <span
                className="font-mono text-[9px] tracking-[0.22em] uppercase"
                style={{ color: "color-mix(in oklab, var(--obsidian) 50%, transparent)" }}
              >
                {session.isAdmin ? "Cleard Admin" : "Client"}
              </span>
              <span
                className="text-[14px] truncate max-w-[260px]"
                style={{ color: "var(--obsidian)", fontFamily: "var(--font-subline)" }}
                title={session.tenantName}
              >
                {session.tenantName}
              </span>
            </div>
          )}

          {session.isAdmin && <AdminTenantSwitcher />}

          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 h-10 pl-1 pr-2 rounded-[3px] hover:bg-secondary outline-none">
                  <div
                    className="h-9 w-9 grid place-items-center font-mono text-[11px]"
                    style={{ backgroundColor: "var(--obsidian)", color: "white", borderRadius: "3px" }}
                  >
                    {me.initials}
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[240px] rounded-[3px] p-1">
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="text-[14px]" style={{ color: "var(--obsidian)", fontFamily: "var(--font-subline)" }}>
                      {displayName}
                    </div>
                    <div
                      className="font-mono text-[9px] tracking-[0.18em] uppercase mt-0.5"
                      style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}
                    >
                      {roleLabel[session.role ?? ""] ?? "Client"}
                    </div>
                    {session.email && (
                      <div className="mt-1 text-[12px] truncate" style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}>
                        {session.email}
                      </div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(session.role === "subcontractor" ? subSettingsGroup : settingsGroup).items.map((item, i) => (
                    <DropdownMenuItem key={`${item.to}-${i}`} asChild>
                      <Link to={item.to as never} className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer" style={{ color: "var(--obsidian)" }}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleSignOut()}
                    className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center gap-2"
                    style={{ color: "var(--obsidian)" }}
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {session.isAdmin && !session.impersonatingTenantName && (
          <div
            className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2 text-[12px]"
            style={{ backgroundColor: "var(--obsidian)", color: "white" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-70">Admin view</span>
              <span className="truncate opacity-90">
                {session.email ?? ""} — full access across all clients
              </span>
            </div>
            <Link
              to="/admin"
              className="font-mono text-[10px] tracking-[0.16em] uppercase underline underline-offset-2 hover:opacity-80"
            >
              Admin dashboard
            </Link>
          </div>
        )}

        {session.isAdmin && session.impersonatingTenantName && (
          <div
            className="sticky top-16 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2 text-[12px]"
            style={{ backgroundColor: "var(--obsidian)", color: "white" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-70">Viewing as</span>
              <span className="truncate">{session.impersonatingTenantName}</span>
            </div>
            <button
              onClick={() => setImpersonatedTenant(null)}
              className="font-mono text-[10px] tracking-[0.16em] uppercase underline underline-offset-2 hover:opacity-80"
            >
              Exit impersonation
            </button>
          </div>
        )}

        <main className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {children}
        </main>
      </div>

      <InternalOnlyVictoria />
    </div>
  );
}

function InternalOnlyVictoria() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const email = (localStorage.getItem("cleared_demo_user") || "").toLowerCase();
      setShow(email.endsWith("@floridianinc.com") || email === "user@cleared.com");
    } catch {
      setShow(false);
    }
  }, []);
  if (!show) return null;
  return <VictoriaWidget />;
}

function AdminTenantSwitcher() {
  const session = useSession();
  const list = useServerFn(listAllTenantsFn);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    list()
      .then((rows: any) => {
        if (cancelled) return;
        setTenants((rows ?? []).map((r: any) => ({ id: r.id, name: r.name })));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [list]);

  const current = session.impersonatingTenantId;
  const currentName = session.impersonatingTenantName ?? "All Clients";

  return (
    <div className="hidden md:block ml-4">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 h-9 px-3 border rounded-[3px] hover:bg-secondary outline-none"
          style={{ borderColor: "color-mix(in oklab, var(--obsidian) 15%, transparent)" }}
        >
          <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--obsidian)" }} />
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: "var(--obsidian)" }}>
            {currentName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[260px] max-h-[380px] overflow-y-auto rounded-[3px] p-1">
          <DropdownMenuLabel className="px-3 py-2 font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}>
            View as client
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setImpersonatedTenant(null)}
            className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center justify-between"
            style={{ color: "var(--obsidian)" }}
          >
            <span>All Clients (admin view)</span>
            {!current && <Check className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!loaded && <div className="px-3 py-2 text-[12px] text-obsidian/50">Loading…</div>}
          {loaded && tenants.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-obsidian/50">No clients yet.</div>
          )}
          {tenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => setImpersonatedTenant({ id: t.id, name: t.name })}
              className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center justify-between gap-3"
              style={{ color: "var(--obsidian)" }}
            >
              <span className="truncate">{t.name}</span>
              {current === t.id && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
