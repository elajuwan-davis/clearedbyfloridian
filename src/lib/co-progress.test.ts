import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CO_ITEMS, coProgress } from "./co-progress.ts";

const nComplete = (n: number, total = CO_ITEMS.length) =>
  Array.from({ length: total }, (_, i) => ({ complete: i < n }));

describe("coProgress", () => {
  it("treats an empty list as the canonical checklist length, not issued", () => {
    const p = coProgress([]);
    assert.equal(p.total, CO_ITEMS.length);
    assert.equal(p.done, 0);
    assert.equal(p.percent, 0);
    assert.equal(p.issued, false);
  });

  it("marks issued only when every item is complete", () => {
    const almost = coProgress(nComplete(CO_ITEMS.length - 1));
    assert.equal(almost.done, CO_ITEMS.length - 1);
    assert.equal(almost.issued, false);
    assert.equal(almost.percent, Math.round(((CO_ITEMS.length - 1) / CO_ITEMS.length) * 100));

    const done = coProgress(nComplete(CO_ITEMS.length));
    assert.equal(done.done, CO_ITEMS.length);
    assert.equal(done.percent, 100);
    assert.equal(done.issued, true);
  });

  it("computes issued against the rows it was given, not a hidden extra step", () => {
    const p = coProgress([{ complete: true }, { complete: true }]);
    assert.equal(p.total, 2);
    assert.equal(p.done, 2);
    assert.equal(p.issued, true);
  });

  it("keeps the eleven statutory CO steps", () => {
    const keys = CO_ITEMS.map((i) => i.key);
    assert.equal(keys.length, 11);
    assert.ok(keys.includes("co_issued"));
    assert.ok(keys.includes("lien_releases_filed"));
    assert.equal(new Set(keys).size, keys.length);
  });
});
