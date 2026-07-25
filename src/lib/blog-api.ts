import { supabase } from "@/integrations/supabase/client";

export const BLOG_CATEGORIES = [
  "Permitting Tips",
  "Municipality Updates",
  "Industry News",
  "Company Updates",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  cover_image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || `post-${Date.now()}`;
}

export function excerptFrom(body: string, max = 180): string {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/[,.\s]+\S*$/, "") + "…";
}

export async function listAllPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export async function listPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BlogPost[];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as BlogPost | null;
}

export async function getPost(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as BlogPost | null;
}

export type BlogInput = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  body: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  cover_image_url?: string | null;
};

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = supabase.from("blog_posts").select("id").eq("slug", candidate).limit(1);
    const { data } = await q;
    const row = (data ?? [])[0] as { id: string } | undefined;
    if (!row || row.id === excludeId) return candidate;
    candidate = `${base}-${i++}`;
  }
}

export async function createPost(input: BlogInput): Promise<BlogPost> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  const slug = await ensureUniqueSlug(input.slug || slugify(input.title));
  const now = new Date().toISOString();
  const payload = {
    title: input.title,
    slug,
    excerpt: input.excerpt ?? excerptFrom(input.body),
    body: input.body,
    category: input.category,
    tags: input.tags,
    status: input.status,
    cover_image_url: input.cover_image_url ?? null,
    author_id: user?.id ?? null,
    author_name: user?.email ?? null,
    published_at: input.status === "published" ? now : null,
  };
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as BlogPost;
}

export async function updatePost(id: string, input: Partial<BlogInput> & { existing: BlogPost }): Promise<BlogPost> {
  const { existing, ...patch } = input;
  const next: Record<string, unknown> = { ...patch };
  if (patch.title && !patch.slug) {
    // keep existing slug on rename unless explicitly changed
  }
  if (patch.slug) {
    next.slug = await ensureUniqueSlug(slugify(patch.slug), id);
  }
  if (patch.body !== undefined && patch.excerpt === undefined) {
    next.excerpt = excerptFrom(patch.body);
  }
  if (patch.status) {
    if (patch.status === "published" && existing.status !== "published") {
      next.published_at = new Date().toISOString();
    }
    if (patch.status === "draft") {
      next.published_at = null;
    }
  }
  const { data, error } = await supabase
    .from("blog_posts")
    .update(next)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as BlogPost;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
