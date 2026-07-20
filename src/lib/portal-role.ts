// Portal user role — controls which action buttons render (notary/signature).
// Persisted in localStorage; internal team can override in dev.

export type PortalRole = "gc" | "homeowner" | "subcontractor" | "internal";

const KEY = "cleared_portal_role";

export function getPortalRole(): PortalRole {
  if (typeof window === "undefined") return "gc";
  const v = window.localStorage.getItem(KEY) as PortalRole | null;
  if (v) return v;
  // Default: internal if email is @floridianinc.com; otherwise gc.
  const email = window.localStorage.getItem("cleared_demo_user_email") || "";
  return email.toLowerCase().endsWith("@floridianinc.com") ? "internal" : "gc";
}

export function setPortalRole(role: PortalRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, role);
  window.dispatchEvent(new CustomEvent("portal-role:changed"));
}

export function canRequestNotary(role: PortalRole): boolean {
  return role === "gc" || role === "homeowner" || role === "internal";
}
