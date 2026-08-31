import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  matchMunicipalityName,
  matchScopes,
  parseSpokenMoney,
  tidySpokenAddress,
} from "./victoria-permit-match.ts";

const CITIES = [
  "Miami",
  "Miami Beach",
  "Palm Beach",
  "West Palm Beach",
  "North Palm Beach",
  "Boca Raton",
  "Ft. Lauderdale",
];

const SCOPES = ["Pool & Spa", "Electrical", "Plumbing", "Roofing", "HVAC"];

describe("matchMunicipalityName", () => {
  it("returns empty when nothing was heard", () => {
    assert.equal(matchMunicipalityName("", CITIES), "");
    assert.equal(matchMunicipalityName("   ", CITIES), "");
  });

  it("matches an exact catalog name, stripping City of / County", () => {
    assert.equal(matchMunicipalityName("Miami Beach", CITIES), "Miami Beach");
    assert.equal(matchMunicipalityName("the city of Miami Beach", CITIES), "Miami Beach");
    assert.equal(matchMunicipalityName("Palm Beach County", CITIES), "Palm Beach");
  });

  it("prefers an exact short name over a longer contains hit", () => {
    // "Miami" is also a prefix of "Miami Beach"; exact must win or the form
    // files against the wrong building department.
    assert.equal(matchMunicipalityName("Miami", CITIES), "Miami");
    assert.equal(matchMunicipalityName("Palm Beach", CITIES), "Palm Beach");
  });

  it("uses a contains match when the spoken phrase wraps a catalog name", () => {
    assert.equal(matchMunicipalityName("West Palm Beach Florida", CITIES), "West Palm Beach");
    // Longest contains-hit wins — same rule as address portal matching.
    assert.equal(matchMunicipalityName("Miami Beach Florida", CITIES), "Miami Beach");
  });

  it("falls back to the trimmed raw words so the picker can accept freeform", () => {
    assert.equal(matchMunicipalityName("  Jupiter  ", CITIES), "Jupiter");
  });
});

describe("matchScopes", () => {
  it("picks catalog options whose words appear in the transcript", () => {
    assert.deepEqual(matchScopes("Pool and spa, electrical and plumbing", SCOPES), [
      "Pool & Spa",
      "Electrical",
      "Plumbing",
    ]);
  });

  it("drops unmatched words instead of inventing a scope", () => {
    assert.deepEqual(matchScopes("landscaping and pavers", SCOPES), []);
  });

  it("ignores tiny option words so 'and' does not match everything", () => {
    assert.deepEqual(matchScopes("and the the", SCOPES), []);
  });
});

describe("parseSpokenMoney", () => {
  it("reads digits, commas, and a dollar sign", () => {
    assert.equal(parseSpokenMoney("$250,000"), "250000");
    assert.equal(parseSpokenMoney("250,000"), "250000");
    assert.equal(parseSpokenMoney("250000"), "250000");
  });

  it("applies thousand / million suffixes from dictation", () => {
    assert.equal(parseSpokenMoney("250 thousand"), "250000");
    assert.equal(parseSpokenMoney("250k"), "250000");
    assert.equal(parseSpokenMoney("2.5 million"), "2500000");
    assert.equal(parseSpokenMoney("1.2m"), "1200000");
  });

  it("returns empty when there are no digits", () => {
    assert.equal(parseSpokenMoney(""), "");
    assert.equal(parseSpokenMoney("skip"), "");
  });
});

describe("tidySpokenAddress", () => {
  it("turns a spoken leading digit into a numeral and capitalises", () => {
    assert.equal(tidySpokenAddress("two fifty ocean boulevard"), "2 fifty ocean boulevard");
  });
});
