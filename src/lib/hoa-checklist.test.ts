import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checklistForType, isChecklistComplete } from "./hoa-checklist.ts";

describe("checklistForType", () => {
  it("requires survey, deposit, and COI for pool/spa and screen enclosure", () => {
    for (const type of ["pool_spa", "screen_enclosure"] as const) {
      const keys = checklistForType(type)
        .filter((i) => i.required)
        .map((i) => i.key);
      assert.deepEqual(keys, ["lot_survey_drawing", "deposit_500", "coi"]);
    }
  });

  it("requires fence-specific paperwork including the removal agreement", () => {
    const keys = checklistForType("fence")
      .filter((i) => i.required)
      .map((i) => i.key);
    assert.deepEqual(keys, [
      "lot_survey_drawing",
      "fence_description",
      "gate_locations",
      "removal_agreement",
      "coi",
    ]);
  });

  it("does not treat unknown/other types as required (they must not block submit)", () => {
    const other = checklistForType("other");
    const unset = checklistForType(null);
    assert.ok(other.every((i) => !i.required));
    assert.ok(unset.every((i) => !i.required));
    assert.ok(other.every((i) => i.checked === false));
  });
});

describe("isChecklistComplete", () => {
  it("is complete when there are no required items (empty, null, or other-type)", () => {
    assert.equal(isChecklistComplete(null), true);
    assert.equal(isChecklistComplete(undefined), true);
    assert.equal(isChecklistComplete([]), true);
    assert.equal(isChecklistComplete(checklistForType("other")), true);
  });

  it("blocks until every required row is checked, ignoring optional ones", () => {
    const list = [
      { key: "coi", label: "COI", required: true, checked: true },
      { key: "deposit_500", label: "Deposit", required: true, checked: false },
      { key: "extra", label: "Optional", required: false, checked: false },
    ];
    assert.equal(isChecklistComplete(list), false);
    list[1]!.checked = true;
    assert.equal(isChecklistComplete(list), true);
  });
});
