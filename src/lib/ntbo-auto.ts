// Auto-generate NTBO (Notice to Building Official) on permit submission.
// Runs on the GC's browser after createPermit; the GC never sees the file.
// Uploads the PDF to storage under ntbo/<permitId>/…-ntbo.pdf.
// Failures are swallowed — permit creation must not fail because of NTBO.

import { supabase } from "@/integrations/supabase/client";
import { generateNTBO } from "@/lib/private-provider-forms";
import { buildNTBOFields } from "@/lib/noc-fields";
import type { PermitRow } from "@/lib/permits-api";

export async function autoGenerateNTBOForPermit(permit: PermitRow): Promise<void> {
  try {
    // Same field-building logic the intake wizard's live preview uses, so
    // what a GC previews as "exactly what goes out" is exactly what's filed.
    const fields = buildNTBOFields({
      projectName: permit.project_name,
      parcelTaxId: permit.pcn ?? "",
    });
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
