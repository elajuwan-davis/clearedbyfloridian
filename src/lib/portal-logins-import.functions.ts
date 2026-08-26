// Admin-only bulk import of the Building Department Login sheet into the encrypted vault.
//
// Exists because the CLI (scripts/import-portal-logins.ts) needs APP_USER_CONNECTION_KEY_SECRET,
// which is write-only in Lovable's vault — nobody can read it to run the script. Here the import
// happens inside the app's own server runtime, where that key already lives: the sheet is pasted
// as delimited text, classified by the same pure logic the CLI uses, and encrypted with the same
// encryptSecret(). The key never leaves the server and no credential is ever sent back to the
// browser — a dry run answers with row/city/status only.
//
// Rows are attributed to an internal Cleard account, never a customer GC's, so the import cannot
// be used to push credentials into the staff-shared view.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { RowResult } from "@/lib/portal-logins-import";

export type InternalOwner = { user_id: string; email: string };

export type ImportSummary = {
  applied: boolean;
  owner_email: string;
  /** No credentials — city/status/reason only, safe to render. */
  rows: RowResult[];
  counts: { import: number; skip: number; error: number };
  /** Rows actually written (0 on a dry run). */
  written: number;
};

/** Cleard accounts the import may be attributed to. Customer GCs are deliberately absent. */
export const listInternalOwners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InternalOwner[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isInternalEmail, isStaff } = await import("@/lib/portal-logins-access.server");
    if (!(await isStaff(supabaseAdmin as any, context.userId, context.claims as any))) {
      throw new Error("Forbidden");
    }
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .order("email", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as { id: string; email: string | null }[])
      .filter((p) => isInternalEmail(p.email) && !(p.email ?? "").endsWith("@test.invalid"))
      .map((p) => ({ user_id: p.id, email: (p.email ?? "").toLowerCase() }));
  });

const ImportSchema = z.object({
  /** The sheet as pasted delimited text (CSV, or the TSV a spreadsheet paste produces). */
  sheet: z.string().min(1).max(500_000),
  owner_user_id: z.string().uuid(),
  /** Which tenant to file the rows under, when the owner belongs to more than one. */
  tenant_id: z.string().uuid().optional().nullable(),
  /** Import cities that aren't in the municipality catalog instead of erroring on them. */
  allow_unmatched: z.boolean().default(false),
  /** Dry run unless this is explicitly true. */
  apply: z.boolean().default(false),
});

/**
 * Classify the pasted sheet and, only when `apply` is true, encrypt and upsert it. Both modes
 * run the same classification, so an apply cannot write a row the operator never previewed.
 */
export const importPortalLogins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ImportSchema.parse(data))
  .handler(async ({ data, context }): Promise<ImportSummary> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isInternalEmail, isStaff, ownerEmails } =
      await import("@/lib/portal-logins-access.server");
    const { classifyRows, parseDelimited } = await import("@/lib/portal-logins-import");

    if (!(await isStaff(supabaseAdmin as any, context.userId, context.claims as any))) {
      throw new Error("Forbidden");
    }

    const ownerEmail = (await ownerEmails(supabaseAdmin as any, [data.owner_user_id])).get(
      data.owner_user_id,
    );
    if (!ownerEmail) throw new Error("That account no longer exists.");
    if (!isInternalEmail(ownerEmail)) {
      throw new Error(
        "Imported logins can only be filed under an internal Cleard account — a customer GC's " +
          "credentials must be entered by the customer.",
      );
    }

    const rows = classifyRows(parseDelimited(data.sheet), {
      allowUnmatched: data.allow_unmatched,
    });
    const counts = {
      import: rows.filter((r) => r.status === "import").length,
      skip: rows.filter((r) => r.status === "skip").length,
      error: rows.filter((r) => r.status === "error").length,
    };
    // Strip the record (it carries plaintext) before anything goes back to the browser.
    const safeRows = rows.map(({ record: _record, ...rest }) => rest) as RowResult[];
    if (!data.apply) {
      return { applied: false, owner_email: ownerEmail, rows: safeRows, counts, written: 0 };
    }

    const tenantId = await resolveTenant(supabaseAdmin as any, data.owner_user_id, data.tenant_id);
    const { encryptSecret } = await import("@/lib/portal-logins-crypto.server");
    const payload = rows
      .filter((r) => r.record)
      .map((r) => ({
        user_id: data.owner_user_id,
        tenant_id: tenantId,
        municipality_slug: r.record!.municipality_slug,
        city_name: r.record!.city_name,
        username_ciphertext: encryptSecret(r.record!.username),
        password_ciphertext: encryptSecret(r.record!.password),
        notes: r.record!.notes,
        portal_url: r.record!.portal_url,
        registration: null,
        e_plan: false,
        derm: false,
        updated_at: new Date().toISOString(),
      }));
    if (payload.length > 0) {
      const { error } = await supabaseAdmin
        .from("gc_portal_logins" as any)
        .upsert(payload, { onConflict: "user_id,municipality_slug" });
      if (error) throw new Error(error.message);
    }
    return {
      applied: true,
      owner_email: ownerEmail,
      rows: safeRows,
      counts,
      written: payload.length,
    };
  });

async function resolveTenant(
  supabase: { from: (table: string) => any },
  userId: string,
  override: string | null | undefined,
): Promise<string | null> {
  if (override) return override;
  const { data, error } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const tenantIds = [...new Set(((data ?? []) as { tenant_id: string }[]).map((m) => m.tenant_id))];
  if (tenantIds.length > 1) {
    throw new Error(
      `That account belongs to ${tenantIds.length} tenants — pick the tenant to file these logins under.`,
    );
  }
  return tenantIds[0] ?? null;
}
