import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sectionsForRole, settingsForRole } from "./portal-nav.ts";
import { homePathForRole } from "./use-session.ts";

describe("sectionsForRole", () => {
  it("isolates subcontractors to the sub portal nav even if isAdmin is true", () => {
    const keys = sectionsForRole("subcontractor", true).map((s) => s.key);
    assert.ok(keys.includes("sub-projects"));
    assert.equal(keys.includes("admin"), false);
    assert.equal(keys.includes("permits"), false);
    assert.equal(keys.includes("financials"), false);
  });

  it("adds the admin section only for staff admins", () => {
    assert.equal(
      sectionsForRole("gc_owner", false).some((s) => s.key === "admin"),
      false,
    );
    assert.equal(
      sectionsForRole("admin", true).some((s) => s.key === "admin"),
      true,
    );
  });
});

describe("settingsForRole", () => {
  it("does not offer company profile to subcontractors", () => {
    const subTargets = (settingsForRole("subcontractor").items ?? []).map((i) => i.to);
    const gcTargets = (settingsForRole("gc_owner").items ?? []).map((i) => i.to);
    assert.equal(subTargets.includes("/portal/company"), false);
    assert.ok(gcTargets.includes("/portal/company"));
  });
});

describe("homePathForRole", () => {
  it("sends subcontractors to the sub portal, not the GC dashboard", () => {
    assert.equal(homePathForRole("subcontractor"), "/sub-portal");
    assert.equal(homePathForRole("admin"), "/dashboard");
    assert.equal(homePathForRole("gc_owner"), "/dashboard");
    assert.equal(homePathForRole("gc_member"), "/dashboard");
  });
});
