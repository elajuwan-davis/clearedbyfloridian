// Agent 5 — client side of municipality submission.
//
// The browser can do exactly three things: ask for a draft, read it, and approve or reject
// it. It cannot file anything. Approval goes through the approve_municipality_submission()
// RPC (staff-only, SECURITY DEFINER) and the database trigger is what releases the job, so
// no UI bug can put a package in front of a building department.

import { supabase } from "@/integrations/supabase/client";

export type SubmissionStatus =
  "draft_pending_approval" | "approved" | "submitting" | "submitted" | "failed" | "rejected";

export type SubmissionDraft = {
  built_at: string;
  municipality: {
    slug: string;
    city_name: string;
    channel: "portal" | "email";
    driver: string | null;
    portal_url: string | null;
    intake_email: string | null;
    intake_cc: string[];
  };
  permit: {
    id: string;
    project_name: string | null;
    job_address: string | null;
    permit_type: string | null;
    owner_name: string | null;
    contractor_company: string | null;
    license_number: string | null;
    construction_value_cents: number | null;
    work_description: string | null;
  };
  documents: Array<{ label: string; path: string; role: string }>;
  portal_fields: Record<string, unknown> | null;
  email: { to: string | null; cc: string[]; subject: string; body_text: string } | null;
};

export type MunicipalitySubmission = {
  id: string;
  permit_id: string;
  municipality_slug: string;
  channel: "portal" | "email";
  status: SubmissionStatus;
  draft: SubmissionDraft;
  approved_by: string | null;
  approved_at: string | null;
  approved_note: string | null;
  rejected_reason: string | null;
  submitted_at: string | null;
  confirmation_number: string | null;
  portal_receipt_path: string | null;
  last_error: string | null;
  attempts: number;
  created_at: string;
};

export type SubmissionEvent = {
  id: string;
  submission_id: string;
  event_type: string;
  actor_label: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

// municipality_submissions post-dates the generated integrations/supabase/types.ts — same
// untyped-table access used elsewhere in the app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (name: string) => supabase.from(name as any) as any;

/** Builds the draft. Never files — the response always requires an approval. */
export async function draftMunicipalitySubmission(input: {
  permitId: string;
  municipalitySlug?: string;
}): Promise<MunicipalitySubmission> {
  // No created_by here: the edge function attributes the draft to the caller it verified,
  // so the browser cannot claim someone else made it.
  const { data, error } = await supabase.functions.invoke("municipality-submit", {
    body: {
      action: "draft",
      permit_id: input.permitId,
      municipality_slug: input.municipalitySlug ?? null,
    },
  });
  if (error) throw new Error(error.message);
  const res = data as {
    submission?: MunicipalitySubmission;
    error?: string;
    blocking_reasons?: string[];
  };
  if (res?.error) {
    throw new Error(
      res.blocking_reasons?.length ? `${res.error}: ${res.blocking_reasons.join("; ")}` : res.error,
    );
  }
  if (!res?.submission) throw new Error("municipality-submit returned no draft");
  return res.submission;
}

export async function loadLatestSubmission(
  permitId: string,
): Promise<MunicipalitySubmission | null> {
  const { data, error } = await table("municipality_submissions")
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as MunicipalitySubmission) ?? null;
}

export async function listSubmissionEvents(submissionId: string): Promise<SubmissionEvent[]> {
  const { data, error } = await table("municipality_submission_events")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SubmissionEvent[];
}

/** The approval gate. Staff-only, enforced in the database, recorded against the approver. */
export async function approveMunicipalitySubmission(
  submissionId: string,
  note?: string,
): Promise<MunicipalitySubmission> {
  const { data, error } = await supabase.rpc(
    "approve_municipality_submission" as never,
    {
      _submission_id: submissionId,
      _note: note ?? null,
    } as never,
  );
  if (error) throw new Error(error.message);
  return data as unknown as MunicipalitySubmission;
}

export async function rejectMunicipalitySubmission(
  submissionId: string,
  reason: string,
): Promise<MunicipalitySubmission> {
  const { data, error } = await supabase.rpc(
    "reject_municipality_submission" as never,
    {
      _submission_id: submissionId,
      _reason: reason,
    } as never,
  );
  if (error) throw new Error(error.message);
  return data as unknown as MunicipalitySubmission;
}

export function submissionBadge(status: SubmissionStatus): { label: string; className: string } {
  switch (status) {
    case "draft_pending_approval":
      return { label: "awaiting approval", className: "bg-amber-50 text-amber-800" };
    case "approved":
      return { label: "approved — filing", className: "bg-sky-50 text-sky-800" };
    case "submitting":
      return { label: "filing", className: "bg-sky-50 text-sky-800" };
    case "submitted":
      return { label: "filed", className: "bg-emerald-50 text-emerald-800" };
    case "failed":
      return { label: "failed", className: "bg-red-50 text-red-800" };
    case "rejected":
      return { label: "rejected", className: "bg-obsidian/5 text-obsidian/60" };
  }
}
