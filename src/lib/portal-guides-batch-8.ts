// Multi Family project guides — batch 8.
import type { PortalGuide, InspectionPhase } from "./portal-guides-data";
import {
  REVIEWED, STANDARD_DOWNLOADS, NTBO_OWNER,
  ROUGH_FRAMING, FINAL_BUILDING, FINAL_ELECTRICAL, FINAL_PLUMBING,
} from "./portal-guides-batch-4";
import { NEW_DWELLING_SEQ } from "./portal-guides-batch-5";

// ---------- Shared inline blocks ----------

const ELECTRICAL_ONLY_ROUGH: InspectionPhase = {
  phase: "Rough Electrical", code: "212", title: "Rough Electrical",
  tags: ["Required", "Electrical", "Critical"],
  checks: [
    "Panel properly mounted and sized per plans",
    "Wire gauge matches breaker amperage for each circuit",
    "Boxes properly installed and not overfilled",
    "GFCI and AFCI protection where required",
    "Interconnected smoke and CO alarm wiring in place",
    "Grounding electrode system and bonding connections",
  ],
  refs: "NEC 210.3 · 210.8 · 210.12 · 240.4 · 250.50 · 314.16 · 408.4 · FBC-R R314.3 · R315",
};

const FENCE_FINAL_BUILDING: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Fence",
  tags: ["Required", "Critical"],
  checks: [
    "Post installation and embedment depth per plans",
    "Fence height and setback per approved plans",
    "Material and construction per approved specs",
    "Gate operation, self-closing/self-latching where required (pool barrier)",
  ],
  refs: "FBC-R R301.1 · R4501.17",
};

const FLOOD_PANEL_FINAL: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Flood Panel",
  tags: ["Required", "Life Safety", "Critical"],
  checks: [
    "Product approval verification against approved plans",
    "Track and mounting installation per manufacturer specs",
    "Panel fit and seal at all openings",
    "Coverage of all required openings",
  ],
  refs: "FBC-B 1612.1 · 1612.4",
};

const DECK_ROUGH_FRAMING: InspectionPhase = {
  ...ROUGH_FRAMING,
  title: "Rough Framing — Deck/Dock",
};

const GENERATOR_ROUGH_ELECTRICAL: InspectionPhase = {
  phase: "Rough Electrical", code: "212", title: "Generator Rough Electrical",
  tags: ["Required", "Electrical", "Critical"],
  checks: [
    "Generator pad and placement per plans and clearances",
    "Electrical connection and transfer switch per NEC 702",
    "Fuel line installation per FBC-FG",
    "Generator grounding per NEC 250.34",
  ],
  refs: "NEC 250.34 · 445.10 · 445.13 · 702.4 · FBC-M 304.1 · FBC-FG 401.1",
};

const GENERATOR_FINAL_ELECTRICAL: InspectionPhase = {
  phase: "Final Electrical", code: "617", title: "Generator Final Electrical",
  tags: ["Required", "Electrical", "Critical"],
  checks: [
    "Generator operational test — starts, runs, transfers under load",
    "Transfer switch operation manual and automatic",
    "Labeling and signage at service, ATS, and disconnect",
    "Sound and vibration within acceptable levels",
  ],
  refs: "NEC 445.11 · 702.4 · 702.7 · FBC-B 110.3",
};

const WH_ROUGH_PLUMBING: InspectionPhase = {
  phase: "Rough Plumbing", code: "412", title: "Water Heater Rough Plumbing",
  tags: ["Required", "Plumbing", "Critical"],
  checks: [
    "Water heater specifications match approved equipment",
    "TPR valve and discharge pipe per code (full-size, terminates safely)",
    "Drain pan and drain line properly installed",
    "Supply connections to code",
  ],
  refs: "FBC-P 607.1 · 607.4 · 607.5",
};

const WH_FINAL_PLUMBING: InspectionPhase = {
  phase: "Final Plumbing", code: "618", title: "Water Heater Final Plumbing",
  tags: ["Required", "Plumbing", "Critical"],
  checks: [
    "Operational test — hot water reaches all fixtures",
    "No visible leaks at any connection",
    "Seismic strapping installed where required",
  ],
  refs: "FBC-P 312.1 · 607.1",
};

const HVAC_CHANGEOUT_FINAL: InspectionPhase = {
  phase: "Final Mechanical/HVAC", code: "619", title: "HVAC Changeout Final",
  tags: ["Required", "Mechanical", "Critical"],
  checks: [
    "System operational test — heating and cooling produced",
    "Equipment installed with required clearances",
    "Equipment labels and data plates match approved equipment",
    "Thermostat operation verified",
  ],
  refs: "FBC-M 304.1",
};

// ---------- Guides ----------

const MF_DETACHED_GARAGE: PortalGuide = {
  slug: "multi-family-detached-garage",
  category: "Multi Family",
  title: "Multi Family Detached Garage",
  docCount: 5, inspectionCount: 19, lastUpdated: REVIEWED,
  summary: "Detached garage new construction — 19-phase inspection sequence.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing garage layout and framing.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and construction footprint.", required: "always" },
    { name: "Energy Compliance Forms", description: "Energy compliance documentation per FBC Chapter 13 / IECC. Required if garage includes conditioned space.", required: "conditional" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Truss engineering package or deferral letter. Required only when structure uses pre-engineered trusses not shown in the sealed plan set.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Structural Wall Section and Load Path", tags: ["Life Safety"], description: "Continuous wall section from foundation through roof showing framing, sheathing, connectors, and uplift resistance.", code: "FBC-R R301 · R602 · R802" },
    { n: "04", title: "Detached-Structure Setback", tags: ["Life Safety"], description: "Detached-structure setback and fire separation from other buildings per FBC.", code: "FBC-R R302" },
    { n: "05", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
    { n: "06", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "AFCI protection for branch circuits per NEC 210.12; GFCI per NEC 210.8 at required locations.", code: "NEC 210.8 · 210.12" },
    { n: "07", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
  ],
  inspections: NEW_DWELLING_SEQ,
};

const MF_ELECTRICAL_ONLY: PortalGuide = {
  slug: "multi-family-electrical-only",
  category: "Multi Family",
  title: "Multi Family Electrical Only",
  docCount: 2, inspectionCount: 11, lastUpdated: REVIEWED,
  summary: "Electrical-only multi-family scope — rough and final electrical.",
  documents: [
    { name: "Sealed Electrical Plans", description: "Electrical plans sealed by a Florida-registered design professional.", required: "always" },
    { name: "Load Calculations", description: "Required if scope includes service upgrade or panel replacement.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit circuits; GFCI at required locations.", code: "NEC 210.8 · 210.12" },
    { n: "02", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
    { n: "03", title: "Plan Review Applicability (Minor Repairs)", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review not required for minor electrical repairs. Flōridian reviews when the building department requires or client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [ELECTRICAL_ONLY_ROUGH, FINAL_ELECTRICAL],
};

const MF_FENCE: PortalGuide = {
  slug: "multi-family-fence",
  category: "Multi Family",
  title: "Multi Family Fence",
  docCount: 2, inspectionCount: 4, lastUpdated: REVIEWED,
  summary: "Multi-family fence — final building inspection.",
  documents: [
    { name: "Site Plan", description: "Showing fence location, height, and relationship to property boundaries.", required: "always" },
    { name: "Product Specifications", description: "For fence materials and design.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Fence design must address wind loads per the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Pool Barrier Compliance (if applicable)", tags: ["Life Safety"], description: "Where fence acts as pool barrier, must meet FBC-R R4501.17 / ISPSC 305.", code: "FBC-R R4501.17 · ISPSC 305" },
    { n: "03", title: "Engineer of Record Seal", tags: ["Documentation"], description: "When required, structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [FENCE_FINAL_BUILDING],
};

const MF_FLOOD_PANEL: PortalGuide = {
  slug: "multi-family-flood-panel-installation",
  category: "Multi Family",
  title: "Multi Family Flood Panel Installation",
  docCount: 3, inspectionCount: 4, lastUpdated: REVIEWED,
  summary: "Flood panel installation for multi-family — final building inspection.",
  documents: [
    { name: "Florida Product Approval (Flood Panel/Barrier)", description: "State-approved flood panel or flood barrier product certification.", required: "always" },
    { name: "Installation Details / Anchor Schedule", description: "Detailed drawings showing fastener type, spacing, and embedment.", required: "always" },
    { name: "Site Plan / Survey", description: "Property boundaries and locations of all flood panel installations.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details must show fastener type, spacing, and embedment between new work and existing structure.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "02", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "03", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [FLOOD_PANEL_FINAL],
};

const MF_DECK_DOCK: PortalGuide = {
  slug: "multi-family-framed-deck-dock",
  category: "Multi Family",
  title: "Multi Family Framed Deck/Dock",
  docCount: 2, inspectionCount: 15, lastUpdated: REVIEWED,
  summary: "Multi-family framed deck or dock — rough framing and final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Sealed drawings for deck/dock framing, connections, and foundation.", required: "always" },
    { name: "Site Plan / Survey", description: "Property boundaries and location of the deck/dock structure.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between new work and existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "04", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [DECK_ROUGH_FRAMING, FINAL_BUILDING],
};

const MF_GENERATOR: PortalGuide = {
  slug: "multi-family-generator-install",
  category: "Multi Family",
  title: "Multi Family Generator Install",
  docCount: 3, inspectionCount: 8, lastUpdated: REVIEWED,
  summary: "Multi-family generator installation — rough and final electrical.",
  documents: [
    { name: "Equipment Specifications", description: "Generator capacity, fuel type, output rating.", required: "always" },
    { name: "Electrical Load Calculations", description: "Showing generator capacity vs loads it will serve.", required: "always" },
    { name: "Site Plan", description: "Generator placement, clearances, and fuel supply routing.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Generator Disconnect, Transfer Switch, and Labeling", tags: ["Life Safety"], description: "Disconnect, transfer switch, and labeling requirements per NEC.", code: "NEC 230.82 · 445 · 702" },
    { n: "02", title: "Grounding and Bonding", tags: ["Life Safety"], description: "Grounding electrode, equipment grounding, and bonding per NEC Article 250.", code: "NEC 250" },
    { n: "03", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review not required for minor scope. Flōridian reviews when required by building department or client.", code: "FBC-B 107.3.5" },
  ],
  inspections: [GENERATOR_ROUGH_ELECTRICAL, GENERATOR_FINAL_ELECTRICAL],
};

const MF_WATER_HEATER: PortalGuide = {
  slug: "multi-family-hot-water-heater-changeout",
  category: "Multi Family",
  title: "Multi Family Hot Water Heater Changeout",
  docCount: 2, inspectionCount: 7, lastUpdated: REVIEWED,
  summary: "Hot water heater changeout — rough and final plumbing.",
  documents: [
    { name: "Equipment Specifications", description: "Model, capacity, fuel type, input rating.", required: "always" },
    { name: "AHRI Certification Sheet", description: "Showing Uniform Energy Factor (UEF) rating.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Water Heater Installation Requirements", tags: ["Code"], description: "Installation, TPR, venting, and combustion air requirements.", code: "FBC-P 504 · FBC-M 303 · FBC-FG" },
    { n: "02", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review not required for like-for-like water heater changeout.", code: "FBC-B 107.3.5" },
  ],
  inspections: [WH_ROUGH_PLUMBING, WH_FINAL_PLUMBING],
};

const MF_HVAC_CHANGEOUT: PortalGuide = {
  slug: "multi-family-hvac-changeout",
  category: "Multi Family",
  title: "Multi Family HVAC Changeout",
  docCount: 3, inspectionCount: 4, lastUpdated: REVIEWED,
  summary: "HVAC changeout — final mechanical inspection.",
  documents: [
    { name: "AHRI Certification Sheet", description: "Matched system ratings for replacement HVAC equipment.", required: "always" },
    { name: "Survey / Site Plan", description: "Required if HVAC system is being relocated.", required: "conditional" },
    { name: "Sketch or Plans", description: "Required if HVAC system is being relocated.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Combustion Air and Venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires combustion air and proper venting.", code: "FBC-M 303 · 804 · FBC-FG" },
    { n: "02", title: "HVAC Changeout Installation Requirements", tags: ["Code"], description: "Refrigerant, condensate, energy, and electrical connection requirements.", code: "FBC-M 307 · 1101 · FBC-E R403 · NEC 440" },
    { n: "03", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review not required for like-for-like HVAC changeout.", code: "FBC-B 107.3.5" },
  ],
  inspections: [HVAC_CHANGEOUT_FINAL],
};

// Silence unused-import warnings for shared blocks retained for parity with other batches.
export const _batch8UnusedRefs = [FINAL_PLUMBING];

export const GUIDES_BATCH_8: PortalGuide[] = [
  MF_DETACHED_GARAGE,
  MF_ELECTRICAL_ONLY,
  MF_FENCE,
  MF_FLOOD_PANEL,
  MF_DECK_DOCK,
  MF_GENERATOR,
  MF_WATER_HEATER,
  MF_HVAC_CHANGEOUT,
];
