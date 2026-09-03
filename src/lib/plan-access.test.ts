import { describe, it } from "node:test";
import assert from "node:assert";
import { trialPathAllowed } from "./plan-access.ts";

describe("trialPathAllowed", () => {
  it("allows the billing page and its subpaths", () => {
    assert.strictEqual(trialPathAllowed("/portal/billing"), true);
    assert.strictEqual(trialPathAllowed("/portal/billing/"), true);
    assert.strictEqual(trialPathAllowed("/portal/billing/invoices"), true);
  });

  it("allows /portal itself but not paid-only /portal children", () => {
    assert.strictEqual(trialPathAllowed("/portal"), true);
    assert.strictEqual(trialPathAllowed("/portal/subcontractors"), false);
    assert.strictEqual(trialPathAllowed("/portal/financials"), false);
  });

  it("keeps the other trial paths allowed", () => {
    for (const p of [
      "/dashboard",
      "/portal/permits",
      "/portal/permits/new",
      "/building-dept-logins",
      "/messages",
      "/profile",
      "/portal/company",
    ]) {
      assert.strictEqual(trialPathAllowed(p), true, p);
    }
  });

  it("blocks paid-only paths", () => {
    assert.strictEqual(trialPathAllowed("/portal/alerts"), false);
    assert.strictEqual(trialPathAllowed("/admin"), false);
  });
});
