// Renders scripts/local-test/correction-letter.txt into a real PDF at the path the Agent 7
// fixture's notice points at, so the parser's PDF text extraction is exercised on an actual
// file rather than on the notice's raw_text column.
//
//   deno run -A scripts/local-test/make-correction-pdf.ts

import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const STORAGE_DIR = Deno.env.get("STORAGE_DIR") ?? "/tmp/cleard-local-storage";
const BUCKET = "permit-files";
const KEY = "permits/33333333-3333-3333-3333-333333333333/corrections/plan-review-comments-1.pdf";

const letter = await Deno.readTextFile("scripts/local-test/correction-letter.txt");
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const size = 9;
const margin = 40;
let page = doc.addPage([612, 792]);
let y = 792 - margin;

for (const line of letter.split("\n")) {
  if (y < margin) {
    page = doc.addPage([612, 792]);
    y = 792 - margin;
  }
  // WinAnsi cannot encode the letter's typographic characters; the department's own PDFs are
  // plain ASCII anyway.
  page.drawText(line.replace(/[^\x20-\x7e]/g, "-"), { x: margin, y, size, font });
  y -= size + 3;
}

const bytes = await doc.save();
const path = `${STORAGE_DIR}/${BUCKET}/${KEY}`;
await Deno.mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
await Deno.writeFile(path, bytes);
console.log("wrote", path, bytes.length, "bytes");
