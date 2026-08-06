import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X, Building2, Check, ShieldCheck, Sun, Moon, FileText, MessageSquare, Calendar, Bell } from "lucide-react";
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
import { BookmarkToggle } from "@/components/bookmark-toggle";
import { AdminOnly } from "@/components/admin-only";

import { useBookmarks } from "@/lib/bookmarks-api";
import { VictoriaWidget } from "@/components/victoria-widget";
import { useSession, setImpersonatedTenant, type AppRole } from "@/lib/use-session";
import { useMyIdentity } from "@/lib/profile-api";
import { listAllTenantsFn } from "@/lib/tenants.functions";
import type { Alert } from "@/lib/expiration-alerts";

import {
  sectionsForRole,
  settingsForRole,
  isItemActive,
  type AlertKey,
  type NavSection,
} from "@/lib/portal-nav";

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

function sectionActive(pathname: string, section: NavSection) {
  if (section.to) return isItemActive(pathname, section.to);
  return (section.items ?? []).some((i) => isItemActive(pathname, i.to));
}

function sectionAlerted(section: NavSection, alertKeys: Set<AlertKey>) {
  return (section.items ?? []).some((i) => i.alertKey && alertKeys.has(i.alertKey));
}

/**
 * Sidebar — Cleard Design System v1.0.
 * 68px collapsed, 248px on hover. Grouped sections, hidden scrollbars,
 * one active treatment (lighter background + left accent + bold text).
 * Navigation model is unchanged: every section and link is the same.
 */
function SidebarNav({
  pathname,
  alertKeys,
  role,
  isAdmin,
  displayName,
  email,
  initials,
  expanded,
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
  /** Always-expanded (mobile drawer); desktop expands on hover instead. */
  expanded?: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const { bookmarks } = useBookmarks();
  const sections = sectionsForRole(role, isAdmin);
  const settings = settingsForRole(role);

  const allSections: NavSection[] = [
    ...sections.map((s) =>
      s.key === "bookmarks" && bookmarks.length > 0
        ? {
            ...s,
            to: undefined,
            items: [
              ...bookmarks.map((b) => ({ to: b.path, label: b.label })),
              { to: "/portal/bookmarks", label: "Manage bookmarks" },
            ],
          }
        : s,
    ),
    settings,
  ];

  const show = expanded ? "opacity-100" : "opacity-0 group-hover/rail:opacity-100";

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ backgroundColor: "var(--rail-bg)", borderRight: "1px solid var(--p-border)" }}
    >
      <Link
        to="/"
        onClick={onNavigate}
        className="flex h-14 shrink-0 items-center gap-2.5 px-[18px]"
        title="Cleard"
      >
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#3B82F6 0%,#60A5FA 100%)" }}
        >
          C
        </div>
        <span
          className={cn(
            "truncate text-[15px] font-semibold tracking-[-0.01em] transition-opacity duration-150",
            show,
          )}
          style={{ color: "var(--rail-fg)" }}
        >
          Cleard
        </span>
      </Link>

      <nav className="p-noscroll min-h-0 flex-1 overflow-y-auto pb-3">
        {allSections.map((group) => {
          const items = group.items ?? [{ to: group.to as string, label: group.label }];
          const groupActive = sectionActive(pathname, group);
          const groupAlerted = sectionAlerted(group, alertKeys);
          const GroupIcon = group.icon;
          return (
            <div key={group.key} className="mb-0.5">
              {/* Collapsed: the group icon is the visible affordance. Expanded: a label. */}
              <div className="relative flex h-9 items-center">
                <span
                  className={cn(
                    "absolute left-0 grid h-9 w-[68px] place-items-center transition-opacity duration-150",
                    expanded ? "opacity-0" : "opacity-100 group-hover/rail:opacity-0",
                  )}
                >
                  <span
                    className="relative grid h-8 w-8 place-items-center rounded-lg"
                    style={{
                      backgroundColor: groupActive ? "rgba(255,255,255,0.08)" : "transparent",
                      color: groupActive ? "#60A5FA" : "rgba(249,250,251,0.55)",
                    }}
                  >
                    <GroupIcon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                    {groupAlerted && (
                      <span
                        aria-hidden
                        className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: "var(--p-danger)" }}
                      />
                    )}
                  </span>
                </span>
                <span
                  className={cn(
                    "p-nav-group flex items-center gap-2 transition-opacity duration-150",
                    show,
                  )}
                >
                  <GroupIcon className="h-3 w-3" strokeWidth={2} />
                  {group.label}
                </span>
              </div>

              <ul
                className={cn(
                  "transition-opacity duration-150",
                  expanded ? "opacity-100" : "pointer-events-none opacity-0 group-hover/rail:pointer-events-auto group-hover/rail:opacity-100",
                )}
              >
                {items.map((item, i) => {
                  const itemActive = isItemActive(pathname, item.to);
                  const alerted =
                    "alertKey" in item && item.alertKey ? alertKeys.has(item.alertKey) : false;
                  return (
                    <li key={`${item.to}-${i}`}>
                      <Link
                        to={item.to as never}
                        onClick={onNavigate}
                        className="p-nav-item"
                        data-active={itemActive ? "true" : "false"}
                      >
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {alerted && (
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: "var(--p-danger)" }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div
        className="shrink-0 px-[14px] py-3"
        style={{ borderTop: "1px solid var(--p-border)" }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/profile"
            onClick={onNavigate}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white"
            style={{ backgroundColor: "#1F2937" }}
            title={displayName}
          >
            {initials}
          </Link>
          <div className={cn("min-w-0 flex-1 leading-tight transition-opacity duration-150", show)}>
            <div className="truncate text-[13px] font-medium" style={{ color: "var(--rail-fg)" }}>
              {displayName}
            </div>
            <div className="truncate text-[11px]" style={{ color: "rgba(249,250,251,0.45)" }}>
              {roleLabel[role ?? ""] ?? "Client"}
            </div>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-opacity duration-150 hover:bg-white/5",
              show,
            )}
            style={{ color: "rgba(249,250,251,0.55)" }}
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
        {email && (
          <div
            className={cn("mt-1.5 truncate pl-[42px] text-[11px] transition-opacity duration-150", show)}
            style={{ color: "rgba(249,250,251,0.35)" }}
          >
            {email}
          </div>
        )}
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

  // Admin-only area: non-staff never see staff tooling, even by typing a URL.
  // (Data itself is already blocked server-side by RLS + admin assertions.)
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminPath && !session.loading && !session.isAdmin) {
    return <AdminOnly>{children}</AdminOnly>;
  }


  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Fixed icon rail (desktop) */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-16">
        <IconRail
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

      <div className="lg:pl-16">
        <header
          className="sticky top-0 z-30 h-16 border-b flex items-center gap-3 px-4 sm:px-6 lg:px-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
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

          <Link to="/" className="lg:hidden wordmark text-2xl" style={{ color: "var(--foreground)" }}>
            Cleard
          </Link>

          {session.tenantName && (
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <span
                className="font-mono text-[9px] tracking-[0.22em] uppercase"
                style={{ color: "var(--muted-foreground)" }}
              >
                {session.isAdmin ? "Cleard Admin" : "Client"}
              </span>
              <span
                className="text-[14px] truncate max-w-[260px]"
                style={{ color: "var(--foreground)", fontFamily: "var(--font-subline)" }}
                title={session.tenantName}
              >
                {session.tenantName}
              </span>
            </div>
          )}

          {session.isAdmin && <AdminTenantSwitcher />}

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <BookmarkToggle />
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
                    <div className="text-[14px]" style={{ color: "var(--foreground)", fontFamily: "var(--font-subline)" }}>
                      {displayName}
                    </div>
                    <div
                      className="font-mono text-[9px] tracking-[0.18em] uppercase mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {roleLabel[session.role ?? ""] ?? "Client"}
                    </div>
                    {session.email && (
                      <div className="mt-1 text-[12px] truncate" style={{ color: "var(--muted-foreground)" }}>
                        {session.email}
                      </div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(settingsForRole(session.role).items ?? []).map((item, i) => (
                    <DropdownMenuItem key={`${item.to}-${i}`} asChild>
                      <Link to={item.to as never} className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer" style={{ color: "var(--foreground)" }}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleSignOut()}
                    className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center gap-2"
                    style={{ color: "var(--foreground)" }}
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
              to="/dashboard"
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

        <main className="min-h-[calc(100vh-4rem)] min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 md:pb-10">
          {children}
        </main>

        <MobileBottomNav pathname={pathname} />
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
          style={{ borderColor: "var(--border)" }}
        >
          <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} style={{ color: "var(--foreground)" }} />
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase" style={{ color: "var(--foreground)" }}>
            {currentName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" strokeWidth={1.5} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[260px] max-h-[380px] overflow-y-auto rounded-[3px] p-1">
          <DropdownMenuLabel className="px-3 py-2 font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--muted-foreground)" }}>
            View as client
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setImpersonatedTenant(null)}
            className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center justify-between"
            style={{ color: "var(--foreground)" }}
          >
            <span>All Clients (admin view)</span>
            {!current && <Check className="h-3.5 w-3.5" strokeWidth={1.5} />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!loaded && <div className="px-3 py-2 text-[12px] text-muted-foreground">Loading…</div>}
          {loaded && tenants.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-muted-foreground">No clients yet.</div>
          )}
          {tenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => setImpersonatedTenant({ id: t.id, name: t.name })}
              className="px-3 py-2 text-[13px] rounded-[2px] cursor-pointer flex items-center justify-between gap-3"
              style={{ color: "var(--foreground)" }}
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

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cleard-theme", next ? "dark" : "light");
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid place-items-center h-9 w-9 rounded-md border transition-colors hover:bg-secondary"
      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
    </button>
  );
}

const MOBILE_NAV_ITEMS: Array<{ to: string; label: string; icon: typeof FileText; match: (p: string) => boolean }> = [
  { to: "/portal/permits", label: "My Permits", icon: FileText, match: (p) => p === "/portal/permits" || p.startsWith("/portal/permits/") || p.startsWith("/my-permits") },
  { to: "/messages", label: "Messages", icon: MessageSquare, match: (p) => p.startsWith("/messages") },
  { to: "/portal/calendar", label: "Calendar", icon: Calendar, match: (p) => p.startsWith("/portal/calendar") },
  { to: "/portal/alerts", label: "Alerts", icon: Bell, match: (p) => p.startsWith("/portal/alerts") },
];

/** Fixed bottom tab bar for phones (< md). Mirrors the desktop rail's top-level destinations. */
function MobileBottomNav({ pathname }: { pathname: string }) {
  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to as never}
              className="flex flex-col items-center justify-center gap-1 min-h-[56px] min-w-[44px] py-1.5"
              style={{ color: active ? "var(--sky)" : "var(--muted-foreground)" }}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              <span
                className="font-mono text-[9px] uppercase tracking-[0.08em] leading-none"
                style={{ fontWeight: active ? 700 : 400 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
