// GC building-department portal login credentials.
// Stored encrypted (AES-256-GCM) so plaintext is never readable in the DB.
//
// - Save/List (has_login flag only) callable by authenticated GC users.
// - Reveal (decrypt) is admin-only (Flōridian staff), used at portal-submission time.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ADMIN_EMAILS = new Set([
  "elajuwan@floridianinc.com",
  "eman@floridianinc.com",
  "jose@floridianinc.com",
  "paul@floridianinc.com",
]);

function isAdmin(claims: Record<string, unknown> | undefined | null): boolean {
  const email = (claims as { email?: string } | null | undefined)?.email;
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

const SaveSchema = z.object({
  municipality_slug: z.string().min(1).max(200),
  city_name: z.string().min(1).max(200),
  username: z.string().min(1).max(500),
  password: z.string().min(1).max(500),
  notes: z.string().max(2000).optional().nullable(),
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
        municipality_slug: data.municipality_slug,
        city_name: data.city_name,
        username_ciphertext: encryptSecret(data.username),
        password_ciphertext: encryptSecret(data.password),
        notes: data.notes ?? null,
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

// Returns which municipalities the current GC has stored logins for.
// No plaintext is returned — only presence flags + notes + updated_at.
export const listPortalLoginFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("gc_portal_logins" as any)
      .select("municipality_slug, city_name, notes, updated_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Array<{
      municipality_slug: string;
      city_name: string;
      notes: string | null;
      updated_at: string;
    }>;
  });

// Admin-only reveal for Flōridian staff to log into portals on behalf of GCs.
export const revealPortalLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ user_id: z.string().uuid(), municipality_slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!isAdmin(context.claims as any)) throw new Error("Forbidden");
    const { decryptSecret } = await import("@/lib/portal-logins-crypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
