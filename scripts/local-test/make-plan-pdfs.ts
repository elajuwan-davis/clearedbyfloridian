// Writes the plan/application PDFs the Agent 4 fixtures point at into the local
// storage dir the mock Storage API serves (STORAGE_DIR, default /tmp/cleard-local-storage).
//
//   deno run -A scripts/local-test/make-plan-pdfs.ts

import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const STORAGE_DIR = Deno.env.get("STORAGE_DIR") ?? "/tmp/cleard-local-storage";
const BUCKET = "permit-files";
const ARCH_D = [1728, 2592]; // 24x36 in, in points
const LETTER = [612, 792];

async function pdf(sheets: number, size: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < sheets; i++) doc.addPage([size[0], size[1]]);
  return await doc.save();
}

async function put(key: string, bytes: Uint8Array) {
  const path = `${STORAGE_DIR}/${BUCKET}/${key}`;
  await Deno.mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  await Deno.writeFile(path, bytes);
  console.log("wrote", path, bytes.length, "bytes");
}

const permits = [
  "66666666-6666-6666-6666-666666666666",
  "77777777-7777-7777-7777-777777777777",
];

for (const id of permits) {
  await put(`${id}/plans.pdf`, await pdf(6, ARCH_D));
  await put(`${id}/application.pdf`, await pdf(2, LETTER));
}

// Letter-sized "plan set" used to prove the format check actually rejects one.
await put("99999999-9999-9999-9999-999999999999/plans.pdf", await pdf(1, LETTER));
