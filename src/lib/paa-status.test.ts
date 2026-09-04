import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPaaSigned } from "./paa-status.ts";

describe("isPaaSigned", () => {
  it("is true when SignWell confirmed the signature", () => {
    assert.equal(
      isPaaSigned({ status: "signed", statusSource: "provider_confirmed", envelopeId: "doc_1" }),
      true,
    );
  });

  it("grandfathers a pre-SignWell row: signed, staff-attested, no envelope", () => {
    assert.equal(
      isPaaSigned({ status: "signed", statusSource: "staff_attested", envelopeId: null }),
      true,
    );
  });

  it("rejects staff-attested 'signed' rows that have a SignWell document — those are not confirmed", () => {
    assert.equal(
      isPaaSigned({ status: "signed", statusSource: "staff_attested", envelopeId: "doc_1" }),
      false,
    );
  });

  it("rejects drafts, in-flight envelopes, and missing records", () => {
    assert.equal(
      isPaaSigned({ status: "draft", statusSource: "provider_confirmed", envelopeId: "doc_1" }),
      false,
    );
    assert.equal(
      isPaaSigned({ status: "sent", statusSource: "provider_confirmed", envelopeId: "doc_1" }),
      false,
    );
    assert.equal(
      isPaaSigned({ status: "viewed", statusSource: "staff_attested", envelopeId: null }),
      false,
    );
    assert.equal(isPaaSigned(null), false);
    assert.equal(isPaaSigned(undefined), false);
  });
});
