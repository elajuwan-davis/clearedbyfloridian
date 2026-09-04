// Auto-generate Notice of Commencement (Palm Beach County standard form,
// FL Statute §713.13) at permit submission. Pre-filled from permit intake
// data; uploaded to storage and attached to the permit's documents list so
// the GC can review, sign, notarize, record with the County Clerk, then
// re-upload the recorded copy.
//
// Best-effort — failures are logged and swallowed so permit creation is
// never blocked by NOC generation.

import { supabase } from "@/integrations/supabase/client";
import { generateNOC } from "@/lib/private-provider-forms";
import { updatePermitDocuments, type PermitDoc, type PermitRow } from "@/lib/permits-api";
import { buildNOCFields, type NOCFilerType } from "@/lib/noc-fields";

export const NOC_REVIEW_DOC_KEY = "notice_of_commencement_review";
export const NOC_REVIEW_DOC_LABEL = "Notice of Commencement — Review & Sign";

export async function autoGenerateNOCForPermit(permit: PermitRow): Promise<void> {
  try {
    const intake = (permit.intake_payload ?? {}) as Record<string, any>;
    const lender = intake.lender ?? {};
    const architect = intake.architect ?? {};
    const engineer = intake.engineer ?? {};

    const ownerName = [permit.owner_name, permit.owner_entity].filter(Boolean).join(" — ");
    const ownerAddress = (intake.owner_address as string) ?? permit.job_address ?? "";
    const designeeName =
      (intake.designee_name as string) ||
      (architect.firm as string | undefined) ||
      (engineer.firm as string | undefined) ||
      "";

    const scopes: string[] = Array.isArray(intake.scopes) ? intake.scopes : [];
    const improvement =
      scopes.join(", ") ||
      permit.permit_type ||
      permit.description ||
      "General construction improvements";

    // Same field-building logic the intake wizard's live preview uses, so
    // what a GC previews as "exactly what goes out" is exactly what's filed.
    const fields = buildNOCFields({
      propertyAddress: permit.job_address ?? "",
      parcelTaxId: permit.pcn ?? "",
      legalDescription: (intake.legal_description as string) ?? "",
      filerType: (intake.filer_type as NOCFilerType) === "owner_builder" ? "owner_builder" : "gc",
      ownerName,
      ownerAddress,
      contractorName: permit.contractor_company ?? "",
      contractorAddress: permit.company_address ?? "",
      contractorLicense: permit.license_number ?? "",
      contractorPhone: permit.poc_phone ?? permit.signer_phone ?? "",
      ownerPhone: permit.signer_phone ?? "",
      lenderName: (lender.name as string) ?? "",
      lenderAddress: (lender.address as string) ?? "",
      suretyBondAmount: (intake.surety_bond_amount as string) ?? "",
      designeeName,
      designeeAddress: (intake.designee_address as string) ?? "",
      improvementDescription: improvement,
    });

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

    await updatePermitDocuments(permit.id, (existing) => [
      nocEntry,
      ...existing.filter((d) => d.key !== NOC_REVIEW_DOC_KEY),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[NOC] auto-generate failed", e);
  }
}
