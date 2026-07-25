// Single Family project guides — batch 3.
import type { PortalGuide, GuideDownload, GuideDoc, InspectionPhase } from "./portal-guides-data";

const REVIEWED = "Reviewed by Cleard permitting staff — July 2026";

const STANDARD_DOWNLOADS: GuideDownload[] = [
  { title: "Notice to Building Official — Use of Private Provider", meta: "Form 61G20-2.005 · FL Statute §553.791" },
  { title: "Private Provider Owner Authorization & Indemnification", meta: "FL Statute §553.791" },
];

const NTBO_OWNER: GuideDoc[] = [
  { name: "Notice to Building Official (NTBO)", description: "Required when using a private provider (Flōridian). Download below.", required: "conditional" },
  { name: "Owner Authorization Form", description: "Private Provider Owner Authorization & Indemnification. Download below.", required: "conditional" },
];

// ---------- Shared inspection blocks ----------

const ALU_FINAL_BUILDING: InspectionPhase = {
  phase: "Final Building",
  code: "610",
  title: "Aluminum — Final Building",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Base rail attachment and tapcon spacing per plans",
    "Post to base connection — structural connection of posts to base rail",
    "Post to roof beam connection — structural connection of posts to roof beams",
    "Gusset connections — gusset plates installed at structural joints per plans",
    "Beam to gutter connection — beams properly connected to gutter system",
    "Gutter clips installed at proper intervals",
    "Overall structure — shape and construction match approved plans",
    'Screen door opening mechanism at 54" height where pool barrier applies',
    "Pool equipment bonding — bonding wire at pool equipment and structure (if present)",
    "Elite (solid) roof panel sealing complete (if present)",
  ],
  refs: "FBC-B 2002.1 · 2002.4 · 2002.5 · NEC 680.26 · FBC-R R303",
};

const ROUGH_FRAMING: InspectionPhase = {
  phase: "Rough Framing",
  code: "301",
  title: "Rough Framing",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Wall stud size and spacing per approved plans",
    "Headers and beams over openings per plans",
    "Top and bottom plate connections — double top plates, anchored bottom plates",
    "Corner and intersection bracing",
    "Window and door rough openings match plans",
    "Hurricane straps and hold-down hardware per plans",
    "Fire blocking at required locations",
  ],
  refs: "FBC-R R602.3 · R602.7 · R602.10 · R802.11 · R602.8",
};

const FOOTING_SLAB_UFER: InspectionPhase = {
  phase: "Footing, Slab, UFER",
  code: "101",
  title: "Footing, Slab, UFER",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Footing width and depth match approved plans",
    "Rebar size, spacing, and placement per plans",
    "UFER — min. 20 ft of #4 bare copper or rebar encased in footing",
    "Slab vapor barrier installed per plans",
    "Slab thickness and wire mesh per plans",
    "Foundation anchorage — anchor bolt placement for sill plate",
  ],
  refs: "FBC-R R403.1 · R403.1.1 · R506.1 · R506.2.3 · R403.1.6 · NEC 250.52(A)(3)",
};

const UNDERGROUND_PLUMBING: InspectionPhase = {
  phase: "Underground Plumbing",
  code: "401",
  title: "Underground Plumbing",
  tags: ["Required", "Plumbing", "Critical"],
  checks: [
    "Pipe material and sizes match approved plans",
    "Underground pipe burial depth meets code minimum",
    "Pipe slope and support on drain lines",
    "System holds required pressure test",
    "Cleanout access points installed per plans",
  ],
  refs: "FBC-P 604.1 · 305.1 · 305.5 · 704.1 · 312.2 · 708.1",
};

const UNDERGROUND_ELECTRICAL: InspectionPhase = {
  phase: "Underground Electrical",
  code: "201",
  title: "Underground Electrical",
  tags: ["Required", "Electrical", "Critical"],
  checks: [
    "Conduit material, size, and routing per plans",
    "Conduit burial depth meets code minimum",
    "UFER grounding electrode connected to footing rebar",
    "Conduit protected from damage where exposed",
  ],
  refs: "NEC 300.5 · 300.5(D) · 250.52(A)(3)",
};

const FILL_CELL: InspectionPhase = {
  phase: "Fill Cell, Tie Beam, Lintel",
  code: "302",
  title: "Fill Cell, Tie Beam, Lintel",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Cells properly grouted per plans",
    "Tie beam rebar size, spacing, and lap splices per plans",
    "Lintel rebar and sizing over openings per plans",
    "Vertical rebar properly placed and spaced in block wall",
  ],
  refs: "FBC-R R609.1 · R609.1.1 · R609.7",
};

const ROOF_SHEATHING: InspectionPhase = {
  phase: "Roof Sheathing",
  code: "303",
  title: "Roof Sheathing",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Roof deck nailing pattern and edge spacing per approved schedule",
    "Panel material, thickness, and span rating match plans",
    "Proper edge gap between roof sheathing panels per manufacturer",
  ],
  refs: "FBC-R R803.1 · R803.2 · R802.11",
};

const WALL_SHEATHING: InspectionPhase = {
  phase: "Wall Sheathing",
  code: "304",
  title: "Wall Sheathing",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Wall sheathing nailing pattern and edge spacing per approved schedule (shear zones may require tighter spacing)",
    "Panel material, thickness, and grade stamp match plans",
    "Proper edge gap between wall sheathing panels per manufacturer",
  ],
  refs: "FBC-R R602.3",
};

const TRUSS_TIEDOWN: InspectionPhase = {
  phase: "Truss Tie Down and Engineering",
  code: "305",
  title: "Truss Tie Down and Engineering",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Truss spacing and alignment match approved plans",
    "Hurricane clips/straps at every truss-to-wall connection",
    "Lateral and diagonal bracing per truss engineering",
    "Sealed truss engineering package on site matches installed trusses",
    "Gable end trusses properly braced",
  ],
  refs: "FBC-R R802.10 · R802.10.1 · R802.10.3 · R802.11",
};

const ROOF_DRY_IN: InspectionPhase = {
  phase: "Roof Dry In",
  code: "306",
  title: "Roof Dry In (In Progress)",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Underlayment per code and manufacturer specs",
    "Drip edge at eaves and rakes",
    "Valley and wall flashing properly installed",
    "All roof penetrations sealed and flashed",
  ],
  refs: "FBC-R R905.1.1 · R905.2.8.5 · R903.2",
};

const ROUGH_PLUMBING: InspectionPhase = {
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
};

const ROUGH_ELECTRICAL: InspectionPhase = {
  phase: "Rough Electrical",
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
};

const ROUGH_HVAC: InspectionPhase = {
  phase: "Rough Mechanical / HVAC",
  code: "702",
  title: "Rough Mechanical / HVAC",
  tags: ["Required", "Mechanical", "Critical"],
  checks: [
    "Ductwork sizes, routing, and support per plans",
    "Duct joints and connections sealed",
    "Air handler and condenser placement with required clearances",
    "Refrigerant line sizing and insulation per plans",
    "Return air pathways properly sized and located",
  ],
  refs: "FBC-M 603.1 · 603.9 · 304.1 · 1101.3 · 601.2",
};

const INSULATION: InspectionPhase = {
  phase: "Insulation",
  code: "308",
  title: "Insulation",
  tags: ["Required", "Critical"],
  checks: [
    "Wall insulation R-value matches energy calcs",
    "Ceiling/attic insulation R-value per energy calcs",
    "No gaps, voids, or compression",
    "Air sealing at penetrations, top plates, and rim joists",
  ],
  refs: "FBC-E R402.1 · R402.4 · R402.4.1",
};

const LATHE_SIDING: InspectionPhase = {
  phase: "Lathe, Siding",
  code: "309",
  title: "Lathe, Siding",
  tags: ["Required", "Critical"],
  checks: [
    "Exterior wall covering per plans and properly installed",
    "Weather-resistive barrier behind cladding",
    "Flashing at windows, doors, and wall transitions",
    "Cladding fastener type and spacing per manufacturer/plans",
  ],
  refs: "FBC-R R703.1 · R703.2 · R703.4",
};

const DRYWALL: InspectionPhase = {
  phase: "Drywall",
  code: "310",
  title: "Drywall",
  tags: ["Required", "Critical"],
  checks: [
    "Drywall thickness per plans; moisture-resistant in wet areas",
    "Screw/nail spacing meets code",
    "Fire-rated assemblies with proper layers per rating",
    "Moisture barrier behind tub/shower surrounds where required",
  ],
  refs: "FBC-R R702.3.1 · R702.3.5 · R302.6 · R702.4",
};

const FINAL_ELECTRICAL: InspectionPhase = {
  phase: "Final Electrical",
  code: "608",
  title: "Final Electrical",
  tags: ["Required", "Electrical", "Critical"],
  checks: [
    "Panel cover installed, breakers labeled, no open knockouts",
    "All GFCI/AFCI devices test and reset properly",
    "Outlets and switches operate correctly",
    "All light fixtures installed and operational",
    "Exterior outlets GFCI protected; lighting functional",
  ],
  refs: "NEC 408.4 · 210.8 · 210.12 · 210.52 · 210.70 · 210.52(E)",
};

const FINAL_PLUMBING: InspectionPhase = {
  phase: "Final Plumbing",
  code: "609",
  title: "Final Plumbing",
  tags: ["Required", "Plumbing", "Critical"],
  checks: [
    "Fixtures installed, connected, and operational",
    "Water heater with TPR valve, drain pan, and discharge pipe",
    "No visible leaks at any supply or drain connection",
    "Exterior hose bibbs have backflow prevention",
  ],
  refs: "FBC-P 405.1 · 607.1 · 312.1 · 608.15.4.2",
};

const FINAL_HVAC: InspectionPhase = {
  phase: "Final Mechanical / HVAC",
  code: "709",
  title: "Final Mechanical / HVAC",
  tags: ["Required", "Mechanical", "Critical"],
  checks: [
    "System starts, runs, and produces heated and cooled air",
    "Equipment installed with clearances and level",
    "Condensate drain properly routed and terminated",
    "Supply and return registers installed and operational",
    "Equipment nameplates match approved plans",
  ],
  refs: "FBC-M 304.1 · 307.2 · 601.2",
};

const FINAL_BUILDING: InspectionPhase = {
  phase: "Final Building",
  code: "610",
  title: "Final Building",
  tags: ["Required", "Life Safety", "Critical"],
  checks: [
    'Egress doors — min. 32" clear width and proper hardware',
    "Smoke alarms in each bedroom, outside sleeping areas, each level",
    "CO alarms where required",
    "Bedroom windows meet emergency egress size",
    "Stair rise, run, handrail height, and landing dimensions",
    "Address numbers posted and visible from street",
    "Exterior cladding, trim, and weatherproofing complete",
    'Finish grade slopes away from foundation min. 6" in 10 feet',
  ],
  refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3",
};

const FULL_DWELLING_INSPECTIONS: InspectionPhase[] = [
  UNDERGROUND_PLUMBING,
  UNDERGROUND_ELECTRICAL,
  FOOTING_SLAB_UFER,
  FILL_CELL,
  ROUGH_FRAMING,
  ROOF_SHEATHING,
  WALL_SHEATHING,
  TRUSS_TIEDOWN,
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

const SF_ALUMINUM: PortalGuide = {
  slug: "single-family-aluminum",
  category: "Single Family",
  title: "Single Family Aluminum",
  docCount: 2,
  inspectionCount: 10,
  lastUpdated: REVIEWED,
  summary: "Single family aluminum screen enclosure or carport — final building only.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional showing aluminum structure layout and framing.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and structure footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Verify design wind speed (Vult) and exposure category match jurisdiction requirements for the project location.", code: "FBC-B 1609 · 2002 · ASCE 7-22" },
    { n: "02", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Verify connection details between the aluminum structure and the existing residence are shown with adequate fastener specifications.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Footing design (if new footing)", tags: ["Life Safety"], description: "If scope includes new footings, verify footing dimensions, reinforcement, and depth are shown.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "04", title: "Florida product approvals", tags: ["Code"], description: "Verify FL Product Approvals or Miami-Dade NOA are listed for fenestration, screen systems, or structural panels subject to wind load.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "05", title: "Egress from enclosed area", tags: ["Code"], description: "If the aluminum structure encloses an egress path from a sleeping room or dwelling unit, verify egress is maintained.", code: "FBC-R R310 · R311" },
    { n: "06", title: "Engineer of record seal", tags: ["Documentation"], description: "Confirm structural drawings bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [ALU_FINAL_BUILDING],
};

const SF_ALUMINUM_SHED: PortalGuide = {
  slug: "single-family-aluminum-structure-with-shed",
  category: "Single Family",
  title: "Single Family Aluminum Structure with Shed",
  docCount: 3,
  inspectionCount: 17,
  lastUpdated: REVIEWED,
  summary: "Aluminum carport/enclosure combined with a framed shed — rough framing plus aluminum final.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Sealed plans showing layout/framing plus wind load criteria and anchor method.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for structural components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and structure footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Reviewed per building department requirements", tags: ["Documentation"], description: "Plan review performed when the building department requires it or the client opts in. Scope combines aluminum enclosure and light framed shed — verify wind load, connections, and product approvals.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      ...ROUGH_FRAMING,
      title: "Shed — Rough Framing",
      checks: [
        ...ROUGH_FRAMING.checks,
        "Shed-to-aluminum attachment per engineering",
        "Wall and roof sheathing properly nailed per schedule",
      ],
      refs: "FBC-R R602.3 · R602.7 · R602.10 · R802.3 · R802.10 · R802.11 · R803.2 · FBC-B 2002.1",
    },
    ALU_FINAL_BUILDING,
  ],
};

const SF_ALUMINUM_FOOTING: PortalGuide = {
  slug: "single-family-aluminum-w-new-footing",
  category: "Single Family",
  title: "Single Family Aluminum w/ New Footing",
  docCount: 2,
  inspectionCount: 14,
  lastUpdated: REVIEWED,
  summary: "Aluminum enclosure or carport with new footing — footing inspection plus aluminum final.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Sealed plans showing aluminum structure layout and framing, plus footing and foundation engineering details.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and structure footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Florida product approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Aluminum screen enclosures not in FBC-B 107.3.5 minimum criteria; footing component requires review when building department mandates or client opts in.", code: "FBC-B 107.3.5" },
    { n: "05", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Footing, Slab, UFER",
      code: "101",
      title: "Footing — Aluminum Structure",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Footing depth and width match approved plans",
        "Rebar size, spacing, and placement per plans",
        "Footing layout matches approved site plan dimensions",
        "Excavation free of standing water, loose soil, and debris before pour",
      ],
      refs: "FBC-R R403.1 · R403.1.1 · FBC-B 110.3",
    },
    ALU_FINAL_BUILDING,
  ],
};

const SF_ATTACHED_DWELLING: PortalGuide = {
  slug: "single-family-attached-dwelling-space",
  category: "Single Family",
  title: "Single Family Attached Dwelling Space",
  docCount: 5,
  inspectionCount: 91,
  lastUpdated: REVIEWED,
  summary: "Attached dwelling addition — full inspection sequence from underground to final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing addition layout and connection to existing structure.", required: "always" },
    { name: "Energy Compliance Forms", description: "Energy compliance documentation per FBC Chapter 13 / IECC.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, doors, roofing, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and addition footprint.", required: "always" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Truss engineering package, conventional framing per FBC, or a truss deferral letter requesting deferred submittal.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Egress from sleeping rooms", tags: ["Life Safety"], description: "Each sleeping room must have an emergency escape and rescue opening.", code: "FBC-R R310" },
    { n: "03", title: "Smoke and CO alarm coverage", tags: ["Life Safety"], description: "Smoke alarms in each sleeping room, outside each sleeping area, and on each story.", code: "FBC-R R314 · R315" },
    { n: "04", title: "Structural wall section and load path", tags: ["Life Safety"], description: "A continuous wall section from foundation through roof must show framing, sheathing, connectors, and uplift resistance.", code: "FBC-R R301 · R602 · R802" },
    { n: "05", title: "Florida product approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "06", title: "Combustion air and venting", tags: ["Life Safety"], description: "Fuel-fired equipment requires combustion air and proper venting per FBC-M 303/804.", code: "FBC-M 303 · 804 · FBC-FG" },
    { n: "07", title: "Manual J / S / D load calculation", tags: ["Code"], description: "HVAC sizing per Manual J; selection per Manual S; duct design per Manual D.", code: "FBC-R M1401.3 · FBC-M 309" },
    { n: "08", title: "Ventilation", tags: ["Code"], description: "Whole-house or occupancy-based ventilation per FBC-R M1507 / FBC-M 403.", code: "FBC-R M1507 · FBC-M 403" },
    { n: "09", title: "AFCI and GFCI protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI per NEC 210.8.", code: "NEC 210.8 · 210.12" },
    { n: "10", title: "Grounding and bonding", tags: ["Life Safety"], description: "Grounding electrode, equipment grounding, and bonding per NEC Article 250.", code: "NEC 250" },
    { n: "11", title: "Service size and load calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
    { n: "12", title: "Water service and DWV sizing", tags: ["Code"], description: "Water service line sizing and DWV sizing consistent with fixture unit count.", code: "FBC-P 604 · 709 · 906" },
    { n: "13", title: "Backflow prevention", tags: ["Code"], description: "Backflow prevention required at well, irrigation, or other cross-connections per FBC-P 608.", code: "FBC-P 608" },
  ],
  inspections: FULL_DWELLING_INSPECTIONS,
};

const SF_ATTACHED_GARAGE: PortalGuide = {
  slug: "single-family-attached-garage",
  category: "Single Family",
  title: "Single Family Attached Garage",
  docCount: 5,
  inspectionCount: 19,
  lastUpdated: REVIEWED,
  summary: "Attached garage addition — full inspection sequence from underground to final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing garage layout, framing, and connection to existing structure.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, doors, roofing, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and new construction footprint.", required: "always" },
    { name: "Energy Compliance Forms", description: "Required if garage includes conditioned (air-conditioned) space.", required: "conditional" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Required only when structure uses pre-engineered trusses and truss engineering is not shown in the sealed drawings.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's adopted wind map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Structural wall section and load path", tags: ["Life Safety"], description: "A continuous wall section from foundation through roof must show framing, sheathing, connectors, and load path.", code: "FBC-R R301 · R602 · R802" },
    { n: "04", title: "Detached-structure setback", tags: ["Life Safety"], description: "Detached accessory structure must meet setback and distance-to-property-line requirements.", code: "FBC-R R302" },
    { n: "05", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
    { n: "06", title: "AFCI and GFCI protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI per NEC 210.8 at required locations.", code: "NEC 210.8 · 210.12" },
    { n: "07", title: "Service size and load calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
  ],
  inspections: FULL_DWELLING_INSPECTIONS,
};

const SF_CONCRETE_FOOTING: PortalGuide = {
  slug: "single-family-concrete-footing-foundation",
  category: "Single Family",
  title: "Single Family Concrete Footing/Foundation",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Standalone concrete footing/foundation scope — footing inspection and final building.",
  documents: [
    { name: "Plans or Detailed Drawings", description: "Construction drawings showing concrete work layout, dimensions, and reinforcement details.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and concrete work footprint.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Plan review applicability (FBC 107.3.5)", tags: ["Documentation"], description: "Standalone footing scope without superstructure is not a typical plan review trigger under FBC-B 107.3.5 for 1 & 2 family. Flōridian performs this review only when the building department requires plan review or the client opts in.", code: "FBC-B 107.3.5" },
    { n: "04", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [FOOTING_SLAB_UFER, FINAL_BUILDING],
};

const SF_DEMOLITION: PortalGuide = {
  slug: "single-family-demolition",
  category: "Single Family",
  title: "Single Family Demolition",
  docCount: 3,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Single family demolition permit — final building inspection covers all demolition items.",
  documents: [
    { name: "Demolition Plan or Detailed Scope of Work", description: "Demolition plan or detailed written scope of work describing all demolition activities.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing structures to be demolished and surrounding features.", required: "always" },
    { name: "Asbestos Survey", description: "Asbestos survey guidance based on year built and risk; verify requirement during downstream review as needed.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Asbestos / Lead Paint Assessment", tags: ["Life Safety"], description: "Pre-demolition asbestos survey is required by federal NESHAP rules for most structures. Lead paint assessment required for pre-1978 dwellings disturbing painted surfaces.", code: "40 CFR 61 Subpart M · 40 CFR 745 (RRP) · FBC-B 107.3.5" },
    { n: "02", title: "Adjacent Property Protection & Utility Disconnects", tags: ["Life Safety"], description: "Demolition plan should identify utility disconnect responsibilities and adjacent-property protection for shared walls or close structures.", code: "FBC-EB 1401 · Local demolition standards" },
    { n: "03", title: "Plan Review Applicability", tags: ["Documentation"], description: "FBC-B 107.3.5 identifies asbestos removal as the only minimum plan review criterion for demolition.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Demolition — Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Structure fully demolished and removed from site",
        "All utilities (electric, gas, water, sewer) properly disconnected and capped",
        "Site graded, debris removed, no hazardous materials remain",
        "Erosion control measures in place if required",
      ],
      refs: "FBC-B 110.3 · 3303.2 · 3303.3 · 3303.5",
    },
  ],
};

const SF_DETACHED_GARAGE: PortalGuide = {
  slug: "single-family-detached-garage",
  category: "Single Family",
  title: "Single Family Detached Garage",
  docCount: 5,
  inspectionCount: 91,
  lastUpdated: REVIEWED,
  summary: "Detached garage — full inspection sequence from underground to final building.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Construction drawings showing garage layout and framing.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, doors, roofing, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and new construction footprint.", required: "always" },
    { name: "Energy Compliance Forms", description: "Required if garage includes conditioned (air-conditioned) space.", required: "conditional" },
    { name: "Truss Engineering & Layout OR Truss Deferral Affidavit", description: "Required only when structure uses pre-engineered trusses and truss engineering is not shown in the sealed plan set.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Structural wall section and load path", tags: ["Life Safety"], description: "A continuous wall section from foundation through roof must show framing, sheathing, connectors, and uplift resistance.", code: "FBC-R R301 · R602 · R802" },
    { n: "04", title: "Detached-structure setback", tags: ["Life Safety"], description: "Detached accessory structure must meet setback and distance-to-property-line requirements.", code: "FBC-R R302" },
    { n: "05", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
    { n: "06", title: "AFCI and GFCI protection", tags: ["Life Safety"], description: "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI per NEC 210.8 at required locations.", code: "NEC 210.8 · 210.12" },
    { n: "07", title: "Service size and load calculation", tags: ["Code"], description: "Electrical service and feeder sizing supported by NEC Article 220 load calculation.", code: "NEC 220 · 230" },
  ],
  inspections: FULL_DWELLING_INSPECTIONS,
};

export const SINGLE_FAMILY_GUIDES_3: PortalGuide[] = [
  SF_ALUMINUM,
  SF_ALUMINUM_SHED,
  SF_ALUMINUM_FOOTING,
  SF_ATTACHED_DWELLING,
  SF_ATTACHED_GARAGE,
  SF_CONCRETE_FOOTING,
  SF_DEMOLITION,
  SF_DETACHED_GARAGE,
];
