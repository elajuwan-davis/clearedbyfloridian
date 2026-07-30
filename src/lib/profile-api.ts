// Real per-user profile data (public.profiles), with sensible fallbacks from auth.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  language: string | null;
  notification_emails: string[] | null;
};

/** "eman@cleared.com" -> "Eman" */
export function nameFromEmail(email: string | null | undefined): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "there";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function initialsFor(name: string, email?: string | null): string {
  const source = name && name !== "there" ? name : nameFromEmail(email);
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function fetchMyProfile(): Promise<{ userId: string | null; email: string | null; profile: ProfileRow | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;
  const email = auth?.user?.email ?? null;
  if (!userId) return { userId: null, email: null, profile: null };
  const { data } = await (supabase.from("profiles" as any) as any)
    .select("id, email, display_name, full_name, avatar_url, company_name, website, phone, address, language, notification_emails")
    .eq("id", userId)
    .maybeSingle();
  const profile = (data as ProfileRow | null) ?? null;
  return { userId, email: profile?.email ?? email, profile };
}

export async function saveMyProfile(patch: Partial<Omit<ProfileRow, "id">>): Promise<{ error: string | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;
  if (!userId) return { error: "Not signed in" };
  const { error } = await (supabase.from("profiles" as any) as any).upsert(
    { id: userId, ...patch },
    { onConflict: "id" },
  );
  return { error: error?.message ?? null };
}

export type MyIdentity = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  /** Full display name — profile value, else derived from email. */
  displayName: string;
  /** First word of the display name. */
  firstName: string;
  initials: string;
  avatarUrl: string | null;
  profile: ProfileRow | null;
  reload: () => void;
};

/** Signed-in user's own identity for headers, greetings and profile forms. */
export function useMyIdentity(): MyIdentity {
  const [state, setState] = useState<Omit<MyIdentity, "reload">>({
    loading: true,
    userId: null,
    email: null,
    displayName: "",
    firstName: "",
    initials: "U",
    avatarUrl: null,
    profile: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then(({ userId, email, profile }) => {
        if (cancelled) return;
        const displayName =
          (profile?.display_name || profile?.full_name || nameFromEmail(email)) ?? "";
        setState({
          loading: false,
          userId,
          email,
          displayName,
          firstName: displayName.split(/\s+/)[0] ?? displayName,
          initials: initialsFor(displayName, email),
          avatarUrl: profile?.avatar_url ?? null,
          profile,
        });
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
    return () => { cancelled = true; };
  }, [tick]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTick((t) => t + 1);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function greetingForNow(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
