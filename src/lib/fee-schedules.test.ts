import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { estimatePermitFee, feeScheduleFor } from "./fee-schedules.ts";

describe("feeScheduleFor", () => {
  it("matches a known city case-insensitively and trims whitespace", () => {
    const named = feeScheduleFor("  West Palm Beach ", "residential");
    const fallback = feeScheduleFor("Unknownville", "residential");
    assert.equal(named.baseFee, 150);
    assert.equal(fallback.baseFee, 125);
    assert.notEqual(named.baseFee, fallback.baseFee);
  });

  it("uses the commercial schedule, not residential, for commercial jobs", () => {
    const res = feeScheduleFor("stuart", "residential");
    const com = feeScheduleFor("stuart", "commercial");
    assert.ok(com.baseFee > res.baseFee);
    assert.ok(com.perSqFt > res.perSqFt);
  });
});

describe("estimatePermitFee", () => {
  it("adds base + sqft + valuation + surcharge and rounds", () => {
    // Stuart residential: 105 + 1000*0.18 + 100000*0.01 + 38 = 1323
    assert.equal(
      estimatePermitFee({
        municipality: "Stuart",
        category: "residential",
        squareFootage: 1000,
        constructionValue: 100_000,
      }),
      1323,
    );
  });

  it("treats missing, negative, or non-finite measurements as zero — not NaN", () => {
    const baseOnly = estimatePermitFee({
      municipality: undefined,
      category: "residential",
      squareFootage: Number.NaN,
      constructionValue: -50,
    });
    // DEFAULT residential: 125 + 45 surcharge
    assert.equal(baseOnly, 170);
    assert.equal(
      estimatePermitFee({
        municipality: "",
        category: "commercial",
        squareFootage: Number.POSITIVE_INFINITY,
        constructionValue: 0,
      }),
      335,
    );
  });
});
