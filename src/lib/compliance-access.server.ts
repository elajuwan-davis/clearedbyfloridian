import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Verifies the caller can see the subcontractor row through RLS (their tenant
 * or admin). Throws otherwise. Prevents anyone from triggering paid AI scans
 * or overwriting compliance status on arbitrary subcontractor IDs.
 */
export async function assertSubAccess(supabase: SupabaseClient, subId: string) {
  const { data, error } = await (supabase.from("subcontractors" as any) as any)
    .select("id")
    .eq("id", subId)
    .maybeSingle();
  if (error) throw new Error("Not authorized");
  if (!data) throw new Error("Not authorized");
}
