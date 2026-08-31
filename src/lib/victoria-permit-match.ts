/**
 * Pure matching for Victoria's New Permit voice-fill.
 * Catalog names/options are passed in so this loads under tsx without the
 * municipality cache or the React assistant.
 */

const SPOKEN_DIGITS: Record<string, string> = {
  zero: "0",
  oh: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

export function normalizeSpokenPlace(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(city|town|village) of\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the\s+/, "");
}

/**
 * Match a spoken city onto the catalog: exact first, then a contains match either way
 * ("Miami Beach" heard as "the city of Miami Beach"). Falls back to the raw words, which
 * the picker accepts as freeform.
 */
export function matchMunicipalityName(raw: string, names: string[]): string {
  const said = normalizeSpokenPlace(raw);
  if (!said) return "";
  const exact = names.find((n) => normalizeSpokenPlace(n) === said);
  if (exact) return exact;
  const contains = names
    .filter((n) => {
      const t = normalizeSpokenPlace(n);
      return t.includes(said) || said.includes(t);
    })
    .sort((a, b) => normalizeSpokenPlace(b).length - normalizeSpokenPlace(a).length)[0];
  return contains ?? raw.trim();
}

/**
 * "Pool and spa, electrical and plumbing" → the exact scope options the form offers.
 * Each spoken fragment is matched against the catalog; unmatched words are dropped
 * rather than invented, since the picker only accepts real scopes.
 */
export function matchScopes(raw: string, options: string[]): string[] {
  const said = raw.toLowerCase();
  const picked: string[] = [];
  for (const option of options) {
    const words = normalizeSpokenPlace(option)
      .split(" ")
      .filter((w) => w.length > 2);
    const hit = words.some((w) => normalizeSpokenPlace(said).includes(w));
    if (hit) picked.push(option);
  }
  return picked;
}

/**
 * "two fifty thousand" is beyond a fixed grammar, but "$250,000", "250000" and
 * "250 thousand" all turn up in dictation, so handle digits plus a thousand/million suffix.
 */
export function parseSpokenMoney(raw: string): string {
  const text = raw.toLowerCase().replace(/[$,]/g, "");
  const m = text.match(/(\d+(?:\.\d+)?)\s*(thousand|k|million|m)?/);
  if (!m) return "";
  let value = Number(m[1]);
  if (!Number.isFinite(value)) return "";
  if (m[2] === "thousand" || m[2] === "k") value *= 1_000;
  if (m[2] === "million" || m[2] === "m") value *= 1_000_000;
  return String(Math.round(value));
}

/** Spoken street numbers come through as words often enough to be worth normalising. */
export function tidySpokenAddress(raw: string): string {
  return raw
    .trim()
    .replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/gi, (w) =>
      w.length <= 5 ? (SPOKEN_DIGITS[w.toLowerCase()] ?? w) : w,
    )
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
