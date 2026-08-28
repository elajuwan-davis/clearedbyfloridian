/** Jurisdiction resolution used by permit intake. Kept free of Vite/Supabase so tests can import it. */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export type MunicipalityResolution = {
  /** Value to place in the (still editable) Municipality / City field. */
  municipality: string;
  /** True when it matched an incorporated jurisdiction in our own list. */
  matchedList: boolean;
  /** True when the address falls in an unincorporated county area. */
  unincorporated: boolean;
};

export type MunicipalityName = { name: string };

export type AddressForMunicipality = {
  city: string;
  county: string;
  incorporated: boolean;
};

/**
 * Map a resolved address to the jurisdiction that actually issues the permit.
 *
 * Incorporated address  → the city/town (validated against `list`).
 * Unincorporated address → "Unincorporated <County> County" — never the
 * like-named town (e.g. unincorporated Palm Beach County ≠ Town of Palm Beach).
 */
export function resolveMunicipality(
  r: AddressForMunicipality,
  list: MunicipalityName[],
): MunicipalityResolution {
  const countyLong = r.county ? (/county$/i.test(r.county) ? r.county : `${r.county} County`) : "";

  if (r.city && r.incorporated) {
    const target = norm(r.city);
    const match = list.find((m) => norm(m.name) === target);
    if (match) return { municipality: match.name, matchedList: true, unincorporated: false };
    return { municipality: r.city, matchedList: false, unincorporated: false };
  }

  if (countyLong) {
    return {
      municipality: `Unincorporated ${countyLong}`,
      matchedList: false,
      unincorporated: true,
    };
  }

  return { municipality: r.city || "", matchedList: false, unincorporated: false };
}
