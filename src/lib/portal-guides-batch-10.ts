// Multi Family project guides — batch 10.
import type { PortalGuide, GuideDoc, GuideDownload, PlanReviewItem, InspectionPhase } from "./portal-guides-data";

const REVIEWED = "Reviewed by Cleard permitting staff — July 2026";

const STANDARD_DOWNLOADS: GuideDownload[] = [
  { title: "Notice to Building Official — Use of Private Provider", meta: "Form 61G20-2.005 · FL Statute §553.791" },
  { title: "Private Provider Owner Authorization & Indemnification", meta: "FL Statute §553.791" },
];

type PRSource = { title: string; kind: "LIFE SAFETY" | "CODE" | "DOCUMENTATION"; description: string; code: string };
type InspSource = { phase: string; title: string; kind: "CRITICAL" | "REQUIRED" | "CONDITIONAL"; check: string; refs: string };

function mkPR(items: PRSource[]): PlanReviewItem[] {
  const tagMap: Record<PRSource["kind"], string> = {
    "LIFE SAFETY": "Life Safety",
    CODE: "Code",
    DOCUMENTATION: "Documentation",
  };
  return items.map((it, i) => ({
    n: String(i + 1).padStart(2, "0"),
    title: it.title,
    tags: [tagMap[it.kind]],
    description: it.description,
    code: it.code,
  }));
}

function mkInsp(items: InspSource[]): InspectionPhase[] {
  return items.map((it, i) => {
    const tags =
      it.kind === "CRITICAL" ? ["Required", "Critical"] :
      it.kind === "REQUIRED" ? ["Required"] :
      ["Conditional"];
    return {
      phase: it.phase,
      code: String(i + 1).padStart(3, "0"),
      title: it.title,
      tags,
      checks: [it.check],
      refs: it.refs,
    };
  });
}

const APP_DOC: GuideDoc = { name: "Completed Application", description: "Signed and completed municipal building permit application.", required: "always" };

// ---------- 1. Framed Deck / Dock ----------
const MF_FRAMED_DECK_DOCK: PortalGuide = {
  slug: "multi-family-framed-deck-dock",
  category: "Multi Family",
  title: "Multi Family — Framed Deck / Dock",
  docCount: 6,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Multi-family framed deck or dock scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Site Plan / Survey", description: "Site plan or survey showing structure location, setbacks, and shoreline (if applicable).", required: "always" },
    { name: "Structural Drawings", description: "Framing plans, connection details, and pile/footer schedule sealed by a Florida-registered design professional.", required: "always" },
    { name: "Soil / Geotechnical Report", description: "Geotechnical or soil bearing report — required if constructed over water or on questionable soils.", required: "conditional" },
    { name: "DEP / Army Corps Permit", description: "State DEP and/or U.S. Army Corps of Engineers authorization — required if over navigable or state waters.", required: "conditional" },
    { name: "HOA Approval", description: "Homeowners association / condo association approval letter — required if the property is governed by an association.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Framing, connections, and pile/footer system must be designed for gravity, wind, and (if over water) wave/mooring loads.", code: "FBC-B 1604 · ASCE 7-22" },
    { title: "Setback compliance", kind: "CODE", description: "Structure must meet all zoning setbacks and shoreline setback/riparian requirements.", code: "Local zoning · FBC-B 105" },
    { title: "Environmental permit compliance", kind: "DOCUMENTATION", description: "DEP / USACE authorization must be on file for docks in state or navigable waters.", code: "FL Ch. 62-330 F.A.C. · 33 CFR 320-332" },
    { title: "Load ratings", kind: "LIFE SAFETY", description: "Design live load (residential 40 psf; assembly 100 psf) must be shown on plans.", code: "FBC-B Table 1607.1" },
  ]),
  inspections: mkInsp([
    { phase: "Structural", title: "Footer / pilings", kind: "CRITICAL", check: "Verify pile embedment, footer size, reinforcement, and connection to framing per plans", refs: "FBC-B 1809 · FBC-B 1810" },
    { phase: "Structural", title: "Framing", kind: "CRITICAL", check: "Verify beam and joist sizes, spans, and hardware/connections per plans", refs: "FBC-R R502 · FBC-B 2304" },
    { phase: "Final Building", title: "Final building", kind: "CRITICAL", check: "Verify completed structure, decking attachment, guardrail height (42\") and infill spacing (<4\")", refs: "FBC-B 1015 · FBC-R R312" },
  ]),
};

// ---------- 2. Generator (Standby) ----------
const MF_GENERATOR: PortalGuide = {
  slug: "multi-family-generator-standby",
  category: "Multi Family",
  title: "Multi Family — Generator (Standby)",
  docCount: 7,
  inspectionCount: 5,
  lastUpdated: REVIEWED,
  summary: "Multi-family standby generator scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Site Plan — Generator Location", description: "Site plan showing generator placement, clearances, and setbacks from openings, property lines, and fuel sources.", required: "always" },
    { name: "Electrical Drawings & Load Calculation", description: "One-line diagram, panel schedule, and load calculation demonstrating generator sizing.", required: "always" },
    { name: "Fuel Line Drawings", description: "Gas piping isometric, sizing, and material specification — required for natural gas or LP-fueled units.", required: "conditional" },
    { name: "Manufacturer Specifications", description: "Generator manufacturer cut sheet including NOA / Florida Product Approval if required by wind zone.", required: "always" },
    { name: "Transfer Switch Specifications", description: "ATS/manual transfer switch cut sheet and listing.", required: "always" },
    { name: "Sound Ordinance Compliance", description: "Sound level data at property line — required where a local noise ordinance applies.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Setback compliance", kind: "CODE", description: "Generator must meet manufacturer clearances and local zoning setbacks from property lines, openings, and combustibles.", code: "NFPA 37 · Local zoning" },
    { title: "Electrical compliance", kind: "LIFE SAFETY", description: "Conductors, overcurrent protection, transfer switch, and grounding must meet NEC requirements.", code: "NFPA 70 Art. 445 · 700 · 702" },
    { title: "Fuel system compliance", kind: "LIFE SAFETY", description: "Gas piping material, sizing, and shutoff valve placement must meet the Florida Fuel Gas Code.", code: "FFGC 2020 · NFPA 54 · NFPA 58" },
    { title: "Sound level review", kind: "CODE", description: "Verify manufacturer sound rating and calculated level at property line against local ordinance thresholds.", code: "Local noise ordinance" },
  ]),
  inspections: mkInsp([
    { phase: "Rough", title: "Rough electric", kind: "CRITICAL", check: "Verify conductor size, conduit, grounding, and transfer switch wiring prior to concealment", refs: "NEC 445 · 700" },
    { phase: "Rough", title: "Gas rough (if applicable)", kind: "CONDITIONAL", check: "Verify gas line material, joints, and pressure test prior to concealment (if natural gas or LP)", refs: "FFGC 406" },
    { phase: "Installation", title: "Generator installation", kind: "CRITICAL", check: "Verify generator anchorage per wind loading, clearances, and product approval installation instructions", refs: "FBC-B 1609 · NFPA 37" },
    { phase: "Final", title: "Final electric", kind: "CRITICAL", check: "Verify transfer switch operation, GFCI/AFCI where required, and labeling per NEC", refs: "NEC 110.24 · 702.7" },
    { phase: "Final", title: "Final building", kind: "REQUIRED", check: "Verify pad, enclosure, exhaust routing, and site restoration complete", refs: "FBC-B 110.3" },
  ]),
};

// ---------- 3. Hot Water Heater ----------
const MF_HOT_WATER_HEATER: PortalGuide = {
  slug: "multi-family-hot-water-heater",
  category: "Multi Family",
  title: "Multi Family — Hot Water Heater",
  docCount: 3,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Multi-family water heater replacement or installation under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Equipment Specifications", description: "Manufacturer cut sheet showing capacity, fuel type, energy factor, and listing.", required: "always" },
    { name: "Energy Compliance Documentation", description: "Florida Energy Code compliance form — required where mandated for the fuel type / capacity.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Fuel type compliance", kind: "LIFE SAFETY", description: "Fuel supply (gas, electric) must match approved equipment and meet the Florida Fuel Gas or Electrical code.", code: "FFGC 624 · NEC 422" },
    { title: "Venting", kind: "LIFE SAFETY", description: "Category I/III/IV venting must be per manufacturer instructions; combustion air provided per code.", code: "FFGC 503 · FMC 803" },
    { title: "TPR valve and discharge", kind: "LIFE SAFETY", description: "Temperature/pressure relief valve and discharge piping must terminate per code (max 6\" above floor / drain).", code: "FPC 504.6" },
    { title: "Seismic / support straps", kind: "CODE", description: "Straps or supports must be provided where required by manufacturer or jurisdiction.", code: "FPC 504.1 · Manufacturer instructions" },
  ]),
  inspections: mkInsp([
    { phase: "Final", title: "Final plumbing / mechanical", kind: "CRITICAL", check: "Verify installation, TPR discharge, venting, gas or electrical connection, and expansion tank where required", refs: "FPC 504 · FFGC 624 · NEC 422" },
  ]),
};

// ---------- 4. HVAC (New or Replacement) ----------
const MF_HVAC: PortalGuide = {
  slug: "multi-family-hvac",
  category: "Multi Family",
  title: "Multi Family — HVAC (New or Replacement)",
  docCount: 5,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Multi-family HVAC installation or replacement under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Equipment Specifications", description: "Manufacturer cut sheets for air handler, condenser, and any ancillary equipment including AHRI matched-system certificate.", required: "always" },
    { name: "Manual J Load Calculation", description: "ACCA Manual J residential load calculation showing sensible and latent loads by room.", required: "always" },
    { name: "Duct Layout Drawings", description: "Supply/return duct layout showing sizes, materials, and register locations.", required: "always" },
    { name: "Energy Compliance (Manual S / D)", description: "ACCA Manual S equipment selection and Manual D duct design — required for new systems.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Load calculation review", kind: "CODE", description: "Manual J must reflect actual building envelope, orientation, and occupancy.", code: "ACCA Manual J · FBC-EC R403.7" },
    { title: "Equipment sizing", kind: "CODE", description: "Selected equipment capacity must match Manual S output within code tolerance.", code: "ACCA Manual S · FBC-EC R403.7" },
    { title: "Duct design", kind: "CODE", description: "Duct sizing, static pressure, and R-value must meet Manual D and the Florida Energy Code.", code: "ACCA Manual D · FBC-EC R403.3" },
    { title: "Energy code compliance", kind: "DOCUMENTATION", description: "Energy code compliance form must be signed and submitted with equipment efficiency ratings.", code: "FBC-EC R405" },
  ]),
  inspections: mkInsp([
    { phase: "Rough", title: "Rough mechanical / ductwork", kind: "CRITICAL", check: "Verify duct sizing, sealing (mastic/tape rated), supports, and R-value labels prior to cover", refs: "FMC 603 · FBC-EC R403.3" },
    { phase: "Final", title: "Final mechanical", kind: "CRITICAL", check: "Verify equipment operation, refrigerant charge documentation, condensate routing, and register/grille installation", refs: "FMC 306 · FMC 307" },
  ]),
};

// ---------- 5. Hurricane Screens / Accordion Shutters ----------
const MF_HURRICANE_SCREENS: PortalGuide = {
  slug: "multi-family-hurricane-screens-shutters",
  category: "Multi Family",
  title: "Multi Family — Hurricane Screens / Accordion Shutters",
  docCount: 4,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Multi-family hurricane screen and accordion shutter installation under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Product Approval Numbers", description: "Florida Product Approval and/or Miami-Dade NOA numbers for each product installed.", required: "always" },
    { name: "Site Plan — Openings Protected", description: "Elevation or site plan showing every opening to be protected and product used at each.", required: "always" },
    { name: "Installation Drawings", description: "Manufacturer installation details showing substrate, fastener type, spacing, and edge distance.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Product approval verification", kind: "LIFE SAFETY", description: "Approval numbers must be current and match the pressure zone / HVHZ requirement of the site.", code: "FBC-B 1626 · FL Product Approval / Miami-Dade NOA" },
    { title: "Opening coverage", kind: "LIFE SAFETY", description: "All glazed openings requiring impact protection must be covered per code.", code: "FBC-B 1609.2 · FBC-R R301.2.1.2" },
    { title: "Method of attachment", kind: "LIFE SAFETY", description: "Fastener type, embedment, and substrate must match the product's tested installation instructions.", code: "Manufacturer installation instructions" },
  ]),
  inspections: mkInsp([
    { phase: "Final Building", title: "Final building — installation verification", kind: "CRITICAL", check: "Verify installed shutter/screen matches product approval and installation drawings; deployment test on operable systems", refs: "FBC-B 110.3 · FBC-B 1626" },
  ]),
};

// ---------- 6. Plumbing Only ----------
const MF_PLUMBING_ONLY: PortalGuide = {
  slug: "multi-family-plumbing-only",
  category: "Multi Family",
  title: "Multi Family — Plumbing Only",
  docCount: 4,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Multi-family plumbing-only scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Plumbing Drawings", description: "Isometric, fixture schedule, and DWV/water piping layout sealed where required.", required: "always" },
    { name: "Site Plan — New Service", description: "Site plan showing new water/sewer service tap and route — required if service is being added or upsized.", required: "conditional" },
    { name: "Backflow Prevention Specifications", description: "Backflow assembly cut sheet and testing plan — required where the utility mandates a backflow preventer.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "IPC / FPC compliance", kind: "CODE", description: "Materials, joints, and methods must comply with the Florida Plumbing Code.", code: "FPC 2023" },
    { title: "Fixture unit counts", kind: "CODE", description: "Drainage and water fixture unit totals must be shown and used for pipe sizing.", code: "FPC Table 709.1 · FPC 604" },
    { title: "Drain / waste / vent sizing", kind: "CODE", description: "DWV pipe sizes must match fixture unit loads and stack heights.", code: "FPC 710 · 916" },
    { title: "Water service sizing", kind: "CODE", description: "Water service and distribution piping must be sized per fixture unit demand and available pressure.", code: "FPC 604 · Appendix E" },
  ]),
  inspections: mkInsp([
    { phase: "Underground", title: "Underground plumbing (if applicable)", kind: "CONDITIONAL", check: "Verify buried DWV and water piping, materials, joints, and pressure test prior to cover", refs: "FPC 312 · FPC 605" },
    { phase: "Rough", title: "Rough plumbing", kind: "CRITICAL", check: "Verify in-wall DWV, water, and vent piping, joints, and hangers prior to concealment", refs: "FPC 312 · FPC 305" },
    { phase: "Final", title: "Final plumbing", kind: "CRITICAL", check: "Verify fixture installation, trap seals, cleanouts, backflow prevention, and functional test", refs: "FPC 312.10 · FPC 608" },
  ]),
};

// ---------- 7. Pool ----------
const MF_POOL: PortalGuide = {
  slug: "multi-family-pool",
  category: "Multi Family",
  title: "Multi Family — Pool",
  docCount: 7,
  inspectionCount: 9,
  lastUpdated: REVIEWED,
  summary: "Multi-family swimming pool construction under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Site Plan / Survey with Setbacks", description: "Site plan or survey showing pool, deck, equipment location, and required setbacks.", required: "always" },
    { name: "Structural Drawings", description: "Pool shell, bond beam, and equipment pad drawings sealed by a Florida-registered design professional.", required: "always" },
    { name: "Electrical Drawings", description: "Electrical one-line, bonding grid, GFCI, and equipment feeder details.", required: "always" },
    { name: "Equipment Specifications", description: "Pump, filter, heater, and controller cut sheets including efficiency data.", required: "always" },
    { name: "Safety Barrier / Alarm Plan", description: "Plan showing pool barrier, self-closing/self-latching gates, and alarms per Residential Pool Safety Act.", required: "always" },
    { name: "Pool / Spa Barrier Compliance Affidavit", description: "Signed pool barrier compliance affidavit — required prior to final.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Setback compliance", kind: "CODE", description: "Pool shell, deck, and equipment must meet zoning setbacks and separation from septic/well.", code: "Local zoning · FBC-B 454" },
    { title: "Structural adequacy", kind: "LIFE SAFETY", description: "Shell, bond beam, and reinforcement designed for hydrostatic and soil loads.", code: "ISPSC 2021 · FBC-B 454.1.7" },
    { title: "Electrical compliance", kind: "LIFE SAFETY", description: "Equipotential bonding, GFCI, and feeder sizing per NEC Article 680.", code: "NEC 680" },
    { title: "Barrier / alarm compliance", kind: "LIFE SAFETY", description: "Barrier height (48\"), gate hardware, and required alarms verified prior to shell fill.", code: "FS 515 · FBC-R R4501.17" },
    { title: "Energy compliance", kind: "CODE", description: "Pump must be listed variable-speed / high-efficiency per FBC Energy Code.", code: "FBC-EC C404 · FBC-EC R403.10" },
  ]),
  inspections: mkInsp([
    { phase: "Shell", title: "601 Pool Steel", kind: "CRITICAL", check: "Verify steel size, spacing, ties, cover, and bond beam reinforcement prior to shotcrete", refs: "FBC-B 454.1.7 · ISPSC 305" },
    { phase: "Electrical", title: "602 Electric Bond", kind: "CRITICAL", check: "Verify equipotential bonding grid, deck bonding, and connections to metallic components", refs: "NEC 680.26" },
    { phase: "Deck", title: "603 Deck", kind: "REQUIRED", check: "Verify deck reinforcement, thickness, drainage, and slope away from pool", refs: "FBC-B 454.1.7" },
    { phase: "Piping", title: "604 Piping Pressure Test", kind: "CRITICAL", check: "Verify piping material, joints, and pressure test held per code", refs: "ISPSC 310 · FPC 312" },
    { phase: "Electrical", title: "606 Wet Niche", kind: "REQUIRED", check: "Verify wet-niche light housing, conduit, and bonding prior to shell fill", refs: "NEC 680.23" },
    { phase: "Safety", title: "607 Alarms / Barriers", kind: "CRITICAL", check: "Verify barrier height, gate self-closing/self-latching hardware, and required alarms", refs: "FS 515 · FBC-R R4501.17" },
    { phase: "Final", title: "608 Final Electric", kind: "CRITICAL", check: "Verify GFCI, equipment grounding, disconnect, and load center labeling", refs: "NEC 680" },
    { phase: "Final", title: "609 Final Piping", kind: "REQUIRED", check: "Verify equipment plumbing, valves, and anti-entrapment (VGBA) covers installed", refs: "ISPSC 310 · VGBA" },
    { phase: "Final", title: "610 Final Building", kind: "CRITICAL", check: "Verify barrier compliance affidavit, deck condition, and completion per approved plans", refs: "FBC-B 110.3 · FS 515" },
  ]),
};

// ---------- 8. Re-Pipe ----------
const MF_RE_PIPE: PortalGuide = {
  slug: "multi-family-re-pipe",
  category: "Multi Family",
  title: "Multi Family — Re-Pipe",
  docCount: 3,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Multi-family re-pipe scope under the private provider program (FL Statute §553.791).",
  documents: [
    APP_DOC,
    { name: "Plumbing Drawings — Existing and New Routing", description: "Drawings showing existing pipe routing and proposed new routing, including materials and joint types.", required: "always" },
    { name: "Pipe Material Specifications", description: "Manufacturer specifications and listings for new piping (e.g., CPVC, PEX, copper).", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Material compliance", kind: "CODE", description: "New piping material must be listed and approved for potable water use in Florida.", code: "FPC 605 · NSF 61" },
    { title: "Pressure testing plan", kind: "CODE", description: "Plans must state test medium, pressure, and duration for pressure test of new piping.", code: "FPC 312.5" },
    { title: "Accessibility for inspection", kind: "DOCUMENTATION", description: "Access openings and inspection points must be identified for concealed portions of the re-pipe.", code: "FPC 305" },
  ]),
  inspections: mkInsp([
    { phase: "Rough", title: "Rough plumbing (open wall)", kind: "CRITICAL", check: "Verify new piping, hangers, and fittings while walls are open", refs: "FPC 305 · FPC 605" },
    { phase: "Test", title: "Pressure test", kind: "CRITICAL", check: "Witness pressure test at specified pressure held for required duration", refs: "FPC 312.5" },
    { phase: "Final", title: "Final plumbing", kind: "CRITICAL", check: "Verify fixture reconnection, functional test, wall patching, and cleanup", refs: "FPC 312.10" },
  ]),
};

export const GUIDES_BATCH_10: PortalGuide[] = [
  MF_FRAMED_DECK_DOCK,
  MF_GENERATOR,
  MF_HOT_WATER_HEATER,
  MF_HVAC,
  MF_HURRICANE_SCREENS,
  MF_PLUMBING_ONLY,
  MF_POOL,
  MF_RE_PIPE,
];
