import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkX, Bookmark as BookmarkIcon, ArrowRight } from "lucide-react";
import { useBookmarks, removeBookmark, notifyBookmarksChanged } from "@/lib/bookmarks-api";

export const Route = createFileRoute("/portal/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — Cleard" },
      { name: "description", content: "Your pinned pages across the Cleard portal." },
      { property: "og:title", content: "Bookmarks — Cleard" },
      { property: "og:description", content: "Your pinned pages across the Cleard portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { bookmarks, loading } = useBookmarks();

  async function drop(path: string) {
    await removeBookmark(path);
    notifyBookmarksChanged();
  }

  return (
    <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Quick access
        </div>
        <h1 className="display-serif mt-2 text-4xl" style={{ color: "var(--obsidian)" }}>
          Bookmarks
        </h1>
        <p className="mt-3 max-w-2xl text-[15px]" style={{ color: "color-mix(in oklab, var(--obsidian) 65%, transparent)" }}>
          Pin any page with the bookmark icon in the header, then jump straight back to it from here.
        </p>

        {loading ? (
          <div className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Loading bookmarks…
          </div>
        ) : bookmarks.length === 0 ? (
          <div
            className="mt-10 border p-10 text-center"
            style={{ borderColor: "color-mix(in oklab, var(--obsidian) 12%, transparent)", borderRadius: "3px" }}
          >
            <BookmarkIcon
              className="mx-auto h-6 w-6"
              strokeWidth={1.5}
              style={{ color: "color-mix(in oklab, var(--obsidian) 40%, transparent)" }}
            />
            <div className="mt-4 text-[15px]" style={{ color: "var(--obsidian)" }}>
              No bookmarks yet
            </div>
            <div className="mt-1 text-[13px]" style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}>
              Open a page you use often and tap the bookmark icon in the top bar.
            </div>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((b) => (
              <div
                key={b.id}
                className="group relative border bg-white p-5 transition-colors hover:border-[color-mix(in_oklab,var(--obsidian)_35%,transparent)]"
                style={{ borderColor: "color-mix(in oklab, var(--obsidian) 12%, transparent)", borderRadius: "3px" }}
              >
                <Link to={b.path as never} className="block pr-8">
                  <div
                    className="font-mono text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: "color-mix(in oklab, var(--obsidian) 45%, transparent)" }}
                  >
                    {b.path}
                  </div>
                  <div
                    className="mt-2 flex items-center gap-2 text-[16px]"
                    style={{ color: "var(--obsidian)", fontFamily: "var(--font-subline)" }}
                  >
                    {b.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-70" strokeWidth={1.5} />
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => drop(b.path)}
                  title="Remove bookmark"
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-[3px] hover:bg-secondary"
                >
                  <BookmarkX
                    className="h-4 w-4"
                    strokeWidth={1.5}
                    style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}
                  />
                  <span className="sr-only">Remove bookmark</span>
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
