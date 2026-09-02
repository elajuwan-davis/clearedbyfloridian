import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CRM_NONE, CRM_OPTIONS, CRM_OTHER, isCrmAnswerComplete } from "./crm-options.ts";

describe("isCrmAnswerComplete", () => {
  it("rejects an empty selection", () => {
    assert.equal(isCrmAnswerComplete("", ""), false);
    assert.equal(isCrmAnswerComplete("", "JobTread"), false);
  });

  it("accepts a named option without an Other value", () => {
    assert.equal(isCrmAnswerComplete("JobTread", ""), true);
    assert.equal(isCrmAnswerComplete(CRM_NONE, "  "), true);
  });

  it("requires a non-blank Other value only for Other", () => {
    assert.equal(isCrmAnswerComplete(CRM_OTHER, ""), false);
    assert.equal(isCrmAnswerComplete(CRM_OTHER, "   "), false);
    assert.equal(isCrmAnswerComplete(CRM_OTHER, "Buildertrend-adjacent"), true);
  });

  it("keeps Other in the shared option list so capture paths cannot drift", () => {
    assert.ok(CRM_OPTIONS.includes(CRM_OTHER));
    assert.ok(CRM_OPTIONS.includes(CRM_NONE));
  });
});
