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

export function statewideQueryUrl(lon: number, lat: number): string {
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
  return `${STATEWIDE_LAYER_URL}?${params.toString()}`;
}

export type StatewideLookup = {
  parcel: StatewideParcel | null;
  /** Kept for dispatch_results.raw_response so a surprising answer can be traced later. */
  raw: unknown;
  error: string | null;
};

/** The hosted service intermittently hangs for ~55s and then answers
 *  `400 Invalid query parameters` to a request that succeeds unchanged on the next attempt.
 *  Without a bounded timeout and a retry that transient shows up as "parcel unavailable". */
export async function lookupStatewideParcel(
  lon: number,
  lat: number,
  opts: { fetchImpl?: typeof fetch; attempts?: number; timeoutMs?: number } = {},
): Promise<StatewideLookup> {
  const doFetch = opts.fetchImpl ?? fetch;
  const attempts = opts.attempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const url = statewideQueryUrl(lon, lat);
  let lastError = "no attempt was made";
  let lastRaw: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await doFetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) {
        lastError = `statewide parcel service returned ${res.status}`;
        continue;
      }
      const body = await res.json();
      lastRaw = body;
      if (body?.error) {
        lastError = `statewide parcel service: ${body.error.message ?? "unknown error"}`;
        continue;
      }
      const features = Array.isArray(body?.features) ? body.features : [];
      // Overlapping polygons happen (a sliver on top of the real parcel); take the first
      // feature that is an actual parcel rather than the first feature.
      for (const feature of features) {
        const parcel = toStatewideParcel(feature?.attributes ?? {});
        if (parcel) return { parcel, raw: body, error: null };
      }
      return { parcel: null, raw: body, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return { parcel: null, raw: lastRaw, error: lastError };
}
