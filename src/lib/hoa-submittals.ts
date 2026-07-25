// HOA Submittal — types, checklist definitions, and CRUD API.
// GCs and Cleard admins create ARC submittals for HOA/community approval, in
// parallel with or in advance of the building permit.

import { supabase } from "@/integrations/supabase/client";

export type HoaStatus =
  | "draft"
  | "submitted_to_hoa"
  | "pending_arc_meeting"
  | "approved"
  | "conditionally_approved"
  | "denied";

export type HoaProjectType =
  | "pool_spa"
  | "screen_enclosure"
  | "fence"
  | "driveway_patio"
  | "roof"
  | "paint"
  | "landscaping"
  | "garage_doors"
  | "other";

export type HoaSource = "uploaded_form" | "boilerplate";

export type HoaChecklistItem = {
  key: string;
  label: string;
  required: boolean;
  checked: boolean;
  document_path?: string | null;
  filename?: string | null;
};

export type HoaDocument = {
  key: string;
  label: string;
  path: string;
  filename: string;
  size?: number;
  mime?: string;
  uploaded_at: string;
};

export type HoaSubmittalRow = {
  id: string;
  tenant_id: string | null;
  created_by: string | null;
  permit_id: string | null;
  source: HoaSource;
  status: HoaStatus;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  property_address: string | null;
  lot: string | null;
  block: string | null;
  plat_name: string | null;
  hoa_name: string | null;
  community_name: string | null;
  village_name: string | null;
  model_type: string | null;
  project_type: HoaProjectType | null;
  project_description: string | null;
  scope_of_work: string | null;
  contractor_name: string | null;
  contractor_license: string | null;
  estimated_start_date: string | null;
  deposit_amount_cents: number;
  coi_attached: boolean;
  plans_attached: boolean;
  extracted_fields: Record<string, unknown>;
  missing_fields: string[];
  checklist: HoaChecklistItem[];
  documents: HoaDocument[];
  uploaded_form_path: string | null;
  generated_pdf_path: string | null;
  removal_agreement_path: string | null;
  removal_agreement_signed: boolean;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  template_id: string | null;
  homeowner_name: string | null;
  homeowner_email: string | null;
  sent_to_hoa_at: string | null;
  homeowner_notified_at: string | null;
};

export type HoaSubmittalInsert = Partial<Omit<HoaSubmittalRow, "id" | "created_at" | "updated_at">>;

// Human labels for statuses (drives badge copy)
export const HOA_STATUS_LABELS: Record<HoaStatus, string> = {
  draft: "Draft",
  submitted_to_hoa: "Submitted to HOA",
  pending_arc_meeting: "Pending ARC Meeting",
  approved: "Approved",
  conditionally_approved: "Conditionally Approved",
  denied: "Denied",
};

export const HOA_PROJECT_TYPE_LABELS: Record<HoaProjectType, string> = {
  pool_spa: "Pool / Spa",
  screen_enclosure: "Screen Enclosure",
  fence: "Fence",
  driveway_patio: "Driveway / Patio Extension",
  roof: "Roof",
  paint: "Exterior Paint",
  landscaping: "Major Landscaping",
  garage_doors: "Garage / Front Doors",
  other: "Other",
};

// Checklist templates by project type (matches the Olympia ARC form structure).
// Each item becomes a row the GC checks off; required items block completion.
export function checklistForType(type: HoaProjectType | null): HoaChecklistItem[] {
  const item = (key: string, label: string, required: boolean): HoaChecklistItem =>
    ({ key, label, required, checked: false, document_path: null, filename: null });

  switch (type) {
    case "pool_spa":
    case "screen_enclosure":
      return [
        item("lot_survey_drawing", "Lot Survey with Project Drawing", true),
        item("deposit_500", "$500 Deposit", true),
        item("coi", "Certificate of Insurance (COI)", true),
      ];
    case "fence":
      return [
        item("lot_survey_drawing", "Lot Survey with Project Drawing", true),
        item("fence_description", "Fence description (material / color / height)", true),
        item("gate_locations", "Gate locations noted on drawing", true),
        item("removal_agreement", "Notarized Removal Agreement (if applicable)", true),
        item("coi", "Certificate of Insurance (COI)", true),
      ];
    case "driveway_patio":
      return [
        item("lot_survey_drawing", "Lot Survey with Project Drawing", true),
        item("coi", "Certificate of Insurance (COI)", true),
      ];
    case "roof":
      return [
        item("deposit_500", "$500 Deposit", true),
        item("coi", "Certificate of Insurance (COI)", true),
      ];
    case "paint":
      return [
        item("photo_house", "Color photo of house", true),
        item("photo_adjacent", "Color photos of adjacent houses", true),
        item("photo_across", "Color photo of house across the street", true),
      ];
    case "landscaping":
      return [
        item("deposit_500", "$500 Deposit", true),
        item("coi", "Certificate of Insurance (COI)", true),
      ];
    case "garage_doors":
      return [
        item("color_sample", "Sample color chip / photo", true),
        item("deposit_500", "$500 Deposit", true),
      ];
    default:
      return [
        item("lot_survey_drawing", "Lot Survey with Project Drawing", false),
        item("coi", "Certificate of Insurance (COI)", false),
      ];
  }
}

/** True if every required checklist item is checked. */
export function isChecklistComplete(list: HoaChecklistItem[] | null | undefined): boolean {
  const items = list ?? [];
  return items.filter((i) => i.required).every((i) => i.checked);
}

const T = () => supabase.from("hoa_submittals" as any) as any;

export async function listHoaSubmittals(): Promise<HoaSubmittalRow[]> {
  const { data, error } = await T().select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HoaSubmittalRow[];
}

export async function listHoaSubmittalsForPermit(permitId: string): Promise<HoaSubmittalRow[]> {
  const { data, error } = await T()
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HoaSubmittalRow[];
}

export async function getHoaSubmittal(id: string): Promise<HoaSubmittalRow | null> {
  const { data, error } = await T().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as HoaSubmittalRow) ?? null;
}

export async function createHoaSubmittal(row: HoaSubmittalInsert): Promise<HoaSubmittalRow> {
  const { data, error } = await T().insert(row).select("*").single();
  if (error) throw error;
  return data as HoaSubmittalRow;
}

export async function updateHoaSubmittal(id: string, patch: HoaSubmittalInsert): Promise<HoaSubmittalRow> {
  const { data, error } = await T().update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as HoaSubmittalRow;
}

export async function deleteHoaSubmittal(id: string): Promise<void> {
  const { error } = await T().delete().eq("id", id);
  if (error) throw error;
}

/** Upload a file to permit-files bucket under `hoa/<submittalId>/…`. */
export async function uploadHoaFile(
  submittalId: string,
  folder: string,
  file: File,
): Promise<{ path: string; filename: string; size: number; mime: string }> {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `hoa/${submittalId}/${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from("permit-files")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw error;
  return { path, filename: file.name, size: file.size, mime: file.type };
}

export async function getHoaFileSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("permit-files").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
