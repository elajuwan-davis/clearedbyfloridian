// Tenant + access-request server functions.
// Admin-only endpoints for approving GC access requests, inviting users,
// and listing tenants.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles" as any)
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — admin only");
}

const ApproveInput = z.object({
  access_request_id: z.string().uuid(),
  tenant_name: z.string().min(1).max(200),
  license_number: z.string().max(80).optional().nullable(),
  invite_email: z.string().email(),
  redirect_to: z.string().url().optional().nullable(),
});

export const approveAccessRequestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ApproveInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Create tenant
    const { data: tenant, error: tErr } = await (supabaseAdmin.from("tenants" as any) as any)
      .insert({
        name: data.tenant_name,
        license_number: data.license_number ?? null,
        status: "active",
      })
      .select("id, name")
      .single();
    if (tErr) throw new Error(tErr.message);

    // 2. Send invite (Supabase Auth admin API) with tenant metadata
    const redirectTo = data.redirect_to ?? undefined;
    const { data: invited, error: iErr } = await (supabaseAdmin.auth.admin as any).inviteUserByEmail(
      data.invite_email,
      {
        data: { tenant_id: tenant.id, role: "gc_owner" },
        redirectTo,
      },
    );
    if (iErr) throw new Error(iErr.message);

    // handle_new_user trigger will insert tenant_members + user_roles automatically
    // for the invited user (using their metadata). If they already exist, ensure membership.
    const invitedId = invited?.user?.id;
    if (invitedId) {
      await (supabaseAdmin.from("tenant_members" as any) as any)
        .upsert(
          { user_id: invitedId, tenant_id: tenant.id, role: "gc_owner" },
          { onConflict: "user_id" },
        );
      await (supabaseAdmin.from("user_roles" as any) as any)
        .upsert(
          { user_id: invitedId, role: "gc_owner" },
          { onConflict: "user_id,role" },
        );
    }

    // 3. Mark access_request approved
    const { error: uErr } = await (supabaseAdmin.from("access_requests" as any) as any)
      .update({ status: "approved", approved_tenant_id: tenant.id })
      .eq("id", data.access_request_id);
    if (uErr) throw new Error(uErr.message);

    return { tenant_id: tenant.id as string, tenant_name: tenant.name as string };
  });

const RejectInput = z.object({
  access_request_id: z.string().uuid(),
  notes: z.string().max(1000).optional().nullable(),
});

export const rejectAccessRequestFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RejectInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from("access_requests" as any) as any)
      .update({ status: "rejected", notes: data.notes ?? null })
      .eq("id", data.access_request_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAccessRequestsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin.from("access_requests" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });

export const listTenantsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin.from("tenants" as any) as any)
      .select("id, name, license_number, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      name: string;
      license_number: string | null;
      status: string;
      created_at: string;
    }>;
  });

// Called during GC onboarding after they accept invite and set password.
// Updates tenant name/license from the confirmation form.
const UpdateTenantInput = z.object({
  name: z.string().min(1).max(200).optional(),
  license_number: z.string().max(80).optional().nullable(),
  primary_coi_path: z.string().max(500).optional().nullable(),
  primary_license_path: z.string().max(500).optional().nullable(),
});
export const updateMyTenantFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateTenantInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up caller's tenant
    const { data: member, error: mErr } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!member) throw new Error("No tenant membership");
    if (member.role !== "gc_owner") throw new Error("Forbidden — owner only");
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.license_number !== undefined) patch.license_number = data.license_number;
    if (data.primary_coi_path !== undefined) patch.primary_coi_path = data.primary_coi_path;
    if (data.primary_license_path !== undefined) patch.primary_license_path = data.primary_license_path;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await (supabaseAdmin.from("tenants" as any) as any)
      .update(patch)
      .eq("id", member.tenant_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
