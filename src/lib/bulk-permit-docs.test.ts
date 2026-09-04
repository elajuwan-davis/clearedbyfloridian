import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { labelFromFilename, uniqueDocKey } from "./bulk-permit-docs.ts";

describe("labelFromFilename", () => {
  it("strips a short extension and keeps the rest of the name", () => {
    assert.equal(labelFromFilename("Truss Packet - Rev 3.pdf"), "Truss Packet - Rev 3");
    assert.equal(labelFromFilename("NOC.PDF"), "NOC");
    assert.equal(labelFromFilename("plans.tar.gz"), "plans.tar");
  });

  it("keeps names that have no usable extension", () => {
    assert.equal(labelFromFilename("README"), "README");
    assert.equal(labelFromFilename(".env"), ".env");
  });
});

describe("uniqueDocKey", () => {
  it("slugifies the label and records the key as taken", () => {
    const taken = new Set<string>();
    assert.equal(uniqueDocKey("Truss Packet - Rev 3", taken), "truss_packet_rev_3");
    assert.ok(taken.has("truss_packet_rev_3"));
  });

  it("never overwrites an existing field — colliding labels get a suffix", () => {
    const taken = new Set(["stamped_plans", "truss_packet"]);
    assert.equal(uniqueDocKey("Stamped Plans", taken), "stamped_plans_2");
    assert.equal(uniqueDocKey("Truss Packet", taken), "truss_packet_2");
    assert.equal(uniqueDocKey("Truss Packet", taken), "truss_packet_3");
  });

  it("falls back to document when the label has no alphanumeric characters", () => {
    const taken = new Set<string>();
    assert.equal(uniqueDocKey("***", taken), "document");
    assert.equal(uniqueDocKey("???", taken), "document_2");
  });
});
