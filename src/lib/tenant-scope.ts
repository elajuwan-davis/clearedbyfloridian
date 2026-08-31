/**
 * How the portal decides which tenant's permits to show.
 *
 * Staff can switch between the full admin backend and a scoped client view.
 * Admin-mode with no client picked uses a sentinel so list helpers show
 * nothing instead of leaking every tenant's jobs.
 */

export type ViewMode = "admin" | "client";

/** Tenant the client-view toggle is currently scoped to (Flōridian). */
export const FLORIDIAN_TENANT_ID = "3e137bde-7c3b-46b6-bcf9-57b703fd5592";

/** Admin view with no client selected — data helpers must return empty. */
export const NO_CLIENT_SENTINEL = "__none__";

export type PermitListFilter = "none" | "all" | { tenantId: string };

/**
 * Tenant id the current view is scoped to.
 * Client mode always pins Flōridian, even if a different admin filter is set.
 * Admin mode with no pick is the empty-list sentinel, not "all tenants".
 */
export function resolveActiveTenantId(
  viewMode: ViewMode,
  selectedTenantId: string | null,
): string {
  if (viewMode === "client") return FLORIDIAN_TENANT_ID;
  return selectedTenantId ?? NO_CLIENT_SENTINEL;
}

export function shouldListNoPermits(tenantId: string | null | undefined): boolean {
  return tenantId === NO_CLIENT_SENTINEL;
}

/**
 * How `listPermits` (and the admin dashboard's own query) should scope rows.
 * `null` / `undefined` / `""` means no eq filter — the caller sees every
 * permit RLS already allows. The sentinel is the only "show nothing" value.
 */
export function permitListFilter(tenantId?: string | null): PermitListFilter {
  if (tenantId === NO_CLIENT_SENTINEL) return "none";
  if (tenantId) return { tenantId };
  return "all";
}
