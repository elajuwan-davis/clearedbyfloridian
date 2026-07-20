// Multi Family project guides — batch 6.
import type { PortalGuide, InspectionPhase, PlanReviewItem } from "./portal-guides-data";
import {
  REVIEWED, STANDARD_DOWNLOADS, NTBO_OWNER,
  ROUGH_FRAMING, ROOF_DRY_IN, ROUGH_PLUMBING, ROUGH_ELECTRICAL, ROUGH_HVAC,
  INSULATION, LATHE_SIDING, DRYWALL,
  FINAL_ELECTRICAL, FINAL_PLUMBING, FINAL_HVAC, FINAL_BUILDING,
  FOOTING_SLAB_UFER, FULL_DWELLING,
} from "./portal-guides-batch-4";

// ---------- Shared blocks ----------

const SHUTTER_FINAL_BUILDING: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building — Hurricane Screens/Shutters",
  tags: ["Required", "Life Safety", "Critical"],
  checks: [
    "Installed screens/shutters have valid Florida Product Approval matching plans",
    "Mounting tracks, brackets, and anchors installed per manufacturer specs",
    "Screens/shutters deploy, retract, and lock properly",
    "All required openings are protected per approved plans",
  ],
  refs: "FBC-B 1710.1 · 1710.2 · FBC-R R301.2.1.2",
};

const SHUTTER_MOTORIZED_EXTRA_CHECK = "Motor installation, wiring, and manual override operation (motorized only)";

const MF_POOL_INSPECTIONS: InspectionPhase[] = [
  {
    phase: "Phase 1 · Footing, Slab, UFER", code: "101", title: "Pool Steel & Bonding Grid",
    tags: ["Required", "Structural", "Critical"],
    checks: [
      "Rebar size and spacing per plans",
      "Pool shape, dimensions, and formwork per plans",
      "Pool depth verified at shallow and deep ends",
      "Copper bonding wire around pool perimeter per NEC",
      "Bonding wire connected to pool steel reinforcement",
      "All metallic components within 5 ft of pool edge bonded",
      "Deck rebar spacing, overlap, placement per plans",
      "Bonding wire attached to reinforcement steel in deck area",
      "Plumbing lines and electrical conduit installed prior to pour",
    ],
    refs: "ISPSC 306.1 · 307.2 · 307.2.1 · FBC-R R506.2.4 · NEC 680.26 · 680.26(B) · FBC-B 110.3",
  },
  {
    phase: "Phase 2 · Underground Plumbing", code: "402", title: "Pool Underground Plumbing",
    tags: ["Required", "Plumbing", "Critical"],
    checks: [
      "Plumbing lines properly installed and supported per plans",
      "Underground pipe burial depth meets code",
      "System holds required pressure test",
      "Required distance from pool edge maintained",
      "Pipe sizes match approved plans",
    ],
    refs: "FBC-P 305.1 · 305.5 · 312.2 · 604.1 · ISPSC 307.2",
  },
  {
    phase: "Phase 3 · Underground Electrical", code: "201", title: "Pool Underground Electrical",
    tags: ["Required", "Electrical", "Critical"],
    checks: [
      "Conduit and wiring properly installed per plans",
      "Conduit burial depth meets NEC 680.11(A)",
      "Required distance from pool edge maintained",
      "Bonding continuity at all underground connections",
    ],
    refs: "NEC 680.11 · 680.11(A) · 680.26",
  },
  {
    phase: "Phase 4 · Rough Plumbing", code: "412", title: "Pool Deck & Equipment Plumbing",
    tags: ["Required", "Plumbing", "Critical"],
    checks: [
      "Deck drains installed with proper slope away from pool",
      "Plumbing connections at pump, filter, and heater locations",
      "Suction outlets meet entrapment avoidance requirements",
      "Deck slopes drain away from pool or toward deck drains",
    ],
    refs: "ISPSC 306.5 · 306.5.1 · 307.1 · 308",
  },
  {
    phase: "Phase 5 · Rough Electrical", code: "212", title: "Pool Equipment Electrical",
    tags: ["Required", "Electrical", "Critical"],
    checks: [
      "Electrical wiring to pump, filter, heater per plans",
      "GFCI-protected outlets and circuits in pool area",
      "Receptacle placement meets minimum distance from pool",
      "Bonding wire connections at all pool equipment",
    ],
    refs: "NEC 680.21 · 680.22 · 680.22(A) · 680.26(B)",
  },
  {
    phase: "Phase 6 · Final Building", code: "610", title: "Pool Barrier & Final Building",
    tags: ["Required", "Life Safety", "Critical"],
    checks: [
      "Completed pool including decking matches approved plans",
      'Barrier min. 48" above grade on outside face',
      'Gate latch release at 54" from grade on pool side',
      "Gates self-closing and self-latching",
      'No opening in barrier passes a 4" sphere',
      "Deck surface slip-resistant with radiused edges",
      "Visible equipment labels on pumps, filters, heaters",
      "Emergency shut-off switch installed where required",
      "R4501.17.1.9 dwelling-wall option: exit alarms, self-closing devices, OR certified in-pool alarm",
    ],
    refs: "ISPSC 305.2.1 · 305.2.2 · 305.3 · 305.3.3 · 306.2 · 306.8 · 307.2 · FBC-R R4501.17.1.9 · NEC 680.12",
  },
  {
    phase: "Phase 7 · Final Electrical", code: "617", title: "Pool Final Electrical",
    tags: ["Required", "Electrical", "Critical"],
    checks: [
      "Pool lights properly installed per plans and NEC",
      "Bonding of all required metallic components within 5 ft",
      "All required circuits in pool area have operational GFCI",
      "Grounding connections at all pool equipment",
      "Equipment disconnect switch accessible and properly rated",
    ],
    refs: "NEC 680.12 · 680.22 · 680.23 · 680.25 · 680.26(B)",
  },
  {
    phase: "Phase 8 · Final Plumbing", code: "618", title: "Pool Final Plumbing",
    tags: ["Required", "Plumbing", "Critical"],
    checks: [
      "Pump and filter operational and properly installed",
      "Main drain covers compliant and properly secured (VGBA)",
      "Skimmers properly installed and functional",
      "Heater installation per manufacturer specs (if present)",
      "Backflow prevention device on water supply",
    ],
    refs: "ISPSC 303.1.1 · 307.1 · 307.2 · 308 · FBC-P 608.1",
  },
];

// ---------- Guides ----------

const MF_MANUAL_SHUTTERS: PortalGuide = {
  slug: "multi-family-manual-hurricane-screen-shutters",
  category: "Multi Family",
  title: "Multi Family Manual Hurricane Screen/Shutters",
  docCount: 3, inspectionCount: 4, lastUpdated: REVIEWED,
  summary: "Manual hurricane screens and shutters — final building inspection.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for hurricane screens, shutters, or impact-rated products.", required: "always" },
    { name: "Installation Specifications", description: "Manufacturer installation specifications and attachment details.", required: "always" },
    { name: "Site Plan / Floor Plan", description: "Site plan or floor plan showing location of all hurricane protection installations.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind-borne Debris Protection", tags: ["Life Safety"], description: "In the Wind-Borne Debris Region, glazed openings must be impact-rated or protected by an approved shutter/panel system.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
  ],
  inspections: [SHUTTER_FINAL_BUILDING],
};

const MF_MOTORIZED_SHUTTERS: PortalGuide = {
  slug: "multi-family-motorized-hurricane-screen-shutters",
  category: "Multi Family",
  title: "Multi Family Motorized Hurricane Screen/Shutters",
  docCount: 3, inspectionCount: 10, lastUpdated: REVIEWED,
  summary: "Motorized hurricane screens and shutters — final building and final electrical.",
  documents: [
    { name: "Florida Product Approval", description: "Proof of state-approved product certification.", required: "always" },
    { name: "Electrical Product Approval (motor)", description: "Certification for the motorized shutter motor.", required: "always" },
    { name: "Installation Details / Anchor Schedule", description: "Detailed drawings showing fastener type, spacing, and embedment to existing structure.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind-borne Debris Protection", tags: ["Life Safety"], description: "In the Wind-Borne Debris Region, glazed openings must be impact-rated or protected by an approved shutter/panel system.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details must show fastener type, spacing, and embedment between new work and existing structure.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit circuits; GFCI at required locations.", code: "NEC 210.8 · 210.12" },
    { n: "05", title: "Shutter Motor Wiring and Disconnect", tags: ["Code"], description: "Motor branch circuit and disconnect per code.", code: "NEC 430" },
  ],
  inspections: [
    { ...SHUTTER_FINAL_BUILDING, checks: [...SHUTTER_FINAL_BUILDING.checks, SHUTTER_MOTORIZED_EXTRA_CHECK], refs: SHUTTER_FINAL_BUILDING.refs + " · NEC 430.1" },
    {
      phase: "Final Electrical", code: "617", title: "Final Electrical — Motorized Shutters",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Installed screens/shutters have valid Florida Product Approval matching plans",
        "Mounting tracks, brackets, and anchors installed per manufacturer specs",
        "Screens/shutters deploy, retract, and lock properly",
        "All required openings are protected per approved plans",
        SHUTTER_MOTORIZED_EXTRA_CHECK,
      ],
      refs: "FBC-B 1710.1 · 1710.2 · FBC-R R301.2.1.2 · NEC 430.1",
    },
  ],
};

const MF_PLUMBING_ONLY: PortalGuide = {
  slug: "multi-family-plumbing-only",
  category: "Multi Family",
  title: "Multi Family Plumbing Only",
  docCount: 1, inspectionCount: 9, lastUpdated: REVIEWED,
  summary: "Plumbing-only multi-family scope — rough and final plumbing.",
  documents: [
    { name: "Sealed Plumbing Plans", description: "Plumbing plans sealed by a Florida-registered design professional.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Re-pipe / Fixture Addition Materials", tags: ["Code"], description: "Approved pipe materials, DWV sizing, and firestop at rated-wall penetrations.", code: "FBC-P 603 · 709 · FBC-B 714" },
    { n: "02", title: "Plan Review Applicability (Minor Repairs)", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review not required for minor plumbing repairs. Flōridian reviews when the building department requires or client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [ROUGH_PLUMBING, FINAL_PLUMBING],
};

const MF_POOL_CONSTRUCTION: PortalGuide = {
  slug: "multi-family-pool-construction",
  category: "Multi Family",
  title: "Multi Family Pool Construction",
  docCount: 5, inspectionCount: 45, lastUpdated: REVIEWED,
  summary: "Multi-family pool — 8-phase inspection sequence including R4501.17 barrier and NEC 680 bonding.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Pool construction plans showing layout, dimensions, structural details, plumbing, and electrical.", required: "always" },
    { name: "TDH Calculations", description: "Turnover, Design, and Hydraulic (TDH) calculations for the pool system.", required: "always" },
    { name: "Equipment Specifications", description: "Manufacturer specifications for pump, filter, heater, and other pool equipment.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing pool location, setbacks, and safety barrier locations.", required: "always" },
    { name: "Safety Barrier Affidavit", description: "Signed affidavit confirming pool safety barrier and alarm compliance when those details are not shown in sealed construction plans.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Pool Barrier (MF)", tags: ["Life Safety"], description: "Multi-family pool barrier per FBC-R R4501.17 / ISPSC 305.", code: "FBC-R R4501.17 · ISPSC 305" },
    { n: "02", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "03", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
    { n: "04", title: "Equipotential Bonding (MF Pool)", tags: ["Life Safety"], description: "MF pool equipotential bonding grid per NEC 680.26.", code: "NEC 680.26" },
    { n: "05", title: "GFCI / Luminaires (MF Pool)", tags: ["Life Safety"], description: "Pool circuits per NEC 680 (GFCI, underwater luminaires, motor disconnects).", code: "NEC 680" },
    { n: "06", title: "Suction Entrapment / VGBA (MF Pool)", tags: ["Life Safety"], description: "MF pool VGBA compliance.", code: "VGBA · ISPSC 310" },
  ],
  inspections: MF_POOL_INSPECTIONS,
};

const MF_REPIPE: PortalGuide = {
  slug: "multi-family-re-pipe",
  category: "Multi Family",
  title: "Multi Family Re-Pipe",
  docCount: 1, inspectionCount: 3, lastUpdated: REVIEWED,
  summary: "Multi-family re-pipe — final plumbing only.",
  documents: [
    { name: "Sealed Plumbing Plans", description: "Sealed plumbing plans showing approved materials, routing, fixture count, and DWV sizing consistent with re-pipe scope.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Re-Pipe Materials and Scope", tags: ["Code"], description: "Re-pipe scope must show approved materials, routing, and fixture count consistent with DWV sizing.", code: "FBC-P 603 · 709" },
    { n: "02", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for minor plumbing repairs. Flōridian performs this review only when the building department requires plan review or the client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [{
    phase: "Final Plumbing", code: "618", title: "Final Plumbing — Re-Pipe",
    tags: ["Required", "Plumbing", "Critical"],
    checks: [
      "All fixtures have proper hot and cold water flow with no leaks",
      "No leaks at any new connection point under normal pressure",
      "Access points properly patched and finished",
    ],
    refs: "FBC-P 312.1 · 405.1 · FBC-B 110.3",
  }],
};

const MF_REPAIR_PLAN_REVIEW: PlanReviewItem[] = [
  { n: "01", title: "Fire-Rated Unit Separation", tags: ["Life Safety"], description: "Dwelling-unit and corridor separations must maintain their original fire-resistance rating.", code: "FBC-B 420 · 708 · 711" },
  { n: "02", title: "Means of Egress in Altered Areas", tags: ["Life Safety"], description: "Alterations must not reduce the capacity, width, or arrangement.", code: "FBC-B 1004 · 1005 · 1020" },
  { n: "03", title: "Structural Alterations and Load Path", tags: ["Life Safety"], description: "Any wall removal, beam substitution, or opening change requires engineered structural details.", code: "FBC-B 1603 · FBC-EB Ch. 4" },
  { n: "04", title: "Product Approvals If Fenestration Altered", tags: ["Code"], description: "New or replaced windows/doors require Florida product approval matching wind zone.", code: "FBC-B 1609 · 1708" },
  { n: "05", title: "Sound Transmission", tags: ["Code"], description: "Altered party walls or floor/ceiling assemblies must meet STC and IIC minimums.", code: "FBC-B 1206 · FBC-R N1104" },
  { n: "06", title: "Unit HVAC Alteration and Venting", tags: ["Life Safety"], description: "HVAC changes must maintain combustion air, venting, clearances and must not breach fire-rated assemblies.", code: "FBC-M 303 · 804 · 901" },
  { n: "07", title: "AFCI/GFCI Protection", tags: ["Life Safety"], description: "Circuits added or extended must include AFCI/GFCI protection per current NEC.", code: "NEC 210.8 · 210.12 · FBC-EB 704" },
  { n: "08", title: "Service/Feeder Adequacy", tags: ["Code"], description: "If remodel adds load, verify existing service and feeders can carry new total load.", code: "NEC 220 · 230 · 408" },
  { n: "09", title: "Re-Piping or Fixture Additions", tags: ["Code"], description: "Re-piping or new fixtures must maintain DWV sizing, vent arrangement, and rated-assembly integrity.", code: "FBC-P 603 · 709 · 906 · FBC-B 714" },
];

const MF_REPAIR_REMODEL: PortalGuide = {
  slug: "multi-family-repair-remodel",
  category: "Multi Family",
  title: "Multi Family Repair/Remodel",
  docCount: 4, inspectionCount: 61, lastUpdated: REVIEWED,
  summary: "Multi-family repair or remodel — full inspection sequence conditional on scope.",
  documents: [
    { name: "Plans or Detailed Drawings", description: "Plans or detailed drawings reflecting the full scope of remodel work.", required: "always" },
    { name: "Scope of Work Description", description: "Very detailed written scope of work describing all work to be performed.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for any regulated components being installed (windows, doors, roofing, regulated products).", required: "conditional" },
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Plans sealed by a Florida-registered professional engineer (structural changes only).", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: MF_REPAIR_PLAN_REVIEW,
  inspections: FULL_DWELLING,
};

const MF_RETAINING_WALL: PortalGuide = {
  slug: "multi-family-retaining-wall",
  category: "Multi Family",
  title: "Multi Family Retaining Wall",
  docCount: 2, inspectionCount: 14, lastUpdated: REVIEWED,
  summary: "Multi-family retaining wall — footing and final building.",
  documents: [
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, elevations, and retaining wall location.", required: "always" },
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional for retaining wall design and structural compliance.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wall Height, Surcharge, and Geotechnical Assumptions", tags: ["Life Safety"], description: "Retaining wall design must address wall height, soil type, surcharge load (traffic/structure), and drainage.", code: "FBC-B 1807.2 · FBC-R R404" },
    { n: "02", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [FOOTING_SLAB_UFER, FINAL_BUILDING],
};

const MF_SOLAR: PortalGuide = {
  slug: "multi-family-solar",
  category: "Multi Family",
  title: "Multi Family Solar",
  docCount: 2, inspectionCount: 9, lastUpdated: REVIEWED,
  summary: "Multi-family rooftop PV solar installation — rough and final electrical.",
  documents: [
    { name: "Construction Plans Sealed by FL Registered Design Professional", description: "Solar installation plans including structural attachment details, equipment specifications, and electrical diagrams. Must include product/equipment specs.", required: "always" },
    { name: "Site Survey", description: "Site survey or plan showing solar panel layout, roof orientation, and property boundaries.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Structural Attachment and Uplift (MF Solar)", tags: ["Life Safety"], description: "Racking designed for wind uplift; fastener embedment per engineering.", code: "FBC-B 1607.13 · ASCE 7" },
    { n: "02", title: "Roof Load and Fire Access (MF Solar)", tags: ["Life Safety"], description: "Existing roof supports added solar load; firefighter pathways preserved.", code: "FBC-B 1603 · FBC-R R324.4" },
    { n: "03", title: "Engineer of Record Seal", tags: ["Documentation"], description: "Structural drawings require current Florida-licensed engineer seal/signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
    { n: "04", title: "PV Disconnect and Rapid Shutdown (MF)", tags: ["Life Safety"], description: "NEC 690.12/690.13 disconnect and rapid shutdown compliance.", code: "NEC 690.12 · 690.13" },
    { n: "05", title: "Grounding, Bonding, and Interconnection (MF Solar)", tags: ["Life Safety"], description: "PV grounding/bonding and interconnection compliance.", code: "NEC 690.41–.47 · 705.12" },
  ],
  inspections: [
    {
      phase: "Rough Electrical", code: "202", title: "Solar Rough Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Mounting and racking per engineered plans with proper roof attachment",
        "Conduit routing, wire sizing, and connections per plans and NEC",
        "Equipment grounding conductor and bonding of metallic racking",
        "Rapid shutdown system installed and labeled",
        "All roof penetrations flashed and sealed",
      ],
      refs: "FBC-B 1603.1 · FBC-R R324.4 · R903.2 · NEC 690.8 · 690.12 · 690.31 · 690.43 · 690.47",
    },
    {
      phase: "Final Electrical", code: "608", title: "Solar Final Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Panel layout matches approved plans; all panels secured",
        "Inverter properly installed with required clearances and labeling",
        "AC and DC disconnects installed, accessible, and properly labeled",
        "System powers on and produces expected output",
      ],
      refs: "FBC-R R324.4 · NEC 690.1 · 690.8 · 690.13 · 690.56 · 705.12",
    },
  ],
};

// Silence unused-import warnings for shared blocks intentionally imported for parity with other batches.
export const _batch6UnusedRefs = [
  ROUGH_FRAMING, ROOF_DRY_IN, ROUGH_ELECTRICAL, ROUGH_HVAC,
  INSULATION, LATHE_SIDING, DRYWALL, FINAL_ELECTRICAL, FINAL_HVAC,
];

export const GUIDES_BATCH_6: PortalGuide[] = [
  MF_MANUAL_SHUTTERS,
  MF_MOTORIZED_SHUTTERS,
  MF_PLUMBING_ONLY,
  MF_POOL_CONSTRUCTION,
  MF_REPIPE,
  MF_REPAIR_REMODEL,
  MF_RETAINING_WALL,
  MF_SOLAR,
];
