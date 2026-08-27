import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DOC_TEMPLATE,
  filterSubVisibleDocs,
  getEffectiveDocs,
  getHiddenFieldKeys,
  missingRequiredDocs,
  permitCompleteness,
  type PermitDoc,
  type PermitRow,
} from "./permits-api.ts";

function doc(partial: Partial<PermitDoc> & Pick<PermitDoc, "key">): PermitDoc {
  return {
    label: partial.key,
    required: false,
    status: "uploaded",
    filename: "file.pdf",
    path: `permits/${partial.key}.pdf`,
    ...partial,
  };
}

function row(partial: Partial<PermitRow> = {}): PermitRow {
  return {
    id: "p1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    project_name: "Harbor Residence",
    owner_name: "Owner",
    owner_entity: null,
    job_address: "1 Main St",
    city: "Plantation",
    county: "Broward",
    municipality: "Plantation",
    permit_type: "Building",
    permit_number: "26BLD-1",
    construction_value_cents: 100_000_00,
    cleared_fee_cents: null,
    status: "submitted",
    pcn: "123",
    description: "New SFR",
    additional_notes: null,
    contractor_company: "GC Co",
    contractor_qualifier: "Qualifier",
    company_address: null,
    poc: "Pat",
    poc_phone: "555",
    poc_email: "pat@gc.com",
    correction_reply_email: null,
    license_number: "CGC1",
    signer_phone: null,
    signer_email: null,
    submitted_date: "2026-01-02",
    subs: [],
    documents: [],
    extra_docs: [],
    intake_payload: null,
    tenant_id: null,
    ...partial,
  };
}

describe("filterSubVisibleDocs", () => {
  it("only returns uploaded allowlisted keys that have a storage path", () => {
    const visible = filterSubVisibleDocs([
      doc({ key: "stamped_plans" }),
      doc({ key: "site_survey" }),
      doc({ key: "w9", label: "W-9" }),
      doc({ key: "coi", label: "COI" }),
      doc({ key: "permit_card", status: "pending" }),
      doc({ key: "issued_permit", path: null }),
    ]);
    assert.deepEqual(
      visible.map((d) => d.key),
      ["stamped_plans", "site_survey"],
    );
  });

  it("lets a library notice of commencement through even if the key is also allowlisted", () => {
    const visible = filterSubVisibleDocs([
      doc({ key: "notice_of_commencement_review", source: "library" }),
      doc({ key: "notice_of_commencement_review", source: "upload", status: "missing", path: null }),
    ]);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].source, "library");
  });

  it("returns an empty list for missing input instead of throwing", () => {
    assert.deepEqual(filterSubVisibleDocs(null), []);
    assert.deepEqual(filterSubVisibleDocs(undefined), []);
  });
});

describe("getEffectiveDocs / missingRequiredDocs", () => {
  it("uses the default checklist when the permit has no documents yet", () => {
    assert.equal(getEffectiveDocs(row({ documents: [] })), DEFAULT_DOC_TEMPLATE);
    assert.ok(missingRequiredDocs(row({ documents: [] })).some((d) => d.key === "stamped_plans"));
  });

  it("keeps the stored list once any documents exist", () => {
    const custom = [doc({ key: "custom_packet", required: true, status: "missing", path: null })];
    assert.equal(getEffectiveDocs(row({ documents: custom })), custom);
    assert.equal(missingRequiredDocs(row({ documents: custom })).length, 1);
  });
});

describe("permitCompleteness", () => {
  it("treats an issued permit as 100% complete even with empty fields", () => {
    const issued = permitCompleteness(
      row({
        status: "permit_issued",
        project_name: "",
        documents: [doc({ key: "stamped_plans", status: "missing", path: null, required: true })],
      }),
    );
    assert.equal(issued.percent, 100);
    assert.deepEqual(issued.missingFields, []);
    assert.deepEqual(issued.missingDocs, []);
  });

  it("excludes intake hidden fields from the missing-field count", () => {
    const incomplete = permitCompleteness(
      row({
        permit_number: null,
        intake_payload: { hidden_fields: ["permit_number"] },
      }),
    );
    assert.equal(
      incomplete.missingFields.some((f) => f.key === "permit_number"),
      false,
    );
    assert.deepEqual(getHiddenFieldKeys(row({ intake_payload: { hidden_fields: ["permit_number"] } })), [
      "permit_number",
    ]);
  });
});
