// Multi Family project guides — batch 9.
import type { PortalGuide, InspectionPhase } from "./portal-guides-data";
import {
  REVIEWED, STANDARD_DOWNLOADS, NTBO_OWNER,
  ROUGH_FRAMING, ROUGH_PLUMBING, ROUGH_ELECTRICAL,
  INSULATION, DRYWALL,
  FINAL_BUILDING, FINAL_ELECTRICAL, FINAL_PLUMBING,
  FOOTING_SLAB_UFER,
} from "./portal-guides-batch-4";

// ---------- Shared inline blocks ----------

const FRAMING_ONLY: InspectionPhase = { ...ROUGH_FRAMING, title: "Framing" };

const ALUM_FOOTER: InspectionPhase = {
  phase: "Footer / Slab", code: "101", title: "Footer / Slab — Aluminum Structure",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Footing dimensions, depth, and rebar per engineered plans",
    "Anchor bolt / embed layout matches manufacturer engineering",
    "Concrete cover and formwork verified prior to pour",
  ],
  refs: "FBC-R R403 · FBC-B 1809 · ACI 318",
};

const ALUM_FRAMING: InspectionPhase = {
  phase: "Rough Framing", code: "302", title: "Framing — Aluminum Structure",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Column, beam, and rafter sizes per manufacturer engineering",
    "Fastener type, spacing, and embedment match approved plans",
    "Attachment to existing structure per engineered detail",
    "Product approval number matches installed components",
  ],
  refs: "FBC-B 2002 · FBC-R R301.2.1.2 · Manufacturer PE package",
};

const ALUM_FINAL: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Aluminum Structure",
  tags: ["Required", "Critical"],
  checks: [
    "Completed structure matches approved plans and product approval",
    "All fasteners installed and torqued per manufacturer specs",
    "Sealants and flashing at attachment points to existing structure",
    "Screen or panel infill installed and secured",
  ],
  refs: "FBC-B 110.3 · FBC-B 2002",
};

const DEMO_PRE: InspectionPhase = {
  phase: "Pre-Demolition", code: "100", title: "Pre-Demolition Inspection",
  tags: ["Required", "Life Safety", "Critical"],
  checks: [
    "Asbestos survey and clearance letter on site",
    "Utility disconnect confirmations for electric, gas, water, and sewer",
    "Site safety plan and perimeter protection in place",
    "Rodent/pest abatement documentation where required",
  ],
  refs: "FBC-B 3303 · FS 469 · EPA NESHAP 40 CFR 61 Subpart M",
};

const DEMO_FINAL: InspectionPhase = {
  phase: "Final Site", code: "610", title: "Final Site Inspection — Demolition",
  tags: ["Required", "Critical"],
  checks: [
    "Structure fully removed to grade",
    "Debris removed and site restored per approved plans",
    "Utilities capped and terminated at approved locations",
    "Erosion control and site stabilization in place",
  ],
  refs: "FBC-B 3303 · Local land development code",
};

const FENCE_POST: InspectionPhase = {
  phase: "Post Setting", code: "101", title: "Post Setting",
  tags: ["Required", "Structural"],
  checks: [
    "Post spacing, depth, and embedment per approved plans",
    "Concrete footing size and set per engineered detail",
    "Setback and layout match approved site plan",
  ],
  refs: "FBC-R R301.1 · Local zoning",
};

const FENCE_FINAL: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Fence",
  tags: ["Required", "Critical"],
  checks: [
    "Fence height, setback, and materials per approved plans",
    "Pool barrier compliance where fence acts as barrier (self-closing/self-latching gate, no climbable elements)",
    "Fasteners and connections per manufacturer specs",
  ],
  refs: "FBC-R R301.1 · R4501.17 · ISPSC 305",
};

const FLOOD_PANEL_FINAL: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Flood Panel",
  tags: ["Required", "Life Safety", "Critical"],
  checks: [
    "Installed product matches Florida Product Approval / NOA on file",
    "Track, mounting, and anchor pattern per manufacturer specs",
    "Coverage of all required openings per approved plans",
    "Panel storage and labeling per manufacturer instructions",
  ],
  refs: "FBC-B 1612 · FBC-R R301.2.1.2 · Manufacturer NOA",
};

// ---------- Guides ----------

const MF_ALTERATION: PortalGuide = {
  slug: "multi-family-alteration",
  category: "Multi Family",
  title: "Multi Family Alteration",
  docCount: 6, inspectionCount: 8, lastUpdated: REVIEWED,
  summary: "Multi-family interior/exterior alteration — full rough-through-final sequence.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Site / Survey Plan", description: "Current survey showing property lines, setbacks, and improvement locations.", required: "always" },
    { name: "Architectural Drawings", description: "Floor plan and elevations sealed by a Florida-registered design professional.", required: "always" },
    { name: "Structural Drawings", description: "Required where alteration affects structural elements.", required: "conditional" },
    { name: "Product Approvals", description: "Florida Product Approvals or NOAs for regulated windows, doors, and assemblies.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Zoning Compliance", tags: ["Code"], description: "Alteration must not create nonconforming use, setback, or height violations.", code: "Local zoning · FBC-B 105.3" },
    { n: "02", title: "Structural Adequacy", tags: ["Life Safety"], description: "Existing structure must support altered loads; new work must show load path to foundation.", code: "FBC-B 3403 · FBC-EB Ch. 5" },
    { n: "03", title: "Life Safety / Egress", tags: ["Life Safety"], description: "Egress width, travel distance, and exit discharge maintained or improved.", code: "FBC-B 1006 · 1017 · 1028" },
    { n: "04", title: "ADA Compliance for Common Areas", tags: ["Code"], description: "Common areas altered must meet FBC Accessibility Ch. 11 and 2010 ADA Standards.", code: "FBC Accessibility Ch. 11 · 2010 ADAS" },
    { n: "05", title: "Fire-Rated Assembly Details", tags: ["Life Safety"], description: "Party walls, corridors, and shaft enclosures must maintain required fire-resistance ratings.", code: "FBC-B 705 · 707 · 708" },
  ],
  inspections: [
    ROUGH_FRAMING, ROUGH_ELECTRICAL, ROUGH_PLUMBING,
    INSULATION, DRYWALL,
    FINAL_ELECTRICAL, FINAL_PLUMBING, FINAL_BUILDING,
  ],
};

const MF_ALUMINUM_PATIO: PortalGuide = {
  slug: "multi-family-aluminum-patio-carport",
  category: "Multi Family",
  title: "Multi Family Aluminum (Patio/Carport)",
  docCount: 5, inspectionCount: 3, lastUpdated: REVIEWED,
  summary: "Aluminum patio or carport enclosure — footer, framing, and final building.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Site Plan", description: "Site plan showing structure location and setbacks.", required: "always" },
    { name: "Manufacturer's Engineering Drawings with Product Approval", description: "Signed & sealed engineering package with Florida Product Approval number.", required: "always" },
    { name: "Survey Showing Structure Location", description: "Current survey showing property lines and proposed structure footprint.", required: "always" },
    { name: "HOA Approval", description: "Homeowners association approval where applicable.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Setback Compliance", tags: ["Code"], description: "Structure must meet jurisdictional setbacks from property lines and other structures.", code: "Local zoning" },
    { n: "02", title: "Wind Load / Product Approval", tags: ["Life Safety"], description: "Structure engineered for design wind speed with valid Florida Product Approval or NOA.", code: "FBC-R R301.2.1 · ASCE 7-22 · FBC-B 1708" },
    { n: "03", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Attachment details specify fastener type, spacing, and embedment into existing structure.", code: "FBC-B 2002.5 · FBC-R R301.1" },
  ],
  inspections: [ALUM_FOOTER, ALUM_FRAMING, ALUM_FINAL],
};

const MF_ALUMINUM_CONCRETE_FOOTING: PortalGuide = {
  slug: "multi-family-aluminum-with-concrete-footing",
  category: "Multi Family",
  title: "Multi Family Aluminum with Concrete Footing",
  docCount: 5, inspectionCount: 3, lastUpdated: REVIEWED,
  summary: "Aluminum enclosure with engineered concrete footing — footer, framing, and final building.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Site Plan", description: "Site plan showing structure location and setbacks.", required: "always" },
    { name: "Manufacturer's Engineering Drawings", description: "Signed & sealed engineering with product approval and footing detail.", required: "always" },
    { name: "Soil Borings", description: "Geotechnical report required by engineer of record.", required: "conditional" },
    { name: "Survey Showing Location", description: "Current survey showing property lines and structure footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Setback Compliance", tags: ["Code"], description: "Structure and footing must meet jurisdictional setbacks.", code: "Local zoning" },
    { n: "02", title: "Wind Load", tags: ["Life Safety"], description: "Structure engineered for design wind speed and exposure category.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "03", title: "Footing Design", tags: ["Life Safety"], description: "Footing dimensions, reinforcement, and depth support engineered uplift and gravity loads.", code: "FBC-R R403 · FBC-B 1809 · ACI 318" },
    { n: "04", title: "Attachment Details", tags: ["Life Safety"], description: "Anchor bolts and connectors specified with type, size, spacing, and embedment.", code: "FBC-B 2002.5" },
  ],
  inspections: [{ ...FOOTING_SLAB_UFER, title: "Footer / Slab — Aluminum Structure" }, ALUM_FRAMING, ALUM_FINAL],
};

const MF_DEMOLITION: PortalGuide = {
  slug: "multi-family-demolition",
  category: "Multi Family",
  title: "Multi Family Demolition",
  docCount: 5, inspectionCount: 2, lastUpdated: REVIEWED,
  summary: "Multi-family demolition — pre-demolition and final site inspection.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Survey / Site Plan", description: "Survey showing structure to be demolished and adjacent improvements.", required: "always" },
    { name: "Asbestos Survey / Clearance Letter", description: "Florida-licensed asbestos consultant survey and, where required, clearance letter.", required: "always" },
    { name: "Utility Disconnect Confirmations", description: "Written confirmations from FPL, gas provider, water/sewer utility, and any other services.", required: "always" },
    { name: "County Demolition Permit", description: "Required where county permit is a prerequisite to municipal permit.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Asbestos Clearance Verification", tags: ["Life Safety"], description: "Asbestos survey and, where required, abatement clearance must be on file prior to demolition.", code: "EPA NESHAP 40 CFR 61 Subpart M · FS 469" },
    { n: "02", title: "Utility Disconnects Confirmed", tags: ["Life Safety"], description: "Written disconnect confirmations from each utility must be received before permit issuance.", code: "FBC-B 3303.5" },
    { n: "03", title: "Site Safety Plan", tags: ["Life Safety"], description: "Perimeter protection, pedestrian control, and adjacent-property protection detailed on plans.", code: "FBC-B 3303 · OSHA 29 CFR 1926 Subpart T" },
  ],
  inspections: [DEMO_PRE, DEMO_FINAL],
};

const MF_DETACHED_GARAGE_ALT: PortalGuide = {
  slug: "multi-family-detached-garage-alt",
  category: "Multi Family",
  title: "Multi Family Detached Garage (Alt Scope)",
  docCount: 6, inspectionCount: 7, lastUpdated: REVIEWED,
  summary: "Detached garage — abbreviated scope covering footer through final building.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Site Plan / Survey", description: "Current survey showing property lines, setbacks, and structure footprint.", required: "always" },
    { name: "Architectural Drawings", description: "Floor plan and elevations sealed by a Florida-registered design professional.", required: "always" },
    { name: "Structural / Truss Drawings", description: "Structural and truss engineering signed & sealed.", required: "always" },
    { name: "Energy Compliance", description: "Required if garage includes conditioned space.", required: "conditional" },
    { name: "Product Approvals", description: "Florida Product Approvals for regulated components.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Setback Compliance", tags: ["Code"], description: "Detached structure setbacks per zoning and FBC.", code: "FBC-R R302 · Local zoning" },
    { n: "02", title: "Zoning / Use Compliance", tags: ["Code"], description: "Accessory-structure use permitted at site.", code: "Local zoning" },
    { n: "03", title: "Wind Load", tags: ["Life Safety"], description: "Structure engineered for design wind speed and exposure category.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "04", title: "Fire Separation", tags: ["Life Safety"], description: "Where required, fire separation from other buildings per FBC.", code: "FBC-R R302" },
  ],
  inspections: [
    { ...FOOTING_SLAB_UFER, title: "Footer / Slab — Detached Garage" },
    FRAMING_ONLY,
    ROUGH_ELECTRICAL,
    { ...INSULATION, title: "Insulation (Conditioned Space Only)" },
    { ...DRYWALL, title: "Drywall (Conditioned Space Only)" },
    FINAL_ELECTRICAL,
    FINAL_BUILDING,
  ],
};

const MF_ELECTRICAL_ONLY_ALT: PortalGuide = {
  slug: "multi-family-electrical-only-alt",
  category: "Multi Family",
  title: "Multi Family Electrical Only (Alt Scope)",
  docCount: 5, inspectionCount: 2, lastUpdated: REVIEWED,
  summary: "Electrical-only multi-family scope with load calcs and panel schedule.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Load Calculations", description: "NEC Article 220 load calculations for the affected service or panel.", required: "always" },
    { name: "Panel Schedule", description: "Panel schedule showing existing and proposed circuits.", required: "always" },
    { name: "Site Plan", description: "Required if new service or exterior equipment.", required: "conditional" },
    { name: "Electrical Drawings", description: "Electrical drawings sealed where required by scope.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Load Calculation Review", tags: ["Code"], description: "Service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220" },
    { n: "02", title: "NEC Compliance", tags: ["Life Safety"], description: "Circuit sizing, conductor ampacity, and overcurrent protection per NEC.", code: "NEC 210 · 215 · 240" },
    { n: "03", title: "Service Size", tags: ["Code"], description: "Service disconnect, grounding electrode, and available fault current.", code: "NEC 230 · 250" },
    { n: "04", title: "GFCI / AFCI Requirements", tags: ["Life Safety"], description: "GFCI per NEC 210.8; AFCI per NEC 210.12 at required locations.", code: "NEC 210.8 · 210.12" },
  ],
  inspections: [ROUGH_ELECTRICAL, FINAL_ELECTRICAL],
};

const MF_FENCE_ALT: PortalGuide = {
  slug: "multi-family-fence-alt",
  category: "Multi Family",
  title: "Multi Family Fence (Alt Scope)",
  docCount: 4, inspectionCount: 2, lastUpdated: REVIEWED,
  summary: "Multi-family fence installation — post setting and final building.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Site Plan Showing Fence Location", description: "Site plan showing fence line, gates, and relationship to structures and property boundaries.", required: "always" },
    { name: "Survey", description: "Current survey showing property boundaries.", required: "always" },
    { name: "HOA Approval", description: "Homeowners association approval where applicable.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Setback and Height Compliance", tags: ["Code"], description: "Fence height and setback per zoning.", code: "Local zoning · FBC-R R301.1" },
    { n: "02", title: "Pool Barrier Requirements", tags: ["Life Safety"], description: "Where fence acts as pool barrier, must meet FBC-R R4501.17 / ISPSC 305 including self-closing/self-latching gate.", code: "FBC-R R4501.17 · ISPSC 305" },
    { n: "03", title: "Materials Specification", tags: ["Code"], description: "Fence materials and construction per approved specifications.", code: "FBC-R R301.1" },
  ],
  inspections: [FENCE_POST, FENCE_FINAL],
};

const MF_FLOOD_PANEL_ALT: PortalGuide = {
  slug: "multi-family-flood-panel-hurricane",
  category: "Multi Family",
  title: "Multi Family Flood Panel (Hurricane Protection)",
  docCount: 4, inspectionCount: 1, lastUpdated: REVIEWED,
  summary: "Hurricane flood panel installation — final building installation verification.",
  documents: [
    { name: "Completed Application", description: "Municipal permit application, fully executed.", required: "always" },
    { name: "Product Approval Numbers", description: "Florida Product Approval or Miami-Dade NOA for the flood panel system.", required: "always" },
    { name: "Site Plan Showing Openings", description: "Elevations or site plan showing all openings to be protected.", required: "always" },
    { name: "Miami-Dade NOA or FL Product Approval", description: "Manufacturer approval documentation on site during inspection.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Product Approval Verification", tags: ["Code"], description: "Installed product must match Florida Product Approval or Miami-Dade NOA on file.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "02", title: "Opening Coverage", tags: ["Life Safety"], description: "All required openings must be protected per FBC High-Velocity Hurricane Zone or design wind pressure requirements.", code: "FBC-B 1609 · 1612" },
    { n: "03", title: "Installation Method Compliance", tags: ["Life Safety"], description: "Anchor type, spacing, and embedment per manufacturer specs and product approval.", code: "Manufacturer NOA · FBC-B 2002.5" },
  ],
  inspections: [FLOOD_PANEL_FINAL],
};

// Silence unused-import warnings for shared blocks retained for parity.
export const _batch9UnusedRefs = [ROUGH_PLUMBING, FINAL_PLUMBING];

export const GUIDES_BATCH_9: PortalGuide[] = [
  MF_ALTERATION,
  MF_ALUMINUM_PATIO,
  MF_ALUMINUM_CONCRETE_FOOTING,
  MF_DEMOLITION,
  MF_DETACHED_GARAGE_ALT,
  MF_ELECTRICAL_ONLY_ALT,
  MF_FENCE_ALT,
  MF_FLOOD_PANEL_ALT,
];
