import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decidePortalAccess,
  escapeLikeExact,
  isInternalPortalEmail,
  looksLikeUnapprovedSelfServe,
  pickGrantedRole,
} from "./google-access.ts";

describe("isInternalPortalEmail", () => {
  it("accepts Cleard staff domains", () => {
    assert.equal(isInternalPortalEmail("ops@cleared.com"), true);
    assert.equal(isInternalPortalEmail("Ops@Cleared.com"), true);
    assert.equal(isInternalPortalEmail("staff@floridianinc.com"), true);
    assert.equal(isInternalPortalEmail("veronica.guest@cleared.com"), true);
  });

  it("rejects customer and lookalike domains", () => {
    assert.equal(isInternalPortalEmail("owner@builder.com"), false);
    assert.equal(isInternalPortalEmail("user@notcleared.com"), false);
    assert.equal(isInternalPortalEmail("user@cleared.com.attacker.test"), false);
    assert.equal(isInternalPortalEmail(""), false);
    assert.equal(isInternalPortalEmail(null), false);
  });
});

describe("escapeLikeExact", () => {
  it("escapes ILIKE wildcards so underscore emails cannot match a neighbor", () => {
    assert.equal(escapeLikeExact("john_doe@acme.com"), "john\\_doe@acme.com");
    assert.equal(escapeLikeExact("100%@firm.com"), "100\\%@firm.com");
    assert.equal(escapeLikeExact("a\\b@x.com"), "a\\\\b@x.com");
  });
});

describe("pickGrantedRole", () => {
  it("prefers admin, then owner, then subcontractor", () => {
    assert.equal(pickGrantedRole(["gc_member", "admin"]), "admin");
    assert.equal(pickGrantedRole(["gc_member", "gc_owner"]), "gc_owner");
    assert.equal(pickGrantedRole(["subcontractor"]), "subcontractor");
    assert.equal(pickGrantedRole(["gc_member"]), "gc_member");
    assert.equal(pickGrantedRole([]), null);
  });
});

describe("looksLikeUnapprovedSelfServe", () => {
  const now = "2026-08-28T08:00:00.000Z";
  const sameSecond = "2026-08-28T08:00:00.400Z";
  const yesterday = "2026-08-27T08:00:00.000Z";

  it("flags a solo tenant created in the same breath as the user", () => {
    assert.equal(
      looksLikeUnapprovedSelfServe({
        isInternal: false,
        hasApprovedRequest: false,
        hasInviteMetadata: false,
        tenantMemberCount: 1,
        userCreatedAt: now,
        tenantCreatedAt: sameSecond,
      }),
      true,
    );
  });

  it("does not flag invite, staff, approved, multi-member, or older tenants", () => {
    const base = {
      isInternal: false,
      hasApprovedRequest: false,
      hasInviteMetadata: false,
      tenantMemberCount: 1,
      userCreatedAt: now,
      tenantCreatedAt: sameSecond,
    };
    assert.equal(looksLikeUnapprovedSelfServe({ ...base, isInternal: true }), false);
    assert.equal(looksLikeUnapprovedSelfServe({ ...base, hasApprovedRequest: true }), false);
    assert.equal(looksLikeUnapprovedSelfServe({ ...base, hasInviteMetadata: true }), false);
    assert.equal(looksLikeUnapprovedSelfServe({ ...base, tenantMemberCount: 2 }), false);
    assert.equal(looksLikeUnapprovedSelfServe({ ...base, tenantCreatedAt: yesterday }), false);
  });
});

describe("decidePortalAccess", () => {
  it("lets staff-domain emails in even without a pre-existing role", () => {
    const d = decidePortalAccess({
      email: "ops@cleared.com",
      roles: [],
      hasTenantMembership: false,
      requests: [],
      selfServeSoloTenant: false,
    });
    assert.equal(d.allowed, true);
    assert.equal(d.role, "admin");
  });

  it("lets an invited GC in via an existing role", () => {
    const d = decidePortalAccess({
      email: "gc@builder.com",
      roles: ["gc_owner"],
      hasTenantMembership: true,
      requests: [],
      selfServeSoloTenant: false,
    });
    assert.equal(d.allowed, true);
    assert.equal(d.reason, "approved");
    assert.equal(d.role, "gc_owner");
  });

  it("denies a Google self-serve signup even when handle_new_user already granted a role", () => {
    const d = decidePortalAccess({
      email: "stranger@gmail.com",
      roles: ["gc_owner"],
      hasTenantMembership: true,
      requests: [],
      selfServeSoloTenant: true,
    });
    assert.equal(d.allowed, false);
    assert.equal(d.reason, "filed");
    assert.equal(d.role, null);
  });

  it("still honours an approved access request over a junk solo tenant", () => {
    const d = decidePortalAccess({
      email: "approved@builder.com",
      roles: ["gc_owner"],
      hasTenantMembership: true,
      requests: [{ status: "approved", approved_tenant_id: "tenant-1" }],
      selfServeSoloTenant: true,
    });
    assert.equal(d.allowed, true);
    assert.equal(d.reason, "approved");
  });

  it("returns pending when a request is already in the queue", () => {
    const d = decidePortalAccess({
      email: "waiting@builder.com",
      roles: [],
      hasTenantMembership: false,
      requests: [{ status: "pending" }],
      selfServeSoloTenant: false,
    });
    assert.equal(d.allowed, false);
    assert.equal(d.reason, "pending");
  });

  it("files an unknown Google user with no role and no request", () => {
    const d = decidePortalAccess({
      email: "new@gmail.com",
      roles: [],
      hasTenantMembership: false,
      requests: [],
      selfServeSoloTenant: false,
    });
    assert.equal(d.allowed, false);
    assert.equal(d.reason, "filed");
  });
});
