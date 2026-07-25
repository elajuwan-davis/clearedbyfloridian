import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { listPublishedPosts, formatDate, BLOG_CATEGORIES, type BlogPost } from "@/lib/blog-api";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Insights — Cleard" },
      {
        name: "description",
        content:
          "Code updates, municipality changes, private provider news, and what every Florida GC needs to know.",
      },
      { property: "og:title", content: "Insights — Cleard" },
      {
        property: "og:description",
        content:
          "Code updates, municipality changes, private provider news, and what every Florida GC needs to know.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicBlogIndex,
});

const FILTERS = ["All", ...BLOG_CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

function readTimeMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function PublicBlogIndex() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog", "published"],
    queryFn: listPublishedPosts,
  });
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(
    () => (filter === "All" ? posts : posts.filter((p) => p.category === filter)),
    [posts, filter],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b hairline">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="label-eyebrow text-obsidian/60">◇ Insights</div>
          <h1 className="mt-6 display-serif text-5xl leading-[1.05] tracking-tight text-obsidian sm:text-6xl">
            Permitting <em>intelligence,</em> published.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-obsidian/65 sm:text-lg">
            Code updates, municipality changes, private provider news, and what every Florida
            GC needs to know.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-b hairline bg-background/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {FILTERS.map((f, i) => (
              <div key={f} className="flex items-center">
                <button
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors rounded-[3px] ${
                    filter === f
                      ? "bg-obsidian text-paper"
                      : "text-obsidian/60 hover:text-obsidian"
                  }`}
                >
                  {f}
                </button>
                {i < FILTERS.length - 1 && (
                  <span aria-hidden className="mx-1 text-obsidian/20 select-none">·</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "All"
                ? "No posts yet. Check back soon."
                : `No posts in ${filter} yet.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PostCard({ post: p }: { post: BlogPost }) {
  return (
    <article className="group flex flex-col border hairline bg-card transition-shadow hover:shadow-lg rounded-[3px] overflow-hidden">
      {p.cover_image_url ? (
        <Link
          to="/blog/$slug"
          params={{ slug: p.slug }}
          className="block aspect-[16/10] overflow-hidden bg-secondary"
        >
          <img
            src={p.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
      ) : (
        <div className="aspect-[16/10] bg-obsidian/95 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 18px, color-mix(in oklab, var(--sky) 40%, transparent) 18px 19px)",
          }} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2">
          <span className="rounded-[3px] border hairline bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">
            {p.category}
          </span>
        </div>
        <Link to="/blog/$slug" params={{ slug: p.slug }} className="mt-4 block">
          <h2 className="display-serif text-2xl leading-tight tracking-tight text-obsidian group-hover:text-accent">
            {p.title}
          </h2>
        </Link>
        {p.excerpt && (
          <p className="mt-3 line-clamp-2 text-sm text-obsidian/65">{p.excerpt}</p>
        )}
        <div className="mt-6 pt-5 border-t hairline flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-obsidian/80 truncate">
              {p.author_name || "Cleard Editorial"}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
              {formatDate(p.published_at)}
            </div>
          </div>
          <Link
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian hover:text-accent"
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  );
}

// Exported for reuse on the detail page's related-posts block.
export { PostCard, readTimeMinutes };
