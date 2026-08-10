// Subcontractor Marketplace — paid access to Cleard's own roster.
// Access itself is enforced in Postgres (marketplace_access + RLS); this module
// only reads it, so hiding or showing UI can never grant the roster by mistake.

import { supabase } from "@/integrations/supabase/client";
import type { SubRow } from "@/lib/subs-api";

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
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<PgResult<number>>;
  const { data, error } = await rpc("marketplace_roster_count", { _trade: trade ?? null });
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}

/** Staff-only: list / unlist one of Cleard's subs on the marketplace. */
export async function setMarketplaceListed(subId: string, listed: boolean): Promise<void> {
  const { error } = await table<unknown>("subcontractors")
    .update({ marketplace_listed: listed })
    .eq("id", subId);
  if (error) throw new Error(error.message);
}

// --- Insurance / compliance disclosure -----------------------------------

export type ProjectInsuranceRequirements = {
  /** Cover has to still be in force on this date for this project. */
  coverageNeededThrough: string | null;
  w9Required: boolean;
};

export type CoverageGap = {
  field: "coi" | "coi_expiration" | "license" | "license_expiration" | "w9";
  message: string;
};

function isExpiredBy(date: string | null | undefined, by: string): boolean {
  if (!date) return false;
  return date < by;
}

/**
 * Compare one sub's insurance/licensing against a project's requirements.
 * Returns every gap found; an empty array means nothing to disclose.
 */
export function coverageGaps(
  sub: Pick<
    MarketplaceSub,
    "coi_expiration" | "license_expiration" | "has_coi" | "has_license" | "has_w9"
  >,
  req: ProjectInsuranceRequirements,
): CoverageGap[] {
  const today = new Date().toISOString().slice(0, 10);
  const through = req.coverageNeededThrough || today;
  const gaps: CoverageGap[] = [];

  if (!sub.has_coi) {
    gaps.push({ field: "coi", message: "No certificate of insurance on file" });
  }
  if (!sub.coi_expiration) {
    gaps.push({ field: "coi_expiration", message: "COI expiration date unknown" });
  } else if (isExpiredBy(sub.coi_expiration, today)) {
    gaps.push({ field: "coi_expiration", message: `COI expired ${sub.coi_expiration}` });
  } else if (isExpiredBy(sub.coi_expiration, through)) {
    gaps.push({
      field: "coi_expiration",
      message: `COI expires ${sub.coi_expiration}, before this project needs cover through ${through}`,
    });
  }

  if (!sub.has_license) {
    gaps.push({ field: "license", message: "No license document on file" });
  }
  if (!sub.license_expiration) {
    gaps.push({ field: "license_expiration", message: "License expiration date unknown" });
  } else if (isExpiredBy(sub.license_expiration, today)) {
    gaps.push({
      field: "license_expiration",
      message: `License expired ${sub.license_expiration}`,
    });
  }

  if (req.w9Required && !sub.has_w9) {
    gaps.push({ field: "w9", message: "No W-9 on file" });
  }

  return gaps;
}

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
