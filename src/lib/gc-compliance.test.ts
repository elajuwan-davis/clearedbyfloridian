import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { autoSelectKeys } from "./submittal-package.ts";
import { btrRequiredForSlug, docStatus, type GcDocRecord } from "./gc-compliance.ts";

function doc(partial: Partial<GcDocRecord> & Pick<GcDocRecord, "key">): GcDocRecord {
  return {
    label: partial.key,
    onFile: true,
    expiration: "2099-01-01",
    ...partial,
  };
}

describe("docStatus", () => {
  it("is missing when the file or a parseable expiration is absent", () => {
    assert.equal(docStatus(doc({ key: "coi_gl", onFile: false, expiration: "2099-01-01" })), "missing");
    assert.equal(docStatus(doc({ key: "coi_gl", onFile: true, expiration: null })), "missing");
    assert.equal(docStatus(doc({ key: "coi_gl", onFile: true, expiration: "not-a-date" })), "missing");
  });

  it("is expired in the past, warning inside 30 days, valid beyond that", () => {
    assert.equal(docStatus(doc({ key: "coi_gl", expiration: "2000-01-01" })), "expired");
    const in15 = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
    const in60 = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10);
    assert.equal(docStatus(doc({ key: "coi_gl", expiration: in15 })), "warning");
    assert.equal(docStatus(doc({ key: "coi_gl", expiration: in60 })), "valid");
  });
});

describe("btrRequiredForSlug", () => {
  it("requires a BTR only in the listed South Florida jurisdictions", () => {
    assert.equal(btrRequiredForSlug("miami-dade-county"), true);
    assert.equal(btrRequiredForSlug("west-palm-beach"), true);
    assert.equal(btrRequiredForSlug("orlando"), false);
    assert.equal(btrRequiredForSlug(null), false);
    assert.equal(btrRequiredForSlug(""), false);
  });
});

describe("autoSelectKeys", () => {
  it("attaches valid and warning docs, never expired or missing ones", () => {
    const in15 = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
    const keys = autoSelectKeys([
      doc({ key: "coi_gl", expiration: "2099-01-01" }),
      doc({ key: "coi_wc", expiration: in15 }),
      doc({ key: "license_dbpr", expiration: "2000-01-01" }),
      doc({ key: "btr", onFile: false, expiration: null }),
    ]);
    assert.deepEqual(keys, ["coi_gl", "coi_wc"]);
  });
});
