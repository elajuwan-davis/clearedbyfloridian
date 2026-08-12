import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { PageShell } from "@/components/ui-kit";
import { AdminProtectionView } from "@/components/admin-protection-view";
import { AdminUtilityLocatesView } from "@/components/admin-utility-locates-view";

export const Route = createFileRoute("/admin/protection")({
  head: () => ({
    meta: [
      { title: "Protection · Admin — Cleard" },
      { name: "description", content: "Preliminary notices, lien rights and 811 utility locate requests." },
      { property: "og:title", content: "Protection · Admin — Cleard" },
      { property: "og:description", content: "Preliminary notices, lien rights and 811 utility locate requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProtectionPage,
});

type Tab = "notices" | "locates";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "notices", label: "Protection" },
  { key: "locates", label: "Utility Locates" },
];

function ProtectionPage() {
  const [tab, setTab] = useState<Tab>("notices");

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="Protection"
        meta={tab === "notices" ? "Preliminary notices & lien rights" : "811 dig safe requests"}
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
        {tab === "notices" ? <AdminProtectionView /> : <AdminUtilityLocatesView />}
      </PageShell>
    </PortalShell>
  );
}
