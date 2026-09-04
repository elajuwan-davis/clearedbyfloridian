// Limited Power of Attorney (LPOA) — FL Statute 553.791 affidavit of agency.
//
// The clauses below are the single source of truth: the page renders them and the PDF sent
// to SignWell is generated from the same array, so what is signed is what was shown.
// record_lpoa_signature() creates the draft row; only the HMAC-verified document_completed
// webhook can mark it signed/provider_confirmed.

import { supabase } from "@/integrations/supabase/client";
import { generateAgreementPdf } from "@/lib/private-provider-forms";

export { isLpoaSigned } from "@/lib/lpoa-status";

export const LPOA_REVISION = "2026.06";
export const LPOA_TITLE = "Affidavit of Agency & Limited Power of Attorney";
export const LPOA_SUBTITLE =
  "Under FL Statute 553.791 — Private Provider Inspection & Plans Review";

export const LPOA_PREAMBLE =
  "The undersigned, being the duly authorized qualifying agent for the licensed General Contractor of record, does hereby designate and appoint Cleard as the private provider of record for permit applications submitted through this portal.";

export const LPOA_ATTESTATION =
  "By signing below under penalty of perjury, I affirm that I am the qualifying agent authorized to bind the General Contractor identified on this account, and that all information provided in connection with this LPOA is true and correct to the best of my knowledge.";

export const LPOA_CLAUSES: Array<{ title: string; body: string }> = [
  {
    title: "Scope of Authority",
    body: "Cleard is empowered to prepare, sign, and submit the affidavit of compliance under FL Statute 553.791; to perform plans review and inspections to verify compliance with the Florida Building Code; and to issue the certificate of compliance to the authority having jurisdiction.",
  },
  {
    title: "Statutory Deadlines Acknowledged",
    body: "I acknowledge that filing the affidavit obligates the AHJ to issue the permit or written citation within 10 business days, and that the certificate of compliance obligates the AHJ to issue the certificate of occupancy for residential work within 2 business days.",
  },
  {
    title: "Inspections",
    body: "Cleard may perform inspections directly or through duly licensed inspectors operating under its supervision. Real-time virtual inspections are conducted with a 48-hour correction window per round.",
  },
  {
    title: "Fees",
    body: "I acknowledge that Cleard's fees — a permitting fee equal to 1.5% of construction value and a flat private-provider administration fee of $8,856.00 per filing — are invoiced automatically upon submission of the affidavit, and that county fees, if any, are separate and pass through to the AHJ.",
  },
  {
    title: "Revocation",
    body: "This authorization remains in effect until revoked in writing. Revocation does not relieve the GC of liability for filings made while this LPOA was effective and does not affect inspections or certificates already issued.",
  },
  {
    title: "Indemnification",
    body: "Cleard shall be indemnified against losses arising from materially false or incomplete information supplied by the GC, its design professionals, or its subcontractors. Cleard remains liable for its own negligent acts in performing plans review and inspections to the extent provided by Florida law.",
  },
];

export type LpoaRecord = {
  id: string;
  signerName: string;
  signerTitle: string;
  licenseNumber: string;
  revision: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined";
  statusSource: "provider_confirmed" | "staff_attested";
  completedAt: string | null;
  embeddedSigningUrl: string | null;
  signatureRequestId: string | null;
};

/* lpoa_signatures post-dates the generated Supabase types. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const lpoaTable = () => supabase.from("lpoa_signatures" as any) as any;

const SELECT =
  "id, signer_name, signer_title, license_number, document_revision, status, status_source, completed_at, embedded_signing_url, signature_request_id, created_at";

function mapRow(row: any): LpoaRecord {
  return {
    id: row.id as string,
    signerName: row.signer_name as string,
    signerTitle: (row.signer_title as string) ?? "",
    licenseNumber: (row.license_number as string) ?? "",
    revision: (row.document_revision as string) ?? LPOA_REVISION,
    status: (row.status as LpoaRecord["status"]) ?? "draft",
    statusSource: (row.status_source as LpoaRecord["statusSource"]) ?? "staff_attested",
    completedAt: (row.completed_at as string) ?? null,
    embeddedSigningUrl: (row.embedded_signing_url as string) ?? null,
    signatureRequestId: (row.signature_request_id as string) ?? null,
  };
}

export async function loadLpoa(): Promise<LpoaRecord | null> {
  const { data, error } = await lpoaTable()
    .select(SELECT)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ? mapRow(data) : null;
}

export async function createLpoaDraft(input: {
  signerName: string;
  signerTitle: string;
  licenseNumber: string;
  signerEmail?: string | null;
}): Promise<LpoaRecord> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, string | null>,
    ) => Promise<{ data: any; error: { message: string } | null }>
  )("record_lpoa_signature", {
    p_signer_name: input.signerName.trim(),
    p_signer_title: input.signerTitle.trim(),
    p_license_number: input.licenseNumber.trim(),
    p_signer_email: input.signerEmail ?? null,
    p_document_revision: LPOA_REVISION,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("record_lpoa_signature returned no row");
  return mapRow(Array.isArray(data) ? data[0] : data);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function generateLpoaPdf(input: {
  signerName: string;
  signerTitle: string;
  licenseNumber: string;
  executionDate: string;
}): Promise<Uint8Array> {
  return await generateAgreementPdf({
    title: LPOA_TITLE,
    subtitle: `${LPOA_SUBTITLE} · Rev. ${LPOA_REVISION}`,
    intro: LPOA_PREAMBLE,
    facts: [
      { label: "Qualifying agent", value: input.signerName },
      { label: "Title / role", value: input.signerTitle },
      { label: "FL contractor license", value: input.licenseNumber },
      { label: "Date of execution", value: input.executionDate },
    ],
    sections: LPOA_CLAUSES.map((c, i) => ({
      heading: `${String(i + 1).padStart(2, "0")}. ${c.title}`,
      body: c.body,
    })),
    signatureLabel: "Qualifying agent",
    footer: `${LPOA_TITLE} · Rev. ${LPOA_REVISION}`,
  });
}
