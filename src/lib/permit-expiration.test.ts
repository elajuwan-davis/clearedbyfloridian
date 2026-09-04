import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PERMIT_LIFETIME_DAYS,
  computeExpirationDate,
  daysUntilExpiration,
  expirationState,
} from "./permit-expiration.ts";

describe("computeExpirationDate", () => {
  it("adds 180 days and returns a yyyy-mm-dd string", () => {
    assert.equal(PERMIT_LIFETIME_DAYS, 180);
    assert.equal(computeExpirationDate("2026-01-01"), "2026-06-30");
    assert.equal(computeExpirationDate(null), null);
    assert.equal(computeExpirationDate("not-a-date"), null);
  });
});

describe("daysUntilExpiration / expirationState", () => {
  const now = new Date("2026-08-27T12:00:00");

  it("counts whole days from the injected 'today' and maps the warning window", () => {
    assert.equal(daysUntilExpiration("2026-08-20", now), -7);
    assert.equal(daysUntilExpiration("2026-09-10", now), 14);
    assert.equal(daysUntilExpiration("2026-09-26", now), 30);
    assert.equal(daysUntilExpiration("2026-09-27", now), 31);
  });

  it("classifies far-past dates as expired and far-future dates as safe", () => {
    assert.equal(expirationState("2020-01-01"), "expired");
    assert.equal(expirationState("2099-01-01"), "safe");
  });

  it("returns unknown for missing or invalid dates", () => {
    assert.equal(expirationState(null), "unknown");
    assert.equal(expirationState("nope"), "unknown");
    assert.equal(daysUntilExpiration(null, now), null);
  });
});
