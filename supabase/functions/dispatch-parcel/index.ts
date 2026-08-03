// Palm Beach County Property Appraiser (PAPA) parcel lookup.
// Caches results in dispatch_results. Returns null fields for non-Palm Beach counties.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const address = url.searchParams.get("address");
  const county = (url.searchParams.get("county") ?? "").trim().toLowerCase();
  const permitId = url.searchParams.get("permit_id") ?? null;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Supabase not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!county || !address) {
    return new Response("Missing county or address", { status: 400 });
  }

  const normalizedCounty = county.replace(/\s+/g, " ").trim();

  if (normalizedCounty !== "palm beach") {
    const { data } = await supabase
      .from("dispatch_results")
      .insert({
        permit_id: permitId,
        parcel_source: "unavailable",
      })
      .select()
      .single();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const geoUrl =
    `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?` +
    `address=${encodeURIComponent(address)}&benchmark=4&format=json`;

  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    return new Response("Geocoding service failed", { status: 502 });
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

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify(cached[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const papaUrl =
    `https://gis.pbcgov.org/arcgis/rest/services/Parcels/PARCEL_INFO/MapServer/4/query?` +
    `f=json&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
    `&spatialRel=esriSpatialRelWithin&outFields=PARID,OWNER_NAME1,SITE_ADDR_STR` +
    `&returnGeometry=false`;

  const papaRes = await fetch(papaUrl);
  if (!papaRes.ok) {
    return new Response("PAPA service failed", { status: 502 });
  }
  const papa = await papaRes.json();

  const attrs = papa.features?.[0]?.attributes ?? {};
  const parcelId = attrs.PARID ? String(attrs.PARID) : null;
  const ownerName = attrs.OWNER_NAME1 ? String(attrs.OWNER_NAME1) : null;

  if (!parcelId) {
    const { data } = await supabase
      .from("dispatch_results")
      .insert({
        permit_id: permitId,
        latitude: lat,
        longitude: lon,
        parcel_source: "unavailable",
        raw_response: { geocode: match, papa },
      })
      .select()
      .single();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
