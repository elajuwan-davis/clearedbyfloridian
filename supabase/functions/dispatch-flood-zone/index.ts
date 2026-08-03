// FEMA NFHL flood zone lookup for Florida addresses.
// No auth required — reads public FEMA data. Caches results for 30 days.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isSfha(zone: string) {
  return /^[AV]/i.test(zone);
}

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
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const address = url.searchParams.get("address");
    let lat: number | null = Number(url.searchParams.get("lat"));
    let lon: number | null = Number(url.searchParams.get("lon"));
    const permitId = url.searchParams.get("permit_id") ?? null;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return textResponse("Supabase not configured", 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      if (!address) {
        return textResponse("Provide either address or lat/lon parameters", 400);
      }

      const geoUrl =
        `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?` +
        `address=${encodeURIComponent(address)}&benchmark=4&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        return textResponse(`Geocoding service failed: ${geoRes.status}`, 502);
      }
      const geo = await geoRes.json();
      const match = geo.result?.addressMatches?.[0];
      if (!match) {
        return textResponse("Address not found", 404);
      }
      lat = Number(match.coordinates.y);
      lon = Number(match.coordinates.x);
    }

    const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
    const { data: cached, error: cachedErr } = await supabase
      .from("dispatch_results")
      .select("*")
      .eq("latitude", lat)
      .eq("longitude", lon)
      .gte("fetched_at", since)
      .order("fetched_at", { ascending: false })
      .limit(1);

    if (cachedErr) {
      console.error("[dispatch-flood-zone] cache lookup error:", cachedErr);
      return jsonResponse({ error: "cache lookup failed", details: cachedErr.message }, 500);
    }

    if (cached && cached.length > 0) {
      return jsonResponse(cached[0]);
    }

    const femaUrl =
      `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?` +
      `f=json&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
      `&spatialRel=esriSpatialRelWithin&outFields=FLD_ZONE,ZONE_SUBTY,STATIC_BFE` +
      `&returnGeometry=false`;

    const femaRes = await fetch(femaUrl);
    if (!femaRes.ok) {
      return textResponse(`FEMA service failed: ${femaRes.status}`, 502);
    }
    const fema = await femaRes.json();

    const attrs = fema.features?.[0]?.attributes ?? {};
    const baseZone = attrs.FLD_ZONE ? String(attrs.FLD_ZONE) : "X";
    const subType = attrs.ZONE_SUBTY ? String(attrs.ZONE_SUBTY) : "";
    const floodZone = subType ? `${baseZone} ${subType}` : baseZone;
    const inSfha = isSfha(floodZone);
    const rawBfe = attrs.STATIC_BFE ? Number(attrs.STATIC_BFE) : null;
    const bfe = rawBfe !== null && Number.isFinite(rawBfe) ? rawBfe : null;

    const insertPayload = {
      permit_id: permitId,
      latitude: lat,
      longitude: lon,
      flood_zone: floodZone,
      in_sfha: inSfha,
      base_flood_elev: bfe,
      raw_response: { fema },
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("dispatch_results")
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr) {
      console.error("[dispatch-flood-zone] insert error:", insertErr);
      return jsonResponse({ error: "insert failed", details: insertErr.message, payload: insertPayload }, 500);
    }

    return jsonResponse(inserted);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[dispatch-flood-zone] unhandled error:", err);
    return jsonResponse({ error: "unhandled exception", details: message }, 500);
  }
});
