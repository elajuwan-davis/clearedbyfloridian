import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { useSession } from "@/lib/use-session";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BuilderDashboard } from "@/components/builder-dashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const session = useSession();

  if (session.loading) {
    return (
      <PortalShell>
        <div className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Loading dashboard…
        </div>
      </PortalShell>
    );
  }

  // Admins see the full operations desk (all clients, permits, accounts, invites).
  // Everyone else sees only their own permits.
  return session.isAdmin ? <AdminDashboard /> : <BuilderDashboard />;
}
