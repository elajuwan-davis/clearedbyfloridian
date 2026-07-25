import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { getPostBySlug, listPublishedPosts, formatDate } from "@/lib/blog-api";
import { RenderedBody } from "@/lib/blog-render";
import { PostCard, readTimeMinutes } from "./blog.index";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPostBySlug(params.slug);
    if (!post || post.status !== "published") throw notFound();
    // Related posts in same category (up to 3, excluding current)
    const all = await listPublishedPosts();
    const related = all.filter((p) => p.category === post.category && p.id !== post.id).slice(0, 3);
    return { post, related };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Unavailable — Cleard" },
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
        <h1 className="display-serif text-4xl">Something went wrong.</h1>
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
        <h1 className="mt-4 display-serif text-4xl">Post not found.</h1>
        <Link to="/blog" className="mt-6 inline-block text-sm hover:text-accent">
          ← Back to blog
        </Link>
      </div>
    </div>
  ),
  component: BlogDetail,
});

function BlogDetail() {
  const { post, related } = Route.useLoaderData();
  const readTime = readTimeMinutes(post.body);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b hairline">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55 hover:text-obsidian"
          >
            ← Back to Insights
          </Link>
          <div className="mt-8">
            <span className="rounded-[3px] border hairline bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">
              {post.category}
            </span>
          </div>
          <h1 className="mt-5 display-serif text-4xl leading-[1.08] tracking-tight text-obsidian sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 text-lg text-obsidian/65">{post.excerpt}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
            <span className="text-obsidian/80">{post.author_name || "Cleard Editorial"}</span>
            <span aria-hidden>·</span>
            <time>{formatDate(post.published_at)}</time>
            <span aria-hidden>·</span>
            <span>{readTime} min read</span>
          </div>
        </div>
      </section>

      {/* Cover */}
      {post.cover_image_url && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <img
            src={post.cover_image_url}
            alt=""
            className="mt-10 aspect-[16/9] w-full object-cover border hairline rounded-[3px]"
          />
        </div>
      )}

      {/* Body */}
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="prose-cleard">
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

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t hairline bg-background/50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <div className="label-eyebrow text-obsidian/60">◇ Related</div>
            <h2 className="mt-3 display-serif text-3xl text-obsidian">
              More in <em>{post.category}</em>
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t hairline">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 text-center">
          <h2 className="display-serif text-3xl text-obsidian sm:text-4xl">
            Ready to streamline your permits?
          </h2>
          <p className="mt-3 text-obsidian/60">
            2-day plan review. Same-day inspections. Cleard.
          </p>
          <Link
            to="/join"
            className="mt-8 inline-flex items-center gap-2 bg-obsidian px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper hover:bg-obsidian/90 rounded-[3px]"
          >
            Request Access →
          </Link>
        </div>
      </section>
    </div>
  );
}
