import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateCleardFee, getCleardTier } from "./pricing.ts";

describe("getCleardTier", () => {
  it("places values under $2M in tier 1", () => {
    assert.strictEqual(getCleardTier(0), 1);
    assert.strictEqual(getCleardTier(1_500_000), 1);
    assert.strictEqual(getCleardTier(1_999_999), 1);
    assert.strictEqual(getCleardTier(2_000_000), 1);
  });

  it("places $2,000,001 through $9,999,999 in tier 2", () => {
    assert.strictEqual(getCleardTier(2_000_001), 2);
    assert.strictEqual(getCleardTier(4_000_000), 2);
    assert.strictEqual(getCleardTier(9_999_999), 2);
  });

  it("places $10M and above in tier 3", () => {
    assert.strictEqual(getCleardTier(10_000_000), 3);
    assert.strictEqual(getCleardTier(12_000_000), 3);
  });
});

describe("calculateCleardFee", () => {
  it("charges the $10,000 flat fee for tier 1", () => {
    assert.strictEqual(calculateCleardFee(1_500_000), 10_000);
    assert.strictEqual(calculateCleardFee(1_999_999), 10_000);
    assert.strictEqual(calculateCleardFee(2_000_000), 10_000);
  });

  it("charges 0.40% for tier 2", () => {
    assert.strictEqual(calculateCleardFee(4_000_000), 16_000);
    assert.strictEqual(calculateCleardFee(2_000_001), 8_000);
    assert.strictEqual(calculateCleardFee(9_999_999), 40_000);
  });

  it("charges 0.25% for tier 3", () => {
    assert.strictEqual(calculateCleardFee(10_000_000), 25_000);
    assert.strictEqual(calculateCleardFee(12_000_000), 30_000);
  });

  it("returns 0 for non-positive or non-finite values", () => {
    assert.strictEqual(calculateCleardFee(0), 0);
    assert.strictEqual(calculateCleardFee(-100), 0);
    assert.strictEqual(calculateCleardFee(Number.NaN), 0);
    assert.strictEqual(calculateCleardFee(Number.POSITIVE_INFINITY), 0);
  });
});
