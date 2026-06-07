import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; exact?: boolean };
const portalNav: NavItem[] = [
  { to: "/portal", label: "Overview", exact: true },
  { to: "/portal/projects", label: "Projects" },
  { to: "/portal/inspections", label: "Inspections" },
  { to: "/portal/new-permit", label: "Submit permit" },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr] bg-background">
      <aside className="border-r hairline md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="p-6 border-b hairline">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 border hairline bg-card flex items-center justify-center">
              <div className="absolute inset-1 border hairline opacity-60" />
              <span className="relative font-display text-base leading-none">F</span>
              <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-accent rounded-full" />
            </div>
            <div className="leading-none">
              <div className="font-display text-base">Flōridian</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
                Portal
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {portalNav.map((item) => {
            const isActive = item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={`flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t hairline space-y-3">
          <div className="rounded-sm border hairline bg-card p-3">
            <div className="label-eyebrow mb-2">Demo mode</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The portal is running on mock data. Enable Lovable Cloud to wire real
              accounts, database, and file uploads.
            </p>
          </div>
          <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center font-mono text-xs">
              JM
            </div>
            <div className="leading-tight">
              <div className="text-sm">J. Mendez</div>
              <div className="text-[11px] text-muted-foreground">Atlas Build Group</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-col min-h-screen">
        <header className="h-16 border-b hairline flex items-center justify-between px-8 sticky top-0 bg-background/85 backdrop-blur z-30">
          <div className="font-mono text-xs text-muted-foreground">
            {pathname}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Back to site</Link>
            </Button>
            <Button asChild size="sm" className="rounded-sm">
              <Link to="/portal/new-permit">+ New permit</Link>
            </Button>
          </div>
        </header>
        <div className="flex-1 px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
