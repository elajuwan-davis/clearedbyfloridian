// Bookmark path identity. Isolated from bookmarks-api.ts so it can load under
// tsx without React or the Supabase client.
//
// "/portal/permits/" and "/portal/permits" must match, otherwise the rail and
// the toggle disagree and a GC appears to have (or not have) a bookmark.

/** Normalize a pathname so "/portal/permits/" and "/portal/permits" match. */
export function normalizePath(path: string): string {
  if (!path) return "/";
  const clean = path.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean;
}
