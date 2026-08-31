/**
 * Staff view-mode helpers. The "__none__" empty-list sentinel is admin-only:
 * regular GCs must pass no extra tenant filter so RLS returns their own rows.
 */
export type ViewMode = "admin" | "client";

export const FLORIDIAN_TENANT_ID = "3e137bde-7c3b-46b6-bcf9-57b703fd5592";

/** Admin view with no client picked — data helpers must return no rows. */
export const NO_CLIENT_SELECTED = "__none__";

export function resolveActiveTenantId(input: {
  viewMode: ViewMode;
  selectedTenantId: string | null;
  isAdmin: boolean;
}): string | null {
  // Non-admins never use the staff client picker. Applying the empty sentinel
  // to them (the default viewMode is "admin") blanks My Permits, Documents,
  // Financials, Inspections, and the builder dashboard.
  if (!input.isAdmin) return null;
  if (input.viewMode === "client") return FLORIDIAN_TENANT_ID;
  return input.selectedTenantId ?? NO_CLIENT_SELECTED;
}
