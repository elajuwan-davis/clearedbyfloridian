import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPaymentAuthSigned, type PaymentAuthRecord } from "./payment-auth.ts";

function rec(partial: Partial<PaymentAuthRecord>): PaymentAuthRecord {
  return {
    id: "pa-1",
    accountHolder: "Test GC",
    billingAddress: "1 Main St",
    authorizationDate: "2026-08-01",
    termsVersion: "v1",
    status: "draft",
    statusSource: "staff_attested",
    completedAt: null,
    embeddedSigningUrl: null,
    signatureRequestId: null,
    ...partial,
  };
}

describe("isPaymentAuthSigned", () => {
  it("is true only when SignWell confirmed the signature", () => {
    assert.equal(
      isPaymentAuthSigned(rec({ status: "signed", statusSource: "provider_confirmed" })),
      true,
    );
  });

  it("rejects staff-attested 'signed' rows — those must not unlock charging", () => {
    assert.equal(
      isPaymentAuthSigned(rec({ status: "signed", statusSource: "staff_attested" })),
      false,
    );
  });

  it("rejects provider_confirmed drafts and missing records", () => {
    assert.equal(
      isPaymentAuthSigned(rec({ status: "draft", statusSource: "provider_confirmed" })),
      false,
    );
    assert.equal(isPaymentAuthSigned(null), false);
    assert.equal(isPaymentAuthSigned(undefined), false);
  });
});
