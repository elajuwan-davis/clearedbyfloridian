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

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavSection = { label?: string; items: NavItem[] };

const portalNav: NavSection[] = [
  {
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Projects",
    items: [
      { to: "/my-permits", label: "My Permits", icon: FolderOpen },
      { to: "/portal/subcontractors", label: "Subcontractors", icon: User },
      { to: "/messages", label: "Messages", icon: MessageSquare },
      { to: "/project-guides", label: "Project Guides", icon: BookOpen },
      { to: "/building-dept-logins", label: "Building Dept", icon: Building2 },
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
      { to: "/portal/request-coi", label: "Request COI", icon: FileCheck2 },
      { to: "/portal/request-sub-insurance", label: "Request Sub Insurance Update", icon: ShieldAlert },
      { to: "/insurance", label: "Get Insurance", icon: ShieldCheck },
    ],
  },
  {
    items: [
      { to: "/ask-victoria", label: "Ask Victoria", icon: Sparkle },
      { to: "/forms", label: "Forms", icon: FileText },
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
  full_name: "J. Mendez",
  initials: "JM",
  role: "builder" as "builder" | "staff" | "admin",
  company_name: "Coastline Builders Group",
};

const roleLabel: Record<typeof mockUser.role, string> = {
  builder: "Builder",
  staff: "Staff",
  admin: "Admin",
};

function SidebarBody({
  pathname,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col text-paper" style={{ backgroundColor: "var(--obsidian)" }}>
      {/* Wordmark */}
      <div
        className="px-6 py-6 border-b"
        style={{ borderColor: "color-mix(in oklab, var(--paper) 10%, transparent)" }}
      >
        <Link to="/" onClick={onNavigate} className="block leading-[1]">
          <div className="wordmark text-3xl text-paper">Cleared</div>
          <div
            className="wordmark-subline mt-1.5"
            style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
          >
            by Flōridian
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {portalNav.map((section, si) => (
          <div key={si} className={si === 0 ? "" : "mt-5"}>
            {section.label && (
              <div
                className="px-5 mb-1.5 font-mono text-[9px] uppercase tracking-[0.22em]"
                style={{ color: "color-mix(in oklab, var(--paper) 40%, transparent)" }}
              >
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.to
                  : pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={onNavigate}
                    className="group relative flex items-center gap-3 pl-5 pr-3 py-2.5 text-[13px] font-subline tracking-wide transition-colors"
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
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>


      <div
        className="px-4 py-4 border-t space-y-3"
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
          <div className="leading-tight min-w-0 flex-1">
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
          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-subline tracking-wide transition-colors"
          style={{
            color: "color-mix(in oklab, var(--paper) 65%, transparent)",
            borderRadius: "3px",
          }}
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Sign out</span>
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
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden md:flex flex-col"
        style={{ width: "256px" }}
      >
        <SidebarBody pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* Main column */}
      <div className="md:pl-[256px] min-h-screen flex flex-col">
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
                />
              </SheetContent>
            </Sheet>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground truncate">
              {pathname}
            </div>
          </div>
          {/* Mobile wordmark on right */}
          <Link to="/" className="md:hidden leading-[1] text-right">
            <div className="wordmark text-lg">Cleared</div>
          </Link>
        </header>
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-10">{children}</div>
      </div>
    </div>
  );
}
