// Single Family project guides — registered into /portal/guides.
import type { PortalGuide, GuideDownload, GuideDoc } from "./portal-guides-data";

const REVIEWED = "Reviewed by Cleard permitting staff — July 2026";

const STANDARD_DOWNLOADS: GuideDownload[] = [
  {
    title: "Notice to Building Official — Use of Private Provider",
    meta: "Form 61G20-2.005 · FL Statute §553.791",
  },
  {
    title: "Private Provider Owner Authorization & Indemnification",
    meta: "FL Statute §553.791",
  },
];

const NTBO_OWNER: GuideDoc[] = [
  {
    name: "Notice to Building Official (NTBO)",
    description: "Required when using a private provider (Cleard). Download below.",
    required: "conditional",
  },
  {
    name: "Owner Authorization Form",
    description: "Private Provider Owner Authorization & Indemnification. Download below.",
    required: "conditional",
  },
];

const SF_MANUAL_SHUTTERS: PortalGuide = {
  slug: "single-family-manual-hurricane-screen-shutters",
  category: "Single Family",
  title: "Single Family Manual Hurricane Screen/Shutters",
  docCount: 3,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Single family manual hurricane screen or shutter installation.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for hurricane screens, shutters, or impact-rated products.", required: "always" },
    { name: "Installation Specifications", description: "Manufacturer installation specifications and attachment details.", required: "always" },
    { name: "Site Plan / Floor Plan", description: "Site plan or floor plan showing location of all hurricane protection installations.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind-borne debris protection", tags: ["Life Safety"], description: "In the Wind-Borne Debris Region, glazed openings must be impact-rated or protected by an approved shutter/panel system.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { n: "02", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida product approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Manual hurricane shutter installation falls outside FBC-B 107.3.5 minimum criteria; verification occurs at inspection unless department requires plan review.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Hurricane Shutters — Final",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Product approval verification — valid FL Product Approval matches approved plans",
        "Mounting and track installation per manufacturer specs",
        "Screen/shutter operation — deploy, retract, and lock properly",
        "Coverage completeness — all required openings protected per approved plans",
      ],
      refs: "FBC-B 1710.1 · 1710.2 · FBC-R R301.2.1.2",
    },
  ],
};

const SF_MOBILE_HOME: PortalGuide = {
  slug: "single-family-mobile-home-replacement",
  category: "Single Family",
  title: "Single Family Mobile Home Replacement",
  docCount: 2,
  inspectionCount: 22,
  lastUpdated: REVIEWED,
  summary: "Single family mobile home replacement — tie-down, building, electrical, and mechanical finals.",
  documents: [
    { name: "Site Plan / Survey", description: "Survey documentation for the property.", required: "always" },
    { name: "Tie-Down Engineering / Manufacturer Install Manual", description: "Engineering and installation specs for tie-down system.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Plan Review Applicability — Building", tags: ["Documentation"], description: "Reviews performed when building department requires or client opts in.", code: "FBC-B 107.3.5" },
    { n: "04", title: "Combustion Air and Venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires combustion air and proper venting.", code: "FBC-M 303 · FBC-M 804 · FBC-FG" },
    { n: "05", title: "Plan Review Applicability — Mechanical", tags: ["Documentation"], description: "Site-built mechanical connections only; reviews when required.", code: "FBC-B 107.3.5" },
    { n: "06", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · NEC 230" },
    { n: "07", title: "Plan Review Applicability — Electrical", tags: ["Documentation"], description: "Service connections in scope; reviews when required.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "310",
      title: "Tie Down",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Anchor and strap installation per manufacturer specs and engineering",
        "Anchor spacing and count match tie-down engineering",
        "Strap tension and connection to frame rails",
        "Pier and pad condition — properly placed and level under home",
      ],
      refs: "FBC-R R301.2.1 · FBC-B 3103.1",
    },
    {
      phase: "Phase 2",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Egress doors — minimum 32\" clear width and proper hardware",
        "Smoke alarms in each bedroom, outside sleeping areas, and each level",
        "CO alarms where required",
        "Emergency escape openings — bedroom windows meet egress size",
        "Stair rise, run, handrail height, and landing dimensions",
        "Address numbers posted and visible from street",
        "Exterior cladding, trim, and weatherproofing complete",
        "Finish grade slopes away from foundation min. 6\" in 10 feet",
      ],
      refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3",
    },
    {
      phase: "Phase 3",
      code: "608",
      title: "Final Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Panel cover installed, all breakers labeled, no open knockouts",
        "All GFCI and AFCI devices test and reset properly",
        "Outlets and switches operate correctly throughout",
        "All light fixtures installed and operational",
        "Exterior outlets GFCI protected; lighting functional",
      ],
      refs: "NEC 408.4 · 210.8 · 210.12 · 210.52 · 210.70 · 210.52(E)",
    },
    {
      phase: "Phase 4",
      code: "709",
      title: "Final Mechanical / HVAC",
      tags: ["Required", "Critical"],
      checks: [
        "System starts, runs, and produces heated and cooled air",
        "Air handler and condenser installed with clearances and level",
        "Condensate drain properly routed and terminated",
        "All supply and return registers installed and operational",
        "Equipment nameplates match approved plans",
      ],
      refs: "FBC-M 304.1 · 307.2 · 601.2",
    },
  ],
};

const SF_MOTORIZED_SHUTTERS: PortalGuide = {
  slug: "single-family-motorized-hurricane-screen-shutters",
  category: "Single Family",
  title: "Single Family Motorized Hurricane Screen/Shutters",
  docCount: 3,
  inspectionCount: 10,
  lastUpdated: REVIEWED,
  summary: "Single family motorized hurricane screen or shutter installation with electrical motor.",
  documents: [
    { name: "Florida Product Approval", description: "Proof product meets FL standards.", required: "always" },
    { name: "Electrical Product Approval (motor)", description: "Motor certification required.", required: "always" },
    { name: "Installation Details / Anchor Schedule", description: "Fastener and attachment specs.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind-borne debris protection", tags: ["Life Safety"], description: "Impact-rated or protected by an approved shutter/panel.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { n: "02", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Fastener type, spacing, and embedment details required.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida product approval", tags: ["Code"], description: "FL# or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Plan review applicability (Building)", tags: ["Documentation"], description: "Not required under FBC 107.3.5 minimum; optional review.", code: "FBC-B 107.3.5" },
    { n: "05", title: "AFCI and GFCI protection", tags: ["Life Safety"], description: "Per NEC 210.12; GFCI per NEC 210.8 at required locations.", code: "NEC 210.8 · NEC 210.12" },
    { n: "06", title: "Shutter motor wiring and disconnect", tags: ["Code"], description: "Motor branch circuit and disconnect per NEC 430.", code: "NEC 430" },
    { n: "07", title: "Plan review applicability (Electrical)", tags: ["Documentation"], description: "Not required under FBC 107.3.5; optional review.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Motorized Shutters — Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Product approval verification — valid FL Product Approval matches approved plans",
        "Mounting and track installation per manufacturer specs",
        "Screen/shutter operation — deploy, retract, and lock properly",
        "Coverage completeness — all required openings protected per plans",
        "Motor and electrical — motor installation, wiring, and manual override",
      ],
      refs: "FBC-B 1710.1 · 1710.2 · FBC-R R301.2.1.2 · NEC 430.1",
    },
    {
      phase: "Final Electrical",
      code: "608",
      title: "Motorized Shutters — Final Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Product approval verification — valid FL Product Approval matches approved plans",
        "Mounting and track installation per manufacturer specs",
        "Screen/shutter operation — deploy, retract, and lock properly",
        "Coverage completeness — all required openings protected per plans",
        "Motor and electrical — motor installation, wiring, and manual override",
      ],
      refs: "FBC-B 1710.1 · 1710.2 · FBC-R R301.2.1.2 · NEC 430.1",
    },
  ],
};

const SF_PATIO_LANAI: PortalGuide = {
  slug: "single-family-patio-lanai-roof-or-cover",
  category: "Single Family",
  title: "Single Family Patio/Lanai Roof or Cover",
  docCount: 3,
  inspectionCount: 15,
  lastUpdated: REVIEWED,
  summary: "Single family patio or lanai roof / cover — framed rough and final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing patio/lanai cover layout, framing, and attachment to existing structure.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for roofing materials and structural components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and cover footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida product approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Standalone patio/lanai cover is not in FBC-B 107.3.5 minimum criteria for 1 & 2 family.", code: "FBC-B 107.3.5" },
    { n: "05", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Rough Framing",
      code: "301",
      title: "Rough Framing",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Wall stud size and spacing per plans",
        "Headers and beams over openings per plans",
        "Top and bottom plate connections with proper lapping",
        "Corner and intersection bracing",
        "Window and door rough openings",
        "Hurricane straps and hold-down hardware per plans",
        "Fire blocking at required locations",
      ],
      refs: "FBC-R R602.3 · R602.7 · R602.10 · R802.11 · R602.8",
    },
    {
      phase: "Final Building",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Egress doors — minimum 32\" clear width and proper hardware",
        "Smoke alarms in each bedroom, outside sleeping areas, and each level",
        "CO alarms where required",
        "Emergency escape openings — bedroom windows meet egress size",
        "Stair rise, run, handrail height, and landing dimensions",
        "Address numbers posted and visible from street",
        "Exterior cladding, trim, and weatherproofing complete",
        "Finish grade slopes away from foundation min. 6\" in 10 feet",
      ],
      refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3",
    },
  ],
};

const SF_PLUMBING_ONLY: PortalGuide = {
  slug: "single-family-plumbing-only",
  category: "Single Family",
  title: "Single Family Plumbing Only",
  docCount: 1,
  inspectionCount: 9,
  lastUpdated: REVIEWED,
  summary: "Single family plumbing-only scope — rough and final plumbing.",
  documents: [
    { name: "Plumbing Plans or Detailed Scope of Work", description: "Plumbing plans or a detailed written scope of work describing all plumbing work to be performed.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Re-pipe materials and scope", tags: ["Code"], description: "Re-pipe scope must show approved materials, routing, and fixture count consistent with DWV sizing.", code: "FBC-P 603 · FBC-P 709" },
    { n: "02", title: "Plan review applicability", tags: ["Documentation"], description: "Plan review not required for minor plumbing repairs under exemption #3; Cleard reviews only when building department requires or client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Rough Plumbing",
      code: "402",
      title: "Rough Plumbing",
      tags: ["Required", "Plumbing", "Critical"],
      checks: [
        "Supply pipe sizes and material per plans",
        "DWV pipe sizes and slope per plans",
        "Pipes supported at required intervals",
        "Vent pipes terminate properly through roof",
        "Water heater rough-in per plans",
      ],
      refs: "FBC-P 604.1 · 704.1 · 308.1 · 903.1 · 607.1",
    },
    {
      phase: "Final Plumbing",
      code: "609",
      title: "Final Plumbing",
      tags: ["Required", "Plumbing", "Critical"],
      checks: [
        "All plumbing fixtures installed, connected, and operational",
        "Water heater with TPR valve, drain pan, and discharge pipe",
        "No visible leaks at any supply or drain connection",
        "Exterior hose bibbs have backflow prevention",
      ],
      refs: "FBC-P 405.1 · 607.1 · 312.1 · 608.15.4.2",
    },
  ],
};

const SF_POOL_CONSTRUCTION: PortalGuide = {
  slug: "single-family-pool-construction",
  category: "Single Family",
  title: "Single Family Pool Construction",
  docCount: 5,
  inspectionCount: 8,
  lastUpdated: REVIEWED,
  summary: "Single family in-ground pool — full construction inspection sequence.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Engineer-sealed construction drawings for pool structure and systems.", required: "always" },
    { name: "TDH Calculations", description: "Total Dynamic Head calculations for pool hydraulics and pump sizing.", required: "always" },
    { name: "Equipment Specifications", description: "Specifications for pool equipment including pump, filter, heater, and sanitization systems.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing pool location, setbacks, and property boundaries.", required: "always" },
    { name: "Safety Barrier Affidavit", description: "Affidavit confirming pool barrier compliance with Florida Statutes 515.27.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Pool Barrier Compliance", tags: ["Life Safety"], description: "Verify a code-compliant pool barrier is shown on plans — height, clearances, gate self-closing/self-latching hardware, and door alarms on dwelling openings facing pool.", code: "ISPSC 305 · FBC-R R4501.17 · FS 515.27" },
    { n: "02", title: "Pool Shell Structural Design", tags: ["Life Safety"], description: "Verify pool shell engineering is provided with soil bearing, reinforcement, and shell thickness.", code: "ISPSC 307 · FBC-R R403 · ACI 318" },
    { n: "03", title: "Deck and Coping Design", tags: ["Code"], description: "Verify pool deck slopes, slip resistance, and coping connection are noted.", code: "ISPSC 306 · FBC-R R326" },
    { n: "04", title: "Setbacks from Property Lines and Structures", tags: ["Code"], description: "Verify pool meets jurisdictional setback requirements from property lines, septic fields, and easements.", code: "ISPSC 305.3 · Local zoning" },
    { n: "05", title: "Engineer Seal on Structural", tags: ["Documentation"], description: "Confirm pool structural drawings bear a current Florida-licensed engineer seal.", code: "FL Statutes Ch. 471" },
    { n: "06", title: "Pool Heater Clearances (if gas)", tags: ["Life Safety"], description: "If a gas pool heater is specified, verify combustion air and venting clearances are shown.", code: "FBC-M 303 · FBC-FG 304" },
    { n: "07", title: "Equipotential Bonding Grid", tags: ["Life Safety"], description: "Verify a complete equipotential bonding grid is shown — pool shell reinforcement, metallic components within 5 feet, pool equipment, and perimeter bonding around the pool.", code: "NEC 680.26" },
    { n: "08", title: "GFCI Protection for Pool Circuits", tags: ["Life Safety"], description: "Verify GFCI protection is shown for pool equipment circuits, receptacles, and underwater luminaires.", code: "NEC 680.5 · 680.22 · 680.23" },
    { n: "09", title: "Underwater Luminaires", tags: ["Life Safety"], description: "If underwater pool lights are included, verify they comply with NEC 680.23 (low-voltage preferred; line voltage requires specific installation).", code: "NEC 680.23" },
    { n: "10", title: "Equipment Disconnect Location", tags: ["Code"], description: "Verify a disconnecting means is shown within sight of pool equipment, at least 5 feet horizontally from the inside wall of the pool.", code: "NEC 680.12" },
    { n: "11", title: "Underground Wiring Methods", tags: ["Code"], description: "Verify burial depth and wiring method for underground pool circuits.", code: "NEC 300.5 · NEC 680.10" },
    { n: "12", title: "Suction Entrapment Prevention (VGBA)", tags: ["Life Safety"], description: "Verify suction outlets comply with Virginia Graeme Baker Act — dual main drains or unblockable single drain, ANSI/APSP-16 compliant covers.", code: "ISPSC 310 · 15 USC 8003 (VGBA)" },
    { n: "13", title: "Filtration and Circulation", tags: ["Code"], description: "Verify filtration equipment is sized for pool volume and turnover rate is specified.", code: "ISPSC 309" },
    { n: "14", title: "Backflow Prevention on Auto-Fill", tags: ["Code"], description: "If an auto-fill or auto-leveler is included, verify a backflow prevention device is specified on the water supply.", code: "FBC-P 608 · ISPSC 312" },
  ],
  inspections: [
    { phase: "Phase 1", code: "101", title: "Building — Footing, Slab, UFER", tags: ["Required", "Structural", "Critical"], checks: [
      "Rebar grid spacing and size",
      "Pool excavation and formwork",
      "Pool depth verification",
      "Bonding grid perimeter wire",
      "Bonding grid to pool steel connections",
      "Bonding of metallic components within 5 feet",
      "Deck reinforcement layout",
      "Deck bonding wire",
      "Plumbing and electrical conduit in place",
    ], refs: "ISPSC 307.2 · FBC-R R506.2.4 · ISPSC 307.2.1 · NEC 680.26 · NEC 680.26(B) · ISPSC 306.1 · FBC-B 110.3" },
    { phase: "Phase 2", code: "401", title: "Plumbing — Underground Plumbing", tags: ["Required", "Plumbing"], checks: [
      "Pipe installation and support",
      "Burial depth",
      "Pressure test",
      "Distance from pool edge",
      "Pipe sizing per plans",
    ], refs: "FBC-P 305.1 · 305.5 · 312.2 · ISPSC 307.2 · FBC-P 604.1" },
    { phase: "Phase 3", code: "201", title: "Electrical — Underground Electrical", tags: ["Required", "Electrical"], checks: [
      "Conduit and wiring installation",
      "Burial depth verification",
      "Distance from pool edge",
      "Bonding connections at underground",
    ], refs: "NEC 680.11 · 680.11(A) · 680.26" },
    { phase: "Phase 4", code: "402", title: "Plumbing — Rough Plumbing", tags: ["Required", "Plumbing"], checks: [
      "Deck drain installation",
      "Equipment pad plumbing connections",
      "Suction outlet compliance",
      "Deck slope and drainage direction",
    ], refs: "ISPSC 306.5.1 · 308 · 307.1 · 306.5" },
    { phase: "Phase 5", code: "202", title: "Electrical — Rough Electrical", tags: ["Required", "Electrical"], checks: [
      "Equipment wiring",
      "GFCI protection",
      "Receptacle locations and distances",
      "Equipment bonding",
    ], refs: "NEC 680.21 · 680.22 · 680.22(A) · 680.26(B)" },
    { phase: "Phase 6", code: "610", title: "Building — Final Building", tags: ["Required", "Life Safety", "Critical"], checks: [
      "Overall pool construction",
      "Barrier height",
      "Gate latch height",
      "Gate self-closing and self-latching",
      "Barrier openings",
      "Deck condition and edges",
      "Equipment labels visible",
      "Emergency shut-off switch",
      "Pool alarm / dwelling-wall protection",
    ], refs: "ISPSC 307.2 · 305.2.1 · 305.3.3 · 305.3 · 305.2.2 · 306.2 · 306.8 · FBC-B 110.3 · NEC 680.12 · FBC-R R4501.17.1.9" },
    { phase: "Phase 7", code: "608", title: "Electrical — Final Electrical", tags: ["Required", "Electrical"], checks: [
      "Pool light installation",
      "Equipotential bonding complete",
      "GFCI protection operational",
      "Grounding connections",
      "Disconnect switch",
    ], refs: "NEC 680.23 · 680.26(B) · 680.22 · 680.25 · 680.12" },
    { phase: "Phase 8", code: "609", title: "Plumbing — Final Plumbing", tags: ["Required", "Plumbing"], checks: [
      "Pump and filter operation",
      "Drain covers and suction safety",
      "Skimmer installation",
      "Heater installation",
      "Backflow prevention",
    ], refs: "ISPSC 308 · 307.1 · 307.2 · 303.1.1 · FBC-P 608.1" },
  ],
};

const SF_PREMANUFACTURED_SHED: PortalGuide = {
  slug: "single-family-pre-manufactured-shed-installation",
  category: "Single Family",
  title: "Single Family Pre-Manufactured Shed Installation",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Single family pre-manufactured shed installation permit.",
  documents: [
    { name: "Manufacturer Plan Specifications", description: "Manufacturer plan/spec package including wind load criteria and anchor method.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and shed location.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Footing / Foundation Design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "02", title: "Attachment to Existing Structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida Product Approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, pre-manufactured / prototype plans are exempt except for local site adaptation, foundations, and modifications.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "101",
      title: "Footing, Slab, UFER",
      tags: ["Structural"],
      checks: ["Inspection criteria coming soon — your Cleard inspector will walk you through this inspection on-site."],
      refs: "FBC-R R403.1",
    },
    {
      phase: "Phase 2",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Shed placement and setback per approved site plan",
        "Anchoring and tie-down per manufacturer specs or engineering for wind zone",
        "Electrical connection (if wired) properly made per plans",
        "Overall condition — level, undamaged, and matches approved plans",
      ],
      refs: "FBC-R R301.1 · R301.2.1 · NEC 225.30 · FBC-B 110.3",
    },
  ],
};

const SF_RE_PIPE: PortalGuide = {
  slug: "single-family-re-pipe",
  category: "Single Family",
  title: "Single Family Re-Pipe",
  docCount: 2,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Single family re-pipe permit — final plumbing verification.",
  documents: [
    { name: "Scope of Work Description", description: "Outlines work to be performed.", required: "always" },
    { name: "Hand-drawn Layout Diagram", description: "Shows structure layout and improvement scope.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Re-pipe materials and scope", tags: ["Code"], description: "Re-pipe scope must show approved materials, routing, and fixture count consistent with DWV sizing.", code: "FBC-P 603 · FBC-P 709" },
    { n: "02", title: "Plan review applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for minor plumbing repairs. Cleard reviews only when building department requires or client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Final Plumbing",
      code: "609",
      title: "Re-Pipe Final",
      tags: ["Required", "Plumbing", "Critical"],
      checks: [
        "Fixture operation — all fixtures have proper hot and cold water flow with no leaks",
        "No visible leaks at any new connection point under normal pressure",
        "Wall and ceiling patches — access points properly patched and finished",
      ],
      refs: "FBC-P 405.1 · 312.1 · FBC-B 110.3",
    },
  ],
};

export const SINGLE_FAMILY_GUIDES: PortalGuide[] = [
  SF_MANUAL_SHUTTERS,
  SF_MOBILE_HOME,
  SF_MOTORIZED_SHUTTERS,
  SF_PATIO_LANAI,
  SF_PLUMBING_ONLY,
  SF_POOL_CONSTRUCTION,
  SF_PREMANUFACTURED_SHED,
  SF_RE_PIPE,
];
