// Vendored copy of src/lib/permit-checklists.ts for the Deno edge runtime — NOT the live source.
// The app bundle keeps using src/lib/permit-checklists.ts; a fix there does not reach the edge
// functions until it is copied here as well. Currently byte-identical to it.
// Municipality + Permit Type → required document checklist.
// Falls back to DEFAULT_CHECKLIST when no specific match is seeded.

export type ChecklistDoc = {
  key: string;
  label: string;
  required: boolean;
  canDefer?: boolean;
  desc?: string;
};

// NOC (Notice of Commencement) is NOT collected at intake — the system
// auto-generates a pre-filled Palm Beach County NOC on permit submission
// using intake data. The GC reviews, signs, and records it with the
// County Clerk. See `src/lib/noc-auto.ts`.

export const DEFAULT_CHECKLIST: ChecklistDoc[] = [
  { key: "stamped_plans", label: "Stamped Construction Plans", required: true, canDefer: true, desc: "Signed and sealed construction plans." },
  { key: "site_survey", label: "Site / Spot Survey", required: false, canDefer: false, desc: "Boundary or spot survey." },
  { key: "tdh_calculations", label: "TDH Calculations (Turnover Design and Hydraulics)", required: false, canDefer: false, desc: "Turnover design and hydraulics calculations." },
  { key: "equipment_specification", label: "Equipment Specification", required: false, canDefer: false, desc: "Equipment specifications and cut sheets." },
];


const WELLINGTON_POOL: ChecklistDoc[] = [
  { key: "building_permit_application", label: "Building Permit Application", required: true, canDefer: true, desc: "Universal County-Wide form. Auto-fillable with contractor + subcontractor info." },
  { key: "owner_builder_affidavit", label: "Owner/Builder Affidavit", required: false, canDefer: true, desc: "If applicable." },
  { key: "notice_of_commencement", label: "Notice of Commencement", required: false, canDefer: true, desc: "If applicable." },
  { key: "new_construction_affidavit", label: "New Construction Affidavit", required: true, canDefer: true },
  { key: "swimming_pool_worksheet", label: "Swimming Pool Worksheet", required: true, canDefer: true, desc: "Auto-fillable with pump/filter/heater/deck data." },
  { key: "pool_barrier_affidavit_qualifier", label: "Swimming Pool Barrier Affidavit", required: true, canDefer: true, desc: "Requires qualifier signature." },
  { key: "stamped_plans", label: "Stamped Construction Plans", required: true, canDefer: true, desc: "Signed, sealed, dated." },
  { key: "sub_trade_applications", label: "Sub Trade Applications", required: true, canDefer: true },
  { key: "site_survey", label: "Site / Spot Survey", required: true, canDefer: true },
  { key: "scope_replacement_value", label: "Scope of Work / Replacement Value", required: true, canDefer: true },
  { key: "equipment_specification", label: "Equipment Specifications", required: true, canDefer: true, desc: "Pump, filter, bubblers, heater, lights, salt system." },
  { key: "pool_barrier_affidavit_signed", label: "Pool Barrier Affidavit — completed and signed", required: true, canDefer: true },
  { key: "electrical_load_calculations", label: "Electrical Load Calculations", required: true, canDefer: true },
];

// Keys are lowercased municipality name → permit type → checklist
const CHECKLISTS: Record<string, Record<string, ChecklistDoc[]>> = {
  wellington: {
    "swimming pool": WELLINGTON_POOL,
    "new construction of pool w/ deck": WELLINGTON_POOL,
    "pool renovation": WELLINGTON_POOL,
    "pool + spa": WELLINGTON_POOL,
  },
  "village of wellington": {
    "swimming pool": WELLINGTON_POOL,
    "new construction of pool w/ deck": WELLINGTON_POOL,
    "pool renovation": WELLINGTON_POOL,
    "pool + spa": WELLINGTON_POOL,
  },
};

export function getChecklist(municipality: string | null | undefined, permitType: string | null | undefined): ChecklistDoc[] {
  if (!municipality || !permitType) return DEFAULT_CHECKLIST;
  const m = municipality.trim().toLowerCase();
  const p = permitType.trim().toLowerCase();
  const byMuni = CHECKLISTS[m];
  if (byMuni && byMuni[p]) return byMuni[p];
  return DEFAULT_CHECKLIST;
}

