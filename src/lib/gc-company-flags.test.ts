import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canSubmitNewPermits,
  complianceFlags,
  type GcCompanyFlagsInput,
} from "./gc-company-flags.ts";

const NOW = new Date("2026-09-02T00:00:00.000Z");

function profile(overrides: Partial<GcCompanyFlagsInput> = {}): GcCompanyFlagsInput {
  return {
    primaryQualifier: {
      name: "Jane Qualifier",
      licenseType: "CGC",
      expiration: "2027-01-01",
      dbprStatus: "active",
    },
    secondaryQualifier: null,
    generalLiability: { expiration: "2027-01-01" },
    workersComp: { expiration: "2027-01-01" },
    bond: null,
    ...overrides,
  };
}

describe("complianceFlags", () => {
  it("returns nothing on a fully valid profile, including blank dates on an unsaved row", () => {
    assert.deepEqual(complianceFlags(profile(), NOW), []);
    assert.deepEqual(
      complianceFlags(
        profile({
          primaryQualifier: {
            name: "",
            licenseType: "CGC",
            expiration: "",
            dbprStatus: "inactive",
          },
          generalLiability: { expiration: "" },
          workersComp: { expiration: "   " },
        }),
        NOW,
      ),
      [],
    );
  });

  it("blocks when DBPR already marked the qualifier expired, even if the date is still in the future", () => {
    const flags = complianceFlags(
      profile({
        primaryQualifier: {
          name: "Jane Qualifier",
          licenseType: "CGC",
          expiration: "2027-01-01",
          dbprStatus: "expired",
        },
      }),
      NOW,
    );
    assert.deepEqual(flags, [{ level: "blocked", label: "CGC license (Jane Qualifier) expired" }]);
  });

  it("blocks on a past expiration date and warns at 60 days, including the 1-day singular", () => {
    const expired = complianceFlags(
      profile({ generalLiability: { expiration: "2026-08-01" } }),
      NOW,
    );
    assert.equal(
      expired.some(
        (f) => f.level === "blocked" && f.label === "General liability insurance expired",
      ),
      true,
    );

    const warn60 = complianceFlags(profile({ workersComp: { expiration: "2026-11-01" } }), NOW);
    assert.equal(
      warn60.some(
        (f) =>
          f.level === "warn" && f.label === "Workers compensation insurance expires in 60 days",
      ),
      true,
    );

    const warn1 = complianceFlags(profile({ bond: { expiration: "2026-09-03" } }), NOW);
    assert.deepEqual(warn1, [{ level: "warn", label: "Surety bond expires in 1 day" }]);
  });

  it("also flags a secondary qualifier when present", () => {
    const flags = complianceFlags(
      profile({
        secondaryQualifier: {
          name: "Sam Second",
          licenseType: "CBC",
          expiration: "2026-08-15",
          dbprStatus: "active",
        },
      }),
      NOW,
    );
    assert.equal(
      flags.some((f) => f.label === "CBC license (Sam Second) expired"),
      true,
    );
  });
});

describe("canSubmitNewPermits", () => {
  it("allows a warn-only profile and blocks any expired credential", () => {
    assert.deepEqual(
      canSubmitNewPermits(profile({ generalLiability: { expiration: "2026-11-01" } }), NOW),
      {
        ok: true,
      },
    );
    assert.deepEqual(
      canSubmitNewPermits(profile({ generalLiability: { expiration: "2026-08-01" } }), NOW),
      {
        ok: false,
        message: "License expired — update before submitting new permits",
      },
    );
  });
});
