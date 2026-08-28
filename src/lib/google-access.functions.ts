// Post-sign-in access gate for Google (or any) authenticated user.
// Google OAuth cannot be restricted provider-side, so approval is enforced here:
// only users already approved by Cleard (role, tenant membership, or an approved
// access_request) may enter the portal. Everyone else is auto-filed into the
// admin Request Queue and denied.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AccessDecision = {
  allowed: boolean;
  /**
   * "approved" | "pending" | "filed" | "unverified" — filed = we just created the queue
   * entry, unverified = the address has never been proved.
   */
  reason: "approved" | "pending" | "filed" | "unverified";
  email: string | null;
  role: string | null;
};

const INTERNAL_DOMAIN = /@(cleared|floridianinc)\.com$/i;

export const evaluatePortalAccessFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessDecision> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const { data: authUser } = await admin.auth.admin.getUserById(context.userId);
    const user = authUser?.user ?? null;
    const email = (user?.email ?? (context.claims as any)?.email ?? null) as string | null;
    const emailKey = email ? email.trim().toLowerCase() : null;

    // 0. A verified address is the floor for everyone, however they signed in. Google (and
    //    any other OIDC provider) fills email_confirmed_at itself when it vouches for the
    //    address, so a real Google account passes here without a second email; one whose
    //    address the provider did not verify does not.
    if (user && !user.email_confirmed_at && !(user as any).confirmed_at) {
      return { allowed: false, reason: "unverified", email: emailKey, role: null };
    }

    // 1. Internal team always allowed.
    if (emailKey && INTERNAL_DOMAIN.test(emailKey)) {
      return { allowed: true, reason: "approved", email: emailKey, role: "admin" };
    }

    // 2. Existing role grant.
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleList = (roles ?? []).map((r: any) => r.role as string);
    if (roleList.length > 0) {
      const role =
        roleList.find((r: string) => r === "admin") ??
        roleList.find((r: string) => r === "gc_owner") ??

        roleList[0];
      return { allowed: true, reason: "approved", email: emailKey, role };
    }

    // 3. Tenant membership (approved GC seat).
    const { data: member } = await admin
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (member?.tenant_id) {
      return { allowed: true, reason: "approved", email: emailKey, role: "gc_member" };
    }

    // 4. Approved access request matched by email.
    if (emailKey) {
      const { data: reqs } = await admin
        .from("access_requests")
        .select("id, status, approved_tenant_id")
        .ilike("email", emailKey);
      const rows = (reqs ?? []) as any[];
      const approved = rows.find((r) => r.status === "approved");
      if (approved) {
        // Attach the seat so future sign-ins short-circuit at step 2/3.
        await admin
          .from("user_roles")
          .upsert({ user_id: context.userId, role: "gc_owner" }, { onConflict: "user_id,role" });
        if (approved.approved_tenant_id) {
          await admin.from("tenant_members").upsert(
            { user_id: context.userId, tenant_id: approved.approved_tenant_id, role: "gc_owner" },
            { onConflict: "user_id,tenant_id" },
          );
        }
        return { allowed: true, reason: "approved", email: emailKey, role: "gc_owner" };
      }

      if (rows.length > 0) {
        return { allowed: false, reason: "pending", email: emailKey, role: null };
      }

      // 5. Not known to us — file a request into the admin queue.
      const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
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
      return { allowed: false, reason: "filed", email: emailKey, role: null };
    }

    return { allowed: false, reason: "pending", email: null, role: null };
  });
