// One readable line out of anything a catch block can receive.
//
// `String(err)` is wrong here: a PostgrestError is a plain object, so it stringifies to
// "[object Object]" and the caller learns nothing about the failure. Postgres errors carry the
// useful part in `message`, with `code`/`details`/`hint` alongside, so those are surfaced too.

/** A readable message for `err`, never "[object Object]" and never an empty string. */
export function errorMessage(err: unknown): string {
  if (typeof err === "string") return err || "unknown error";
  if (err instanceof Error) return err.message || err.name || "unknown error";
  if (err === null || err === undefined) return "unknown error";

  if (typeof err === "object") {
    const rec = err as Record<string, unknown>;
    const message = typeof rec.message === "string" ? rec.message.trim() : "";
    if (message) {
      // PostgrestError: 22P02 invalid input syntax for type uuid, and friends.
      const code = typeof rec.code === "string" && rec.code ? ` [${rec.code}]` : "";
      const extra = ["details", "hint"]
        .map((k) => (typeof rec[k] === "string" ? (rec[k] as string).trim() : ""))
        .filter(Boolean)
        .join(" — ");
      return `${message}${code}${extra ? ` — ${extra}` : ""}`;
    }
    // Something with a real toString (URL, Deno errors) rather than Object.prototype's.
    const asString = String(err);
    if (asString !== "[object Object]") return asString;
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}") return json;
    } catch {
      // circular or non-serialisable — fall through
    }
    return "unknown error object";
  }

  return String(err);
}
