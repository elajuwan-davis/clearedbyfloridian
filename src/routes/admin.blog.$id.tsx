import { AdminOnly } from "@/components/admin-only";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BlogEditor } from "@/components/blog-editor";
import { getPost } from "@/lib/blog-api";
import { isInternalUser } from "@/lib/is-internal-user";

export const Route = createFileRoute("/admin/blog/$id")({
  head: () => ({
    meta: [
      { title: "Edit Post — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <EditPostPage />
    </AdminOnly>
  ),
});

function EditPostPage() {
  const { id } = Route.useParams();
  const internal = isInternalUser();
  const { data, isLoading, error } = useQuery({
    queryKey: ["blog", "post", id],
    queryFn: () => getPost(id),
    enabled: internal,
  });

  if (!internal) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-obsidian/60">Restricted.</div>;
  }
  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-obsidian/55">Loading…</div>;
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm text-obsidian/60">Post not found.</p>
        <Link to="/admin/blog" className="mt-4 inline-block text-sm font-medium hover:text-accent">
          ← Back to Blog
        </Link>
      </div>
    );
  }
  return <BlogEditor post={data} />;
}
