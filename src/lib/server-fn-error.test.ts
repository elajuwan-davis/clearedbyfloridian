import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { friendlyServerError } from "./server-fn-error.ts";

describe("friendlyServerError", () => {
  it("replaces serialized Zod payloads with the fallback sentence", () => {
    const zod = JSON.stringify([{ code: "too_small", path: ["municipalitySlug"], message: "Required" }]);
    assert.equal(friendlyServerError(new Error(zod), "Could not save the login."), "Could not save the login.");
    assert.equal(friendlyServerError(JSON.stringify({ issues: [] }), "Could not save."), "Could not save.");
  });

  it("keeps a human error message, including one that merely starts with a bracket", () => {
    assert.equal(friendlyServerError(new Error("Forbidden"), "Could not save."), "Forbidden");
    assert.equal(friendlyServerError("[object Object] is not helpful", "fallback"), "[object Object] is not helpful");
  });

  it("uses the fallback when the value is empty or not an error", () => {
    assert.equal(friendlyServerError(new Error("  "), "Could not save."), "Could not save.");
    assert.equal(friendlyServerError(null, "Could not save."), "Could not save.");
    assert.equal(friendlyServerError({ message: "nope" }, "Could not save."), "Could not save.");
  });
});
