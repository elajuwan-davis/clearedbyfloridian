// Vendored copy of src/lib/nto-pdf.ts for the Deno edge runtime — NOT the live source.
// The app bundle keeps using src/lib/nto-pdf.ts; a fix there does not reach the edge
// functions until it is copied here as well. This copy also declares NtoRow locally,
// because src/lib/nto-api.ts cannot be imported here.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// Vendored for the Deno edge runtime: the app's src/ tree is not part of the
// function bundle, so the row shape is declared locally instead of imported.
type NtoRow = {
  id: string;
  permit_id: string;
  owner_name: string | null;
  owner_address: string | null;
  owner_email: string | null;
  property_address: string | null;
  contractor_name: string;
  contractor_address: string;
  work_description: string | null;
  first_work_date: string | null;
  status: string;
  sent_via: string | null;
  sent_at: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
};

const OBSIDIAN = rgb(21 / 255, 49 / 255, 87 / 255);
const INK = rgb(0.1, 0.1, 0.1);

export async function buildNtoPdfBytes(nto: Partial<NtoRow>): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 750;

  page.drawText("NOTICE TO OWNER", { x: 50, y, size: 20, font: bold, color: OBSIDIAN });
  y -= 12;
  page.drawText("Florida Statute § 713.06 — Construction Lien Rights", {
    x: 50, y, size: 9, font, color: INK,
  });
  y -= 24;
  page.drawLine({ start: { x: 50, y }, end: { x: 562, y }, thickness: 1, color: OBSIDIAN });
  y -= 24;

  const rows: Array<[string, string]> = [
    ["Property Address", nto.property_address ?? "—"],
    ["Owner Name", nto.owner_name ?? "—"],
    ["Owner Address", nto.owner_address ?? "—"],
    ["Contractor", nto.contractor_name ?? "—"],
    ["Contractor Address", nto.contractor_address ?? "—"],
    ["Description of Work", nto.work_description ?? "—"],
    ["Date of First Work / Materials", nto.first_work_date ?? "—"],
  ];

  for (const [label, val] of rows) {
    page.drawText(label.toUpperCase(), { x: 50, y, size: 8, font: bold, color: OBSIDIAN });
    y -= 14;
    const lines = wrap(val, 90);
    for (const line of lines) {
      page.drawText(line, { x: 50, y, size: 11, font, color: INK });
      y -= 14;
    }
    y -= 8;
  }

  y -= 6;
  const notice =
    "WARNING: FLORIDA'S CONSTRUCTION LIEN LAW ALLOWS SOME UNPAID CONTRACTORS, SUBCONTRACTORS, AND MATERIAL SUPPLIERS TO FILE LIENS AGAINST YOUR PROPERTY EVEN IF YOU HAVE MADE PAYMENT IN FULL. IF YOU FAIL TO PAY YOUR CONTRACTOR, THE PEOPLE WHO ARE OWED MONEY MAY LOOK TO YOUR PROPERTY FOR PAYMENT.";
  for (const line of wrap(notice, 88)) {
    page.drawText(line, { x: 50, y, size: 8, font, color: INK });
    y -= 11;
  }

  y -= 24;
  page.drawText("Signed:  ______________________________", { x: 50, y, size: 10, font, color: INK });
  page.drawText("Date:  _______________", { x: 380, y, size: 10, font, color: INK });

  return await pdf.save();
}

function wrap(text: string, maxChars: number): string[] {
  const words = String(text).replace(/\s+/g, " ").split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
