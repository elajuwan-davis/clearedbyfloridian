import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { listPublishedPosts, formatDate } from "@/lib/blog-api";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Cleard" },
      {
        name: "description",
        content:
          "Permitting insights, municipality updates, and industry news from Cleard.",
      },
      { property: "og:title", content: "Blog — Cleard" },
      {
        property: "og:description",
        content:
          "Permitting insights, municipality updates, and industry news from Cleard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicBlogIndex,
});

function PublicBlogIndex() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog", "published"],
    queryFn: listPublishedPosts,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b hairline bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="label-eyebrow text-primary-foreground/70">Editorial</div>
          <h1 className="mt-4 font-display text-5xl tracking-tight sm:text-6xl">
            The <em>Cleard</em> journal.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-primary-foreground/80 sm:text-base">
            Notes on private-provider permitting, municipality changes across South Florida, and
            what we're building at Flōridian.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col border hairline bg-card transition-shadow hover:shadow-lg"
              >
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
                  <div className="aspect-[16/10] bg-primary/95" />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    <span className="rounded-[3px] border hairline bg-secondary px-2 py-0.5">
                      {p.category}
                    </span>
                    <time>{formatDate(p.published_at)}</time>
                  </div>
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="mt-4 block">
                    <h2 className="font-display text-2xl leading-tight tracking-tight group-hover:text-accent">
                      {p.title}
                    </h2>
                  </Link>
                  {p.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
                  )}
                  <div className="mt-6 pt-6 border-t hairline">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: p.slug }}
                      className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-foreground hover:text-accent"
                    >
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
