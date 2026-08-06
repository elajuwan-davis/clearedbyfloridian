import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  addressMatchScore,
  isBlankFeature,
  lookupStatewideParcel,
  statewideQueryUrl,
  toStatewideParcel,
} from "./statewide-parcels.ts";

// A real feature, copied from the live service for 8820 SE BAHAMA CIR, Hobe Sound.
const HOBE_SOUND = {
  PARCEL_ID: "34-38-42-025-000-00150-0",
  CO_NO: 53,
  OWN_NAME: "MATTINGLY SUSAN",
  PHY_ADDR1: "8820 SE BAHAMA CIR",
  PHY_CITY: "HOBE SOUND",
  ACT_YR_BLT: 1979,
  EFF_YR_BLT: 1990,
  JV: 443430,
  AV_SD: 190520,
  TOT_LVG_AR: 2456,
  S_LEGAL: "SANDPIPER SEC 1 LOT 15",
  ASMNT_YR: 2025,
};

// Right-of-way sliver: the service returns a feature with every attribute blanked.
const BLANK = {
  PARCEL_ID: " ",
  CO_NO: 0,
  OWN_NAME: " ",
  PHY_ADDR1: " ",
  PHY_CITY: " ",
  ACT_YR_BLT: 0,
  JV: 0,
  AV_SD: 0,
  TOT_LVG_AR: 0,
  ASMNT_YR: 0,
  DOR_UC: " ",
};

function stubFetch(responses: Array<() => Promise<Response> | Response>) {
  let call = 0;
  const calls: string[] = [];
  const impl = ((input: string | URL | Request) => {
    calls.push(String(input));
    const next = responses[Math.min(call, responses.length - 1)];
    call++;
    return Promise.resolve(next());
  }) as unknown as typeof fetch;
  return { impl, calls: () => calls, count: () => call };
}

const ok = (body: unknown) => () => new Response(JSON.stringify(body), { status: 200 });

Deno.test("a real feature becomes a parcel with the fields the UI needs", () => {
  assertEquals(toStatewideParcel(HOBE_SOUND), {
    parcel_id: "34-38-42-025-000-00150-0",
    county_code: 53,
    county_name: "Martin",
    owner_name: "MATTINGLY SUSAN",
    site_address: "8820 SE BAHAMA CIR",
    year_built: 1979,
    assessed_value: 190520,
    just_value: 443430,
    living_area_sqft: 2456,
    legal_description: "SANDPIPER SEC 1 LOT 15",
    assessment_year: 2025,
  });
});

Deno.test("a right-of-way sliver is not a parcel", () => {
  assertEquals(isBlankFeature(BLANK), true);
  assertEquals(toStatewideParcel(BLANK), null);
});

Deno.test("zero means not reported, not year 0 or a $0 valuation", () => {
  const parcel = toStatewideParcel({
    ...HOBE_SOUND,
    ACT_YR_BLT: 0,
    EFF_YR_BLT: 0,
    AV_SD: 0,
    TOT_LVG_AR: 0,
  });
  assertEquals(parcel?.year_built, null);
  assertEquals(parcel?.assessed_value, null);
  assertEquals(parcel?.living_area_sqft, null);
});

Deno.test("actual year built wins over the appraiser's effective year", () => {
  assertEquals(toStatewideParcel({ ...HOBE_SOUND, ACT_YR_BLT: 0 })?.year_built, 1990);
});

Deno.test("an unassigned site address reads as no address", () => {
  assertEquals(toStatewideParcel({ ...HOBE_SOUND, PHY_ADDR1: "UNASSIGNED" })?.site_address, null);
});

Deno.test("the query sends geometry as JSON with an explicit spatial reference", () => {
  const url = new URL(statewideQueryUrl(-80.137, 27.0709));
  assertEquals(JSON.parse(url.searchParams.get("geometry") ?? "{}"), {
    x: -80.137,
    y: 27.0709,
    spatialReference: { wkid: 4326 },
  });
  assertEquals(url.searchParams.get("geometryType"), "esriGeometryPoint");
  assertEquals(url.searchParams.get("returnGeometry"), "false");
});

Deno.test("a parcel is returned when the service answers", async () => {
  const f = stubFetch([ok({ features: [{ attributes: HOBE_SOUND }] })]);
  const { parcel, match, error } = await lookupStatewideParcel(-80.137, 27.0709, {
    fetchImpl: f.impl,
  });
  assertEquals(error, null);
  assertEquals(match, "point_in_polygon");
  assertEquals(parcel?.parcel_id, "34-38-42-025-000-00150-0");
  assertEquals(f.count(), 1);
});

Deno.test("address scoring: same street written differently still matches", () => {
  assertEquals(addressMatchScore("1062 SW 32nd St., Palm City, FL 34990", "1062  SW 32ND ST"), 3);
  assertEquals(addressMatchScore("8820 SE Bahama Cir, Hobe Sound", "8820 SE BAHAMA CIRCLE"), 3);
});

Deno.test("address scoring: a neighbour or a different street does not match", () => {
  assertEquals(addressMatchScore("8820 SE Bahama Cir", "8824 SE BAHAMA CIR"), 0);
  assertEquals(addressMatchScore("1100 Ponce De Leon Cir", "1100 ROYAL PALM BLVD"), 0);
  assertEquals(addressMatchScore("8820 SE Bahama Cir", null), 0);
});

Deno.test("address scoring: a unit on one side only is a weaker match", () => {
  assertEquals(addressMatchScore("111 SE 1st Ave", "111 SE 1ST AVE 316"), 2);
});

Deno.test("address scoring: north and south of the same street are different streets", () => {
  assertEquals(addressMatchScore("100 N 2nd St", "100 S 2ND ST"), 0);
  assertEquals(addressMatchScore("824 S 2nd St", "824 N 2ND ST"), 0);
  // Asked without a direction, so which one it is has not been established.
  assertEquals(addressMatchScore("100 2nd St", "100 S 2ND ST"), 1);
});

Deno.test("landing inside the wrong polygon is not a match", async () => {
  // The live failure: the geocoder puts 1 Harbour Isle Dr W inside number 18.
  const wrong = {
    attributes: { ...HOBE_SOUND, PARCEL_ID: "wrong", PHY_ADDR1: "18 HARBOUR ISLE DR W 104" },
  };
  const f = stubFetch([ok({ features: [wrong] }), ok({ features: [wrong] })]);
  const { parcel, match } = await lookupStatewideParcel(-80.31, 27.44, {
    fetchImpl: f.impl,
    address: "1 Harbour Isle Dr W, Fort Pierce, FL",
  });
  assertEquals(parcel, null);
  assertEquals(match, null);
});

Deno.test("a polygon hit with no site address is still trusted", async () => {
  const f = stubFetch([ok({ features: [{ attributes: { ...HOBE_SOUND, PHY_ADDR1: " " } }] })]);
  const { parcel, match } = await lookupStatewideParcel(-80.137, 27.0709, {
    fetchImpl: f.impl,
    address: "8820 SE Bahama Cir",
  });
  assertEquals(match, "point_in_polygon");
  assertEquals(parcel?.parcel_id, "34-38-42-025-000-00150-0");
});

Deno.test("an omitted direction is refused when both sides of the street answer", async () => {
  const side = (dir: string, owner: string, x: number) => ({
    attributes: {
      ...HOBE_SOUND,
      PARCEL_ID: `${dir}-100`,
      PHY_ADDR1: `100 ${dir} 2ND ST`,
      OWN_NAME: owner,
    },
    centroid: { x, y: 27.445 },
  });
  const f = stubFetch([
    ok({ features: [] }),
    ok({
      features: [side("N", "RFMD INVESTMENTS LLC", -80.3231), side("S", "GALLERIA", -80.3233)],
    }),
  ]);
  const { parcel } = await lookupStatewideParcel(-80.3232, 27.445, {
    fetchImpl: f.impl,
    address: "100 2nd St, Fort Pierce, FL",
  });
  assertEquals(parcel, null);
});

Deno.test("an omitted direction is accepted when only one street answers", async () => {
  const only = {
    attributes: { ...HOBE_SOUND, PARCEL_ID: "n-100", PHY_ADDR1: "100 N 2ND ST" },
    centroid: { x: -80.3231, y: 27.445 },
  };
  const f = stubFetch([ok({ features: [] }), ok({ features: [only] })]);
  const { parcel, match } = await lookupStatewideParcel(-80.3232, 27.445, {
    fetchImpl: f.impl,
    address: "100 2nd St, Fort Pierce, FL",
  });
  assertEquals(match, "nearby_address_match");
  assertEquals(parcel?.parcel_id, "n-100");
});

Deno.test("a centreline geocode falls back to the parcel with that address", async () => {
  // What the live service does for 8820 SE Bahama Cir: the point lands in the road, the
  // buffered query returns the block.
  const neighbours = [
    {
      attributes: { ...HOBE_SOUND, PARCEL_ID: "nbr-1", PHY_ADDR1: "8824 SE BAHAMA CIR" },
      centroid: { x: -80.13637, y: 27.06974 },
    },
    { attributes: HOBE_SOUND, centroid: { x: -80.13618, y: 27.06968 } },
  ];
  const f = stubFetch([ok({ features: [] }), ok({ features: neighbours })]);
  const { parcel, match, ambiguous_candidates } = await lookupStatewideParcel(-80.1362, 27.0699, {
    fetchImpl: f.impl,
    address: "8820 SE Bahama Cir, Hobe Sound, FL 33455",
  });
  assertEquals(match, "nearby_address_match");
  assertEquals(parcel?.parcel_id, "34-38-42-025-000-00150-0");
  assertEquals(ambiguous_candidates, 0);
  assertEquals(f.count(), 2);
});

Deno.test("no nearby parcel carries the address, so nothing is reported", async () => {
  const f = stubFetch([
    ok({ features: [] }),
    ok({
      features: [
        { attributes: { ...HOBE_SOUND, PARCEL_ID: "nbr-1", PHY_ADDR1: "8824 SE BAHAMA CIR" } },
      ],
    }),
  ]);
  const { parcel, match } = await lookupStatewideParcel(-80.1362, 27.0699, {
    fetchImpl: f.impl,
    address: "8820 SE Bahama Cir",
  });
  assertEquals(parcel, null);
  assertEquals(match, null);
});

Deno.test("without an address the buffered stage is not attempted", async () => {
  const f = stubFetch([ok({ features: [] })]);
  const { parcel, match } = await lookupStatewideParcel(-80.1362, 27.0699, { fetchImpl: f.impl });
  assertEquals(parcel, null);
  assertEquals(match, null);
  assertEquals(f.count(), 1);
});

Deno.test("a condo stack is reported as ambiguous rather than silently picked", async () => {
  const unit = (n: string) => ({
    attributes: { ...HOBE_SOUND, PARCEL_ID: `unit-${n}`, PHY_ADDR1: `111 SE 1ST AVE ${n}` },
    centroid: { x: -80.0718, y: 26.459 },
  });
  const f = stubFetch([ok({ features: [] }), ok({ features: [unit("316"), unit("507")] })]);
  const { parcel, ambiguous_candidates } = await lookupStatewideParcel(-80.0719, 26.4596, {
    fetchImpl: f.impl,
    address: "111 SE 1st Ave, Delray Beach, FL 33444",
  });
  assertEquals(parcel?.parcel_id, "unit-316");
  assertEquals(ambiguous_candidates, 1);
});

Deno.test("a sliver stacked on the real parcel does not win", async () => {
  const f = stubFetch([ok({ features: [{ attributes: BLANK }, { attributes: HOBE_SOUND }] })]);
  const { parcel } = await lookupStatewideParcel(-80.137, 27.0709, { fetchImpl: f.impl });
  assertEquals(parcel?.owner_name, "MATTINGLY SUSAN");
});

Deno.test("the transient 'invalid query parameters' error is retried", async () => {
  const f = stubFetch([
    ok({ error: { code: 400, message: "Cannot perform query. Invalid query parameters." } }),
    ok({ features: [{ attributes: HOBE_SOUND }] }),
  ]);
  const { parcel, error } = await lookupStatewideParcel(-80.137, 27.0709, { fetchImpl: f.impl });
  assertEquals(error, null);
  assertEquals(parcel?.parcel_id, "34-38-42-025-000-00150-0");
  assertEquals(f.count(), 2);
});

Deno.test(
  "a persistent failure reports the reason instead of pretending there is no parcel",
  async () => {
    const f = stubFetch([() => new Response("boom", { status: 503 })]);
    const { parcel, error } = await lookupStatewideParcel(-80.137, 27.0709, {
      fetchImpl: f.impl,
      attempts: 2,
    });
    assertEquals(parcel, null);
    assertEquals(error, "statewide parcel service returned 503");
    assertEquals(f.count(), 2);
  },
);

Deno.test("open water — a genuine no-parcel answer is not an error", async () => {
  const f = stubFetch([ok({ features: [] })]);
  const { parcel, error } = await lookupStatewideParcel(-80.0, 27.0, {
    fetchImpl: f.impl,
    address: "nowhere",
  });
  assertEquals(parcel, null);
  assertEquals(error, null);
});
