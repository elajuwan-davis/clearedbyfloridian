import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Reuse the existing private COI bucket from coi_tracking migration. */
export const COI_DOCUMENTS_BUCKET = "coi-documents";

const UploadUrlInput = z.object({
  tenantId: z.string().uuid(),
  requestId: z.string().uuid(),
  filename: z.string().min(1).max(200),
});

const DownloadUrlInput = z.object({
  path: z.string().min(1),
  tenantId: z.string().uuid(),
});

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

async function assertTenantAccess(
  supabase: any,
  userId: string,
  tenantId: string,
): Promise<void> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = ((roles ?? []) as any[]).some((r) => r.role === "admin");
  if (isAdmin) return;

  const { data: member } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!member) throw new Error("Forbidden");
}

/** Signed upload URL for an insurance-request COI attachment. */
export const createInsuranceRequestUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertTenantAccess(context.supabase, context.userId, data.tenantId);
    const path = `insurance-requests/${data.tenantId}/${data.requestId}/${Date.now()}-${safeName(data.filename)}`;
    const { data: signed, error } = await context.supabase.storage
      .from(COI_DOCUMENTS_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, signedUrl: signed.signedUrl, token: signed.token };
  });

/** Short-lived signed URL to retrieve an attached COI PDF. */
export const getInsuranceRequestFileUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DownloadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertTenantAccess(context.supabase, context.userId, data.tenantId);
    const expectedPrefix = `insurance-requests/${data.tenantId}/`;
    if (!data.path.startsWith(expectedPrefix)) throw new Error("Forbidden");
    const { data: signed, error } = await context.supabase.storage
      .from(COI_DOCUMENTS_BUCKET)
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
