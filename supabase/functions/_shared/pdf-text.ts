// Text out of a building department's correction letter PDF.
//
// Deliberately small: pull the text-showing operators out of the content streams, inflating
// Flate streams where present. That covers the text-layer PDFs Accela and Bluebeam produce.
// A scanned letter has no text operators at all, and the caller reports it as unreadable
// rather than sending a blank letter to the model.

/**
 * Text-showing operators out of an already-decoded content stream. Both string forms are
 * handled: `(literal) Tj`, and the `<48656c6c6f> Tj` hex form several producers emit.
 */
export function textFromContentStream(content: string): string {
  let out = "";
  let cursor = 0;
  // A single pass so literals and hex strings stay in document order.
  for (const m of content.matchAll(/\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]+>/g)) {
    const token = m[0];
    const text = token.startsWith("(") ? literalString(token) : hexString(token);
    const between = content.slice(cursor, m.index ?? cursor);
    cursor = (m.index ?? cursor) + token.length;
    if (!text.trim()) continue;
    // A line-positioning or text-block operator since the last string means a new line, which
    // is what makes the letter's own numbering ("1.", "2)") survive extraction.
    const newline = /T\*|\b(Td|TD|ET|BT)\b/.test(between);
    if (out) out += newline ? "\n" : " ";
    out += text;
  }
  return normalise(out);
}

function literalString(token: string): string {
  return token
    .slice(1, -1)
    .replace(
      /\\([nrtbf])/g,
      (_s, c) => ({ n: "\n", r: "\n", t: "\t", b: "", f: "\n" })[c as string] ?? "",
    )
    .replace(/\\(\d{1,3})/g, (_s, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\(.)/g, "$1");
}

function hexString(token: string): string {
  const hex = token.slice(1, -1).replace(/\s+/g, "");
  if (hex.length < 2 || hex.length % 2 !== 0) return "";
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  // A BOM means UTF-16BE, which is how PDF marks a non-PDFDoc-encoded string.
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let s = "";
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return s;
  }
  return new TextDecoder("utf-8").decode(bytes);
}

export function normalise(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

/**
 * Byte-for-byte string view of the file. Not TextDecoder("latin1"): per WHATWG that label is
 * windows-1252, which remaps 0x80-0x9F (0x9C becomes "\u0153") and so does not survive the
 * round trip back to bytes that the inflater needs.
 */
function toByteString(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let out = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

function fromByteString(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  // A fresh ArrayBuffer-backed copy: Blob only accepts views over a plain ArrayBuffer.
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  for (const format of ["deflate", "deflate-raw"] as const) {
    try {
      const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream(format));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      // Not this format — try the next, then give up and use the bytes as they are.
    }
  }
  return null;
}

/** The letter's text, or "" when the PDF carries no text layer (i.e. it is a scan). */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  const raw = toByteString(bytes);
  const pieces: string[] = [];

  for (const match of raw.matchAll(/stream\r?\n?([\s\S]*?)endstream/g)) {
    // The EOL before `endstream` belongs to the syntax, not the data; leaving it on makes the
    // inflater reject an otherwise valid stream.
    const body = (match[1] ?? "").replace(/\r?\n$/, "");
    const inflated = await inflate(fromByteString(body));
    pieces.push(inflated ? new TextDecoder("utf-8").decode(inflated) : body);
  }

  const fromStreams = normalise(pieces.map((p) => textFromContentStream(p)).join("\n"));
  // Some producers write the operators outside a stream object; fall back to the whole file.
  return fromStreams || textFromContentStream(raw);
}
