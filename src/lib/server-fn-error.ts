/**
 * A server function rejects with its cause serialized into the message, so a validator
 * failure arrives as a JSON array of Zod issues. Show that to nobody: fall back to a
 * human sentence whenever the message is a machine payload rather than prose.
 */
export function friendlyServerError(e: unknown, fallback: string): string {
  const text = (e instanceof Error ? e.message : typeof e === "string" ? e : "").trim();
  if (!text) return fallback;
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      JSON.parse(text);
      return fallback;
    } catch {
      // Not JSON after all — a message that merely starts with a bracket is still readable.
    }
  }
  return text;
}
