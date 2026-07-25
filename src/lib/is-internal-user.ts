// Returns true when the logged-in user is a Cleard internal team member.
// Used to gate internal-only UI (e.g. Contest Fee letter) from external GC/builder users.
export function isInternalUser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const email = (localStorage.getItem("cleared_demo_user") || "").toLowerCase();
    if (!email) return false;
    return email.endsWith("@floridianinc.com");
  } catch {
    return false;
  }
}
