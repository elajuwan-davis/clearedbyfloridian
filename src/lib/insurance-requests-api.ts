// Insurance requests (COI request + sub insurance update).
// Backed by public.insurance_requests; attachments live in the existing
// private `coi-documents` Storage bucket under insurance-requests/{tenant}/…

import { supabase } from "@/integrations/supabase/client";

export type InsuranceRequestType = "coi_request" | "sub_update";
export type InsuranceRequestStatus = "submitted" | "in_progress" | "resolved";

export type InsuranceRequestRow = {
  id: string;
  request_type: InsuranceRequestType;
  tenant_id: string;
  permit_id: string | null;
  subcontractor_id: string | null;
  project_name: string | null;
  project_address: string | null;
  holder_name: string | null;
  holder_address: string | null;
  additional_insured: boolean;
  details: string | null;
  attached_file_path: string | null;
  attached_file_name: string | null;
  status: InsuranceRequestStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCoiRequestInput = {
  id?: string;
  tenantId: string;
  subcontractorId: string;
  permitId?: string | null;
  projectName: string;
  projectAddress: string;
  holderName: string;
  holderAddress: string;
  additionalInsured: boolean;
  notes?: string;
  attachedFilePath?: string | null;
  attachedFileName?: string | null;
};

export type CreateSubUpdateInput = {
  id?: string;
  tenantId: string;
  subcontractorId: string;
  details: string;
};

function notifyStaff(title: string, body: string) {
  // Insert addressed to the requester; admins can SELECT all notifications
  // via is_admin() RLS, so staff actually see the request in the bell.
  return import("@/lib/notifications-api").then(({ triggerNotification }) =>
    triggerNotification({
      kind: "action_required",
      title,
      body,
    }),
  );
}

export async function createCoiRequest(input: CreateCoiRequestInput): Promise<InsuranceRequestRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    request_type: "coi_request" as const,
    tenant_id: input.tenantId,
    permit_id: input.permitId ?? null,
    subcontractor_id: input.subcontractorId,
    project_name: input.projectName,
    project_address: input.projectAddress,
    holder_name: input.holderName,
    holder_address: input.holderAddress,
    additional_insured: input.additionalInsured,
    details: input.notes?.trim() || null,
    attached_file_path: input.attachedFilePath ?? null,
    attached_file_name: input.attachedFileName ?? null,
    status: "submitted" as const,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("insurance_requests")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;

  await notifyStaff(
    "New COI request",
    `${input.projectName} — ${input.holderName} (${input.projectAddress})`,
  ).catch(() => undefined);

  return data as InsuranceRequestRow;
}

export async function createSubUpdateRequest(
  input: CreateSubUpdateInput,
): Promise<InsuranceRequestRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    request_type: "sub_update" as const,
    tenant_id: input.tenantId,
    subcontractor_id: input.subcontractorId,
    details: input.details.trim(),
    additional_insured: false,
    status: "submitted" as const,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("insurance_requests")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;

  await notifyStaff(
    "Subcontractor insurance update requested",
    input.details.trim().slice(0, 240),
  ).catch(() => undefined);

  return data as InsuranceRequestRow;
}

export async function listInsuranceRequests(): Promise<InsuranceRequestRow[]> {
  const { data, error } = await supabase
    .from("insurance_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InsuranceRequestRow[];
}
