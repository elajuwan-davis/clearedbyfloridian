import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const LEGAL_DOCS_BUCKET = "legal-documents";

const UploadUrlInput = z.object({
  documentId: z.string().uuid(),
  filename: z.string().min(1).max(200),
});

const DownloadUrlInput = z.object({
  path: z.string().min(1),
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

async function assertAdmin(supabase: any, userId: string): Promise<void> {
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const isAdmin = ((roles ?? []) as any[]).some((r) => r.role === "admin");
  if (!isAdmin) throw new Error("Forbidden — admin only");
}

/** Signed upload URL for a legal document PDF/DOC under legal/{documentId}/… */
export const createLegalDocUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const path = `legal/${data.documentId}/${Date.now()}-${safeName(data.filename)}`;
    const { data: signed, error } = await context.supabase.storage
      .from(LEGAL_DOCS_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, signedUrl: signed.signedUrl, token: signed.token };
  });

/** Short-lived signed URL to download a stored legal document version. */
export const getLegalDocDownloadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DownloadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.path.startsWith("legal/")) throw new Error("Forbidden");
    const { data: signed, error } = await context.supabase.storage
      .from(LEGAL_DOCS_BUCKET)
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
