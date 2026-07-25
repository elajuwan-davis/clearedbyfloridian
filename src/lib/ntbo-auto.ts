// Auto-generate NTBO (Notice to Building Official) on permit submission.
// Runs on the GC's browser after createPermit; the GC never sees the file.
// Uploads the PDF to storage under ntbo/<permitId>/…-ntbo.pdf.
// Failures are swallowed — permit creation must not fail because of NTBO.

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

export async function autoGenerateNTBOForPermit(permit: PermitRow): Promise<void> {
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
    const path = `ntbo/${permit.id}/${Date.now()}-ntbo.pdf`;
    const { error: upErr } = await supabase.storage
      .from("permit-files")
      .upload(path, new Blob([bytes as any], { type: "application/pdf" }), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;
  } catch (e) {
    // Best-effort — do not surface to GC.
    // eslint-disable-next-line no-console
    console.warn("[NTBO] auto-generate failed", e);
  }
}
