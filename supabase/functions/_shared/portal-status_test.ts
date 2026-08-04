import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { extractStatus, looksLikeCorrection, mapPortalStatus } from "./portal-status.ts";

const RECORD_PAGE = `City of Plantation — Citizen Access
Record 26BLD-004512:
Commercial Interior Buildout
Record Status: Plan Review
Date Submitted: 08/03/2026
Address: 1200 NW 82nd Ave
`;

Deno.test("extractStatus reads the status off a record page", () => {
  assertEquals(extractStatus(RECORD_PAGE), "Plan Review");
});

Deno.test("extractStatus handles the sentence form", () => {
  assertEquals(
    extractStatus("The status of this record is Corrections Required.\nNext step: resubmit."),
    "Corrections Required",
  );
});

Deno.test("extractStatus returns null when the page has no status", () => {
  assertEquals(extractStatus("No records found matching your search."), null);
});

Deno.test("extractStatus does not swallow the next line", () => {
  assertEquals(extractStatus("Record Status:\nIssued\nFee: $0.00"), null);
});

Deno.test("looksLikeCorrection spots review comments", () => {
  assertEquals(looksLikeCorrection("Plan Review Comments (2) — download letter"), true);
  assertEquals(looksLikeCorrection("Resubmittal required before issuance"), true);
  assertEquals(looksLikeCorrection("Record Status: Plan Review\nFees paid"), false);
});

Deno.test("mapPortalStatus maps the statuses Plantation actually uses", () => {
  assertEquals(mapPortalStatus("Plan Review"), "in_review");
  assertEquals(mapPortalStatus("Corrections Required"), "corrections_required");
  assertEquals(mapPortalStatus("Ready to Issue"), "approved");
  assertEquals(mapPortalStatus("Issued"), "permit_issued");
  assertEquals(mapPortalStatus("Application Accepted"), "submitted");
  assertEquals(mapPortalStatus("On Hold - Pending Payment"), "on_hold");
  assertEquals(mapPortalStatus("Void"), "cancelled");
});

Deno.test("mapPortalStatus refuses to guess", () => {
  assertEquals(mapPortalStatus("Awaiting Structural Peer Review"), "on_hold");
  assertEquals(mapPortalStatus("Zoning Escalation Tier 2"), null);
  assertEquals(mapPortalStatus(""), null);
  assertEquals(mapPortalStatus(null), null);
});

Deno.test("corrections outrank a generic review status", () => {
  // A page that says both must be treated as corrections, not as "still in review".
  assertEquals(mapPortalStatus("Plan Review - Corrections Required"), "corrections_required");
});
