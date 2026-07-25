import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal-shell";
import { BlogEditor } from "@/components/blog-editor";

export const Route = createFileRoute("/portal/blog/new")({
  head: () => ({
    meta: [
      { title: "New Post — Cleard Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PortalShell>
      <BlogEditor />
    </PortalShell>
  ),
});
