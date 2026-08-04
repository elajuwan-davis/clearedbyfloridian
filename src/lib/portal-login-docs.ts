import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const PORTAL_LOGIN_DOCS_BUCKET = "portal-login-docs";

export type PortalLoginDocument = {
  id: string;
  tenant_id: string | null;
  user_id: string;
  municipality_slug: string;
  municipality: string;
  doc_label: string;
  file_path: string;
  file_name: string | null;
  expiration_date: string | null;
  uploaded_at: string;
};

const UploadUrlInput = z.object({
  municipalitySlug: z.string().min(1).max(200),
  filename: z.string().min(1).max(200),
});

const DownloadUrlInput = z.object({
  path: z.string().min(1),
});

const InsertDocInput = z.object({
  municipality_slug: z.string().min(1).max(200),
  municipality: z.string().min(1).max(200),
  doc_label: z.string().min(1).max(200),
  file_path: z.string().min(1),
  file_name: z.string().min(1).max(200),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

export const createPortalLoginDocUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    const path = `portal-logins/${context.userId}/${data.municipalitySlug}/${Date.now()}-${safeName(data.filename)}`;
    const { data: signed, error } = await context.supabase.storage
      .from(PORTAL_LOGIN_DOCS_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, signedUrl: signed.signedUrl, token: signed.token };
  });

export const getPortalLoginDocUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DownloadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    const ownPrefix = `portal-logins/${context.userId}/`;
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = ((roles ?? []) as any[]).some((r) => r.role === "admin");
    if (!isAdmin && !data.path.startsWith(ownPrefix)) throw new Error("Forbidden");
    if (!data.path.startsWith("portal-logins/")) throw new Error("Forbidden");
    const { data: signed, error } = await context.supabase.storage
      .from(PORTAL_LOGIN_DOCS_BUCKET)
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const insertPortalLoginDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InsertDocInput.parse(d))
  .handler(async ({ data, context }) => {
    const ownPrefix = `portal-logins/${context.userId}/`;
    if (!data.file_path.startsWith(ownPrefix)) throw new Error("Forbidden");
    const { data: row, error } = await context.supabase
      .from("portal_login_documents")
      .insert({
        user_id: context.userId,
        tenant_id: data.tenant_id ?? null,
        municipality_slug: data.municipality_slug,
        municipality: data.municipality,
        doc_label: data.doc_label,
        file_path: data.file_path,
        file_name: data.file_name,
        expiration_date: data.expiration_date ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as PortalLoginDocument;
  });

/** Client-side list (RLS scoped to owner/tenant/admin). */
export async function listPortalLoginDocuments(
  municipalitySlug?: string,
): Promise<PortalLoginDocument[]> {
  let q = supabase
    .from("portal_login_documents")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (municipalitySlug) q = q.eq("municipality_slug", municipalitySlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PortalLoginDocument[];
}

export function isDocExpired(expirationDate: string | null | undefined, now = new Date()): boolean {
  if (!expirationDate) return false;
  const d = new Date(`${expirationDate}T00:00:00`);
  if (isNaN(d.getTime())) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() < today.getTime();
}
