// FEMA NFHL flood zone lookup for Florida addresses.
// No auth required — reads public FEMA data. Caches results for 30 days.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isSfha(zone: string) {
  return /^[AV]/i.test(zone);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const address = url.searchParams.get("address");
  let lat: number | null = Number(url.searchParams.get("lat"));
  let lon: number | null = Number(url.searchParams.get("lon"));
  const projectId = url.searchParams.get("project_id") ?? null;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Supabase not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    if (!address) {
      return new Response(
        "Provide either address or lat/lon parameters",
        { status: 400 },
      );
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
      return new Response("Address not found", { status: 404 });
    }
    lat = Number(match.coordinates.y);
    lon = Number(match.coordinates.x);
  }

  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const { data: cached } = await supabase
    .from("dispatch_results")
    .select("*")
    .eq("latitude", lat)
    .eq("longitude", lon)
    .gte("fetched_at", since)
    .order("fetched_at", { ascending: false })
    .limit(1);

  if (cached && cached.length > 0) {
    return new Response(JSON.stringify(cached[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const femaUrl =
    `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query?` +
    `f=json&geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326` +
    `&spatialRel=esriSpatialRelWithin&outFields=FLD_ZONE,ZONE_SUBTY,STATIC_BFE` +
    `&returnGeometry=false`;

  const femaRes = await fetch(femaUrl);
  if (!femaRes.ok) {
    return new Response("FEMA service failed", { status: 502 });
  }
  const fema = await femaRes.json();

  const attrs = fema.features?.[0]?.attributes ?? {};
  const baseZone = attrs.FLD_ZONE ? String(attrs.FLD_ZONE) : "X";
  const subType = attrs.ZONE_SUBTY ? String(attrs.ZONE_SUBTY) : "";
  const floodZone = subType ? `${baseZone} ${subType}` : baseZone;
  const inSfha = isSfha(floodZone);
  const bfe = attrs.STATIC_BFE ? Number(attrs.STATIC_BFE) : null;

  const { data: inserted, error } = await supabase
    .from("dispatch_results")
    .insert({
      project_id: projectId,
      latitude: lat,
      longitude: lon,
      flood_zone: floodZone,
      in_sfha: inSfha,
      base_flood_elev: bfe,
      raw_response: { fema },
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return new Response("Failed to cache result", { status: 500 });
  }

  return new Response(JSON.stringify(inserted), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
