import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isMissingBackendEnvError } from "./env-error.ts";

describe("isMissingBackendEnvError", () => {
  it("matches the generated-client missing-env message on a string, Error, or { message }", () => {
    const msg = "Missing Supabase environment variable(s): SUPABASE_URL. Connect Supabase in Lovable Cloud.";
    assert.equal(isMissingBackendEnvError(msg), true);
    assert.equal(isMissingBackendEnvError(new Error(msg)), true);
    assert.equal(isMissingBackendEnvError({ message: msg }), true);
  });

  it("does not swallow RLS denials, query failures, or HTTP errors", () => {
    assert.equal(isMissingBackendEnvError("new row violates row-level security policy"), false);
    assert.equal(isMissingBackendEnvError(new Error("permission denied for table tenants")), false);
    assert.equal(isMissingBackendEnvError({ message: "HTTP 403 Forbidden" }), false);
    assert.equal(isMissingBackendEnvError({ message: "column tenants.plan does not exist" }), false);
    assert.equal(isMissingBackendEnvError("Failed to fetch"), false);
  });

  it("is false for empty, non-message, and unrelated values", () => {
    assert.equal(isMissingBackendEnvError(""), false);
    assert.equal(isMissingBackendEnvError(null), false);
    assert.equal(isMissingBackendEnvError(undefined), false);
    assert.equal(isMissingBackendEnvError(42), false);
    assert.equal(isMissingBackendEnvError({}), false);
  });
});
