import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const COMPANY_DOCS_BUCKET = "company-compliance-docs";

const KindSchema = z.enum(["gl", "wc"]);

const UploadUrlInput = z.object({
  filename: z.string().min(1).max(200),
  kind: KindSchema,
  tenantId: z.string().uuid(),
});

const PreviewInput = z.object({
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

/** Signed upload URL for a company COI/compliance PDF. */
export const createCompanyDocUploadUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadUrlInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertTenantAccess(context.supabase, context.userId, data.tenantId);
    const path = `company/${data.tenantId}/${data.kind}/${Date.now()}-${safeName(data.filename)}`;
    const { data: signed, error } = await context.supabase.storage
      .from(COMPANY_DOCS_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, signedUrl: signed.signedUrl, token: signed.token };
  });

/** Short-lived signed URL to retrieve an uploaded company compliance doc. */
export const getCompanyDocUrlFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PreviewInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertTenantAccess(context.supabase, context.userId, data.tenantId);
    const expectedPrefix = `company/${data.tenantId}/`;
    if (!data.path.startsWith(expectedPrefix)) throw new Error("Forbidden");
    const { data: signed, error } = await context.supabase.storage
      .from(COMPANY_DOCS_BUCKET)
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
