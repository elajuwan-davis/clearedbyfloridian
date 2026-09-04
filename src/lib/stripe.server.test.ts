import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getStripeErrorMessage } from "./stripe.server.ts";

describe("getStripeErrorMessage", () => {
  it("prefers the raw Stripe message and appends type/code/param", () => {
    assert.equal(
      getStripeErrorMessage({
        message: "wrapper",
        raw: { message: "No such customer", type: "invalid_request_error", code: "resource_missing", param: "customer" },
      }),
      "No such customer (invalid_request_error, resource_missing, customer)",
    );
  });

  it("falls back to the top-level message when raw is absent", () => {
    assert.equal(getStripeErrorMessage({ message: "Card declined", code: "card_declined" }), "Card declined (card_declined)");
    assert.equal(getStripeErrorMessage({ message: "Just a message" }), "Just a message");
  });

  it("does not stringify unknown values as [object Object]", () => {
    assert.equal(getStripeErrorMessage({}), "Stripe request failed");
    assert.equal(getStripeErrorMessage(null), "Stripe request failed");
    assert.equal(getStripeErrorMessage("boom"), "Stripe request failed");
  });

  it("passes through a native Error message", () => {
    assert.equal(getStripeErrorMessage(new Error("network")), "network");
  });
});
