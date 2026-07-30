import { useRouterState } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useBookmarks } from "@/lib/bookmarks-api";
import { labelForPath } from "@/lib/portal-nav";

/** Pin/unpin the current page to the signed-in user's Bookmarks. */
export function BookmarkToggle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isBookmarked, toggle, loading } = useBookmarks();
  const on = isBookmarked(pathname);
  const label = labelForPath(pathname);

  if (pathname === "/portal/bookmarks") return null;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => toggle(pathname, label)}
      aria-pressed={on}
      title={on ? "Remove from bookmarks" : "Bookmark this page"}
      className="grid h-10 w-10 place-items-center rounded-[3px] hover:bg-secondary transition-colors disabled:opacity-50"
    >
      {on ? (
        <BookmarkCheck className="h-[18px] w-[18px]" strokeWidth={1.5} style={{ color: "var(--obsidian)" }} />
      ) : (
        <Bookmark
          className="h-[18px] w-[18px]"
          strokeWidth={1.5}
          style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}
        />
      )}
      <span className="sr-only">{on ? "Remove from bookmarks" : "Bookmark this page"}</span>
    </button>
  );
}
