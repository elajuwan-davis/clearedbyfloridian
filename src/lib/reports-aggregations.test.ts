import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  avgTurnaroundByMunicipality,
  correctionRateByMunicipality,
  correctionRoundDistribution,
  csv,
  fmtMoney,
  gcAvgCycleTimeDays,
  gcCostSummaryFrom,
  matchGcProjects,
  monthKey,
  openVsClosedOverTime,
  permitFeesCentsFrom,
  permitVolumeByJurisdiction,
  permitVolumeByMonth,
  permitVolumeByTradeType,
  traditionalOverheadCents,
  TRADITIONAL_OVERHEAD_PER_PROJECT_CENTS,
  type ReportPermit,
} from "./reports-aggregations.ts";

function permit(partial: Partial<ReportPermit>): ReportPermit {
  return {
    id: "p1",
    project_name: "Job",
    municipality: null,
    county: null,
    city: null,
    permit_type: null,
    status: "submitted",
    submitted_date: null,
    issued_date: null,
    actual_fee_cents: null,
    estimated_fee_cents: null,
    cleared_fee_cents: 0,
    tenant_id: null,
    contractor_company: null,
    ...partial,
  };
}

describe("csv", () => {
  it("leaves simple cells unquoted", () => {
    assert.equal(csv(["id", "name"], [["1", "Pool"]]), "id,name\n1,Pool");
  });

  it("quotes commas, quotes, and newlines and doubles inner quotes", () => {
    assert.equal(csv(["a"], [['say "hi", then\nleave']]), 'a\n"say ""hi"", then\nleave"');
  });

  it("stringifies numbers without quotes", () => {
    assert.equal(csv(["n"], [[12]]), "n\n12");
  });
});

describe("fmtMoney", () => {
  it("formats cents as whole dollars with grouping", () => {
    assert.equal(fmtMoney(123_400), "$1,234");
    assert.equal(fmtMoney(0), "$0");
  });
});

describe("monthKey", () => {
  it("reads the calendar month from a date-only string", () => {
    assert.equal(monthKey("2026-01-15"), "Jan");
    assert.equal(monthKey("2026-12-01T18:00:00Z"), "Dec");
  });

  it("returns null for missing or unparseable dates", () => {
    assert.equal(monthKey(null), null);
    assert.equal(monthKey("not-a-date"), null);
  });
});

describe("permitVolumeByMonth", () => {
  it("groups by submitted month and sorts calendar order", () => {
    const rows = permitVolumeByMonth([
      permit({ id: "a", submitted_date: "2026-03-01" }),
      permit({ id: "b", submitted_date: "2026-01-10" }),
      permit({ id: "c", submitted_date: "2026-03-20" }),
      permit({ id: "d", submitted_date: null }),
    ]);
    assert.deepEqual(rows, [
      { key: "Jan", count: 1 },
      { key: "Mar", count: 2 },
    ]);
  });
});

describe("permitVolumeByJurisdiction", () => {
  it("prefers county, then municipality/city, and sorts by count desc", () => {
    const rows = permitVolumeByJurisdiction([
      permit({ id: "a", county: "Palm Beach", municipality: "Wellington" }),
      permit({ id: "b", county: "Palm Beach" }),
      permit({ id: "c", municipality: "Miami" }),
      permit({ id: "d" }),
    ]);
    assert.deepEqual(rows, [
      { key: "Palm Beach County", count: 2 },
      { key: "Miami", count: 1 },
      { key: "Unknown", count: 1 },
    ]);
  });
});

describe("permitVolumeByTradeType", () => {
  it("labels a missing type as Unspecified", () => {
    const rows = permitVolumeByTradeType([
      permit({ permit_type: "Pool" }),
      permit({ permit_type: null }),
    ]);
    assert.equal(rows.find((r) => r.key === "Unspecified")?.count, 1);
  });
});

describe("avgTurnaroundByMunicipality", () => {
  it("averages issued-minus-submitted days and skips inverted or partial dates", () => {
    const rows = avgTurnaroundByMunicipality([
      permit({
        id: "a",
        municipality: "Wellington",
        submitted_date: "2026-01-01",
        issued_date: "2026-01-11",
      }),
      permit({
        id: "b",
        municipality: "Wellington",
        submitted_date: "2026-01-01",
        issued_date: "2026-01-21",
      }),
      permit({
        id: "c",
        municipality: "Wellington",
        submitted_date: "2026-02-01",
        issued_date: "2026-01-01",
      }),
      permit({ id: "d", municipality: "Wellington", submitted_date: "2026-01-01" }),
    ]);
    assert.deepEqual(rows, [{ municipality: "Wellington", value: 15, count: 2 }]);
  });
});

describe("correctionRateByMunicipality", () => {
  it("counts correction-family statuses as a one-decimal percent", () => {
    const rows = correctionRateByMunicipality([
      permit({ id: "a", municipality: "Miami", status: "corrections_required" }),
      permit({ id: "b", municipality: "Miami", status: "resubmitted" }),
      permit({ id: "c", municipality: "Miami", status: "approved" }),
      permit({ id: "d", municipality: "Boca", status: "in_review" }),
    ]);
    assert.equal(rows[0].municipality, "Miami");
    assert.equal(rows[0].value, 66.7);
    assert.equal(rows[0].count, 3);
    assert.equal(rows[1].value, 0);
  });

  it("treats correction_response_under_review and resubmitted_to_county as hits", () => {
    const rows = correctionRoundDistribution([
      permit({ status: "correction_response_under_review" }),
      permit({ status: "resubmitted_to_county" }),
      permit({ status: "permit_issued" }),
    ]);
    assert.deepEqual(rows, [
      { key: "0 rounds", count: 1 },
      { key: "1+ rounds", count: 2 },
    ]);
  });
});

describe("openVsClosedOverTime", () => {
  it("accumulates open vs closed (approved / issued / cancelled) by submitted month", () => {
    const rows = openVsClosedOverTime([
      permit({ id: "a", submitted_date: "2026-01-05", status: "in_review" }),
      permit({ id: "b", submitted_date: "2026-01-20", status: "permit_issued" }),
      permit({ id: "c", submitted_date: "2026-02-01", status: "approved" }),
    ]);
    assert.deepEqual(rows, [
      { month: "Jan", open: 1, closed: 1 },
      { month: "Feb", open: 1, closed: 2 },
    ]);
  });
});

describe("matchGcProjects", () => {
  it("matches contractor company or project name, case-insensitive", () => {
    const all = [
      permit({ id: "a", contractor_company: "Hopeful Group", project_name: "Pool" }),
      permit({ id: "b", contractor_company: "Other", project_name: "Hopeful roof" }),
      permit({ id: "c", contractor_company: "Acme", project_name: "Deck" }),
    ];
    assert.deepEqual(
      matchGcProjects(all, "hopeful").map((p) => p.id),
      ["a", "b"],
    );
  });
});

describe("gcAvgCycleTimeDays", () => {
  it("returns 0 when nothing has both dates", () => {
    assert.equal(gcAvgCycleTimeDays([permit({})]), 0);
  });
});

describe("gcCostSummaryFrom", () => {
  it("prefers actual municipal fees, then estimated, then 0", () => {
    assert.equal(
      permitFeesCentsFrom([
        permit({ actual_fee_cents: 100, estimated_fee_cents: 999 }),
        permit({ actual_fee_cents: null, estimated_fee_cents: 50 }),
        permit({ actual_fee_cents: null, estimated_fee_cents: null }),
      ]),
      150,
    );
  });

  it("values DIY overhead at 9% of fees plus $1,800 per project", () => {
    assert.equal(traditionalOverheadCents(1_000_000, 2), 90_000 + 2 * TRADITIONAL_OVERHEAD_PER_PROJECT_CENTS);
  });

  it("never reports negative savings when Cleard fees exceed the DIY model", () => {
    const summary = gcCostSummaryFrom(
      [permit({ id: "a", actual_fee_cents: 100 })],
      10_000_000,
    );
    assert.equal(summary.savingsCents, 0);
    assert.equal(summary.permitFeesCents, 100);
    assert.equal(summary.clearedFeesCents, 10_000_000);
  });
});
