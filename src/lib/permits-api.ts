import { supabase } from "@/integrations/supabase/client";

export type PermitStatus =
  | "submitted"
  | "in_review"
  | "corrections_required"
  | "approved"
  | "permit_issued"
  | "on_hold"
  | "outsourced_permitting"
  | "cancelled";

export type PermitDoc = {
  key: string;
  label: string;
  required: boolean;
  status: "uploaded" | "pending" | "not_applicable" | "missing";
  filename: string | null;
  path?: string | null;
  size?: number | null;
  mime?: string | null;
  uploaded_at?: string | null;
  custom?: boolean;
  external_url?: string | null;
  source?: "upload" | "google_drive" | "library" | null;
};


export type PermitSub = {
  trade: string;
  companyName: string;
  qualifierName?: string;
  licenseNumber?: string;
  contactEmail?: string;
  insuranceCarrierEmail?: string;
  /** UUID; shareable link at `/sub-portal/<accessToken>` grants read-only project-doc access once `confirmed`. */
  accessToken?: string;
  /** GC/ops-confirmed as on-the-job. Only then does the sub portal open. */
  confirmed?: boolean;
  confirmedAt?: string;
};

/** Ensure every sub in the array has an accessToken. Returns a new array + a
 *  boolean flag indicating whether any token was minted (caller may persist). */
export function ensureSubTokens(subs: PermitSub[] | undefined | null): { subs: PermitSub[]; mutated: boolean } {
  const list = subs ?? [];
  let mutated = false;
  const next = list.map((s) => {
    if (s.accessToken) return s;
    mutated = true;
    return { ...s, accessToken: crypto.randomUUID() };
  });
  return { subs: next, mutated };
}

/** Set of document keys visible to a confirmed subcontractor via the sub portal. */
export const SUB_VISIBLE_DOC_KEYS = new Set<string>([
  "notice_of_commencement_review",
  "stamped_plans",
  "site_survey",
  "tdh_calculations",
  "equipment_specification",
  "permit_card",
  "issued_permit",
]);

export function filterSubVisibleDocs(docs: PermitDoc[] | undefined | null): PermitDoc[] {
  return (docs ?? []).filter((d) => {
    if (d.status !== "uploaded" || !d.path) return false;
    if (d.source === "library" && d.key === "notice_of_commencement_review") return true;
    return SUB_VISIBLE_DOC_KEYS.has(d.key);
  });
}

export type PermitRow = {
  id: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  owner_name: string | null;
  owner_entity: string | null;
  job_address: string;
  city: string | null;
  county: string | null;
  municipality: string | null;
  permit_type: string | null;
  permit_number: string | null;
  construction_value_cents: number | null;
  cleared_fee_cents: number | null;
  status: PermitStatus;
  pcn: string | null;
  description: string | null;
  additional_notes: string | null;
  contractor_company: string | null;
  contractor_qualifier: string | null;
  company_address: string | null;
  poc: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  license_number: string | null;
  signer_phone: string | null;
  signer_email: string | null;
  submitted_date: string | null;
  subs: PermitSub[];
  documents: PermitDoc[];
  extra_docs: string[];
  intake_payload: Record<string, unknown> | null;
  tenant_id: string | null;
};

export type PermitInsert = Omit<PermitRow, "id" | "created_at" | "updated_at">;

const T = () => supabase.from("permits" as any) as any;

export async function listPermits(): Promise<PermitRow[]> {
  const { data, error } = await T().select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PermitRow[];
}

export async function getPermit(id: string): Promise<PermitRow | null> {
  const { data, error } = await T().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as PermitRow) ?? null;
}

export async function createPermit(row: Partial<PermitInsert>): Promise<PermitRow> {
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as PermitRow;
}

export async function updatePermit(id: string, patch: Partial<PermitInsert>): Promise<PermitRow> {
  // Snapshot prior status to detect transitions for notifications
  let priorStatus: PermitStatus | null = null;
  if (patch.status) {
    const { data: before } = await T().select("status, project_name").eq("id", id).maybeSingle();
    priorStatus = (before?.status as PermitStatus) ?? null;
  }
  const { data, error } = await T().update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  const row = data as PermitRow;
  if (patch.status && priorStatus !== row.status) {
    try {
      const { notifTitleForStatus, triggerNotification } = await import("@/lib/notifications-api");
      const evt = notifTitleForStatus(row.status, row.project_name);
      if (evt) await triggerNotification({ kind: evt.kind, title: evt.title, permit_id: row.id });
    } catch { /* best-effort */ }
  }
  return row;
}

export async function deletePermit(id: string): Promise<void> {
  const { error } = await T().delete().eq("id", id);
  if (error) throw error;
}

// Default document checklist applied when a permit has no documents attached yet
// (matches the GC Intake — 6 Document Upload Fields).
export const DEFAULT_DOC_TEMPLATE: PermitDoc[] = [
  { key: "stamped_plans", label: "Stamped Construction Plans", required: true, status: "missing", filename: null },
  { key: "site_survey", label: "Site / Spot Survey", required: false, status: "missing", filename: null },
  { key: "tdh_calculations", label: "TDH Calculations (Turnover Design and Hydraulics)", required: false, status: "missing", filename: null },
  { key: "equipment_specification", label: "Equipment Specification", required: false, status: "missing", filename: null },
];

export function getEffectiveDocs(row: PermitRow): PermitDoc[] {
  const docs = row.documents ?? [];
  return docs.length > 0 ? docs : DEFAULT_DOC_TEMPLATE;
}

export function missingRequiredDocs(row: PermitRow): PermitDoc[] {
  return getEffectiveDocs(row).filter(
    (d) => d.required && d.status !== "uploaded" && d.status !== "not_applicable",
  );
}

export function pendingDocs(row: PermitRow): PermitDoc[] {
  return getEffectiveDocs(row).filter((d) => d.status === "pending" || d.status === "missing");
}

// Required fields tracked for permit completeness.
export const REQUIRED_FIELDS: Array<{ key: keyof PermitRow; label: string }> = [
  { key: "project_name", label: "Project Name" },
  { key: "job_address", label: "Job Address" },
  { key: "city", label: "City" },
  { key: "county", label: "County" },
  { key: "municipality", label: "Municipality" },
  { key: "permit_type", label: "Permit Type" },
  { key: "permit_number", label: "Permit Number" },
  { key: "construction_value_cents", label: "Construction Value" },
  { key: "pcn", label: "PCN (Parcel Control #)" },
  { key: "description", label: "Scope Description" },
  { key: "contractor_company", label: "Contractor Company" },
  { key: "contractor_qualifier", label: "Contractor Qualifier" },
  { key: "poc", label: "Point of Contact" },
  { key: "poc_phone", label: "POC Phone" },
  { key: "poc_email", label: "POC Email" },
  { key: "license_number", label: "License Number" },
  { key: "owner_name", label: "Owner Name" },
  { key: "submitted_date", label: "Submitted Date" },
];

function fieldFilled(row: PermitRow, key: keyof PermitRow): boolean {
  const v = row[key];
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return v > 0;
  return true;
}

export function getHiddenFieldKeys(row: PermitRow): string[] {
  const raw = (row.intake_payload as { hidden_fields?: unknown } | null)?.hidden_fields;
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

export function withHiddenFieldKeys(row: PermitRow, keys: string[]): Record<string, unknown> {
  const base = (row.intake_payload ?? {}) as Record<string, unknown>;
  return { ...base, hidden_fields: Array.from(new Set(keys)) };
}

export function missingRequiredFields(row: PermitRow): Array<{ key: string; label: string }> {
  const hidden = new Set(getHiddenFieldKeys(row));
  return REQUIRED_FIELDS
    .filter((f) => !hidden.has(String(f.key)) && !fieldFilled(row, f.key))
    .map((f) => ({ key: String(f.key), label: f.label }));
}

export type PermitCompleteness = {
  fieldsTotal: number;
  fieldsDone: number;
  docsTotal: number;
  docsDone: number;
  total: number;
  done: number;
  percent: number;
  missingFields: Array<{ key: string; label: string }>;
  missingDocs: PermitDoc[];
  pendingDocs: PermitDoc[];
};

export function permitCompleteness(row: PermitRow): PermitCompleteness {
  const docs = getEffectiveDocs(row);
  const hidden = new Set(getHiddenFieldKeys(row));
  const activeFields = REQUIRED_FIELDS.filter((f) => !hidden.has(String(f.key)));
  const fieldsTotal = activeFields.length;
  const missingFields = missingRequiredFields(row);
  const fieldsDone = fieldsTotal - missingFields.length;

  const docsTotal = docs.length;
  const docsDone = docs.filter((d) => d.status === "uploaded" || d.status === "not_applicable").length;
  const missingDocsList = docs.filter((d) => d.status !== "uploaded" && d.status !== "not_applicable");
  const pendingDocsList = docs.filter((d) => d.status === "pending" || d.status === "missing");

  const total = fieldsTotal + docsTotal;
  const done = fieldsDone + docsDone;
  // Issued permits are considered fully complete regardless of stored field/doc state.
  const isIssued = row.status === "permit_issued";
  const percent = isIssued ? 100 : (total === 0 ? 0 : Math.round((done / total) * 100));
  return {
    fieldsTotal, fieldsDone: isIssued ? fieldsTotal : fieldsDone,
    docsTotal, docsDone: isIssued ? docsTotal : docsDone,
    total, done: isIssued ? total : done,
    percent,
    missingFields: isIssued ? [] : missingFields,
    missingDocs: isIssued ? [] : missingDocsList,
    pendingDocs: isIssued ? [] : pendingDocsList,
  };
}

