import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  MessageSquare,
  FileText,
  Receipt,
  Sparkle,
  BookOpen,
  Calculator,
  ShieldCheck,
  FileCheck2,
  ShieldAlert,
  Wallet,
  LogOut,
  Menu,
  User,
} from "lucide-react";


import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { NotificationBell } from "@/components/notification-bell";
import type { Alert } from "@/lib/expiration-alerts";

type AlertKey = "my-permits" | "request-coi" | "sub-insurance";
type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; alertKey?: AlertKey };
type NavSection = { label?: string; items: NavItem[] };

const portalNav: NavSection[] = [
  {
    items: [
      { to: "/portal", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Projects",
    items: [
      { to: "/portal/permits", label: "My Permits", icon: FileText, alertKey: "my-permits" },
      { to: "/portal/subcontractors", label: "Subcontractors", icon: User },
      { to: "/messages", label: "Messages", icon: MessageSquare },
      { to: "/project-guides", label: "Project Guides", icon: BookOpen },
      { to: "/portal/building-dept", label: "Building Dept", icon: Building2 },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/invoices", label: "Invoices", icon: Receipt },
      { to: "/portal/permit-fees", label: "Permit Fees", icon: Wallet },
      { to: "/fee-calculator", label: "Fee Calculator", icon: Calculator },
    ],
  },
  {
    label: "Insurance",
    items: [
      { to: "/portal/request-coi", label: "Request COI", icon: FileCheck2, alertKey: "request-coi" },
      { to: "/portal/request-sub-insurance", label: "Sub Insurance Request", icon: ShieldAlert, alertKey: "sub-insurance" },
      { to: "/insurance", label: "Get Insurance", icon: ShieldCheck },
    ],
  },
  {
    items: [
      { to: "/ask-victoria", label: "Ask Victoria", icon: Sparkle },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];


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
  return protectedPortalPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Mock until auth wired — shape matches profiles row
const mockUser = {
  full_name: "Elajuwan Davis",
  initials: "ED",
  role: "admin" as "builder" | "staff" | "admin",
  company_name: "Flōridian LLC",
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

function SidebarBody({
  pathname,
  onNavigate,
  onSignOut,
  collapsible = false,
  alertKeys,
}: {
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
  /** When true, the sidebar shows icons only until a `.sidebar-expanded` ancestor toggles labels in. */
  collapsible?: boolean;
  alertKeys: Set<AlertKey>;
}) {
  // When collapsible, labels/section headers are hidden by default and shown when
  // the .sidebar-expanded class is present on an ancestor (hover on desktop).
  const labelCls = collapsible
    ? "opacity-0 -translate-x-1 transition-all duration-200 whitespace-nowrap group-hover/sb:opacity-100 group-hover/sb:translate-x-0"
    : "whitespace-nowrap";
  const sectionLabelCls = collapsible
    ? "px-5 mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] h-3 overflow-hidden opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100"
    : "px-5 mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em]";

  return (
    <div className="flex h-full flex-col text-paper overflow-hidden" style={{ backgroundColor: "var(--obsidian)" }}>
      {/* Wordmark */}
      <div
        className="h-[73px] flex items-center px-5 border-b shrink-0"
        style={{ borderColor: "color-mix(in oklab, var(--paper) 10%, transparent)" }}
      >
        <Link to="/" onClick={onNavigate} className="block leading-[1] relative w-full h-8">
          {collapsible && (
            <div className="wordmark text-3xl text-paper absolute inset-0 flex items-center transition-opacity duration-200 group-hover/sb:opacity-0">
              C
            </div>
          )}
          <div
            className={
              collapsible
                ? "absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100"
                : ""
            }
          >
            <div className="wordmark text-3xl text-paper leading-none">Cleared</div>
            <div
              className="wordmark-subline mt-1"
              style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
            >
              by Flōridian
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-5 overflow-y-auto overflow-x-hidden">
        {portalNav.map((section, si) => (
          <div key={si} className={si === 0 ? "" : "mt-5"}>
            {section.label && <div className={sectionLabelCls} style={{ color: "color-mix(in oklab, var(--paper) 40%, transparent)" }}>{section.label}</div>}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(item.to + "/");
                const hasAlert = item.alertKey ? alertKeys.has(item.alertKey) : false;
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={onNavigate}
                    title={collapsible ? item.label : undefined}
                    className="group relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-[13px] font-subline tracking-wide transition-colors"
                    style={{
                      color: isActive ? "var(--paper)" : "color-mix(in oklab, var(--paper) 60%, transparent)",
                      backgroundColor: isActive
                        ? "color-mix(in oklab, var(--sky) 8%, transparent)"
                        : "transparent",
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-[3px] transition-opacity"
                      style={{ backgroundColor: "var(--sky)", opacity: isActive ? 1 : 0 }}
                    />
                    <span className="relative shrink-0">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      {hasAlert && (
                        <span
                          aria-hidden
                          className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2"
                          style={{ ["--tw-ring-color" as never]: "var(--obsidian)" }}
                        />
                      )}
                    </span>
                    <span className={labelCls}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className="px-3 py-4 border-t space-y-3 shrink-0"
        style={{ borderColor: "color-mix(in oklab, var(--paper) 10%, transparent)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 grid place-items-center font-mono text-[11px] shrink-0"
            style={{
              backgroundColor: "color-mix(in oklab, var(--paper) 12%, transparent)",
              color: "var(--paper)",
              borderRadius: "3px",
            }}
          >
            {mockUser.initials}
          </div>
          <div className={`leading-tight min-w-0 flex-1 ${labelCls}`}>
            <div className="text-[13px] text-paper truncate">{mockUser.full_name}</div>
            <div
              className="inline-block mt-0.5 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.18em] uppercase"
              style={{
                color: "var(--sky)",
                backgroundColor: "color-mix(in oklab, var(--sky) 10%, transparent)",
                border: "1px solid color-mix(in oklab, var(--sky) 25%, transparent)",
                borderRadius: "2px",
              }}
            >
              {roleLabel[mockUser.role]}
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          title={collapsible ? "Sign out" : undefined}
          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-subline tracking-wide transition-colors"
          style={{
            color: "color-mix(in oklab, var(--paper) 65%, transparent)",
            borderRadius: "3px",
          }}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          <span className={labelCls}>Sign out</span>
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

  useEffect(() => {
    let cancelled = false;
    const shouldProtect = isProtectedPortalPath(pathname);

    const hasDemo = (() => {
      try {
        return localStorage.getItem("cleared_demo_session") === "1";
      } catch {
        return false;
      }
    })();
    if (hasDemo) {
      setAuthState("authed");
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) {
        setAuthState("anon");
        if (shouldProtect && !signingOutRef.current) {
          navigate({ to: "/login", replace: true });
        }
      } else {
        setAuthState("authed");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthState("anon");
        if (shouldProtect && !signingOutRef.current) {
          navigate({ to: "/login", replace: true });
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
    } catch {
      /* ignore */
    }
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
      {/* Desktop sidebar — collapsed 64px, expands to 240px on hover */}
      <aside
        className="group/sb fixed inset-y-0 left-0 z-40 hidden md:flex flex-col transition-[width] duration-200 ease-out w-[64px] hover:w-[240px] hover:shadow-2xl"
      >
        <SidebarBody pathname={pathname} onSignOut={handleSignOut} collapsible alertKeys={alertKeys} />
      </aside>

      {/* Main column */}
      <div className="md:pl-[64px] min-h-screen flex flex-col">
        <header className="h-14 border-b hairline flex items-center justify-between gap-3 px-4 sm:px-6 md:px-8 sticky top-0 bg-background/85 backdrop-blur z-30">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                className="md:hidden -ml-2 p-2 rounded-[3px] hover:bg-secondary"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px] border-0">
                <SheetTitle className="sr-only">Portal navigation</SheetTitle>
                <SidebarBody
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                  onSignOut={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  alertKeys={alertKeys}
                />
              </SheetContent>
            </Sheet>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground truncate">
              {pathname}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {/* Mobile wordmark on right */}
            <Link to="/" className="md:hidden leading-[1] text-right">
              <div className="wordmark text-lg">Cleared</div>
            </Link>
          </div>
        </header>
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-10">{children}</div>
      </div>
    </div>
  );
}
