// Pure access-gate helpers for Google (or any) post-sign-in approval.
// Kept free of server-fn / Supabase imports so the decision logic can be unit-tested.

export type AccessDecision = {
  allowed: boolean;
  /** "approved" | "pending" | "filed" — filed = we just created the queue entry. */
  reason: "approved" | "pending" | "filed";
  email: string | null;
  role: string | null;
};

export type AccessRequestRow = {
  status: string;
  approved_tenant_id?: string | null;
};

const INTERNAL_PORTAL_DOMAIN = /@(cleared|floridianinc)\.com$/i;

/** Staff-domain seats (including permits-only guests) skip the request queue. */
export function isInternalPortalEmail(email: string | null | undefined): boolean {
  const key = (email ?? "").trim().toLowerCase();
  return key.length > 0 && INTERNAL_PORTAL_DOMAIN.test(key);
}

/**
 * Escape `\`, `%`, and `_` so a value can be used as an ILIKE exact match.
 * Unescaped, `john_doe@acme.com` would match `johnXdoe@acme.com`.
 */
export function escapeLikeExact(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function pickGrantedRole(roles: string[]): string | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("gc_owner")) return "gc_owner";
  if (roles.includes("subcontractor")) return "subcontractor";
  return roles[0] ?? null;
}

/**
 * True when `handle_new_user` auto-created a private tenant for an unmatched
 * signup (the path Google OAuth used to take). Invite and domain-join seats
 * attach to a pre-existing tenant or carry invite metadata.
 */
export function looksLikeUnapprovedSelfServe(opts: {
  isInternal: boolean;
  hasApprovedRequest: boolean;
  hasInviteMetadata: boolean;
  tenantMemberCount: number | null;
  userCreatedAt: string | null | undefined;
  tenantCreatedAt: string | null | undefined;
}): boolean {
  if (opts.isInternal || opts.hasApprovedRequest || opts.hasInviteMetadata) return false;
  if (opts.tenantMemberCount !== 1) return false;
  if (!opts.userCreatedAt || !opts.tenantCreatedAt) return false;
  const userMs = new Date(opts.userCreatedAt).getTime();
  const tenantMs = new Date(opts.tenantCreatedAt).getTime();
  if (!Number.isFinite(userMs) || !Number.isFinite(tenantMs)) return false;
  return Math.abs(tenantMs - userMs) <= 120_000;
}

export function decidePortalAccess(input: {
  email: string | null;
  roles: string[];
  hasTenantMembership: boolean;
  requests: AccessRequestRow[];
  selfServeSoloTenant: boolean;
}): AccessDecision {
  const emailKey = input.email ? input.email.trim().toLowerCase() : null;

  if (emailKey && isInternalPortalEmail(emailKey)) {
    return {
      allowed: true,
      reason: "approved",
      email: emailKey,
      role: pickGrantedRole(input.roles) ?? "admin",
    };
  }

  const approved = input.requests.find((r) => r.status === "approved");
  if (approved) {
    return {
      allowed: true,
      reason: "approved",
      email: emailKey,
      role: pickGrantedRole(input.roles) ?? "gc_owner",
    };
  }

  // A brand-new solo tenant is not an approval — it is the unmatched-signup
  // side effect the Google queue is supposed to catch.
  if (input.selfServeSoloTenant) {
    if (input.requests.length > 0) {
      return { allowed: false, reason: "pending", email: emailKey, role: null };
    }
    return { allowed: false, reason: "filed", email: emailKey, role: null };
  }

  const granted = pickGrantedRole(input.roles);
  if (granted) {
    return { allowed: true, reason: "approved", email: emailKey, role: granted };
  }
  if (input.hasTenantMembership) {
    return { allowed: true, reason: "approved", email: emailKey, role: "gc_member" };
  }
  if (input.requests.length > 0) {
    return { allowed: false, reason: "pending", email: emailKey, role: null };
  }
  if (!emailKey) {
    return { allowed: false, reason: "pending", email: null, role: null };
  }
  return { allowed: false, reason: "filed", email: emailKey, role: null };
}
