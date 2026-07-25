// Single Family project guides — batch 2. Registered into /portal/guides.
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

const SF_ELECTRICAL_ONLY: PortalGuide = {
  slug: "single-family-electrical-only",
  category: "Single Family",
  title: "Single Family Electrical Only",
  docCount: 2,
  inspectionCount: 11,
  lastUpdated: REVIEWED,
  summary: "Single family electrical-only scope — rough and final electrical.",
  documents: [
    { name: "Electrical Plans or Detailed Scope of Work", description: "Electrical plans or a detailed written scope of work describing all electrical work to be performed.", required: "always" },
    { name: "Load Calculations", description: "Electrical load calculations with existing vs. new equipment information when service is upgraded or panel replaced.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "AFCI and GFCI protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI per NEC 210.8 at required locations.", code: "NEC 210.8 · NEC 210.12" },
    { n: "02", title: "Service size and load calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · NEC 230" },
    { n: "03", title: "Plan review applicability (FBC 107.3.5)", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for minor electrical repairs (Exemption #3). Cleard performs this review only when the building department requires plan review or the client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Rough Electrical",
      code: "202",
      title: "Rough Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Panel installation — properly mounted and sized per plans",
        "Wire gauge matches breaker amperage for each circuit",
        "Box fill — boxes properly installed and not overfilled",
        "GFCI and AFCI protection provided where required",
        "Interconnected smoke and CO alarm wiring in place",
        "Grounding electrode system and bonding connections",
      ],
      refs: "NEC 408.4 · 210.3 · 240.4 · 314.16 · 210.8 · 210.12 · 250.50 · FBC-R R314.3 · R315",
    },
    {
      phase: "Final Electrical",
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
  ],
};

const SF_FENCE: PortalGuide = {
  slug: "single-family-fence",
  category: "Single Family",
  title: "Single Family Fence",
  docCount: 2,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Single family fence permit.",
  documents: [
    { name: "Site Plan", description: "Site plan showing fence location, height, and relationship to property boundaries.", required: "always" },
    { name: "Product Specifications", description: "Product specifications for fence materials and design.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Pool Barrier Compliance", tags: ["Life Safety"], description: "If the fence encloses a swimming pool or serves as the required pool barrier, it must comply with ISPSC / FBC-R pool barrier requirements: minimum height, opening limits, latch height, and gate direction.", code: "FBC-R R4501.17 · ISPSC 305" },
    { n: "02", title: "Plan Review Applicability", tags: ["Documentation"], description: "Fences are not listed in FBC-B 107.3.5 minimum plan review criteria for one- and two-family dwellings. Cleard reviews when building department requires or client opts in.", code: "FBC-B 107.3.5" },
    { n: "03", title: "Wind Load for Tall or Solid Fences", tags: ["Code"], description: "Tall (over 6 feet) or solid fences in high-wind zones require engineered design or manufacturer product approval.", code: "FBC-B 1609 · ASCE 7" },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Fence — Final",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Post installation and depth — posts set at proper depth and spacing per approved plans",
        "Fence height and setback from property line per approved plans",
        "Material and construction method match approved plans",
        "Gate operation — gates open, close, and latch properly",
      ],
      refs: "FBC-R R301.1",
    },
  ],
};

const SF_FLOOD_PANEL: PortalGuide = {
  slug: "single-family-flood-panel-installation",
  category: "Single Family",
  title: "Single Family Flood Panel Installation",
  docCount: 3,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Single family flood panel / barrier installation permit.",
  documents: [
    { name: "Florida Product Approval (Flood Panel/Barrier)", description: "Regulated product approval documentation.", required: "always" },
    { name: "Installation Details / Anchor Schedule", description: "Technical fastener and mounting specifications.", required: "always" },
    { name: "Site Plan / Survey", description: "Property and location documentation.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure — fasteners, spacing, embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "02", title: "Florida product approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "03", title: "Flood panel product approval and installation", tags: ["Code"], description: "Flood panel must be installed per Florida product approval or manufacturer instructions.", code: "FBC-B 1612 · FBC-B 1708" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Standalone flood panel is a flood-mitigation sub-scope; review performed when required or opted.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Flood Panel — Final",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Product approval verification — valid FL Product Approval or engineering matches approved plans",
        "Track and mounting installation per manufacturer specs and engineering",
        "Panel fit and seal — panels fit properly in tracks with complete seal against water intrusion",
        "Coverage of all required openings below flood elevation per approved plans",
      ],
      refs: "FBC-B 1612.1 · 1612.4",
    },
  ],
};

const SF_FRAMED_DECK_DOCK: PortalGuide = {
  slug: "single-family-framed-deck-dock",
  category: "Single Family",
  title: "Single Family Framed Deck/Dock",
  docCount: 2,
  inspectionCount: 15,
  lastUpdated: REVIEWED,
  summary: "Single family framed deck or dock — rough framing and final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing deck layout, framing, and connection details.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and deck footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Standalone framed deck/dock scope is not in FBC-B 107.3.5 minimum criteria for 1 & 2 family.", code: "FBC-B 107.3.5" },
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

const SF_GARAGE_FILL_IN: PortalGuide = {
  slug: "single-family-garage-fill-in-conditioned-space",
  category: "Single Family",
  title: "Single Family Garage Fill In (Conditioned Space)",
  docCount: 4,
  inspectionCount: 61,
  lastUpdated: REVIEWED,
  summary: "Full-scope garage fill-in converting garage to conditioned dwelling space — framing through finals.",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Drawings showing garage fill-in layout, framing, and HVAC integration.", required: "always" },
    { name: "Energy Compliance Forms", description: "Energy compliance documentation per FBC Chapter 13 / IECC for the new conditioned space.", required: "always" },
    { name: "Product Approvals", description: "Florida approvals for windows, doors, insulation, and regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Property boundaries and modified structure footprint documentation.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design Wind Speed & Exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Structural Wall Section and Load Path", tags: ["Life Safety"], description: "Continuous wall section from foundation through roof showing framing, sheathing, connectors, and uplift resistance.", code: "FBC-R R301 · R602 · R802" },
    { n: "03", title: "Egress from Sleeping Rooms", tags: ["Life Safety"], description: "Each sleeping room must have an emergency escape and rescue opening per R310 dimensions.", code: "FBC-R R310" },
    { n: "04", title: "Smoke and CO Alarm Coverage", tags: ["Life Safety"], description: "Smoke alarms in each bedroom, outside sleeping areas, each story; CO alarms where fuel-fired appliances or attached garages exist.", code: "FBC-R R314 · R315" },
    { n: "05", title: "Change of Use (Garage to Conditioned Space)", tags: ["Code"], description: "Conversion triggers dwelling-unit compliance: insulation, egress, smoke/CO alarms, HVAC sizing.", code: "FBC-EB Ch. 10 · FBC-R R302 · FBC-E R402" },
    { n: "06", title: "Manual J / S / D Load Calculation", tags: ["Code"], description: "HVAC sizing per Manual J; selection per Manual S; duct design per Manual D.", code: "FBC-R M1401.3 · FBC-M 309" },
    { n: "07", title: "Ventilation", tags: ["Code"], description: "Whole-house or occupancy-based ventilation per code requirements.", code: "FBC-R M1507 · FBC-M 403" },
    { n: "08", title: "AFCI and GFCI Protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits; GFCI at required locations.", code: "NEC 210.8 · 210.12" },
    { n: "09", title: "Service Size and Load Calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
  ],
  inspections: [
    {
      phase: "Phase 1",
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
      phase: "Phase 2",
      code: "305",
      title: "Roof Dry-In",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Underlayment installed per code and manufacturer specs",
        "Drip edge installed at eaves and rakes",
        "Valley and wall flashing properly installed",
        "All roof penetrations properly sealed and flashed",
      ],
      refs: "FBC-R R905.1.1 · R905.2.8.5 · R903.2",
    },
    {
      phase: "Phase 3",
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
      phase: "Phase 4",
      code: "202",
      title: "Rough Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Panel properly mounted and sized per plans",
        "Wire gauge matches breaker amperage",
        "Boxes properly installed and not overfilled",
        "GFCI and AFCI protection where required",
        "Interconnected smoke and CO alarm wiring in place",
        "Grounding electrode system and bonding connections",
      ],
      refs: "NEC 408.4 · 210.3 · 240.4 · 314.16 · 210.8 · 210.12 · 250.50 · FBC-R R314.3 · R315",
    },
    {
      phase: "Phase 5",
      code: "702",
      title: "Rough Mechanical / HVAC",
      tags: ["Required", "Critical"],
      checks: [
        "Ductwork sizes, routing, and support per plans",
        "Duct joints and connections properly sealed",
        "Air handler and condenser placement with required clearances",
        "Refrigerant line sizing and insulation per plans",
        "Return air pathways properly sized and located",
      ],
      refs: "FBC-M 603.1 · 603.9 · 304.1 · 1101.3 · 601.2",
    },
    {
      phase: "Phase 6",
      code: "306",
      title: "Insulation",
      tags: ["Required", "Critical"],
      checks: [
        "Wall insulation R-value matches energy calculations",
        "Ceiling/attic insulation R-value per energy calculations",
        "No gaps, voids, or compression in installation",
        "Air sealing at penetrations, top plates, and rim joists",
      ],
      refs: "FBC-E R402.1 · R402.4 · R402.4.1",
    },
    {
      phase: "Phase 7",
      code: "307",
      title: "Lathe, Siding",
      tags: ["Required", "Critical"],
      checks: [
        "Exterior wall covering matches approved plans, properly installed",
        "Weather-resistive barrier properly installed behind cladding",
        "Flashing at windows, doors, and wall transitions",
        "Cladding fastener type and spacing per manufacturer and plans",
      ],
      refs: "FBC-R R703.1 · R703.2 · R703.4",
    },
    {
      phase: "Phase 8",
      code: "308",
      title: "Drywall",
      tags: ["Required", "Critical"],
      checks: [
        "Drywall thickness per plans; moisture-resistant board in wet areas",
        "Screw or nail spacing meets code",
        "Fire-rated assemblies with proper drywall layers per rating",
        "Moisture barrier behind tub/shower surrounds where required",
      ],
      refs: "FBC-R R702.3.1 · R702.3.5 · R302.6 · R702.4",
    },
    {
      phase: "Phase 9",
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
      phase: "Phase 10",
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
    {
      phase: "Phase 11",
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
    {
      phase: "Phase 12",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Egress doors — minimum 32\" clear width and proper hardware",
        "Smoke alarms in each bedroom, outside sleeping areas, and each level",
        "CO alarms where required",
        "Bedroom windows meet emergency egress size",
        "Stair rise, run, handrail height, and landing dimensions",
        "Address numbers posted and visible from street",
        "Exterior cladding, trim, and weatherproofing complete",
        "Finish grade slopes away from foundation min. 6\" in 10 feet",
      ],
      refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3",
    },
  ],
};

const SF_GENERATOR: PortalGuide = {
  slug: "single-family-generator-install",
  category: "Single Family",
  title: "Single Family Generator Install",
  docCount: 3,
  inspectionCount: 8,
  lastUpdated: REVIEWED,
  summary: "Single family standby generator installation with transfer switch.",
  documents: [
    { name: "Equipment Specifications", description: "Manufacturer specifications for the generator including capacity, fuel type, and output rating.", required: "always" },
    { name: "Electrical Load Calculations", description: "Electrical load calculations showing generator capacity relative to the loads it will serve.", required: "always" },
    { name: "Site Plan", description: "Site plan showing generator placement, clearances, and fuel supply routing.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Generator disconnect, transfer switch, and labeling", tags: ["Life Safety"], description: "Standby generator installation requires approved transfer switch, disconnect, and required labeling.", code: "NEC 445 · NEC 702 · NEC 230.82" },
    { n: "02", title: "Grounding and bonding", tags: ["Life Safety"], description: "Grounding electrode, equipment grounding, and bonding per NEC Article 250.", code: "NEC 250" },
    { n: "03", title: "Plan review applicability (FBC 107.3.5)", tags: ["Documentation"], description: "Standby/emergency systems fall under NEC 702 compliance; plan review beyond electrical sub-permit is typically not required for 1 & 2 family.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Rough Electrical",
      code: "202",
      title: "Generator Rough Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Generator pad and placement — approved pad, clearances from structure, openings, property lines",
        "Electrical connection and transfer switch — installation, wire sizing, panel connection per plans",
        "Fuel line installation — gas line sizing, routing, and connections per plans (if NG/propane)",
        "Grounding — per NEC requirements",
      ],
      refs: "NEC 445.10 · 702.4 · 445.13 · 250.34 · FBC-FG 401.1 · FBC-M 304.1",
    },
    {
      phase: "Final Electrical",
      code: "608",
      title: "Generator Final Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Generator operational test — starts, runs, and transfers load properly",
        "Transfer switch operation — engages and disengages automatically",
        "Labeling and signage at generator, transfer switch, and main panel",
        "Sound and vibration — meets any local noise ordinance",
      ],
      refs: "NEC 702.4 · 702.7 · 445.11 · FBC-B 110.3",
    },
  ],
};

const SF_WATER_HEATER: PortalGuide = {
  slug: "single-family-hot-water-heater-changeout",
  category: "Single Family",
  title: "Single Family Hot Water Heater Changeout",
  docCount: 2,
  inspectionCount: 7,
  lastUpdated: REVIEWED,
  summary: "Single family water heater replacement — rough and final plumbing.",
  documents: [
    { name: "Equipment Specifications", description: "Manufacturer specifications for the replacement water heater including capacity, fuel type, and input rating.", required: "always" },
    { name: "AHRI Certification Sheet", description: "AHRI performance certification showing Uniform Energy Factor (UEF) rating for the replacement water heater.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Water heater installation requirements", tags: ["Code"], description: "Replacement water heater installation must include T&P valve, expansion control, drain pan, and proper combustion air / venting for fuel-fired units.", code: "FBC-P 504 · FBC-M 303 · FBC-FG" },
    { n: "02", title: "Plan review applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for replacing existing equipment (Exemption #1).", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Rough Plumbing",
      code: "402",
      title: "Water Heater Rough",
      tags: ["Required", "Plumbing", "Critical"],
      checks: [
        "Water heater specifications — model, capacity, and energy rating match approved plans",
        "TPR valve installed with proper discharge pipe to approved termination",
        "Drain pan installed under unit with drain line routed to approved location",
        "Supply connections — hot and cold water properly made with no leaks",
      ],
      refs: "FBC-P 607.1 · 607.4 · 607.5",
    },
    {
      phase: "Final Plumbing",
      code: "609",
      title: "Water Heater Final",
      tags: ["Required", "Plumbing", "Critical"],
      checks: [
        "Operational test — heats water and all fixtures receive hot water",
        "No visible leaks at any connection point",
        "Seismic strapping installed where required",
      ],
      refs: "FBC-P 607.1 · 312.1",
    },
  ],
};

const SF_HVAC_CHANGEOUT: PortalGuide = {
  slug: "single-family-hvac-changeout",
  category: "Single Family",
  title: "Single Family HVAC Changeout",
  docCount: 3,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Single family HVAC equipment changeout — final mechanical only.",
  documents: [
    { name: "AHRI Certification Sheet", description: "AHRI performance certification showing matched system ratings for the replacement HVAC equipment.", required: "always" },
    { name: "Survey / Site Plan", description: "Required if HVAC system is being relocated to a new location.", required: "conditional" },
    { name: "Sketch or Plans", description: "Required if HVAC system is being relocated to a new location — layout and ductwork modifications.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Energy Code Compliance", tags: ["Code"], description: "Replacement equipment SEER/HSPF must meet current FBC-E minimums.", code: "FBC-E R403 · FBC-E R405" },
    { n: "02", title: "Refrigerant, Condensate, Electrical", tags: ["Code"], description: "Standard changeout installation items: refrigerant line set pressurization/brazing, condensate drain primary/secondary, and electrical disconnect at unit.", code: "FBC-M 307 · FBC-M 1101 · NEC 440" },
    { n: "03", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for replacing existing equipment in kind.", code: "FBC-B 107.3.5" },
    { n: "04", title: "Equipment Sizing", tags: ["Code"], description: "Replacement equipment should be sized to match the load (Manual J) and air-distribution capability (Manual D) of the dwelling.", code: "FBC-R M1401.3 · FBC-M 309" },
  ],
  inspections: [
    {
      phase: "Final Mechanical / HVAC",
      code: "709",
      title: "HVAC Changeout Final",
      tags: ["Required", "Critical"],
      checks: [
        "System operational test — starts, runs, and produces heated and cooled air",
        "Equipment clearances — air handler and condenser have required clearances for service access",
        "Equipment labels and data plates match approved plans for capacity and efficiency",
        "Thermostat controls heating and cooling modes properly",
      ],
      refs: "FBC-M 304.1",
    },
  ],
};

export const SINGLE_FAMILY_GUIDES_2: PortalGuide[] = [
  SF_ELECTRICAL_ONLY,
  SF_FENCE,
  SF_FLOOD_PANEL,
  SF_FRAMED_DECK_DOCK,
  SF_GARAGE_FILL_IN,
  SF_GENERATOR,
  SF_WATER_HEATER,
  SF_HVAC_CHANGEOUT,
];
