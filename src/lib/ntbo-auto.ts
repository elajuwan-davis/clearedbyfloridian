// Auto-generate NTO (Notice to Building Official) on permit submission.
// Runs on the GC's browser after createPermit; the GC never sees the file.
// Uploads the PDF to storage and inserts an nto_filings row.
// Failures are swallowed — permit creation must not fail because of NTO.

import { supabase } from "@/integrations/supabase/client";
import { generateNTBO, type NTBOFields } from "@/lib/private-provider-forms";
import type { PermitRow } from "@/lib/permits-api";

// Hardcoded Flōridian private-provider identity.
const FLORIDIAN = {
  firmName: "Flōridian LLC",
  privateProvider: "Cleared by Flōridian",
  addressLine1: "215 Clematis Street",
  addressLine2: "West Palm Beach, FL 33401",
  telephone: "(561) 555-0100",
  email: "permits@floridianinc.com",
  licenseNumber: "CGC1234567",
};

function scopeSummary(row: PermitRow): string {
  const scope = (row.intake_payload as any)?.scope;
  if (Array.isArray(scope) && scope.length) return scope.join(", ");
  return row.permit_type ?? row.description ?? "General construction";
}

export async function autoGenerateNTOForPermit(permit: PermitRow): Promise<void> {
  try {
    const fields: NTBOFields = {
      projectName: permit.project_name,
      parcelTaxId: permit.pcn ?? "",
      services: { plansReview: true, inspections: true },
      signatoryType: "LLC",
      firmName: FLORIDIAN.firmName,
      privateProvider: FLORIDIAN.privateProvider,
      addressLine1: FLORIDIAN.addressLine1,
      addressLine2: FLORIDIAN.addressLine2,
      telephone: FLORIDIAN.telephone,
      email: FLORIDIAN.email,
      licenseNumber: FLORIDIAN.licenseNumber,
      printNameCorporation: FLORIDIAN.firmName,
      representativeName: FLORIDIAN.privateProvider,
    };
    const bytes = await generateNTBO(fields);
    const path = `nto/${permit.id}/${Date.now()}-nto.pdf`;
    const { error: upErr } = await supabase.storage
      .from("permit-files")
      .upload(path, new Blob([bytes as any], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    const workDescription = scopeSummary(permit);
    const contractorAddress =
      permit.company_address ?? permit.job_address ?? "";
    await supabase.from("nto_filings" as any).insert({
      permit_id: permit.id,
      owner_name: permit.owner_name,
      owner_address: permit.job_address,
      property_address: permit.job_address,
      contractor_name: permit.contractor_company ?? FLORIDIAN.firmName,
      contractor_address: contractorAddress || FLORIDIAN.addressLine1,
      work_description: workDescription,
      first_work_date: permit.submitted_date,
      status: "generated",
      pdf_path: path,
    });
  } catch (e) {
    // Best-effort — do not surface to GC.
    // eslint-disable-next-line no-console
    console.warn("[NTO] auto-generate failed", e);
  }
}
