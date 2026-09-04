// Email-domain auto-join (`tenants.allowed_domain`) is a capability, not a vanity
// field: handle_new_user() attaches every new auth user whose address matches to
// that tenant as gc_member. After /join became public, any self-serve owner could
// type `gmail.com` (or a competitor's domain) on /profile and capture later
// Google sign-ups. These helpers are the single policy for what may be stored.

/** Consumer / disposable providers that thousands of unrelated people share. */
export const PUBLIC_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "tutanota.com",
  "tutamail.com",
  "hey.com",
]);

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function emailDomain(email: string | null | undefined): string | null {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized.slice(at + 1);
}

export function normalizeAllowedDomain(raw: string | null | undefined): string | null {
  const domain = (raw ?? "").trim().toLowerCase().replace(/^@+/, "");
  return domain || null;
}

export function isPublicEmailDomain(domain: string): boolean {
  return PUBLIC_EMAIL_DOMAINS.has(domain.trim().toLowerCase());
}

/**
 * Returns the domain to persist, or null to clear. Throws on a value that would
 * let this tenant capture sign-ups it does not own.
 *
 * `ownerEmail` MUST be the auth identity (JWT / auth.users), not `profiles.email`,
 * which the row owner can edit.
 */
export function resolveAllowedDomain(
  raw: string | null | undefined,
  ownerEmail: string | null | undefined,
): string | null {
  const domain = normalizeAllowedDomain(raw);
  if (!domain) return null;
  if (!DOMAIN_RE.test(domain)) {
    throw new Error("Enter a valid company domain (for example acme.com).");
  }
  if (isPublicEmailDomain(domain)) {
    throw new Error(
      "Public email providers (Gmail, Outlook, Yahoo, …) cannot be used for auto-join. Use a company domain, or send invite links instead.",
    );
  }
  const owner = emailDomain(ownerEmail);
  if (!owner || owner !== domain) {
    throw new Error("You can only enable auto-join for the domain on your own email address.");
  }
  return domain;
}
