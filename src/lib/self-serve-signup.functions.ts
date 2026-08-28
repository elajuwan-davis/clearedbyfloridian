// Self-serve signup: create a tenant + a pre-confirmed auth user in one shot, with no
// admin approval and no invite email. Modelled on approveAccessRequestFn in tenants.functions.ts
// (same tenant-then-user sequence); the difference is that the account exists immediately.
//
// The PAA signature gate is unchanged — a self-serve account still cannot enter the portal
// until it signs, exactly like an invited one.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SelfServeInput = z.object({
  name: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  license_number: z.string().max(80).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  password: z.string().min(8),
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

    // 1. Create the tenant (plan defaults to 'trial' per the migration).
    const { data: tenant, error: tErr } = await (supabaseAdmin.from("tenants" as any) as any)
      .insert({
        name: data.company,
        license_number: data.license_number ?? null,
        status: "active",
      })
      .select("id, name")
      .single();
    if (tErr) throw new Error(tErr.message);

    // 2. Create the auth user directly, pre-confirmed, no email round-trip.
    //    handle_new_user() reads tenant_id/role off raw_user_meta_data and inserts
    //    user_roles + tenant_members itself — the same contract approveAccessRequestFn
    //    relies on, so don't write those rows here.
    const { data: created, error: uErr } = await (supabaseAdmin.auth.admin as any).createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
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

    return { ok: true, tenantId: tenant.id as string, userId: created.user?.id ?? null };
  });
