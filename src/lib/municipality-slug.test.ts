import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slugifyCity } from "./municipality-slug.ts";

describe("slugifyCity", () => {
  it("lowercases and hyphenates the names the vault keys on", () => {
    assert.equal(slugifyCity("Fort Lauderdale"), "fort-lauderdale");
    assert.equal(slugifyCity("Miami-Dade"), "miami-dade");
    assert.equal(slugifyCity("St. Lucie"), "st-lucie");
    assert.equal(slugifyCity("West Palm Beach"), "west-palm-beach");
    assert.equal(slugifyCity("Plantation"), "plantation");
  });

  it("strips punctuation and surrounding dashes so catalog slugs stay stable", () => {
    assert.equal(slugifyCity("  St. Johns  "), "st-johns");
    assert.equal(slugifyCity("O'Brien"), "o-brien");
    assert.equal(slugifyCity("---Palm Beach---"), "palm-beach");
    assert.equal(slugifyCity("City of Boca Raton"), "city-of-boca-raton");
  });

  it("returns empty for blank or punctuation-only input", () => {
    assert.equal(slugifyCity(""), "");
    assert.equal(slugifyCity("   "), "");
    assert.equal(slugifyCity("***"), "");
  });
});
