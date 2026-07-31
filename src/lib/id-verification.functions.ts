import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const ID_BUCKET = "id-documents";

export const ID_DOC_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
] as const;

export type IdDocumentType = (typeof ID_DOC_TYPES)[number]["value"];

const DocTypeSchema = z.enum(["drivers_license", "passport"]);

const UploadUrlInput = z.object({
  filename: z.string().min(1).max(200),
});

const SaveInput = z.object({
  path: z.string().min(1),
  documentType: DocTypeSchema,
});

const PreviewInput = z.object({
  path: z.string().min(1),
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

/** Signed upload URL scoped to the caller's own ID folder. */
export const createMyIdUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    const path = `id-verification/profiles/${context.userId}/${Date.now()}-${safeName(data.filename)}`;
    const { data: signed, error } = await context.supabase.storage
      .from(ID_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, signedUrl: signed.signedUrl, token: signed.token };
  });

/** Persist the ID reference on the caller's own intake/onboarding record. */
export const saveMyIdDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`id-verification/profiles/${context.userId}/`)) {
      throw new Error("Forbidden");
    }
    const { error } = await (context.supabase.from("profiles" as never) as any)
      .update({ id_document_url: data.path, id_document_type: data.documentType })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Current stored ID reference for the caller. */
export const getMyIdDocumentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase.from("profiles" as never) as any)
      .select("id_document_url, id_document_type")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      path: (data?.id_document_url as string | null) ?? null,
      documentType: (data?.id_document_type as IdDocumentType | null) ?? null,
    };
  });

/** Short-lived signed URL for the preview thumbnail (never the raw storage URL). */
export const getMyIdPreviewUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PreviewInput.parse(d))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`id-verification/profiles/${context.userId}/`)) {
      throw new Error("Forbidden");
    }
    const { data: signed, error } = await context.supabase.storage
      .from(ID_BUCKET)
      .createSignedUrl(data.path, 120);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
