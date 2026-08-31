import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FLORIDIAN_TENANT_ID,
  NO_CLIENT_SENTINEL,
  permitListFilter,
  resolveActiveTenantId,
  shouldListNoPermits,
} from "./tenant-scope.ts";

const OTHER_TENANT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("resolveActiveTenantId", () => {
  it("pins the Flōridian tenant in client view, ignoring any admin filter", () => {
    assert.equal(resolveActiveTenantId("client", null), FLORIDIAN_TENANT_ID);
    assert.equal(resolveActiveTenantId("client", OTHER_TENANT), FLORIDIAN_TENANT_ID);
    assert.equal(resolveActiveTenantId("client", NO_CLIENT_SENTINEL), FLORIDIAN_TENANT_ID);
  });

  it("returns the empty-list sentinel in admin view until a client is picked", () => {
    assert.equal(resolveActiveTenantId("admin", null), NO_CLIENT_SENTINEL);
  });

  it("scopes admin view to the selected tenant", () => {
    assert.equal(resolveActiveTenantId("admin", OTHER_TENANT), OTHER_TENANT);
    assert.equal(resolveActiveTenantId("admin", FLORIDIAN_TENANT_ID), FLORIDIAN_TENANT_ID);
  });
});

describe("permitListFilter", () => {
  it("shows nothing for the admin no-client sentinel", () => {
    assert.equal(permitListFilter(NO_CLIENT_SENTINEL), "none");
    assert.equal(shouldListNoPermits(NO_CLIENT_SENTINEL), true);
  });

  it("does not treat null, undefined, or empty string as the sentinel", () => {
    assert.equal(permitListFilter(null), "all");
    assert.equal(permitListFilter(undefined), "all");
    assert.equal(permitListFilter(""), "all");
    assert.equal(shouldListNoPermits(null), false);
    assert.equal(shouldListNoPermits(undefined), false);
    assert.equal(shouldListNoPermits(""), false);
  });

  it("filters to a real tenant id", () => {
    assert.deepEqual(permitListFilter(OTHER_TENANT), { tenantId: OTHER_TENANT });
    assert.deepEqual(permitListFilter(FLORIDIAN_TENANT_ID), { tenantId: FLORIDIAN_TENANT_ID });
    assert.equal(shouldListNoPermits(OTHER_TENANT), false);
  });
});
