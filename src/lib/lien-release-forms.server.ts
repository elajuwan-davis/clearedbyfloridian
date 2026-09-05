// Statutory lien waiver / release forms — Fla. Stat. § 713.20.
//
// § 713.20(4) is the progress-payment form and § 713.20(5) the final-payment
// form; the statute forbids a payer from requiring a lienor to sign a waiver
// that differs from them, so the body text below is kept verbatim apart from
// the blanks. "Conditional" adds the § 713.20(7) condition that the release is
// effective only once the payment instrument clears; "unconditional" states
// receipt of payment instead. A § 117.05 acknowledgment block is appended so
// the same PDF can be notarized remotely.

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type ReleaseType =
  | "partial_conditional"
  | "partial_unconditional"
  | "final_conditional"
  | "final_unconditional";

export const RELEASE_TYPES: ReleaseType[] = [
  "partial_conditional",
  "partial_unconditional",
  "final_conditional",
  "final_unconditional",
];

export const RELEASE_TITLE: Record<ReleaseType, string> = {
  partial_conditional: "Conditional Waiver and Release of Lien Upon Progress Payment",
  partial_unconditional: "Unconditional Waiver and Release of Lien Upon Progress Payment",
  final_conditional: "Conditional Waiver and Release of Lien Upon Final Payment",
  final_unconditional: "Unconditional Waiver and Release of Lien Upon Final Payment",
};

export function isFinal(type: ReleaseType): boolean {
  return type === "final_conditional" || type === "final_unconditional";
}

export function isConditional(type: ReleaseType): boolean {
  return type === "partial_conditional" || type === "final_conditional";
}

export type ReleaseFields = {
  release_type: ReleaseType;
  claimant_name: string;
  claimant_address: string | null;
  owner_name: string;
  property_address: string;
  through_date: string | null;
  amount: number | null;
};

function money(amount: number | null): string {
  if (amount === null || Number.isNaN(amount)) return "______________";
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function longDate(iso: string | null): string {
  if (!iso) return "______________";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function bodyParagraphs(f: ReleaseFields): string[] {
  const paragraphs: string[] = [];

  if (isFinal(f.release_type)) {
    paragraphs.push(
      `The undersigned lienor, in consideration of the final payment in the amount of ${money(f.amount)}, hereby waives and releases its lien and right to claim a lien for labor, services, or materials furnished to ${f.owner_name} on the job of ${f.owner_name} to the following described property:`,
    );
  } else {
    paragraphs.push(
      `The undersigned lienor, in consideration of the sum of ${money(f.amount)}, hereby waives and releases its lien and right to claim a lien for labor, services, or materials furnished through ${longDate(f.through_date)} to ${f.owner_name} on the job of ${f.owner_name} to the following described property:`,
    );
  }

  paragraphs.push(f.property_address);

  if (!isFinal(f.release_type)) {
    paragraphs.push(
      "This waiver and release does not cover any retention or labor, services, or materials furnished after the date specified.",
    );
  }

  if (isConditional(f.release_type)) {
    paragraphs.push(
      "This waiver and release is conditional upon actual receipt and final clearance of the payment stated above. If the payment instrument is dishonored or otherwise fails to clear, this waiver and release is void and the lienor retains all lien and bond rights as if it had never been given.",
    );
  } else {
    paragraphs.push(
      "The lienor acknowledges actual receipt and clearance of the payment stated above. This waiver and release is unconditional and effective upon execution.",
    );
  }

  return paragraphs;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Pre-filled statutory release PDF, ready for signature + notarization. */
export async function renderReleasePdf(f: ReleaseFields): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const left = 60;
  const right = 552;
  const width = right - left;
  const ink = rgb(0.08, 0.08, 0.08);
  let y = 730;

  const heading = RELEASE_TITLE[f.release_type].toUpperCase();
  for (const line of wrap(heading, bold, 13, width)) {
    page.drawText(line, { x: left, y, size: 13, font: bold, color: ink });
    y -= 18;
  }
  page.drawText("Fla. Stat. § 713.20", { x: left, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 14;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.75,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= 26;

  const facts: Array<[string, string]> = [
    ["Claimant / Lienor", f.claimant_name],
    ["Claimant Address", f.claimant_address || "—"],
    ["Owner", f.owner_name],
    ["Property", f.property_address],
    ["Through Date", isFinal(f.release_type) ? "N/A (final payment)" : longDate(f.through_date)],
    ["Amount", money(f.amount)],
  ];
  for (const [label, value] of facts) {
    page.drawText(`${label}:`, { x: left, y, size: 10, font: bold, color: ink });
    for (const line of wrap(value, font, 10, width - 130)) {
      page.drawText(line, { x: left + 130, y, size: 10, font, color: ink });
      y -= 14;
    }
    y -= 4;
  }

  y -= 12;
  for (const paragraph of bodyParagraphs(f)) {
    for (const line of wrap(paragraph, font, 11, width)) {
      page.drawText(line, { x: left, y, size: 11, font, color: ink });
      y -= 15;
    }
    y -= 10;
  }

  y -= 20;
  page.drawText("Dated: ______________________", { x: left, y, size: 11, font, color: ink });
  y -= 34;
  page.drawText(f.claimant_name, { x: left, y, size: 11, font: bold, color: ink });
  y -= 24;
  page.drawText("By: ____________________________________", {
    x: left,
    y,
    size: 11,
    font,
    color: ink,
  });
  y -= 18;
  page.drawText("Print Name / Title: _____________________", {
    x: left,
    y,
    size: 11,
    font,
    color: ink,
  });

  y -= 40;
  page.drawLine({
    start: { x: left, y },
    end: { x: right, y },
    thickness: 0.75,
    color: rgb(0.6, 0.6, 0.6),
  });
  y -= 20;
  page.drawText("NOTARIAL ACKNOWLEDGMENT", { x: left, y, size: 11, font: bold, color: ink });
  y -= 18;
  const ack = [
    "State of Florida, County of ____________________",
    "Sworn to (or affirmed) and subscribed before me by means of [ ] physical presence or [ ] online notarization,",
    "this ______ day of ______________, 20____, by ____________________________________,",
    "who is [ ] personally known to me or [ ] produced ____________________ as identification.",
  ];
  for (const lineText of ack) {
    for (const line of wrap(lineText, font, 10, width)) {
      page.drawText(line, { x: left, y, size: 10, font, color: ink });
      y -= 14;
    }
  }
  y -= 16;
  page.drawText("____________________________________", { x: left, y, size: 10, font, color: ink });
  y -= 14;
  page.drawText("Notary Public, State of Florida", { x: left, y, size: 10, font, color: ink });

  return pdf.save();
}
