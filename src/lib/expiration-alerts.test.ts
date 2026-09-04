import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { alertCounts, computeAlertsFrom, type Alert } from "./expiration-alerts.ts";
import type { SubRecord } from "./subcontractor-library.ts";

const NOW = new Date("2026-08-28T12:00:00Z");

function sub(partial: Partial<SubRecord> & Pick<SubRecord, "id" | "companyName">): SubRecord {
  return { trade: "electrical", ...partial };
}

describe("computeAlertsFrom", () => {
  it("marks a COI expired the day after the stored date, not on it", () => {
    const [alert] = computeAlertsFrom(
      [sub({ id: "s1", companyName: "Acme Electric", coiExpiration: "2026-08-27" })],
      NOW,
    );
    assert.equal(alert.kind, "coi-expired");
    assert.equal(alert.severity, "red");
    assert.equal(alert.daysRemaining, -1);
    assert.equal(alert.label, "COI EXPIRED");
  });

  it("warns through the 60-day window, inclusive, and stays silent on day 61", () => {
    const inWindow = computeAlertsFrom(
      [sub({ id: "s1", companyName: "Acme", coiExpiration: "2026-10-27" })],
      NOW,
    );
    const outside = computeAlertsFrom(
      [sub({ id: "s1", companyName: "Acme", coiExpiration: "2026-10-28" })],
      NOW,
    );
    assert.equal(inWindow[0]?.kind, "coi-expiring");
    assert.equal(inWindow[0]?.daysRemaining, 60);
    assert.equal(inWindow[0]?.severity, "amber");
    assert.deepEqual(outside, []);
  });

  it("uses a singular label for a one-day COI warning", () => {
    const [alert] = computeAlertsFrom(
      [sub({ id: "s1", companyName: "Acme", coiExpiration: "2026-08-29" })],
      NOW,
    );
    assert.equal(alert.label, "COI expires in 1 day");
  });

  it("emits license alerts independently of COI, and skips missing or invalid dates", () => {
    const alerts = computeAlertsFrom(
      [
        sub({
          id: "s1",
          companyName: "Acme",
          licenseExpiration: "2026-08-01",
          coiExpiration: "not-a-date",
        }),
        sub({ id: "s2", companyName: "Blank", coiExpiration: null, licenseExpiration: null }),
      ],
      NOW,
    );
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].kind, "license-expired");
    assert.equal(alerts[0].label, "LICENSE EXPIRED");
  });

  it("sorts the most overdue alerts first", () => {
    const alerts = computeAlertsFrom(
      [
        sub({ id: "soon", companyName: "Soon", coiExpiration: "2026-09-10" }),
        sub({ id: "old", companyName: "Old", coiExpiration: "2026-01-01" }),
      ],
      NOW,
    );
    assert.deepEqual(
      alerts.map((a) => a.subId),
      ["old", "soon"],
    );
  });
});

describe("alertCounts", () => {
  it("tallies COI buckets; license-expired still counts toward total", () => {
    const alerts: Alert[] = [
      {
        id: "a",
        kind: "coi-expired",
        companyName: "A",
        subId: "a",
        daysRemaining: -3,
        label: "COI EXPIRED",
        severity: "red",
      },
      {
        id: "b",
        kind: "license-expired",
        companyName: "B",
        subId: "b",
        daysRemaining: -1,
        label: "LICENSE EXPIRED",
        severity: "red",
      },
      {
        id: "c",
        kind: "license-expiring",
        companyName: "C",
        subId: "c",
        daysRemaining: 4,
        label: "License expires in 4 days",
        severity: "amber",
      },
    ];
    assert.deepEqual(alertCounts(alerts), {
      total: 3,
      coiExpired: 1,
      coiExpiring: 0,
      licenseExpiring: 1,
    });
  });
});
