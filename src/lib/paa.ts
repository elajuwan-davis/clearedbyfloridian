import { supabase } from "@/integrations/supabase/client";
import { generateAgreementPdf, downloadPdf } from "@/lib/private-provider-forms";

// Permit Agent Authorization (PAA) — one-time document GCs sign at onboarding.
// Placeholder language pending attorney review.
//
// Signing is real: record_paa_signature() creates the draft row, signwell-send turns the
// generated PDF into a SignWell document, and only the HMAC-verified document_completed
// webhook marks it signed/provider_confirmed. Nothing in the browser can declare it signed.

export const PAA_VERSION = "v0.9 (draft)";
export const PAA_DRAFT_NOTICE = "DRAFT — PENDING ATTORNEY REVIEW";

export const PAA_TITLE = "Permit Agent Authorization";

export const PAA_BODY: Array<{ heading: string; body: string }> = [
  {
    heading: "1. Appointment of Authorized Agent",
    body: 'The undersigned general contractor ("Contractor") appoints Cléared, the private provider permitting division of Flōridian LLC ("Cléared"), as its authorized permit agent for all building permit activity undertaken on Contractor\'s behalf in the State of Florida. This appointment remains in effect until revoked in writing by Contractor.',
  },
  {
    heading: "2. Scope of Authority",
    body: "Contractor authorizes Cléared to (a) prepare, sign, and submit permit applications and supporting documents as authorized agent of record; (b) prepare, execute, and file Notices to Owner and Notices to Builder/Owner (NTBO) on Contractor's behalf; (c) communicate directly with building departments, plan reviewers, inspection coordinators, and other municipal officials regarding Contractor's projects; and (d) receive issued permits, permit cards, correction notices, and inspection results on Contractor's behalf.",
  },
  {
    heading: "3. Contractor Responsibilities",
    body: "Contractor remains the licensed qualifier of record for all permitted work and retains sole responsibility for means, methods, code compliance in the field, and payment of all municipal fees. Contractor agrees to provide accurate project information, current license and insurance documentation, and signed and sealed construction documents in a timely manner.",
  },
  {
    heading: "4. Private Provider Services",
    body: "Where Contractor elects private provider plan review or inspection services pursuant to Section 553.791, Florida Statutes, Cléared will furnish the statutory notice to the local building official and perform 2-day plan review and same-day inspections through duly licensed personnel.",
  },
  {
    heading: "5. Fees and Authorization to Charge",
    body: "Contractor authorizes Cléared to advance municipal permit and plan review fees on Contractor's behalf and to charge those amounts, together with Cléared's service fees, to the payment method on file under Contractor's Payment Authorization.",
  },
  {
    heading: "6. Limitation of Authority",
    body: "This authorization does not empower Cléared to enter into construction contracts, waive lien rights, settle claims, or bind Contractor to any obligation unrelated to permit administration.",
  },
  {
    heading: "7. Term and Revocation",
    body: "This authorization is effective on the date signed below and continues until revoked. Revocation does not affect permits already applied for or issued prior to the effective date of revocation.",
  },
];

export type PaaRecord = {
  id: string;
  version: string;
  signerName: string;
  signerEmail: string;
  /** Set by the webhook; absent until SignWell confirms completion. */
  signedAt: string | null;
  provider: string;
  envelopeId: string | null;
  status: "draft" | "sent" | "viewed" | "signed" | "declined";
  statusSource: "provider_confirmed" | "staff_attested";
  embeddedSigningUrl: string | null;
  signatureRequestId: string | null;
};

const TOS_KEY = "cleared.tosAccepted.v1";
export const PAA_EVT = "paa:changed";

/* paa_signatures post-dates the generated Supabase types. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const paaTable = () => supabase.from("paa_signatures" as any) as any;

function mapPaa(row: any): PaaRecord {
  return {
    id: row.id as string,
    version: row.version as string,
    signerName: row.signer_name as string,
    signerEmail: row.signer_email as string,
    signedAt: (row.completed_at as string) ?? null,
    provider: (row.provider as string) ?? "SignWell",
    envelopeId: (row.signwell_document_id as string) ?? (row.envelope_id as string) ?? null,
    status: (row.status as PaaRecord["status"]) ?? "draft",
    statusSource: (row.status_source as PaaRecord["statusSource"]) ?? "staff_attested",
    embeddedSigningUrl: (row.embedded_signing_url as string) ?? null,
    signatureRequestId: (row.signature_request_id as string) ?? null,
  };
}

const PAA_SELECT =
  "id, version, signer_name, signer_email, provider, envelope_id, signwell_document_id, embedded_signing_url, signature_request_id, status, status_source, completed_at, created_at";

/** The tenant's current PAA, whatever state it is in. */
export async function loadPaa(): Promise<PaaRecord | null> {
  const { data, error } = await paaTable()
    .select(PAA_SELECT)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ? mapPaa(data) : null;
}

/**
 * Signed means SignWell said so. The one exception is a row created before the integration
 * existed — it has no SignWell document to confirm, and the validator has always counted it,
 * so revoking it here would lock out accounts that are legitimately authorized.
 */
export function isPaaSigned(rec: PaaRecord | null | undefined): boolean {
  if (rec?.status !== "signed") return false;
  return rec.statusSource === "provider_confirmed" || rec.envelopeId === null;
}

/**
 * Creates the draft row the SignWell send attaches to. The RPC resolves the tenant and
 * stamps the authenticated signer, so a client cannot record a PAA for another account.
 */
export async function createPaaDraft(input: {
  signerName: string;
  signerEmail: string;
}): Promise<PaaRecord> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, string>,
    ) => Promise<{ data: any; error: { message: string } | null }>
  )("record_paa_signature", {
    p_version: PAA_VERSION,
    p_signer_name: input.signerName.trim(),
    p_signer_email: input.signerEmail.trim(),
    p_provider: "SignWell",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("record_paa_signature returned no row");
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PAA_EVT));
  return mapPaa(Array.isArray(data) ? data[0] : data);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The PDF SignWell sends is generated from the same clauses the page renders. */
export async function generatePaaPdf(signerName: string): Promise<Uint8Array> {
  return await generateAgreementPdf({
    title: PAA_TITLE,
    subtitle: `Cléared · ${PAA_VERSION} · ${PAA_DRAFT_NOTICE}`,
    intro:
      "This authorization lets Cléared file NTBOs, submit permit applications as authorized agent, communicate with building departments, and receive issued permits on the Contractor's behalf.",
    facts: [{ label: "Contractor", value: signerName || "—" }],
    sections: PAA_BODY.map((s) => ({ heading: s.heading, body: s.body })),
    signatureLabel: "Authorized signer",
    footer: `${PAA_TITLE} · ${PAA_VERSION}`,
  });
}

export function loadTosAccepted(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOS_KEY);
}

export function acceptTos(): string {
  const at = new Date().toISOString();
  window.localStorage.setItem(TOS_KEY, at);
  window.dispatchEvent(new CustomEvent(PAA_EVT));
  return at;
}

export async function downloadPaa(rec?: PaaRecord | null) {
  if (typeof window === "undefined") return;
  const bytes = await generatePaaPdf(rec?.signerName ?? "");
  downloadPdf(bytes, "cleared-permit-agent-authorization.pdf");
}
