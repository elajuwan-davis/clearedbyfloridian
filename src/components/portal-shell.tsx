import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X, Building2, Check } from "lucide-react";
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
import { listAllTenantsFn } from "@/lib/tenants.functions";
import type { Alert } from "@/lib/expiration-alerts";

type AlertKey = "my-permits" | "request-coi" | "sub-insurance";
type NavLink = { to: string; label: string; alertKey?: AlertKey };
type NavGroup = { label: string; items: NavLink[] };

const navGroups: NavGroup[] = [
  {
    label: "Permits",
    items: [
      { to: "/portal/permits", label: "My Permits", alertKey: "my-permits" },
      { to: "/portal/permits/new", label: "New Permit" },
      { to: "/portal/submissions", label: "Submissions" },
      { to: "/portal/hoa-submittals", label: "HOA Submittals" },
    ],
  },
  {
    label: "Financials",
    items: [
      { to: "/portal/financials", label: "Overview" },
      { to: "/portal/permit-fees", label: "Permit Fees" },
      { to: "/fee-calculator", label: "Savings Calculator" },
      { to: "/portal/financials", label: "Before Cleard" },
    ],
  },
  {
    label: "Documents",
    items: [
      
      { to: "/portal/building-dept", label: "Building Departments" },
      { to: "/forms", label: "Forms" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/messages", label: "Messages" },
      { to: "/portal/reports", label: "Reports" },
      { to: "/portal/guides", label: "Project Guides" },
      { to: "/portal/blog", label: "Blog" },
      { to: "/portal/feature-requests", label: "Feature Requests" },
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
  label: "Settings",
  items: [
    { to: "/profile", label: "Profile" },
    { to: "/profile", label: "Notifications" },
    { to: "/portal/subcontractors", label: "Team" },
  ],
};

const subSettingsGroup: NavGroup = {
  label: "Settings",
  items: [{ to: "/profile", label: "Profile" }],
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

const mockUser = {
  full_name: "Elajuwan Davis",
  initials: "ED",
  role: "admin" as "builder" | "staff" | "admin",
};

const roleLabel: Record<typeof mockUser.role, string> = {
  builder: "Builder",
  staff: "Staff",
  admin: "Admin",
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

function isGroupActive(group: NavGroup, pathname: string) {
  return group.items.some(
    (it) => pathname === it.to || pathname.startsWith(it.to + "/"),
  );
}

function NavDropdown({
  group,
  pathname,
  alertKeys,
}: {
  group: NavGroup;
  pathname: string;
  alertKeys: Set<AlertKey>;
}) {
  const active = isGroupActive(group, pathname);
  const hasAlert = group.items.some((it) => it.alertKey && alertKeys.has(it.alertKey));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group relative flex items-center gap-1 px-3 h-14 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors outline-none"
        style={{ color: active ? "var(--obsidian)" : "color-mix(in oklab, var(--obsidian) 65%, transparent)" }}
      >
        <span>{group.label}</span>
        {hasAlert && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-500" />}
        <ChevronDown className="h-3 w-3 opacity-60 transition-transform group-data-[state=open]:rotate-180" strokeWidth={1.5} />
        <span
          aria-hidden
          className="absolute left-3 right-3 bottom-0 h-[2px] transition-opacity"
          style={{ backgroundColor: "var(--obsidian)", opacity: active ? 1 : 0 }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] rounded-[3px] p-1">
        {group.items.map((item, i) => {
          const itemActive = pathname === item.to || pathname.startsWith(item.to + "/");
          const alerted = item.alertKey ? alertKeys.has(item.alertKey) : false;
          return (
            <DropdownMenuItem key={`${item.to}-${i}`} asChild>
              <Link
                to={item.to as never}
                className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] rounded-[2px] cursor-pointer"
                style={{
                  color: itemActive ? "var(--obsidian)" : "color-mix(in oklab, var(--obsidian) 80%, transparent)",
                  fontWeight: itemActive ? 600 : 400,
                }}
              >
                <span>{item.label}</span>
                {alerted && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-500" />}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileDrawer({
  pathname,
  alertKeys,
  onNavigate,
  onSignOut,
  role,
}: {
  pathname: string;
  alertKeys: Set<AlertKey>;
  onNavigate: () => void;
  onSignOut: () => void;
  role: AppRole | null;
}) {
  const groups = navGroupsForRole(role);
  const settings = role === "subcontractor" ? subSettingsGroup : settingsGroup;
  const all = [...groups, settings];
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="h-14 flex items-center justify-between px-5 border-b">
        <Link to="/" onClick={onNavigate} className="wordmark text-2xl" style={{ color: "var(--obsidian)" }}>
          Cleard
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {all.map((group) => (
          <div key={group.label} className="mb-5">
            <div
              className="px-5 mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "color-mix(in oklab, var(--obsidian) 45%, transparent)" }}
            >
              {group.label}
            </div>
            {group.items.map((item, i) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const alerted = item.alertKey ? alertKeys.has(item.alertKey) : false;
              return (
                <Link
                  key={`${item.to}-${i}`}
                  to={item.to as never}
                  onClick={onNavigate}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-[14px]"
                  style={{
                    color: active ? "var(--obsidian)" : "color-mix(in oklab, var(--obsidian) 75%, transparent)",
                    fontWeight: active ? 600 : 400,
                    backgroundColor: active ? "color-mix(in oklab, var(--obsidian) 5%, transparent)" : "transparent",
                  }}
                >
                  <span>{item.label}</span>
                  {alerted && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 grid place-items-center font-mono text-[11px]"
            style={{ backgroundColor: "var(--obsidian)", color: "white", borderRadius: "3px" }}
          >
            {mockUser.initials}
          </div>
          <div className="leading-tight">
            <div className="text-[13px]" style={{ color: "var(--obsidian)" }}>{mockUser.full_name}</div>
            <div className="font-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}>
              {roleLabel[mockUser.role]}
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-mono uppercase tracking-[0.15em]"
          style={{ color: "var(--obsidian)" }}
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
      <header
        className="sticky top-0 z-40 h-14 bg-white border-b flex items-center px-4 sm:px-6 lg:px-8"
        style={{ borderColor: "color-mix(in oklab, var(--obsidian) 10%, transparent)" }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-baseline gap-2 leading-none shrink-0">
          <span className="wordmark text-2xl" style={{ color: "var(--obsidian)" }}>Cleard</span>
          <span
            className="hidden sm:inline font-mono text-[9px] tracking-[0.22em] uppercase"
            style={{ color: "color-mix(in oklab, var(--obsidian) 50%, transparent)" }}
          >
           
          </span>
        </Link>
        {session.tenantName && (
          <div
            className="hidden md:flex items-center ml-4 pl-4 border-l gap-2 min-w-0"
            style={{ borderColor: "color-mix(in oklab, var(--obsidian) 12%, transparent)" }}
          >
            <span
              className="font-mono text-[9px] tracking-[0.22em] uppercase"
              style={{ color: "color-mix(in oklab, var(--obsidian) 50%, transparent)" }}
            >
              {session.isAdmin ? "Cleard Admin" : "Tenant"}
            </span>
            <span
              className="text-[13px] truncate max-w-[220px]"
              style={{ color: "var(--obsidian)" }}
              title={session.tenantName}
            >
              {session.tenantName}
            </span>
          </div>
        )}

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center ml-8 h-14">
          {navGroupsForRole(session.role).map((g) => (
            <NavDropdown key={g.label} group={g} pathname={pathname} alertKeys={alertKeys} />
          ))}
        </nav>

        {/* Admin tenant switcher */}
        {session.isAdmin && <AdminTenantSwitcher />}

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          {/* Avatar / account menu (desktop) */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-[3px] hover:bg-secondary outline-none">
                <div
                  className="h-8 w-8 grid place-items-center font-mono text-[11px]"
                  style={{ backgroundColor: "var(--obsidian)", color: "white", borderRadius: "3px" }}
                >
                  {mockUser.initials}
                </div>
                <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px] rounded-[3px] p-1">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="text-[13px]" style={{ color: "var(--obsidian)" }}>{mockUser.full_name}</div>
                  <div className="font-mono text-[9px] tracking-[0.18em] uppercase mt-0.5" style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}>
                    {roleLabel[mockUser.role]}
                  </div>
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

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="lg:hidden p-2 rounded-[3px] hover:bg-secondary"
              aria-label="Open navigation"
            >
              {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-full sm:w-[360px] border-0">
              <SheetTitle className="sr-only">Portal navigation</SheetTitle>
              <MobileDrawer
                pathname={pathname}
                alertKeys={alertKeys}
                role={session.role}
                onNavigate={() => setOpen(false)}
                onSignOut={() => {
                  setOpen(false);
                  handleSignOut();
                }}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {session.isAdmin && session.impersonatingTenantName && (
        <div
          className="sticky top-14 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2 text-[12px]"
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

      <main className="min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {children}
      </main>

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
  const currentName = session.impersonatingTenantName ?? "All Tenants";

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
            Impersonate tenant
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setImpersonatedTenant(null)}
            className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center justify-between"
            style={{ color: "var(--obsidian)" }}
          >
            <span>All Tenants (admin view)</span>
            {!current && <Check className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!loaded && <div className="px-3 py-2 text-[12px] text-obsidian/50">Loading…</div>}
          {loaded && tenants.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-obsidian/50">No tenants yet.</div>
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
