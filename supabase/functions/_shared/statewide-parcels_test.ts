import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
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
  const { parcel, error } = await lookupStatewideParcel(-80.137, 27.0709, { fetchImpl: f.impl });
  assertEquals(error, null);
  assertEquals(parcel?.parcel_id, "34-38-42-025-000-00150-0");
  assertEquals(f.count(), 1);
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
  const { parcel, error } = await lookupStatewideParcel(-80.0, 27.0, { fetchImpl: f.impl });
  assertEquals(parcel, null);
  assertEquals(error, null);
  assertEquals(f.count(), 1);
});
