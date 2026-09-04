import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emailDomain,
  isPublicEmailDomain,
  normalizeAllowedDomain,
  resolveAllowedDomain,
} from "./allowed-domain.ts";

describe("emailDomain", () => {
  it("reads the domain off a normal address", () => {
    assert.equal(emailDomain("Bob.Smith@Acme.com"), "acme.com");
  });
  it("returns null when there is no usable domain", () => {
    assert.equal(emailDomain(null), null);
    assert.equal(emailDomain(""), null);
    assert.equal(emailDomain("nodomain"), null);
    assert.equal(emailDomain("@orphan.com"), null);
  });
});

describe("normalizeAllowedDomain", () => {
  it("trims, lowercases, and strips a leading @", () => {
    assert.equal(normalizeAllowedDomain(" @Acme.COM "), "acme.com");
  });
  it("treats blank as clear", () => {
    assert.equal(normalizeAllowedDomain("   "), null);
    assert.equal(normalizeAllowedDomain(null), null);
  });
});

describe("resolveAllowedDomain", () => {
  it("allows a company domain that matches the owner's auth email", () => {
    assert.equal(resolveAllowedDomain("acme.com", "bob@acme.com"), "acme.com");
    assert.equal(resolveAllowedDomain("@Acme.com", "BOB@ACME.COM"), "acme.com");
  });

  it("clears when the field is empty", () => {
    assert.equal(resolveAllowedDomain("", "bob@acme.com"), null);
    assert.equal(resolveAllowedDomain(null, "bob@acme.com"), null);
  });

  it("rejects consumer providers even when they match the owner", () => {
    assert.throws(
      () => resolveAllowedDomain("gmail.com", "attacker@gmail.com"),
      /Public email providers/,
    );
    assert.throws(
      () => resolveAllowedDomain("outlook.com", "a@outlook.com"),
      /Public email providers/,
    );
    assert.ok(isPublicEmailDomain("yahoo.com"));
  });

  it("rejects a domain the owner does not actually use", () => {
    assert.throws(
      () => resolveAllowedDomain("competitor.com", "bob@acme.com"),
      /your own email address/,
    );
    assert.throws(
      () => resolveAllowedDomain("acme.com", "bob@gmail.com"),
      /your own email address/,
    );
  });

  it("rejects junk hostnames", () => {
    assert.throws(() => resolveAllowedDomain("not a domain", "a@acme.com"), /valid company domain/);
    assert.throws(() => resolveAllowedDomain("acme", "a@acme.com"), /valid company domain/);
  });
});
