import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizePath } from "./bookmarks-path.ts";

describe("normalizePath", () => {
  it("treats a trailing slash as the same bookmark as the bare path", () => {
    assert.equal(normalizePath("/portal/permits/"), "/portal/permits");
    assert.equal(normalizePath("/portal/permits"), "/portal/permits");
  });

  it("strips query strings and hashes before comparing", () => {
    assert.equal(normalizePath("/portal/permits/?tab=docs"), "/portal/permits");
    assert.equal(normalizePath("/portal/permits#top"), "/portal/permits");
    assert.equal(normalizePath("/portal/permits/?q=1#x"), "/portal/permits");
  });

  it("keeps the site root as / and maps empty input to /", () => {
    assert.equal(normalizePath("/"), "/");
    assert.equal(normalizePath(""), "/");
  });
});
