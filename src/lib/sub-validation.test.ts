import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isEmail, isIsoDate, subValidationErrors } from "./sub-validation.ts";

describe("isEmail", () => {
  it("accepts a simple address and rejects missing parts or spaces", () => {
    assert.equal(isEmail("ops@builder.com"), true);
    assert.equal(isEmail("not-an-email"), false);
    assert.equal(isEmail("missing@domain"), false);
    assert.equal(isEmail("a@b.c"), true);
  });
});

describe("isIsoDate", () => {
  it("accepts real calendar days and rejects impossible or malformed ones", () => {
    assert.equal(isIsoDate("2026-02-28"), true);
    assert.equal(isIsoDate("2024-02-29"), true);
    assert.equal(isIsoDate("2026-02-31"), false);
    assert.equal(isIsoDate("2026-13-01"), false);
    assert.equal(isIsoDate("02/28/2026"), false);
    assert.equal(isIsoDate("2026-2-8"), false);
  });
});

const complete = {
  company_name: "Apex Electric",
  trade: "Electrical",
  license_number: "EC1234567",
  license_expiration: "2027-06-01",
  email: "apex@example.com",
};

describe("subValidationErrors", () => {
  it("returns no errors for a complete record", () => {
    assert.deepEqual(subValidationErrors(complete), []);
  });

  it("requires company, trade, license, expiration, and contact email", () => {
    const errors = subValidationErrors({});
    assert.ok(errors.includes("Company Name is required"));
    assert.ok(errors.includes("Trade is required"));
    assert.ok(errors.includes("License Number is required"));
    assert.ok(errors.includes("License Expiration is required"));
    assert.ok(errors.includes("Contact Email is required"));
  });

  it("rejects invalid dates and emails instead of marking the row complete", () => {
    const errors = subValidationErrors({
      ...complete,
      license_expiration: "2026-02-31",
      email: "not-an-email",
      insurance_carrier_email: "carrier-at-site",
    });
    assert.ok(errors.includes("License Expiration is not a valid date"));
    assert.ok(errors.includes("Contact Email is not a valid email address"));
    assert.ok(errors.includes("Insurance Carrier Email is not a valid email address"));
  });

  it("requires a COI expiration only when a COI file is attached", () => {
    assert.deepEqual(subValidationErrors({ ...complete, coi_file_name: "coi.pdf" }), [
      "COI Expiration is required when a COI is attached",
    ]);
    assert.deepEqual(
      subValidationErrors({ ...complete, coi_file_name: "coi.pdf", coi_expiration: "2027-01-15" }),
      [],
    );
    assert.deepEqual(subValidationErrors({ ...complete, coi_expiration: "2026-02-31" }), [
      "COI Expiration is not a valid date",
    ]);
  });
});
