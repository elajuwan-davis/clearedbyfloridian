import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allTimelinePaths,
  computeEstimate,
  findTimelineCounty,
  findTimelinePermitType,
  TIMELINE_COUNTIES,
  TIMELINE_PERMIT_TYPES,
  TIER_FEE_MULTIPLIER,
  type TimelineCounty,
  type TimelinePermitType,
} from "./permit-timelines.ts";

const stubCounty = (partial: Partial<TimelineCounty> & Pick<TimelineCounty, "tier" | "rangeLow" | "rangeHigh">): TimelineCounty => ({
  slug: "stub",
  name: "Stub",
  label: "Stub County",
  fact: "",
  ...partial,
});

const stubType = (
  partial: Partial<TimelinePermitType> & Pick<TimelinePermitType, "dayMult" | "feeLow" | "feeHigh">,
): TimelinePermitType => ({
  slug: "stub-permit",
  name: "Stub",
  shortName: "Stub",
  technical: "",
  ...partial,
});

describe("computeEstimate", () => {
  it("applies the county range, permit multiplier, and tier fee bump", () => {
    const miami = findTimelineCounty("miami-dade");
    const pool = findTimelinePermitType("pool-permit");
    assert.ok(miami && pool);
    const est = computeEstimate(miami, pool);
    assert.equal(est.daysLow, 45);
    assert.equal(est.daysHigh, 65);
    assert.equal(est.feeLow, Math.round((1400 * TIER_FEE_MULTIPLIER.A) / 10) * 10);
    assert.equal(est.feeHigh, Math.round((3200 * TIER_FEE_MULTIPLIER.A) / 10) * 10);
  });

  it("floors days at minDays and stretches the high end to minDays + 2", () => {
    const est = computeEstimate(
      stubCounty({ tier: "C", rangeLow: 8, rangeHigh: 10 }),
      stubType({ dayMult: 0.2, minDays: 2, feeLow: 150, feeHigh: 420 }),
    );
    // 8*0.2 → 2, 10*0.2 → 2; minDays lifts the high end to 4.
    assert.equal(est.daysLow, 2);
    assert.equal(est.daysHigh, 4);
  });

  it("rounds tier-C fees to the nearest $10", () => {
    const est = computeEstimate(
      stubCounty({ tier: "C", rangeLow: 15, rangeHigh: 28 }),
      stubType({ dayMult: 1, feeLow: 150, feeHigh: 420 }),
    );
    // 150 * 0.85 = 127.5 → $130; 420 * 0.85 = 357 → $360
    assert.equal(est.feeLow, 130);
    assert.equal(est.feeHigh, 360);
  });
});

describe("timeline catalog", () => {
  it("has unique county and permit-type slugs", () => {
    const counties = TIMELINE_COUNTIES.map((c) => c.slug);
    const types = TIMELINE_PERMIT_TYPES.map((p) => p.slug);
    assert.equal(new Set(counties).size, counties.length);
    assert.equal(new Set(types).size, types.length);
  });

  it("exposes every county × permit-type coverage path", () => {
    const paths = allTimelinePaths();
    assert.equal(paths.length, TIMELINE_COUNTIES.length * TIMELINE_PERMIT_TYPES.length);
    assert.ok(paths.includes("/coverage/miami-dade/pool-permit"));
    assert.ok(paths.includes("/coverage/leon/roofing-permit"));
  });
});
