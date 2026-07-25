import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Client Portal — Cleard" },
      { name: "description", content: "Track permits, schedule inspections, and download reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PortalShell>
      <Outlet />
    </PortalShell>
  ),
});
