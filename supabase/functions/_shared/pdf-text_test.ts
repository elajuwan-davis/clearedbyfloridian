import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { pdfText, textFromContentStream } from "./pdf-text.ts";

function uncompressedPdf(lines: string[]): Uint8Array {
  const content = lines.map((l) => `BT /F1 11 Tf (${l}) Tj ET`).join("\n");
  const body = `%PDF-1.4
1 0 obj << /Length ${content.length} >>
stream
${content}
endstream
endobj
%%EOF`;
  return new TextEncoder().encode(body);
}

async function deflatedPdf(lines: string[]): Promise<Uint8Array> {
  const content = lines.map((l) => `BT (${l}) Tj ET`).join("\n");
  const compressed = new Uint8Array(
    await new Response(
      new Blob([new TextEncoder().encode(content)])
        .stream()
        .pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const head = new TextEncoder().encode(
    "%PDF-1.7\n1 0 obj << /Filter /FlateDecode >>\nstream\n",
  );
  const tail = new TextEncoder().encode("\nendstream\nendobj\n%%EOF");
  const out = new Uint8Array(head.length + compressed.length + tail.length);
  out.set(head, 0);
  out.set(compressed, head.length);
  out.set(tail, head.length + compressed.length);
  return out;
}

Deno.test("reads text out of an uncompressed content stream", async () => {
  const text = await pdfText(
    uncompressedPdf([
      "CITY OF PLANTATION - PLAN REVIEW COMMENTS",
      "1. Provide a signed and sealed truss layout.",
    ]),
  );
  assertEquals(text.includes("PLAN REVIEW COMMENTS"), true);
  assertEquals(text.includes("1. Provide a signed and sealed truss layout."), true);
});

Deno.test("inflates a FlateDecode stream", async () => {
  const text = await pdfText(await deflatedPdf(["2. Site plan is missing setback dimensions."]));
  assertEquals(text.includes("setback dimensions"), true);
});

Deno.test("a scan with no text layer yields nothing rather than noise", async () => {
  const scan = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0xff, 0xd8, 0xff]);
  assertEquals(await pdfText(scan), "");
});

Deno.test("reads hex strings and keeps the letter's line breaks", () => {
  // The form pdf-lib and several plan-review tools emit: one hex string per line, separated
  // by T* / Td. The letter's own numbering has to survive, because it is cross-checked
  // against the number of items the model reports.
  const hex = (s: string) =>
    "<" + [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, "0")).join("") +
    ">";
  const stream = [
    `BT 1 0 0 1 40 752 Tm ${hex("PLAN REVIEW COMMENTS")} Tj T*`,
    `${hex("1. Provide the recorded NOC.")} Tj T*`,
    `${hex("2. Dimension the egress width.")} Tj ET`,
  ].join("\n");
  assertEquals(
    textFromContentStream(stream),
    "PLAN REVIEW COMMENTS\n1. Provide the recorded NOC.\n2. Dimension the egress width.",
  );
});

Deno.test("unescapes literals the way PDF writes them", () => {
  assertEquals(
    textFromContentStream(String.raw`(Fee due: \(412.00\)) Tj (Sheet A\055101) Tj`),
    "Fee due: (412.00) Sheet A-101",
  );
});
