import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { PageShell } from "@/components/ui-kit";
import { AdminUtilityLocatesView } from "@/components/admin-utility-locates-view";

export const Route = createFileRoute("/portal/utility-locates")({
  head: () => ({
    meta: [
      { title: "Utility Locates — Cleard" },
      { name: "description", content: "811 dig safe locate requests across your active projects." },
      { property: "og:title", content: "Utility Locates — Cleard" },
      { property: "og:description", content: "811 dig safe locate requests across your active projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UtilityLocatesPage,
});

function UtilityLocatesPage() {
  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Permits" }]}
        title="Utility Locates"
        meta="811 dig safe requests"
      >
        <AdminUtilityLocatesView />
      </PageShell>
    </PortalShell>
  );
}
