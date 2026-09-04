// Shared upsert payload for gc_portal_logins.
//
// Postgres ON CONFLICT only updates columns present in the INSERT. Callers that
// only send username/password (Departments "Edit", the permit popover, readiness
// "Add Login") must not default the omitted metadata to null/false — that would
// wipe portal_url, registration, e_plan, derm, and tenant_id on an existing row.

export type PortalLoginSaveInput = {
  municipality_slug: string;
  city_name: string;
  username: string;
  password: string;
  notes?: string | null;
  portal_url?: string | null;
  registration?: string | null;
  e_plan?: boolean;
  derm?: boolean;
  tenant_id?: string | null;
};

export type PortalLoginUpsertRow = {
  user_id: string;
  municipality_slug: string;
  city_name: string;
  username_ciphertext: string;
  password_ciphertext: string;
  updated_at: string;
  notes?: string | null;
  portal_url?: string | null;
  registration?: string | null;
  e_plan?: boolean;
  derm?: boolean;
  tenant_id?: string | null;
};

export function portalLoginUpsertRow(
  userId: string,
  data: PortalLoginSaveInput,
  encrypt: (plaintext: string) => string,
  now: Date = new Date(),
): PortalLoginUpsertRow {
  const row: PortalLoginUpsertRow = {
    user_id: userId,
    municipality_slug: data.municipality_slug,
    city_name: data.city_name,
    username_ciphertext: encrypt(data.username),
    password_ciphertext: encrypt(data.password),
    updated_at: now.toISOString(),
  };
  if (data.notes !== undefined) row.notes = data.notes;
  if (data.portal_url !== undefined) row.portal_url = data.portal_url;
  if (data.registration !== undefined) row.registration = data.registration;
  if (data.e_plan !== undefined) row.e_plan = data.e_plan;
  if (data.derm !== undefined) row.derm = data.derm;
  if (data.tenant_id !== undefined) row.tenant_id = data.tenant_id;
  return row;
}
