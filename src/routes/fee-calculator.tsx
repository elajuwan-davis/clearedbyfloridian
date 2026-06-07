import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Calculator } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/fee-calculator")({
  head: () => ({ meta: [{ title: "Fee Calculator — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell>
      <ComingSoon
        icon={Calculator}
        eyebrow="Permit Fee Tools"
        title="Permit Fee Calculator"
        body="Verify the county charged you correctly under FL Statute 553.791(2)(b). Generate a formal contest letter when a private-provider discount is missing or misapplied."
      />
    </PortalShell>
  ),
});
