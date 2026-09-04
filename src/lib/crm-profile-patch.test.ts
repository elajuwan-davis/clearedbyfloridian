import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert";
import { crmProfilePatch } from "./crm-profile-patch.ts";

describe("crmProfilePatch", () => {
  it("only writes CRM columns so a profile upsert cannot wipe identity fields", () => {
    const patch = crmProfilePatch({
      crm: "Buildertrend",
      crm_other: "  ",
      source: "signup_form",
      capturedAt: "2026-09-04T08:00:00.000Z",
    });
    assert.deepStrictEqual(Object.keys(patch).sort(), [
      "crm_captured_at",
      "crm_source",
      "current_crm",
      "current_crm_other",
    ]);
    assert.strictEqual(patch.current_crm, "Buildertrend");
    assert.strictEqual(patch.current_crm_other, null);
    assert.strictEqual(patch.crm_source, "signup_form");
    assert.strictEqual(patch.crm_captured_at, "2026-09-04T08:00:00.000Z");
    assert.ok(!("id" in patch));
    assert.ok(!("display_name" in patch));
    assert.ok(!("full_name" in patch));
    assert.ok(!("email" in patch));
    assert.ok(!("company_name" in patch));
    assert.ok(!("id_document_url" in patch));
    assert.ok(!("notification_emails" in patch));
  });

  it("keeps a named other-CRM value", () => {
    const patch = crmProfilePatch({
      crm: "Other",
      crm_other: "  JobTread  ",
      source: "google",
      capturedAt: "2026-09-04T08:00:00.000Z",
    });
    assert.strictEqual(patch.current_crm_other, "JobTread");
    assert.strictEqual(patch.crm_source, "google");
  });

  it("signup and Google CRM capture update the existing profile instead of upserting", () => {
    const signup = readFileSync(new URL("./self-serve-signup.functions.ts", import.meta.url), "utf8");
    const crm = readFileSync(new URL("./crm.functions.ts", import.meta.url), "utf8");
    assert.match(signup, /\.update\(crmProfilePatch/);
    assert.doesNotMatch(signup, /\.upsert\(/);
    assert.match(crm, /\.update\(crmProfilePatch\(data\)\)/);
    assert.doesNotMatch(crm, /\.upsert\(/);
  });
});
