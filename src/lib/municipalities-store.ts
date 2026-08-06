// Municipalities directory — Supabase-backed. Seeds from MUNICIPALITY_TREE when empty.

import { supabase } from "@/integrations/supabase/client";
import { MUNICIPALITY_TREE } from "@/lib/municipalities-data";

export const FL_COUNTIES = [
  "Alachua","Baker","Bay","Bradford","Brevard","Broward","Calhoun","Charlotte","Citrus","Clay",
  "Collier","Columbia","DeSoto","Dixie","Duval","Escambia","Flagler","Franklin","Gadsden","Gilchrist",
  "Glades","Gulf","Hamilton","Hardee","Hendry","Hernando","Highlands","Hillsborough","Holmes","Indian River",
  "Jackson","Jefferson","Lafayette","Lake","Lee","Leon","Levy","Liberty","Madison","Manatee",
  "Marion","Martin","Miami-Dade","Monroe","Nassau","Okaloosa","Okeechobee","Orange","Osceola","Palm Beach",
  "Pasco","Pinellas","Polk","Putnam","St. Johns","St. Lucie","Santa Rosa","Sarasota","Seminole","Sumter",
  "Suwannee","Taylor","Union","Volusia","Wakulla","Walton","Washington",
] as const;

export const PORTAL_PLATFORMS = [
  "EnerGov","Accela","CSS","Tyler Technologies","OpenGov","Custom","None/No Portal",
] as const;

export type PortalPlatform = (typeof PORTAL_PLATFORMS)[number];

export type MunicipalityRow = {
  id: string;
  name: string;
  county: string;
  department: string | null;
  portal_url: string | null;
  submittal_method: string | null;
  turnaround_notes: string | null;
  quirks: string | null;
  readiness_score: number | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
};

/** Legacy shape used by Building Dept custom form UI. */
export type CustomMunicipality = {
  id: string;
  municipality_name: string;
  county: string;
  portal_url: string;
  platform: PortalPlatform;
  username?: string;
  password?: string;
  phone?: string;
  email?: string;
  notes?: string;
  verified: boolean;
  created_at: string;
};

const EVT = "municipalities:changed";
let seedAttempted = false;

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

function toCustom(row: MunicipalityRow): CustomMunicipality {
  return {
    id: row.id,
    municipality_name: row.name,
    county: row.county,
    portal_url: row.portal_url || "",
    platform: (row.submittal_method as PortalPlatform) || "Custom",
    notes: row.quirks || row.turnaround_notes || undefined,
    verified: true,
    created_at: row.created_at,
  };
}

function treeSeedRows() {
  const rows: Array<{
    name: string;
    county: string;
    department: string | null;
    portal_url: string | null;
  }> = [];
  for (const region of MUNICIPALITY_TREE) {
    for (const county of region.counties) {
      for (const city of county.cities) {
        rows.push({
          name: city.name,
          county: county.name,
          department: city.deptName ?? null,
          portal_url: city.portalUrl ?? null,
        });
      }
    }
  }
  return rows;
}

async function ensureSeeded() {
  if (seedAttempted) return;
  seedAttempted = true;
  const { count, error } = await (supabase.from("municipalities" as any) as any)
    .select("id", { count: "exact", head: true });
  if (error || (count ?? 0) > 0) return;
  const rows = treeSeedRows().map((r) => ({ ...r, is_custom: false }));
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    await (supabase.from("municipalities" as any) as any).upsert(slice, {
      onConflict: "name,county",
      ignoreDuplicates: true,
    });
  }
}

export async function listMunicipalityRows(): Promise<MunicipalityRow[]> {
  await ensureSeeded();
  const { data, error } = await (supabase.from("municipalities" as any) as any)
    .select("*")
    .order("name", { ascending: true });
  if (error || !data) return [];
  return data as MunicipalityRow[];
}

/** User-added municipalities only (Building Dept "custom" list). */
export async function listMunicipalities(): Promise<CustomMunicipality[]> {
  const rows = await listMunicipalityRows();
  return rows
    .filter((r) => r.is_custom)
    .map(toCustom)
    .sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));
}

export async function addMunicipality(
  input: Omit<CustomMunicipality, "id" | "created_at">,
): Promise<CustomMunicipality | null> {
  const { data, error } = await (supabase.from("municipalities" as any) as any)
    .insert({
      name: input.municipality_name,
      county: input.county,
      portal_url: input.portal_url || null,
      submittal_method: input.platform || null,
      quirks: input.notes || null,
      department: null,
      is_custom: true,
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("[municipalities] insert failed", error?.message);
    return null;
  }
  notifyChanged();
  return toCustom(data as MunicipalityRow);
}

export async function updateMunicipality(id: string, patch: Partial<CustomMunicipality>) {
  const update: Record<string, unknown> = {};
  if (patch.municipality_name != null) update.name = patch.municipality_name;
  if (patch.county != null) update.county = patch.county;
  if (patch.portal_url != null) update.portal_url = patch.portal_url;
  if (patch.platform != null) update.submittal_method = patch.platform;
  if (patch.notes != null) update.quirks = patch.notes;
  const { error } = await (supabase.from("municipalities" as any) as any).update(update).eq("id", id);
  if (error) {
    console.error("[municipalities] update failed", error.message);
    return;
  }
  notifyChanged();
}

export async function deleteMunicipality(id: string) {
  const { error } = await (supabase.from("municipalities" as any) as any).delete().eq("id", id);
  if (error) {
    console.error("[municipalities] delete failed", error.message);
    return;
  }
  notifyChanged();
}

export function subscribeMunicipalities(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
