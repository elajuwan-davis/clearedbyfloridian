import { supabase } from "@/integrations/supabase/client";

export type PermitStatus =
  | "submitted"
  | "in_review"
  | "corrections_required"
  | "approved"
  | "permit_issued"
  | "on_hold"
  | "outsourced_permitting"
  | "cancelled";

export type PermitDoc = {
  key: string;
  label: string;
  required: boolean;
  status: "uploaded" | "pending" | "not_applicable" | "missing";
  filename: string | null;
};

export type PermitSub = {
  trade: string;
  companyName: string;
  qualifierName?: string;
  licenseNumber?: string;
  contactEmail?: string;
  insuranceCarrierEmail?: string;
};

export type PermitRow = {
  id: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  owner_name: string | null;
  owner_entity: string | null;
  job_address: string;
  city: string | null;
  county: string | null;
  municipality: string | null;
  permit_type: string | null;
  permit_number: string | null;
  construction_value_cents: number | null;
  status: PermitStatus;
  pcn: string | null;
  description: string | null;
  additional_notes: string | null;
  contractor_company: string | null;
  contractor_qualifier: string | null;
  company_address: string | null;
  poc: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  license_number: string | null;
  signer_phone: string | null;
  signer_email: string | null;
  submitted_date: string | null;
  subs: PermitSub[];
  documents: PermitDoc[];
  extra_docs: string[];
  intake_payload: Record<string, unknown> | null;
};

export type PermitInsert = Omit<PermitRow, "id" | "created_at" | "updated_at">;

const T = () => supabase.from("permits" as any) as any;

export async function listPermits(): Promise<PermitRow[]> {
  const { data, error } = await T().select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PermitRow[];
}

export async function getPermit(id: string): Promise<PermitRow | null> {
  const { data, error } = await T().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as PermitRow) ?? null;
}

export async function createPermit(row: Partial<PermitInsert>): Promise<PermitRow> {
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as PermitRow;
}

export async function updatePermit(id: string, patch: Partial<PermitInsert>): Promise<PermitRow> {
  const { data, error } = await T().update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as PermitRow;
}

export async function deletePermit(id: string): Promise<void> {
  const { error } = await T().delete().eq("id", id);
  if (error) throw error;
}

export function missingRequiredDocs(row: PermitRow): PermitDoc[] {
  return (row.documents ?? []).filter(
    (d) => d.required && d.status !== "uploaded" && d.status !== "not_applicable",
  );
}

export function pendingDocs(row: PermitRow): PermitDoc[] {
  return (row.documents ?? []).filter((d) => d.status === "pending" || d.status === "missing");
}
