import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessedValueToCents, isHvhzCounty } from "./dispatch-value.ts";

describe("isHvhzCounty", () => {
  it("treats Miami-Dade and Broward as HVHZ, including a trailing County", () => {
    assert.equal(isHvhzCounty("Miami-Dade"), true);
    assert.equal(isHvhzCounty("Miami-Dade County"), true);
    assert.equal(isHvhzCounty("Broward"), true);
    assert.equal(isHvhzCounty("broward county"), true);
  });

  it("does not treat Palm Beach or other counties as HVHZ", () => {
    assert.equal(isHvhzCounty("Palm Beach"), false);
    assert.equal(isHvhzCounty("Palm Beach County"), false);
    assert.equal(isHvhzCounty("Orange"), false);
  });
});

describe("assessedValueToCents", () => {
  it("converts whole-dollar appraiser values to cents", () => {
    assert.equal(assessedValueToCents(450_000), 45_000_000);
    assert.equal(assessedValueToCents("150000"), 15_000_000);
  });

  it("rounds fractional dollars and preserves null", () => {
    assert.equal(assessedValueToCents(1234.56), 123_456);
    assert.equal(assessedValueToCents(null), null);
    assert.equal(assessedValueToCents(undefined), null);
  });
});
