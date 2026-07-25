import { supabase } from "@/integrations/supabase/client";

export const PRIOR_TRADES = [
  "House",
  "Pool",
  "Gas",
  "Electric",
  "Plumbing",
  "Fencing",
  "Roofing",
  "HVAC",
  "Solar",
  "Screen Enclosure",
  "Dock/Seawall",
  "Other",
] as const;

export type PriorTrade = { trade: string; fee_cents: number };

export type PriorPermitRow = {
  id: string;
  created_by: string | null;
  permit_number: string | null;
  project_label: string;
  trades: PriorTrade[];
  total_cents: number;
  date_pulled: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function normalize(row: any): PriorPermitRow {
  return {
    ...row,
    trades: Array.isArray(row.trades) ? row.trades : [],
  };
}

export async function listPriorPermits(): Promise<PriorPermitRow[]> {
  const { data, error } = await supabase
    .from("prior_permits")
    .select("*")
    .order("date_pulled", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function createPriorPermit(input: {
  permit_number?: string | null;
  project_label: string;
  trades: PriorTrade[];
  total_cents: number;
  date_pulled?: string | null;
  notes?: string | null;
}): Promise<PriorPermitRow> {
  const { data: authRes } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("prior_permits")
    .insert({
      created_by: authRes?.user?.id ?? null,
      permit_number: input.permit_number ?? null,
      project_label: input.project_label,
      trades: input.trades as any,
      total_cents: input.total_cents,
      date_pulled: input.date_pulled ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return normalize(data);
}

export async function deletePriorPermit(id: string): Promise<void> {
  const { error } = await supabase.from("prior_permits").delete().eq("id", id);
  if (error) throw error;
}
