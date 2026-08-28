import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isInternalEmail,
  isStaff,
  ownerEmails,
  staffMaySeeVaultRow,
  type AuthIdentityClient,
  type RoleTableClient,
} from "./portal-logins-access.server.ts";

const ALLOWLISTED = "jose@floridianinc.com";

function rolesClient(roles: { role: string }[] | null): RoleTableClient {
  return {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: roles }),
      }),
    }),
  };
}

function throwingRolesClient(): RoleTableClient {
  return {
    from: () => {
      throw new Error("user_roles should not be queried for an allowlisted admin");
    },
  };
}

function authClient(
  emails: Record<string, string | null | undefined>,
  onGet?: () => void,
): AuthIdentityClient {
  return {
    auth: {
      admin: {
        getUserById: async (id: string) => {
          onGet?.();
          if (!(id in emails)) return { data: { user: null } };
          const email = emails[id];
          return { data: { user: email === undefined ? null : { email } } };
        },
        listUsers: async () => ({ data: { users: [] }, error: null }),
      },
    },
  };
}

describe("isInternalEmail", () => {
  it("accepts only Cleard domains, not lookalikes or missing @", () => {
    assert.equal(isInternalEmail("ops@cleared.com"), true);
    assert.equal(isInternalEmail(" Ops@Floridianinc.com "), true);
    assert.equal(isInternalEmail("gc@customer.com"), false);
    assert.equal(isInternalEmail("ops@notcleared.com"), false);
    assert.equal(isInternalEmail("cleared.com"), false);
    assert.equal(isInternalEmail("user@cleared.com.example"), false);
    assert.equal(isInternalEmail(null), false);
  });
});

describe("staffMaySeeVaultRow", () => {
  it("lets staff see their own row even when it is a customer login", () => {
    assert.equal(staffMaySeeVaultRow("gc-1", "gc-1", "owner@customer.com"), true);
  });

  it("lets staff see another row only when the owner is a Cleard account", () => {
    assert.equal(staffMaySeeVaultRow("staff-2", "staff-1", "ops@cleared.com"), true);
    assert.equal(staffMaySeeVaultRow("staff-2", "staff-1", "Eman@Floridianinc.com"), true);
    assert.equal(staffMaySeeVaultRow("gc-9", "staff-1", "owner@customer.com"), false);
    assert.equal(staffMaySeeVaultRow("gc-9", "staff-1", null), false);
    assert.equal(staffMaySeeVaultRow("gc-9", "staff-1", ""), false);
  });
});

describe("isStaff", () => {
  it("treats the email allowlist as staff without hitting the role table", async () => {
    assert.equal(await isStaff(throwingRolesClient(), "u1", { email: ALLOWLISTED }), true);
    assert.equal(
      await isStaff(throwingRolesClient(), "u1", { email: ALLOWLISTED.toUpperCase() }),
      true,
    );
  });

  it("falls back to the admin role row for everyone else", async () => {
    assert.equal(
      await isStaff(rolesClient([{ role: "admin" }]), "u2", { email: "ops@cleared.com" }),
      true,
    );
    assert.equal(
      await isStaff(rolesClient([{ role: "member" }]), "u2", { email: "ops@cleared.com" }),
      false,
    );
    assert.equal(await isStaff(rolesClient(null), "u2", null), false);
  });
});

describe("ownerEmails", () => {
  it("returns an empty map without calling auth when given no ids", async () => {
    let calls = 0;
    const map = await ownerEmails(
      authClient({}, () => calls++),
      [],
    );
    assert.equal(map.size, 0);
    assert.equal(calls, 0);
  });

  it("reads auth identity (not profiles.email) and dedupes ids", async () => {
    let calls = 0;
    const map = await ownerEmails(
      authClient(
        {
          a: "ops@cleared.com",
          b: null,
        },
        () => calls++,
      ),
      ["a", "b", "a", "missing"],
    );
    assert.equal(calls, 3);
    assert.equal(map.get("a"), "ops@cleared.com");
    assert.equal(map.get("b"), null);
    assert.equal(map.get("missing"), null);
  });
});
