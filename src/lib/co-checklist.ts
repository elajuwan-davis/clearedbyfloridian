import { supabase } from "@/integrations/supabase/client";
import { triggerNotification } from "@/lib/notifications-api";

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

export const CO_ITEMS: { key: string; label: string }[] = [
  { key: "final_structural", label: "Final structural inspection passed" },
  { key: "final_electrical", label: "Final electrical inspection passed" },
  { key: "final_plumbing", label: "Final plumbing inspection passed" },
  { key: "final_mechanical", label: "Final mechanical / HVAC inspection passed" },
  { key: "final_pool_spa", label: "Final pool / spa inspection passed" },
  { key: "trade_signoffs", label: "All trade sign-offs received" },
  { key: "corrections_resolved", label: "All permit corrections resolved" },
  { key: "lien_releases_filed", label: "Lien releases filed (all subs)" },
  { key: "noc_recorded", label: "NOC recorded with county clerk" },
  { key: "hoa_deposit_refunded", label: "HOA damage deposit refunded (if applicable)" },
  { key: "co_issued", label: "CO issued by municipality" },
];

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

export function coProgress(items: CoItem[]): { done: number; total: number; percent: number; issued: boolean } {
  const total = items.length || CO_ITEMS.length;
  const done = items.filter((i) => i.complete).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0, issued: total > 0 && done === total };
}
