import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isLpoaSigned } from "./lpoa-status.ts";

describe("isLpoaSigned", () => {
  it("is true only when SignWell confirmed the signature", () => {
    assert.equal(
      isLpoaSigned({ status: "signed", statusSource: "provider_confirmed" }),
      true,
    );
  });

  it("rejects a staff-attested 'signed' row — LPOA has no grandfather exception", () => {
    assert.equal(isLpoaSigned({ status: "signed", statusSource: "staff_attested" }), false);
  });

  it("rejects drafts, in-flight envelopes, and missing records", () => {
    assert.equal(isLpoaSigned({ status: "draft", statusSource: "provider_confirmed" }), false);
    assert.equal(isLpoaSigned({ status: "sent", statusSource: "provider_confirmed" }), false);
    assert.equal(isLpoaSigned({ status: "viewed", statusSource: "staff_attested" }), false);
    assert.equal(isLpoaSigned({ status: "declined", statusSource: "provider_confirmed" }), false);
    assert.equal(isLpoaSigned(null), false);
    assert.equal(isLpoaSigned(undefined), false);
  });
});
