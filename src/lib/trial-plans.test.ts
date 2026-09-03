import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TRIAL_PLANS, formatMonthly, planForPriceId } from "./trial-plans.ts";

describe("planForPriceId", () => {
  it("resolves the Stripe lookup keys used at checkout", () => {
    assert.equal(planForPriceId("cleard_blueprint_monthly")?.name, "Blueprint");
    assert.equal(planForPriceId("cleard_foundation_monthly")?.name, "Foundation");
    assert.equal(planForPriceId("cleard_complete_monthly")?.name, "Complete");
    assert.equal(planForPriceId("cleard_foundation_monthly")?.monthlyCents, 24900);
  });

  it("returns undefined for a missing, blank, or unknown price id", () => {
    assert.equal(planForPriceId(null), undefined);
    assert.equal(planForPriceId(undefined), undefined);
    assert.equal(planForPriceId(""), undefined);
    assert.equal(planForPriceId("price_live_something_else"), undefined);
  });

  it("keeps lookup keys unique so a checkout cannot land on two tiers", () => {
    const ids = TRIAL_PLANS.map((p) => p.priceId);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, 3);
  });
});

describe("formatMonthly", () => {
  it("renders the three published prices the way the picker shows them", () => {
    assert.equal(formatMonthly(9900), "$99/mo");
    assert.equal(formatMonthly(24900), "$249/mo");
    assert.equal(formatMonthly(49900), "$499/mo");
  });
});
