import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CHECKLIST, getChecklist } from "./permit-checklists.ts";

describe("getChecklist", () => {
  it("falls back to the default (no NOC at intake) when municipality or type is missing", () => {
    assert.equal(getChecklist(null, "Swimming Pool"), DEFAULT_CHECKLIST);
    assert.equal(getChecklist("Wellington", null), DEFAULT_CHECKLIST);
    assert.equal(getChecklist("", "Swimming Pool"), DEFAULT_CHECKLIST);
    assert.ok(!DEFAULT_CHECKLIST.some((d) => d.key === "notice_of_commencement" && d.required));
  });

  it("matches Wellington pool types case-insensitively, including Village of Wellington", () => {
    const wellington = getChecklist("Wellington", "Swimming Pool");
    const village = getChecklist("  Village of Wellington  ", "POOL + SPA");
    const renovation = getChecklist("wellington", "pool renovation");
    assert.notEqual(wellington, DEFAULT_CHECKLIST);
    assert.equal(wellington, village);
    assert.equal(wellington, renovation);
    assert.ok(wellington.some((d) => d.key === "swimming_pool_worksheet" && d.required));
    assert.ok(wellington.some((d) => d.key === "electrical_load_calculations" && d.required));
  });

  it("does not apply the Wellington pool list to another city or an unmatched type", () => {
    assert.equal(getChecklist("West Palm Beach", "Swimming Pool"), DEFAULT_CHECKLIST);
    assert.equal(getChecklist("Wellington", "Roofing"), DEFAULT_CHECKLIST);
  });
});
