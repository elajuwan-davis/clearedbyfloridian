// Post-sign-in access gate for Google (or any) authenticated user.
// Google OAuth cannot be restricted provider-side, so approval is enforced here:
// only users already approved by Cleard (role, tenant membership, or an approved
// access_request) may enter the portal. Everyone else is auto-filed into the
// admin Request Queue and denied.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  decidePortalAccess,
  escapeLikeExact,
  isInternalPortalEmail,
  looksLikeUnapprovedSelfServe,
  type AccessDecision,
} from "@/lib/google-access";

export type { AccessDecision };

const STAFF_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export const evaluatePortalAccessFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessDecision> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
    const user = authUser?.user ?? null;
    const email = (user?.email ?? (context.claims as any)?.email ?? null) as string | null;
    const emailKey = email ? email.trim().toLowerCase() : null;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const hasInviteMetadata = Boolean(meta.tenant_id || meta.invite_token);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleList = (roles ?? []).map((r: any) => r.role as string);

    const { data: member } = await admin
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    const tenantId = (member?.tenant_id as string | undefined) ?? null;

    let tenantCreatedAt: string | null = null;
    let tenantMemberCount: number | null = null;
    if (tenantId) {
      const { data: tenant } = await admin
        .from("tenants")
        .select("created_at")
        .eq("id", tenantId)
        .maybeSingle();
      tenantCreatedAt = (tenant?.created_at as string | undefined) ?? null;
      const { count } = await admin
        .from("tenant_members")
        .select("user_id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
      tenantMemberCount = typeof count === "number" ? count : null;
    }

    let requests: Array<{ status: string; approved_tenant_id?: string | null }> = [];
    if (emailKey) {
      const { data: reqs } = await admin
        .from("access_requests")
        .select("id, status, approved_tenant_id")
        .ilike("email", escapeLikeExact(emailKey));
      requests = (reqs ?? []) as Array<{ status: string; approved_tenant_id?: string | null }>;
    }

    const hasApprovedRequest = requests.some((r) => r.status === "approved");
    const selfServeSoloTenant = looksLikeUnapprovedSelfServe({
      isInternal: isInternalPortalEmail(emailKey),
      hasApprovedRequest,
      hasInviteMetadata,
      tenantMemberCount,
      userCreatedAt: (user?.created_at as string | undefined) ?? null,
      tenantCreatedAt,
    });

    const decision = decidePortalAccess({
      email: emailKey,
      roles: roleList,
      hasTenantMembership: Boolean(tenantId),
      requests,
      selfServeSoloTenant,
    });

    if (decision.allowed && hasApprovedRequest && !isInternalPortalEmail(emailKey)) {
      const approved = requests.find((r) => r.status === "approved");
      await admin
        .from("user_roles")
        .upsert({ user_id: context.userId, role: "gc_owner" }, { onConflict: "user_id,role" });
      if (approved?.approved_tenant_id) {
        // tenant_members is UNIQUE(user_id) — replace a junk self-serve row with the approved seat.
        await admin.from("tenant_members").upsert(
          { user_id: context.userId, tenant_id: approved.approved_tenant_id, role: "gc_owner" },
          { onConflict: "user_id" },
        );
      }
      return { ...decision, role: "gc_owner" };
    }

    if (!decision.allowed && selfServeSoloTenant) {
      try {
        await revokeSelfServeProvision(admin, context.userId, tenantId);
      } catch {
        // Still deny the session; the trigger fix is the durable close.
      }
    }

    if (decision.reason === "filed" && emailKey) {
      const name =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        emailKey.split("@")[0];
      await admin.from("access_requests").insert({
        name,
        email: emailKey,
        company: emailKey.split("@")[1] ?? null,
        status: "pending",
        notes: "Auto-filed from Google sign-in",
      });
    }

    return decision;
  });

async function revokeSelfServeProvision(
  admin: any,
  userId: string,
  tenantId: string | null,
): Promise<void> {
  await admin.from("user_roles").delete().eq("user_id", userId);
  await admin.from("tenant_members").delete().eq("user_id", userId);
  if (!tenantId || tenantId === STAFF_TENANT_ID) return;
  const { count } = await admin
    .from("tenant_members")
    .select("user_id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (count === 0) {
    await admin.from("tenants").delete().eq("id", tenantId);
  }
}
