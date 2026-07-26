import { supabase } from "@/integrations/supabase/client";

export type InspectionType =
  | "rough"
  | "framing"
  | "final"
  | "pool_shell"
  | "electrical_rough"
  | "plumbing_rough";

export type InspectionResult = "pending" | "passed" | "failed" | "reinspect";

export const INSPECTION_TYPES: { value: InspectionType; label: string }[] = [
  { value: "rough", label: "Rough" },
  { value: "framing", label: "Framing" },
  { value: "pool_shell", label: "Pool Shell" },
  { value: "electrical_rough", label: "Electrical Rough" },
  { value: "plumbing_rough", label: "Plumbing Rough" },
  { value: "final", label: "Final" },
];

export type PermitInspection = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  inspection_type: InspectionType | string;
  requested_date: string | null;
  scheduled_date: string | null;
  inspector_name: string | null;
  result: InspectionResult | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listInspections(permitId: string): Promise<PermitInspection[]> {
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown) as PermitInspection[];
}

export async function createInspection(input: {
  permit_id: string;
  tenant_id: string | null;
  inspection_type: InspectionType;
  requested_date?: string | null;
  scheduled_date?: string | null;
  inspector_name?: string | null;
  notes?: string | null;
}): Promise<PermitInspection> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .insert({ ...input, result: "pending", created_by: auth?.user?.id ?? null } as any)
    .select("*")
    .single();
  if (error) throw error;
  return ((data as unknown) as PermitInspection);
}

export async function updateInspection(id: string, patch: Partial<PermitInspection>): Promise<PermitInspection> {
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return ((data as unknown) as PermitInspection);
}

export async function deleteInspection(id: string): Promise<void> {
  const { error } = await supabase.from("permit_inspections" as any).delete().eq("id", id);
  if (error) throw error;
}

/** Returns the most recent inspection stage for Victoria summary. */
export function currentInspectionStage(inspections: PermitInspection[]): string | null {
  if (!inspections.length) return null;
  const passed = inspections.filter((i) => i.result === "passed");
  if (passed.length === 0) return `Awaiting ${labelFor(inspections[0].inspection_type)}`;
  const last = passed[0];
  return `${labelFor(last.inspection_type)} passed`;
}

export function labelFor(type: string): string {
  return INSPECTION_TYPES.find((t) => t.value === type)?.label ?? type;
}
