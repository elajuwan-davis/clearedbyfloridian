import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listAllPosts,
  deletePost,
  updatePost,
  formatDate,
  type BlogPost,
} from "@/lib/blog-api";

export const Route = createFileRoute("/portal/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Cleard Portal" },
      { name: "description", content: "Manage internal blog posts for Cleard by Flōridian." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalBlogIndex,
});

function PortalBlogIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog", "all"],
    queryFn: listAllPosts,
  });

  async function togglePublish(p: BlogPost) {
    try {
      await updatePost(p.id, {
        existing: p,
        status: p.status === "published" ? "draft" : "published",
      });
      toast.success(p.status === "published" ? "Unpublished" : "Published");
      qc.invalidateQueries({ queryKey: ["blog"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg);
    }
  }

  async function onDelete(p: BlogPost) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await deletePost(p.id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["blog"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label-eyebrow">Editorial</div>
            <h1 className="mt-2 font-display text-4xl tracking-tight">Blog</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Internal posts. Publish to make them visible at /blog.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/portal/blog/new" })}
            className="rounded-[3px]"
          >
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>

        <div className="mt-8 border hairline bg-card">
          <div className="grid grid-cols-[1fr_140px_120px_120px_180px] items-center gap-4 border-b hairline bg-secondary/40 px-4 py-3 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">
            <div>Title</div>
            <div>Category</div>
            <div>Status</div>
            <div>Updated</div>
            <div className="text-right">Actions</div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground">No posts yet.</p>
              <Button
                onClick={() => navigate({ to: "/portal/blog/new" })}
                className="mt-4 rounded-[3px]"
              >
                <Plus className="mr-2 h-4 w-4" /> Write first post
              </Button>
            </div>
          ) : (
            posts.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_140px_120px_120px_180px] items-center gap-4 border-b hairline px-4 py-3 last:border-0 hover:bg-secondary/30"
              >
                <div className="min-w-0">
                  <Link
                    to="/portal/blog/$id"
                    params={{ id: p.id }}
                    className="block truncate text-sm font-medium hover:text-accent"
                  >
                    {p.title || <span className="italic text-muted-foreground">Untitled</span>}
                  </Link>
                  <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    /{p.slug}
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="rounded-[3px] font-normal">
                    {p.category}
                  </Badge>
                </div>
                <div>
                  {p.status === "published" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Draft
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(p.updated_at)}</div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(p)}
                    title={p.status === "published" ? "Unpublish" : "Publish"}
                  >
                    {p.status === "published" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: "/portal/blog/$id", params: { id: p.id } })}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(p)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
