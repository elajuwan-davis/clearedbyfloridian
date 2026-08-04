// Pure draft-building helpers for Agent 5 (municipality submission).
//
// Kept free of Deno/Node APIs so the edge function, the Playwright portal worker and the
// unit tests all use the same code to decide what gets filed.

export type PermitDoc = {
  key: string;
  label: string;
  required: boolean;
  status: string;
  filename: string | null;
  path?: string | null;
};

export type PermitRow = {
  id: string;
  tenant_id: string | null;
  project_name: string | null;
  job_address: string | null;
  city: string | null;
  county: string | null;
  municipality: string | null;
  permit_type: string | null;
  description: string | null;
  scope_concise: string | null;
  owner_name: string | null;
  poc_email: string | null;
  poc_phone: string | null;
  license_number: string | null;
  contractor_company: string | null;
  construction_value_cents: number | null;
  documents: PermitDoc[] | null;
  document_bundle_path: string | null;
  pre_submission_status: string | null;
  pre_submission_report: Record<string, unknown> | null;
  created_by: string | null;
};

export type Target = {
  slug: string;
  city_name: string;
  county: string | null;
  channel: "portal" | "email";
  driver: string | null;
  portal_url: string | null;
  intake_email: string | null;
  intake_cc: string[] | null;
  enabled: boolean;
};

export type DraftDocument = { label: string; path: string; role: string };

/** Slug shared by municipality_submission_targets and gc_portal_logins. */
export const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** The documents that will actually be filed, with their storage paths. */
export function draftDocuments(permit: PermitRow): DraftDocument[] {
  const docs: DraftDocument[] = [];
  if (permit.document_bundle_path) {
    docs.push({
      label: "Permit application bundle",
      path: permit.document_bundle_path,
      role: "bundle",
    });
  }
  for (const d of permit.documents ?? []) {
    if (d.status === "uploaded" && d.path) {
      docs.push({ label: d.label || d.key, path: d.path, role: d.key });
    }
  }
  return docs;
}

/**
 * Portal field values, resolved deterministically from the permit row. The Accela driver
 * consumes these by key so nothing is invented at fill time.
 */
export function portalFields(permit: PermitRow, target: Target, firmEmail: string) {
  return {
    record_type: permit.permit_type ?? "Building Permit",
    job_address: permit.job_address ?? "",
    city: target.city_name,
    work_description: permit.scope_concise || permit.description || "",
    job_value:
      permit.construction_value_cents == null
        ? null
        : Math.round(permit.construction_value_cents / 100),
    owner_name: permit.owner_name ?? "",
    contractor_company: permit.contractor_company ?? "",
    contractor_license: permit.license_number ?? "",
    applicant_email: permit.poc_email ?? firmEmail,
    applicant_phone: permit.poc_phone ?? "",
    private_provider: true,
  };
}

export function emailDraft(
  permit: PermitRow,
  target: Target,
  documents: DraftDocument[],
  firmEmail: string,
) {
  const subject = `Permit application — ${permit.job_address ?? permit.project_name ?? permit.id}`;
  const lines = [
    `${target.city_name} Building Department,`,
    "",
    `Please find attached the permit application package for ${
      permit.job_address ?? "the referenced project"
    }.`,
    "",
    `Owner: ${permit.owner_name ?? "—"}`,
    `Contractor: ${permit.contractor_company ?? "—"} (license ${permit.license_number ?? "—"})`,
    `Scope: ${permit.scope_concise || permit.description || "—"}`,
    permit.construction_value_cents
      ? `Construction value: $${Math.round(permit.construction_value_cents / 100).toLocaleString("en-US")}`
      : "",
    "",
    "Documents attached:",
    ...documents.map((d) => `  • ${d.label}`),
    "",
    "Filed by Cleard on behalf of the contractor as private provider.",
    firmEmail,
  ].filter(Boolean);
  return {
    to: target.intake_email,
    cc: target.intake_cc ?? [],
    subject,
    body_text: lines.join("\n"),
  };
}

/**
 * Accela Citizen Access confirmation ("record") numbers, e.g. 25BLD-001234 or
 * BLD-25-001234, read off the receipt page. Returns null rather than a guess so a
 * submission is never recorded with a made-up number.
 */
export function extractConfirmationNumber(pageText: string): string | null {
  // The label patterns require a digit in the captured token, so prose like
  // "Record Number: pending assignment" is not mistaken for a record number.
  const patterns = [
    /Record\s*(?:Number|#)\s*[:\-]?\s*((?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,})/i,
    /Permit\s*(?:Number|#)\s*[:\-]?\s*((?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{5,})/i,
    /\b(\d{2}[A-Z]{2,4}-\d{4,})\b/,
    /\b([A-Z]{2,4}-\d{2}-\d{4,})\b/,
  ];
  for (const re of patterns) {
    const m = pageText.match(re);
    if (m?.[1]) return m[1].toUpperCase();
  }
  return null;
}

/** Which municipality a permit files with, given the configured targets. */
export function resolveTargetFor(
  permit: Pick<PermitRow, "municipality" | "city">,
  targets: Target[],
  explicitSlug?: string,
): { target?: Target; error?: string } {
  if (explicitSlug) {
    const t = targets.find((x) => x.slug === explicitSlug);
    if (!t) return { error: `no submission target configured for '${explicitSlug}'` };
    if (!t.enabled) {
      return { error: `${t.city_name} is configured but not enabled for automated filing` };
    }
    return { target: t };
  }
  const candidates = [permit.municipality, permit.city]
    .filter((v): v is string => Boolean(v))
    .map(slugify);
  const t = targets.find((x) => x.enabled && candidates.includes(x.slug));
  if (t) return { target: t };
  const enabled = targets.filter((x) => x.enabled).map((x) => x.city_name);
  return {
    error:
      `${permit.municipality ?? permit.city ?? "this permit's jurisdiction"} is not an enabled ` +
      `submission target. Automated filing is live for: ${enabled.join(", ") || "none"}.`,
  };
}
