import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FolderOpen, ClipboardCheck, FilePlus2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const portalNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/portal/projects", label: "Projects", icon: FolderOpen },
  { to: "/portal/inspections", label: "Inspections", icon: ClipboardCheck },
  { to: "/portal/new-permit", label: "Submit permit", icon: FilePlus2 },
];

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

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Obsidian sidebar — fixed left, 256px */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden md:flex flex-col text-paper"
        style={{ width: "256px", backgroundColor: "var(--obsidian)" }}
      >
        {/* Wordmark */}
        <div
          className="px-6 py-6 border-b"
          style={{ borderColor: "color-mix(in oklab, var(--paper) 10%, transparent)" }}
        >
          <Link to="/" className="block leading-[1]">
            <div className="wordmark text-3xl text-paper">Cleared</div>
            <div
              className="wordmark-subline mt-1.5"
              style={{ color: "color-mix(in oklab, var(--paper) 55%, transparent)" }}
            >
              by Flōridian
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {portalNav.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.to
              : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className="group relative flex items-center gap-3 pl-5 pr-3 py-2.5 text-[13px] font-subline tracking-wide transition-colors"
                style={{
                  color: isActive
                    ? "var(--paper)"
                    : "color-mix(in oklab, var(--paper) 60%, transparent)",
                  backgroundColor: isActive
                    ? "color-mix(in oklab, var(--sky) 8%, transparent)"
                    : "transparent",
                }}
              >
                {/* Sky left border on active */}
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-[3px] transition-opacity"
                  style={{
                    backgroundColor: "var(--sky)",
                    opacity: isActive ? 1 : 0,
                  }}
                />
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
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
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-subline tracking-wide transition-colors"
            style={{
              color: "color-mix(in oklab, var(--paper) 65%, transparent)",
              borderRadius: "3px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "color-mix(in oklab, var(--paper) 8%, transparent)";
              e.currentTarget.style.color = "var(--paper)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color =
                "color-mix(in oklab, var(--paper) 65%, transparent)";
            }}
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:pl-[256px] min-h-screen flex flex-col">
        <header className="h-14 border-b hairline flex items-center justify-between px-8 sticky top-0 bg-background/85 backdrop-blur z-30">
          <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
            {pathname}
          </div>
        </header>
        <div className="flex-1 px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
