// Live e-signature store — backed by public.signature_requests and the real SignWell API.
//
// Sending goes through the `signwell-send` edge function (SIGNWELL_API_KEY never reaches the
// browser): it creates the SignWell document with embedded signing enabled and returns an
// embedded_signing_url, so signers sign inside this portal instead of being redirected to
// signwell.com.
//
// Status is provider truth, not client state. A row only becomes
// status_source='provider_confirmed' when the `signwell-webhook` function receives an
// HMAC-verified document_completed event; a database trigger rejects any other writer. The
// pre-submission gate requires provider_confirmed, so nothing here can mark a signature
// complete on its own.

import { supabase } from "@/integrations/supabase/client";

export type SigStatus = "draft" | "sent" | "viewed" | "signed" | "declined";
export type SigStatusSource = "provider_confirmed" | "staff_attested";
export type RecipientRole = "Homeowner" | "General Contractor" | "Subcontractor" | "Other";

export type SignatureRequest = {
  id: string;
  /** Live permit UUID (was the mock projectId in the localStorage demo). */
  projectId: string;
  permitId: string;
  docId?: string;
  documentName: string;
  recipientEmail: string;
  recipientRole: RecipientRole;
  status: SigStatus;
  statusSource: SigStatusSource;
  createdAt: string;
  sentAt?: string;
  signedAt?: string;
  completedAt?: string;
  signedBy?: string;
  signwellId?: string;
  /** Present for embedded signing — render in an iframe, never as a redirect. */
  embeddedSigningUrl?: string;
  testMode?: boolean;
  lastEventType?: string;
};

export const SIG_EVT = "signature-requests:changed";

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SIG_EVT));
}

const isLivePermitId = (id: string | undefined | null): boolean =>
  !!id && /^[a-f0-9-]{36}$/i.test(id);

const SELECT =
  "id, permit_id, document_key, document_name, recipient_email, recipient_role, status, status_source, created_at, sent_at, signed_at, completed_at, signed_by_name, signwell_document_id, embedded_signing_url, test_mode, last_event_type";

// signature_requests post-dates the generated integrations/supabase/types.ts — same untyped
// access notary-requests.ts uses.
/* eslint-disable @typescript-eslint/no-explicit-any */
const table = () => supabase.from("signature_requests" as any) as any;

function mapRow(row: any): SignatureRequest {
  const permitId = (row.permit_id as string) ?? "";
  return {
    id: row.id as string,
    projectId: permitId,
    permitId,
    docId: (row.document_key as string) || undefined,
    documentName: row.document_name as string,
    recipientEmail: row.recipient_email as string,
    recipientRole: (row.recipient_role as RecipientRole) ?? "Other",
    status: row.status as SigStatus,
    statusSource: (row.status_source as SigStatusSource) ?? "staff_attested",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    sentAt: (row.sent_at as string) || undefined,
    signedAt: (row.signed_at as string) || undefined,
    completedAt: (row.completed_at as string) || undefined,
    signedBy: (row.signed_by_name as string) || undefined,
    signwellId: (row.signwell_document_id as string) || undefined,
    embeddedSigningUrl: (row.embedded_signing_url as string) || undefined,
    testMode: Boolean(row.test_mode),
    lastEventType: (row.last_event_type as string) || undefined,
  };
}

export async function listSignatureRequests(permitId?: string): Promise<SignatureRequest[]> {
  let q = table().select(SELECT).order("created_at", { ascending: false });
  if (permitId) q = q.eq("permit_id", permitId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map(mapRow);
}

/** Latest request for a stored document (document_key holds the permit doc key). */
export async function getSignatureForDoc(docKey: string): Promise<SignatureRequest | undefined> {
  const { data, error } = await table()
    .select(SELECT)
    .eq("document_key", docKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : undefined;
}

export async function sigStatusForDocument(
  permitId: string,
  documentName: string,
): Promise<SignatureRequest | undefined> {
  if (!isLivePermitId(permitId)) return undefined;
  const { data, error } = await table()
    .select(SELECT)
    .eq("permit_id", permitId)
    .eq("document_name", documentName)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : undefined;
}

/**
 * Creates a real SignWell document for embedded signing and records it on the ledger.
 * Returns the row plus the embedded signing URL to open in an iframe.
 */
export async function sendForSignature(input: {
  permitId: string;
  /** @deprecated use permitId — kept for transitional call sites */
  projectId?: string;
  documentName?: string;
  /** Key of a permit document to sign; defaults to the generated submittal bundle. */
  documentKey?: string;
  /** Explicit Storage path, when the document is not one of permits.documents. */
  documentPath?: string;
  recipientEmail: string;
  recipientName?: string;
  recipientRole: RecipientRole;
  message?: string;
  subject?: string;
  /** Ask SignWell to email the signer a link — for signers who are not portal users. */
  sendEmail?: boolean;
}): Promise<SignatureRequest & { embeddedSigningUrl?: string }> {
  const permitId = input.permitId || input.projectId || "";
  if (!isLivePermitId(permitId)) {
    throw new Error("A live permit record is required to send a document for signature.");
  }

  const { data, error } = await supabase.functions.invoke("signwell-send", {
    body: {
      permit_id: permitId,
      document_key: input.documentKey ?? null,
      document_path: input.documentPath ?? null,
      document_name: input.documentName,
      recipient_email: input.recipientEmail,
      recipient_name: input.recipientName,
      recipient_role: input.recipientRole,
      message: input.message,
      subject: input.subject,
      send_email: input.sendEmail ?? false,
    },
  });
  if (error) throw new Error(error.message);
  const res = data as {
    signature_request?: any;
    embedded_signing_url?: string | null;
    error?: string;
  };
  if (res?.error) throw new Error(res.error);
  if (!res?.signature_request) throw new Error("signwell-send returned no signature request");

  const req = mapRow(res.signature_request);
  notifyChanged();
  return { ...req, embeddedSigningUrl: res.embedded_signing_url ?? req.embeddedSigningUrl };
}

/**
 * Re-reads a row from the ledger — used after the embedded signing iframe closes, since the
 * webhook (not the browser) is what flips status to signed/provider_confirmed.
 */
export async function refreshSignatureRequest(id: string): Promise<SignatureRequest | undefined> {
  const { data, error } = await table().select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  notifyChanged();
  return data ? mapRow(data) : undefined;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function sigBadge(status: SigStatus): { label: string; className: string } {
  switch (status) {
    case "signed":
      return { label: "Signed", className: "bg-emerald-600 text-white" };
    case "sent":
      return { label: "Sent for Signature", className: "bg-sky-600 text-white" };
    case "viewed":
      return { label: "Viewed", className: "bg-indigo-600 text-white" };
    case "declined":
      return { label: "Declined", className: "bg-oxblood text-white" };
    default:
      return { label: "Draft", className: "bg-obsidian/10 text-obsidian" };
  }
}

/** Signed-but-unconfirmed is called out: only SignWell confirmation satisfies the gate. */
export function sigSourceBadge(
  req: Pick<SignatureRequest, "status" | "statusSource">,
): { label: string; className: string } | null {
  if (req.status !== "signed") return null;
  return req.statusSource === "provider_confirmed"
    ? { label: "SignWell confirmed", className: "bg-emerald-700 text-white" }
    : { label: "Unconfirmed", className: "bg-amber-500 text-white" };
}
