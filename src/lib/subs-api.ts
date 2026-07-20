import { supabase } from "@/integrations/supabase/client";

export type SubRow = {
  id: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  trade: string | null;
  qualifier_name: string | null;
  license_number: string | null;
  license_type: string | null;
  license_expiration: string | null;
  license_file_name: string | null;
  license_file_path: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
  insurance_carrier_name: string | null;
  insurance_carrier_email: string | null;
  coi_file_name: string | null;
  coi_file_path: string | null;
  coi_expiration: string | null;
  w9_file_name: string | null;
  w9_file_path: string | null;
  completion_token: string;
  status: "invited" | "in_progress" | "complete";
};

export type SubInsert = Partial<Omit<SubRow, "id" | "created_at" | "updated_at" | "completion_token">> & {
  company_name: string;
};

const T = () => supabase.from("subcontractors" as any) as any;

export async function listSubs(): Promise<SubRow[]> {
  const { data, error } = await T().select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SubRow[];
}

export async function getSub(id: string): Promise<SubRow | null> {
  const { data, error } = await T().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as SubRow) ?? null;
}

export async function createSub(row: SubInsert): Promise<SubRow> {
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as SubRow;
}

export async function updateSubApi(id: string, patch: Partial<SubInsert>): Promise<SubRow> {
  const { data, error } = await T().update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as SubRow;
}

export async function deleteSub(id: string): Promise<void> {
  const { error } = await T().delete().eq("id", id);
  if (error) throw error;
}

export function subMissingFields(s: SubRow): string[] {
  const out: string[] = [];
  if (!s.license_file_name) out.push("License Upload");
  if (!s.license_expiration) out.push("License Expiration");
  if (!s.coi_file_name) out.push("COI Upload");
  if (!s.coi_expiration) out.push("COI Expiration");
  if (!s.w9_file_name) out.push("W-9 Upload");
  return out;
}

export function subIsComplete(s: SubRow): boolean {
  return subMissingFields(s).length === 0;
}

export function coiLifecycle(s: SubRow): "active" | "expiring_soon" | "expired" | "missing" {
  if (!s.coi_expiration) return "missing";
  const exp = new Date(s.coi_expiration);
  if (isNaN(exp.getTime())) return "missing";
  const today = new Date(new Date().toDateString());
  const days = Math.floor((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring_soon";
  return "active";
}
