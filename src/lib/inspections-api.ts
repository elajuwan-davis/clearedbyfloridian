import { supabase } from "@/integrations/supabase/client";
import { triggerNotification } from "@/lib/notifications-api";
import { labelFor, type InspectionResult, type InspectionType } from "@/lib/inspections-status";

export {
  INSPECTION_TYPES,
  TIME_WINDOWS,
  currentInspectionStage,
  hasReport,
  isUpcoming,
  labelFor,
  labelForTime,
} from "@/lib/inspections-status";
export type { InspectionResult, InspectionType };

export type PermitInspection = {
  id: string;
  permit_id: string;
  tenant_id: string | null;
  inspection_type: InspectionType | string;
  requested_date: string | null;
  scheduled_date: string | null;
  preferred_time: string | null;
  inspector_name: string | null;
  result: InspectionResult | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from permits when listed via listAllInspections */
  project_name?: string | null;
  job_address?: string | null;
  permit_number?: string | null;
};

const SELECT_WITH_PERMIT =
  "id, permit_id, tenant_id, inspection_type, requested_date, scheduled_date, preferred_time, inspector_name, result, notes, created_at, updated_at, permits:permit_id ( id, project_name, job_address, permit_number, tenant_id )";

function mapRow(row: any): PermitInspection {
  const permit = row.permits ?? null;
  return {
    id: row.id,
    permit_id: row.permit_id,
    tenant_id: row.tenant_id ?? permit?.tenant_id ?? null,
    inspection_type: row.inspection_type,
    requested_date: row.requested_date,
    scheduled_date: row.scheduled_date,
    preferred_time: row.preferred_time ?? null,
    inspector_name: row.inspector_name,
    result: row.result,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project_name: permit?.project_name ?? null,
    job_address: permit?.job_address ?? null,
    permit_number: permit?.permit_number ?? null,
  };
}

export async function listInspections(permitId: string): Promise<PermitInspection[]> {
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .select(SELECT_WITH_PERMIT)
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map(mapRow);
}

/** Cross-permit list for /portal/inspections — sorted by scheduled/requested date. */
export async function listAllInspections(): Promise<PermitInspection[]> {
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .select(SELECT_WITH_PERMIT)
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("requested_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = ((data ?? []) as any[]).map(mapRow);
  // Stable sort: prefer scheduled_date, then requested_date, then created_at
  return rows.sort((a, b) => {
    const da = a.scheduled_date || a.requested_date || a.created_at;
    const db = b.scheduled_date || b.requested_date || b.created_at;
    return new Date(da).getTime() - new Date(db).getTime();
  });
}

export async function createInspection(input: {
  permit_id: string;
  tenant_id: string | null;
  inspection_type: InspectionType;
  requested_date?: string | null;
  scheduled_date?: string | null;
  preferred_time?: string | null;
  inspector_name?: string | null;
  notes?: string | null;
}): Promise<PermitInspection> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .insert({
      ...input,
      result: "pending",
      created_by: auth?.user?.id ?? null,
    } as any)
    .select(SELECT_WITH_PERMIT)
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateInspection(
  id: string,
  patch: Partial<PermitInspection>,
): Promise<PermitInspection> {
  const {
    permits: _p,
    project_name: _n,
    job_address: _a,
    permit_number: _num,
    ...rest
  } = patch as any;
  const { data, error } = await supabase
    .from("permit_inspections" as any)
    .update(rest as any)
    .eq("id", id)
    .select(SELECT_WITH_PERMIT)
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteInspection(id: string): Promise<void> {
  const { error } = await supabase
    .from("permit_inspections" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/**
 * Staff status update: mark passed/failed/reinspect/cancelled with notes.
 * On failed, inserts a notifications row for follow-up.
 */
export async function markInspectionResult(input: {
  id: string;
  result: Extract<InspectionResult, "passed" | "failed" | "reinspect" | "cancelled">;
  notes?: string | null;
  inspector_name?: string | null;
  permit_id: string;
  inspection_type: string;
}): Promise<PermitInspection> {
  const patch: Partial<PermitInspection> = {
    result: input.result,
  };
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.inspector_name !== undefined) patch.inspector_name = input.inspector_name;

  const row = await updateInspection(input.id, patch);

  if (input.result === "failed") {
    await triggerNotification({
      kind: "inspection_failed",
      title: `Inspection failed — ${labelFor(input.inspection_type)}`,
      body: input.notes?.trim() || "Inspection failed. Follow-up / reinspection required.",
      permit_id: input.permit_id,
    });
  } else if (input.result === "passed") {
    await triggerNotification({
      kind: "inspection_passed",
      title: `Inspection passed — ${labelFor(input.inspection_type)}`,
      body: input.notes?.trim() || undefined,
      permit_id: input.permit_id,
    });
  }

  return row;
}
