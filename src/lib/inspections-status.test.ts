import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  currentInspectionStage,
  hasReport,
  isUpcoming,
  labelFor,
  labelForTime,
  type InspectionStatusInput,
} from "./inspections-status.ts";

const row = (partial: Partial<InspectionStatusInput>): InspectionStatusInput => ({
  inspection_type: "rough",
  ...partial,
});

describe("isUpcoming", () => {
  it("hides passed, failed, and cancelled inspections even if the date is in the future", () => {
    assert.equal(
      isUpcoming(row({ result: "passed", scheduled_date: "2099-01-01" }), "2026-09-02"),
      false,
    );
    assert.equal(
      isUpcoming(row({ result: "failed", scheduled_date: "2099-01-01" }), "2026-09-02"),
      false,
    );
    assert.equal(
      isUpcoming(row({ result: "cancelled", scheduled_date: "2099-01-01" }), "2026-09-02"),
      false,
    );
  });

  it("keeps pending and reinspect rows with no date, or a date on/after today", () => {
    assert.equal(isUpcoming(row({ result: "pending" }), "2026-09-02"), true);
    assert.equal(
      isUpcoming(row({ result: "reinspect", scheduled_date: "2026-09-02" }), "2026-09-02"),
      true,
    );
    assert.equal(
      isUpcoming(row({ result: "pending", requested_date: "2026-09-03" }), "2026-09-02"),
      true,
    );
  });

  it("prefers scheduled_date over requested_date, and drops past dates", () => {
    assert.equal(
      isUpcoming(
        row({ result: "pending", scheduled_date: "2026-09-01", requested_date: "2099-01-01" }),
        "2026-09-02",
      ),
      false,
    );
    assert.equal(
      isUpcoming(row({ result: "pending", requested_date: "2026-08-01" }), "2026-09-02"),
      false,
    );
  });
});

describe("hasReport", () => {
  it("is true only for outcomes that produce a viewable report", () => {
    assert.equal(hasReport(row({ result: "passed" })), true);
    assert.equal(hasReport(row({ result: "failed" })), true);
    assert.equal(hasReport(row({ result: "reinspect" })), true);
    assert.equal(hasReport(row({ result: "pending" })), false);
    assert.equal(hasReport(row({ result: "cancelled" })), false);
    assert.equal(hasReport(row({ result: null })), false);
  });
});

describe("currentInspectionStage", () => {
  it("returns null for an empty list", () => {
    assert.equal(currentInspectionStage([]), null);
  });

  it("says awaiting the first type until any inspection has passed", () => {
    assert.equal(
      currentInspectionStage([row({ inspection_type: "pool_shell", result: "pending" })]),
      "Awaiting Pool Shell",
    );
    assert.equal(
      currentInspectionStage([row({ inspection_type: "mystery_custom", result: "failed" })]),
      "Awaiting mystery_custom",
    );
  });

  it("reports the first passed type, even when later rows are pending", () => {
    assert.equal(
      currentInspectionStage([
        row({ inspection_type: "framing", result: "passed" }),
        row({ inspection_type: "final", result: "pending" }),
      ]),
      "Framing passed",
    );
  });
});

describe("labels", () => {
  it("maps known inspection and time codes, and falls back to the raw value", () => {
    assert.equal(labelFor("electrical_rough"), "Electrical Rough");
    assert.equal(labelFor("not-a-type"), "not-a-type");
    assert.equal(labelForTime("morning"), "Morning (8am–12pm)");
    assert.equal(labelForTime("19:00"), "19:00");
    assert.equal(labelForTime(null), "");
  });
});
