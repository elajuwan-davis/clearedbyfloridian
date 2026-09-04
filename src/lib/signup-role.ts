/**
 * Role granted when a new auth.users row is created.
 *
 * `handle_new_user()` used to copy `raw_user_meta_data.role` into `user_roles`.
 * Public `supabase.auth.signUp()` lets the browser set that metadata, so anyone
 * could mint `admin` (or join an existing tenant as `gc_owner`). This helper is
 * the contract the trigger in
 * `supabase/migrations/20260830180000_lock_signup_roles.sql` must stay aligned
 * with — keep the two in lockstep.
 */

export type SignupRole = "admin" | "gc_owner" | "gc_member" | "subcontractor";

const STAFF_DOMAINS = new Set(["cleared.com", "floridianinc.com"]);

export function emailParts(email: string): { local: string; domain: string } {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return { local: normalized, domain: "" };
  return { local: normalized.slice(0, at), domain: normalized.slice(at + 1) };
}

function isPermitsOnlyLocal(local: string): boolean {
  return local.endsWith(".guest") || local.startsWith("guest.") || local === "guest";
}

/** Staff-domain mailbox that is allowed to hold the `admin` role. Guest seats cannot. */
export function canHoldAdminRole(email: string | null | undefined): boolean {
  if (!email) return false;
  const { local, domain } = emailParts(email);
  return STAFF_DOMAINS.has(domain) && !isPermitsOnlyLocal(local);
}

export type ResolveSignupRoleInput = {
  email: string;
  metadataRole?: string | null;
  /** A valid invite token was consumed (shareable /join/:token link). */
  inviteConsumed?: boolean;
  /** Email domain matched tenants.allowed_domain. */
  joinedByAllowedDomain?: boolean;
  /** No tenant was found; the trigger will insert a new trial tenant. */
  creatingNewTenant?: boolean;
  /** tenant_id was present in raw_user_meta_data (service-role create/invite). */
  hasMetadataTenantId?: boolean;
  /** That tenant already has at least one member. */
  tenantAlreadyHasMembers?: boolean;
};

export type SignupGrant = {
  role: SignupRole;
  /** When false the trigger writes no tenant_members row (invite fns upsert after). */
  attachTenant: boolean;
};

/**
 * Decide the role written to user_roles / tenant_members for a new auth user.
 * Staff-domain emails are resolved here too so tests cover the early-return branch.
 */
export function resolveSignupRole(input: ResolveSignupRoleInput): SignupGrant {
  const { local, domain } = emailParts(input.email);
  if (STAFF_DOMAINS.has(domain)) {
    return { role: isPermitsOnlyLocal(local) ? "gc_member" : "admin", attachTenant: true };
  }

  // Service-role subcontractor invites set this; public sign-up as a lone
  // subcontractor is a weaker hole than admin and is required for that invite path.
  if (input.metadataRole === "subcontractor") {
    return { role: "subcontractor", attachTenant: false };
  }

  if (input.inviteConsumed || input.joinedByAllowedDomain) {
    return { role: "gc_member", attachTenant: true };
  }

  if (input.creatingNewTenant) return { role: "gc_owner", attachTenant: true };

  if (input.hasMetadataTenantId) {
    // A populated tenant_id in client metadata is not proof of invitation.
    // Service-role invite/approve functions upsert membership themselves.
    if (input.tenantAlreadyHasMembers) {
      return { role: "gc_member", attachTenant: false };
    }
    const requested =
      input.metadataRole === "gc_owner" || input.metadataRole === "gc_member"
        ? input.metadataRole
        : "gc_member";
    return { role: requested, attachTenant: true };
  }

  return { role: "gc_member", attachTenant: true };
}
