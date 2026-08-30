// Tenant + access-request server functions.
// Admin-only endpoints for approving GC access requests, inviting users,
// and listing tenants.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assembleTenantPlanRows, type TenantPlanRow } from "@/lib/tenant-plans";
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

    // 1. Create tenant. An invited account is a managed one: plan is written
    // explicitly rather than left to the column default, so a default flip can
    // never quietly drop a paying client onto the trial surface.
    const base = {
      name: data.tenant_name,
      license_number: data.license_number ?? null,
      status: "active",
    };
    const insertTenant = (row: Record<string, unknown>) =>
      (supabaseAdmin.from("tenants" as any) as any).insert(row).select("id, name").single();

    let { data: tenant, error: tErr } = await insertTenant({ ...base, plan: "full" });
    if (tErr && /plan/i.test(tErr.message ?? "")) {
      // Plan migration not applied on this project yet: inviting still has to work.
      ({ data: tenant, error: tErr } = await insertTenant(base));
    }
    if (tErr) throw new Error(tErr.message);

    // 2. Always create a shareable invite token for this tenant
    const { data: inviteRow, error: invErr } = await (
      supabaseAdmin.from("tenant_invites" as any) as any
    )
      .insert({ tenant_id: tenant.id, created_by: context.userId })
      .select("id, token")
      .single();
    if (invErr) throw new Error(invErr.message);

    // 3. Best-effort email invite (must not block the link)
    const redirectTo = data.redirect_to ?? undefined;
    let invited: any = null;
    let emailError: string | null = null;
    try {
      const res = await (supabaseAdmin.auth.admin as any).inviteUserByEmail(data.invite_email, {
        data: { tenant_id: tenant.id, role: "gc_owner" },
        redirectTo,
      });
      invited = res?.data ?? null;
      if (res?.error) emailError = res.error.message ?? "Invite email failed";
    } catch (e) {
      emailError = e instanceof Error ? e.message : "Invite email failed";
    }


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

    // 4. Mark access_request approved
    const { error: uErr } = await (supabaseAdmin.from("access_requests" as any) as any)
      .update({ status: "approved", approved_tenant_id: tenant.id })
      .eq("id", data.access_request_id);
    if (uErr) throw new Error(uErr.message);

    return {
      tenant_id: tenant.id as string,
      tenant_name: tenant.name as string,
      invite_token: inviteRow.token as string,
      email_sent: !emailError,
      email_error: emailError,
    };
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

export type { TenantPlanRow } from "@/lib/tenant-plans";

/** Every tenant with the plan tier that decides what its members can open. */
export const listTenantPlansFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TenantPlanRow[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [tenantRes, memberRes, profileRes] = await Promise.all([
      (supabaseAdmin.from("tenants" as any) as any)
        .select("id, name, plan, status, created_at")
        .order("created_at", { ascending: false }),
      (supabaseAdmin.from("tenant_members" as any) as any).select("user_id, tenant_id, role"),
      (supabaseAdmin.from("profiles" as any) as any).select("id, email"),
    ]);
    if (tenantRes.error) throw new Error(tenantRes.error.message);

    return assembleTenantPlanRows(
      tenantRes.data ?? [],
      memberRes.data ?? [],
      profileRes.data ?? [],
    );
  });

const SetPlanInput = z.object({
  tenant_id: z.string().uuid(),
  plan: z.enum(["trial", "full"]),
});

/** Move one tenant between the trial and full tiers. Admin only. */
export const setTenantPlanFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetPlanInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin.from("tenants" as any) as any)
      .update({ plan: data.plan })
      .eq("id", data.tenant_id)
      .select("id, plan")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That tenant no longer exists");
    return { tenant_id: row.id as string, plan: row.plan as "trial" | "full" };
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

// -------- Team invites (GC owner adds gc_member) --------

const InviteTeamInput = z.object({
  email: z.string().email(),
  redirect_to: z.string().url().optional().nullable(),
});

export const inviteTeamMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteTeamInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error: mErr } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!member) throw new Error("No tenant membership");
    if (member.role !== "gc_owner") throw new Error("Only the owner can invite team members");

    const { data: invited, error: iErr } = await (supabaseAdmin.auth.admin as any).inviteUserByEmail(
      data.email,
      {
        data: { tenant_id: member.tenant_id, role: "gc_member" },
        redirectTo: data.redirect_to ?? undefined,
      },
    );
    if (iErr) throw new Error(iErr.message);

    const invitedId = invited?.user?.id;
    if (invitedId) {
      await (supabaseAdmin.from("tenant_members" as any) as any).upsert(
        { user_id: invitedId, tenant_id: member.tenant_id, role: "gc_member" },
        { onConflict: "user_id" },
      );
      await (supabaseAdmin.from("user_roles" as any) as any).upsert(
        { user_id: invitedId, role: "gc_member" },
        { onConflict: "user_id,role" },
      );
    }
    return { ok: true };
  });

export const listMyTeamFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me, error: mErr } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!me) return [] as Array<{ user_id: string; email: string; role: string }>;
    const { data: members, error } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("user_id, role")
      .eq("tenant_id", me.tenant_id);
    if (error) throw new Error(error.message);
    const rows: Array<{ user_id: string; email: string; role: string }> = [];
    for (const m of (members ?? []) as any[]) {
      const { data: u } = await (supabaseAdmin.auth.admin as any).getUserById(m.user_id);
      rows.push({
        user_id: m.user_id,
        email: u?.user?.email ?? "",
        role: m.role,
      });
    }
    return rows;
  });

const RemoveTeamInput = z.object({ user_id: z.string().uuid() });
export const removeTeamMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RemoveTeamInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!me || me.role !== "gc_owner") throw new Error("Only the owner can remove team members");
    if (data.user_id === context.userId) throw new Error("Owner cannot remove themselves");
    const { error } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .delete()
      .eq("user_id", data.user_id)
      .eq("tenant_id", me.tenant_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Subcontractor invites --------

const InviteSubInput = z.object({
  sub_id: z.string().uuid(),
  redirect_to: z.string().url().optional().nullable(),
});

export const inviteSubcontractorFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteSubInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error: sErr } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .select("id, email, company_name, tenant_id")
      .eq("id", data.sub_id)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!sub) throw new Error("Subcontractor not found");
    if (!sub.email) throw new Error("Subcontractor is missing an email address");

    // Caller must be admin or member of same tenant
    const { data: caller } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: isAdminRow } = await (supabaseAdmin.from("user_roles" as any) as any)
      .select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    const authorized = !!isAdminRow || (caller && caller.tenant_id === sub.tenant_id);
    if (!authorized) throw new Error("Forbidden");

    const { data: invited, error: iErr } = await (supabaseAdmin.auth.admin as any).inviteUserByEmail(
      sub.email,
      {
        data: { role: "subcontractor", sub_id: sub.id },
        redirectTo: data.redirect_to ?? undefined,
      },
    );
    if (iErr) throw new Error(iErr.message);

    const invitedId = invited?.user?.id;
    if (invitedId) {
      await (supabaseAdmin.from("user_roles" as any) as any).upsert(
        { user_id: invitedId, role: "subcontractor" },
        { onConflict: "user_id,role" },
      );
      await (supabaseAdmin.from("sub_accounts" as any) as any).upsert(
        { user_id: invitedId, email: sub.email },
        { onConflict: "user_id" },
      );
    }
    return { ok: true };
  });

// -------- Admin: list all tenants for impersonation switcher --------

export const listAllTenantsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin.from("tenants" as any) as any)
      .select("id, name, status")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{ id: string; name: string; status: string }>;
  });

// -------- Path A: allowed_domain --------

const SetDomainInput = z.object({
  allowed_domain: z.string().max(120).nullable(),
});
export const setTenantAllowedDomainFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetDomainInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role").eq("user_id", context.userId).maybeSingle();
    if (!me || me.role !== "gc_owner") throw new Error("Only the owner can set the domain");
    const domain = (data.allowed_domain ?? "").trim().toLowerCase().replace(/^@/, "") || null;
    const { error } = await (supabaseAdmin.from("tenants" as any) as any)
      .update({ allowed_domain: domain }).eq("id", me.tenant_id);
    if (error) throw new Error(error.message);
    return { allowed_domain: domain };
  });

export const getMyTenantOnboardingFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role").eq("user_id", context.userId).maybeSingle();
    if (!me) return null;
    const { data: t } = await (supabaseAdmin.from("tenants" as any) as any)
      .select("id, name, allowed_domain").eq("id", me.tenant_id).maybeSingle();
    const { data: invites } = await (supabaseAdmin.from("tenant_invites" as any) as any)
      .select("id, token, created_at, revoked_at, uses")
      .eq("tenant_id", me.tenant_id)
      .order("created_at", { ascending: false });
    return {
      tenant: t as { id: string; name: string; allowed_domain: string | null },
      role: me.role as string,
      invites: (invites ?? []) as Array<{ id: string; token: string; created_at: string; revoked_at: string | null; uses: number }>,
    };
  });

// -------- Path B: invite tokens --------

export const createInviteTokenFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role").eq("user_id", context.userId).maybeSingle();
    if (!me || me.role !== "gc_owner") throw new Error("Only the owner can create invite links");
    const { data, error } = await (supabaseAdmin.from("tenant_invites" as any) as any)
      .insert({ tenant_id: me.tenant_id, created_by: context.userId })
      .select("id, token").single();
    if (error) throw new Error(error.message);
    return data as { id: string; token: string };
  });

const RevokeInviteInput = z.object({ id: z.string().uuid() });
export const revokeInviteTokenFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RevokeInviteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id, role").eq("user_id", context.userId).maybeSingle();
    if (!me || me.role !== "gc_owner") throw new Error("Only the owner can revoke invite links");
    const { error } = await (supabaseAdmin.from("tenant_invites" as any) as any)
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id).eq("tenant_id", me.tenant_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public: look up invite by token (unauthenticated, for the /join/:token landing page)
const LookupInviteInput = z.object({ token: z.string().uuid() });
export const lookupInviteFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LookupInviteInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await (supabaseAdmin.from("tenant_invites" as any) as any)
      .select("tenant_id, revoked_at").eq("token", data.token).maybeSingle();
    if (!row || row.revoked_at) return { valid: false as const };
    const { data: t } = await (supabaseAdmin.from("tenants" as any) as any)
      .select("name").eq("id", row.tenant_id).maybeSingle();
    return { valid: true as const, tenant_name: (t?.name ?? "Team") as string };
  });

