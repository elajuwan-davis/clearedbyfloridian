// Auto-generate Notice of Commencement (Palm Beach County standard form,
// FL Statute §713.13) at permit submission. Pre-filled from permit intake
// data; uploaded to storage and attached to the permit's documents list so
// the GC can review, sign, notarize, record with the County Clerk, then
// re-upload the recorded copy.
//
// Best-effort — failures are logged and swallowed so permit creation is
// never blocked by NOC generation.

import { supabase } from "@/integrations/supabase/client";
import { generateNOC, type NOCFields } from "@/lib/private-provider-forms";
import { updatePermit, type PermitDoc, type PermitRow } from "@/lib/permits-api";

export const NOC_REVIEW_DOC_KEY = "notice_of_commencement_review";
export const NOC_REVIEW_DOC_LABEL = "Notice of Commencement — Review & Sign";

// Flōridian is the private provider / surety on record.
const FLORIDIAN_PRIVATE_PROVIDER = "Cleard by Flōridian (Flōridian LLC)";
const FLORIDIAN_PROVIDER_ADDRESS = "215 Clematis Street, West Palm Beach, FL 33401";

export async function autoGenerateNOCForPermit(permit: PermitRow): Promise<void> {
  try {
    const intake = (permit.intake_payload ?? {}) as Record<string, any>;
    const lender = intake.lender ?? {};
    const architect = intake.architect ?? {};
    const engineer = intake.engineer ?? {};

    const ownerName = [permit.owner_name, permit.owner_entity].filter(Boolean).join(" — ");
    const designProfessional =
      (architect.firm as string | undefined) ||
      (engineer.firm as string | undefined) ||
      "";

    const scopes: string[] = Array.isArray(intake.scopes) ? intake.scopes : [];
    const improvement =
      scopes.join(", ") || permit.permit_type || permit.description || "General construction improvements";

    const fields: NOCFields = {
      propertyAddress: permit.job_address ?? "",
      parcelTaxId: permit.pcn ?? "",
      legalDescription: (intake.legal_description as string) ?? "",
      ownerName,
      ownerAddress: (intake.owner_address as string) ?? permit.job_address ?? "",
      contractorName: permit.contractor_company ?? "",
      contractorAddress: permit.company_address ?? "",
      contractorLicense: permit.license_number ?? "",
      contractorPhone: permit.poc_phone ?? permit.signer_phone ?? "",
      lenderName: (lender.name as string) ?? "",
      lenderAddress: (lender.address as string) ?? "",
      suretyName: FLORIDIAN_PRIVATE_PROVIDER,
      suretyAddress: FLORIDIAN_PROVIDER_ADDRESS,
      suretyBondAmount: "",
      designProfessional,
      designProfessionalAddress: "",
      improvementDescription: improvement,
    };

    const bytes = await generateNOC(fields);
    const filename = `NOC_${permit.id}.pdf`;
    const path = `noc/${permit.id}/${Date.now()}-noc.pdf`;

    const { error: upErr } = await supabase.storage
      .from("permit-files")
      .upload(path, new Blob([bytes as any], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    // Append (or replace) the "Review & Sign" doc entry so the GC sees it
    // in the permit detail's Documents section.
    const nowIso = new Date().toISOString();
    const nocEntry: PermitDoc = {
      key: NOC_REVIEW_DOC_KEY,
      label: NOC_REVIEW_DOC_LABEL,
      required: false,
      status: "uploaded",
      filename,
      path,
      mime: "application/pdf",
      uploaded_at: nowIso,
      source: "library",
    };

    const existing = permit.documents ?? [];
    const next = [nocEntry, ...existing.filter((d) => d.key !== NOC_REVIEW_DOC_KEY)];
    await updatePermit(permit.id, { documents: next });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[NOC] auto-generate failed", e);
  }
}
