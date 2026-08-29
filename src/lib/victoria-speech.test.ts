import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRecognitionCtor, isSkip, tidyEmail, tidyPhone } from "./victoria-speech.ts";

describe("tidyEmail", () => {
  it("turns spoken 'at' / 'dot' / 'period' into an address", () => {
    assert.equal(tidyEmail("Jane at Cleard dot com"), "jane@cleard.com");
    assert.equal(tidyEmail("jane AT cleard PERIOD com"), "jane@cleard.com");
  });

  it("keeps underscore and dash tokens, then strips leftover spaces", () => {
    assert.equal(tidyEmail("jane underscore a at cleard dash inc dot com"), "jane_a@cleard-inc.com");
    assert.equal(tidyEmail("jane hyphen a at cleard.com"), "jane-a@cleard.com");
  });

  it("leaves an already-typed address alone aside from case and spaces", () => {
    assert.equal(tidyEmail("  gc@Example.com  "), "gc@example.com");
  });
});

describe("tidyPhone", () => {
  it("keeps digits and a leading plus, dropping the rest", () => {
    assert.equal(tidyPhone("+1 (305) 555-0199"), "+13055550199");
    assert.equal(tidyPhone("305.555.0199 ext"), "3055550199");
    assert.equal(tidyPhone(""), "");
  });
});

describe("isSkip", () => {
  it("treats skip / next / pass / leave-blank as 'leave this field'", () => {
    for (const spoken of [
      "skip",
      "SKIP.",
      "next",
      "pass",
      "skip it",
      "leave it",
      "leave blank",
      "none",
    ]) {
      assert.equal(isSkip(spoken), true, spoken);
    }
  });

  it("does not swallow a real value that happens to contain those words", () => {
    for (const spoken of ["Tennessee", "password", "skip this one please", "none of the above", "next week"]) {
      assert.equal(isSkip(spoken), false, spoken);
    }
  });
});

describe("getRecognitionCtor", () => {
  it("returns null outside a browser so callers can hide the mic", () => {
    assert.equal(getRecognitionCtor(), null);
  });
});
