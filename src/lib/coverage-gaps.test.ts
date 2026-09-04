import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coverageGaps, type CoverageGapSub } from "./coverage-gaps.ts";

const TODAY = "2026-09-02";
const complete: CoverageGapSub = {
  has_coi: true,
  has_license: true,
  has_w9: true,
  coi_expiration: "2027-01-01",
  license_expiration: "2027-01-01",
};

describe("coverageGaps", () => {
  it("returns nothing when documents are on file and still in force through the project", () => {
    assert.deepEqual(
      coverageGaps(complete, { coverageNeededThrough: "2026-12-01", w9Required: true }, TODAY),
      [],
    );
  });

  it("reports missing COI, license, unknown dates, and a required W-9", () => {
    const gaps = coverageGaps(
      {
        has_coi: false,
        has_license: false,
        has_w9: false,
        coi_expiration: null,
        license_expiration: null,
      },
      { coverageNeededThrough: null, w9Required: true },
      TODAY,
    );
    assert.deepEqual(
      gaps.map((g) => g.field),
      ["coi", "coi_expiration", "license", "license_expiration", "w9"],
    );
  });

  it("does not demand a W-9 when the project does not require one", () => {
    const gaps = coverageGaps(
      { ...complete, has_w9: false },
      { coverageNeededThrough: null, w9Required: false },
      TODAY,
    );
    assert.equal(
      gaps.some((g) => g.field === "w9"),
      false,
    );
  });

  it("flags a COI that already expired, vs one that lapses before the project needs cover", () => {
    const expired = coverageGaps(
      { ...complete, coi_expiration: "2026-08-31" },
      { coverageNeededThrough: "2026-12-01", w9Required: false },
      TODAY,
    );
    assert.deepEqual(expired, [{ field: "coi_expiration", message: "COI expired 2026-08-31" }]);

    const short = coverageGaps(
      { ...complete, coi_expiration: "2026-10-01" },
      { coverageNeededThrough: "2026-12-01", w9Required: false },
      TODAY,
    );
    assert.deepEqual(short, [
      {
        field: "coi_expiration",
        message: "COI expires 2026-10-01, before this project needs cover through 2026-12-01",
      },
    ]);
  });

  it("uses today as the coverage-through date when the project did not name one", () => {
    const gaps = coverageGaps(
      { ...complete, coi_expiration: "2026-09-01" },
      { coverageNeededThrough: null, w9Required: false },
      TODAY,
    );
    assert.deepEqual(gaps, [{ field: "coi_expiration", message: "COI expired 2026-09-01" }]);
  });

  it("flags an expired license without treating a future-but-before-project license as a gap", () => {
    const expired = coverageGaps(
      { ...complete, license_expiration: "2026-08-01" },
      { coverageNeededThrough: "2026-12-01", w9Required: false },
      TODAY,
    );
    assert.deepEqual(expired, [
      { field: "license_expiration", message: "License expired 2026-08-01" },
    ]);

    const stillValid = coverageGaps(
      { ...complete, license_expiration: "2026-10-01" },
      { coverageNeededThrough: "2026-12-01", w9Required: false },
      TODAY,
    );
    assert.deepEqual(stillValid, []);
  });
});
