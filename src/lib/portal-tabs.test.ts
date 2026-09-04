import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupForPath, isTabActive, tabGroups } from "./portal-tabs.ts";

describe("groupForPath", () => {
  it("places Portal Logins on the Permits section (first equal-length match)", () => {
    const group = groupForPath("/building-dept-logins");
    assert.equal(group?.key, "permits");
    assert.ok(group?.tabs.some((t) => t.to === "/building-dept-logins"));
  });

  it("still lists Portal Logins under Documents as well", () => {
    const documents = tabGroups.find((g) => g.key === "documents");
    assert.ok(documents?.tabs.some((t) => t.to === "/building-dept-logins"));
  });

  it("picks the longest matching tab path", () => {
    assert.equal(groupForPath("/portal/lien-rights/deadlines")?.key, "lien-rights");
    assert.equal(groupForPath("/portal/permits/new")?.key, "permits");
  });
});

describe("isTabActive", () => {
  it("requires query matches when a tab is a filtered view of a shared path", () => {
    const inspectors = tabGroups
      .find((g) => g.key === "contacts")
      ?.tabs.find((t) => t.label === "Inspectors");
    assert.ok(inspectors);
    assert.equal(isTabActive("/portal/contacts", { type: "inspector" }, inspectors), true);
    assert.equal(isTabActive("/portal/contacts", { type: "municipality" }, inspectors), false);
    assert.equal(isTabActive("/portal/permits", {}, { label: "My Permits", to: "/portal/permits" }), true);
  });
});
