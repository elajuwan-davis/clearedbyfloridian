import { supabase } from "@/integrations/supabase/client";

export type NtoStatus = "not_filed" | "draft" | "sent" | "confirmed";

export type NtoRow = {
  id: string;
  permit_id: string;
  owner_name: string | null;
  owner_address: string | null;
  owner_email: string | null;
  property_address: string | null;
  contractor_name: string;
  contractor_address: string;
  work_description: string | null;
  first_work_date: string | null;
  status: NtoStatus;
  sent_via: string | null;
  sent_at: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
};

const T = () => supabase.from("nto_filings" as any) as any;

export async function getNto(permit_id: string): Promise<NtoRow | null> {
  const { data, error } = await T().select("*").eq("permit_id", permit_id).maybeSingle();
  if (error) return null;
  return (data as NtoRow) ?? null;
}

export async function upsertNto(row: Partial<NtoRow> & { permit_id: string }): Promise<NtoRow> {
  const existing = await getNto(row.permit_id);
  if (existing) {
    const { data, error } = await T().update(row).eq("id", existing.id).select("*").single();
    if (error) throw error;
    return data as NtoRow;
  }
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as NtoRow;
}
