// Multi Family project guides — batch 11 (final).
import type { PortalGuide, GuideDoc, GuideDownload, PlanReviewItem, InspectionPhase } from "./portal-guides-data";

const REVIEWED = "Reviewed by Cleard permitting staff — July 2026";

const STANDARD_DOWNLOADS: GuideDownload[] = [
  { title: "Notice to Building Official — Use of Private Provider", meta: "Form 61G20-2.005 · FL Statute §553.791" },
  { title: "Private Provider Owner Authorization & Indemnification", meta: "FL Statute §553.791" },
];

type PRSource = { title: string; kind: "LIFE SAFETY" | "CODE" | "DOCUMENTATION"; description: string; code: string };
type InspSource = { phase: string; title: string; kind: "CRITICAL" | "REQUIRED" | "CONDITIONAL"; check: string; refs: string };

function mkPR(items: PRSource[]): PlanReviewItem[] {
  const tagMap: Record<PRSource["kind"], string> = { "LIFE SAFETY": "Life Safety", CODE: "Code", DOCUMENTATION: "Documentation" };
  return items.map((it, i) => ({ n: String(i + 1).padStart(2, "0"), title: it.title, tags: [tagMap[it.kind]], description: it.description, code: it.code }));
}

function mkInsp(items: InspSource[]): InspectionPhase[] {
  return items.map((it, i) => {
    const tags = it.kind === "CRITICAL" ? ["Required", "Critical"] : it.kind === "REQUIRED" ? ["Required"] : ["Conditional"];
    return { phase: it.phase, code: String(i + 1).padStart(3, "0"), title: it.title, tags, checks: [it.check], refs: it.refs };
  });
}

const APP: GuideDoc = { name: "Completed Application", description: "Signed and completed municipal building permit application.", required: "always" };

// 1. Repair / Remodel
const MF_REPAIR_REMODEL: PortalGuide = {
  slug: "multi-family-repair-remodel", category: "Multi Family", title: "Multi Family — Repair / Remodel",
  docCount: 5, inspectionCount: 4, lastUpdated: REVIEWED,
  summary: "Multi-family repair/remodel scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Architectural Drawings (Scope of Work)", description: "Drawings depicting the full scope of remodel work.", required: "always" },
    { name: "Structural Drawings", description: "Sealed structural drawings — required when structural elements are altered.", required: "conditional" },
    { name: "Product Approvals", description: "Florida Product Approval or Miami-Dade NOA — required if windows or doors are replaced.", required: "conditional" },
    { name: "Asbestos Survey", description: "Pre-renovation asbestos survey — required for buildings built prior to 1980.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Scope of work review", kind: "DOCUMENTATION", description: "Verify scope is fully described and matches submitted drawings.", code: "FBC-B 107.2" },
    { title: "Code compliance for altered areas", kind: "CODE", description: "Altered work must meet current FBC-Existing Building code provisions.", code: "FBC-EB 2023" },
    { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Any structural alteration must be sealed and support existing plus new loads.", code: "FBC-B 1604 · FBC-EB 503" },
    { title: "Life safety maintained", kind: "LIFE SAFETY", description: "Egress, fire ratings, and separations must be maintained or improved.", code: "FBC-B 1006 · FBC-EB 805" },
  ]),
  inspections: mkInsp([
    { phase: "Rough", title: "Framing (if walls opened)", kind: "CONDITIONAL", check: "Verify framing members, connections, and any new headers/blocking", refs: "FBC-R R602" },
    { phase: "Rough", title: "Rough electric (if rewired)", kind: "CONDITIONAL", check: "Verify new conductors, boxes, GFCI/AFCI where required", refs: "NEC 210" },
    { phase: "Rough", title: "Rough plumbing (if re-piped)", kind: "CONDITIONAL", check: "Verify new DWV and water piping, joints, and pressure test", refs: "FPC 305 · 312" },
    { phase: "Final", title: "Final building", kind: "CRITICAL", check: "Verify completed remodel matches approved plans and life-safety features are intact", refs: "FBC-B 110.3" },
  ]),
};

// 2. Retaining Wall
const MF_RETAINING_WALL: PortalGuide = {
  slug: "multi-family-retaining-wall", category: "Multi Family", title: "Multi Family — Retaining Wall",
  docCount: 5, inspectionCount: 3, lastUpdated: REVIEWED,
  summary: "Multi-family retaining wall scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Site Plan / Survey with Wall Location", description: "Site plan or survey showing wall alignment, height, and proximity to structures.", required: "always" },
    { name: "Structural Drawings", description: "Wall height, footing, reinforcing, and drainage sealed by a Florida-registered engineer.", required: "always" },
    { name: "Geotechnical Report", description: "Soil bearing / geotech report — required for walls exceeding 4 ft in height.", required: "conditional" },
    { name: "Engineer of Record Stamp", description: "Signed and sealed engineer of record certification.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Overturning, sliding, and bearing must be checked; reinforcing per design.", code: "FBC-B 1807 · ASCE 7-22" },
    { title: "Drainage plan", kind: "CODE", description: "Weep holes / drain tile behind wall must be shown to prevent hydrostatic buildup.", code: "FBC-B 1805" },
    { title: "Setback compliance", kind: "CODE", description: "Wall must meet zoning setback and easement requirements.", code: "Local zoning" },
    { title: "Surcharge loads", kind: "LIFE SAFETY", description: "Design must account for adjacent surcharge (driveways, structures, slopes).", code: "ASCE 7-22 · FBC-B 1610" },
  ]),
  inspections: mkInsp([
    { phase: "Foundation", title: "Footer / footing", kind: "CRITICAL", check: "Verify footing dimensions, depth, and bearing per plans", refs: "FBC-B 1809" },
    { phase: "Structural", title: "Reinforcing before pour", kind: "CRITICAL", check: "Verify rebar size, spacing, splices, and cover prior to concrete placement", refs: "ACI 318 · FBC-B 1904" },
    { phase: "Final", title: "Final building", kind: "CRITICAL", check: "Verify completed wall, drainage, and backfill per plans", refs: "FBC-B 110.3" },
  ]),
};

// 3. Solar PV
const MF_SOLAR: PortalGuide = {
  slug: "multi-family-solar-pv", category: "Multi Family", title: "Multi Family — Solar (PV System)",
  docCount: 7, inspectionCount: 4, lastUpdated: REVIEWED,
  summary: "Multi-family solar PV system under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Site Plan — Panel Layout", description: "Roof plan showing panel layout, fire setbacks, and access pathways.", required: "always" },
    { name: "Electrical Single-Line Diagram", description: "One-line showing modules, inverter, disconnects, and point of interconnection.", required: "always" },
    { name: "Load Calculations", description: "Service load and 120% rule calculations for interconnection.", required: "always" },
    { name: "Equipment Specifications", description: "Cut sheets for modules, inverter, racking, and rapid shutdown equipment.", required: "always" },
    { name: "Interconnection Agreement", description: "Signed interconnection agreement with the serving utility.", required: "always" },
    { name: "Structural Drawings — Roof Attachment", description: "Sealed structural calculations verifying roof can support added dead/wind loads and attachment details.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Electrical compliance (NEC 690)", kind: "LIFE SAFETY", description: "PV system must comply with NEC Article 690 including rapid shutdown and labeling.", code: "NEC 690 · 705" },
    { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Roof structure must support panel dead load and wind uplift per FBC.", code: "FBC-B 1609 · ASCE 7-22" },
    { title: "Utility interconnection", kind: "CODE", description: "Interconnection must meet utility requirements and 120% busbar rule.", code: "NEC 705.12" },
    { title: "Fire setback paths on roof", kind: "LIFE SAFETY", description: "Roof access pathways and setbacks per FBC and IFC required for firefighter access.", code: "FBC-B 1204 · IFC 1204" },
  ]),
  inspections: mkInsp([
    { phase: "Rough", title: "Rough electric", kind: "CRITICAL", check: "Verify conduit, conductors, grounding, and rapid shutdown wiring", refs: "NEC 690" },
    { phase: "Structural", title: "Structural attachment", kind: "CRITICAL", check: "Verify racking anchors, flashing, and attachment to structural members per plans", refs: "FBC-B 1609" },
    { phase: "Final", title: "Final electric", kind: "CRITICAL", check: "Verify inverter, disconnects, labeling, and operational test", refs: "NEC 690.13 · 705.10" },
    { phase: "Utility", title: "Utility interconnection sign-off", kind: "CRITICAL", check: "Utility approval / meter swap documented prior to permanent operation", refs: "NEC 705 · Utility tariff" },
  ]),
};

// 4. Structural Elevation
const MF_STRUCTURAL_ELEVATION: PortalGuide = {
  slug: "multi-family-structural-elevation", category: "Multi Family", title: "Multi Family — Structural Elevation (Raising Building)",
  docCount: 5, inspectionCount: 3, lastUpdated: REVIEWED,
  summary: "Multi-family structural elevation (building raising) under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Survey / Elevation Certificate", description: "Current survey and FEMA Elevation Certificate showing existing and proposed elevations.", required: "always" },
    { name: "Structural Engineering Drawings", description: "Sealed drawings covering new foundation, cribbing, and connections.", required: "always" },
    { name: "Hydraulic / Mechanical Lift Specifications", description: "Specifications for jacking system — required when mechanical lift is used.", required: "conditional" },
    { name: "Utility Disconnects Plan", description: "Plan showing utility disconnect and reconnect coordination.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Structural adequacy of new foundation", kind: "LIFE SAFETY", description: "New foundation/piers designed for wind, seismic, and flood loading with continuous load path.", code: "ASCE 24 · FBC-B 1612 · FBC-R R322" },
    { title: "BFE compliance", kind: "LIFE SAFETY", description: "Finished floor must be at or above Base Flood Elevation plus applicable freeboard.", code: "ASCE 24 · FBC-B 1612" },
    { title: "Utility reconnection plan", kind: "LIFE SAFETY", description: "Plan must coordinate safe disconnect and reconnection of all utilities.", code: "Local utility standards" },
  ]),
  inspections: mkInsp([
    { phase: "Foundation", title: "New foundation / piers", kind: "CRITICAL", check: "Verify footing/pier dimensions, reinforcement, and depth per plans", refs: "FBC-B 1809" },
    { phase: "Structural", title: "Structural connection", kind: "CRITICAL", check: "Verify structure-to-foundation connection per engineered detail", refs: "FBC-R R322 · ASCE 24" },
    { phase: "Final", title: "Final building", kind: "CRITICAL", check: "Verify elevation certificate finalized, utilities reconnected, and site restored", refs: "FBC-B 110.3" },
  ]),
};

// 5. Sunroom
const MF_SUNROOM: PortalGuide = {
  slug: "multi-family-sunroom", category: "Multi Family", title: "Multi Family — Sunroom / Florida Room",
  docCount: 6, inspectionCount: 6, lastUpdated: REVIEWED,
  summary: "Multi-family sunroom / Florida room addition under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Site Plan / Survey", description: "Site plan or survey showing addition location and setbacks.", required: "always" },
    { name: "Architectural Drawings", description: "Floor plans, elevations, and details for the addition.", required: "always" },
    { name: "Structural / Truss Drawings", description: "Sealed structural and truss drawings.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approval / NOA for windows, doors, and roof panels.", required: "always" },
    { name: "Energy Compliance", description: "FBC Energy Code compliance — required if the sunroom is conditioned.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Setback compliance", kind: "CODE", description: "Addition must meet zoning setbacks and lot coverage limits.", code: "Local zoning" },
    { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Framing, connections, and roof system designed for wind and gravity loads.", code: "FBC-B 1604 · ASCE 7-22" },
    { title: "Product approval", kind: "LIFE SAFETY", description: "Windows, doors, and roof panels must have current FL Product Approval / NOA.", code: "FBC-B 1626" },
    { title: "Zoning compliance", kind: "CODE", description: "Use category (conditioned vs. unconditioned) and impervious coverage verified.", code: "Local zoning" },
    { title: "Energy code (if conditioned)", kind: "CODE", description: "Envelope insulation and mechanical extension must meet FBC Energy Code.", code: "FBC-EC R402 · R403" },
  ]),
  inspections: mkInsp([
    { phase: "Foundation", title: "Footer / slab", kind: "CRITICAL", check: "Verify footer/slab dimensions, reinforcement, and vapor barrier where applicable", refs: "FBC-R R403" },
    { phase: "Structural", title: "Framing", kind: "CRITICAL", check: "Verify wall, roof, and truss framing per approved plans", refs: "FBC-R R602 · R802" },
    { phase: "Rough", title: "Rough electric (if applicable)", kind: "CONDITIONAL", check: "Verify new circuits, boxes, and GFCI/AFCI where required", refs: "NEC 210" },
    { phase: "Insulation", title: "Insulation (if conditioned)", kind: "CONDITIONAL", check: "Verify insulation R-values and air sealing per Energy Code", refs: "FBC-EC R402" },
    { phase: "Final", title: "Final electric (if applicable)", kind: "CONDITIONAL", check: "Verify device installation and operational test", refs: "NEC 110.24" },
    { phase: "Final", title: "Final building", kind: "CRITICAL", check: "Verify completed sunroom matches plans and product approvals", refs: "FBC-B 110.3" },
  ]),
};

// 6. Window / Door Replacement
const MF_WINDOW_DOOR: PortalGuide = {
  slug: "multi-family-window-door-replacement", category: "Multi Family", title: "Multi Family — Window / Door Replacement",
  docCount: 4, inspectionCount: 2, lastUpdated: REVIEWED,
  summary: "Multi-family window / door replacement under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Product Approval Numbers", description: "Florida Product Approval or Miami-Dade NOA for each window and door product.", required: "always" },
    { name: "Site Plan / Elevation of Openings", description: "Elevation or site plan showing every opening to be replaced.", required: "always" },
    { name: "Installation Drawings / Instructions", description: "Manufacturer installation instructions including fastener schedule.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Product approval verification", kind: "LIFE SAFETY", description: "Approval numbers current and rated for pressure zone / HVHZ requirements.", code: "FBC-B 1626 · FL Product Approval / NOA" },
    { title: "Impact vs. non-impact compliance", kind: "LIFE SAFETY", description: "Impact rating or approved shutter protection required in wind-borne debris regions.", code: "FBC-B 1609.2" },
    { title: "Opening schedule", kind: "DOCUMENTATION", description: "Opening schedule ties each opening to a product approval and rough size.", code: "FBC-B 107.2" },
    { title: "Structural adequacy of rough opening", kind: "LIFE SAFETY", description: "Rough opening headers and framing must support design pressures.", code: "FBC-R R602.7" },
  ]),
  inspections: mkInsp([
    { phase: "Installation", title: "Installation inspection", kind: "CRITICAL", check: "Verify anchor type, spacing, embedment, and flashing per installation instructions", refs: "FBC-B 1626 · Manufacturer instructions" },
    { phase: "Final", title: "Final building", kind: "CRITICAL", check: "Verify sealant, operation, and product labels match approval", refs: "FBC-B 110.3" },
  ]),
};

// 7. Re-Roof
const MF_RE_ROOF: PortalGuide = {
  slug: "multi-family-re-roof", category: "Multi Family", title: "Multi Family — Re-Roof",
  docCount: 6, inspectionCount: 3, lastUpdated: REVIEWED,
  summary: "Multi-family re-roof scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Roofing Drawings / Specifications", description: "Drawings and specifications for the roofing assembly.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approval / NOA for the roofing system.", required: "always" },
    { name: "Roof Deck Inspection Report", description: "Report of existing deck condition — required when re-roofing over existing deck.", required: "conditional" },
    { name: "Energy Compliance", description: "Energy Code compliance form — required where the roof affects the thermal envelope.", required: "conditional" },
    { name: "Truss Drawings", description: "Sealed truss drawings — required if structural changes are made.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Product approval", kind: "LIFE SAFETY", description: "Roofing system must have current FL Product Approval / NOA.", code: "FBC-B 1523 · FBC-R R905" },
    { title: "Wind resistance compliance", kind: "LIFE SAFETY", description: "Fastening schedule matches product approval for design wind speed.", code: "FBC-B 1609 · ASCE 7-22" },
    { title: "Deck condition", kind: "LIFE SAFETY", description: "Existing deck condition, fastening upgrade (7d re-nail), and repairs documented.", code: "FBC-EB 706" },
    { title: "Slope and drainage", kind: "CODE", description: "Slope and drainage meet manufacturer minimums and FBC.", code: "FBC-R R905" },
    { title: "Energy code", kind: "CODE", description: "Insulation, radiant barrier, or reflective surface per FBC Energy Code where applicable.", code: "FBC-EC R402" },
  ]),
  inspections: mkInsp([
    { phase: "Deck", title: "Deck / substrate inspection", kind: "CRITICAL", check: "Verify deck condition, re-nail schedule, and repairs prior to dry-in", refs: "FBC-EB 706" },
    { phase: "Dry-In", title: "Dry-in inspection", kind: "CRITICAL", check: "Verify underlayment type, laps, and fastening per product approval", refs: "FBC-R R905.1.1" },
    { phase: "Final", title: "Final roofing", kind: "CRITICAL", check: "Verify roofing installation, flashing, ridge, and cleanup per approved plans", refs: "FBC-R R905 · FBC-B 1523" },
  ]),
};

// Shared new-construction MF blocks
const NEW_BUILD_PR = mkPR([
  { title: "Zoning / land use compliance", kind: "CODE", description: "Project must comply with zoning, use, and site development standards.", code: "Local LDR" },
  { title: "Setback and height compliance", kind: "CODE", description: "Setbacks, height, and separation distances must meet zoning.", code: "Local zoning · FBC-B 504" },
  { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Foundation, framing, and lateral systems designed per FBC and ASCE 7.", code: "FBC-B 1604 · ASCE 7-22" },
  { title: "Fire-rated construction", kind: "LIFE SAFETY", description: "Fire-resistance ratings of assemblies verified per construction type.", code: "FBC-B 601 · 705" },
  { title: "Life safety / egress", kind: "LIFE SAFETY", description: "Means of egress, travel distance, exit stairs, and separations meet code.", code: "FBC-B 1006 · 1017 · 1023" },
  { title: "ADA compliance", kind: "LIFE SAFETY", description: "Accessibility route, unit types, and common areas meet FBC-Accessibility.", code: "FBC-A 2023 · ADA 2010" },
  { title: "MEP systems compliance", kind: "CODE", description: "Mechanical, electrical, and plumbing systems designed to their respective FBC volumes.", code: "FMC / NEC / FPC 2023" },
  { title: "Energy code", kind: "CODE", description: "Envelope, MEP, and lighting comply with FBC Energy Code / COMcheck.", code: "FBC-EC C401 / R401" },
  { title: "Civil / drainage compliance", kind: "CODE", description: "Grading, drainage, and stormwater management approved by civil authority.", code: "SFWMD / Local Civil" },
]);

const NEW_BUILD_INSP = mkInsp([
  { phase: "Foundation", title: "Foundation / footings", kind: "CRITICAL", check: "Verify footing dimensions, reinforcement, and bearing per plans", refs: "FBC-B 1809" },
  { phase: "Site", title: "Underground utilities", kind: "CRITICAL", check: "Verify underground plumbing, electrical, and communications prior to backfill", refs: "FPC 312 · NEC 300.5" },
  { phase: "Structural", title: "Slab / deck", kind: "CRITICAL", check: "Verify slab reinforcement, vapor barrier, and post-tension where applicable", refs: "ACI 318 · FBC-B 1907" },
  { phase: "Structural", title: "Structural framing", kind: "CRITICAL", check: "Verify wall, floor, and roof framing including connections and shear elements", refs: "FBC-B 2304 · FBC-R R602" },
  { phase: "Rough", title: "Rough MEP", kind: "CRITICAL", check: "Verify rough mechanical, electrical, and plumbing prior to concealment", refs: "FMC / NEC / FPC" },
  { phase: "Insulation", title: "Insulation", kind: "REQUIRED", check: "Verify insulation R-values and air sealing prior to drywall", refs: "FBC-EC R402" },
  { phase: "Envelope", title: "Drywall / firewall", kind: "CRITICAL", check: "Verify drywall type, fastening, and fire-rated assemblies per approved plans", refs: "FBC-B 705 · 708" },
  { phase: "Fire", title: "Fire sprinkler rough", kind: "CRITICAL", check: "Verify sprinkler piping, hangers, and hydrostatic test", refs: "NFPA 13" },
  { phase: "Vertical Transport", title: "Elevator (if applicable)", kind: "CONDITIONAL", check: "Verify elevator installation and state elevator inspection", refs: "ASME A17.1 · FS 399" },
  { phase: "Final", title: "Final MEP", kind: "CRITICAL", check: "Verify mechanical, electrical, and plumbing final tests and labeling", refs: "FMC / NEC / FPC" },
  { phase: "Final", title: "Final building", kind: "CRITICAL", check: "Verify completed building matches approved plans and all trades signed off", refs: "FBC-B 110.3" },
  { phase: "Final", title: "Certificate of Occupancy inspection", kind: "CRITICAL", check: "Verify all approvals, life-safety systems, and readiness for occupancy", refs: "FBC-B 111" },
]);

// 8. New Apartment Building
const MF_NEW_APARTMENT: PortalGuide = {
  slug: "multi-family-new-apartment-building", category: "Multi Family", title: "Multi Family — New Apartment Building",
  docCount: 12, inspectionCount: 12, lastUpdated: REVIEWED,
  summary: "New multi-family apartment building under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Boundary / Topographic Survey", description: "Current boundary and topographic survey.", required: "always" },
    { name: "Full Architectural Drawings", description: "All floors, elevations, sections, and details.", required: "always" },
    { name: "Structural Drawings", description: "Sealed structural drawings including foundation and framing.", required: "always" },
    { name: "MEP Drawings", description: "Mechanical, electrical, and plumbing drawings.", required: "always" },
    { name: "Civil / Site Drawings", description: "Site, grading, drainage, and utility drawings.", required: "always" },
    { name: "Landscape Plan", description: "Landscape plan meeting local landscape code.", required: "always" },
    { name: "Energy Compliance (COMcheck)", description: "COMcheck (or equivalent) energy compliance documentation.", required: "always" },
    { name: "Fire Protection / Sprinkler Drawings", description: "NFPA 13 fire sprinkler and alarm drawings.", required: "always" },
    { name: "Accessibility (ADA) Compliance", description: "Accessibility documentation and unit distribution matrix.", required: "always" },
    { name: "Environmental Permits", description: "Environmental resource / wetland permits — required if applicable.", required: "conditional" },
    { name: "Geotechnical Report", description: "Soils / geotechnical report supporting foundation design.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: NEW_BUILD_PR,
  inspections: NEW_BUILD_INSP,
};

// 9. New Condo Building
const MF_NEW_CONDO: PortalGuide = {
  slug: "multi-family-new-condo-building", category: "Multi Family", title: "Multi Family — New Condo Building",
  docCount: 14, inspectionCount: 12, lastUpdated: REVIEWED,
  summary: "New multi-family condominium building under the private provider program (FL Statute §553.791).",
  documents: [
    APP,
    { name: "Boundary / Topographic Survey", description: "Current boundary and topographic survey.", required: "always" },
    { name: "Full Architectural Drawings", description: "All floors, elevations, sections, and details.", required: "always" },
    { name: "Structural Drawings", description: "Sealed structural drawings including foundation and framing.", required: "always" },
    { name: "MEP Drawings", description: "Mechanical, electrical, and plumbing drawings.", required: "always" },
    { name: "Civil / Site Drawings", description: "Site, grading, drainage, and utility drawings.", required: "always" },
    { name: "Landscape Plan", description: "Landscape plan meeting local landscape code.", required: "always" },
    { name: "Energy Compliance", description: "COMcheck or equivalent energy compliance documentation.", required: "always" },
    { name: "Fire Protection / Sprinkler Drawings", description: "NFPA 13 fire sprinkler and alarm drawings.", required: "always" },
    { name: "ADA Compliance Documentation", description: "Accessibility documentation including unit distribution matrix.", required: "always" },
    { name: "Declaration of Condominium", description: "Declaration of Condominium filed with the county.", required: "always" },
    { name: "Condo Association Documents", description: "Association articles, bylaws, and rules.", required: "always" },
    { name: "Environmental Permits", description: "Environmental resource / wetland permits — required if applicable.", required: "conditional" },
    { name: "Geotechnical Report", description: "Soils / geotechnical report supporting foundation design.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    ...NEW_BUILD_PR,
    {
      n: String(NEW_BUILD_PR.length + 1).padStart(2, "0"),
      title: "Condo conversion documentation (if applicable)",
      tags: ["Documentation"],
      description: "Where scope involves a conversion, engineering reports and disclosure documentation must be submitted per FS 718.",
      code: "FS 718 · FBC-EB",
    },
  ],
  inspections: NEW_BUILD_INSP,
};

export const GUIDES_BATCH_11: PortalGuide[] = [
  MF_REPAIR_REMODEL,
  MF_RETAINING_WALL,
  MF_SOLAR,
  MF_STRUCTURAL_ELEVATION,
  MF_SUNROOM,
  MF_WINDOW_DOOR,
  MF_RE_ROOF,
  MF_NEW_APARTMENT,
  MF_NEW_CONDO,
];
