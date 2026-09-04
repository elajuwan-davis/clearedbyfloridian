// Self-serve signup: create a tenant + an auth user in one shot, with no admin approval.
// Modelled on approveAccessRequestFn in tenants.functions.ts (same tenant-then-user sequence);
// the difference is that the account exists immediately.
//
// The account is created *unconfirmed*: the caller then asks Supabase to send the confirmation
// email, and the portal gate (evaluatePortalAccessFn) refuses an unverified address, so an
// address nobody controls cannot reach the portal.
//
// The PAA signature gate is unchanged — a self-serve account still cannot enter the portal
// until it signs, exactly like an invited one.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SignupAttemptsClient } from "@/lib/signup-rate-limit.server";
import { crmProfilePatch } from "@/lib/crm-profile-patch";

const SelfServeInput = z.object({
  name: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  license_number: z.string().max(80).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8),
  /** Which project management / CRM tool the signup reported (asked on the form). */
  crm: z.string().max(120).optional().nullable(),
  crm_other: z.string().max(200).optional().nullable(),
});

/** Supabase reports a taken email in a few different shapes depending on the endpoint. */
function isEmailTaken(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("already exists") ||
    m.includes("duplicate key") ||
    m.includes("email_exists")
  );
}

export const selfServeSignupFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SelfServeInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { enforceSignupRateLimit } = await import("@/lib/signup-rate-limit.server");

    // 0. /join is public, so cap attempts per network and per email before writing anything.
    await enforceSignupRateLimit(
      supabaseAdmin as unknown as SignupAttemptsClient,
      data.email.trim().toLowerCase(),
    );

    // 1. Create the tenant on the trial tier — own permits only, everything else locked
    //    until staff upgrades it (see src/lib/plan-access.ts). Written explicitly rather
    //    than left to the column default so the intent survives a default change.
    const base = {
      name: data.company,
      license_number: data.license_number ?? null,
      status: "active",
    };
    const insertTenant = (row: Record<string, unknown>) =>
      (supabaseAdmin.from("tenants" as any) as any).insert(row).select("id, name").single();

    let { data: tenant, error: tErr } = await insertTenant({ ...base, plan: "trial" });
    if (tErr && /plan/i.test(tErr.message ?? "")) {
      // Plan migration not applied on this project yet: signing up still has to work.
      ({ data: tenant, error: tErr } = await insertTenant(base));
    }
    if (tErr) throw new Error(tErr.message);

    // 2. Create the auth user, unconfirmed — the email has to be proved before this account
    //    is worth anything. handle_new_user() reads tenant_id/role off raw_user_meta_data and inserts
    //    user_roles + tenant_members itself — the same contract approveAccessRequestFn
    //    relies on, so don't write those rows here.
    const { data: created, error: uErr } = await (supabaseAdmin.auth.admin as any).createUser({
      email: data.email,
      password: data.password,
      email_confirm: false,
      user_metadata: {
        full_name: data.name,
        phone: data.phone ?? undefined,
        tenant_id: tenant.id,
        role: "gc_owner",
      },
    });

    if (uErr) {
      // The tenant we just made would otherwise be an orphan nobody can reach.
      await (supabaseAdmin.from("tenants" as any) as any).delete().eq("id", tenant.id);
      const message = uErr.message ?? "Could not create the account";
      throw new Error(
        isEmailTaken(message)
          ? "An account with this email already exists — sign in instead."
          : message,
      );
    }

    // 3. Record the CRM answer on the profile ensure_profile_for_new_user() just created.
    //    UPDATE, never upsert: a partial profile upsert nulls name/email/ID docs.
    //    A failure here must not sink an otherwise valid signup.
    const newUserId = created.user?.id ?? null;
    if (newUserId && data.crm) {
      await (supabaseAdmin.from("profiles" as any) as any)
        .update(crmProfilePatch({ crm: data.crm, crm_other: data.crm_other, source: "signup_form" }))
        .eq("id", newUserId);
    }

    return {
      ok: true,
      tenantId: tenant.id as string,
      userId: newUserId,
      /** The caller must trigger the confirmation email; sign-in is blocked until it's used. */
      verificationRequired: true,
    };
  });
