import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { portalLoginUpsertRow } from "./portal-logins-save.ts";

const now = new Date("2026-08-27T08:00:00.000Z");
const encrypt = (s: string) => `enc:${s}`;

const credentials = {
  municipality_slug: "west-palm-beach",
  city_name: "West Palm Beach",
  username: "gc@example.com",
  password: "secret",
};

describe("portalLoginUpsertRow", () => {
  it("omits metadata the caller did not send so an upsert cannot wipe it", () => {
    const row = portalLoginUpsertRow("user-1", credentials, encrypt, now);
    assert.deepEqual(row, {
      user_id: "user-1",
      municipality_slug: "west-palm-beach",
      city_name: "West Palm Beach",
      username_ciphertext: "enc:gc@example.com",
      password_ciphertext: "enc:secret",
      updated_at: "2026-08-27T08:00:00.000Z",
    });
    assert.equal("portal_url" in row, false);
    assert.equal("registration" in row, false);
    assert.equal("e_plan" in row, false);
    assert.equal("derm" in row, false);
    assert.equal("tenant_id" in row, false);
    assert.equal("notes" in row, false);
  });

  it("writes explicit metadata, including nulls and false, when the caller sent them", () => {
    const row = portalLoginUpsertRow(
      "user-1",
      {
        ...credentials,
        notes: null,
        portal_url: "https://aca.example.gov",
        registration: "Local Municipal Registration",
        e_plan: true,
        derm: false,
        tenant_id: "00000000-0000-0000-0000-000000000001",
      },
      encrypt,
      now,
    );
    assert.equal(row.notes, null);
    assert.equal(row.portal_url, "https://aca.example.gov");
    assert.equal(row.registration, "Local Municipal Registration");
    assert.equal(row.e_plan, true);
    assert.equal(row.derm, false);
    assert.equal(row.tenant_id, "00000000-0000-0000-0000-000000000001");
  });
});
