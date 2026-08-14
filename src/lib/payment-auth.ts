// Payment authorization — live, backed by public.payment_authorizations.
//
// The card/ACH details themselves never come near this table: those are collected by Stripe
// (createPaymentAuthSetup + the embedded checkout). What lives here is the signed
// authorization to charge them, and it is only "signed" once the SignWell webhook confirms
// document_completed — record_payment_authorization() creates the draft, signwell-send
// attaches the document, and a trigger refuses provider_confirmed from any client.

import { supabase } from "@/integrations/supabase/client";
import { generateAgreementPdf } from "@/lib/private-provider-forms";

export type PaymentAuthRecord = {
  id: string;
  accountHolder: string;
  billingAddress: string;
  authorizationDate: string;
  termsVersion: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined";
  statusSource: "provider_confirmed" | "staff_attested";
  /** Set by the webhook; null until SignWell confirms. */
  completedAt: string | null;
  embeddedSigningUrl: string | null;
  signatureRequestId: string | null;
};

export const PAYMENT_TERMS_VERSION = "v1";

/** The terms the page renders — and the exact text the signed PDF contains. */
export const PAYMENT_AUTH_TERMS: Array<{ heading?: string; body: string }> = [
  {
    body: "By submitting this payment authorization form, I give full authorization to Cleard and its associates for payment of services, permit fees, and any other charges associated with any project under the contractor.",
  },
  {
    heading: "ACH Payment Notice",
    body: "If submitting an ACH payment for Payment of Services, a Debit or Credit card must be on file for payment of municipality permit fees.",
  },
  {
    heading: "Scope of Services",
    body: "Cleard acts solely as a liaison between the Client and government permitting agencies.",
  },
  {
    heading: "Limitation of Liability",
    body: "The Client agrees to indemnify, defend, and hold harmless Cleard, its owners, and employees from any claims arising out of or related to the project, including agency decisions, project delays, and work product accuracy.",
  },
  {
    heading: "No Guarantee of Timelines",
    body: "Turnaround estimates are based on past experience and do not constitute a guarantee.",
  },
  {
    heading: "Strict No-Refund Policy",
    body: "Once the permitting process has commenced, no refunds shall be issued for any reason. A $100 decline fee is assessed if declined payment is not rectified within two business days. All projects cease until payment is made and a 10% fee accrues on the total owed until rectified.",
  },
  { body: "This authorization remains in effect until cancelled in writing." },
];

/* payment_authorizations post-dates the generated Supabase types. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const paTable = () => supabase.from("payment_authorizations" as any) as any;

const SELECT =
  "id, account_holder, billing_address, authorization_date, terms_version, status, status_source, completed_at, embedded_signing_url, signature_request_id, created_at";

function mapRow(row: any): PaymentAuthRecord {
  return {
    id: row.id as string,
    accountHolder: row.account_holder as string,
    billingAddress: row.billing_address as string,
    authorizationDate: row.authorization_date as string,
    termsVersion: (row.terms_version as string) ?? PAYMENT_TERMS_VERSION,
    status: (row.status as PaymentAuthRecord["status"]) ?? "draft",
    statusSource: (row.status_source as PaymentAuthRecord["statusSource"]) ?? "staff_attested",
    completedAt: (row.completed_at as string) ?? null,
    embeddedSigningUrl: (row.embedded_signing_url as string) ?? null,
    signatureRequestId: (row.signature_request_id as string) ?? null,
  };
}

/** The tenant's current authorization, in whatever state it is. */
export async function loadPaymentAuth(): Promise<PaymentAuthRecord | null> {
  const { data, error } = await paTable()
    .select(SELECT)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ? mapRow(data) : null;
}

export function isPaymentAuthSigned(rec: PaymentAuthRecord | null | undefined): boolean {
  return rec?.status === "signed" && rec?.statusSource === "provider_confirmed";
}

export async function createPaymentAuthDraft(input: {
  accountHolder: string;
  billingAddress: string;
  authorizationDate: string;
  signerEmail?: string | null;
}): Promise<PaymentAuthRecord> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, string | null>,
    ) => Promise<{ data: any; error: { message: string } | null }>
  )("record_payment_authorization", {
    p_account_holder: input.accountHolder.trim(),
    p_billing_address: input.billingAddress.trim(),
    p_authorization_date: input.authorizationDate,
    p_signer_email: input.signerEmail ?? null,
    p_terms_version: PAYMENT_TERMS_VERSION,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("record_payment_authorization returned no row");
  return mapRow(Array.isArray(data) ? data[0] : data);
}

export async function revokePaymentAuth(id: string): Promise<void> {
  const { error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, string>,
    ) => Promise<{ error: { message: string } | null }>
  )("revoke_payment_authorization", { p_id: id });
  if (error) throw new Error(error.message);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function generatePaymentAuthPdf(input: {
  accountHolder: string;
  billingAddress: string;
  authorizationDate: string;
}): Promise<Uint8Array> {
  return await generateAgreementPdf({
    title: "Payment Authorization",
    subtitle: `Cleard · Terms ${PAYMENT_TERMS_VERSION}`,
    intro:
      "Card and bank details are collected and stored by Stripe. Cleard never sees or stores payment credentials; this document authorizes Cleard to charge the method on file.",
    facts: [
      { label: "Account holder", value: input.accountHolder },
      { label: "Billing address", value: input.billingAddress },
      { label: "Authorization date", value: input.authorizationDate },
    ],
    sections: PAYMENT_AUTH_TERMS,
    signatureLabel: "Authorized account holder",
    footer: `Payment Authorization · Terms ${PAYMENT_TERMS_VERSION}`,
  });
}

export function detectCardBrand(num: string): string {
  const n = num.replace(/\D/g, "");
  if (!n) return "Unknown";
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(6011|65|64[4-9])/.test(n)) return "Discover";
  return "Unknown";
}
