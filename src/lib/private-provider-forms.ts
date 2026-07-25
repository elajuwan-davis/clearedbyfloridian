// PDF generation for the two private-provider forms.
// Generates clean pre-filled PDFs from scratch using pdf-lib.
// (When the official PDF templates are re-uploaded, swap to overlay mode.)

import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";

export type NTBOFields = {
  projectName: string;
  parcelTaxId: string;
  services: { plansReview: boolean; inspections: boolean };
  signatoryType: "Corporation" | "Individual" | "LLC" | "Partnership";
  firmName: string;
  privateProvider: string;
  addressLine1: string;
  addressLine2: string;
  telephone: string;
  email: string;
  licenseNumber: string;
  printNameCorporation: string;
  representativeName: string;
};

export type OwnerAuthFields = {
  propertyAddress: string;
  permitProjectNo: string;
  firmName: string;
  privateProvider: string;
  telephone: string;
  email: string;
  licenseNumber: string;
};

export type NOCFields = {
  propertyAddress: string;
  parcelTaxId: string;
  legalDescription: string;
  ownerName: string;
  ownerAddress: string;
  contractorName: string;
  contractorAddress: string;
  contractorLicense: string;
  contractorPhone: string;
  lenderName: string;
  lenderAddress: string;
  suretyName: string;
  suretyAddress: string;
  suretyBondAmount: string;
  designProfessional: string;
  designProfessionalAddress: string;
  improvementDescription: string;
};

// -------- helpers --------

type DrawCtx = {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
};

const MARGIN = 54; // 0.75in
const PAGE_W = 612; // Letter
const PAGE_H = 792;
const INK = rgb(0.05, 0.05, 0.05);
const MUTED = rgb(0.35, 0.35, 0.35);
const RULE = rgb(0.75, 0.75, 0.75);
const OBSIDIAN = rgb(0.082, 0.192, 0.341); // #153157

function drawWrapped(
  ctx: DrawCtx,
  text: string,
  opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth?: number; lineGap?: number } = {},
) {
  const size = opts.size ?? 10;
  const font = opts.font ?? ctx.font;
  const color = opts.color ?? INK;
  const maxWidth = opts.maxWidth ?? PAGE_W - MARGIN * 2;
  const lineGap = opts.lineGap ?? 3;
  const words = text.split(/\s+/);
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  for (const l of lines) {
    ctx.page.drawText(l, { x: MARGIN, y: ctx.y, size, font, color });
    ctx.y -= size + lineGap;
  }
}

function drawLabelValue(ctx: DrawCtx, label: string, value: string) {
  const labelSize = 8;
  const valueSize = 11;
  ctx.page.drawText(label.toUpperCase(), {
    x: MARGIN,
    y: ctx.y,
    size: labelSize,
    font: ctx.bold,
    color: MUTED,
  });
  ctx.y -= labelSize + 4;
  ctx.page.drawText(value || "—", {
    x: MARGIN,
    y: ctx.y,
    size: valueSize,
    font: ctx.font,
    color: INK,
  });
  ctx.y -= valueSize + 4;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: RULE,
  });
  ctx.y -= 14;
}

function drawHeader(ctx: DrawCtx, title: string, subtitle: string) {
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_H - 100,
    width: PAGE_W,
    height: 100,
    color: OBSIDIAN,
  });
  ctx.page.drawText("FLŌRIDIAN — CLEARED PRIVATE PROVIDER", {
    x: MARGIN,
    y: PAGE_H - 45,
    size: 9,
    font: ctx.bold,
    color: rgb(0.71, 0.855, 0.918), // Sky
  });
  ctx.page.drawText(title, {
    x: MARGIN,
    y: PAGE_H - 68,
    size: 18,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText(subtitle, {
    x: MARGIN,
    y: PAGE_H - 88,
    size: 9,
    font: ctx.font,
    color: rgb(0.85, 0.85, 0.85),
  });
  ctx.y = PAGE_H - 130;
}

function drawSectionTitle(ctx: DrawCtx, text: string) {
  ctx.y -= 4;
  ctx.page.drawText(text.toUpperCase(), {
    x: MARGIN,
    y: ctx.y,
    size: 9,
    font: ctx.bold,
    color: OBSIDIAN,
  });
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: OBSIDIAN,
  });
  ctx.y -= 14;
}

function drawCheckbox(ctx: DrawCtx, x: number, checked: boolean, label: string) {
  const y = ctx.y;
  ctx.page.drawRectangle({
    x,
    y,
    width: 10,
    height: 10,
    borderColor: INK,
    borderWidth: 0.8,
  });
  if (checked) {
    ctx.page.drawText("X", {
      x: x + 2,
      y: y + 1,
      size: 9,
      font: ctx.bold,
      color: INK,
    });
  }
  ctx.page.drawText(label, {
    x: x + 16,
    y: y + 1,
    size: 10,
    font: ctx.font,
    color: INK,
  });
}

async function initDoc(): Promise<{ pdf: PDFDocument; ctx: DrawCtx }> {
  const pdf = await PDFDocument.create();
  pdf.setCreator("Cleared by Flōridian");
  pdf.setProducer("Cleared by Flōridian");
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  return { pdf, ctx: { page, font, bold, y: PAGE_H - 130 } };
}

function drawFooter(ctx: DrawCtx, label: string) {
  ctx.page.drawLine({
    start: { x: MARGIN, y: 60 },
    end: { x: PAGE_W - MARGIN, y: 60 },
    thickness: 0.5,
    color: RULE,
  });
  ctx.page.drawText(label, {
    x: MARGIN,
    y: 46,
    size: 7.5,
    font: ctx.font,
    color: MUTED,
  });
  ctx.page.drawText(new Date().toLocaleString(), {
    x: PAGE_W - MARGIN - 120,
    y: 46,
    size: 7.5,
    font: ctx.font,
    color: MUTED,
  });
}

// -------- NTBO --------

export async function generateNTBO(fields: NTBOFields): Promise<Uint8Array> {
  const { pdf, ctx } = await initDoc();
  drawHeader(
    ctx,
    "Notice to Building Official",
    "Use of Private Provider — Form 61G20-2.005 · FL Statute §553.791",
  );

  drawWrapped(
    ctx,
    "The undersigned owner or authorized agent hereby notifies the Building Official that the private provider identified below has been retained to perform the plans review and/or inspection services identified for the project below, pursuant to §553.791, Florida Statutes.",
    { size: 9.5, color: MUTED, lineGap: 3 },
  );
  ctx.y -= 6;

  drawSectionTitle(ctx, "Project Information");
  drawLabelValue(ctx, "Project Name", fields.projectName);
  drawLabelValue(ctx, "Parcel Tax ID (PCN)", fields.parcelTaxId);

  drawSectionTitle(ctx, "Services Retained");
  drawCheckbox(ctx, MARGIN, fields.services.plansReview, "Plans Review");
  drawCheckbox(ctx, MARGIN + 180, fields.services.inspections, "Inspections");
  ctx.y -= 22;

  drawSectionTitle(ctx, "Private Provider");
  drawLabelValue(ctx, "Private Provider Firm", fields.firmName);
  drawLabelValue(ctx, "Private Provider (Individual)", fields.privateProvider);
  drawLabelValue(ctx, "Address", `${fields.addressLine1}\n${fields.addressLine2}`.replace(/\n/g, "  ·  "));
  drawLabelValue(ctx, "Telephone", fields.telephone);
  drawLabelValue(ctx, "Email", fields.email);
  drawLabelValue(ctx, "Florida License #", fields.licenseNumber);

  drawSectionTitle(ctx, "Signatory");
  ctx.page.drawText(`Signatory Type: ${fields.signatoryType}`, {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.font,
    color: INK,
  });
  ctx.y -= 18;

  drawLabelValue(ctx, "Print Name (Corporation)", fields.printNameCorporation);
  drawLabelValue(ctx, "Representative Name", fields.representativeName);

  // Signature block
  ctx.y -= 10;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + 260, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  ctx.page.drawLine({
    start: { x: PAGE_W - MARGIN - 140, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  ctx.y -= 12;
  ctx.page.drawText("Signature", { x: MARGIN, y: ctx.y, size: 8, font: ctx.font, color: MUTED });
  ctx.page.drawText("Date", { x: PAGE_W - MARGIN - 140, y: ctx.y, size: 8, font: ctx.font, color: MUTED });

  drawFooter(ctx, "Generated by Cleared by Flōridian — review before submission.");
  return pdf.save();
}

// -------- Owner Authorization --------

export async function generateOwnerAuth(fields: OwnerAuthFields): Promise<Uint8Array> {
  const { pdf, ctx } = await initDoc();
  drawHeader(
    ctx,
    "Private Provider Owner Authorization",
    "Owner Authorization & Indemnification — FL Statute §553.791",
  );

  drawWrapped(
    ctx,
    "The undersigned owner of the property described below hereby authorizes the private provider firm named herein to act as the private provider for plans review and/or inspection services under §553.791, Florida Statutes, and agrees to the indemnification set forth in that section.",
    { size: 9.5, color: MUTED, lineGap: 3 },
  );
  ctx.y -= 6;

  drawSectionTitle(ctx, "Property");
  drawLabelValue(ctx, "Property Address", fields.propertyAddress);
  drawLabelValue(ctx, "Permit / Project No.", fields.permitProjectNo);

  drawSectionTitle(ctx, "Private Provider Firm");
  drawLabelValue(ctx, "Firm Name", fields.firmName);
  drawLabelValue(ctx, "Private Provider", fields.privateProvider);
  drawLabelValue(ctx, "Telephone", fields.telephone);
  drawLabelValue(ctx, "Email", fields.email);
  drawLabelValue(ctx, "Florida License #", fields.licenseNumber);

  drawSectionTitle(ctx, "Owner Acknowledgment");
  drawWrapped(
    ctx,
    "By signing below, the owner acknowledges receipt of the private provider disclosure statement required by §553.791(4), Florida Statutes, and authorizes the firm named above to perform the selected services on the owner's behalf.",
    { size: 9, color: INK, lineGap: 3 },
  );

  ctx.y -= 24;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + 260, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  ctx.page.drawLine({
    start: { x: PAGE_W - MARGIN - 140, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  ctx.y -= 12;
  ctx.page.drawText("Owner Signature", { x: MARGIN, y: ctx.y, size: 8, font: ctx.font, color: MUTED });
  ctx.page.drawText("Date", { x: PAGE_W - MARGIN - 140, y: ctx.y, size: 8, font: ctx.font, color: MUTED });
  ctx.y -= 24;
  ctx.page.drawText("Print Owner Name:  ______________________________________________", {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.font,
    color: INK,
  });

  drawFooter(ctx, "Generated by Cleared by Flōridian — review before submission.");
  return pdf.save();
}

// -------- download helper --------

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const view = new Uint8Array(bytes);
  const arrayBuffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
