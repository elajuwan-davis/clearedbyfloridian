// Multi Family project guides — batch 7.
import type { PortalGuide, InspectionPhase, PlanReviewItem } from "./portal-guides-data";
import {
  REVIEWED, STANDARD_DOWNLOADS, NTBO_OWNER,
  ROUGH_FRAMING, ROOF_DRY_IN, FINAL_BUILDING, FULL_DWELLING,
} from "./portal-guides-batch-4";
import {
  ROUGH_FRAMING_PARTY, DRYWALL_PARTY, FINAL_BUILDING_PARTY, NEW_DWELLING_SEQ,
} from "./portal-guides-batch-5";

// ---------- Shared blocks ----------

const ROOF_FINAL: InspectionPhase = {
  phase: "Roof Final", code: "607", title: "Roof Final",
  tags: ["Required", "Critical"],
  checks: [
    "Roofing material installed per manufacturer specs and approved plans",
    "All flashing complete at walls, valleys, penetrations, and edges",
    "Roof ventilation installed per plans",
    "Roofing material nailing pattern meets high-wind requirements",
    "Job site clean; no exposed nails or debris in gutters",
  ],
  refs: "FBC-R R806.1 · R903.2 · R905.2 · FBC-B 110.3",
};

const BUCK_FLASHING: InspectionPhase = {
  phase: "Buck, Flashing", code: "301", title: "Buck, Flashing",
  tags: ["Required", "Critical"],
  checks: [
    "Window/door bucks and flashing installed per manufacturer specs",
    "Anchoring method and fastener spacing per manufacturer installation instructions",
    "Sealant applied per manufacturer specs at all joints",
  ],
  refs: "FBC-R R703.4 · FBC-B 1710.2 · 1710.3 · 1710.4",
};

const WINDOW_DOOR_FINAL_BUILDING: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Window/Door Replacement",
  tags: ["Required", "Critical"],
  checks: [
    "Installed windows/doors have valid Florida Product Approval matching approved plans",
    "All windows and doors open, close, lock, and seal properly",
    "Impact-rated products verified where required by wind zone",
    "Bedroom windows meet egress size requirements after replacement",
    "Interior trim and exterior caulking complete",
  ],
  refs: "FBC-R R301.2.1.2 · R310.1 · R609.3 · R612.1 · R703.4 · FBC-B 1710.1 · 1710.2",
};

// Apartment/condo sequence: NEW_DWELLING_SEQ with party-wall variants swapped in
const MF_DWELLING_SEQ: InspectionPhase[] = NEW_DWELLING_SEQ.map((p) => {
  if (p === ROUGH_FRAMING) return ROUGH_FRAMING_PARTY;
  return p;
}).map((p) => {
  // Also swap DRYWALL & FINAL_BUILDING
  if (p.phase === "Drywall") return DRYWALL_PARTY;
  if (p.phase === "Final Building") return FINAL_BUILDING_PARTY;
  return p;
});

// ---------- Guides ----------

const MF_STRUCTURAL_ELEVATION: PortalGuide = {
  slug: "multi-family-structural-elevation",
  category: "Multi Family",
  title: "Multi Family Structural Elevation",
  docCount: 4, inspectionCount: 61, lastUpdated: REVIEWED,
  summary: "Multi-family structural elevation — full inspection sequence including elevated foundation, flood-load design, and continuous lateral-force path.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Structural engineering plans sealed by a Florida-registered professional engineer showing the elevation design.", required: "always" },
    { name: "Survey / Site Plan", description: "Current survey or site plan showing existing and proposed elevations.", required: "always" },
    { name: "Elevation Certificate", description: "FEMA Elevation Certificate — required if property is located in a flood zone.", required: "conditional" },
    { name: "NOAs / Product Approvals", description: "NOAs and/or Florida Product Approvals for applicable components — if scope includes products/components requiring NOA or Florida Product Approval.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Elevation Design and Lateral Anchorage", tags: ["Life Safety"], description: "Elevated foundation system must be designed for wind, seismic, and flood-loading with continuous lateral-force path.", code: "ASCE 24 · FBC-B 1612 · FBC-R R322" },
    { n: "04", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: FULL_DWELLING,
};

const MF_SUNROOM: PortalGuide = {
  slug: "multi-family-sunroom",
  category: "Multi Family",
  title: "Multi Family Sunroom",
  docCount: 4, inspectionCount: 15, lastUpdated: REVIEWED,
  summary: "Multi-family sunroom addition — rough framing and final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing sunroom layout and framing.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, glass panels, and regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and sunroom footprint.", required: "always" },
    { name: "Energy Compliance Forms", description: "Energy compliance documentation. Required if sunroom includes conditioned (air-conditioned) space.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [ROUGH_FRAMING, FINAL_BUILDING],
};

const MF_WINDOW_DOOR: PortalGuide = {
  slug: "multi-family-window-door-replacement",
  category: "Multi Family",
  title: "Multi Family Window/Door Replacement",
  docCount: 2, inspectionCount: 8, lastUpdated: REVIEWED,
  summary: "Multi-family window and door replacement — buck/flashing and final building.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for replacement windows and/or doors showing impact rating, design pressure, and NOA/FL number.", required: "always" },
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Structural engineering plans sealed by a Florida-registered professional engineer. Required if structural changes are involved (new openings, enlarged openings, header modifications).", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind-borne Debris Protection", tags: ["Life Safety"], description: "In the Wind-Borne Debris Region, glazed openings must be impact-rated or protected by an approved shutter/panel system.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { n: "02", title: "Egress from Sleeping Rooms", tags: ["Life Safety"], description: "Each sleeping room must have emergency escape meeting R310 dimensions.", code: "FBC-R R310" },
    { n: "03", title: "Fire-Rated Unit Separation", tags: ["Life Safety"], description: "Dwelling-unit and corridor separations must maintain the original fire-resistance rating through any new work.", code: "FBC-B 420 · 708 · 711" },
    { n: "04", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA required for fenestration, structural panels, covering systems.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
  ],
  inspections: [BUCK_FLASHING, WINDOW_DOOR_FINAL_BUILDING],
};

const MF_REROOF: PortalGuide = {
  slug: "multi-family-re-roof",
  category: "Multi Family",
  title: "Multi-Family Re-Roof",
  docCount: 2, inspectionCount: 10, lastUpdated: REVIEWED,
  summary: "Multi-family re-roof — dry-in and roof final.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for underlayment and roofing materials.", required: "always" },
    { name: "Roof Sheathing & Dry-In Affidavit", description: "Signed affidavit for roof sheathing and dry-in inspection compliance.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "02", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "03", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for reroofs (Exemption #2).", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      ...ROOF_DRY_IN,
      checks: [
        ...ROOF_DRY_IN.checks,
        "Roof deck in acceptable condition; damaged sheathing replaced",
      ],
      refs: ROOF_DRY_IN.refs + " · R803.1",
    },
    ROOF_FINAL,
  ],
};

const NEW_MF_PLAN_REVIEW: PlanReviewItem[] = [
  { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
  { n: "02", title: "Egress from Sleeping Rooms", tags: ["Life Safety"], description: "Each sleeping room must have an emergency escape and rescue opening meeting R310 dimensions.", code: "FBC-R R310" },
  { n: "03", title: "Smoke and CO Alarm Coverage", tags: ["Life Safety"], description: "Smoke alarms in each sleeping room, outside each sleeping area, and on each story. CO alarms where fuel-fired appliances or attached garages exist.", code: "FBC-R R314 · R315" },
  { n: "04", title: "Structural Wall Section and Load Path", tags: ["Life Safety"], description: "A continuous wall section from foundation through roof must show framing, sheathing, connectors, and uplift resistance.", code: "FBC-R R301 · R602 · R802" },
  { n: "05", title: "Fire-Rated Unit Separation", tags: ["Life Safety"], description: "Dwelling-unit and corridor separations must maintain the original fire-resistance rating through any new work.", code: "FBC-B 420 · 708 · 711" },
  { n: "06", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration, structural panels, covering systems).", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
  { n: "07", title: "Combustion Air and Venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires combustion air and proper venting per FBC-M 303 / 804.", code: "FBC-M 303 · 804 · FBC-FG" },
  { n: "08", title: "Manual J / S / D Load Calculation", tags: ["Code"], description: "HVAC equipment sizing per Manual J; selection per Manual S; duct design per Manual D.", code: "FBC-R M1401.3 · FBC-M 309" },
  { n: "09", title: "Ventilation", tags: ["Code"], description: "Whole-house or occupancy-based ventilation per FBC-R M1507 / FBC-M 403.", code: "FBC-R M1507 · FBC-M 403" },
  { n: "10", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI per NEC 210.8 at required locations.", code: "NEC 210.8 · 210.12" },
  { n: "11", title: "Grounding and Bonding", tags: ["Life Safety"], description: "Grounding electrode, equipment grounding, and bonding per NEC Article 250.", code: "NEC 250" },
  { n: "12", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
  { n: "13", title: "Water Service and DWV Sizing", tags: ["Code"], description: "Water service line sizing and DWV sizing consistent with fixture unit count.", code: "FBC-P 604 · 709 · 906" },
  { n: "14", title: "Backflow Prevention", tags: ["Code"], description: "Backflow prevention required at well, irrigation, or other cross-connections per FBC-P 608.", code: "FBC-P 608" },
];

const NEW_APARTMENT: PortalGuide = {
  slug: "new-apartment",
  category: "Multi Family",
  title: "New Apartment",
  docCount: 6, inspectionCount: 19, lastUpdated: REVIEWED,
  summary: "New apartment construction — 19-phase inspection sequence with fire-rated unit separation.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional (architect or engineer).", required: "always" },
    { name: "Energy Compliance Forms", description: "Energy compliance documentation per FBC Chapter 13 / IECC.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, doors, roofing materials, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Current site plan or survey showing property boundaries, setbacks, and building footprint.", required: "always" },
    { name: "Fire Separation / Fire-Resistance Rating Documentation", description: "Documentation showing fire separation details and fire-resistance ratings between units per FBC requirements.", required: "always" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Truss engineering package, conventional framing per FBC, or a truss deferral letter requesting deferred submittal of truss engineering. Only when structure uses pre-engineered trusses and truss engineering is not shown in the sealed plan set.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: NEW_MF_PLAN_REVIEW,
  inspections: MF_DWELLING_SEQ,
};

const NEW_CONDO: PortalGuide = {
  slug: "new-condo",
  category: "Multi Family",
  title: "New Condo",
  docCount: 5, inspectionCount: 19, lastUpdated: REVIEWED,
  summary: "New condo construction — 19-phase inspection sequence with fire-rated party wall.",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Architecture or engineering sealed plans.", required: "always" },
    { name: "Energy Compliance Forms", description: "Per FBC Chapter 13 / IECC.", required: "always" },
    { name: "Product Approvals", description: "Florida approvals for windows, doors, roofing, regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Property boundaries, setbacks, building footprint.", required: "always" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Only when structure uses pre-engineered trusses and engineering not shown in sealed plans. Satisfied by truss engineering in plan set, conventional framing per FBC, or deferral letter.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: NEW_MF_PLAN_REVIEW,
  inspections: MF_DWELLING_SEQ,
};

export const GUIDES_BATCH_7: PortalGuide[] = [
  MF_STRUCTURAL_ELEVATION,
  MF_SUNROOM,
  MF_WINDOW_DOOR,
  MF_REROOF,
  NEW_APARTMENT,
  NEW_CONDO,
];
