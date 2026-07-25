// Commercial project guides — registered into /portal/guides.
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

const COMMERCIAL_ALUMINUM: PortalGuide = {
  slug: "commercial-aluminum",
  category: "Commercial",
  title: "Commercial Aluminum",
  docCount: 2,
  inspectionCount: 10,
  lastUpdated: REVIEWED,
  summary: "Commercial aluminum structure attached to an existing structure — no new footing.",
  documents: [
    {
      name: "Construction Plans Sealed by a Florida Registered Design Professional",
      description:
        "Construction plans sealed by a Florida-registered design professional showing aluminum structure layout.",
      required: "always",
    },
    {
      name: "Site Plan / Survey",
      description:
        "Site plan or survey showing property boundaries, setbacks, and structure footprint.",
      required: "always",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Design wind speed & exposure",
      tags: ["Life Safety"],
      description:
        "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction.",
      code: "FBC-B 1609 · ASCE 7-22",
    },
    {
      n: "02",
      title: "Attachment to existing structure",
      tags: ["Life Safety"],
      description:
        "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.",
      code: "FBC-B 2002.5 · FBC-R R301.1",
    },
    {
      n: "03",
      title: "Florida product approval",
      tags: ["Code"],
      description:
        "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration, etc.).",
      code: "FBC-B 1708 · FBC-R R301.2.1.2",
    },
    {
      n: "04",
      title: "Engineer of record seal",
      tags: ["Documentation"],
      description:
        "Structural drawings must bear a current Florida-licensed engineer's seal and signature.",
      code: "FL Statutes Ch. 471 · FBC-B 107.3.5",
    },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Aluminum Structure — Final Building",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Base rail attachment — verify base rail is secured with tapcons at correct spacing per plans",
        "Post to base connection — verify structural connection of posts to base rail",
        "Post to roof beam connection — verify structural connection of posts to roof beams",
        "Gusset connections — verify gusset plates are installed at structural joints per plans",
        "Beam to gutter connection — verify beams are properly connected to gutter system",
        "Gutter clips — verify gutter clips are installed at proper intervals",
        "Overall structure — verify overall shape and construction matches approved plans",
        "Screen door opening mechanism height — verify door latch at 54\" where pool barrier applies",
        "Pool equipment bonding — if pool equipment is present, verify bonding wire at equipment and structure",
        "Elite roof panel sealing — if elite (solid) roof panels are present, verify sealing is complete",
      ],
      refs: "FBC-B 2002.1 · FBC-B 2002.4 · FBC-B 2002.5 · NEC 680.26 · FBC-R R303",
    },
  ],
};

const COMMERCIAL_ALUMINUM_NEW_FOOTING: PortalGuide = {
  slug: "commercial-aluminum-w-new-footing",
  category: "Commercial",
  title: "Commercial Aluminum w/ New Footing",
  docCount: 2,
  inspectionCount: 14,
  lastUpdated: REVIEWED,
  summary: "Commercial aluminum structure with new footing and foundation engineering.",
  documents: [
    {
      name: "Construction Plans Sealed by FL Registered Design Professional",
      description:
        "Plans showing aluminum structure layout, framing, footing and foundation engineering details.",
      required: "always",
    },
    {
      name: "Site Plan / Survey",
      description: "Property boundaries, setbacks, and structure footprint.",
      required: "always",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [],
  inspections: [
    {
      phase: "Phase 1",
      code: "101",
      title: "Footing, Slab, UFER (Building)",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Footing dimensions — verify footing depth and width match approved plans",
        "Rebar size and placement — verify rebar size, spacing, and placement per approved plans",
        "Footing layout and alignment — verify footing layout matches approved site plan dimensions",
        "Clean and debris-free excavation — confirm excavation is free of standing water, loose soil, and debris",
      ],
      refs: "FBC-R R403.1 · R403.1.1 · FBC-B 110.3",
    },
    {
      phase: "Phase 2",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Base rail attachment and tapcon spacing",
        "Post to base connection",
        "Post to roof beam connection",
        "Gusset connections per approved plans",
        "Beam to gutter connection",
        "Gutter clips at proper intervals",
        "Overall structure matches approved plans",
        "Screen door opening mechanism height (54\" where pool barrier applies)",
        "Pool equipment bonding if present",
        "Elite roof panel sealing if present",
      ],
      refs: "FBC-B 2002.1 · 2002.4 · 2002.5 · NEC 680.26 · FBC-R R303",
    },
  ],
};

const COMMERCIAL_CONCRETE_FOOTING: PortalGuide = {
  slug: "commercial-concrete-footing-foundation",
  category: "Commercial",
  title: "Commercial Concrete Footing/Foundation",
  docCount: 2,
  inspectionCount: 14,
  lastUpdated: REVIEWED,
  summary: "Commercial concrete footing and foundation permit.",
  documents: [
    {
      name: "Construction Plans Sealed by a Florida Registered Design Professional",
      description:
        "Construction plans sealed by a Florida-registered design professional showing concrete work layout, dimensions, and reinforcement.",
      required: "always",
    },
    {
      name: "Site Plan / Survey",
      description:
        "Site plan or survey showing property boundaries and concrete work footprint.",
      required: "always",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Design Wind Speed & Exposure",
      tags: ["Life Safety"],
      description:
        "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.",
      code: "FBC-B 1609 · ASCE 7-22",
    },
    {
      n: "02",
      title: "Footing / Foundation Design",
      tags: ["Life Safety"],
      description:
        "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.",
      code: "FBC-R R403 · FBC-B 1809",
    },
    {
      n: "03",
      title: "Occupancy Classification",
      tags: ["Life Safety"],
      description:
        "Occupancy group must be clearly stated. Any change of occupancy requires FBC-EB Ch. 10 compliance path.",
      code: "FBC-B 302 · FBC-EB Ch. 10",
    },
    {
      n: "04",
      title: "Engineer of Record Seal",
      tags: ["Documentation"],
      description:
        "Structural drawings must bear a current Florida-licensed engineer's seal and signature.",
      code: "FL Statutes Ch. 471 · FBC-B 107.3.5",
    },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "101",
      title: "Footing, Slab, UFER (Building)",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Footing dimensions — verify footing width and depth match approved plans",
        "Rebar size and spacing — verify rebar size, spacing, and placement per plans",
        "UFER grounding electrode — verify minimum 20 feet of #4 bare copper or rebar encased in footing",
        "Slab vapor barrier — verify vapor barrier is installed under slab per plans",
        "Slab thickness and wire mesh — verify slab thickness and reinforcement per plans",
        "Foundation anchorage layout — verify anchor bolt placement for sill plate attachment",
      ],
      refs: "FBC-R R403.1 · R506.2.3 · R506.1 · R403.1.6 · NEC 250.52(A)(3)",
    },
    {
      phase: "Phase 2",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Egress doors and hardware — minimum 32\" clear width and proper hardware",
        "Smoke alarms in each bedroom, outside sleeping areas, and each level",
        "CO alarms where required",
        "Emergency escape openings — bedroom windows meet egress size requirements",
        "Stairway compliance — rise, run, handrail height, and landing dimensions",
        "Address numbers posted and visible from street",
        "Exterior finishes, trim, and weatherproofing complete",
        "Site grading — finish grade slopes away from foundation min. 6\" in 10 feet",
      ],
      refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3",
    },
  ],
};

const COMMERCIAL_DEMOLITION: PortalGuide = {
  slug: "commercial-demolition",
  category: "Commercial",
  title: "Commercial Demolition",
  docCount: 4,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Commercial demolition permit under the private provider program.",
  documents: [
    {
      name: "Sealed Demolition Plans",
      description: "Demolition plans sealed by a Florida-registered design professional.",
      required: "always",
    },
    {
      name: "Site Plan / Survey",
      description:
        "Site plan or survey showing structures to be demolished and surrounding features.",
      required: "always",
    },
    {
      name: "Asbestos Survey",
      description:
        "May be required depending on year built and asbestos risk factors.",
      required: "conditional",
    },
    {
      name: "Environmental Assessment",
      description:
        "Required for commercial structures where hazardous materials may be present.",
      required: "conditional",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Asbestos / Lead Paint Assessment",
      tags: ["Life Safety"],
      description:
        "Commercial demolition triggers NESHAP asbestos survey and RRP lead paint compliance for applicable structures.",
      code: "40 CFR 61 Subpart M · 40 CFR 745",
    },
    {
      n: "02",
      title: "Environmental and Hazardous Materials",
      tags: ["Life Safety"],
      description:
        "Commercial structures may contain additional hazmat (mercury switches, PCB ballasts, refrigerants) requiring special handling.",
      code: "FDEP hazmat rules · 40 CFR",
    },
    {
      n: "03",
      title: "Structural Protection and Sequencing",
      tags: ["Life Safety"],
      description:
        "Demolition sequencing must preserve stability of remaining and adjacent structures.",
      code: "FBC-EB 1401",
    },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Demolition Final",
      tags: ["Required", "Critical"],
      checks: [
        "Structure fully demolished and removed from site",
        "Utility disconnection — all utilities (electric, gas, water, sewer) properly disconnected and capped",
        "Site condition — graded, debris removed, no hazardous materials remain",
        "Erosion control measures are in place if required",
      ],
      refs: "FBC-B 110.3 · 3303.5 · 3303.3 · 3303.2",
    },
  ],
};

const COMMERCIAL_DETACHED_GARAGE: PortalGuide = {
  slug: "commercial-detached-garage",
  category: "Commercial",
  title: "Commercial Detached Garage",
  docCount: 5,
  inspectionCount: 19,
  lastUpdated: REVIEWED,
  summary:
    "Commercial detached garage — full-scope build under the private provider program.",
  documents: [
    {
      name: "Construction Plans Sealed by a Florida Registered Design Professional",
      description: "Construction plans sealed by a Florida-registered design professional.",
      required: "always",
    },
    {
      name: "Product Approvals",
      description: "Florida Product Approvals for regulated components.",
      required: "always",
    },
    {
      name: "Site Plan / Survey",
      description:
        "Site plan or survey showing property boundaries, setbacks, and construction footprint.",
      required: "always",
    },
    {
      name: "Energy Compliance Forms",
      description: "Required when garage includes conditioned space.",
      required: "conditional",
    },
    {
      name: "Truss Engineering & Layout OR Truss Deferral Affidavit",
      description:
        "Only when structure uses pre-engineered trusses and truss engineering is not shown in the sealed plan set; satisfied by truss engineering in plan set OR conventional framing per FBC OR a truss deferral letter.",
      required: "conditional",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Design wind speed & exposure",
      tags: ["Life Safety"],
      description:
        "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.",
      code: "FBC-B 1609 · ASCE 7-22",
    },
    {
      n: "02",
      title: "Footing / foundation design",
      tags: ["Life Safety"],
      description:
        "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.",
      code: "FBC-R R403 · FBC-B 1809",
    },
    {
      n: "03",
      title: "Detached-structure setback",
      tags: ["Life Safety"],
      description:
        "Detached accessory structure must meet setback and distance-to-property-line requirements.",
      code: "FBC-R R302",
    },
    {
      n: "04",
      title: "Engineer of record seal",
      tags: ["Documentation"],
      description:
        "Structural drawings must bear a current Florida-licensed engineer's seal and signature.",
      code: "FL Statutes Ch. 471 · FBC-B 107.3.5",
    },
    {
      n: "05",
      title: "AFCI and GFCI protection",
      tags: ["Life Safety"],
      description:
        "AFCI protection for dwelling unit branch circuits per NEC 210.12; GFCI per NEC 210.8 at required locations.",
      code: "NEC 210.8 · NEC 210.12",
    },
    {
      n: "06",
      title: "Service size and load calculation",
      tags: ["Code"],
      description:
        "Electrical service and feeder sizing supported by NEC Article 220 load calculation.",
      code: "NEC 220 · NEC 230",
    },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "401",
      title: "Underground Plumbing",
      tags: ["Required", "Plumbing"],
      checks: [
        "Pipe material and sizing match approved plans",
        "Burial depth meets code minimum",
        "Pipe slope and support on drain lines",
        "Pressure test — system holds required pressure",
        "Cleanout access points installed per plans",
      ],
      refs: "FBC-P 604.1 · 305.1 · 305.5 · 704.1 · 312.2 · 708.1",
    },
    {
      phase: "Phase 2",
      code: "201",
      title: "Underground Electrical",
      tags: ["Electrical"],
      checks: [
        "Conduit material, size, and routing per plans",
        "Burial depth meets code minimum",
        "UFER ground connection to rebar in footing",
        "Conduit protected from damage where exposed",
      ],
      refs: "NEC 300.5 · 250.52(A)(3) · 300.5(D)",
    },
    {
      phase: "Phase 3",
      code: "101",
      title: "Footing, Slab, UFER",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Footing dimensions match approved plans",
        "Rebar size, spacing, and placement per plans",
        "UFER grounding — 20 ft of #4 bare copper or rebar encased",
        "Slab vapor barrier installed per plans",
        "Slab thickness and wire mesh per plans",
        "Foundation anchorage layout — anchor bolts for sill plate",
      ],
      refs: "FBC-R R403.1 · R506.2.3 · R506.1 · R403.1.6 · NEC 250.52(A)(3)",
    },
    {
      phase: "Phase 4",
      code: "104",
      title: "Fill Cell, Tie Beam, Lintel",
      tags: ["Structural", "Critical"],
      checks: [
        "Cells properly grouted per plans",
        "Tie beam rebar size, spacing, and lap splices per plans",
        "Lintel rebar and sizing over openings per plans",
        "Vertical rebar properly placed and spaced in block wall",
      ],
      refs: "FBC-R R609.1 · R609.1.1 · R609.7",
    },
    {
      phase: "Phase 5",
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
      phase: "Phase 6",
      code: "302",
      title: "Roof Sheathing",
      tags: ["Structural", "Critical"],
      checks: [
        "Nailing pattern and edge spacing per approved nailing schedule",
        "Panel material, thickness, and span rating per plans",
        "Proper edge gap between sheathing panels",
      ],
      refs: "FBC-R R803.1 · R803.2 · R802.11",
    },
    {
      phase: "Phase 7",
      code: "303",
      title: "Wall Sheathing",
      tags: ["Structural", "Critical"],
      checks: [
        "Nailing pattern and edge spacing per approved nailing schedule",
        "Panel material, thickness, and grade stamp per plans",
        "Proper edge gap between sheathing panels",
      ],
      refs: "FBC-R R602.3",
    },
    {
      phase: "Phase 8",
      code: "304",
      title: "Truss Tie Down and Engineering",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Truss spacing and alignment per plans",
        "Hurricane clips/straps at every truss-to-wall connection",
        "Lateral and diagonal bracing per truss engineering",
        "Sealed truss engineering package on site",
        "Gable end trusses properly braced",
      ],
      refs: "FBC-R R802.10 · R802.10.1 · R802.10.3 · R802.11",
    },
    {
      phase: "Phase 9",
      code: "305",
      title: "Roof Dry-In (In Progress)",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Underlayment installed per code and manufacturer specs",
        "Drip edge installed at eaves and rakes",
        "Valley flashing and wall flashing properly installed",
        "All roof penetrations sealed and flashed",
      ],
      refs: "FBC-R R905.1.1 · R905.2.8.5 · R903.2",
    },
    {
      phase: "Phase 10",
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
      phase: "Phase 11",
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
      refs: "NEC 408.4 · 210.3 · 240.4 · 314.16 · 210.8 · 210.12 · 250.50",
    },
    {
      phase: "Phase 12",
      code: "702",
      title: "Rough Mechanical / HVAC",
      tags: ["Required", "Critical"],
      checks: [
        "Duct sizes, routing, and support per plans",
        "Duct joints and connections properly sealed",
        "Air handler and condenser placement with required clearances",
        "Refrigerant line sizing and insulation per plans",
        "Return air pathways properly sized and located",
      ],
      refs: "FBC-M 603.1 · 603.9 · 304.1 · 1101.3 · 601.2",
    },
    {
      phase: "Phase 13",
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
      phase: "Phase 14",
      code: "307",
      title: "Lathe, Siding",
      tags: ["Critical"],
      checks: [
        "Exterior wall covering matches approved plans, properly installed",
        "Weather-resistive barrier properly installed behind cladding",
        "Flashing at windows, doors, and wall transitions",
        "Cladding fastener type and spacing per manufacturer and plans",
      ],
      refs: "FBC-R R703.1 · R703.2 · R703.4",
    },
    {
      phase: "Phase 15",
      code: "308",
      title: "Drywall",
      tags: ["Critical"],
      checks: [
        "Drywall thickness per plans; moisture-resistant in wet areas",
        "Screw or nail spacing meets code",
        "Fire-rated assemblies with proper drywall layers per rating",
        "Moisture barrier behind tub/shower surrounds where required",
      ],
      refs: "FBC-R R702.3.1 · R702.3.5 · R302.6 · R702.4",
    },
    {
      phase: "Phase 16",
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
      phase: "Phase 17",
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
      phase: "Phase 18",
      code: "709",
      title: "Final Mechanical / HVAC",
      tags: ["Required", "Critical"],
      checks: [
        "System starts, runs, and produces heated and cooled air",
        "Equipment properly installed with clearances and level",
        "Condensate drain properly routed and terminated",
        "All supply and return registers installed and operational",
        "Equipment nameplates match approved plans",
      ],
      refs: "FBC-M 304.1 · 307.2 · 601.2",
    },
    {
      phase: "Phase 19",
      code: "610",
      title: "Final Building",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Egress doors minimum 32\" clear width and proper hardware",
        "Smoke alarms in each bedroom, outside sleeping areas, each level",
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

const COMMERCIAL_ELECTRICAL_ONLY: PortalGuide = {
  slug: "commercial-electrical-only",
  category: "Commercial",
  title: "Commercial Electrical Only",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Commercial electrical-only scope under the private provider program.",
  documents: [
    {
      name: "Sealed Electrical Plans",
      description: "Electrical plans sealed by a Florida-registered design professional.",
      required: "always",
    },
    {
      name: "Load Calculations",
      description:
        "Required if scope includes a service upgrade or panel replacement (include existing vs. new equipment information).",
      required: "conditional",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Grounding and bonding",
      tags: ["Life Safety"],
      description:
        "Grounding electrode, equipment grounding, and bonding per NEC Article 250.",
      code: "NEC 250",
    },
    {
      n: "02",
      title: "Service size and load calculation",
      tags: ["Code"],
      description:
        "Electrical service and feeder sizing supported by NEC Article 220 load calculation.",
      code: "NEC 220 · NEC 230",
    },
    {
      n: "03",
      title: "Plan review applicability (FBC 107.3.5)",
      tags: ["Documentation"],
      description:
        "Per FBC-B 107.3.5, plan review is not required for minor electrical repairs (Exemption #3). Cleard performs this review only when the building department requires plan review or the client opts in.",
      code: "FBC-B 107.3.5",
    },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "202",
      title: "Rough Electrical",
      tags: ["Required", "Electrical"],
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
      phase: "Phase 2",
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

const COMMERCIAL_FENCE: PortalGuide = {
  slug: "commercial-fence",
  category: "Commercial",
  title: "Commercial Fence",
  docCount: 2,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Commercial fence permit.",
  documents: [
    {
      name: "Site Plan",
      description:
        "Site plan showing fence location, height, and relationship to property boundaries.",
      required: "always",
    },
    {
      name: "Product Specifications",
      description: "Product specifications for fence materials and design.",
      required: "always",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Design Wind Speed & Exposure",
      tags: ["Life Safety"],
      description:
        "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.",
      code: "FBC-B 1609 · ASCE 7-22",
    },
    {
      n: "02",
      title: "Engineer of Record Seal",
      tags: ["Documentation"],
      description:
        "Structural drawings must bear a current Florida-licensed engineer's seal and signature.",
      code: "FL Statutes Ch. 471 · FBC-B 107.3.5",
    },
    {
      n: "03",
      title: "Commercial Fencing Wind Load and Safety",
      tags: ["Code"],
      description:
        "Commercial fence design must address wind load per ASCE 7 and any safety requirements (e.g., child-safe opening patterns if enclosing amenity areas).",
      code: "FBC-B 1609 · ASCE 7",
    },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Commercial Fence — Final",
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

const COMMERCIAL_FLOOD_PANEL: PortalGuide = {
  slug: "commercial-flood-panel-installation",
  category: "Commercial",
  title: "Commercial Flood Panel Installation",
  docCount: 3,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Commercial flood panel/barrier installation permit.",
  documents: [
    {
      name: "Florida Product Approval (Flood Panel/Barrier)",
      description:
        "Proof of FL# approval or Miami-Dade NOA for the flood panel/barrier product.",
      required: "always",
    },
    {
      name: "Installation Details / Anchor Schedule",
      description:
        "Technical documentation showing fastener type, spacing, and embedment.",
      required: "always",
    },
    {
      name: "Site Plan / Survey",
      description:
        "Property survey and site plan showing project location and scope.",
      required: "always",
    },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    {
      n: "01",
      title: "Attachment to existing structure",
      tags: ["Life Safety"],
      description:
        "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.",
      code: "FBC-B 2002.5 · FBC-R R301.1",
    },
    {
      n: "02",
      title: "Florida product approval",
      tags: ["Code"],
      description:
        "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration, structural panels, covering systems).",
      code: "FBC-B 1708 · FBC-R R301.2.1.2",
    },
    {
      n: "03",
      title: "Engineer of record seal",
      tags: ["Documentation"],
      description:
        "Structural drawings must bear a current Florida-licensed engineer's seal and signature.",
      code: "FL Statutes Ch. 471 · FBC-B 107.3.5",
    },
  ],
  inspections: [
    {
      phase: "Final Building",
      code: "610",
      title: "Flood Panel — Final",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Product approval verification — valid FL Product Approval or engineering matches approved plans",
        "Track and mounting installation — tracks and anchors per manufacturer specs and engineering",
        "Panel fit and seal — panels fit properly in tracks with complete seal against water intrusion",
        "Coverage of all required openings below flood elevation per approved plans",
      ],
      refs: "FBC-B 1612.1 · 1612.4",
    },
  ],
};

export const COMMERCIAL_GUIDES: PortalGuide[] = [
  COMMERCIAL_ALUMINUM,
  COMMERCIAL_ALUMINUM_NEW_FOOTING,
  COMMERCIAL_CONCRETE_FOOTING,
  COMMERCIAL_DEMOLITION,
  COMMERCIAL_DETACHED_GARAGE,
  COMMERCIAL_ELECTRICAL_ONLY,
  COMMERCIAL_FENCE,
  COMMERCIAL_FLOOD_PANEL,
];
