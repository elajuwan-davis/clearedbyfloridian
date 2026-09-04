// Per-user page bookmarks (public.user_bookmarks), scoped by RLS to auth.uid().

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePath } from "./bookmarks-path";

export { normalizePath } from "./bookmarks-path";

export type Bookmark = {
  id: string;
  path: string;
  label: string;
  created_at: string;
};

export async function listMyBookmarks(): Promise<Bookmark[]> {
  const { data, error } = await (supabase.from("user_bookmarks" as any) as any)
    .select("id, path, label, created_at")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as Bookmark[];
}

export async function addBookmark(path: string, label: string): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return "Not signed in";
  const { error } = await (supabase.from("user_bookmarks" as any) as any).upsert(
    { user_id: userId, path: normalizePath(path), label },
    { onConflict: "user_id,path" },
  );
  return error?.message ?? null;
}

export async function removeBookmark(path: string): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return "Not signed in";
  const { error } = await (supabase.from("user_bookmarks" as any) as any)
    .delete()
    .eq("user_id", userId)
    .eq("path", normalizePath(path));
  return error?.message ?? null;
}

/** Lightweight cross-component sync so the rail + toggle stay in step. */
const EVT = "cleard:bookmarks-changed";
export function notifyBookmarksChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    listMyBookmarks().then((rows) => {
      setBookmarks(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    reload();
    if (typeof window === "undefined") return;
    const on = () => reload();
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, [reload]);

  const toggle = useCallback(
    async (path: string, label: string) => {
      const p = normalizePath(path);
      const existing = bookmarks.some((b) => b.path === p);
      if (existing) await removeBookmark(p);
      else await addBookmark(p, label);
      notifyBookmarksChanged();
    },
    [bookmarks],
  );

  const isBookmarked = useCallback(
    (path: string) => bookmarks.some((b) => b.path === normalizePath(path)),
    [bookmarks],
  );

  return { bookmarks, loading, reload, toggle, isBookmarked };
}
