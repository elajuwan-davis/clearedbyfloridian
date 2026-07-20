// Single Family + Commercial project guides — batch 4.
import type { PortalGuide, GuideDownload, GuideDoc, InspectionPhase } from "./portal-guides-data";

export const REVIEWED = "Reviewed by Flōridian permitting staff — July 2026";

export const STANDARD_DOWNLOADS: GuideDownload[] = [
  { title: "Notice to Building Official — Use of Private Provider", meta: "Form 61G20-2.005 · FL Statute §553.791" },
  { title: "Private Provider Owner Authorization & Indemnification", meta: "FL Statute §553.791" },
];

export const NTBO_OWNER: GuideDoc[] = [
  { name: "Notice to Building Official (NTBO)", description: "Required when using a private provider (Flōridian). Download below.", required: "conditional" },
  { name: "Owner Authorization Form", description: "Private Provider Owner Authorization & Indemnification. Download below.", required: "conditional" },
];

// ---------- Shared phase blocks ----------
export const ROUGH_FRAMING: InspectionPhase = {
  phase: "Rough Framing", code: "301", title: "Rough Framing",
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
export const ROOF_DRY_IN: InspectionPhase = {
  phase: "Roof Dry In", code: "306", title: "Roof Dry In (In Progress)",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Underlayment per code and manufacturer specs",
    "Drip edge at eaves and rakes",
    "Valley and wall flashing properly installed",
    "All roof penetrations sealed and flashed",
  ],
  refs: "FBC-R R905.1.1 · R905.2.8.5 · R903.2",
};
export const ROUGH_PLUMBING: InspectionPhase = {
  phase: "Rough Plumbing", code: "402", title: "Rough Plumbing",
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
export const ROUGH_ELECTRICAL: InspectionPhase = {
  phase: "Rough Electrical", code: "202", title: "Rough Electrical",
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
export const ROUGH_HVAC: InspectionPhase = {
  phase: "Rough Mechanical / HVAC", code: "702", title: "Rough Mechanical / HVAC",
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
export const INSULATION: InspectionPhase = {
  phase: "Insulation", code: "308", title: "Insulation",
  tags: ["Required", "Critical"],
  checks: [
    "Wall insulation R-value matches energy calcs",
    "Ceiling/attic insulation R-value per energy calcs",
    "No gaps, voids, or compression",
    "Air sealing at penetrations, top plates, and rim joists",
  ],
  refs: "FBC-E R402.1 · R402.4 · R402.4.1",
};
export const LATHE_SIDING: InspectionPhase = {
  phase: "Lathe, Siding", code: "309", title: "Lathe, Siding",
  tags: ["Required", "Critical"],
  checks: [
    "Exterior wall covering per plans and properly installed",
    "Weather-resistive barrier behind cladding",
    "Flashing at windows, doors, and wall transitions",
    "Cladding fastener type and spacing per manufacturer/plans",
  ],
  refs: "FBC-R R703.1 · R703.2 · R703.4",
};
export const DRYWALL: InspectionPhase = {
  phase: "Drywall", code: "310", title: "Drywall",
  tags: ["Required", "Critical"],
  checks: [
    "Drywall thickness per plans; moisture-resistant in wet areas",
    "Screw/nail spacing meets code",
    "Fire-rated assemblies with proper layers per rating",
    "Moisture barrier behind tub/shower surrounds where required",
  ],
  refs: "FBC-R R702.3.1 · R702.3.5 · R302.6 · R702.4",
};
export const FINAL_ELECTRICAL: InspectionPhase = {
  phase: "Final Electrical", code: "608", title: "Final Electrical",
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
export const FINAL_PLUMBING: InspectionPhase = {
  phase: "Final Plumbing", code: "609", title: "Final Plumbing",
  tags: ["Required", "Plumbing", "Critical"],
  checks: [
    "Fixtures installed, connected, and operational",
    "Water heater with TPR valve, drain pan, and discharge pipe",
    "No visible leaks at any supply or drain connection",
    "Exterior hose bibbs have backflow prevention",
  ],
  refs: "FBC-P 405.1 · 607.1 · 312.1 · 608.15.4.2",
};
export const FINAL_HVAC: InspectionPhase = {
  phase: "Final Mechanical / HVAC", code: "709", title: "Final Mechanical / HVAC",
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
export const FINAL_BUILDING: InspectionPhase = {
  phase: "Final Building", code: "610", title: "Final Building",
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
export const FOOTING_SLAB_UFER: InspectionPhase = {
  phase: "Footing, Slab, UFER", code: "101", title: "Footing, Slab, UFER",
  tags: ["Required", "Structural", "Critical"],
  checks: [
    "Footing width and depth match approved plans",
    "Rebar size, spacing, and placement per plans",
    "UFER — min. 20 ft of #4 bare copper or rebar encased in footing",
    "Slab vapor barrier installed per plans",
    "Slab thickness and wire mesh per plans",
    "Foundation anchorage — anchor bolt placement for sill plate",
  ],
  refs: "FBC-R R403.1 · R506.1 · R506.2.3 · R403.1.6 · NEC 250.52(A)(3)",
};

export const FULL_DWELLING = [
  ROUGH_FRAMING, ROOF_DRY_IN, ROUGH_PLUMBING, ROUGH_ELECTRICAL, ROUGH_HVAC,
  INSULATION, LATHE_SIDING, DRYWALL, FINAL_ELECTRICAL, FINAL_PLUMBING, FINAL_HVAC, FINAL_BUILDING,
];

// ---------- Guides ----------

const SF_RE_ROOF: PortalGuide = {
  slug: "single-family-re-roof",
  category: "Single Family",
  title: "Single Family Re-Roof",
  docCount: 2, inspectionCount: 10, lastUpdated: REVIEWED,
  summary: "Residential re-roof — dry-in and roof final only.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for underlayment and roofing materials (shingles, tile, metal, etc.).", required: "always" },
    { name: "Roof Report", description: "Roof measurement report from Roofr, EagleView, or similar satellite-based reporting system showing dimensions, slopes, and area calculations.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Deck Attachment Schedule", tags: ["Life Safety"], description: "Roof deck (sheathing) fastener schedule must be shown or referenced, particularly when re-nailing is required.", code: "FBC-R R803 · FBC-B 2304.10 · FBC-EB 706" },
    { n: "02", title: "Secondary Water Barrier", tags: ["Life Safety"], description: "Verify secondary water barrier is specified when required by the jurisdiction or when applying HVHZ provisions.", code: "FBC-B 1503.9 · FBC-R R905.1.2" },
    { n: "03", title: "Florida Product Approval", tags: ["Code"], description: "Verify FL Product Approval or Miami-Dade NOA is listed for the new roof covering, matching the project's wind zone.", code: "FBC-B 1504 · 1708 · FBC-R R905" },
    { n: "04", title: "Underlayment Specification", tags: ["Code"], description: "Underlayment type and layers must be specified consistent with the roof covering and jurisdictional wind speed.", code: "FBC-R R905.1.1 · FBC-B 1507" },
    { n: "05", title: "Plan Review Applicability", tags: ["Documentation"], description: "Per FBC-B 107.3.5, plan review is not required for re-roofs. Flōridian performs this review only when the building department requires plan review or the client opts in.", code: "FBC-B 107.3.5" },
  ],
  inspections: [
    {
      phase: "Roof Dry-In", code: "306", title: "Roof Dry-In (In Progress)",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Underlayment type and installation per code and manufacturer specs",
        "Drip edge at eaves and rakes",
        "Valley and wall flashing properly installed",
        "All roof penetrations sealed and flashed",
        "Deck in acceptable condition; damaged sheathing replaced",
      ],
      refs: "FBC-R R803.1 · R903.2 · R905.1.1 · R905.2.8.5",
    },
    {
      phase: "Roof Final", code: "610", title: "Roof Final",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Roofing material installed per manufacturer specs and plans",
        "All flashing complete at walls, valleys, penetrations, and edges",
        "Roof ventilation installed per plans",
        "Nailing pattern meets high-wind requirements",
        "Job site clean; no exposed nails or debris in gutters",
      ],
      refs: "FBC-R R806.1 · R903.2 · R905.2 · FBC-B 110.3",
    },
  ],
};

const SF_REPAIR_REMODEL: PortalGuide = {
  slug: "single-family-repair-remodel",
  category: "Single Family",
  title: "Single Family Repair/Remodel",
  docCount: 4, inspectionCount: 12, lastUpdated: REVIEWED,
  summary: "Residential repair or remodel — inspections conditional on scope.",
  documents: [
    { name: "Plans or Detailed Drawings", description: "Plans or detailed drawings reflecting the full scope of remodel work.", required: "always" },
    { name: "Scope of Work Description", description: "Very detailed written scope of work describing all work to be performed.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for any regulated components. Required if installing new windows, doors, roofing, or other regulated products.", required: "conditional" },
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Plans sealed by a Florida-registered PE. Required if scope includes structural changes (removing/modifying load-bearing walls, headers, beams).", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Structural impact of scope (load-bearing walls)", tags: ["Life Safety"], description: "If scope includes removing or modifying load-bearing walls, verify new beam/header design is provided and sealed by a Florida-registered engineer.", code: "FBC-EB 502 · FBC-R R301 · R502" },
    { n: "02", title: "Existing condition compliance (egress, smoke alarms, CO alarms)", tags: ["Life Safety"], description: "For work affecting bedrooms or sleeping areas, verify existing emergency egress and smoke/CO alarms meet current code.", code: "FBC-EB 705 · FBC-R R310 · R314 · R315" },
    { n: "03", title: "Window/door replacement wind compliance", tags: ["Life Safety"], description: "If scope includes window or door replacement, verify product approvals (FL# or NOA) for wind and HVHZ requirements.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "HVAC equipment changeout", tags: ["Performance"], description: "If HVAC changeout or new system is in scope, verify equipment schedule with capacity matches scope. Advisory — plan review not required per FBC 107.3.5.", code: "FBC-M 403 · FBC-E R403" },
    { n: "05", title: "AFCI/GFCI upgrade in work area", tags: ["Life Safety"], description: "If scope includes electrical work in kitchens, bathrooms, bedrooms, or wet locations, verify AFCI/GFCI protection. Advisory — plan review not required per FBC 107.3.5.", code: "NEC 210.8 · 210.12" },
    { n: "06", title: "Fixture additions in remodel scope", tags: ["Documentation"], description: "If scope adds or relocates plumbing fixtures (kitchen, bathroom remodel), verify basic fixture layout. Advisory — plan review not required per FBC 107.3.5.", code: "FBC-P 701 · 901" },
  ],
  inspections: FULL_DWELLING,
};

const SF_RETAINING_WALL: PortalGuide = {
  slug: "single-family-retaining-wall",
  category: "Single Family",
  title: "Single Family Retaining Wall",
  docCount: 3, inspectionCount: 14, lastUpdated: REVIEWED,
  summary: "Residential retaining wall — footing and final building.",
  documents: [
    { name: "Plans or Detailed Drawings", description: "Construction drawings showing retaining wall layout, dimensions, reinforcement, and drainage details.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, elevations, and retaining wall location.", required: "always" },
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Required when wall exceeds 4 feet in height.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wall height, surcharge, and geotechnical assumptions", tags: ["Life Safety"], description: "Retaining wall design must address wall height, soil type, surcharge load (traffic/structure), and drainage.", code: "FBC-B 1807.2 · FBC-R R404" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Plan review applicability", tags: ["Documentation"], description: "Standalone retaining wall not in FBC-B 107.3.5 minimum criteria for 1 & 2 family.", code: "FBC-B 107.3.5" },
    { n: "04", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [FOOTING_SLAB_UFER, FINAL_BUILDING],
};

const SF_SOLAR: PortalGuide = {
  slug: "single-family-solar",
  category: "Single Family",
  title: "Single Family Solar",
  docCount: 2, inspectionCount: 9, lastUpdated: REVIEWED,
  summary: "Residential rooftop PV solar installation — rough and final electrical.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Solar installation plans including structural attachment details, equipment specifications, and electrical diagrams. Must include product/equipment specs.", required: "always" },
    { name: "Site Survey", description: "Site survey or plan showing solar panel layout, roof orientation, and property boundaries.", required: "always" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Structural attachment and uplift", tags: ["Life Safety"], description: "Racking system attachment to roof structure must be designed for wind uplift at the project wind zone; fastener embedment and spacing per engineering.", code: "FBC-B 1607.13 · FBC-R R301 · ASCE 7-22" },
    { n: "02", title: "Roof structural capacity verification", tags: ["Life Safety"], description: "Existing roof structure (rafters or trusses) must be evaluated for the added solar dead load plus wind uplift.", code: "FBC-B 1603 · FBC-EB Ch. 4" },
    { n: "03", title: "Fire access setbacks and pathways", tags: ["Life Safety"], description: "Roof solar installations must preserve firefighter access pathways and ridge setbacks per FBC-R / NFPA.", code: "FBC-R R324.4 · FBC-B 1205.2.2 · NFPA 1" },
    { n: "04", title: "Flashing and roof penetration detail", tags: ["Code"], description: "Flashing detail at each roof penetration (lag/standoff) must match roof covering type and manufacturer product approval.", code: "FBC-R R905" },
    { n: "05", title: "PV system disconnect", tags: ["Life Safety"], description: "Accessible disconnecting means for the PV system per NEC 690.13, typically at or near the service equipment.", code: "NEC 690.13" },
    { n: "06", title: "Rapid shutdown", tags: ["Life Safety"], description: "Rapid shutdown system per NEC 690.12 for rooftop PV installations.", code: "NEC 690.12" },
    { n: "07", title: "Grounding and bonding", tags: ["Life Safety"], description: "PV system grounding, equipment bonding, and grounding electrode conductor per NEC 690.41-.50.", code: "NEC 690.41 · 690.43 · 690.47" },
    { n: "08", title: "Conductor sizing, overcurrent, interconnection", tags: ["Code"], description: "DC and AC conductor sizing, overcurrent protection, and utility interconnection per NEC 690/705.", code: "NEC 690.8 · 690.9 · 705.12" },
  ],
  inspections: [
    {
      phase: "Rough Electrical", code: "202", title: "Solar Rough Electrical",
      tags: ["Required", "Electrical", "Critical"],
      checks: [
        "Mounting and racking installed per engineered plans with proper roof attachment",
        "Conduit routing, wire sizing, and connections per plans and NEC",
        "Equipment grounding conductor and bonding of all metallic racking",
        "Rapid shutdown system installed and labeled per NEC",
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

const SF_STRUCTURAL_ELEVATION: PortalGuide = {
  slug: "single-family-structural-elevation",
  category: "Single Family",
  title: "Single Family Structural Elevation",
  docCount: 4, inspectionCount: 61, lastUpdated: REVIEWED,
  summary: "Elevated foundation — full inspection sequence for elevated single family dwelling.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Structural engineering plans sealed by a Florida-registered PE showing the elevation design.", required: "always" },
    { name: "Survey / Site Plan", description: "Current survey or site plan showing existing and proposed elevations.", required: "always" },
    { name: "Elevation Certificate", description: "FEMA Elevation Certificate — required if property is in a flood zone.", required: "conditional" },
    { name: "NOAs / Product Approvals", description: "NOAs and/or Florida Product Approvals for applicable components — required if scope includes products requiring NOA or approval.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Footing / foundation design", tags: ["Life Safety"], description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { n: "03", title: "Elevation design and lateral anchorage", tags: ["Life Safety"], description: "Elevated foundation system must be designed for wind, seismic, and flood loading with continuous lateral-force path.", code: "ASCE 24 · FBC-B 1612 · FBC-R R322" },
    { n: "04", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: FULL_DWELLING,
};

const SF_SUNROOM: PortalGuide = {
  slug: "single-family-sunroom",
  category: "Single Family",
  title: "Single Family Sunroom",
  docCount: 4, inspectionCount: 15, lastUpdated: REVIEWED,
  summary: "Residential sunroom addition — rough framing and final building.",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Construction drawings showing sunroom layout, framing, and connection to existing structure.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for windows, glass panels, roofing, and other regulated components.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and sunroom footprint.", required: "always" },
    { name: "Energy Compliance Forms", description: "Required if sunroom includes conditioned (air-conditioned) space.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Design wind speed & exposure", tags: ["Life Safety"], description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { n: "02", title: "Attachment to existing structure", tags: ["Life Safety"], description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { n: "03", title: "Florida product approval", tags: ["Code"], description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Screen-only sunroom is not in FBC-B 107.3.5 minimum criteria for 1 & 2 family; conditioned sunrooms trigger full review.", code: "FBC-B 107.3.5" },
    { n: "05", title: "Engineer of record seal", tags: ["Documentation"], description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FL Statutes Ch. 471 · FBC-B 107.3.5" },
  ],
  inspections: [ROUGH_FRAMING, FINAL_BUILDING],
};

const SF_WINDOW_DOOR: PortalGuide = {
  slug: "single-family-window-door-replacement",
  category: "Single Family",
  title: "Single Family Window/Door Replacement",
  docCount: 3, inspectionCount: 8, lastUpdated: REVIEWED,
  summary: "Residential window and/or door replacement — buck/flashing and final building.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for replacement windows and/or doors showing impact rating, design pressure, and NOA/FL number.", required: "always" },
    { name: "Floor Plan Showing Opening Locations", description: "A floor plan or elevation with the windows/doors being replaced clearly marked. A marked-up photo or simple sketch is often sufficient.", required: "conditional" },
    { name: "Opening Modification Guidance", description: "Applied when opening sizes/locations are modified; directs to Alteration project type instead.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind-borne debris protection", tags: ["Life Safety"], description: "In the Wind-Borne Debris Region (WBDR), glazed openings must either be impact-rated or protected by an approved shutter/panel system.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { n: "02", title: "Egress window compliance (bedrooms)", tags: ["Life Safety"], description: "Any replacement window serving a sleeping room must meet emergency escape and rescue opening requirements: clear opening area, width, height, and sill height.", code: "FBC-R R310" },
    { n: "03", title: "Florida product approval for each fenestration product", tags: ["Code"], description: "Each new window and door must carry a Florida product approval (FL#) or Miami-Dade NOA suitable for the project's wind zone and application.", code: "FBC-B 1708 · FBC-R R301.2.1.2 · R609" },
    { n: "04", title: "Plan review applicability", tags: ["Documentation"], description: "Fenestration replacement exempt from FBC-B 107.3.5 minimum review; contractor certification under FBC-B 107.3.4.2 accepted for wind-resistance.", code: "FBC-B 107.3.5 · 107.3.4.2" },
    { n: "05", title: "Flashing and weather-resistive barrier integration", tags: ["Code"], description: "Installation details should show flashing at head, jambs, and sill, integrated with the existing weather-resistive barrier.", code: "FBC-R R703.4 · FBC-B 1404.4" },
  ],
  inspections: [
    {
      phase: "Buck, Flashing", code: "302", title: "Buck, Flashing (BD-Dependent)",
      tags: ["Required", "Structural", "Critical"],
      checks: [
        "Bucks and flashing installed per manufacturer specifications",
        "Anchoring method and fastener spacing per manufacturer instructions",
        "Sealant applied per manufacturer specs at all joints",
      ],
      refs: "FBC-B 1710.2 · 1710.3 · 1710.4 · FBC-R R703.4",
    },
    {
      phase: "Final Building", code: "610", title: "Window/Door — Typical Final",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Installed windows/doors have valid Florida Product Approval matching plans",
        "All windows and doors open, close, lock, and seal properly",
        "Impact-rated products verified where required by wind zone",
        "Bedroom windows still meet egress size requirements after replacement",
        "Interior trim and exterior caulking complete",
      ],
      refs: "FBC-R R609.3 · R612.1 · R301.2.1.2 · R310.1 · R703.4 · FBC-B 1710.1 · 1710.2",
    },
  ],
};

// ---------- Commercial ----------

const COM_ALTERATION: PortalGuide = {
  slug: "commercial-alteration",
  category: "Commercial",
  title: "Commercial Alteration",
  docCount: 3, inspectionCount: 61, lastUpdated: REVIEWED,
  summary: "Commercial tenant alteration — full inspection sequence conditional on scope.",
  documents: [
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Sealed plans reflecting the full scope of alteration work.", required: "always" },
    { name: "Scope of Work Description", description: "Very detailed written scope of work describing all work to be performed.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for any regulated components — required when installing new windows, doors, roofing, or other regulated products.", required: "conditional" },
    ...NTBO_OWNER,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Occupancy classification", tags: ["Life Safety"], description: "Confirm the existing occupancy group or evaluate a change of use triggering broader code analysis.", code: "FBC-B Ch. 3" },
    { n: "02", title: "Fire-resistive construction and separations", tags: ["Life Safety"], description: "Fire-resistance rated walls, floor/ceiling assemblies, opening protectives, and penetration firestops must be maintained or upgraded per scope.", code: "FBC-B Ch. 7" },
    { n: "03", title: "Life safety and fire protection systems", tags: ["Life Safety"], description: "Alteration scope must maintain sprinkler coverage, alarm coverage, smoke control, and emergency egress lighting per occupancy.", code: "FBC-B Ch. 9 · NFPA 13 · NFPA 72" },
    { n: "04", title: "Means of egress capacity and arrangement", tags: ["Life Safety"], description: "Egress capacity, width, common path, travel distance, number of exits, and exit discharge must comply with FBC-B Ch. 10.", code: "FBC-B Ch. 10" },
    { n: "05", title: "Structural alterations", tags: ["Life Safety"], description: "Any structural alteration requires engineered documentation. Existing structural system compliance per FBC-EB.", code: "FBC-EB" },
    { n: "06", title: "Accessibility scoping", tags: ["Code"], description: "Alteration triggers accessibility requirements in altered areas and along the path of travel to the altered area, up to the 20% disproportionate-cost cap.", code: "FBC-A · 2010 ADA Standards" },
    { n: "07", title: "Specialty exhaust and make-up air", tags: ["Life Safety"], description: "Kitchen hoods, chemical storage, spray booths, and similar require specialty exhaust per FBC-M Ch. 5 with matched make-up air.", code: "FBC-M Ch. 5" },
    { n: "08", title: "Ventilation per FBC-M 403", tags: ["Code"], description: "Outdoor air ventilation rates per FBC-M Table 403.3 based on occupancy classification and occupant load.", code: "FBC-M Table 403.3" },
    { n: "09", title: "Emergency and standby systems", tags: ["Life Safety"], description: "Emergency lighting, exit sign power, and standby power where required by occupancy and scope.", code: "NEC 700 · 701 · 702" },
    { n: "10", title: "Service and feeder capacity for altered load", tags: ["Code"], description: "Load calculation supporting altered service, feeders, and branch circuits per NEC Article 220.", code: "NEC Article 220" },
    { n: "11", title: "Lighting and receptacle compliance", tags: ["Code"], description: "Lighting power density, controls, and commercial GFCI/specific-location protection requirements.", code: "FBC-E C405 · NEC 210" },
    { n: "12", title: "Minimum fixture count", tags: ["Code"], description: "Minimum plumbing fixtures required per occupancy classification and occupant load per FBC-P Table 403.1.", code: "FBC-P Table 403.1" },
    { n: "13", title: "Grease waste and interceptors", tags: ["Code"], description: "Food-service alterations require grease waste segregation and sized grease interceptor per jurisdictional sewer authority.", code: "FBC-P 1003" },
  ],
  inspections: FULL_DWELLING,
};

export const GUIDES_BATCH_4: PortalGuide[] = [
  SF_RE_ROOF,
  SF_REPAIR_REMODEL,
  SF_RETAINING_WALL,
  SF_SOLAR,
  SF_STRUCTURAL_ELEVATION,
  SF_SUNROOM,
  SF_WINDOW_DOOR,
  COM_ALTERATION,
];
