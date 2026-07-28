import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { SubcontractorsManager } from "@/components/subcontractors-manager";

export const Route = createFileRoute("/forms/subcontractors")({
  head: () => ({
    meta: [
      { title: "Subcontractors — Cleard" },
      { name: "description", content: "Subcontractor library, compliance status, and public intake links." },
      { property: "og:title", content: "Subcontractors — Cleard" },
      { property: "og:description", content: "Subcontractor library, compliance status, and public intake links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PortalShell>
      <SubcontractorsManager />
    </PortalShell>
  ),
});
