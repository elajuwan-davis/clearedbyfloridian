import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PortalShell } from "@/components/portal-shell";
import { BlogEditor } from "@/components/blog-editor";
import { getPost } from "@/lib/blog-api";

export const Route = createFileRoute("/portal/blog/$id")({
  head: () => ({
    meta: [
      { title: "Edit Post — Cleard Portal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["blog", "post", id],
    queryFn: () => getPost(id),
  });

  return (
    <PortalShell>
      {isLoading ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : error || !data ? (
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Post not found.</p>
          <Link
            to="/portal/blog"
            className="mt-4 inline-block text-sm font-medium hover:text-accent"
          >
            ← Back to blog
          </Link>
        </div>
      ) : (
        <BlogEditor post={data} />
      )}
    </PortalShell>
  );
}
