// Notice of Change of Private Provider (Section 553.791, F.S.)
// Plain, unbranded government-style form: PDF generation + frontend recording queue stub.
// NOTE: the recording queue is intentionally local-only for now — no backend wiring yet.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ChangeOfProviderFields = {
  // Project information
  projectAddress: string;
  permitNumbers: string;
  jurisdiction: string;
  propertyOwnerName: string;
  legalDescription: string;
  // Previous private provider
  prevFirmName: string;
  prevLicenseNumber: string;
  prevTerminationDate: string;
  prevReasonForChange: string;
  // New private provider
  newFirmName: string;
  newLicenseNumber: string;
  newAddress: string;
  newPhoneEmail: string;
  newEffectiveDate: string;
  newScopeOfServices: string;
  // Signatures
  ownerPrintedName: string;
  ownerDate: string;
  providerPrintedName: string;
  providerDate: string;
};

export const ASSUMPTION_OF_DUTIES_TEXT =
  "The undersigned new private provider acknowledges responsibility for building code compliance services for this project from the effective date above forward, including review of prior inspection records and any necessary re-inspection of work completed under the previous private provider.";

export const JURISDICTION_HELPER_NOTE =
  "Confirm the exact form, required attachments, and submission deadline with the local jurisdiction — requirements vary by county/city.";

export function emptyChangeOfProviderFields(): ChangeOfProviderFields {
  return {
    projectAddress: "",
    permitNumbers: "",
    jurisdiction: "",
    propertyOwnerName: "",
    legalDescription: "",
    prevFirmName: "",
    prevLicenseNumber: "",
    prevTerminationDate: "",
    prevReasonForChange: "",
    newFirmName: "",
    newLicenseNumber: "",
    newAddress: "",
    newPhoneEmail: "",
    newEffectiveDate: "",
    newScopeOfServices: "",
    ownerPrintedName: "",
    ownerDate: "",
    providerPrintedName: "",
    providerDate: "",
  };
}

// ---------- PDF ----------

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const INK = rgb(0, 0, 0);
const MUTED = rgb(0.4, 0.4, 0.4);
const RULE = rgb(0.7, 0.7, 0.7);

function safe(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .filter((ch) => ch.charCodeAt(0) <= 0xff)
    .join("");
}

type Ctx = { pdf: PDFDocument; page: PDFPage; font: PDFFont; bold: PDFFont; y: number };

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed >= 64) return;
  ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function paragraph(ctx: Ctx, text: string, size = 9, color = INK, font?: PDFFont) {
  const f = font ?? ctx.font;
  const lines = wrap(text, f, size, PAGE_W - MARGIN * 2);
  ensureSpace(ctx, lines.length * (size + 3));
  for (const l of lines) {
    ctx.page.drawText(l, { x: MARGIN, y: ctx.y, size, font: f, color });
    ctx.y -= size + 3;
  }
}

function sectionTitle(ctx: Ctx, text: string) {
  ensureSpace(ctx, 34);
  ctx.y -= 10;
  ctx.page.drawText(safe(text).toUpperCase(), {
    x: MARGIN,
    y: ctx.y,
    size: 9.5,
    font: ctx.bold,
    color: INK,
  });
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: INK,
  });
  ctx.y -= 16;
}

function field(ctx: Ctx, label: string, value: string) {
  ensureSpace(ctx, 40);
  ctx.page.drawText(safe(label), { x: MARGIN, y: ctx.y, size: 8, font: ctx.bold, color: MUTED });
  ctx.y -= 13;
  const lines = wrap(value || " ", ctx.font, 10.5, PAGE_W - MARGIN * 2);
  for (const l of lines) {
    ctx.page.drawText(l, { x: MARGIN, y: ctx.y, size: 10.5, font: ctx.font, color: INK });
    ctx.y -= 13;
  }
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y + 3 },
    end: { x: PAGE_W - MARGIN, y: ctx.y + 3 },
    thickness: 0.5,
    color: RULE,
  });
  ctx.y -= 12;
}

function signatureBlock(ctx: Ctx, role: string, printedName: string, date: string) {
  ensureSpace(ctx, 78);
  ctx.page.drawText(safe(role), { x: MARGIN, y: ctx.y, size: 9, font: ctx.bold, color: INK });
  ctx.y -= 34;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: MARGIN + 300, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  ctx.page.drawLine({
    start: { x: PAGE_W - MARGIN - 130, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.8,
    color: INK,
  });
  if (date) {
    ctx.page.drawText(safe(date), {
      x: PAGE_W - MARGIN - 128,
      y: ctx.y + 4,
      size: 10,
      font: ctx.font,
      color: INK,
    });
  }
  ctx.y -= 11;
  ctx.page.drawText("Signature", { x: MARGIN, y: ctx.y, size: 8, font: ctx.font, color: MUTED });
  ctx.page.drawText("Date", {
    x: PAGE_W - MARGIN - 130,
    y: ctx.y,
    size: 8,
    font: ctx.font,
    color: MUTED,
  });
  ctx.y -= 24;
  ctx.page.drawText(safe(`Printed Name: ${printedName || "__________________________________"}`), {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.font,
    color: INK,
  });
  ctx.y -= 20;
}

export async function generateChangeOfProviderPdf(
  f: ChangeOfProviderFields,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { pdf, page, font, bold, y: PAGE_H - MARGIN };

  // Plain government-style heading — deliberately unbranded.
  const title = "NOTICE OF CHANGE OF PRIVATE PROVIDER";
  const tW = bold.widthOfTextAtSize(title, 13);
  ctx.page.drawText(title, {
    x: (PAGE_W - tW) / 2,
    y: ctx.y,
    size: 13,
    font: bold,
    color: INK,
  });
  ctx.y -= 16;
  const sub = "Pursuant to Section 553.791, Florida Statutes";
  const sW = font.widthOfTextAtSize(sub, 9.5);
  ctx.page.drawText(sub, { x: (PAGE_W - sW) / 2, y: ctx.y, size: 9.5, font, color: INK });
  ctx.y -= 18;
  paragraph(ctx, JURISDICTION_HELPER_NOTE, 8, MUTED);
  ctx.y -= 4;

  sectionTitle(ctx, "Project Information");
  field(ctx, "PROJECT ADDRESS", f.projectAddress);
  field(ctx, "PERMIT NUMBER(S)", f.permitNumbers);
  field(ctx, "JURISDICTION / BUILDING DEPARTMENT", f.jurisdiction);
  field(ctx, "PROPERTY OWNER NAME", f.propertyOwnerName);
  field(ctx, "LEGAL DESCRIPTION / PARCEL ID", f.legalDescription);

  sectionTitle(ctx, "Previous Private Provider");
  field(ctx, "FIRM / INDIVIDUAL NAME", f.prevFirmName);
  field(ctx, "LICENSE NUMBER", f.prevLicenseNumber);
  field(ctx, "DATE SERVICES TERMINATED", f.prevTerminationDate);
  field(ctx, "REASON FOR CHANGE (OPTIONAL)", f.prevReasonForChange);

  sectionTitle(ctx, "New Private Provider");
  field(ctx, "FIRM / INDIVIDUAL NAME", f.newFirmName);
  field(ctx, "LICENSE NUMBER (PE / RA / CERTIFIED INSPECTOR)", f.newLicenseNumber);
  field(ctx, "ADDRESS", f.newAddress);
  field(ctx, "PHONE / EMAIL", f.newPhoneEmail);
  field(ctx, "EFFECTIVE DATE OF NEW PROVIDER", f.newEffectiveDate);
  field(ctx, "SCOPE OF SERVICES ASSUMED", f.newScopeOfServices);

  sectionTitle(ctx, "Statement of Assumption of Duties");
  paragraph(ctx, ASSUMPTION_OF_DUTIES_TEXT, 9.5);

  sectionTitle(ctx, "Signatures");
  signatureBlock(ctx, "Permit Holder / Owner", f.ownerPrintedName, f.ownerDate);
  signatureBlock(
    ctx,
    "New Private Provider",
    [f.providerPrintedName, f.newLicenseNumber].filter(Boolean).join("  ·  License # "),
    f.providerDate,
  );

  sectionTitle(ctx, "For Local Building Official Use Only");
  ensureSpace(ctx, 70);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 56,
    width: PAGE_W - MARGIN * 2,
    height: 66,
    borderColor: RULE,
    borderWidth: 0.8,
    color: rgb(0.95, 0.95, 0.95),
  });
  ctx.page.drawText("Received By: ______________________________________", {
    x: MARGIN + 12,
    y: ctx.y - 12,
    size: 10,
    font,
    color: MUTED,
  });
  ctx.page.drawText("Date Received: ____________________________________", {
    x: MARGIN + 12,
    y: ctx.y - 38,
    size: 10,
    font,
    color: MUTED,
  });

  return pdf.save();
}

// ---------- recording queue (frontend stub) ----------

export type RecordingQueueEntry = {
  id: string;
  project_id: string;
  document_type: "change_of_private_provider";
  status: "pending";
  submitted_at: string;
};

const QUEUE_KEY = "cleard.recording-queue.v1";

export function listRecordingQueue(): RecordingQueueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as RecordingQueueEntry[]) : [];
  } catch {
    return [];
  }
}

export function queueRecordingRequest(projectId: string): RecordingQueueEntry {
  const entry: RecordingQueueEntry = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `rq_${Date.now()}`,
    project_id: projectId,
    document_type: "change_of_private_provider",
    status: "pending",
    submitted_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify([entry, ...listRecordingQueue()]));
    } catch {
      /* non-fatal */
    }
  }
  return entry;
}
