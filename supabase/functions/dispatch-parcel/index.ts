// Parcel lookup for any Florida county.
//
// Palm Beach keeps its own Property Appraiser (PAPA) service as the preferred source — it is
// the county's live system rather than a once-a-year rollup. Everywhere else (and when PAPA
// has no parcel at the point) the Department of Revenue statewide cadastral layer answers, so
// the five Treasure Coast cities are no longer "unavailable" by construction.
//
// Caches results in dispatch_results.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { lookupStatewideParcel } from "../_shared/statewide-parcels.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

function textResponse(text: string, status = 200) {
  return new Response(text, { status, headers: CORS_HEADERS });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const address = url.searchParams.get("address");
  const county = (url.searchParams.get("county") ?? "").trim().toLowerCase();
  const permitId = url.searchParams.get("permit_id") ?? null;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return textResponse("Supabase not configured", 500);
  }

  const supabase = serviceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (!county || !address) {
    return textResponse("Missing county or address", 400);
  }

  const normalizedCounty = county
    .replace(/\s*county\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const isPalmBeach = normalizedCounty === "palm beach";

  const geoUrl =
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?` +
    `address=${encodeURIComponent(address)}&benchmark=4&format=json`;

  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    return textResponse("Geocoding service failed", 502);
  }
  const geo = await geoRes.json();
  const match = geo.result?.addressMatches?.[0];
  if (!match) {
    const { data } = await supabase
      .from("dispatch_results")
      .insert({
        permit_id: permitId,
        parcel_source: "unavailable",
      })
      .select()
      .single();

    return jsonResponse(data);
  }

  const lat = Number(match.coordinates.y);
  const lon = Number(match.coordinates.x);
  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

  const { data: cached } = await supabase
    .from("dispatch_results")
    .select("*")
    .eq("latitude", lat)
    .eq("longitude", lon)
    .eq("permit_id", permitId)
    .gte("fetched_at", since)
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (cached && cached.length > 0 && cached[0].parcel_source) {
    return jsonResponse(cached[0]);
  }

  if (isPalmBeach) {
    const papaUrl =
      `https://gis.pbcgov.org/arcgis/rest/services/Parcels/PARCEL_INFO/MapServer/4/query?` +
      `f=json&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
      `&spatialRel=esriSpatialRelWithin&outFields=PARID,OWNER_NAME1,SITE_ADDR_STR` +
      `&returnGeometry=false`;

    const papaRes = await fetch(papaUrl);
    if (!papaRes.ok) {
      return textResponse("PAPA service failed", 502);
    }
    const papa = await papaRes.json();

    const attrs = papa.features?.[0]?.attributes ?? {};
    const parcelId = attrs.PARID ? String(attrs.PARID) : null;
    const ownerName = attrs.OWNER_NAME1 ? String(attrs.OWNER_NAME1) : null;

    if (parcelId) {
      const { data } = await supabase
        .from("dispatch_results")
        .insert({
          permit_id: permitId,
          latitude: lat,
          longitude: lon,
          parcel_id: parcelId,
          owner_name: ownerName,
          parcel_source: "papa",
          raw_response: { geocode: match, papa },
        })
        .select()
        .single();

      return jsonResponse(data);
    }

    // PAPA had no parcel at that point. That used to be the end of it; the statewide layer
    // gets a turn before the answer is "unavailable".
    return await answerFromStatewide(supabase, { permitId, lat, lon, match, papa, address });
  }

  return await answerFromStatewide(supabase, { permitId, lat, lon, match, papa: null, address });
});

function serviceClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Supabase = ReturnType<typeof serviceClient>;

async function answerFromStatewide(
  supabase: Supabase,
  ctx: {
    permitId: string | null;
    lat: number;
    lon: number;
    match: unknown;
    papa: unknown;
    address: string;
  },
) {
  const {
    parcel,
    match: matchKind,
    ambiguous_candidates: ambiguous,
    raw,
    error,
  } = await lookupStatewideParcel(ctx.lon, ctx.lat, { address: ctx.address });

  const rawResponse = {
    geocode: ctx.match,
    ...(ctx.papa === null ? {} : { papa: ctx.papa }),
    statewide: raw,
    statewide_match: matchKind,
    ...(ambiguous ? { statewide_ambiguous_candidates: ambiguous } : {}),
    ...(error === null ? {} : { statewide_error: error }),
  };

  if (!parcel) {
    const { data } = await supabase
      .from("dispatch_results")
      .insert({
        permit_id: ctx.permitId,
        latitude: ctx.lat,
        longitude: ctx.lon,
        parcel_source: "unavailable",
        raw_response: rawResponse,
      })
      .select()
      .single();

    return jsonResponse(data);
  }

  const { data } = await supabase
    .from("dispatch_results")
    .insert({
      permit_id: ctx.permitId,
      latitude: ctx.lat,
      longitude: ctx.lon,
      parcel_id: parcel.parcel_id,
      owner_name: parcel.owner_name,
      year_built: parcel.year_built,
      assessed_value: parcel.assessed_value,
      living_area_sqft: parcel.living_area_sqft,
      legal_description: parcel.legal_description,
      // Named for the roll it came from, so a stale valuation is visible rather than implied.
      parcel_source: "fdor_statewide",
      assessment_year: parcel.assessment_year,
      raw_response: rawResponse,
    })
    .select()
    .single();

  return jsonResponse(data);
}
