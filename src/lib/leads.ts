import { supabase } from "@/integrations/supabase/client";

export type LeadRow = {
  id: string;
  name: string;
  company: string | null;
  email: string;
  county: string | null;
  permit_type: string | null;
  estimate_days_low: number | null;
  estimate_days_high: number | null;
  estimate_fee_low: number | null;
  estimate_fee_high: number | null;
  source: string;
  page_url: string | null;
  created_at: string;
};

export type LeadInput = {
  name: string;
  company?: string | null;
  email: string;
  county?: string | null;
  permit_type?: string | null;
  estimate_days_low?: number | null;
  estimate_days_high?: number | null;
  estimate_fee_low?: number | null;
  estimate_fee_high?: number | null;
  source?: string;
  page_url?: string | null;
};

export async function createLead(input: LeadInput): Promise<void> {
  const { error } = await supabase.from("leads" as any).insert({
    source: "seo-landing-page",
    ...input,
  } as any);
  if (error) throw new Error(error.message);
}

export async function listLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from("leads" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as LeadRow[];
}
