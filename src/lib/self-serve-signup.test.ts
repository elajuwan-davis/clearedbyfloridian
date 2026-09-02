import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isEmailTaken } from "./self-serve-signup.functions.ts";

describe("isEmailTaken", () => {
  it("recognises the shapes Supabase uses for a duplicate address", () => {
    for (const message of [
      "User already registered",
      "A user with this email address has already been registered",
      "duplicate key value violates unique constraint",
      "email_exists",
      "Account already exists",
    ]) {
      assert.equal(isEmailTaken(message), true, message);
    }
  });

  it("does not treat an unrelated auth error as a taken email", () => {
    for (const message of [
      "Password should be at least 8 characters",
      "Unable to validate email address: invalid format",
      "Database error creating new user",
      "",
    ]) {
      assert.equal(isEmailTaken(message), false, message);
    }
  });
});
