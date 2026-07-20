// Single Family project guides — batch 5.
import type { PortalGuide, InspectionPhase, PlanReviewItem } from "./portal-guides-data";
import {
  REVIEWED, STANDARD_DOWNLOADS, NTBO_OWNER,
  ROUGH_FRAMING, ROOF_DRY_IN, ROUGH_PLUMBING, ROUGH_ELECTRICAL, ROUGH_HVAC,
  INSULATION, LATHE_SIDING, DRYWALL,
  FINAL_ELECTRICAL, FINAL_PLUMBING, FINAL_HVAC, FINAL_BUILDING,
  FOOTING_SLAB_UFER, FULL_DWELLING,
} from "./portal-guides-batch-4";

// ---------- Additional shared phase blocks ----------

const UNDERGROUND_PLUMBING: InspectionPhase = {
  phase: "Underground Plumbing", code: "401", title: "Underground Plumbing",
  tags: ["Required", "Plumbing", "Critical"],
  checks: [
    "Pipe material meets code; sizing per design",
    "Burial depth meets code minimums",
    "Drain slope and support at required intervals",
    "Pressure test performed and passed",
    "Cleanouts at required, accessible locations",
  ],
  refs: "FBC-P 305.1 · 305.5 · 312.2 · 604.1 · 704.1 · 708.1",
};

const UNDERGROUND_ELECTRICAL: InspectionPhase = {
  phase: "Underground Electrical", code: "201", title: "Underground Electrical",
  tags: ["Conditional", "Electrical"],
  checks: [
    "Approved underground conduit; continuous and sealed",
    "Burial depth meets code for wiring method",
    "UFER concrete-encased electrode installed and accessible",
    "Conduit protected from physical damage where required",
  ],
  refs: "NEC 300.5 · 300.5(D) · 250.52(A)(3)",
};

const FILL_CELL_TIE_BEAM: InspectionPhase = {
  phase: "Fill Cell, Tie Beam, Lintel", code: "102", title: "Fill Cell, Tie Beam, Lintel",
  tags: ["Conditional", "Structural", "Critical"],
  checks: [
    "Masonry cells filled with grout; mix and consolidation verified",
    "Tie beam rebar size, quantity, and placement per plans",
    "Lintel rebar and bearing length per plans",
    "Vertical rebar located per approved structural plans",
  ],
  refs: "FBC-R R609.1 · R609.1.1 · R609.7",
};

const ROOF_SHEATHING: InspectionPhase = {
  phase: "Roof Sheathing", code: "303", title: "Roof Sheathing",
  tags: ["Conditional", "Structural", "Critical"],
  checks: [
    "Fastener type, size, and spacing per approved high-wind schedule",
    "Sheathing panel type and thickness per plans",
    'Panel gap spacing (1/8") maintained at all edges',
  ],
  refs: "FBC-R R803.1 · R803.2 · R802.11",
};

const WALL_SHEATHING: InspectionPhase = {
  phase: "Wall Sheathing", code: "304", title: "Wall Sheathing",
  tags: ["Conditional", "Structural", "Critical"],
  checks: [
    "Fastener type, size, and spacing per wind-resistant attachment schedule",
    "Sheathing panel type and thickness per plans",
    "Panel gap spacing maintained at all edges",
  ],
  refs: "FBC-R R602.3",
};

const TRUSS_TIE_DOWN: InspectionPhase = {
  phase: "Truss Tie Down and Engineering", code: "305", title: "Truss Tie Down and Engineering",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Trusses installed at spacing and alignment per approved layout",
    "Hurricane ties and uplift connectors at every truss-to-wall bearing",
    "Permanent truss bracing per truss engineering",
    "Approved truss engineering documents on site",
    "Gable end bracing per plans and truss engineering",
  ],
  refs: "FBC-R R802.10 · R802.10.1 · R802.10.3 · R802.11",
};

const TIE_DOWN: InspectionPhase = {
  phase: "Tie Down", code: "111", title: "Tie Down (Mobile Home)",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Ground anchors and tie-down straps per manufacturer specs and engineering",
    "Anchor count and spacing match tie-down engineering",
    "Straps properly tensioned and connected to frame rails",
    "Piers and pads properly placed and level under home",
  ],
  refs: "FBC-R R301.2.1 · FBC-B 3103.1",
};

const TEMP_POWER: InspectionPhase = {
  phase: "Temporary Power", code: "210", title: "Temporary Power",
  tags: ["Required", "Electrical", "Critical"],
  checks: [
    "Temporary pole set with meter base and disconnect",
    "Grounding rod installed and connected to temporary panel",
    "All temporary receptacles GFCI protected",
  ],
  refs: "NEC 250.52 · 590.4 · 590.6",
};

const SOFFIT: InspectionPhase = {
  phase: "Soffit", code: "307", title: "Soffit",
  tags: ["Required", "Critical"],
  checks: [
    "Soffit material per approved plans; properly attached",
    "Ventilation openings properly sized and screened",
    "Soffit installed continuously with no gaps",
  ],
  refs: "FBC-R R703.1 · R806.1",
};

// Extended framing block with party-wall/duplex additions
const ROUGH_FRAMING_PARTY: InspectionPhase = {
  ...ROUGH_FRAMING,
  title: "Rough Framing (with Party Wall)",
  checks: [
    ...ROUGH_FRAMING.checks,
    "Fire separation wall framing achieves required rating; extends foundation to underside of roof/ceiling",
    "Draft stops installed at required intervals within party wall concealed spaces",
  ],
  refs: ROUGH_FRAMING.refs + " · R302.1 · R302.2 · R302.4",
};

const DRYWALL_PARTY: InspectionPhase = {
  ...DRYWALL,
  title: "Drywall (with Party Wall)",
  checks: [
    ...DRYWALL.checks,
    "Party wall drywall assembly achieves required fire-resistance with correct layers/type",
    "All penetrations through fire-rated party wall firestopped with listed materials",
  ],
  refs: DRYWALL.refs + " · R302.1 · R302.2 · R302.4",
};

const FINAL_BUILDING_PARTY: InspectionPhase = {
  ...FINAL_BUILDING,
  title: "Final Building (with Party Wall)",
  checks: [
    ...FINAL_BUILDING.checks,
    "Fire-rated party wall continuous foundation-to-roof; penetrations firestopped; wall integrity intact",
  ],
  refs: FINAL_BUILDING.refs + " · R302.1 · R302.2 · R302.4",
};

// Full new-construction dwelling sequence (19-phase)
const NEW_DWELLING_SEQ = [
  UNDERGROUND_PLUMBING,
  UNDERGROUND_ELECTRICAL,
  FOOTING_SLAB_UFER,
  FILL_CELL_TIE_BEAM,
  ROUGH_FRAMING,
  ROOF_SHEATHING,
  WALL_SHEATHING,
  TRUSS_TIE_DOWN,
  ROOF_DRY_IN,
  ROUGH_PLUMBING,
  ROUGH_ELECTRICAL,
  ROUGH_HVAC,
  INSULATION,
  LATHE_SIDING,
  DRYWALL,
  FINAL_ELECTRICAL,
  FINAL_PLUMBING,
  FINAL_HVAC,
  FINAL_BUILDING,
];

// ---------- Guides ----------

const CUSTOM_SHED: PortalGuide = {
  slug: "custom-shed-construction",
  category: "Single Family",
  title: "Custom Shed Construction",
  docCount: 3, inspectionCount: 15, lastUpdated: REVIEWED,
  summary: "Custom (non-prototype) shed — rough framing and final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional showing shed layout/framing plus wind load criteria and anchor method.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for structural components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and shed footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Plan Review Applicability", tags: ["Documentation"], description: "Custom shed is not a prototype and falls outside 1 & 2 family minimum criteria.", code: "FBC-B 107.3.5" },
    { n: "04", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [ROUGH_FRAMING, FINAL_BUILDING],
};

const DUPLEX_PLAN_REVIEW: PlanReviewItem[] = [
  { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed and exposure category.", code: "FBC-R R301.2.1 · ASCE 7-22" },
  { n: "02", title: "Egress from Sleeping Rooms", tags: ["Life Safety"], description: "Each sleeping room requires an emergency escape opening meeting R310 dimensions.", code: "FBC-R R310" },
  { n: "03", title: "Smoke and CO Alarm Coverage", tags: ["Life Safety"], description: "Smoke alarms required in bedrooms, outside sleeping areas, and on each story. CO alarms required where applicable.", code: "FBC-R R314 · R315" },
  { n: "04", title: "Structural Wall Section and Load Path", tags: ["Life Safety"], description: "Continuous wall section showing framing, sheathing, connectors, and uplift resistance.", code: "FBC-R R301 · R602 · R802" },
  { n: "05", title: "Fire-Rated Unit Separation", tags: ["Life Safety"], description: "Dwelling-unit separations must maintain the required fire-resistance rating.", code: "FBC-B 420 · 708 · 711" },
  { n: "06", title: "Florida Product Approval", tags: ["Code"], description: "Regulated products require a valid FL# or Miami-Dade NOA.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
  { n: "07", title: "Combustion Air and Venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires proper combustion air supply and venting.", code: "FBC-M 303 · 804 · FBC-FG" },
  { n: "08", title: "Manual J / S / D Load Calculation", tags: ["Code"], description: "HVAC sizing, equipment selection, and duct design must be supported by Manual J/S/D calculations.", code: "FBC-R M1401.3 · FBC-M 309" },
  { n: "09", title: "Ventilation", tags: ["Code"], description: "Whole-house or occupancy-based ventilation per applicable code.", code: "FBC-R M1507 · FBC-M 403" },
  { n: "10", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "Branch circuits and required locations must be AFCI and GFCI protected.", code: "NEC 210.8 · 210.12" },
  { n: "11", title: "Grounding and Bonding", tags: ["Life Safety"], description: "Grounding electrode system, equipment grounding, and bonding per NEC Article 250.", code: "NEC Article 250" },
  { n: "12", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service sizing must be supported by a load calculation.", code: "NEC 220 · 230" },
  { n: "13", title: "Water Service and DWV Sizing", tags: ["Code"], description: "Sizing must be consistent with fixture unit count.", code: "FBC-P 604 · 709 · 906" },
  { n: "14", title: "Backflow Prevention", tags: ["Code"], description: "Required at wells, irrigation connections, and cross-connections.", code: "FBC-P 608" },
];

const DUPLEX_DOCS = [
  { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Complete architectural, structural, mechanical, electrical, and plumbing drawings sealed by a Florida registered design professional.", required: "always" as const },
  { name: "Energy Compliance Forms", description: "Documentation demonstrating energy code compliance per FBC Chapter 13 / IECC.", required: "always" as const },
  { name: "Product Approvals", description: "Florida Product Approvals for windows, doors, roofing, and other regulated components.", required: "always" as const },
  { name: "Site Plan / Survey", description: "Property boundaries, setbacks, building footprint, and site layout.", required: "always" as const },
  { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Required only when the structure uses pre-engineered trusses. Either full truss engineering package or a deferral affidavit must be provided.", required: "conditional" as const },
];

const NEW_DUPLEX: PortalGuide = {
  slug: "new-duplex",
  category: "Single Family",
  title: "New Duplex",
  docCount: 5, inspectionCount: 19, lastUpdated: REVIEWED,
  summary: "New duplex — full 19-phase inspection sequence with fire-rated party wall.",
  documents: [...DUPLEX_DOCS, ...NTBO_OWNER],
  downloads: STANDARD_DOWNLOADS,
  planReview: DUPLEX_PLAN_REVIEW,
  inspections: [
    UNDERGROUND_PLUMBING,
    UNDERGROUND_ELECTRICAL,
    FOOTING_SLAB_UFER,
    FILL_CELL_TIE_BEAM,
    ROUGH_FRAMING_PARTY,
    ROOF_SHEATHING,
    WALL_SHEATHING,
    TRUSS_TIE_DOWN,
    ROOF_DRY_IN,
    ROUGH_PLUMBING,
    ROUGH_ELECTRICAL,
    ROUGH_HVAC,
    INSULATION,
    LATHE_SIDING,
    DRYWALL_PARTY,
    FINAL_ELECTRICAL,
    FINAL_PLUMBING,
    FINAL_HVAC,
    FINAL_BUILDING_PARTY,
  ],
};

const SFR_PLAN_REVIEW: PlanReviewItem[] = [
  { n: "01", title: "Wind Design Criteria", tags: ["Life Safety"], description: "Plans must reflect the correct wind speed and exposure category for the project location per the Florida Building Code.", code: "FBC Structural · FBC-R R301.2.1" },
  { n: "02", title: "Emergency Escape Openings / Bedroom Egress", tags: ["Life Safety"], description: "Each sleeping room must have a compliant emergency escape and rescue opening of required minimum dimensions and sill height.", code: "FBC-R R310" },
  { n: "03", title: "Smoke and Carbon Monoxide Alarms", tags: ["Life Safety"], description: "Smoke alarms and CO alarms must be shown in required locations on plans, including interconnection and power source.", code: "FBC-R R314 · R315" },
  { n: "04", title: "Dwelling Unit and Garage Separation", tags: ["Life Safety"], description: "Fire separation between the attached garage and living space must meet minimum assembly requirements.", code: "FBC-R R302" },
  { n: "05", title: "Stair Geometry", tags: ["Code"], description: "Stair rise, run, headroom, and handrail dimensions must comply with code-prescribed limits.", code: "FBC-R R311" },
  { n: "06", title: "Truss / Roof Framing Package", tags: ["Code"], description: "Engineered truss drawings or conventional roof framing details must be included and coordinated with structural plans.", code: "FBC Structural · FBC-R R802" },
  { n: "07", title: "Designer of Record Documentation", tags: ["Documentation"], description: "Plans must identify the designer of record with appropriate licensure information and signature/seal.", code: "FBC-B 107" },
  { n: "08", title: "Ventilation and Combustion Air", tags: ["Life Safety"], description: "Mechanical plans must show adequate ventilation and combustion air provisions for fuel-burning appliances.", code: "FBC-M 303 · 403" },
  { n: "09", title: "HVAC Equipment Sizing", tags: ["Code"], description: "Equipment must be sized per Manual J or equivalent load calculation documentation.", code: "FBC-M 309 · FBC-R M1401.3" },
  { n: "10", title: "AFCI and GFCI Coverage", tags: ["Life Safety"], description: "Electrical plans must identify all circuits requiring AFCI and GFCI protection per code.", code: "NEC 210.8 · 210.12" },
  { n: "11", title: "Service Size and Panel Schedule", tags: ["Code"], description: "Electrical service size and panel schedule must be shown and match the proposed load.", code: "NEC 220 · 230" },
  { n: "12", title: "Receptacle Spacing in Habitable Rooms", tags: ["Documentation"], description: "Plans must reflect required receptacle spacing in all habitable rooms.", code: "NEC 210.52" },
  { n: "13", title: "Water Heater Location and Venting", tags: ["Life Safety"], description: "Water heater placement and venting must be shown on plans with proper clearances and termination.", code: "FBC-P 607" },
  { n: "14", title: "DWV and Water Supply Routing", tags: ["Documentation"], description: "Drain, waste, vent, and supply piping must be diagrammed or shown on plans with sizing noted.", code: "FBC-P 604 · 704 · 903" },
];

const NEW_SFD: PortalGuide = {
  slug: "new-single-family-detached-residence",
  category: "Single Family",
  title: "New Single Family Detached Residence",
  docCount: 5, inspectionCount: 19, lastUpdated: REVIEWED,
  summary: "New site-built single family detached residence — full 19-phase inspection sequence.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Signed and sealed architectural/structural drawings prepared by a Florida-licensed design professional.", required: "always" },
    { name: "Energy Compliance Forms", description: "Documentation demonstrating compliance with Florida energy code requirements.", required: "always" },
    { name: "Product Approvals", description: "Florida Building Code product approval documentation for windows, doors, roofing, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Surveyed site plan showing property boundaries, setbacks, and proposed construction footprint.", required: "always" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Engineered truss drawings and layout plan, or a signed deferral affidavit if truss engineering is submitted after permit issuance.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: SFR_PLAN_REVIEW,
  inspections: NEW_DWELLING_SEQ,
};

const NEW_MOBILE_HOME: PortalGuide = {
  slug: "new-single-family-mobile-home",
  category: "Single Family",
  title: "New Single Family Mobile Home",
  docCount: 2, inspectionCount: 22, lastUpdated: REVIEWED,
  summary: "New mobile/manufactured home set — tie-down and site finals.",
  documents: [
    { name: "Site Plan / Survey", description: "Property layout and boundaries.", required: "always" },
    { name: "Tie-Down Engineering / Manufacturer Install Manual", description: "Anchor and installation specifications.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details showing fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Plan Review Applicability — Building", tags: ["Documentation"], description: "Exemption applies except for foundations, modifications, and local site adaptations.", code: "FBC-B 107.3.5" },
    { n: "04", title: "Combustion Air and Venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires combustion air and proper venting.", code: "FBC-M 303 · 804 · FBC-FG" },
    { n: "05", title: "Plan Review Applicability — Mechanical", tags: ["Documentation"], description: "Factory-built systems exempt per exemption #6.", code: "FBC-B 107.3.5" },
    { n: "06", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
    { n: "07", title: "Plan Review Applicability — Electrical", tags: ["Documentation"], description: "Exemption applies except for service connections.", code: "FBC-B 107.3.5" },
  ],
  inspections: [TIE_DOWN, FINAL_BUILDING, FINAL_ELECTRICAL, FINAL_HVAC],
};

const NEW_MODULAR: PortalGuide = {
  slug: "new-single-family-modular-home",
  category: "Single Family",
  title: "New Single Family Modular Home",
  docCount: 4, inspectionCount: 49, lastUpdated: REVIEWED,
  summary: "New modular (factory-built) single family home — foundation, tie-down, site finals.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Sealed construction plans prepared and stamped by a Florida Registered Design Professional.", required: "always" },
    { name: "Energy Compliance Forms", description: "Forms demonstrating compliance with Florida energy code requirements.", required: "always" },
    { name: "Product Approvals", description: "Documentation of product approvals for materials and components used in construction.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing the property and placement of the modular home.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Plan Review Applicability — Building", tags: ["Documentation"], description: "Per FBC-B 107.3.5, manufactured/modular building plans are exempt except for foundations and modifications (Exemption #6).", code: "FBC-B 107.3.5" },
    { n: "04", title: "Combustion Air and Venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires combustion air and proper venting per FBC-M 303 / 804.", code: "FBC-M 303 · 804 · FBC-FG" },
    { n: "05", title: "Plan Review Applicability — Mechanical", tags: ["Documentation"], description: "Per FBC-B 107.3.5, modular plans are exempt for factory-built systems.", code: "FBC-B 107.3.5" },
    { n: "06", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
    { n: "07", title: "Plan Review Applicability — Electrical", tags: ["Documentation"], description: "Per FBC-B 107.3.5, modular plans are exempt except for service connections.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    FOOTING_SLAB_UFER,
    TIE_DOWN,
    ROUGH_ELECTRICAL,
    ROUGH_HVAC,
    TEMP_POWER,
    SOFFIT,
    LATHE_SIDING,
    FINAL_BUILDING,
    FINAL_ELECTRICAL,
    FINAL_HVAC,
  ],
};

const NEW_TOWNHOME: PortalGuide = {
  slug: "new-townhome",
  category: "Single Family",
  title: "New Townhome",
  docCount: 5, inspectionCount: 96, lastUpdated: REVIEWED,
  summary: "New townhome — full 19-phase inspection sequence with fire-rated party wall between units.",
  documents: [...DUPLEX_DOCS, ...NTBO_OWNER],
  downloads: STANDARD_DOWNLOADS,
  planReview: DUPLEX_PLAN_REVIEW,
  inspections: [
    UNDERGROUND_PLUMBING,
    UNDERGROUND_ELECTRICAL,
    FOOTING_SLAB_UFER,
    FILL_CELL_TIE_BEAM,
    ROUGH_FRAMING_PARTY,
    ROOF_SHEATHING,
    WALL_SHEATHING,
    TRUSS_TIE_DOWN,
    ROOF_DRY_IN,
    ROUGH_PLUMBING,
    ROUGH_ELECTRICAL,
    ROUGH_HVAC,
    INSULATION,
    LATHE_SIDING,
    DRYWALL_PARTY,
    FINAL_ELECTRICAL,
    FINAL_PLUMBING,
    FINAL_HVAC,
    FINAL_BUILDING_PARTY,
  ],
};

const ADU_DETACHED: PortalGuide = {
  slug: "single-family-accessory-dwelling-unit-detached",
  category: "Single Family",
  title: "Single Family Accessory Dwelling Unit (Detached)",
  docCount: 5, inspectionCount: 19, lastUpdated: REVIEWED,
  summary: "New detached accessory dwelling unit (ADU) — full 19-phase inspection sequence.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Complete set of construction drawings for the ADU.", required: "always" },
    { name: "Energy Compliance Forms", description: "Energy compliance documentation per FBC Chapter 13 / IECC.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, doors, roofing, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and ADU footprint.", required: "always" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Truss engineering package, conventional framing per FBC, or a truss deferral letter. Only when structure uses pre-engineered trusses and truss engineering is not shown in the sealed plan set.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure Category", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22 Ch. 26" },
    { n: "02", title: "Egress from Sleeping Rooms", tags: ["Life Safety"], description: "Each sleeping room must have an emergency escape and rescue opening meeting R310 dimensions.", code: "FBC-R R310" },
    { n: "03", title: "Smoke and CO Alarm Coverage", tags: ["Life Safety"], description: "Smoke alarms in each sleeping room, outside each sleeping area, and on each story. CO alarms where fuel-fired appliances or attached garages exist.", code: "FBC-R R314 · R315" },
    { n: "04", title: "Structural Wall Section and Load Path", tags: ["Life Safety"], description: "A continuous wall section from foundation through roof must show framing, sheathing, connectors, and wind/uplift resistance.", code: "FBC-R R301 · R602 · R802" },
    { n: "05", title: "ADU Size and Occupancy (Local Ordinance)", tags: ["Documentation"], description: "Many jurisdictions cap ADU size, require owner-occupancy, or restrict short-term rental. Verify compliance with the adopting ordinance where applicable.", code: "Local ADU ordinance · FBC-R Table R302.1" },
    { n: "06", title: "Manual J / Manual S / Manual D Load Calculation", tags: ["Code"], description: "HVAC equipment sizing based on Manual J load calculation; equipment selection per Manual S; duct design per Manual D.", code: "FBC-R M1401.3 · FBC-M 309" },
    { n: "07", title: "Whole-House Ventilation", tags: ["Code"], description: "Mechanical ventilation meeting FBC-R M1507 is required for new dwelling units.", code: "FBC-R M1507 · ASHRAE 62.2" },
    { n: "08", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI for bathrooms, kitchens, exterior, garages, laundry, unfinished basements, crawl spaces per NEC 210.8.", code: "NEC 210.8 · 210.12" },
    { n: "09", title: "Service Size and Load Calculation", tags: ["Code"], description: "Dedicated electrical service to the ADU with panel/feeder sized per NEC load calculation.", code: "NEC 220 · 230" },
    { n: "10", title: "Water Service and DWV Sizing", tags: ["Code"], description: "Water service line sizing and drain/waste/vent sizing consistent with fixture unit count.", code: "FBC-P 604 · 709 · 906" },
    { n: "11", title: "Backflow Prevention (Well or Irrigation)", tags: ["Code"], description: "Backflow prevention required at well connection or irrigation takeoffs per FBC-P 608.", code: "FBC-P 608" },
  ],
  inspections: NEW_DWELLING_SEQ,
};

const SF_ALTERATION: PortalGuide = {
  slug: "single-family-alteration",
  category: "Single Family",
  title: "Single Family Alteration",
  docCount: 3, inspectionCount: 61, lastUpdated: REVIEWED,
  summary: "Single family alteration — full inspection sequence conditional on scope.",
  documents: [
    { name: "Scope of Work Description", description: "Very detailed written scope of work describing all work to be performed.", required: "always" },
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional reflecting the full scope of alteration work.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for any regulated components. Required if installing new windows, doors, roofing, or other regulated products.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Structural Impact of Scope", tags: ["Life Safety"], description: "Verify new beam/header design is provided and sealed if load-bearing walls are affected.", code: "FBC-EB 502 · FBC-R R301 · R502" },
    { n: "02", title: "Existing Condition Compliance", tags: ["Life Safety"], description: "Verify existing emergency egress and smoke/CO alarms meet or are upgraded to current code.", code: "FBC-EB 705 · FBC-R R310 · R314 · R315" },
    { n: "03", title: "Window/Door Replacement Wind Compliance", tags: ["Life Safety"], description: "Verify product approvals (FL# or NOA) for wind and HVHZ if applicable.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "HVAC Equipment Changeout", tags: ["Code"], description: "Verify equipment schedule with capacity matches scope.", code: "FBC-M 403 · FBC-E R403" },
    { n: "05", title: "AFCI/GFCI Upgrade in Work Area", tags: ["Life Safety"], description: "Verify AFCI/GFCI coverage in kitchens, bathrooms, bedrooms, or wet locations.", code: "NEC 210.8 · 210.12" },
    { n: "06", title: "Fixture Additions in Remodel Scope", tags: ["Documentation"], description: "Verify basic fixture layout and water heater adequacy are noted.", code: "FBC-P 701 · 901" },
  ],
  inspections: FULL_DWELLING,
};

export const GUIDES_BATCH_5: PortalGuide[] = [
  CUSTOM_SHED,
  NEW_DUPLEX,
  NEW_SFD,
  NEW_MOBILE_HOME,
  NEW_MODULAR,
  NEW_TOWNHOME,
  ADU_DETACHED,
  SF_ALTERATION,
];
