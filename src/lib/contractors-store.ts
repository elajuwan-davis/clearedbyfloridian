// Registered contractors — used to pre-fill NTBO / Owner Auth forms.
// Backed by public.registered_contractors (migration 20260813130000).

import { supabase } from "@/integrations/supabase/client";

export type Contractor = {
  id: string;
  firm_name: string;
  contact_name: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
  license_type: string; // e.g. CPC, CGC, EC, CFC, CAC
  active: boolean;
  created_at: string;
};

const EVT = "contractors:changed";

/**
 * `registered_contractors` is not in the generated Supabase types yet, so the
 * query builder is described structurally rather than reached for through `any`.
 */
type Result = { data: unknown; error: { message: string } | null };
type Filter = PromiseLike<Result> & {
  eq: (column: string, value: string | boolean) => Filter;
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

function table(): Table {
  return supabase.from("registered_contractors" as never) as unknown as Table;
}

function announceChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT));
}

export async function listContractors(activeOnly = false): Promise<Contractor[]> {
  let q = table().select("*").order("firm_name", { ascending: true });
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Contractor[];
}

export async function getContractor(id: string): Promise<Contractor | undefined> {
  const { data, error } = await table().select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Contractor | null) ?? undefined;
}

export async function addContractor(
  input: Omit<Contractor, "id" | "created_at">,
): Promise<Contractor> {
  const { data, error } = await table().insert(input).select("*").single();
  if (error) throw new Error(error.message);
  announceChange();
  return data as Contractor;
}

export async function updateContractor(id: string, patch: Partial<Contractor>): Promise<void> {
  const { id: _ignored, created_at: _created, ...rest } = patch;
  const { error } = await table()
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  announceChange();
}

export async function deleteContractor(id: string): Promise<void> {
  const { error } = await table().delete().eq("id", id);
  if (error) throw new Error(error.message);
  announceChange();
}

export function subscribeContractors(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

export const LICENSE_TYPES = [
  "CPC",
  "CGC",
  "CBC",
  "CRC",
  "EC",
  "CFC",
  "CAC",
  "SI",
  "Other",
] as const;
