// HOA submittal audit events — append-only timeline of actions taken on a
// submittal (creation, uploads, status changes, sends, replies).
import { supabase } from "@/integrations/supabase/client";

export type HoaEventKind =
  | "created"
  | "updated"
  | "status_changed"
  | "document_added"
  | "document_removed"
  | "pdf_generated"
  | "removal_agreement_generated"
  | "sent_to_hoa"
  | "homeowner_notified"
  | "hoa_reply_logged"
  | "note";

export type HoaSubmittalEvent = {
  id: string;
  submittal_id: string;
  tenant_id: string | null;
  actor_id: string | null;
  actor_label: string | null;
  kind: HoaEventKind;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
};

const T = () => supabase.from("hoa_submittal_events" as any) as any;

export async function logHoaEvent(input: {
  submittalId: string;
  tenantId: string | null;
  actorId: string | null;
  actorLabel?: string | null;
  kind: HoaEventKind;
  summary: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await T().insert({
      submittal_id: input.submittalId,
      tenant_id: input.tenantId,
      actor_id: input.actorId,
      actor_label: input.actorLabel ?? null,
      kind: input.kind,
      summary: input.summary,
      details: input.details ?? {},
    });
  } catch {
    // audit logging is best-effort; do not throw
  }
}

export async function listHoaEvents(submittalId: string): Promise<HoaSubmittalEvent[]> {
  const { data, error } = await T()
    .select("*")
    .eq("submittal_id", submittalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HoaSubmittalEvent[];
}
