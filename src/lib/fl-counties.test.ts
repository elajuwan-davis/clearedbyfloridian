import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FL_COUNTIES } from "./fl-counties.ts";

describe("FL_COUNTIES", () => {
  it("lists every Florida county once, with the spellings the selects use", () => {
    assert.equal(FL_COUNTIES.length, 67);
    assert.equal(new Set(FL_COUNTIES).size, 67);
    for (const name of ["Miami-Dade", "Palm Beach", "St. Johns", "St. Lucie", "DeSoto", "Indian River"]) {
      assert.ok(FL_COUNTIES.includes(name as (typeof FL_COUNTIES)[number]), `missing ${name}`);
    }
  });

  it("does not use the truncated 'Dade' or 'St Johns' spellings", () => {
    assert.equal((FL_COUNTIES as readonly string[]).includes("Dade"), false);
    assert.equal((FL_COUNTIES as readonly string[]).includes("St Johns"), false);
    assert.equal((FL_COUNTIES as readonly string[]).includes("St Lucie"), false);
  });
});
