// Who may see or decrypt a stored building-department login.
//
// Shared by the vault server fns and the admin importer so there is one definition of
// "Cleard staff" and one of "an internal Cleard account". A customer GC's credentials are
// never listed or decrypted for staff — we hold them, we do not read them.

type MinimalSupabase = { from: (table: string) => any };

const ADMIN_EMAILS = new Set([
  "elajuwan@floridianinc.com",
  "eman@floridianinc.com",
  "jose@floridianinc.com",
  "paul@floridianinc.com",
]);

/** Cleard's own accounts. A login owned outside these domains belongs to a customer. */
export const INTERNAL_EMAIL_DOMAINS = ["cleared.com", "floridianinc.com"];

export function isInternalEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  return at > 0 && INTERNAL_EMAIL_DOMAINS.includes(normalized.slice(at + 1));
}

function isAdminEmail(claims: Record<string, unknown> | undefined | null): boolean {
  const email = (claims as { email?: string } | null | undefined)?.email;
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

/** Cleard staff, by the app's own role table — the email allowlist only widens it. */
export async function isStaff(
  supabase: MinimalSupabase,
  userId: string,
  claims: Record<string, unknown> | undefined | null,
): Promise<boolean> {
  if (isAdminEmail(claims)) return true;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: string }[]).some((r) => r.role === "admin");
}

export async function ownerEmails(
  supabase: MinimalSupabase,
  userIds: string[],
): Promise<Map<string, string | null>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("id, email").in("id", userIds);
  return new Map(
    ((data ?? []) as { id: string; email: string | null }[]).map((p) => [p.id, p.email]),
  );
}
