import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isProviderConfirmed } from "./signature-requests.ts";

describe("isProviderConfirmed", () => {
  it("is true only for a SignWell-confirmed signed row", () => {
    assert.equal(
      isProviderConfirmed({ status: "signed", status_source: "provider_confirmed" }),
      true,
    );
  });

  it("rejects staff-attested signatures and unsigned rows", () => {
    assert.equal(isProviderConfirmed({ status: "signed", status_source: "staff_attested" }), false);
    assert.equal(
      isProviderConfirmed({ status: "sent", status_source: "provider_confirmed" }),
      false,
    );
    assert.equal(isProviderConfirmed(null), false);
  });
});
