import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { PageShell } from "@/components/ui-kit";
import { AdminUtilityLocatesView } from "@/components/admin-utility-locates-view";
import { AdminProtectionView } from "@/components/admin-protection-view";

export const Route = createFileRoute("/portal/utility-locates")({
  head: () => ({
    meta: [
      { title: "Utility Locates & Protection — Cleard" },
      {
        name: "description",
        content:
          "811 dig safe locate requests plus notices to owner and lien rights across your active projects.",
      },
      { property: "og:title", content: "Utility Locates & Protection — Cleard" },
      {
        property: "og:description",
        content:
          "811 dig safe locate requests plus notices to owner and lien rights across your active projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UtilityLocatesPage,
});

type Tab = "locates" | "notices";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "locates", label: "Utility Locates" },
  { key: "notices", label: "Protection" },
];

function UtilityLocatesPage() {
  const [tab, setTab] = useState<Tab>("locates");

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Permits" }]}
        title="Utility Locates & Protection"
        meta={tab === "locates" ? "811 dig safe requests" : "Preliminary notices & lien rights"}
        toolbar={
          <div className="p-seg" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                data-active={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        {tab === "locates" ? <AdminUtilityLocatesView /> : <AdminProtectionView />}
      </PageShell>
    </PortalShell>
  );
}
