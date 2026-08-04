// deno test supabase/functions/_shared/submission-draft_test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  draftDocuments,
  emailDraft,
  extractConfirmationNumber,
  portalFields,
  resolveTargetFor,
  slugify,
  type PermitRow,
  type Target,
} from "./submission-draft.ts";

const permit = (over: Partial<PermitRow> = {}): PermitRow => ({
  id: "11111111-1111-1111-1111-111111111111",
  tenant_id: null,
  project_name: "Bayview pool enclosure",
  job_address: "412 NW 70th Ave, Plantation, FL 33317",
  city: "Plantation",
  county: "Broward",
  municipality: "Plantation",
  permit_type: "Building Permit",
  description: "screen enclosure over existing pool deck",
  scope_concise: "Install aluminum screen enclosure over existing pool deck per FBC 2023.",
  owner_name: "M. Rivera",
  poc_email: "pm@coastline.test",
  poc_phone: "954-555-0100",
  license_number: "CPC1459161",
  contractor_company: "Coastline Builders LLC",
  construction_value_cents: 4_200_000,
  documents: [
    {
      key: "stamped_plans",
      label: "Stamped Construction Plans",
      required: true,
      status: "uploaded",
      filename: "plans.pdf",
      path: "permits/1/plans.pdf",
    },
    {
      key: "site_survey",
      label: "Site Survey",
      required: false,
      status: "missing",
      filename: null,
      path: null,
    },
  ],
  document_bundle_path: "permits/1/bundle.pdf",
  pre_submission_status: "pass",
  pre_submission_report: null,
  created_by: null,
  ...over,
});

const plantation: Target = {
  slug: "plantation",
  city_name: "Plantation",
  county: "Broward",
  channel: "portal",
  driver: "accela_aca",
  portal_url: "https://aca.plantation.org/CitizenAccess/Default.aspx",
  intake_email: null,
  intake_cc: [],
  enabled: true,
};

const sunrise: Target = {
  slug: "sunrise",
  city_name: "Sunrise",
  county: "Broward",
  channel: "email",
  driver: null,
  portal_url: null,
  intake_email: "building@sunrisefl.gov",
  intake_cc: ["records@sunrisefl.gov"],
  enabled: false,
};

Deno.test("slugify matches the gc_portal_logins slug shape", () => {
  assertEquals(slugify("Ft. Lauderdale"), "ft-lauderdale");
  assertEquals(slugify("Plantation"), "plantation");
});

Deno.test("draft lists the bundle first and only uploaded documents", () => {
  const docs = draftDocuments(permit());
  assertEquals(
    docs.map((d) => d.role),
    ["bundle", "stamped_plans"],
  );
  assertEquals(docs[0].path, "permits/1/bundle.pdf");
});

Deno.test("a permit with no bundle drafts no bundle document", () => {
  const docs = draftDocuments(permit({ document_bundle_path: null }));
  assertEquals(
    docs.map((d) => d.role),
    ["stamped_plans"],
  );
});

Deno.test("portal fields come from the permit, preferring the drafted scope", () => {
  const f = portalFields(permit(), plantation, "info@cleard.com");
  assertEquals(f.contractor_license, "CPC1459161");
  assertEquals(f.job_value, 42000);
  assertEquals(
    f.work_description,
    "Install aluminum screen enclosure over existing pool deck per FBC 2023.",
  );
  assertEquals(f.applicant_email, "pm@coastline.test");
});

Deno.test("portal fields fall back to the GC description and the firm email", () => {
  const f = portalFields(
    permit({ scope_concise: null, poc_email: null }),
    plantation,
    "info@cleard.com",
  );
  assertEquals(f.work_description, "screen enclosure over existing pool deck");
  assertEquals(f.applicant_email, "info@cleard.com");
});

Deno.test("email draft addresses the intake mailbox and lists every attachment", () => {
  const docs = draftDocuments(permit());
  const mail = emailDraft(permit(), sunrise, docs, "info@cleard.com");
  assertEquals(mail.to, "building@sunrisefl.gov");
  assertEquals(mail.cc, ["records@sunrisefl.gov"]);
  assertEquals(mail.body_text.includes("Permit application bundle"), true);
  assertEquals(mail.body_text.includes("Stamped Construction Plans"), true);
  assertEquals(mail.body_text.includes("CPC1459161"), true);
});

Deno.test("target resolution matches the permit's municipality", () => {
  const { target } = resolveTargetFor(permit(), [plantation, sunrise]);
  assertEquals(target?.slug, "plantation");
});

Deno.test("a disabled target is never selected implicitly", () => {
  const { target, error } = resolveTargetFor(permit({ municipality: "Sunrise", city: "Sunrise" }), [
    plantation,
    sunrise,
  ]);
  assertEquals(target, undefined);
  assertEquals(error?.includes("not an enabled submission target"), true);
});

Deno.test("a disabled target is refused even when asked for by slug", () => {
  const { target, error } = resolveTargetFor(permit(), [plantation, sunrise], "sunrise");
  assertEquals(target, undefined);
  assertEquals(error?.includes("not enabled"), true);
});

Deno.test("an unknown slug is refused", () => {
  const { error } = resolveTargetFor(permit(), [plantation], "hialeah");
  assertEquals(error?.includes("no submission target configured"), true);
});

Deno.test("confirmation numbers are read off the receipt page", () => {
  assertEquals(
    extractConfirmationNumber("Your application was submitted.\nRecord Number: 26BLD-004512\n"),
    "26BLD-004512",
  );
  assertEquals(extractConfirmationNumber("Permit # BLD-26-001234 issued"), "BLD-26-001234");
  assertEquals(extractConfirmationNumber("26BLD-004512 has been created"), "26BLD-004512");
});

Deno.test("an unreadable receipt yields null, never a guess", () => {
  assertEquals(extractConfirmationNumber("Thank you. Your application is being processed."), null);
  assertEquals(extractConfirmationNumber(""), null);
});
