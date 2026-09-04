import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateServiceFeeCents, stripeProcessingFeeCents } from "./stripe-fees.ts";

describe("calculateServiceFeeCents", () => {
  it("charges 1% under $1M", () => {
    assert.equal(calculateServiceFeeCents(500_000), 500_000);
    assert.equal(calculateServiceFeeCents(999_999), 999_999);
  });

  it("charges 0.5% at the $1M boundary and above", () => {
    assert.equal(calculateServiceFeeCents(1_000_000), 500_000);
    assert.equal(calculateServiceFeeCents(2_000_000), 1_000_000);
  });

  it("returns 0 for non-positive or non-finite values", () => {
    assert.equal(calculateServiceFeeCents(0), 0);
    assert.equal(calculateServiceFeeCents(-100), 0);
    assert.equal(calculateServiceFeeCents(Number.NaN), 0);
  });
});

describe("stripeProcessingFeeCents", () => {
  it("is 2.9% + $0.30 of the base amount", () => {
    assert.equal(stripeProcessingFeeCents(10_000), 320);
    assert.equal(stripeProcessingFeeCents(1), 30);
  });

  it("returns 0 for non-positive bases so a $0 invoice does not invent a fee", () => {
    assert.equal(stripeProcessingFeeCents(0), 0);
    assert.equal(stripeProcessingFeeCents(-50), 0);
  });
});
