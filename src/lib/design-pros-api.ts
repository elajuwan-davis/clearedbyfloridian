import { supabase } from "@/integrations/supabase/client";

export type DesignProRole = "architect" | "engineer";

export type DesignProRow = {
  id: string;
  created_at: string;
  updated_at: string;
  role: DesignProRole | string;
  firm_name: string;
  contact_name: string | null;
  license_number: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export type DesignProInsert = {
  role: DesignProRole;
  firm_name: string;
  contact_name?: string | null;
  license_number?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

const T = () => supabase.from("design_professionals" as any) as any;

export async function listDesignPros(): Promise<DesignProRow[]> {
  const { data, error } = await T().select("*").order("firm_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DesignProRow[];
}

export async function createDesignPro(row: DesignProInsert): Promise<DesignProRow> {
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as DesignProRow;
}
