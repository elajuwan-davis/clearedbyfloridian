// Agent 7 — client side of the corrections workflow.
//
// The browser can read the parsed plan and approve or reject it. It cannot send anything:
// approval goes through the approve_correction_plan() RPC (staff-only, SECURITY DEFINER) and
// it is the database trigger that releases the acknowledgment, so no UI bug can mail the GC
// or a building department.

import { supabase } from "@/integrations/supabase/client";

export type CorrectionPlanStatus =
  "draft_pending_approval" | "approved" | "sending" | "sent" | "rejected" | "failed";

export type CorrectionCategory =
  "documentation" | "plan" | "code_compliance" | "fee" | "administrative";

export type CorrectionItem = {
  ordinal: number;
  quoted_text: string;
  category: CorrectionCategory;
  code_reference: string | null;
  complexity: "low" | "medium" | "high";
  estimated_hours: number | null;
  fix_instruction: string;
  responsible_party: "cleard" | "gc" | "engineer" | "architect" | "owner";
};

export type ParsedPlan = {
  reviewer: string | null;
  notice_date: string | null;
  resubmittal_due: string | null;
  items: CorrectionItem[];
  overall_complexity: "low" | "medium" | "high";
  summary: string;
  acknowledgment: { subject: string; body: string };
};

export type CorrectionPlanRow = {
  id: string;
  permit_id: string;
  notice_id: string;
  municipality_slug: string | null;
  status: CorrectionPlanStatus;
  plan: ParsedPlan;
  totals: {
    item_count?: number;
    by_category?: Record<string, number>;
    estimated_hours?: number;
    items_without_estimate?: number;
    third_party_items?: number;
  };
  item_count: number;
  overall_complexity: string | null;
  letter_excerpt: string | null;
  model: string | null;
  numbered_comments_found: number | null;
  ack_to_email: string | null;
  ack_cc_emails: string[] | null;
  ack_subject: string | null;
  ack_body: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approved_note: string | null;
  rejected_reason: string | null;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
};

export type CorrectionPlanEvent = {
  id: string;
  plan_id: string;
  event_type: string;
  actor_label: string | null;
  detail: Record<string, unknown>;
  created_at: string;
};

// correction_plans post-dates the generated integrations/supabase/types.ts — same untyped
// table access used elsewhere in the app.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (name: string) => supabase.from(name as any) as any;

export async function listCorrectionPlans(permitId: string): Promise<CorrectionPlanRow[]> {
  const { data, error } = await table("correction_plans")
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CorrectionPlanRow[];
}

export async function listCorrectionPlanEvents(planId: string): Promise<CorrectionPlanEvent[]> {
  const { data, error } = await table("correction_plan_events")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CorrectionPlanEvent[];
}

/** Re-parses a notice (e.g. after staff pasted the letter text). Never sends anything. */
export async function parseCorrectionNotice(noticeId: string): Promise<CorrectionPlanRow | null> {
  const { data, error } = await supabase.functions.invoke("corrections-parser", {
    body: { action: "parse", notice_id: noticeId },
  });
  if (error) throw new Error(error.message);
  const res = data as { plan?: CorrectionPlanRow; error?: string };
  if (res?.error) throw new Error(res.error);
  return res?.plan ?? null;
}

/** The approval gate. Staff-only, enforced in the database, recorded against the approver. */
export async function approveCorrectionPlan(
  planId: string,
  note?: string,
): Promise<CorrectionPlanRow> {
  const { data, error } = await supabase.rpc(
    "approve_correction_plan" as never,
    {
      _plan_id: planId,
      _note: note ?? null,
    } as never,
  );
  if (error) throw new Error(error.message);
  return data as unknown as CorrectionPlanRow;
}

export async function rejectCorrectionPlan(
  planId: string,
  reason: string,
): Promise<CorrectionPlanRow> {
  const { data, error } = await supabase.rpc(
    "reject_correction_plan" as never,
    {
      _plan_id: planId,
      _reason: reason,
    } as never,
  );
  if (error) throw new Error(error.message);
  return data as unknown as CorrectionPlanRow;
}

export function correctionPlanBadge(status: CorrectionPlanStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "draft_pending_approval":
      return { label: "awaiting approval", className: "bg-amber-50 text-amber-800" };
    case "approved":
      return { label: "approved — sending", className: "bg-sky-50 text-sky-800" };
    case "sending":
      return { label: "sending", className: "bg-sky-50 text-sky-800" };
    case "sent":
      return { label: "acknowledged", className: "bg-emerald-50 text-emerald-800" };
    case "failed":
      return { label: "failed", className: "bg-red-50 text-red-800" };
    case "rejected":
      return { label: "rejected", className: "bg-obsidian/5 text-obsidian/60" };
  }
}

export const CATEGORY_LABELS: Record<CorrectionCategory, string> = {
  documentation: "Documentation",
  plan: "Plan revision",
  code_compliance: "Code compliance",
  fee: "Fee",
  administrative: "Administrative",
};
