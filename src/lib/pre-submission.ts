// Agent 4 — client side of the pre-submission completeness gate.
//
// The verdict is produced entirely by the `pre-submission-check` edge function; this
// module only invokes it and reads the stored report and signature ledger back.
//
// Signatures are routed through the real SignWell API (src/lib/signature-requests.ts) and
// confirmed only by the HMAC-verified `signwell-webhook`, so there is deliberately no
// client path here for recording or marking a signature — the gate requires
// status_source='provider_confirmed', which only the service role can write.

import { supabase } from "@/integrations/supabase/client";

export type PreSubmissionCheck = {
  key: string;
  label: string;
  pass: boolean;
  blocking: boolean;
  reason: string;
  data?: Record<string, unknown>;
};

export type PreSubmissionReport = {
  status: "pass" | "blocked";
  checked_at: string;
  signwell_configured: boolean;
  checks: PreSubmissionCheck[];
  blocking_reasons: string[];
};

export type SignatureRequestRow = {
  id: string;
  permit_id: string;
  document_key: string | null;
  document_name: string;
  recipient_email: string;
  recipient_role: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined";
  status_source: "provider_confirmed" | "staff_attested";
  sent_at: string | null;
  signed_at: string | null;
  completed_at: string | null;
  signed_by_name: string | null;
  signwell_document_id: string | null;
  embedded_signing_url: string | null;
  test_mode: boolean | null;
  last_event_type: string | null;
};

// signature_requests and the pre_submission_* columns post-date the generated
// integrations/supabase/types.ts, same untyped-table access the rest of the app uses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = (name: string) => supabase.from(name as any) as any;

export async function runPreSubmissionCheck(permitId: string): Promise<PreSubmissionReport> {
  const { data, error } = await supabase.functions.invoke("pre-submission-check", {
    body: { permit_id: permitId },
  });
  if (error) throw new Error(error.message);
  const res = data as { report?: PreSubmissionReport; error?: string };
  if (res?.error) throw new Error(res.error);
  if (!res?.report) throw new Error("pre-submission-check returned no report");
  return res.report;
}

export async function loadPreSubmissionReport(
  permitId: string,
): Promise<PreSubmissionReport | null> {
  const { data } = await table("permits")
    .select("pre_submission_report")
    .eq("id", permitId)
    .maybeSingle();
  return (data?.pre_submission_report ?? null) as PreSubmissionReport | null;
}

export async function listSignatureRequestRows(permitId: string): Promise<SignatureRequestRow[]> {
  const { data } = await table("signature_requests")
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  return (data ?? []) as SignatureRequestRow[];
}
