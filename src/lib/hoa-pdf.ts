// HOA PDF generators — boilerplate ARC submittal + Olympia-style Removal Agreement.
// Both produced with pdf-lib in the browser and uploaded to permit-files storage.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabase } from "@/integrations/supabase/client";
import {
  HOA_PROJECT_TYPE_LABELS,
  type HoaSubmittalRow,
  updateHoaSubmittal,
} from "@/lib/hoa-submittals";

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function drawHeader(pdf: PDFDocument, title: string, subtitle: string): Promise<{ page: any; font: any; bold: any; y: number }> {
  const page = pdf.addPage([612, 792]); // Letter
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const width = page.getWidth();

  page.drawText(title, { x: 54, y: 740, size: 18, font: bold, color: rgb(0.08, 0.19, 0.34) });
  page.drawText(subtitle, { x: 54, y: 720, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawLine({ start: { x: 54, y: 710 }, end: { x: width - 54, y: 710 }, thickness: 0.75, color: rgb(0.08, 0.19, 0.34) });
  return { page, font, bold, y: 690 };
}

function line(page: any, label: string, value: string, y: number, font: any, bold: any): number {
  page.drawText(label, { x: 54, y, size: 10, font: bold, color: rgb(0.15, 0.15, 0.15) });
  const v = value && value.length > 0 ? value : "—";
  page.drawText(v, { x: 200, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
  return y - 18;
}

function wrapText(page: any, text: string, x: number, y: number, maxWidth: number, font: any, size: number): number {
  const words = (text || "").split(/\s+/);
  let curr = "";
  let cy = y;
  for (const w of words) {
    const test = curr ? `${curr} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      page.drawText(curr, { x, y: cy, size, font, color: rgb(0.1, 0.1, 0.1) });
      cy -= size + 4;
      curr = w;
    } else {
      curr = test;
    }
  }
  if (curr) {
    page.drawText(curr, { x, y: cy, size, font, color: rgb(0.1, 0.1, 0.1) });
    cy -= size + 4;
  }
  return cy;
}

/** Boilerplate ARC / HOA submittal PDF. Uploads and stamps the row. */
export async function generateBoilerplatePdf(row: HoaSubmittalRow): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const { page, font, bold, y: startY } = await drawHeader(
    pdf,
    "HOA / ARC Submittal Application",
    `Prepared via Cleard by Flōridian · ${new Date().toLocaleDateString("en-US")}`,
  );

  let y = startY;
  y = line(page, "HOA / Association", row.hoa_name ?? "", y, font, bold);
  y = line(page, "Community", row.community_name ?? "", y, font, bold);
  y = line(page, "Village", row.village_name ?? "", y, font, bold);
  y = line(page, "Model Type", row.model_type ?? "", y, font, bold);
  y -= 6;
  y = line(page, "Applicant", row.applicant_name ?? "", y, font, bold);
  y = line(page, "Email", row.applicant_email ?? "", y, font, bold);
  y = line(page, "Phone", row.applicant_phone ?? "", y, font, bold);
  y = line(page, "Property Address", row.property_address ?? "", y, font, bold);
  y = line(page, "Lot / Block / Plat", [row.lot, row.block, row.plat_name].filter(Boolean).join(" / ") || "", y, font, bold);
  y -= 6;
  y = line(page, "Project Type", row.project_type ? HOA_PROJECT_TYPE_LABELS[row.project_type] : "", y, font, bold);
  y = line(page, "Estimated Start", row.estimated_start_date ?? "", y, font, bold);
  y = line(page, "Contractor", row.contractor_name ?? "", y, font, bold);
  y = line(page, "Contractor License", row.contractor_license ?? "", y, font, bold);
  y = line(page, "Deposit Amount", row.deposit_amount_cents > 0 ? fmtMoney(row.deposit_amount_cents) : "", y, font, bold);
  y = line(page, "COI Attached", row.coi_attached ? "Yes" : "No", y, font, bold);
  y = line(page, "Plans Attached", row.plans_attached ? "Yes" : "No", y, font, bold);

  y -= 12;
  page.drawText("Project Description / Scope of Work", { x: 54, y, size: 11, font: bold, color: rgb(0.08, 0.19, 0.34) });
  y -= 16;
  const scope = row.scope_of_work || row.project_description || "";
  y = wrapText(page, scope, 54, y, 504, font, 10);

  y -= 20;
  page.drawLine({ start: { x: 54, y }, end: { x: 300, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Applicant Signature", { x: 54, y: y - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawLine({ start: { x: 340, y }, end: { x: 540, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Date", { x: 340, y: y - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const bytes = await pdf.save();
  return bytes;
}

/** Olympia-style Removal Agreement for fence projects. */
export async function generateRemovalAgreementPdf(row: HoaSubmittalRow): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const { page, font, bold, y: startY } = await drawHeader(
    pdf,
    "Removal Agreement",
    "To be signed by the property owner and notarized",
  );

  let y = startY;
  y = line(page, "Owner", row.applicant_name ?? "", y, font, bold);
  y = line(page, "Improvement Type", row.project_type === "fence" ? "Fence" : (row.project_type ? HOA_PROJECT_TYPE_LABELS[row.project_type] : ""), y, font, bold);
  y = line(page, "Lot", row.lot ?? "", y, font, bold);
  y = line(page, "Block", row.block ?? "", y, font, bold);
  y = line(page, "Plat Name", row.plat_name ?? "", y, font, bold);
  y = line(page, "Property Address", row.property_address ?? "", y, font, bold);
  y = line(page, "Date", new Date().toLocaleDateString("en-US"), y, font, bold);

  y -= 12;
  const clause =
    "The undersigned Owner agrees that the above-referenced improvement has been installed at the Owner's sole risk. In the event the Association requires removal, relocation, or modification of the improvement for any reason (including but not limited to maintenance, repair, or violation of governing documents), the Owner shall remove, relocate, or modify the improvement at Owner's sole cost and expense within thirty (30) days of written notice. This obligation binds the Owner, Owner's successors, and assigns.";
  y = wrapText(page, clause, 54, y, 504, font, 10);

  y -= 24;
  page.drawLine({ start: { x: 54, y }, end: { x: 300, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Owner Signature", { x: 54, y: y - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawLine({ start: { x: 340, y }, end: { x: 540, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Date", { x: 340, y: y - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  y -= 60;
  page.drawText("STATE OF FLORIDA", { x: 54, y, size: 10, font: bold });
  y -= 14;
  page.drawText("COUNTY OF __________________", { x: 54, y, size: 10, font: bold });
  y -= 20;
  y = wrapText(
    page,
    "Sworn to (or affirmed) and subscribed before me by means of ☐ physical presence or ☐ online notarization, this _____ day of ____________, 20____, by _______________________________, who is personally known to me or has produced _______________________ as identification.",
    54, y, 504, font, 10,
  );

  y -= 20;
  page.drawLine({ start: { x: 54, y }, end: { x: 300, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Notary Public Signature", { x: 54, y: y - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawLine({ start: { x: 340, y }, end: { x: 540, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
  page.drawText("Commission Expires", { x: 340, y: y - 12, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  return await pdf.save();
}

async function uploadPdf(submittalId: string, subfolder: string, bytes: Uint8Array, filename: string): Promise<string> {
  const path = `hoa/${submittalId}/${subfolder}/${Date.now()}-${filename}`;
  const { error } = await supabase.storage
    .from("permit-files")
    .upload(path, new Blob([bytes as any], { type: "application/pdf" }), {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) throw error;
  return path;
}

/** Generate the boilerplate submittal PDF, upload it, and record the path. */
export async function buildAndStoreBoilerplate(row: HoaSubmittalRow): Promise<string> {
  const bytes = await generateBoilerplatePdf(row);
  const path = await uploadPdf(row.id, "generated", bytes, "hoa-submittal.pdf");
  await updateHoaSubmittal(row.id, { generated_pdf_path: path });
  return path;
}

/** Generate the Removal Agreement PDF (fence projects), upload, and record. */
export async function buildAndStoreRemovalAgreement(row: HoaSubmittalRow): Promise<string> {
  const bytes = await generateRemovalAgreementPdf(row);
  const path = await uploadPdf(row.id, "removal-agreement", bytes, "removal-agreement.pdf");
  await updateHoaSubmittal(row.id, { removal_agreement_path: path });
  return path;
}
