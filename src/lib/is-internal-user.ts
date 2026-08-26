// Returns true when the logged-in user is a Cleard internal team member.
// Used to gate internal-only UI (e.g. Contest Fee letter) from external GC/builder users.
//
// Both Cleard domains count — every @cleared.com and @floridianinc.com account is
// staff with the same access. The email is cached in localStorage by useSession()
// so Google sign-ins are recognised too, not just password logins.
const INTERNAL_DOMAINS = ["cleared.com", "floridianinc.com"];

export function internalEmail(email: string | null | undefined): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  // Permits-only guest seats live on a staff domain but are NOT internal staff.
  if (isPermitsOnlyEmail(normalized)) return false;
  return at > 0 && INTERNAL_DOMAINS.includes(normalized.slice(at + 1));
}

export function isInternalUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const email =
      localStorage.getItem("cleared_demo_user") ||
      localStorage.getItem("cleared_demo_user_email") ||
      "";
    return internalEmail(email);
  } catch {
    return false;
  }
}
