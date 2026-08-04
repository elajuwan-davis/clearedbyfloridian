// Local-only test rig for the agent edge functions (Deno).
//
// Stands in for the two things an edge function talks to that don't exist on a
// laptop: the Supabase REST gateway and the app's own /api routes.
//
//   /rest/v1/*            → proxied to the local PostgREST container (real SQL,
//                           real RLS-bypassing service_role, real tables)
//   /storage/v1/*         → files on disk under STORAGE_DIR, with the same
//                           upload / createSignedUrl / download surface
//                           supabase-js uses (signed URLs are real and
//                           downloadable from this server)
//   /api/geocode-census   → proxied to the *real* US Census geocoder, normalised
//                           exactly like src/routes/api/geocode-census.ts
//   /api/verify-license   → fixture. myfloridalicense.com answers server-side
//                           requests with a 302 and no body, so the live DBPR
//                           checker returns "unknown" in any automated context.
//                           The fixture is the only way to exercise active vs
//                           expired deterministically.
//
//   deno run --allow-net --allow-env scripts/local-test/mock-app.ts
//
// PORT (default 54331), POSTGREST_URL (default http://localhost:54330),
// SERVICE_JWT: bearer token PostgREST accepts as service_role.

const PORT = Number(Deno.env.get("PORT") ?? 54331);
const POSTGREST_URL = Deno.env.get("POSTGREST_URL") ?? "http://localhost:54330";
const SERVICE_JWT = Deno.env.get("SERVICE_JWT") ?? "";
const STORAGE_DIR = Deno.env.get("STORAGE_DIR") ?? "/tmp/cleard-local-storage";

const CENSUS = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

type Geog = { NAME?: string; BASENAME?: string; FUNCSTAT?: string };

const firstName = (list: Geog[] | undefined): string => {
  const g = (list ?? [])[0];
  return g ? (g.BASENAME || g.NAME || "").trim() : "";
};

const LICENSE_FIXTURES: Record<
  string,
  { status: string; holder_name: string; license_type: string; expiration: string }
> = {
  // Fully compliant GC
  CGC1512345: {
    status: "active",
    holder_name: "Coastline Builders LLC",
    license_type: "Certified General Contractor",
    expiration: "2027-08-31",
  },
  // Intentionally expired GC
  CGC1599999: {
    status: "expired",
    holder_name: "Lapsed Brothers Construction LLC",
    license_type: "Certified General Contractor",
    expiration: "2024-08-31",
  },
};

async function geocode(address: string): Promise<Response> {
  const params = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Incorporated Places,Counties,States",
    format: "json",
  });
  const resp = await fetch(`${CENSUS}?${params}`, { headers: { Accept: "application/json" } });
  if (!resp.ok) return Response.json({ matches: [], error: `Census returned ${resp.status}` });
  const json = await resp.json();
  const matches = (json?.result?.addressMatches ?? []).map((m: Record<string, never>) => {
    const geo = (m as unknown as { geographies?: Record<string, Geog[]> }).geographies ?? {};
    const city = firstName(geo["Incorporated Places"]);
    const county = firstName(geo["Counties"]);
    const state = firstName(geo["States"]);
    const matched = (m as unknown as { matchedAddress?: string }).matchedAddress ?? address;
    return {
      streetLine: matched.split(",")[0] ?? matched,
      city,
      county: county ? `${county} County` : "",
      state: state === "Florida" ? "FL" : state,
      postalCode: "",
      formatted: matched,
      incorporated: Boolean(city),
      provider: "census",
    };
  });
  return Response.json({ matches });
}

// --- storage stand-in -------------------------------------------------------

const storagePath = (bucketAndKey: string): string => `${STORAGE_DIR}/${bucketAndKey}`;

async function storageWrite(bucketAndKey: string, bytes: Uint8Array): Promise<void> {
  const full = storagePath(bucketAndKey);
  await Deno.mkdir(full.slice(0, full.lastIndexOf("/")), { recursive: true });
  await Deno.writeFile(full, bytes);
}

async function storageRead(bucketAndKey: string): Promise<Uint8Array | null> {
  try {
    return await Deno.readFile(storagePath(bucketAndKey));
  } catch {
    return null;
  }
}

async function handleStorage(req: Request, url: URL): Promise<Response> {
  // .download() fetches /object/authenticated/<bucket>/<key>; the prefix is not part
  // of the stored key.
  const rest = url.pathname
    .replace("/storage/v1/object/", "")
    .replace(/^authenticated\//, "");


  // createSignedUrl → { signedURL }
  if (rest.startsWith("sign/")) {
    const key = rest.slice("sign/".length);
    // supabase-js prefixes this with the storage base URL, so it must be relative
    // to /storage/v1 exactly like the real API's response.
    return Response.json({ signedURL: `/object/signed/${key}?token=local` });
  }

  // signed download
  if (rest.startsWith("signed/")) {
    const bytes = await storageRead(rest.slice("signed/".length));
    if (!bytes) return new Response("Not found", { status: 404 });
    return new Response(bytes, { headers: { "Content-Type": "application/pdf" } });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const buf = new Uint8Array(await req.arrayBuffer());
    await storageWrite(rest, buf);
    return Response.json({ Key: rest });
  }

  if (req.method === "GET") {
    const bytes = await storageRead(rest);
    if (!bytes) return new Response("Not found", { status: 404 });
    return new Response(bytes, { headers: { "Content-Type": "application/pdf" } });
  }

  return new Response("Not found", { status: 404 });
}

Deno.serve({ port: PORT }, async (req) => {
  const url = new URL(req.url);

  if (url.pathname.startsWith("/storage/v1/object/")) return await handleStorage(req, url);

  if (url.pathname.startsWith("/rest/v1/")) {
    const target = `${POSTGREST_URL}${url.pathname.replace("/rest/v1", "")}${url.search}`;
    const headers = new Headers(req.headers);
    headers.set("Authorization", `Bearer ${SERVICE_JWT}`);
    headers.delete("host");
    headers.delete("apikey");
    const resp = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    });
    const text = await resp.text();
    const bodiless = resp.status === 204 || resp.status === 205 || resp.status === 304;
    return new Response(bodiless ? null : text, {
      status: resp.status,
      headers: { "Content-Type": resp.headers.get("Content-Type") ?? "application/json" },
    });
  }

  if (url.pathname === "/api/geocode-census") {
    const address = (url.searchParams.get("address") ?? "").trim();
    if (!address) return Response.json({ matches: [], error: "Missing address" }, { status: 400 });
    return await geocode(address);
  }

  if (url.pathname === "/api/verify-license") {
    const ln = (url.searchParams.get("ln") ?? "").trim().toUpperCase();
    const hit = LICENSE_FIXTURES[ln];
    const lookup_url = `https://www.myfloridalicense.com/LicenseDetail.asp?SID=&id=${ln}`;
    return Response.json(
      hit
        ? { license_number: ln, ...hit, lookup_url, checked_at: new Date().toISOString() }
        : {
            license_number: ln,
            status: "unknown",
            lookup_url,
            checked_at: new Date().toISOString(),
          },
    );
  }

  return new Response("Not found", { status: 404 });
});
