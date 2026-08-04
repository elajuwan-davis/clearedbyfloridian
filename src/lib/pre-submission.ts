// Agent 4 — client side of the pre-submission completeness gate.
//
// The verdict is produced entirely by the `pre-submission-check` edge function; this
// module only invokes it, reads the stored report back, and maintains the server-side
// signature ledger the check queries (src/lib/signature-requests.ts is localStorage
// only — SignWell is not connected).

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
  status_source: "provider" | "manual";
  sent_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
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

/**
 * Record a routed signature request server side so the completeness check has
 * something deterministic to query. status_source stays 'manual' — a database trigger
 * only lets the service role write 'provider'.
 */
export async function recordSignatureRequest(input: {
  permitId: string;
  tenantId?: string | null;
  documentKey?: string | null;
  documentName: string;
  recipientEmail: string;
  recipientRole: string;
}): Promise<SignatureRequestRow> {
  const { data, error } = await table("signature_requests")
    .insert({
      permit_id: input.permitId,
      tenant_id: input.tenantId ?? null,
      document_key: input.documentKey ?? null,
      document_name: input.documentName,
      recipient_email: input.recipientEmail,
      recipient_role: input.recipientRole,
      status: "sent",
      status_source: "manual",
      sent_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SignatureRequestRow;
}

export async function markSignatureSigned(id: string, signerName: string): Promise<void> {
  const { error } = await table("signature_requests")
    .update({
      status: "signed",
      status_source: "manual",
      signed_at: new Date().toISOString(),
      signed_by_name: signerName,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
