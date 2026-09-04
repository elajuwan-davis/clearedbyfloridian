import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tradeSignatureState } from "./bundle-signature-state.ts";

describe("tradeSignatureState", () => {
  it("is pending when no signature request exists yet", () => {
    assert.equal(tradeSignatureState(undefined), "pending");
  });

  it("is signed only when SignWell confirmed completion", () => {
    assert.equal(
      tradeSignatureState({ status: "signed", statusSource: "provider_confirmed" }),
      "signed",
    );
  });

  it("treats a ledger 'signed' row without provider confirmation as still sent", () => {
    assert.equal(
      tradeSignatureState({ status: "signed", statusSource: "staff_attested" }),
      "sent",
    );
  });

  it("is sent for any in-flight or declined request", () => {
    assert.equal(tradeSignatureState({ status: "sent", statusSource: "staff_attested" }), "sent");
    assert.equal(tradeSignatureState({ status: "viewed", statusSource: "staff_attested" }), "sent");
    assert.equal(
      tradeSignatureState({ status: "declined", statusSource: "provider_confirmed" }),
      "sent",
    );
    assert.equal(tradeSignatureState({ status: "draft", statusSource: "staff_attested" }), "sent");
  });
});
