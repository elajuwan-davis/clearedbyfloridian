/**
 * The only profile columns a CRM capture is allowed to touch.
 *
 * PostgREST upserts a full row: omitted columns are written as NULL / column
 * defaults. `ensure_profile_for_new_user` has already inserted name, email,
 * company, and ID-doc paths — a CRM-only upsert would wipe them. Always UPDATE.
 */
export function crmProfilePatch(input: {
  crm: string;
  crm_other?: string | null;
  source: "signup_form" | "google";
  capturedAt?: string;
}): {
  current_crm: string;
  current_crm_other: string | null;
  crm_source: "signup_form" | "google";
  crm_captured_at: string;
} {
  return {
    current_crm: input.crm,
    current_crm_other: input.crm_other?.trim() || null,
    crm_source: input.source,
    crm_captured_at: input.capturedAt ?? new Date().toISOString(),
  };
}
