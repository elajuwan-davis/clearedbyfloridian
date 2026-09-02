import { describe, it } from "node:test";
import assert from "node:assert";
import { trialPathAllowed } from "./plan-access.ts";

describe("trialPathAllowed", () => {
  it("lets a trial account reach billing after Stripe checkout", () => {
    assert.strictEqual(trialPathAllowed("/portal/billing"), true);
    assert.strictEqual(trialPathAllowed("/portal/billing/"), true);
  });

  it("still lets a trial account file and edit its own permits", () => {
    assert.strictEqual(trialPathAllowed("/portal/permits"), true);
    assert.strictEqual(trialPathAllowed("/portal/permits/new"), true);
    assert.strictEqual(trialPathAllowed("/portal/permits/abc"), true);
  });

  it("does not unlock paid workspaces via the /portal prefix", () => {
    assert.strictEqual(trialPathAllowed("/portal"), true);
    assert.strictEqual(trialPathAllowed("/portal/financials"), false);
    assert.strictEqual(trialPathAllowed("/portal/documents"), false);
    assert.strictEqual(trialPathAllowed("/portal/marketplace"), false);
    assert.strictEqual(trialPathAllowed("/admin/crms"), false);
  });
});
