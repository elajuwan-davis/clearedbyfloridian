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

const railHairline = "color-mix(in oklab, var(--paper) 12%, transparent)";

/** Slim 64px icon rail with hover/click flyout panels (HubSpot-style). */
function IconRail({
  pathname,
  alertKeys,
  role,
  isAdmin,
  displayName,
  email,
  initials,
  onSignOut,
}: {
  pathname: string;
  alertKeys: Set<AlertKey>;
  role: AppRole | null;
  isAdmin: boolean;
  displayName: string;
  email: string | null;
  initials: string;
  onSignOut: () => void;
}) {
  const sections = sectionsForRole(role, isAdmin);
  const settings = settingsForRole(role);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Any navigation or route change dismisses the flyout.
  useEffect(() => {
    setOpenKey(null);
    setPinned(false);
  }, [pathname]);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenKey(null);
        setPinned(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  function scheduleClose() {
    if (pinned) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 180);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const allSections: NavSection[] = [...sections];
  const active = [...allSections, settings].find((s) => s.key === openKey) ?? null;

  return (
    <div className="relative h-full" onMouseLeave={scheduleClose}>
      <div
        className="flex h-full w-16 flex-col items-center"
        style={{ backgroundColor: "var(--obsidian)" }}
      >
        <Link
          to="/"
          className="wordmark grid h-16 w-16 shrink-0 place-items-center text-2xl"
          style={{ color: "var(--paper)", borderBottom: `1px solid ${railHairline}` }}
          title="Cleard home"
        >
          C
        </Link>

        <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-3">
          {allSections.map((s) => (
            <RailButton
              key={s.key}
              section={s}
              active={sectionActive(pathname, s)}
              alerted={sectionAlerted(s, alertKeys)}
              open={openKey === s.key}
              onEnter={() => {
                cancelClose();
                setOpenKey(s.items ? s.key : null);
              }}
              onClick={() => {
                if (!s.items) return;
                if (openKey === s.key && pinned) {
                  setOpenKey(null);
                  setPinned(false);
                } else {
                  setOpenKey(s.key);
                  setPinned(true);
                }
              }}
            />
          ))}
        </div>

        <div
          className="flex w-full shrink-0 flex-col items-center gap-1 py-3"
          style={{ borderTop: `1px solid ${railHairline}` }}
        >
          <RailButton
            section={settings}
            active={sectionActive(pathname, settings)}
            alerted={false}
            open={openKey === settings.key}
            onEnter={() => {
              cancelClose();
              setOpenKey(settings.key);
            }}
            onClick={() => {
              if (openKey === settings.key && pinned) {
                setOpenKey(null);
                setPinned(false);
              } else {
                setOpenKey(settings.key);
                setPinned(true);
              }
            }}
          />
          <div className="group relative">
            <Link
              to="/profile"
              onMouseEnter={() => {
                cancelClose();
                setOpenKey(null);
              }}
              className="grid h-10 w-10 place-items-center font-mono text-[11px]"
              style={{ backgroundColor: "var(--sky)", color: "var(--obsidian)", borderRadius: "8px" }}
              title={displayName}
            >
              {initials}
            </Link>
            <RailTooltip>{displayName}</RailTooltip>
          </div>
        </div>
      </div>

      {active?.items && (
        <div
          className="absolute left-16 top-0 z-50 w-64 border-r shadow-xl"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            backgroundColor: "var(--obsidian)",
            borderColor: railHairline,
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: `1px solid ${railHairline}` }}
          >
            <div
              className="text-[15px] font-semibold"
              style={{ color: "var(--paper)", fontFamily: "var(--font-subline)" }}
            >
              {active.label}
            </div>
          </div>
          <ul className="py-2">
            {active.items.map((item, i) => {
              const itemActive = isItemActive(pathname, item.to);
              const alerted = item.alertKey ? alertKeys.has(item.alertKey) : false;
              return (
                <li key={`${item.to}-${i}`}>
                  <Link
                    to={item.to as never}
                    onClick={() => {
                      setOpenKey(null);
                      setPinned(false);
                    }}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-[14px] transition-colors"
                    style={{
                      color: itemActive
                        ? "var(--paper)"
                        : "color-mix(in oklab, var(--paper) 72%, transparent)",
                      fontFamily: "var(--font-subline)",
                      fontWeight: itemActive ? 600 : 400,
                      backgroundColor: itemActive
                        ? "color-mix(in oklab, var(--paper) 12%, transparent)"
                        : "transparent",
                    }}
                  >
                    <span className="truncate">{item.label}</span>
                    {alerted && <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          {active.key === "settings" && (
            <div className="px-5 pb-4 pt-2" style={{ borderTop: `1px solid ${railHairline}` }}>
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em]"
                style={{
                  color: "var(--paper)",
                  border: `1px solid color-mix(in oklab, var(--paper) 25%, transparent)`,
                }}
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RailTooltip({ children }: { children: ReactNode }) {
  return (
    <span
      className="pointer-events-none absolute left-[52px] top-1/2 z-[60] hidden -translate-y-1/2 whitespace-nowrap rounded-[3px] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] group-hover:block"
      style={{ backgroundColor: "var(--paper)", color: "var(--obsidian)" }}
    >
      {children}
    </span>
  );
}

function RailButton({
  section,
  active,
  alerted,
  open,
  onEnter,
  onClick,
}: {
  section: NavSection;
  active: boolean;
  alerted: boolean;
  open: boolean;
  onEnter: () => void;
  onClick: () => void;
}) {
  const Icon = section.icon;
  const highlighted = active || open;
  const inner = (
    <>
      <Icon className="h-[19px] w-[19px]" strokeWidth={1.5} />
      {alerted && (
        <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      )}
    </>
  );
  const style = {
    color: highlighted ? "var(--obsidian)" : "color-mix(in oklab, var(--paper) 78%, transparent)",
    backgroundColor: highlighted ? "var(--sky)" : "transparent",
    borderRadius: "8px",
  } as const;

  return (
    <div className="group relative">
      {section.to ? (
        <Link
          to={section.to as never}
          onMouseEnter={onEnter}
          aria-label={section.label}
          className="relative grid h-11 w-11 place-items-center transition-colors"
          style={style}
        >
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          onMouseEnter={onEnter}
          onClick={onClick}
          aria-label={section.label}
          aria-expanded={open}
          className="relative grid h-11 w-11 place-items-center transition-colors"
          style={style}
        >
          {inner}
        </button>
      )}
      <RailTooltip>{section.label}</RailTooltip>
    </div>
  );
}

/** Expanded nav used inside the mobile drawer. */
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
  const sections = [...sectionsForRole(role, isAdmin), settingsForRole(role)];
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--obsidian)" }}>
      <div className="h-16 shrink-0 border-b px-5 flex items-center" style={{ borderColor: railHairline }}>
        <Link to="/" onClick={onNavigate} className="wordmark text-3xl" style={{ color: "var(--paper)" }}>
          Cleard
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((group) => (
          <div key={group.key} className="mb-6">
            <div
              className="mb-2 flex items-center gap-2 px-5 font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "color-mix(in oklab, var(--paper) 45%, transparent)" }}
            >
              <group.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {group.label}
            </div>
            <ul>
              {(group.items ?? [{ to: group.to as string, label: group.label }]).map((item, i) => {
                const itemActive = isItemActive(pathname, item.to);
                const alerted = "alertKey" in item && item.alertKey ? alertKeys.has(item.alertKey) : false;
                return (
                  <li key={`${item.to}-${i}`}>
                    <Link
                      to={item.to as never}
                      onClick={onNavigate}
                      className="flex items-center justify-between gap-3 px-5 py-2.5 text-[15px] transition-colors"
                      style={{
                        color: itemActive
                          ? "var(--paper)"
                          : "color-mix(in oklab, var(--paper) 72%, transparent)",
                        fontFamily: "var(--font-subline)",
                        fontWeight: itemActive ? 600 : 400,
                        backgroundColor: itemActive
                          ? "color-mix(in oklab, var(--paper) 12%, transparent)"
                          : "transparent",
                        borderLeft: itemActive ? "3px solid var(--sky)" : "3px solid transparent",
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
      </div>

      <div className="shrink-0 border-t p-4" style={{ borderColor: railHairline }}>
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center font-mono text-[12px]"
            style={{ backgroundColor: "var(--sky)", color: "var(--obsidian)", borderRadius: "3px" }}
          >
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14px]" style={{ color: "var(--paper)", fontFamily: "var(--font-subline)" }}>
              {displayName}
            </div>
            <div
              className="truncate font-mono text-[9px] uppercase tracking-[0.18em]"
              style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
            >
              {roleLabel[role ?? ""] ?? "Client"}
            </div>
          </div>
        </div>
        {email && (
          <div className="mt-2 truncate text-[12px]" style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}>
            {email}
          </div>
        )}
        <button
          onClick={onSignOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] px-3 py-2.5 font-mono text-[13px] uppercase tracking-[0.15em]"
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
                  {(settingsForRole(session.role).items ?? []).map((item, i) => (
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
