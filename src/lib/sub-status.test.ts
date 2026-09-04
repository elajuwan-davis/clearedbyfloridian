import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coiLifecycle, subIsComplete, subMissingFields } from "./sub-status.ts";

const complete = {
  license_file_name: "lic.pdf",
  license_expiration: "2027-01-01",
  coi_file_name: "coi.pdf",
  coi_expiration: "2027-06-01",
  w9_file_name: "w9.pdf",
};

describe("subMissingFields / subIsComplete", () => {
  it("lists every required upload and date when the row is empty", () => {
    assert.deepEqual(subMissingFields({}), [
      "License Upload",
      "License Expiration",
      "COI Upload",
      "COI Expiration",
      "W-9 Upload",
    ]);
    assert.equal(subIsComplete({}), false);
  });

  it("is complete only when license, COI, and W-9 are all on file with dates", () => {
    assert.deepEqual(subMissingFields(complete), []);
    assert.equal(subIsComplete(complete), true);
    assert.deepEqual(subMissingFields({ ...complete, w9_file_name: null }), ["W-9 Upload"]);
  });
});

describe("coiLifecycle", () => {
  const now = new Date("2026-08-30T12:00:00");

  function daysFromNow(days: number): string {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  it("is missing when the date is absent or unparseable", () => {
    assert.equal(coiLifecycle({}, now), "missing");
    assert.equal(coiLifecycle({ coi_expiration: "not-a-date" }, now), "missing");
  });

  it("is expired when the certificate date is in the past", () => {
    assert.equal(coiLifecycle({ coi_expiration: "2000-01-01" }, now), "expired");
  });

  it("is expiring_soon inside 30 days and active well beyond that", () => {
    // Date-only strings parse as UTC midnight, so stay away from the 0/30
    // edges — a US timezone would otherwise flip the boundary by one day.
    assert.equal(coiLifecycle({ coi_expiration: daysFromNow(15) }, now), "expiring_soon");
    assert.equal(coiLifecycle({ coi_expiration: daysFromNow(60) }, now), "active");
    assert.equal(coiLifecycle({ coi_expiration: "2099-12-31" }, now), "active");
  });
});
