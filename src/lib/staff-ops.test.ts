import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterStaffAdmins, type StaffMember } from "./staff-ops.ts";

const member = (email: string, name = email, id = email): StaffMember => ({
  id,
  name,
  role: "",
  email,
});

describe("filterStaffAdmins", () => {
  it("drops @test.invalid and rows without a usable email", () => {
    const out = filterStaffAdmins([
      member("qa@test.invalid", "QA"),
      member("", "Blank"),
      member("not-an-email", "Bad"),
      member("real@cleared.com", "Real"),
    ]);
    assert.deepEqual(
      out.map((s) => s.email),
      ["real@cleared.com"],
    );
  });

  it("keeps the @cleared.com copy when the same local-part exists on both staff domains", () => {
    const out = filterStaffAdmins([
      member("alex@floridianinc.com", "Alex F"),
      member("alex@cleared.com", "Alex C"),
      member("sam@floridianinc.com", "Sam"),
    ]);
    const emails = out.map((s) => s.email).sort();
    assert.deepEqual(emails, ["alex@cleared.com", "sam@floridianinc.com"]);
  });

  it("sorts by name without inventing a job title", () => {
    const out = filterStaffAdmins([member("b@cleared.com", "Zed"), member("a@cleared.com", "Ann")]);
    assert.deepEqual(
      out.map((s) => s.name),
      ["Ann", "Zed"],
    );
    assert.equal(out[0].role, "");
  });
});
