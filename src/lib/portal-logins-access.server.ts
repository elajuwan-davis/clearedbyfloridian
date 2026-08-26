// Who may see or decrypt a stored building-department login.
//
// Shared by the vault server fns and the admin importer so there is one definition of
// "Cleard staff" and one of "an internal Cleard account". A customer GC's credentials are
// never listed or decrypted for staff — we hold them, we do not read them.

/**
 * The slivers of the service-role client these helpers use. Narrow on purpose: the Supabase
 * client's generated types don't describe every table this app has, so callers hand it over as
 * `supabaseAdmin as unknown as RoleTableClient`.
 */
export type RoleTableClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: { role: string }[] | null }>;
    };
  };
};

export type AuthIdentityClient = {
  auth: {
    admin: {
      getUserById: (id: string) => Promise<{ data: { user?: { email?: string | null } | null } }>;
      listUsers: (params: { page: number; perPage: number }) => Promise<{
        data: { users?: { id: string; email?: string | null }[] | null } | null;
        error: { message: string } | null;
      }>;
    };
  };
};

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
  supabase: RoleTableClient,
  userId: string,
  claims: Record<string, unknown> | undefined | null,
): Promise<boolean> {
  if (isAdminEmail(claims)) return true;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: string }[]).some((r) => r.role === "admin");
}

/** Auth identity, not `profiles.email` — that column is owner/admin writable. */
export async function ownerEmails(
  supabase: AuthIdentityClient,
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
