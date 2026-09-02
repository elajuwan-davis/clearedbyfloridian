import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FEATURE_COPY,
  TRIAL_PATHS,
  normalizePlan,
  planIncludes,
  trialPathAllowed,
  type GatedFeature,
} from "./plan-gating.ts";

const GATED = Object.keys(FEATURE_COPY) as GatedFeature[];

describe("normalizePlan", () => {
  it("only the trial token (any case) is trial — everything else fails open to full", () => {
    assert.equal(normalizePlan("trial"), "trial");
    assert.equal(normalizePlan("Trial"), "trial");
    assert.equal(normalizePlan("TRIAL"), "trial");
    assert.equal(normalizePlan("full"), "full");
    assert.equal(normalizePlan("FULL"), "full");
    assert.equal(normalizePlan(null), "full");
    assert.equal(normalizePlan(undefined), "full");
    assert.equal(normalizePlan(""), "full");
    assert.equal(normalizePlan("paid"), "full");
    assert.equal(normalizePlan({ plan: "trial" }), "full");
  });
});

describe("planIncludes", () => {
  it("locks every gated feature on the trial tier", () => {
    assert.ok(GATED.length >= 4, "expected the four paid features");
    for (const feature of GATED) {
      assert.equal(planIncludes("trial", feature), false, feature);
    }
  });

  it("fails open: full, null, and any non-trial plan unlock every feature", () => {
    for (const feature of GATED) {
      assert.equal(planIncludes("full", feature), true, feature);
      assert.equal(planIncludes(null, feature), true, `null ${feature}`);
    }
  });
});

describe("trialPathAllowed", () => {
  it("lets a trial account reach its own permits, logins, messages, and account", () => {
    for (const path of [
      "/dashboard",
      "/portal",
      "/portal/permits",
      "/portal/permits/new",
      "/portal/permits/abc-123",
      "/building-dept-logins",
      "/building-dept-logins/submit",
      "/messages",
      "/profile",
      "/portal/company",
      "/onboarding",
      "/forms/permit-agent-authorization",
      "/sign",
      "/sign/token",
    ]) {
      assert.equal(trialPathAllowed(path), true, path);
    }
  });

  it("strips trailing slashes so /portal/permits/ still matches", () => {
    assert.equal(trialPathAllowed("/portal/permits/"), true);
    assert.equal(trialPathAllowed("/portal/"), true);
  });

  it("does not treat /portal as a prefix — that would unlock every paid /portal/* route", () => {
    for (const path of [
      "/portal/subcontractors",
      "/portal/subcontractors/new",
      "/portal/request-coi",
      "/portal/lien-rights",
      "/portal/lien-rights/documents",
      "/portal/inspections",
      "/portal/contacts",
      "/portal/documents",
      "/portal/financials",
      "/portal/billing",
      "/portal/calendar",
      "/portal/blog",
      "/portal/bookmarks",
    ]) {
      assert.equal(trialPathAllowed(path), false, path);
    }
  });

  it("does not unlock neighbouring prefixes or staff-only areas", () => {
    for (const path of [
      "/",
      "/admin",
      "/admin/invites",
      "/legal",
      "/fee-calculator",
      "/forms/payment-authorization",
      "/portalpermits",
      "/portal-permits",
    ]) {
      assert.equal(trialPathAllowed(path), false, path);
    }
  });

  it("keeps the allow-list and FEATURE_COPY in agreement with the known gated set", () => {
    assert.deepEqual(GATED.sort(), [
      "coi_requests",
      "license_verification",
      "lien_rights",
      "sub_invites",
    ]);
    assert.ok(TRIAL_PATHS.includes("/portal/permits"));
    assert.ok(TRIAL_PATHS.includes("/portal"));
    assert.equal(
      FEATURE_COPY.sub_invites.area,
      "Subcontractor Management",
    );
    assert.equal(FEATURE_COPY.lien_rights.area, "Compliance & Documents");
    assert.equal(FEATURE_COPY.coi_requests.area, "Compliance & Documents");
    assert.equal(FEATURE_COPY.license_verification.area, "Compliance & Documents");
  });
});
