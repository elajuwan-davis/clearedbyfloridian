import { supabase } from "@/integrations/supabase/client";
import { triggerNotification } from "@/lib/notifications-api";
import { CO_ITEMS } from "@/lib/co-progress";

export { CO_ITEMS, coProgress } from "@/lib/co-progress";

export type CoItem = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  item_key: string;
  item_label: string;
  ord: number;
  complete: boolean;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_label: string | null;
};

export async function ensureCoItems(permitId: string, tenantId: string | null): Promise<CoItem[]> {
  const existing = await listCoItems(permitId);
  if (existing.length >= CO_ITEMS.length) return existing;
  const have = new Set(existing.map((r) => r.item_key));
  const toInsert = CO_ITEMS
    .filter((it) => !have.has(it.key))
    .map((it, i) => ({
      permit_id: permitId,
      tenant_id: tenantId,
      item_key: it.key,
      item_label: it.label,
      ord: CO_ITEMS.findIndex((c) => c.key === it.key),
    }));
  if (toInsert.length) {
    await supabase.from("co_checklist_items" as any).insert(toInsert as any);
  }
  return listCoItems(permitId);
}

export async function listCoItems(permitId: string): Promise<CoItem[]> {
  const { data, error } = await supabase
    .from("co_checklist_items" as any)
    .select("*")
    .eq("permit_id", permitId)
    .order("ord", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown) as CoItem[];
}

export async function toggleCoItem(item: CoItem, projectName: string, permitTenantId: string | null): Promise<CoItem> {
  const next = !item.complete;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id ?? null;
  const label = auth?.user?.email ?? null;
  const { data, error } = await supabase
    .from("co_checklist_items" as any)
    .update({
      complete: next,
      completed_at: next ? new Date().toISOString() : null,
      completed_by: next ? uid : null,
      completed_by_label: next ? label : null,
    })
    .eq("id", item.id)
    .select("*")
    .single();
  if (error) throw error;
  const updated = ((data as unknown) as CoItem);

  // If this was the last unchecked → send celebration notification
  if (next) {
    const all = await listCoItems(item.permit_id);
    if (all.every((r) => r.complete)) {
      await triggerNotification({
        kind: "permit_issued",
        title: `Certificate of Occupancy issued — ${projectName}`,
        body: `Congratulations. Every item on the CO checklist for ${projectName} is complete.`,
        permit_id: item.permit_id,
      });
    }
  }
  return updated;
}
