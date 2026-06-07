import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/forms")({
  head: () => ({ meta: [{ title: "Forms — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell>
      <ComingSoon
        icon={FileText}
        eyebrow="Form Submissions"
        title="Forms"
        body="Permit Intake, Subcontractor Intake, and Payment Authorization — multi-step forms with signature capture, drag-and-drop uploads, and saved drafts."
      />
    </PortalShell>
  ),
});
