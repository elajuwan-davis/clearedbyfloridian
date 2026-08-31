/**
 * Pick a municipality from a job address.
 * `list` is injected so tests do not need the Supabase-backed cache.
 */

export type PortalMatchable = { name: string };

const ADDRESS_ALIASES: Array<[RegExp, string]> = [
  [/\bnorth palm beach\b/, "North Palm Beach"],
  [/\bwest palm beach\b/, "West Palm Beach"],
  [/\bpalm beach gardens\b/, "Palm Beach Gardens"],
  [/\broyal palm beach\b/, "Royal Palm Beach"],
  [/\bport st\.?\s*lucie\b/, "Port St. Lucie"],
  [/\bstuart\b/, "Stuart"],
  [/\bfort pierce\b/, "Fort Pierce"],
  [/\bfort lauderdale\b/, "Ft. Lauderdale"],
  [/\bfort myers\b/, "Ft Myers"],
];

/**
 * Longest catalog name contained in the address wins, so "West Palm Beach"
 * is not reported as "Palm Beach". Known aliases cover Fort/Ft spelling.
 */
export function matchPortalForAddress<T extends PortalMatchable>(
  address: string,
  list: T[],
): T | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  const candidates = list
    .filter((m) => lower.includes(m.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length);
  if (candidates[0]) return candidates[0];

  for (const [re, name] of ADDRESS_ALIASES) {
    if (re.test(lower)) {
      const m = list.find((x) => x.name === name);
      if (m) return m;
    }
  }
  return undefined;
}
