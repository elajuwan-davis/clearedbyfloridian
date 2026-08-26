// Permits-only accounts.
//
// A handful of Cleared workspace seats exist purely to work permits — they can
// see and file everything on the Permits pages (shared workspace data) but get
// no admin role and no other portal section. The DB trigger already keeps
// `*.guest@cleared.com` accounts off the admin role (see handle_new_user);
// this module is the matching UI/route restriction.

const PERMITS_ONLY_PATTERN = /^(?:[^@]*\.guest|guest(?:\..*)?)@(?:cleared|floridianinc)\.com$/i;

/** Paths a permits-only seat may open. Everything else redirects to Permits. */
const ALLOWED_PREFIXES = ["/portal/permits"];

export const PERMITS_ONLY_HOME = "/portal/permits";

export function isPermitsOnlyEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized.length > 0 && PERMITS_ONLY_PATTERN.test(normalized);
}

export function isPermitsOnlyPathAllowed(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
