import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { downloadPermitFile } from "./permit-storage";
import { getEffectiveDocs, getHiddenFieldKeys, type PermitRow, type PermitDoc } from "./permits-api";

type FieldSpec = { key: string; label: string; value: string };

function fmtDate(v: string | null | undefined) {
  if (!v) return "";
  try { return new Date(v).toLocaleDateString(); } catch { return String(v); }
}

function fmtMoney(cents: number | null | undefined) {
  if (!cents) return "";
  return "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fieldsForRow(row: PermitRow): FieldSpec[] {
  return [
    { key: "project_name", label: "Project Name", value: row.project_name ?? "" },
    { key: "job_address", label: "Address", value: row.job_address ?? "" },
    { key: "city", label: "City", value: row.city ?? "" },
    { key: "county", label: "County", value: row.county ?? "" },
    { key: "municipality", label: "Municipality", value: row.municipality ?? "" },
    { key: "permit_type", label: "Permit Type", value: row.permit_type ?? "" },
    { key: "permit_number", label: "Permit #", value: row.permit_number ?? "" },
    { key: "construction_value_cents", label: "Construction Value", value: fmtMoney(row.construction_value_cents) },
    { key: "pcn", label: "PCN", value: row.pcn ?? "" },
    { key: "submitted_date", label: "Submitted Date", value: fmtDate(row.submitted_date) },
    { key: "status", label: "Status", value: (row.status ?? "").replace(/_/g, " ") },
    { key: "description", label: "Description", value: row.description ?? "" },
    { key: "contractor_company", label: "Contractor Company", value: row.contractor_company ?? "" },
    { key: "contractor_qualifier", label: "Qualifier", value: row.contractor_qualifier ?? "" },
    { key: "company_address", label: "Company Address", value: row.company_address ?? "" },
    { key: "poc", label: "POC", value: row.poc ?? "" },
    { key: "poc_phone", label: "POC Phone", value: row.poc_phone ?? "" },
    { key: "poc_email", label: "POC Email", value: row.poc_email ?? "" },
    { key: "license_number", label: "License #", value: row.license_number ?? "" },
    { key: "owner_name", label: "Owner Name", value: row.owner_name ?? "" },
    { key: "owner_entity", label: "Owner Entity", value: row.owner_entity ?? "" },
  ];
}

function sanitize(s: string) {
  // pdf-lib's WinAnsi font can't encode arbitrary unicode; strip non-latin.
  return s.replace(/[^\x20-\x7E\n]/g, "");
}

function wrap(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

export async function generatePermitExportPdf(row: PermitRow, opts: { includeAttachments?: boolean } = {}): Promise<Blob> {
  const includeAttachments = opts.includeAttachments !== false;
  const merged = await PDFDocument.create();
  const font = await merged.embedFont(StandardFonts.Helvetica);
  const bold = await merged.embedFont(StandardFonts.HelveticaBold);
  const italic = await merged.embedFont(StandardFonts.HelveticaOblique);

  const hidden = new Set(getHiddenFieldKeys(row));
  const docs = getEffectiveDocs(row);
  const activeFields = fieldsForRow(row).filter((f) => !hidden.has(f.key));

  // ---------- Summary pages ----------
  const A4 = PageSizes.A4;
  const MARGIN = 48;
  const CONTENT_WIDTH = A4[0] - MARGIN * 2;

  let page = merged.addPage(A4);
  let y = A4[1] - MARGIN;
  const ink = rgb(0.08, 0.19, 0.34); // obsidian

  const drawLine = (text: string, f: import("pdf-lib").PDFFont, size: number, color = ink, extraGap = 0) => {
    const lines = wrap(sanitize(text), f, size, CONTENT_WIDTH);
    for (const line of lines) {
      if (y < MARGIN + size) {
        page = merged.addPage(A4);
        y = A4[1] - MARGIN;
      }
      page.drawText(line, { x: MARGIN, y: y - size, size, font: f, color });
      y -= size + 4;
    }
    y -= extraGap;
  };

  drawLine("CLEARED BY FLORIDIAN", bold, 10, rgb(0.4, 0.4, 0.4));
  drawLine(row.project_name || "Permit", bold, 22, ink, 4);
  drawLine(row.job_address || "", font, 11, rgb(0.35, 0.35, 0.35), 12);

  drawLine("PERMIT DETAILS", bold, 11, ink, 6);
  for (const f of activeFields) {
    if (!f.value) continue;
    drawLine(f.label, bold, 9, rgb(0.35, 0.35, 0.35));
    drawLine(f.value, font, 11, ink, 4);
  }

  // Subs
  if (row.subs && row.subs.length > 0) {
    y -= 8;
    drawLine("SUBCONTRACTORS", bold, 11, ink, 6);
    for (const s of row.subs) {
      drawLine(`${s.companyName} — ${s.trade}`, bold, 10, ink);
      const meta = [s.qualifierName, s.licenseNumber ? `Lic ${s.licenseNumber}` : "", s.contactEmail].filter(Boolean).join(" · ");
      if (meta) drawLine(meta, font, 9, rgb(0.35, 0.35, 0.35), 4);
    }
  }

  // Documents index
  y -= 8;
  drawLine("DOCUMENTS", bold, 11, ink, 6);
  for (const d of docs) {
    const status = d.status === "uploaded" ? "Attached" : d.status === "not_applicable" ? "Not required" : d.status === "pending" ? "Pending" : "Missing";
    drawLine(`${d.label} — ${status}${d.filename ? ` (${d.filename})` : ""}`, font, 10, ink);
  }

  drawLine(`Generated ${new Date().toLocaleString()}`, italic, 8, rgb(0.5, 0.5, 0.5), 0);

  // ---------- Attach each uploaded document ----------
  for (const d of includeAttachments ? docs : []) {
    if (d.status !== "uploaded" || !d.path) continue;
    try {
      const blob = await downloadPermitFile(d.path);
      const buf = new Uint8Array(await blob.arrayBuffer());
      const mime = (d.mime || blob.type || "").toLowerCase();

      // Section separator page
      const sep = merged.addPage(A4);
      sep.drawText("ATTACHMENT", { x: MARGIN, y: A4[1] - MARGIN - 12, size: 10, font: bold, color: rgb(0.4, 0.4, 0.4) });
      const title = sanitize(d.label);
      sep.drawText(title, { x: MARGIN, y: A4[1] - MARGIN - 40, size: 18, font: bold, color: ink });
      if (d.filename) sep.drawText(sanitize(d.filename), { x: MARGIN, y: A4[1] - MARGIN - 62, size: 10, font, color: rgb(0.4, 0.4, 0.4) });

      if (mime.includes("pdf") || (d.filename ?? "").toLowerCase().endsWith(".pdf")) {
        try {
          const src = await PDFDocument.load(buf, { ignoreEncryption: true });
          const copied = await merged.copyPages(src, src.getPageIndices());
          for (const p of copied) merged.addPage(p);
        } catch (err) {
          const p = merged.addPage(A4);
          p.drawText(`Could not merge PDF: ${(err as Error).message}`, { x: MARGIN, y: A4[1] - MARGIN - 100, size: 10, font, color: rgb(0.7, 0.1, 0.1) });
        }
      } else if (mime.startsWith("image/")) {
        try {
          const img = mime.includes("png") ? await merged.embedPng(buf) : await merged.embedJpg(buf);
          const p = merged.addPage(A4);
          const maxW = A4[0] - MARGIN * 2;
          const maxH = A4[1] - MARGIN * 2;
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          const w = img.width * scale;
          const h = img.height * scale;
          p.drawImage(img, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2, width: w, height: h });
        } catch (err) {
          const p = merged.addPage(A4);
          p.drawText(`Could not embed image: ${(err as Error).message}`, { x: MARGIN, y: A4[1] - MARGIN - 100, size: 10, font, color: rgb(0.7, 0.1, 0.1) });
        }
      } else {
        const p = merged.addPage(A4);
        p.drawText(`Attached file "${sanitize(d.filename ?? "")}" (${mime || "unknown type"}) cannot be inlined in this PDF.`,
          { x: MARGIN, y: A4[1] - MARGIN - 100, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
      }
    } catch (err) {
      const p = merged.addPage(A4);
      p.drawText(`ATTACHMENT: ${sanitize(d.label)}`, { x: MARGIN, y: A4[1] - MARGIN - 40, size: 14, font: bold, color: ink });
      p.drawText(`Failed to fetch file: ${(err as Error).message}`, { x: MARGIN, y: A4[1] - MARGIN - 70, size: 10, font, color: rgb(0.7, 0.1, 0.1) });
    }
  }

  const bytes = await merged.save();
  // Copy into a fresh ArrayBuffer so Blob types resolve cleanly across TS libs.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return new Blob([ab], { type: "application/pdf" });
}

export function suggestExportFilename(row: PermitRow): string {
  const name = (row.project_name || "permit").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60);
  const date = new Date().toISOString().slice(0, 10);
  return `${name}_${date}.pdf`;
}

export function _permitDocsCount(row: PermitRow): { attached: number; total: number; docs: PermitDoc[] } {
  const docs = getEffectiveDocs(row);
  return { attached: docs.filter((d) => d.status === "uploaded").length, total: docs.length, docs };
}
