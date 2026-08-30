import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assembleTenantPlanRows, listedTenantPlan } from "./tenant-plans.ts";

describe("listedTenantPlan", () => {
  it("only the exact token trial is trial — everything else fails open to full", () => {
    assert.equal(listedTenantPlan("trial"), "trial");
    assert.equal(listedTenantPlan("full"), "full");
    assert.equal(listedTenantPlan(null), "full");
    assert.equal(listedTenantPlan(undefined), "full");
    assert.equal(listedTenantPlan(""), "full");
    // Case-sensitive on purpose: the column is a lowercase enum. A surprising
    // value must not lock a paying contractor on the Plans tab.
    assert.equal(listedTenantPlan("Trial"), "full");
  });
});

describe("assembleTenantPlanRows", () => {
  it("counts members and attributes the first gc_owner as the contact", () => {
    const [row] = assembleTenantPlanRows(
      [{ id: "t1", name: "Acme", plan: "trial", status: "active", created_at: "2026-08-01" }],
      [
        { user_id: "u1", tenant_id: "t1", role: "gc_owner" },
        { user_id: "u2", tenant_id: "t1", role: "gc_member" },
      ],
      [
        { id: "u1", email: "owner@acme.com" },
        { id: "u2", email: "crew@acme.com" },
      ],
    );
    assert.equal(row.member_count, 2);
    assert.equal(row.owner_email, "owner@acme.com");
    assert.equal(row.plan, "trial");
  });

  it("keeps the first owner with an email; a later owner does not replace them", () => {
    const [row] = assembleTenantPlanRows(
      [{ id: "t1", name: "Acme", plan: "full", status: "active", created_at: "2026-08-01" }],
      [
        { user_id: "u1", tenant_id: "t1", role: "gc_owner" },
        { user_id: "u2", tenant_id: "t1", role: "gc_owner" },
      ],
      [
        { id: "u1", email: "first@acme.com" },
        { id: "u2", email: "second@acme.com" },
      ],
    );
    assert.equal(row.owner_email, "first@acme.com");
    assert.equal(row.member_count, 2);
  });

  it("fails open to full and uses em-dash placeholders when name/status/members are missing", () => {
    const [row] = assembleTenantPlanRows(
      [{ id: "t1", name: null, plan: null, status: null, created_at: "2026-08-01" }],
      [],
      [],
    );
    assert.equal(row.plan, "full");
    assert.equal(row.name, "—");
    assert.equal(row.status, "—");
    assert.equal(row.member_count, 0);
    assert.equal(row.owner_email, null);
  });
});
