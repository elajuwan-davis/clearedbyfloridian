// GC building-department portal login credentials.
// Stored encrypted (AES-256-GCM) so plaintext is never readable in the DB.
//
// - Save/List (metadata + has_login flags only) callable by authenticated GC users.
// - Reveal (decrypt) only via controlled server fns — never via a direct table select.
// - Owner can reveal their own credentials. Cleard staff (admin role) additionally share
//   the logins owned by internal Cleard accounts, because Cleard files its own permits
//   here. A customer GC's credentials are never listed or revealed to staff — storing
//   them is one thing, letting us read them is a privacy violation.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AuthIdentityClient, RoleTableClient } from "@/lib/portal-logins-access.server";
import { z } from "zod";

/** The service-role client, narrowed to what the access helpers read. */
function accessClient(client: unknown): RoleTableClient & AuthIdentityClient {
  return client as RoleTableClient & AuthIdentityClient;
}

export type PortalLoginFlag = {
  id: string;
  municipality_slug: string;
  city_name: string;
  notes: string | null;
  updated_at: string;
  portal_url: string | null;
  registration: string | null;
  e_plan: boolean;
  derm: boolean;
  tenant_id: string | null;
  user_id: string;
  /** Set only on the staff-wide view, so an admin can tell whose vault a row is. */
  owner_email?: string | null;
};

const SaveSchema = z.object({
  municipality_slug: z.string().min(1).max(200),
  city_name: z.string().min(1).max(200),
  username: z.string().min(1).max(500),
  password: z.string().min(1).max(500),
  notes: z.string().max(2000).optional().nullable(),
  portal_url: z.string().max(500).optional().nullable(),
  registration: z.string().max(500).optional().nullable(),
  e_plan: z.boolean().optional(),
  derm: z.boolean().optional(),
  tenant_id: z.string().uuid().optional().nullable(),
});

export const savePortalLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { encryptSecret } = await import("@/lib/portal-logins-crypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("gc_portal_logins" as any).upsert(
      {
        user_id: context.userId,
        tenant_id: data.tenant_id ?? null,
        municipality_slug: data.municipality_slug,
        city_name: data.city_name,
        username_ciphertext: encryptSecret(data.username),
        password_ciphertext: encryptSecret(data.password),
        notes: data.notes ?? null,
        portal_url: data.portal_url ?? null,
        registration: data.registration ?? null,
        e_plan: data.e_plan ?? false,
        derm: data.derm ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,municipality_slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePortalLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ municipality_slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("gc_portal_logins" as any)
      .delete()
      .eq("user_id", context.userId)
      .eq("municipality_slug", data.municipality_slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ListSchema = z.object({ scope: z.enum(["own", "all"]).default("own") });

/**
 * Metadata only — no ciphertext. `scope: "all"` is honoured for Cleard staff only, and
 * even then widens the view just to logins owned by internal Cleard accounts (we file
 * our own permits here) plus the caller's own. Customer GCs' logins stay invisible to
 * us; everyone else, and the default, sees only their own.
 */
export const listPortalLoginFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ListSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isStaff, ownerEmails, staffMaySeeVaultRow } =
      await import("@/lib/portal-logins-access.server");
    const staff =
      data.scope === "all" &&
      (await isStaff(accessClient(supabaseAdmin), context.userId, context.claims));
    let query = supabaseAdmin
      .from("gc_portal_logins" as any)
      .select(
        "id, user_id, tenant_id, municipality_slug, city_name, notes, updated_at, portal_url, registration, e_plan, derm",
      )
      .order("city_name", { ascending: true });
    if (!staff) query = query.eq("user_id", context.userId);
    const { data: found, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (found ?? []) as unknown as PortalLoginFlag[];
    if (!staff || rows.length === 0) return rows;

    const emailById = await ownerEmails(accessClient(supabaseAdmin), [
      ...new Set(rows.map((r) => r.user_id)),
    ]);
    return rows
      .filter((r) =>
        staffMaySeeVaultRow(r.user_id, context.userId, emailById.get(r.user_id) ?? null),
      )
      .map((r) => ({ ...r, owner_email: emailById.get(r.user_id) ?? null }));
  });

/** Owner reveal — decrypt only the caller's own credentials. */
export const revealOwnPortalLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ municipality_slug: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { decryptSecret } = await import("@/lib/portal-logins-crypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("gc_portal_logins" as any)
      .select("username_ciphertext, password_ciphertext, notes")
      .eq("user_id", context.userId)
      .eq("municipality_slug", data.municipality_slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      username: decryptSecret((row as any).username_ciphertext),
      password: decryptSecret((row as any).password_ciphertext),
      notes: (row as any).notes as string | null,
    };
  });

/**
 * Staff reveal for a login owned by another internal Cleard account. Never a customer
 * GC's credentials — those decrypt only for their owner.
 */
export const revealPortalLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ user_id: z.string().uuid(), municipality_slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { decryptSecret } = await import("@/lib/portal-logins-crypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isStaff, ownerEmails, staffMaySeeVaultRow } =
      await import("@/lib/portal-logins-access.server");
    if (!(await isStaff(accessClient(supabaseAdmin), context.userId, context.claims))) {
      throw new Error("Forbidden");
    }
    if (data.user_id !== context.userId) {
      const emailById = await ownerEmails(accessClient(supabaseAdmin), [data.user_id]);
      if (!staffMaySeeVaultRow(data.user_id, context.userId, emailById.get(data.user_id))) {
        throw new Error("Forbidden");
      }
    }
    const { data: row, error } = await supabaseAdmin
      .from("gc_portal_logins" as any)
      .select("username_ciphertext, password_ciphertext, notes")
      .eq("user_id", data.user_id)
      .eq("municipality_slug", data.municipality_slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      username: decryptSecret((row as any).username_ciphertext),
      password: decryptSecret((row as any).password_ciphertext),
      notes: (row as any).notes as string | null,
    };
  });
