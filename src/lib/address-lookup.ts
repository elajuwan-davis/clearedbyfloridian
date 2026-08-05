// ---------------------------------------------------------------------------
// Address lookup — provider-agnostic layer.
//
// Two interchangeable providers implement the same contract:
//   • "google"  — Google Places (New) type-ahead autocomplete (needs a billed
//                 browser API key). Preferred UX.
//   • "census"  — free US Census Geocoder, no key, no billing. Type the full
//                 address and press "Look up".
//
// Everything downstream (permit intake, municipality detection, Permit
// Intelligence panel) consumes only `ResolvedAddress` + `resolveMunicipality`,
// so switching providers later is a one-line change in `activeProvider()`.
// ---------------------------------------------------------------------------

import { MUNICIPALITIES } from "@/lib/municipalities";

export type ResolvedAddress = {
  /** Formatted street line (number + street) — safe to store in "address". */
  streetLine: string;
  /** Incorporated city / town name. EMPTY for unincorporated areas. */
  city: string;
  /** County, long form e.g. "Palm Beach County". */
  county: string;
  /** Two-letter US state (should be "FL"). */
  state: string;
  /** 5-digit ZIP. May be empty. */
  postalCode: string;
  /** Full formatted address string. */
  formatted: string;
  /** True when the address sits inside an incorporated municipality. */
  incorporated: boolean;
  /** Which provider produced this result. */
  provider: AddressProvider;
};

export type AddressProvider = "google" | "census";

const env = import.meta.env as Record<string, string | undefined>;

/** The Google browser key, if the project has one configured. */
export const GOOGLE_MAPS_KEY: string | undefined = env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBROKEN_TEST_KEY_123";

/**
 * Which provider the UI should use right now.
 * Add a key → Google type-ahead turns on automatically, Census stays as the
 * no-key fallback. Nothing else in the app needs to change.
 */
export function activeProvider(): AddressProvider {
  return GOOGLE_MAPS_KEY ? "google" : "census";
}

// ---------------------------------------------------------------------------
// Census provider
// ---------------------------------------------------------------------------

export type CensusLookupResponse = {
  matches: ResolvedAddress[];
  error?: string;
};

/** Look up a full street address through the free US Census Geocoder. */
export async function censusLookup(address: string): Promise<CensusLookupResponse> {
  const q = address.trim();
  if (!q) return { matches: [], error: "Enter a street address first." };
  try {
    const resp = await fetch(`/api/geocode-census?address=${encodeURIComponent(q)}`);
    if (!resp.ok) return { matches: [], error: "Lookup service unavailable — enter the city manually." };
    const json = (await resp.json()) as CensusLookupResponse;
    return { matches: json.matches ?? [], error: json.error };
  } catch {
    return { matches: [], error: "Lookup failed — enter the city manually." };
  }
}

// ---------------------------------------------------------------------------
// Municipality resolution (shared by both providers)
// ---------------------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export type MunicipalityResolution = {
  /** Value to place in the (still editable) Municipality / City field. */
  municipality: string;
  /** True when it matched an incorporated jurisdiction in our own list. */
  matchedList: boolean;
  /** True when the address falls in an unincorporated county area. */
  unincorporated: boolean;
};

/**
 * Map a resolved address to the jurisdiction that actually issues the permit.
 *
 * Incorporated address  → the city/town (validated against MUNICIPALITY_TREE).
 * Unincorporated address → "Unincorporated <County> County" — never the
 * like-named town (e.g. unincorporated Palm Beach County ≠ Town of Palm Beach).
 */
export function resolveMunicipality(r: ResolvedAddress): MunicipalityResolution {
  const countyLong = r.county
    ? /county$/i.test(r.county)
      ? r.county
      : `${r.county} County`
    : "";

  if (r.city && r.incorporated) {
    const target = norm(r.city);
    const match = MUNICIPALITIES.find((m) => norm(m.name) === target);
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
