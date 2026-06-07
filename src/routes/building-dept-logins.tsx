import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Building2 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/building-dept-logins")({
  head: () => ({ meta: [{ title: "Building Dept Logins — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell>
      <ComingSoon
        icon={Building2}
        eyebrow="Credentials Vault"
        title="Building Department Logins"
        body="Access and manage your building department portal credentials. AI extracts expiration dates and policy numbers from uploaded COI, WC, occupational, and BTR documents."
      />
    </PortalShell>
  ),
});
