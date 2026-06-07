import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { BookOpen } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/project-guides")({
  head: () => ({ meta: [{ title: "Project Guides — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell>
      <ComingSoon
        icon={BookOpen}
        eyebrow="Florida Permit Library"
        title="Project Guides"
        body="Florida-specific document and inspection requirements for every project type — pool construction, screen enclosures, additions, roof replacements, gas piping, and more."
      />
    </PortalShell>
  ),
});
