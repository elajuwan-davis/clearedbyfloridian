import { describe, it } from "node:test";
import assert from "node:assert";
import {
  FLORIDIAN_TENANT_ID,
  NO_CLIENT_SELECTED,
  resolveActiveTenantId,
} from "./view-mode.ts";

const FLORIDIAN = "3e137bde-7c3b-46b6-bcf9-57b703fd5592";
const OTHER_TENANT = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("resolveActiveTenantId", () => {
  it("does not apply the empty sentinel to a regular GC (default admin viewMode)", () => {
    assert.strictEqual(
      resolveActiveTenantId({
        viewMode: "admin",
        selectedTenantId: null,
        isAdmin: false,
      }),
      null,
    );
  });

  it("ignores leftover client viewMode and a selected tenant for non-admins", () => {
    assert.strictEqual(
      resolveActiveTenantId({
        viewMode: "client",
        selectedTenantId: OTHER_TENANT,
        isAdmin: false,
      }),
      null,
    );
  });

  it("hides all permits when staff have not picked a client", () => {
    assert.strictEqual(
      resolveActiveTenantId({
        viewMode: "admin",
        selectedTenantId: null,
        isAdmin: true,
      }),
      NO_CLIENT_SELECTED,
    );
  });

  it("scopes staff admin view to the picked client", () => {
    assert.strictEqual(
      resolveActiveTenantId({
        viewMode: "admin",
        selectedTenantId: OTHER_TENANT,
        isAdmin: true,
      }),
      OTHER_TENANT,
    );
  });

  it("scopes staff client view to the Floridian tenant", () => {
    assert.strictEqual(
      resolveActiveTenantId({
        viewMode: "client",
        selectedTenantId: OTHER_TENANT,
        isAdmin: true,
      }),
      FLORIDIAN_TENANT_ID,
    );
    assert.strictEqual(FLORIDIAN_TENANT_ID, FLORIDIAN);
  });
});
