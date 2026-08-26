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
import { z } from "zod";

const ADMIN_EMAILS = new Set([
  "elajuwan@floridianinc.com",
  "eman@floridianinc.com",
  "jose@floridianinc.com",
  "paul@floridianinc.com",
]);

function isAdminEmail(claims: Record<string, unknown> | undefined | null): boolean {
  const email = (claims as { email?: string } | null | undefined)?.email;
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

/** Cleard staff, by the app's own role table — the email allowlist only widens it. */
async function isStaff(
  supabase: { from: (table: string) => any },
  userId: string,
  claims: Record<string, unknown> | undefined | null,
): Promise<boolean> {
  if (isAdminEmail(claims)) return true;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: string }[]).some((r) => r.role === "admin");
}

/** Cleard's own accounts. A login owned outside these domains belongs to a customer. */
const INTERNAL_EMAIL_DOMAINS = ["cleared.com", "floridianinc.com"];

function isInternalEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  return at > 0 && INTERNAL_EMAIL_DOMAINS.includes(normalized.slice(at + 1));
}

/** Auth identity, not `profiles.email` — that column is owner/admin writable. */
async function ownerEmails(
  supabase: { auth: { admin: { getUserById: (id: string) => Promise<{ data: { user?: { email?: string | null } | null } }> } } },
  userIds: string[],
): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();
  const entries = await Promise.all(
    unique.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      return [id, data?.user?.email ?? null] as const;
    }),
  );
  return new Map(entries);
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
    const staff =
      data.scope === "all" &&
      (await isStaff(supabaseAdmin as any, context.userId, context.claims as any));
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

    const emailById = await ownerEmails(supabaseAdmin as any, [
      ...new Set(rows.map((r) => r.user_id)),
    ]);
    return rows
      .filter(
        (r) => r.user_id === context.userId || isInternalEmail(emailById.get(r.user_id) ?? null),
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
    if (!(await isStaff(supabaseAdmin as any, context.userId, context.claims as any))) {
      throw new Error("Forbidden");
    }
    if (data.user_id !== context.userId) {
      const emailById = await ownerEmails(supabaseAdmin as any, [data.user_id]);
      if (!isInternalEmail(emailById.get(data.user_id) ?? null)) throw new Error("Forbidden");
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
