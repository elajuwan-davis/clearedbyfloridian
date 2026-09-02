// HOA ARC checklist templates and completion. Isolated from hoa-submittals.ts so
// the rules can load under tsx without the Supabase client.

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

export type HoaChecklistItem = {
  key: string;
  label: string;
  required: boolean;
  checked: boolean;
  document_path?: string | null;
  filename?: string | null;
};

// Checklist templates by project type (matches the Olympia ARC form structure).
// Each item becomes a row the GC checks off; required items block completion.
export function checklistForType(type: HoaProjectType | null): HoaChecklistItem[] {
  const item = (key: string, label: string, required: boolean): HoaChecklistItem => ({
    key,
    label,
    required,
    checked: false,
    document_path: null,
    filename: null,
  });

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
