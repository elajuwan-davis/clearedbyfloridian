// Subcontractor Marketplace — paid access to Cleard's own roster.
// Access itself is enforced in Postgres (marketplace_access + RLS); this module
// only reads it, so hiding or showing UI can never grant the roster by mistake.

import { supabase } from "@/integrations/supabase/client";
import type { SubRow } from "@/lib/subs-api";
import { coverageGaps } from "@/lib/coverage-gaps";
import type { CoverageGap, ProjectInsuranceRequirements } from "@/lib/coverage-gaps";

export { coverageGaps };
export type { CoverageGap, ProjectInsuranceRequirements };

/**
 * One-time unlock price. Set MARKETPLACE_UNLOCK_PRICE_CENTS (server) and
 * VITE_MARKETPLACE_UNLOCK_PRICE_CENTS (client) to the real figure — the value
 * below is a placeholder for display only and the server refuses to open a
 * checkout without the real one configured.
 */
export const PLACEHOLDER_UNLOCK_PRICE_CENTS = 49900;

export function unlockPriceCents(): number {
  const raw = import.meta.env.VITE_MARKETPLACE_UNLOCK_PRICE_CENTS as string | undefined;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed)
    : PLACEHOLDER_UNLOCK_PRICE_CENTS;
}

export function unlockPriceIsPlaceholder(): boolean {
  const raw = import.meta.env.VITE_MARKETPLACE_UNLOCK_PRICE_CENTS as string | undefined;
  return !raw || !Number.isFinite(Number(raw));
}

export type MarketplaceAccessRow = {
  id: string;
  tenant_id: string;
  status: "pending" | "active" | "canceled";
  amount_cents: number | null;
  unlocked_at: string | null;
};

export type MarketplaceSub = {
  id: string;
  company_name: string;
  trade: string | null;
  qualifier_name: string | null;
  license_number: string | null;
  license_expiration: string | null;
  coi_expiration: string | null;
  insurance_carrier_name: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
  status: string | null;
  has_coi: boolean;
  has_license: boolean;
  has_w9: boolean;
};

/** Missing tables/columns (pre-migration) read as "no access", never as access. */
function isMissingSchema(err: { code?: string } | null): boolean {
  return err?.code === "42P01" || err?.code === "42703" || err?.code === "PGRST205";
}

type PgError = { code?: string; message: string } | null;
type PgResult<T> = { data: T | null; error: PgError };

/**
 * The marketplace tables are newer than the generated Supabase types, so the
 * query builder is described structurally here rather than left untyped.
 */
type LooseQuery<T> = {
  select(columns: string): LooseQuery<T>;
  order(column: string, opts?: { ascending?: boolean }): LooseQuery<T>;
  limit(n: number): LooseQuery<T>;
  update(values: Record<string, unknown>): LooseQuery<T>;
  eq(column: string, value: unknown): LooseQuery<T> & PromiseLike<PgResult<T>>;
  maybeSingle(): PromiseLike<PgResult<T>>;
} & PromiseLike<PgResult<T>>;

function table<T>(name: string): LooseQuery<T> {
  return supabase.from(name as never) as unknown as LooseQuery<T>;
}

export async function getMarketplaceAccess(): Promise<MarketplaceAccessRow | null> {
  const { data, error } = await table<MarketplaceAccessRow>("marketplace_access")
    .select("id, tenant_id, status, amount_cents, unlocked_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingSchema(error)) return null;
    throw new Error(error.message);
  }
  return data ?? null;
}

export async function marketplaceUnlocked(): Promise<boolean> {
  const row = await getMarketplaceAccess();
  return row?.status === "active";
}

export async function listMarketplaceRoster(): Promise<MarketplaceSub[]> {
  const { data, error } = await table<MarketplaceSub[]>("marketplace_roster")
    .select("*")
    .order("company_name", { ascending: true });
  if (error) {
    if (isMissingSchema(error)) return [];
    throw new Error(error.message);
  }
  return data ?? [];
}

/** Count only — safe to show a tenant that has not paid. */
export async function marketplaceRosterCount(trade?: string | null): Promise<number> {
  // Called as a method: the client is a proxy and loses its binding if `rpc`
  // is pulled off it first.
  const call = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<PgResult<number>>;
  try {
    const { data, error } = await call("marketplace_roster_count", { _trade: trade ?? null });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

/** Staff-only: list / unlist one of Cleard's subs on the marketplace. */
export async function setMarketplaceListed(subId: string, listed: boolean): Promise<void> {
  const { error } = await table<unknown>("subcontractors")
    .update({ marketplace_listed: listed })
    .eq("id", subId);
  if (error) throw new Error(error.message);
}

// --- Insurance / compliance disclosure -----------------------------------

/** Same check for one of the tenant's own subcontractor rows. */
export function ownSubCoverageGaps(sub: SubRow, req: ProjectInsuranceRequirements): CoverageGap[] {
  return coverageGaps(
    {
      coi_expiration: sub.coi_expiration,
      license_expiration: sub.license_expiration,
      has_coi: !!sub.coi_file_name,
      has_license: !!sub.license_file_name,
      has_w9: !!sub.w9_file_name,
    },
    req,
  );
}
