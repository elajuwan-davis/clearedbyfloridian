import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { internalEmail } from "./is-internal-user.ts";

describe("internalEmail", () => {
  it("treats staff-domain accounts as internal", () => {
    assert.equal(internalEmail("ops@cleared.com"), true);
    assert.equal(internalEmail("staff@floridianinc.com"), true);
    assert.equal(internalEmail("  OPS@CLEARED.COM  "), true);
  });

  it("does not treat guest seats on staff domains as internal", () => {
    assert.equal(internalEmail("jane.guest@cleared.com"), false);
    assert.equal(internalEmail("guest@floridianinc.com"), false);
    assert.equal(internalEmail("guest.ops@cleared.com"), false);
  });

  it("rejects customers, empty, and malformed values", () => {
    assert.equal(internalEmail("gc@builder.com"), false);
    assert.equal(internalEmail("cleared.com"), false);
    assert.equal(internalEmail("@cleared.com"), false);
    assert.equal(internalEmail(""), false);
    assert.equal(internalEmail(null), false);
    assert.equal(internalEmail(undefined), false);
  });
});
