import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { complianceFlagsFromSubs, COMPLIANCE_FLAG_WINDOW_MS } from "./weekly-report-flags.ts";

const NOW = new Date("2026-09-04T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function isoDaysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * DAY).toISOString();
}

describe("complianceFlagsFromSubs", () => {
  it("flags a COI or license that expires inside the 60-day window", () => {
    const coi = isoDaysFromNow(30);
    const license = isoDaysFromNow(59);
    const flags = complianceFlagsFromSubs(
      [{ company_name: "Acme Electric", coi_expiration: coi, license_expiration: license }],
      NOW,
    );
    assert.deepEqual(flags, [
      { subcontractor: "Acme Electric", issue: `COI expires ${coi}` },
      { subcontractor: "Acme Electric", issue: `License expires ${license}` },
    ]);
  });

  it("does not flag a date on or after the 60-day cutoff", () => {
    const onCutoff = new Date(NOW.getTime() + COMPLIANCE_FLAG_WINDOW_MS).toISOString();
    const after = isoDaysFromNow(61);
    const flags = complianceFlagsFromSubs(
      [
        { company_name: "Ok Co", coi_expiration: onCutoff, license_expiration: after },
      ],
      NOW,
    );
    assert.deepEqual(flags, []);
  });

  it("flags an already-expired date and skips missing ones", () => {
    const expired = isoDaysFromNow(-1);
    const flags = complianceFlagsFromSubs(
      [
        { company_name: "Expired Co", coi_expiration: expired, license_expiration: null },
        { company_name: "Blank Co" },
      ],
      NOW,
    );
    assert.deepEqual(flags, [{ subcontractor: "Expired Co", issue: `COI expires ${expired}` }]);
  });

  it("returns an empty list for null or empty subs", () => {
    assert.deepEqual(complianceFlagsFromSubs(null, NOW), []);
    assert.deepEqual(complianceFlagsFromSubs([], NOW), []);
  });
});
