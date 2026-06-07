import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { Sparkle } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/ask-victoria")({
  head: () => ({ meta: [{ title: "Ask Victoria — Cleared" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <PortalShell>
      <ComingSoon
        icon={Sparkle}
        eyebrow="AI Assistant"
        title="Ask Victoria"
        body="Your private-provider permitting assistant — scoped to FL Statute 553.791, Florida Building Code, county requirements, and your active projects. 50 questions per day."
      />
    </PortalShell>
  ),
});
