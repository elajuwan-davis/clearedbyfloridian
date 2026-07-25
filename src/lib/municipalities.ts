// Single source of truth for municipalities across the platform.
// Derived from MUNICIPALITY_TREE (used by the Building Departments page).
// Any component that needs a municipality list — permit intake typeahead,
// filters, dropdowns, address matching — imports from here.

import { MUNICIPALITY_TREE } from "@/lib/municipalities-data";

export type Municipality = {
  name: string;
  url?: string;
  deptName?: string;
  county?: string;
  region?: string;
  note?: string;
  phone?: string;
};

function buildFlatList(): Municipality[] {
  const map = new Map<string, Municipality>();
  for (const region of MUNICIPALITY_TREE) {
    for (const county of region.counties) {
      for (const city of county.cities) {
        const key = city.name.toLowerCase();
        // Prefer entries that have a portal URL when duplicates share a name
        const existing = map.get(key);
        if (existing && existing.url && !city.portalUrl) continue;
        map.set(key, {
          name: city.name,
          url: city.portalUrl,
          deptName: city.deptName,
          county: county.name,
          region: region.name,
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const MUNICIPALITIES: Municipality[] = buildFlatList();

/** Find the best matching municipality portal URL for a given address string. */
export function findPortalForAddress(address: string): Municipality | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  // Prefer longest name match to avoid "Palm Beach" catching "Palm Beach Gardens" etc.
  const candidates = MUNICIPALITIES
    .filter((m) => lower.includes(m.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length);
  if (candidates[0]) return candidates[0];

  // Common aliases (map to canonical tree names)
  const aliases: Array<[RegExp, string]> = [
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
  for (const [re, name] of aliases) {
    if (re.test(lower)) {
      const m = MUNICIPALITIES.find((x) => x.name === name);
      if (m) return m;
    }
  }
  return undefined;
}
