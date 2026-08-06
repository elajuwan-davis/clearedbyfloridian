import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkX, Bookmark as BookmarkIcon, ArrowRight } from "lucide-react";
import { useBookmarks, removeBookmark, notifyBookmarksChanged } from "@/lib/bookmarks-api";
import { PageShell, EmptyState, LoadingRow } from "@/components/ui-kit";

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
    <PageShell
      title="Bookmarks"
      meta={loading ? undefined : `${bookmarks.length} pinned`}
    >
      {loading ? (
        <LoadingRow label="Loading bookmarks" />
      ) : bookmarks.length === 0 ? (
        <div className="p-plate">
          <EmptyState
            icon={<BookmarkIcon className="h-4 w-4" strokeWidth={1.75} />}
            title="No bookmarks yet"
            description="Open a page you use often and tap the bookmark icon in the top bar to pin it here."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="p-plate p-hover-plate group relative px-3 py-2.5">
              <Link to={b.path as never} className="block pr-8">
                <div className="truncate text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground/70">
                  {b.path}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[13.5px] font-medium">
                  <span className="min-w-0 truncate">{b.label}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60"
                    strokeWidth={1.75}
                  />
                </div>
              </Link>
              <button
                type="button"
                onClick={() => drop(b.path)}
                title="Remove bookmark"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                <BookmarkX className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="sr-only">Remove bookmark</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
