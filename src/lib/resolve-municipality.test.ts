import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveMunicipality } from "./resolve-municipality.ts";

const LIST = [{ name: "Palm Beach" }, { name: "West Palm Beach" }, { name: "Fort Pierce" }];

describe("resolveMunicipality", () => {
  it("uses the catalog spelling for an incorporated city, ignoring punctuation", () => {
    assert.deepEqual(
      resolveMunicipality(
        { city: "west-palm beach", county: "Palm Beach County", incorporated: true },
        LIST,
      ),
      { municipality: "West Palm Beach", matchedList: true, unincorporated: false },
    );
  });

  it("keeps an unknown incorporated city instead of guessing a neighbour", () => {
    assert.deepEqual(
      resolveMunicipality(
        { city: "Atlantis", county: "Palm Beach County", incorporated: true },
        LIST,
      ),
      { municipality: "Atlantis", matchedList: false, unincorporated: false },
    );
  });

  it("does not file unincorporated Palm Beach County as the Town of Palm Beach", () => {
    assert.deepEqual(
      resolveMunicipality(
        { city: "Palm Beach", county: "Palm Beach County", incorporated: false },
        LIST,
      ),
      {
        municipality: "Unincorporated Palm Beach County",
        matchedList: false,
        unincorporated: true,
      },
    );
  });

  it("appends County when the geocoder omitted the suffix", () => {
    const r = resolveMunicipality({ city: "", county: "St. Lucie", incorporated: false }, LIST);
    assert.equal(r.municipality, "Unincorporated St. Lucie County");
    assert.equal(r.unincorporated, true);
  });

  it("does not double the County suffix", () => {
    const r = resolveMunicipality(
      { city: "", county: "Palm Beach County", incorporated: false },
      LIST,
    );
    assert.equal(r.municipality, "Unincorporated Palm Beach County");
  });

  it("returns an empty municipality when nothing resolved", () => {
    assert.deepEqual(resolveMunicipality({ city: "", county: "", incorporated: false }, LIST), {
      municipality: "",
      matchedList: false,
      unincorporated: false,
    });
  });
});
