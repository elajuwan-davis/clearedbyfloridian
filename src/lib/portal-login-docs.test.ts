import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDocExpired } from "./portal-login-docs.ts";

const noonEt = (isoDate: string) => new Date(`${isoDate}T12:00:00`);

describe("isDocExpired", () => {
  it("is not expired on the expiration date itself", () => {
    assert.equal(isDocExpired("2026-08-27", noonEt("2026-08-27")), false);
  });

  it("is expired the calendar day after", () => {
    assert.equal(isDocExpired("2026-08-26", noonEt("2026-08-27")), true);
  });

  it("treats missing or unparseable dates as not expired", () => {
    assert.equal(isDocExpired(null, noonEt("2026-08-27")), false);
    assert.equal(isDocExpired(undefined, noonEt("2026-08-27")), false);
    assert.equal(isDocExpired("", noonEt("2026-08-27")), false);
    assert.equal(isDocExpired("soon", noonEt("2026-08-27")), false);
  });
});
