// Client-facing permit updates (staff messages posted to a permit).
import { supabase } from "@/integrations/supabase/client";

export type PermitUpdateRow = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  message: string;
  visible_to_client: boolean;
  created_by_label: string | null;
  created_at: string;
  acknowledged_at: string | null;
};

const T = () => supabase.from("permit_updates" as any) as any;

/** Client-visible updates for the signed-in user's tenant (RLS-scoped). */
export async function listClientPermitUpdates(limit = 20): Promise<PermitUpdateRow[]> {
  const { data, error } = await T()
    .select("id, permit_id, tenant_id, message, visible_to_client, created_by_label, created_at, acknowledged_at")
    .eq("visible_to_client", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PermitUpdateRow[];
}

export async function acknowledgePermitUpdates(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await T().update({ acknowledged_at: new Date().toISOString() }).in("id", ids);
  if (error) throw error;
}
