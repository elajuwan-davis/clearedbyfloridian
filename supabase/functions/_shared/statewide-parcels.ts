// Florida Department of Revenue statewide cadastral layer — one point-in-polygon query that
// answers for any of the 67 counties, so parcel data is not limited to whichever counties
// have a bespoke integration.
//
// Source: FDOR Property Tax Oversight collects a parcel-level GIS file from every county
// property appraiser each April; this service is the export of those submissions. It is
// therefore a full tax roll behind on valuation (`ASMNT_YR` says which roll) and will not
// reflect a sale, split or new construction from the current year. Parcel identity, owner and
// year built are stable enough for pre-flight intelligence; a county's own appraiser service,
// where we have one, is fresher and is preferred.

export const STATEWIDE_LAYER_URL =
  "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0/query";

/** DOR county codes for the counties Cleard serves, for labelling and sanity checks. */
export const DOR_COUNTY_CODES: Record<number, string> = {
  41: "Indian River",
  53: "Martin",
  60: "Palm Beach",
  66: "St. Lucie",
};

const OUT_FIELDS = [
  "PARCEL_ID",
  "CO_NO",
  "OWN_NAME",
  "PHY_ADDR1",
  "PHY_CITY",
  "ACT_YR_BLT",
  "EFF_YR_BLT",
  "JV",
  "AV_SD",
  "TOT_LVG_AR",
  "S_LEGAL",
  "ASMNT_YR",
].join(",");

export type StatewideAttributes = {
  PARCEL_ID?: string | null;
  CO_NO?: number | null;
  OWN_NAME?: string | null;
  PHY_ADDR1?: string | null;
  PHY_CITY?: string | null;
  ACT_YR_BLT?: number | null;
  EFF_YR_BLT?: number | null;
  JV?: number | null;
  AV_SD?: number | null;
  TOT_LVG_AR?: number | null;
  S_LEGAL?: string | null;
  ASMNT_YR?: number | null;
};

export type StatewideParcel = {
  parcel_id: string;
  county_code: number | null;
  county_name: string | null;
  owner_name: string | null;
  site_address: string | null;
  year_built: number | null;
  assessed_value: number | null;
  just_value: number | null;
  living_area_sqft: number | null;
  legal_description: string | null;
  assessment_year: number | null;
};

/** The layer covers the whole state including road right-of-way slivers, which come back as a
 *  feature with every attribute blanked. Those are not a parcel and must not be reported as
 *  one — a UI showing an empty owner on a real address is worse than showing nothing. */
export function isBlankFeature(attrs: StatewideAttributes | null | undefined): boolean {
  if (!attrs) return true;
  const parcel = (attrs.PARCEL_ID ?? "").toString().trim();
  return parcel === "" || !attrs.CO_NO;
}

/** Numeric fields use 0 for "not reported", which is not a real year or a real valuation. */
function positive(n: number | null | undefined): number | null {
  const v = typeof n === "number" ? n : null;
  return v !== null && v > 0 ? v : null;
}

function text(s: string | null | undefined): string | null {
  const v = (s ?? "").toString().trim();
  return v === "" || v === "UNASSIGNED" ? null : v;
}

export function toStatewideParcel(attrs: StatewideAttributes): StatewideParcel | null {
  if (isBlankFeature(attrs)) return null;
  const county = typeof attrs.CO_NO === "number" ? attrs.CO_NO : null;
  return {
    parcel_id: String(attrs.PARCEL_ID).trim(),
    county_code: county,
    county_name: county !== null ? (DOR_COUNTY_CODES[county] ?? null) : null,
    owner_name: text(attrs.OWN_NAME),
    site_address: text(attrs.PHY_ADDR1),
    // The actual year the structure went up, not the effective year the appraiser assigns
    // after improvements — a plans examiner cares about the former.
    year_built: positive(attrs.ACT_YR_BLT) ?? positive(attrs.EFF_YR_BLT),
    assessed_value: positive(attrs.AV_SD),
    just_value: positive(attrs.JV),
    living_area_sqft: positive(attrs.TOT_LVG_AR),
    legal_description: text(attrs.S_LEGAL),
    assessment_year: positive(attrs.ASMNT_YR),
  };
}

export function statewideQueryUrl(lon: number, lat: number, radiusMeters = 0): string {
  // The service rejects the shorthand "x,y" geometry that PAPA accepts; it wants the JSON
  // form with an explicit spatial reference.
  const geometry = JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } });
  const params = new URLSearchParams({
    f: "json",
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: OUT_FIELDS,
    returnGeometry: "false",
  });
  if (radiusMeters > 0) {
    params.set("distance", String(radiusMeters));
    params.set("units", "esriSRUnit_Meter");
    // Centroids are how a neighbour is told from the parcel actually asked about.
    params.set("returnCentroid", "true");
    params.set("outSR", "4326");
  }
  return `${STATEWIDE_LAYER_URL}?${params.toString()}`;
}

const STREET_TYPES = new Set([
  "ST",
  "STREET",
  "AVE",
  "AV",
  "AVENUE",
  "RD",
  "ROAD",
  "DR",
  "DRIVE",
  "BLVD",
  "BOULEVARD",
  "CIR",
  "CIRCLE",
  "CT",
  "COURT",
  "LN",
  "LANE",
  "PL",
  "PLACE",
  "TER",
  "TERRACE",
  "WAY",
  "HWY",
  "HIGHWAY",
  "TRL",
  "TRAIL",
  "PKWY",
  "PARKWAY",
  "LOOP",
  "RUN",
  "PATH",
]);

const DIRECTIONS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);

/** The street line only — everything the geocoder was given after the number and before the
 *  city, normalised so "1062 SW 32nd St." and "1062  SW 32ND ST" compare equal. The
 *  directional is kept apart because N and S of the same street are different streets. */
export function addressTokens(address: string): {
  number: string | null;
  direction: string | null;
  words: string[];
} {
  const line = address.split(",")[0] ?? "";
  const words = line
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const number = words.length > 0 && /^\d+$/.test(words[0]) ? words[0] : null;
  const rest = number ? words.slice(1) : words;
  return {
    number,
    direction: rest.find((w) => DIRECTIONS.has(w)) ?? null,
    words: rest.filter((w) => !STREET_TYPES.has(w) && !DIRECTIONS.has(w)),
  };
}

/** 3 = the site address is the address asked about, unit and all.
 *  2 = same house number and street, different or missing unit.
 *  1 = same number and street name but one side names a direction and the other does not —
 *      only safe to use when nothing else nearby answers to the address.
 *  0 = a different property; a neighbour's parcel is worse than no answer. */
export function addressMatchScore(requested: string, siteAddress: string | null): number {
  if (!siteAddress) return 0;
  const a = addressTokens(requested);
  const b = addressTokens(siteAddress);
  if (!a.number || a.number !== b.number) return 0;
  const shared = a.words.filter((w) => b.words.includes(w));
  const streetMatches =
    shared.length > 0 && shared.length >= Math.min(a.words.length, b.words.length);
  if (!streetMatches) return 0;
  if (a.direction !== b.direction) return a.direction && b.direction ? 0 : 1;
  return a.words.length === b.words.length ? 3 : 2;
}

function metresBetween(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const toRad = Math.PI / 180;
  const x = (lon2 - lon1) * toRad * Math.cos(((lat1 + lat2) / 2) * toRad);
  const y = (lat2 - lat1) * toRad;
  return Math.sqrt(x * x + y * y) * 6_371_000;
}

export type StatewideLookup = {
  parcel: StatewideParcel | null;
  /** How the parcel was found — a buffered match is an inference, a point hit is not. */
  match: "point_in_polygon" | "nearby_address_match" | null;
  /** How many other parcels scored the same in the buffered stage (condo stacks do). */
  ambiguous_candidates?: number;
  /** Kept for dispatch_results.raw_response so a surprising answer can be traced later. */
  raw: unknown;
  error: string | null;
};

function parcelsFrom(
  body: unknown,
): Array<{ parcel: StatewideParcel; centroid: { x: number; y: number } | null }> {
  const features = Array.isArray((body as { features?: unknown[] })?.features)
    ? (body as { features: Array<Record<string, unknown>> }).features
    : [];
  const out: Array<{ parcel: StatewideParcel; centroid: { x: number; y: number } | null }> = [];
  for (const feature of features) {
    const parcel = toStatewideParcel((feature?.attributes ?? {}) as StatewideAttributes);
    if (parcel) {
      const c = feature?.centroid as { x?: number; y?: number } | undefined;
      out.push({
        parcel,
        centroid: typeof c?.x === "number" && typeof c?.y === "number" ? { x: c.x, y: c.y } : null,
      });
    }
  }
  return out;
}

/** The hosted service intermittently hangs for ~55s and then answers
 *  `400 Invalid query parameters` to a request that succeeds unchanged on the next attempt.
 *  Without a bounded timeout and a retry that transient shows up as "parcel unavailable". */
async function queryLayer(
  url: string,
  doFetch: typeof fetch,
  attempts: number,
  timeoutMs: number,
): Promise<{ body: unknown; error: string | null }> {
  let lastError = "no attempt was made";
  let lastBody: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await doFetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) {
        lastError = `statewide parcel service returned ${res.status}`;
        continue;
      }
      const body = await res.json();
      lastBody = body;
      if (body?.error) {
        lastError = `statewide parcel service: ${body.error.message ?? "unknown error"}`;
        continue;
      }
      return { body, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { body: lastBody, error: lastError };
}

export async function lookupStatewideParcel(
  lon: number,
  lat: number,
  opts: {
    fetchImpl?: typeof fetch;
    attempts?: number;
    timeoutMs?: number;
    /** The address that was geocoded. Without it only an exact point hit can be trusted. */
    address?: string | null;
    radiusMeters?: number;
  } = {},
): Promise<StatewideLookup> {
  const doFetch = opts.fetchImpl ?? fetch;
  const attempts = opts.attempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const radius = opts.radiusMeters ?? 40;

  const point = await queryLayer(statewideQueryUrl(lon, lat), doFetch, attempts, timeoutMs);
  if (point.error === null) {
    // Overlapping polygons happen (a right-of-way sliver on top of the real parcel); take the
    // first feature that is an actual parcel rather than the first feature.
    const hit = parcelsFrom(point.body)[0];
    // Landing inside a polygon is not proof it is the right polygon: the geocoder can place
    // "1 Harbour Isle Dr W" inside number 18. Where the address is known, the polygon has to
    // own up to it — unless the parcel reports no site address to be checked against.
    const trusted =
      hit &&
      (!opts.address ||
        hit.parcel.site_address === null ||
        addressMatchScore(opts.address, hit.parcel.site_address) >= 2);
    if (trusted) {
      return { parcel: hit.parcel, match: "point_in_polygon", raw: point.body, error: null };
    }
  }

  // The Census geocoder interpolates along the street centreline, so a perfectly good address
  // often lands in the right-of-way between parcels rather than inside one. Search a short way
  // out and keep a candidate only if its own site address is the address that was asked about —
  // reporting the neighbour's owner would be worse than reporting nothing.
  if (!opts.address) {
    return { parcel: null, match: null, raw: point.body, error: point.error };
  }

  const near = await queryLayer(statewideQueryUrl(lon, lat, radius), doFetch, attempts, timeoutMs);
  if (near.error !== null) {
    return { parcel: null, match: null, raw: near.body ?? point.body, error: near.error };
  }

  const scored = parcelsFrom(near.body)
    .map((c) => ({
      ...c,
      score: addressMatchScore(opts.address as string, c.parcel.site_address),
      metres: c.centroid
        ? metresBetween(lon, lat, c.centroid.x, c.centroid.y)
        : Number.MAX_SAFE_INTEGER,
    }))
    .filter((c) => c.score >= 1)
    .sort((a, b) => b.score - a.score || a.metres - b.metres);

  // "100 2nd St" sits between 100 N 2ND ST and 100 S 2ND ST, and distance to a centroid is not
  // evidence of which one was meant. A direction may only be guessed where there is nothing to
  // guess between.
  const undirected = scored[0]?.score === 1;
  const rivals = undirected
    ? scored.filter((c) => c.parcel.parcel_id !== scored[0].parcel.parcel_id).length
    : 0;
  if (undirected && rivals > 0) {
    return {
      parcel: null,
      match: null,
      raw: { point: point.body, nearby: near.body },
      error: null,
    };
  }

  if (scored.length === 0) {
    return {
      parcel: null,
      match: null,
      raw: { point: point.body, nearby: near.body },
      error: null,
    };
  }

  const best = scored[0];
  const tied = scored.filter(
    (c) => c.score === best.score && c.parcel.parcel_id !== best.parcel.parcel_id,
  ).length;

  return {
    parcel: best.parcel,
    match: "nearby_address_match",
    ambiguous_candidates: tied,
    raw: { point: point.body, nearby: near.body, chosen_parcel_id: best.parcel.parcel_id },
    error: null,
  };
}
