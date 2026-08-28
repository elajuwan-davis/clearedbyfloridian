import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { PageShell } from "@/components/ui-kit";
import { AdminInvitePipelineView } from "@/components/admin-invite-pipeline-view";
import { AdminAccessRequestsView } from "@/components/admin-access-requests-view";
import { AdminReviewQueueView } from "@/components/admin-review-queue-view";
import { AdminTenantPlansView } from "@/components/admin-tenant-plans-view";

export const Route = createFileRoute("/admin/invites")({
  head: () => ({
    meta: [
      { title: "Invite Pipeline · Admin — Cleard" },
      { name: "description", content: "Access requests, invites and the self-submitted permit review queue in one place." },
      { property: "og:title", content: "Invite Pipeline · Admin — Cleard" },
      { property: "og:description", content: "Access requests, invites and the self-submitted permit review queue in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePipelinePage,
});

type Tab = "pipeline" | "requests" | "review" | "plans";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "pipeline", label: "Invite Pipeline" },
  { key: "requests", label: "Access Requests" },
  { key: "review", label: "Review Queue" },
  { key: "plans", label: "Plans" },
];

const META: Record<Tab, string> = {
  pipeline: "Invite → signup → first permits",
  requests: "Approve or reject inbound access",
  review: "Client self-submitted permits",
  plans: "Trial or full access, per tenant",
};

function InvitePipelinePage() {
  const [tab, setTab] = useState<Tab>("pipeline");

  return (
    <PortalShell>
      <PageShell
        crumbs={[{ label: "Admin" }]}
        title="Invite Pipeline"
        meta={META[tab]}
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
        {tab === "pipeline" ? (
          <AdminInvitePipelineView />
        ) : tab === "requests" ? (
          <AdminAccessRequestsView />
        ) : tab === "review" ? (
          <AdminReviewQueueView />
        ) : (
          <AdminTenantPlansView />
        )}
      </PageShell>
    </PortalShell>
  );
}
