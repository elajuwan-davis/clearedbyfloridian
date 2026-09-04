import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PERMITS_ONLY_HOME,
  isPermitsOnlyEmail,
  isPermitsOnlyPathAllowed,
  isProtectedAppPath,
} from "./permits-only.ts";

describe("isPermitsOnlyEmail", () => {
  it("matches guest seats on both staff domains", () => {
    assert.equal(isPermitsOnlyEmail("jane.guest@cleared.com"), true);
    assert.equal(isPermitsOnlyEmail("ops.guest@floridianinc.com"), true);
    assert.equal(isPermitsOnlyEmail("guest@cleared.com"), true);
    assert.equal(isPermitsOnlyEmail("guest.ops@floridianinc.com"), true);
    assert.equal(isPermitsOnlyEmail("  GUEST@CLEARED.COM  "), true);
  });

  it("does not treat real staff or customers as guest seats", () => {
    assert.equal(isPermitsOnlyEmail("ops@cleared.com"), false);
    assert.equal(isPermitsOnlyEmail("staff@floridianinc.com"), false);
    assert.equal(isPermitsOnlyEmail("guest@example.com"), false);
    assert.equal(isPermitsOnlyEmail("jane.guest@contractor.com"), false);
    assert.equal(isPermitsOnlyEmail("guestclear@cleared.com"), false);
    assert.equal(isPermitsOnlyEmail(""), false);
    assert.equal(isPermitsOnlyEmail(null), false);
    assert.equal(isPermitsOnlyEmail(undefined), false);
  });
});

describe("isPermitsOnlyPathAllowed", () => {
  it("allows the Permits section and its sub-routes only", () => {
    assert.equal(isPermitsOnlyPathAllowed(PERMITS_ONLY_HOME), true);
    assert.equal(isPermitsOnlyPathAllowed("/portal/permits/new"), true);
    assert.equal(isPermitsOnlyPathAllowed("/portal/permits/abc-123"), true);
    assert.equal(isPermitsOnlyPathAllowed("/portal/documents"), false);
    assert.equal(isPermitsOnlyPathAllowed("/portal"), false);
    assert.equal(isPermitsOnlyPathAllowed("/building-dept-logins"), false);
    assert.equal(isPermitsOnlyPathAllowed("/admin"), false);
    assert.equal(isPermitsOnlyPathAllowed("/dashboard"), false);
  });
});

describe("isProtectedAppPath", () => {
  it("covers portal, admin, and vault routes a guest must not keep", () => {
    assert.equal(isProtectedAppPath("/portal/documents"), true);
    assert.equal(isProtectedAppPath("/admin/workload"), true);
    assert.equal(isProtectedAppPath("/building-dept-logins"), true);
    assert.equal(isProtectedAppPath("/login"), false);
    assert.equal(isProtectedAppPath("/"), false);
  });
});
