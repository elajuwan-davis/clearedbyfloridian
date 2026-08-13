// Manually logged municipal permit fees — the "city fee" side of the Financials
// comparison. Backed by public.permit_fees (migration 20260813120000).

import { supabase } from "@/integrations/supabase/client";

export type ManualFeeType =
  | "Total Permit Fee"
  | "Building Permit Fee"
  | "Electrical Permit Fee"
  | "Plumbing Permit Fee"
  | "Mechanical Permit Fee"
  | "Other";

export const FEE_TYPES: ManualFeeType[] = [
  "Total Permit Fee",
  "Building Permit Fee",
  "Electrical Permit Fee",
  "Plumbing Permit Fee",
  "Mechanical Permit Fee",
  "Other",
];

export type ManualFee = {
  id: string;
  /** A real permits.id. */
  projectId: string;
  feeType: ManualFeeType;
  amountCents: number;
  notes?: string;
  datePaid: string; // ISO yyyy-mm-dd
  createdAt: string;
};

type FeeRow = {
  id: string;
  permit_id: string;
  fee_type: string;
  amount_cents: number;
  notes: string | null;
  date_paid: string;
  created_at: string;
};

/**
 * `permit_fees` is not in the generated Supabase types yet, so the query builder
 * is described structurally rather than reached for through `any`.
 */
type Result = { data: unknown; error: { message: string } | null };
type Filter = PromiseLike<Result> & {
  eq: (column: string, value: string) => Filter;
  order: (column: string, opts: { ascending: boolean }) => Filter;
  maybeSingle: () => PromiseLike<Result>;
  single: () => PromiseLike<Result>;
  select: (columns: string) => Filter;
};
type Table = {
  select: (columns: string) => Filter;
  insert: (row: Record<string, unknown>) => Filter;
  update: (patch: Record<string, unknown>) => Filter;
  delete: () => Filter;
};

function table(name: string): Table {
  return supabase.from(name as never) as unknown as Table;
}

function toFee(r: FeeRow): ManualFee {
  return {
    id: r.id,
    projectId: r.permit_id,
    feeType: r.fee_type as ManualFeeType,
    amountCents: Number(r.amount_cents ?? 0),
    notes: r.notes ?? undefined,
    datePaid: r.date_paid,
    createdAt: r.created_at,
  };
}

/** Notifies the views that render fee lists; they re-fetch on this. */
function announceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("manual-fees:changed"));
}

export async function listAllFees(): Promise<ManualFee[]> {
  const { data, error } = await table("permit_fees")
    .select("*")
    .order("date_paid", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FeeRow[]).map(toFee);
}

export async function listFeesForProject(projectId: string): Promise<ManualFee[]> {
  const { data, error } = await table("permit_fees")
    .select("*")
    .eq("permit_id", projectId)
    .order("date_paid", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FeeRow[]).map(toFee);
}

export async function totalForProject(projectId: string): Promise<number> {
  const fees = await listFeesForProject(projectId);
  return fees.reduce((s, f) => s + f.amountCents, 0);
}

async function tenantIdForPermit(permitId: string): Promise<string | null> {
  const { data } = await table("permits").select("tenant_id").eq("id", permitId).maybeSingle();
  return (data as { tenant_id?: string } | null)?.tenant_id ?? null;
}

export async function addFee(fee: Omit<ManualFee, "id" | "createdAt">): Promise<ManualFee> {
  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id ?? null;
  const tenantId = await tenantIdForPermit(fee.projectId);
  if (!tenantId) throw new Error("That permit could not be found.");

  const { data, error } = await table("permit_fees")
    .insert({
      permit_id: fee.projectId,
      tenant_id: tenantId,
      fee_type: fee.feeType,
      amount_cents: fee.amountCents,
      notes: fee.notes ?? null,
      date_paid: fee.datePaid,
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  announceChange();
  return toFee(data as FeeRow);
}

export async function updateFee(
  id: string,
  patch: Partial<Omit<ManualFee, "id" | "createdAt">>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.projectId !== undefined) row.permit_id = patch.projectId;
  if (patch.feeType !== undefined) row.fee_type = patch.feeType;
  if (patch.amountCents !== undefined) row.amount_cents = patch.amountCents;
  if (patch.notes !== undefined) row.notes = patch.notes || null;
  if (patch.datePaid !== undefined) row.date_paid = patch.datePaid;

  const { error } = await table("permit_fees").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  announceChange();
}

export async function deleteFee(id: string): Promise<void> {
  const { error } = await table("permit_fees").delete().eq("id", id);
  if (error) throw new Error(error.message);
  announceChange();
}

export function fmtUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseDollarsToCents(v: string): number {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  if (!isFinite(n)) return 0;
  return Math.round(n * 100);
}
