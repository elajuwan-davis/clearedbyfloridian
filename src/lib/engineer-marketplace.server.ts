// Server-side store for the engineer's letter marketplace.
//
// BLIND ROUTING: engineers must never learn who the job belongs to. Everything
// an engineer can read goes through `blindRequests()`, which selects an explicit
// column allow-list — no project_id, tenant_id, assigned_engineer_id, admin
// notes, or joined permit data. Widening BLIND_COLUMNS leaks the GC.

import { adminDb, ApiError } from "@/lib/api-auth.server";

export type RequestStatus = "open" | "assigned" | "in_review" | "complete" | "cancelled";

export type InspectionPhoto = { url: string; caption: string };

export type EngineerLetterRequest = {
  id: string;
  project_id: string;
  tenant_id: string;
  requested_inspections: string[];
  inspection_photos: InspectionPhoto[];
  scope_description: string;
  status: RequestStatus;
  assigned_engineer_id: string | null;
  final_document_url: string | null;
  admin_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** The only columns an engineer may ever see. */
const BLIND_COLUMNS =
  "id, requested_inspections, inspection_photos, scope_description, status, created_at, updated_at";

export type BlindRequest = {
  id: string;
  requested_inspections: string[];
  inspection_photos: InspectionPhoto[];
  scope_description: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

/** Open requests plus the engineer's own assignments, blind-projected. */
export async function blindRequests(
  engineerId: string,
  requestId?: string,
): Promise<BlindRequest[]> {
  let query = adminDb()
    .from("engineer_letter_requests")
    .select(BLIND_COLUMNS)
    .or(`status.eq.open,assigned_engineer_id.eq.${engineerId}`)
    .order("created_at", { ascending: false });
  if (requestId) query = query.eq("id", requestId);

  const { data, error } = await query;
  if (error) throw new ApiError(500, error.message);
  return (data ?? []) as unknown as BlindRequest[];
}

export async function blindRequest(engineerId: string, requestId: string): Promise<BlindRequest> {
  const [row] = await blindRequests(engineerId, requestId);
  if (!row) throw new ApiError(404, "Request not found");
  return row;
}

export async function loadRequest(requestId: string): Promise<EngineerLetterRequest> {
  const { data, error } = await adminDb()
    .from("engineer_letter_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<EngineerLetterRequest>();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "Request not found");
  return data;
}

export async function updateRequest(
  requestId: string,
  patch: Partial<EngineerLetterRequest>,
): Promise<EngineerLetterRequest> {
  const { data, error } = await adminDb()
    .from("engineer_letter_requests")
    .update(patch)
    .eq("id", requestId)
    .select("*")
    .single<EngineerLetterRequest>();
  if (error) throw new ApiError(500, error.message);
  return data;
}

/** In-app notification for an engineer. Deliberately says nothing about the
 *  project, the GC, or the trade. */
export async function notifyEngineer(
  engineerId: string,
  title: string,
  body: string,
): Promise<void> {
  const { data: profile } = await adminDb()
    .from("engineer_profiles")
    .select("user_id")
    .eq("id", engineerId)
    .maybeSingle<{ user_id: string }>();
  if (!profile) return;

  const { error } = await adminDb().from("notifications").insert({
    user_id: profile.user_id,
    kind: "engineer_letter_assignment",
    title,
    body,
  });
  if (error) console.error("[engineer-marketplace] notification insert failed", error.message);
}
