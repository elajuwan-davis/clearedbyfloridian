import { createFileRoute } from "@tanstack/react-router";

// Server proxy for the free US Census Geocoder (no API key, no billing).
// Proxied server-side so the browser never hits a third-party origin directly
// and we can normalise the payload into our own ResolvedAddress shape.

const BASE = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress";

type Geog = { NAME?: string; BASENAME?: string; FUNCSTAT?: string };

function firstName(list: Geog[] | undefined): string {
  const g = (list ?? [])[0];
  if (!g) return "";
  return (g.BASENAME || g.NAME || "").trim();
}

export const Route = createFileRoute("/api/geocode-census")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const address = (url.searchParams.get("address") || "").trim();
        if (!address) return Response.json({ matches: [], error: "Missing address" }, { status: 400 });

        const params = new URLSearchParams({
          address,
          benchmark: "Public_AR_Current",
          vintage: "Current_Current",
          layers: "Incorporated Places,Counties,States",
          format: "json",
        });

        try {
          const resp = await fetch(`${BASE}?${params.toString()}`, {
            headers: { Accept: "application/json" },
          });
          if (!resp.ok) {
            return Response.json({ matches: [], error: `Census geocoder returned ${resp.status}` });
          }
          const json = (await resp.json()) as {
            result?: {
              addressMatches?: Array<{
                matchedAddress?: string;
                addressComponents?: Record<string, string>;
                geographies?: Record<string, Geog[]>;
              }>;
            };
          };

          const raw = json.result?.addressMatches ?? [];
          const matches = raw.slice(0, 5).map((m) => {
            const c = m.addressComponents ?? {};
            const geo = m.geographies ?? {};
            const places = geo["Incorporated Places"];
            const incorporated = !!(places && places.length > 0);
            const streetLine = [
              c.fromAddress,
              c.preQualifier,
              c.preDirection,
              c.preType,
              c.streetName,
              c.suffixType,
              c.suffixDirection,
              c.suffixQualifier,
            ]
              .filter(Boolean)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            const countyBase = firstName(geo["Counties"]);
            return {
              streetLine: streetLine || (m.matchedAddress || "").split(",")[0] || "",
              city: incorporated ? firstName(places) : "",
              county: countyBase ? (/county$/i.test(countyBase) ? countyBase : `${countyBase} County`) : "",
              state: c.state || "",
              postalCode: c.zip || "",
              formatted: m.matchedAddress || address,
              incorporated,
              provider: "census" as const,
            };
          });

          if (matches.length === 0) {
            return Response.json({
              matches: [],
              error: "No match found. Check the street number and city, or enter the municipality manually.",
            });
          }
          return Response.json({ matches });
        } catch {
          return Response.json({ matches: [], error: "Lookup service unreachable." });
        }
      },
    },
  },
});
