import test from "node:test";
import assert from "node:assert/strict";
import { canHoldAdminRole, resolveSignupRole } from "./signup-role";

test("staff-domain emails may hold admin; guest seats and everyone else may not", () => {
  assert.equal(canHoldAdminRole("staff@cleared.com"), true);
  assert.equal(canHoldAdminRole("ops@floridianinc.com"), true);
  assert.equal(canHoldAdminRole("  STAFF@CLEARED.COM  "), true);
  assert.equal(canHoldAdminRole("intake.guest@cleared.com"), false);
  assert.equal(canHoldAdminRole("guest@cleared.com"), false);
  assert.equal(canHoldAdminRole("guest.ops@floridianinc.com"), false);
  assert.equal(canHoldAdminRole("attacker@gmail.com"), false);
  assert.equal(canHoldAdminRole("owner@builder.com"), false);
  assert.equal(canHoldAdminRole(null), false);
  assert.equal(canHoldAdminRole(""), false);
});

test("public signUp cannot mint admin via metadata", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "attacker@gmail.com",
      metadataRole: "admin",
      creatingNewTenant: true,
    }),
    { role: "gc_owner", attachTenant: true },
  );
  assert.deepEqual(
    resolveSignupRole({
      email: "attacker@gmail.com",
      metadataRole: "admin",
      hasMetadataTenantId: true,
    }),
    { role: "gc_member", attachTenant: true },
  );
});

test("invite-link join is always a member, even if the client sends gc_owner or admin", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "hire@builder.com",
      metadataRole: "gc_owner",
      inviteConsumed: true,
      hasMetadataTenantId: true,
    }),
    { role: "gc_member", attachTenant: true },
  );
  assert.deepEqual(
    resolveSignupRole({
      email: "hire@builder.com",
      metadataRole: "admin",
      inviteConsumed: true,
    }),
    { role: "gc_member", attachTenant: true },
  );
});

test("allowed-domain auto-join is a member, not an owner", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "new@builder.com",
      metadataRole: "gc_owner",
      joinedByAllowedDomain: true,
    }),
    { role: "gc_member", attachTenant: true },
  );
});

test("self-serve / unmatched signup becomes gc_owner of a new trial tenant", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "owner@builder.com",
      creatingNewTenant: true,
    }),
    { role: "gc_owner", attachTenant: true },
  );
});

test("service-role owner provision on an empty tenant keeps gc_owner", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "owner@builder.com",
      metadataRole: "gc_owner",
      hasMetadataTenantId: true,
      tenantAlreadyHasMembers: false,
    }),
    { role: "gc_owner", attachTenant: true },
  );
});

test("metadata tenant_id on a populated tenant does not attach membership", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "attacker@gmail.com",
      metadataRole: "gc_owner",
      hasMetadataTenantId: true,
      tenantAlreadyHasMembers: true,
    }),
    { role: "gc_member", attachTenant: false },
  );
  assert.deepEqual(
    resolveSignupRole({
      email: "attacker@gmail.com",
      metadataRole: "gc_member",
      hasMetadataTenantId: true,
      tenantAlreadyHasMembers: true,
    }),
    { role: "gc_member", attachTenant: false },
  );
});

test("staff-domain signups still become admin; guest seats stay members", () => {
  assert.deepEqual(resolveSignupRole({ email: "staff@cleared.com", metadataRole: "gc_member" }), {
    role: "admin",
    attachTenant: true,
  });
  assert.deepEqual(resolveSignupRole({ email: "intake.guest@cleared.com", metadataRole: "admin" }), {
    role: "gc_member",
    attachTenant: true,
  });
});

test("subcontractor metadata still maps to the sub portal role", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "sub@trade.com",
      metadataRole: "subcontractor",
      creatingNewTenant: true,
    }),
    { role: "subcontractor", attachTenant: false },
  );
});

test("unknown metadata roles never become an enum-cast of attacker input", () => {
  assert.deepEqual(
    resolveSignupRole({
      email: "x@y.com",
      metadataRole: "superadmin",
      hasMetadataTenantId: true,
    }),
    { role: "gc_member", attachTenant: true },
  );
});
