import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, ChevronLeft, LogOut, Menu, X, Building2, Check, ShieldCheck, Sun, Moon, FileText, MessageSquare, Calendar, Bell, Bookmark, BookmarkCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";

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

import { useBookmarks, normalizePath } from "@/lib/bookmarks-api";
import { VictoriaWidget } from "@/components/victoria-widget";
import { AskVictoriaDock } from "@/components/ask-victoria-dock";

import { useSession, setImpersonatedTenant, type AppRole } from "@/lib/use-session";
import { useMyIdentity } from "@/lib/profile-api";
import { listAllTenantsFn } from "@/lib/tenants.functions";
import type { Alert } from "@/lib/expiration-alerts";

import { SectionTabs } from "@/components/section-tabs";
import {
  sectionsForRole,
  settingsForRole,
  sidebarSettingsForRole,
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
 * Sidebar — HubSpot model.
 *
 * `rail`      → 56px icon rail. Hovering a group icon opens a flyout panel
 *               beside the rail listing that group's links. No scrollbars.
 * `expanded`  → 240px pinned nav with inline labels (toggle at the bottom).
 * `drawer`    → mobile sheet, always expanded.
 *
 * Navigation model is unchanged: same sections, same links, same order.
 */
function useNavSections(role: AppRole | null, isAdmin: boolean) {
  const { bookmarks, toggle } = useBookmarks();
  const sections = sectionsForRole(role, isAdmin);
  const settings = sidebarSettingsForRole(role);
  const marked = new Set(bookmarks.map((b) => normalizePath(b.path)));

  const allSections: NavSection[] = [...sections, settings]
    .map((s) =>
      s.key === "bookmarks"
        ? {
            ...s,
            to: undefined,
            items: bookmarks.map((b) => ({ to: b.path, label: b.label })),
          }
        : { ...s, items: s.items?.filter((i) => !marked.has(normalizePath(i.to))) },
    )
    // A group whose every link is bookmarked collapses out of the rail until
    // one of them is un-bookmarked.
    .filter((s) => Boolean(s.to) || (s.items?.length ?? 0) > 0);

  const isBookmarked = (to: string) => marked.has(normalizePath(to));
  return { allSections, isBookmarked, toggleBookmark: toggle };
}


/**
 * Rail flyout panel. Renders as a fixed card anchored to the hovered icon but
 * clamped so it never runs past the bottom of the window — tall menus (Admin)
 * shift upward instead of disappearing under the viewport edge.
 */
function RailFlyout({
  label,
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  label: string;
  children: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      const anchor = el.parentElement?.getBoundingClientRect();
      if (!anchor) return;
      const h = el.offsetHeight;
      const margin = 8;
      const top = Math.max(margin, Math.min(anchor.top - 6, window.innerHeight - h - margin));
      setPos({ top, left: anchor.right + 6 });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [children]);

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[212px] rounded-xl py-2"
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 62,
        maxHeight: "calc(100vh - 16px)",
        visibility: pos ? "visible" : "hidden",
        backgroundColor: "var(--rail-bg)",
        border: "1px solid var(--p-border)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="px-3 pb-1.5 text-[12px] font-semibold" style={{ color: "var(--rail-fg)" }}>
        {label}
      </div>
      <ul className="p-noscroll max-h-[calc(100vh-64px)] overflow-y-auto px-1.5">{children}</ul>
    </div>
  );
}


function NavLinkRow({
  to,
  label,
  active,
  alerted,
  onNavigate,
  bookmarked,
  onToggleBookmark,
}: {
  to: string;
  label: string;
  active: boolean;
  alerted?: boolean;
  onNavigate?: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
}) {
  return (
    <div className="group/nav relative flex items-center">
      <Link
        to={to as never}
        onClick={onNavigate}
        className="p-nav-item min-w-0 flex-1"
        data-active={active ? "true" : "false"}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {alerted && (
          <span
            aria-hidden
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--p-danger)" }}
          />
        )}
      </Link>
      {onToggleBookmark && (
        <button
          type="button"
          title={bookmarked ? "Remove from bookmarks" : "Bookmark this page"}
          aria-pressed={bookmarked ? "true" : "false"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark();
          }}
          className={cn(
            "absolute right-1 grid h-6 w-6 place-items-center rounded-md transition-opacity",
            bookmarked ? "opacity-100" : "opacity-0 group-hover/nav:opacity-100 focus:opacity-100",
          )}
          style={{ color: "var(--rail-icon)" }}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
          <span className="sr-only">
            {bookmarked ? "Remove from bookmarks" : "Bookmark this page"}
          </span>
        </button>
      )}
    </div>
  );
}


function SidebarNav({
  pathname,
  alertKeys,
  role,
  isAdmin,
  displayName,
  email,
  initials,
  mode,
  onToggleExpanded,
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
  mode: "rail" | "expanded" | "drawer";
  onToggleExpanded?: () => void;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const { allSections, isBookmarked, toggleBookmark } = useNavSections(role, isAdmin);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRail = mode === "rail";

  function openGroup(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      style={{ backgroundColor: "var(--rail-bg)", borderRight: "1px solid var(--p-border)" }}
      onMouseLeave={() => isRail && scheduleClose()}
    >
      <Link
        to="/"
        onClick={onNavigate}
        className={cn("flex h-12 shrink-0 items-center gap-2.5", isRail ? "justify-center px-0" : "px-3.5")}
        title="Cleard"
      >
        {isRail ? (
          <div
            className="grid h-7 w-7 shrink-0 place-items-center text-[13px] font-bold"
            style={{ background: "#2F4F4F", color: "#FAF3E6" }}
          >
            C
          </div>
        ) : (
          <span
            className="truncate text-[19px] font-bold tracking-[-0.03em]"
            style={{ color: "var(--rail-fg)" }}
          >
            Cleard
          </span>
        )}
      </Link>

      <nav
        className={cn(
          "p-noscroll min-h-0 flex-1",
          isRail ? "overflow-visible px-2 py-1" : "overflow-y-auto px-1.5 pb-2",
        )}
      >
        {allSections.map((group) => {
          const items = group.items ?? [{ to: group.to as string, label: group.label }];
          const groupActive = sectionActive(pathname, group);
          const groupAlerted = sectionAlerted(group, alertKeys);
          const GroupIcon = group.icon;

          if (isRail) {
            const single = !group.items && group.to;
            const body = (
              <span
                className="relative grid h-9 w-9 place-items-center rounded-lg transition-colors"
                style={{
                  backgroundColor:
                    groupActive || openKey === group.key ? "var(--rail-item-active-bg)" : "transparent",
                  color: groupActive ? "var(--rail-icon-active)" : "var(--rail-icon)",
                  boxShadow: groupActive ? "var(--rail-item-active-shadow)" : undefined,
                }}
              >
                <GroupIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {groupAlerted && (
                  <span
                    aria-hidden
                    className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "var(--p-danger)" }}
                  />
                )}
              </span>
            );
            const flyoutItems = group.items ?? [];
            return (
              <div
                key={group.key}
                className="relative flex justify-center py-[1px]"
                onMouseEnter={() => openGroup(group.key)}
                onFocus={() => openGroup(group.key)}
              >
                {single ? (
                  <Link to={group.to as never} onClick={onNavigate} title={group.label}>
                    {body}
                  </Link>
                ) : (
                  <button type="button" title={group.label} aria-label={group.label}>
                    {body}
                  </button>
                )}

                {/* Flyout — content-sized card, clamped inside the viewport (HubSpot style) */}
                {openKey === group.key && flyoutItems.length > 0 && (
                  <RailFlyout
                    label={group.label}
                    onMouseEnter={() => openGroup(group.key)}
                    onMouseLeave={scheduleClose}
                  >
                    {flyoutItems.map((item, i) => (
                      <li key={`${item.to}-${i}`}>
                        <NavLinkRow
                          to={item.to}
                          label={item.label}
                          active={isItemActive(pathname, item.to)}
                          alerted={item.alertKey ? alertKeys.has(item.alertKey) : false}
                          bookmarked={isBookmarked(item.to)}
                          onToggleBookmark={() => void toggleBookmark(item.to, item.label)}
                          onNavigate={() => {
                            setOpenKey(null);
                            onNavigate?.();
                          }}
                        />
                      </li>
                    ))}

                  </RailFlyout>
                )}

              </div>
            );
          }

          if (!group.items && group.to) {
            return (
              <Link
                key={group.key}
                to={group.to as never}
                onClick={onNavigate}
                className="flex items-center gap-2 text-[13px]"
                style={{
                  padding: "8px 16px",
                  borderRadius: 0,
                  backgroundColor: groupActive ? "var(--rail-item-active-bg)" : "transparent",
                  color: groupActive ? "var(--rail-fg)" : "var(--rail-muted)",
                  fontWeight: groupActive ? 600 : 400,
                }}
              >
                <GroupIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                {groupAlerted && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--p-danger)" }}
                  />
                )}
              </Link>
            );
          }

          return (
            <div key={group.key} className="mb-1">
              <div className="p-nav-group flex items-center gap-2">
                <GroupIcon className="h-3 w-3" strokeWidth={2} />
                {group.label}
                {groupAlerted && (
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "var(--p-danger)" }}
                  />
                )}
              </div>
              <ul>
                {items.map((item, i) => (
                  <li key={`${item.to}-${i}`}>
                    <NavLinkRow
                      to={item.to}
                      label={item.label}
                      active={isItemActive(pathname, item.to)}
                      alerted={"alertKey" in item && item.alertKey ? alertKeys.has(item.alertKey) : false}
                      bookmarked={isBookmarked(item.to)}
                      onToggleBookmark={() => void toggleBookmark(item.to, item.label)}
                      onNavigate={onNavigate}
                    />

                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>




      <div
        className={cn("shrink-0 py-2", isRail ? "px-2" : "px-3")}
        style={{ borderTop: "1px solid var(--p-border)" }}
      >
        <div className={cn("flex min-w-0 items-center gap-2.5", isRail && "justify-center")}>
          <Link
            to="/profile"
            onClick={onNavigate}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white"
            style={{ backgroundColor: "#1E3434" }}
            title={displayName}
          >
            {initials}
          </Link>
          {!isRail && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[13px] font-medium" style={{ color: "var(--rail-fg)" }}>
                  {displayName}
                </div>
                <div className="truncate text-[11px]" style={{ color: "var(--rail-muted)" }}>
                  {roleLabel[role ?? ""] ?? "Client"}
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out"
                aria-label="Sign out"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-[var(--rail-hover)]"
                style={{ color: "var(--rail-icon)" }}
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
        {!isRail && email && (
          <div className="mt-1.5 truncate pl-[42px] text-[11px]" style={{ color: "var(--rail-muted)" }}>
            {email}
          </div>
        )}

        {mode !== "drawer" && onToggleExpanded && (
          <button
            type="button"
            onClick={onToggleExpanded}
            title={isRail ? "Expand navigation" : "Collapse navigation"}
            aria-label={isRail ? "Expand navigation" : "Collapse navigation"}
            className={cn(
              "mt-2 flex h-8 items-center gap-2 rounded-lg text-[12px] hover:bg-[var(--rail-hover)]",
              isRail ? "w-full justify-center" : "w-full px-2",
            )}
            style={{ color: "var(--rail-icon)" }}
          >
            {isRail ? (
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                Collapse navigation
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


const InPortalShell = createContext(false);

export function PortalShell({ children }: { children: ReactNode }) {
  // Some pages wrap themselves in <PortalShell> while the /portal route layout
  // also does — render the chrome only once.
  if (useContext(InPortalShell)) return <>{children}</>;
  return (
    <InPortalShell.Provider value={true}>
      <PortalShellInner>{children}</PortalShellInner>
    </InPortalShell.Provider>
  );
}

function PortalShellInner({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(true);
  const [authState, setAuthState] = useState<"checking" | "authed" | "anon">("checking");

  // Restore the pinned/collapsed nav preference (HubSpot-style expand toggle).
  useEffect(() => {
    try {
      setRailExpanded(localStorage.getItem("cleard-nav-expanded") !== "0");
    } catch {
      /* storage unavailable */
    }
  }, []);
  function toggleRail() {
    setRailExpanded((v) => {
      const next = !v;
      try {
        localStorage.setItem("cleard-nav-expanded", next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }
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
      <div className="portal-ui dark grid min-h-screen place-items-center bg-background">
        <div className="text-[13px] text-muted-foreground">
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
    <div className="portal-ui dark min-h-screen bg-background">
      {/* Sidebar — 56px icon rail with flyouts, or 240px pinned (HubSpot model) */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden lg:block"
        style={{ width: railExpanded ? 200 : 56 }}
      >
        <SidebarNav
          pathname={pathname}
          alertKeys={alertKeys}
          role={session.role}
          isAdmin={session.isAdmin}
          displayName={displayName}
          email={session.email}
          initials={me.initials}
          mode={railExpanded ? "expanded" : "rail"}
          onToggleExpanded={toggleRail}
          onSignOut={handleSignOut}
        />
      </aside>

      <div className={railExpanded ? "lg:pl-[200px]" : "lg:pl-[56px]"}>
        <header
          className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b px-3 sm:px-4 lg:px-6"
          style={{ backgroundColor: "var(--p-topbar)", borderColor: "var(--p-border)" }}
        >
          {/* Mobile hamburger + wordmark */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="rounded-lg p-2 hover:bg-[var(--rail-hover)] lg:hidden"
              aria-label="Open navigation"
            >
              {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
            </SheetTrigger>
            <SheetContent side="left" className="portal-ui dark w-[268px] border-0 p-0">
              <SheetTitle className="sr-only">Portal navigation</SheetTitle>
              <SidebarNav
                pathname={pathname}
                alertKeys={alertKeys}
                role={session.role}
                isAdmin={session.isAdmin}
                displayName={displayName}
                email={session.email}
                initials={me.initials}
                mode="drawer"
                onNavigate={() => setOpen(false)}
                onSignOut={() => {
                  setOpen(false);
                  handleSignOut();
                }}
              />
            </SheetContent>
          </Sheet>

          <Link to="/" className="text-[15px] font-semibold lg:hidden" style={{ color: "var(--foreground)" }}>
            Cleard
          </Link>

          {/* Breadcrumb spine — same place on every page */}
          <div className="hidden min-w-0 items-center gap-1.5 text-[12px] md:flex">
            <span className="text-muted-foreground">
              {session.isAdmin ? "Cleard Operations" : "Workspace"}
            </span>
            {session.tenantName && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-40" strokeWidth={1.75} />
                <span className="max-w-[240px] truncate text-foreground" title={session.tenantName}>
                  {session.tenantName}
                </span>
              </>
            )}
          </div>

          {session.isAdmin && <AdminTenantSwitcher />}

          <div className="ml-auto flex items-center gap-1">
            {session.isAdmin && (
              <span className="p-chip p-chip-info hidden lg:inline-flex">
                <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                {session.impersonatingTenantName ? `Viewing as ${session.impersonatingTenantName}` : "Admin"}
              </span>
            )}
            {session.isAdmin && session.impersonatingTenantName && (
              <button
                onClick={() => setImpersonatedTenant(null)}
                className="p-btn p-btn-ghost h-8 px-2 text-[12px]"
              >
                Exit
              </button>
            )}
            <ThemeToggle />
            <BookmarkToggle />
            <NotificationBell />
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-lg px-1 outline-none hover:bg-[var(--rail-hover)]">
                  <div
                    className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-semibold"
                    style={{ backgroundColor: "#1E3434", color: "white" }}
                  >
                    {me.initials}
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50" strokeWidth={1.75} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[240px] rounded-xl p-1">
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>
                      {displayName}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                      {roleLabel[session.role ?? ""] ?? "Client"}
                    </div>
                    {session.email && (
                      <div className="mt-1 truncate text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        {session.email}
                      </div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(settingsForRole(session.role).items ?? []).map((item, i) => (
                    <DropdownMenuItem key={`${item.to}-${i}`} asChild>
                      <Link to={item.to as never} className="cursor-pointer rounded-lg px-3 py-2 text-[13px]" style={{ color: "var(--foreground)" }}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => handleSignOut()}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px]"
                    style={{ color: "var(--foreground)" }}
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <SectionTabs />

        <main className="min-h-[calc(100vh-3rem)] min-w-0 overflow-x-hidden pb-20 md:pb-0">
          {children}
        </main>

        <MobileBottomNav pathname={pathname} />
      </div>


      <AskVictoriaDock />
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
