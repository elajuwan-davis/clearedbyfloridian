import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { getPostBySlug, formatDate } from "@/lib/blog-api";
import { RenderedBody } from "@/lib/blog-render";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPostBySlug(params.slug);
    if (!post || post.status !== "published") throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Post not found — Cleard" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData.post;
    const desc = p.excerpt ?? "";
    const meta: Array<{ title?: string; name?: string; property?: string; content?: string }> = [
      { title: `${p.title} — Cleard` },
      { name: "description", content: desc },
      { property: "og:title", content: p.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: p.title },
      { name: "twitter:description", content: desc },
    ];
    if (p.cover_image_url) {
      meta.push({ property: "og:image", content: p.cover_image_url });
      meta.push({ name: "twitter:image", content: p.cover_image_url });
    }
    return { meta };
  },
  errorComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Something went wrong.</h1>
        <Link to="/blog" className="mt-6 inline-block text-sm hover:text-accent">
          ← Back to blog
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="label-eyebrow">Error · 404</div>
        <h1 className="mt-4 font-display text-4xl">Post not found.</h1>
        <Link to="/blog" className="mt-6 inline-block text-sm hover:text-accent">
          ← Back to blog
        </Link>
      </div>
    </div>
  ),
  component: BlogDetail,
});

function BlogDetail() {
  const { post } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          ← Back to blog
        </Link>
        <div className="mt-8 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          <span className="rounded-[3px] border hairline bg-secondary px-2 py-0.5">
            {post.category}
          </span>
          <time>{formatDate(post.published_at)}</time>
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        )}
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt=""
            className="mt-8 aspect-[16/9] w-full object-cover border hairline"
          />
        )}
        <div className="mt-10">
          <RenderedBody body={post.body} />
        </div>
        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t hairline pt-6">
            {post.tags.map((t: string) => (
              <span
                key={t}
                className="rounded-[3px] border hairline bg-secondary px-2 py-1 text-xs text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
