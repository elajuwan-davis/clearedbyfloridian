// Live notary request store — backed by public.notary_requests.
// Cleard performs remote online notarization in-house per FL Stat §117.265.

import { supabase } from "@/integrations/supabase/client";

export type NotaryStatus = "requested" | "scheduled" | "completed" | "failed";

export type NotaryRequest = {
  id: string;
  /** Live permit UUID (was mock projectId in the localStorage demo). */
  projectId: string;
  permitId: string;
  projectName: string;
  clientName?: string;
  docId?: string;
  documentName: string;
  notes?: string;
  status: NotaryStatus;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  notarizedFilename?: string;
  sessionAt?: string;
  provider?: string;
  confirmationNumber?: string;
  failureReason?: string;
};

export const NOTARY_EVT = "notary-requests:changed";

function notifyChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTARY_EVT));
  }
}

function mapRow(row: any): NotaryRequest {
  const permit = row.permits ?? null;
  const permitId = (row.permit_id as string) ?? "";
  return {
    id: row.id as string,
    projectId: permitId,
    permitId,
    projectName:
      (permit?.project_name as string) ||
      (permit?.job_address as string) ||
      "Permit",
    clientName:
      (permit?.contractor_company as string) ||
      (permit?.owner_name as string) ||
      undefined,
    docId: (row.doc_id as string) || undefined,
    documentName: row.document_name as string,
    notes: (row.notes as string) || undefined,
    status: row.status as NotaryStatus,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    createdBy: (row.created_by as string) ?? "unknown",
    completedAt: (row.completed_at as string) || undefined,
    notarizedFilename: (row.notarized_filename as string) || undefined,
    sessionAt: row.session_at ? String(row.session_at) : undefined,
    provider: (row.provider as string) || undefined,
    confirmationNumber: (row.confirmation_number as string) || undefined,
    failureReason: (row.failure_reason as string) || undefined,
  };
}

const SELECT =
  "id, permit_id, tenant_id, document_name, doc_id, status, notes, created_by, created_at, completed_at, notarized_filename, session_at, provider, confirmation_number, failure_reason, permits:permit_id ( id, project_name, job_address, contractor_company, owner_name, tenant_id )";

export async function listNotaryRequests(permitId?: string): Promise<NotaryRequest[]> {
  let q = (supabase.from("notary_requests" as any) as any)
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (permitId) q = q.eq("permit_id", permitId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map(mapRow);
}

export async function notaryForDoc(docId: string): Promise<NotaryRequest | undefined> {
  const { data, error } = await (supabase.from("notary_requests" as any) as any)
    .select(SELECT)
    .eq("doc_id", docId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : undefined;
}

export async function createNotaryRequest(input: {
  permitId: string;
  documentName: string;
  notes?: string;
  docId?: string;
  /** @deprecated use permitId — kept for transitional call sites */
  projectId?: string;
  projectName?: string;
  clientName?: string;
  createdBy?: string;
}): Promise<NotaryRequest> {
  const permitId = input.permitId || input.projectId;
  if (!permitId || !/^[a-f0-9-]{36}$/i.test(permitId)) {
    throw new Error("A live permit id is required to request notarization.");
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;

  const { data: permit } = await (supabase.from("permits" as any) as any)
    .select("id, tenant_id, project_name, contractor_company")
    .eq("id", permitId)
    .maybeSingle();

  const { data, error } = await (supabase.from("notary_requests" as any) as any)
    .insert({
      permit_id: permitId,
      tenant_id: (permit as any)?.tenant_id ?? null,
      document_name: input.documentName,
      doc_id: input.docId ?? null,
      notes: input.notes ?? null,
      status: "requested",
      created_by: userId,
    })
    .select(SELECT)
    .single();
  if (error) throw error;

  const req = mapRow(data);
  notifyChanged();
  try {
    console.info(
      `[NOTIFY] Notary request → info@cleard.com\nProject: ${req.projectName}\nDocument: ${req.documentName}`,
    );
  } catch {
    /* ignore */
  }
  return req;
}

export async function completeNotary(id: string, notarizedFilename: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await (supabase.from("notary_requests" as any) as any)
    .update({
      status: "completed",
      completed_at: now,
      notarized_filename: notarizedFilename,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw error;
  notifyChanged();
}

export async function scheduleNotary(
  id: string,
  input: { sessionAt: string; provider: string; confirmationNumber: string },
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await (supabase.from("notary_requests" as any) as any)
    .update({
      status: "scheduled",
      session_at: input.sessionAt,
      provider: input.provider,
      confirmation_number: input.confirmationNumber,
      failure_reason: null,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw error;
  notifyChanged();
}

export async function failNotary(id: string, reason: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await (supabase.from("notary_requests" as any) as any)
    .update({
      status: "failed",
      failure_reason: reason,
      updated_at: now,
    })
    .eq("id", id);
  if (error) throw error;
  notifyChanged();
}

export function notaryBadge(
  status: NotaryStatus,
): { label: string; className: string; iconSeal?: boolean } {
  switch (status) {
    case "requested":
      return { label: "Pending Scheduling", className: "bg-amber-500 text-white" };
    case "scheduled":
      return { label: "Scheduled", className: "bg-sky-600 text-white" };
    case "failed":
      return { label: "Failed", className: "bg-red-600 text-white" };
    case "completed":
    default:
      return {
        label: "Notarized",
        className: "bg-[#B8860B] text-white",
        iconSeal: true,
      };
  }
}
