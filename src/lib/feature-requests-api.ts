import { supabase } from "@/integrations/supabase/client";

export const REQUEST_TYPES = [
  "New Feature",
  "Improvement to Existing Feature",
  "Integration Request",
  "Municipality / HOA Addition",
  "Bug Report",
  "Other",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const PLATFORM_AREAS = [
  "Permit Intake",
  "HOA Submittals",
  "Building Departments",
  "Subcontractor Management",
  "Compliance & Documents",
  "Victoria AI",
  "Reports & Analytics",
  "Financials",
  "Team / Account Settings",
  "Marketing Site",
  "Other",
] as const;
export type PlatformArea = (typeof PLATFORM_AREAS)[number];

export const PRIORITIES = [
  "Nice to have",
  "Would use regularly",
  "Blocking my workflow",
] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = [
  "under_review",
  "planned",
  "in_progress",
  "shipped",
  "declined",
] as const;
export type FRStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<FRStatus, string> = {
  under_review: "Under Review",
  planned: "Planned",
  in_progress: "In Progress",
  shipped: "Shipped",
  declined: "Declined",
};

export type FeatureRequest = {
  id: string;
  tenant_id: string | null;
  created_by: string;
  request_type: string;
  title: string;
  areas: string[];
  description: string;
  workflow_impact: string;
  priority: string;
  status: FRStatus;
  public_response: string | null;
  pinned: boolean;
  shipped_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FeatureRequestWithMeta = FeatureRequest & {
  vote_count: number;
  user_has_voted: boolean;
  /** Admin-only staff note (lives in feature_request_notes; null for non-admins). */
  internal_note: string | null;
};


export type NewRequestInput = {
  request_type: RequestType;
  title: string;
  areas: string[];
  description: string;
  workflow_impact: string;
  priority: Priority;
};

export async function listRequestsWithMeta(): Promise<FeatureRequestWithMeta[]> {
  const [reqRes, voteRes, noteRes, userRes] = await Promise.all([
    supabase.from("feature_requests" as any).select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("feature_request_votes" as any).select("request_id, user_id"),
    // Admin-only table: RLS returns nothing for regular clients.
    supabase.from("feature_request_notes" as any).select("request_id, internal_note"),
    supabase.auth.getUser(),
  ]);
  if (reqRes.error) throw reqRes.error;
  if (voteRes.error) throw voteRes.error;
  const uid = userRes.data.user?.id ?? null;
  const rows = ((reqRes.data ?? []) as unknown) as FeatureRequest[];
  const votes = ((voteRes.data ?? []) as unknown) as { request_id: string; user_id: string }[];
  const notes = new Map<string, string | null>(
    (((noteRes.data ?? []) as unknown) as { request_id: string; internal_note: string | null }[]).map(
      (n) => [n.request_id, n.internal_note],
    ),
  );
  const byReq = new Map<string, { count: number; mine: boolean }>();
  for (const v of votes) {
    const cur = byReq.get(v.request_id) ?? { count: 0, mine: false };
    cur.count += 1;
    if (uid && v.user_id === uid) cur.mine = true;
    byReq.set(v.request_id, cur);
  }
  return rows.map((r) => {
    const meta = byReq.get(r.id) ?? { count: 0, mine: false };
    return { ...r, vote_count: meta.count, user_has_voted: meta.mine, internal_note: notes.get(r.id) ?? null };
  });
}


export async function createRequest(input: NewRequestInput): Promise<FeatureRequest> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("You must be signed in to submit a request.");
  const { data, error } = await supabase
    .from("feature_requests" as any)
    .insert({
      created_by: uid,
      request_type: input.request_type,
      title: input.title,
      areas: input.areas,
      description: input.description,
      workflow_impact: input.workflow_impact,
      priority: input.priority,
      status: "under_review",
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data as unknown) as FeatureRequest;
}

export async function toggleVote(requestId: string, hasVoted: boolean): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sign in to vote.");
  if (hasVoted) {
    const { error } = await supabase
      .from("feature_request_votes" as any)
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", uid);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("feature_request_votes" as any)
      .insert({ request_id: requestId, user_id: uid });
    if (error && !/duplicate|unique/i.test(error.message)) throw error;
  }
}

export async function updateRequestAdmin(
  id: string,
  patch: Partial<Pick<FeatureRequest, "status" | "internal_note" | "public_response" | "pinned">>,
): Promise<FeatureRequest> {
  const { data, error } = await supabase
    .from("feature_requests" as any)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return (data as unknown) as FeatureRequest;
}
