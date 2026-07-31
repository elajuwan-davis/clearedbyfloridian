import { AdminOnly } from "@/components/admin-only";
import { createFileRoute } from "@tanstack/react-router";
import { BlogEditor } from "@/components/blog-editor";
import { isInternalUser } from "@/lib/is-internal-user";

export const Route = createFileRoute("/admin/blog/new")({
  head: () => ({
    meta: [
      { title: "New Post — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <NewPostPage />
    </AdminOnly>
  ),
});

function NewPostPage() {
  if (!isInternalUser()) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-obsidian/60">Restricted.</div>;
  }
  return <BlogEditor />;
}
