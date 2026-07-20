// Data for /portal/guides — Florida permitting reference across all Flōridian scopes.

export type GuideDoc = {
  name: string;
  description: string;
  required: "always" | "conditional";
};

export type GuideDownload = {
  title: string;
  meta: string;
  href?: string;
};

export type PlanReviewItem = {
  n: string;
  title: string;
  tags: string[];
  description: string;
  code: string;
};

export type InspectionPhase = {
  phase: string;
  code: string;
  title: string;
  tags: string[];
  checks: string[];
  refs: string;
};

export type PortalGuide = {
  slug: string;
  category: string;
  title: string;
  docCount: number;
  inspectionCount: number;
  lastUpdated: string;
  summary: string;
  documents: GuideDoc[];
  downloads: GuideDownload[];
  planReview: PlanReviewItem[];
  inspections: InspectionPhase[];
};

const REVIEWED = "Reviewed by Flōridian permitting staff — July 2026";

// Common downloadable forms — every private-provider guide gets these.
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

// Reusable document snippets
const D = {
  stampedPlans: (scope: string): GuideDoc => ({
    name: "Stamped Construction Plans",
    description: `${scope} plans sealed by a Florida-licensed design professional.`,
    required: "always",
  }),
  survey: (): GuideDoc => ({
    name: "Site / Spot Survey",
    description: "Current survey showing property lines, setbacks, and improvement locations.",
    required: "always",
  }),
  equipment: (scope: string): GuideDoc => ({
    name: "Equipment Specifications",
    description: `Manufacturer specs for ${scope}.`,
    required: "always",
  }),
  engineering: (scope: string): GuideDoc => ({
    name: "Engineering Calculations",
    description: `Signed & sealed calcs for ${scope}.`,
    required: "always",
  }),
  productApproval: (): GuideDoc => ({
    name: "Product Approvals / NOA",
    description: "Florida Product Approvals or Notice of Acceptance for non-standard materials.",
    required: "conditional",
  }),
  ntbo: (): GuideDoc => ({
    name: "Notice to Building Official (NTBO)",
    description: "Required when using a private provider (Flōridian). Download below.",
    required: "conditional",
  }),
  ownerAuth: (): GuideDoc => ({
    name: "Owner Authorization Form",
    description: "Private Provider Owner Authorization & Indemnification. Download below.",
    required: "conditional",
  }),
};

const CONDITIONAL_TAIL: GuideDoc[] = [D.productApproval(), D.ntbo(), D.ownerAuth()];

// ---------- CATEGORY 1: POOL & SPA ----------

export const POOL_CONSTRUCTION: PortalGuide = {
  slug: "pool-construction",
  category: "Pool & Spa",
  title: "Single Family Pool Construction",
  docCount: 6,
  inspectionCount: 9,
  lastUpdated: REVIEWED,
  summary: "In-ground pool permit under the private provider program (FL Statute §553.791).",
  documents: [
    D.stampedPlans("Pool construction"),
    { name: "TDH Calculations", description: "Turnover, Design, and Hydraulic calculations for the pool system.", required: "always" },
    D.equipment("pump, filter, heater, and all pool equipment"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Pool barrier compliance", tags: ["Life Safety"], description: 'Verify code-compliant pool barrier: height ≥48", clearances, self-closing/self-latching gates, and door alarms on dwelling openings facing pool.', code: "ISPSC 305 · FBC-R R4501.17 · FS 515.27" },
    { n: "02", title: "Pool shell structural design", tags: ["Life Safety"], description: "Verify pool shell engineering shows soil bearing, reinforcement schedule, and shell thickness.", code: "ISPSC 307 · FBC-R R403 · ACI 318" },
    { n: "03", title: "Deck and coping design", tags: ["Code"], description: "Verify deck slopes away from pool, slip-resistant finish, and coping connection detailed.", code: "ISPSC 306 · FBC-R R326" },
    { n: "04", title: "Setbacks from property lines and structures", tags: ["Code"], description: "Verify pool meets setback requirements from property lines, septic fields, and easements.", code: "ISPSC 305.3 · Local zoning" },
    { n: "05", title: "Engineer seal on structural", tags: ["Documentation"], description: "Confirm pool structural drawings bear a current Florida-licensed engineer seal.", code: "FS Ch. 471" },
  ],
  inspections: [
    { phase: "Phase 1", code: "601", title: "Pool Steel", tags: ["Required", "Structural"], checks: ["Verify rebar size, spacing, and coverage per approved plans", 'Verify chair height maintains minimum 3" concrete cover', "Verify tie-wire connections at all intersections", "Verify bond beam reinforcement is continuous"], refs: "FBC-R R4501 · ACI 318" },
    { phase: "Phase 2", code: "602", title: "Pool Electric Bond", tags: ["Required", "Electrical", "Life Safety"], checks: ["Verify #8 AWG solid copper bonding wire connects all metallic components", "Verify bond wire ties to rebar grid, pump, filter, heater, light niches, and handrails", "Verify equipment pad bonding lug installed"], refs: "NEC 680.26 · FBC-E" },
    { phase: "Phase 3", code: "603", title: "Pool Deck", tags: ["Required", "Structural"], checks: ["Verify deck form and reinforcement match approved plans", 'Verify deck slopes minimum 1/8" per foot away from pool edge', "Verify expansion joint placement between deck and coping", "Verify setback from pool shell is maintained"], refs: "ISPSC 306.2 · FBC-R R326" },
    { phase: "Phase 4", code: "604", title: "Pool Piping Pressure Test", tags: ["Required", "Plumbing"], checks: ["Verify all pool plumbing lines (suction, return, cleaner, feature) are pressure tested before burial", "Lines must hold minimum 30 PSI for 30 minutes without loss", "Verify pipe size, material, and fittings match approved plans"], refs: "ISPSC 308 · FBC-P" },
    { phase: "Phase 5", code: "606", title: "Wet Niche", tags: ["Required", "Electrical"], checks: ["Verify underwater light niche is properly embedded in shell", "Verify conduit routing from niche to junction box is watertight", "Verify niche bonding wire is connected", "Verify niche manufacturer approval on file"], refs: "NEC 680.23 · FBC-E" },
    { phase: "Phase 6", code: "607", title: "Pool Alarms / Barriers", tags: ["Required", "Life Safety", "Critical"], checks: ['Verify pool barrier height ≥48" above grade on outside face', 'Verify gate latch release at 54" from grade on pool side', "Verify gates are self-closing and self-latching", "Verify no barrier opening allows passage of a 4-inch sphere", "Verify pool alarm or dwelling-wall compliance method per approved plans"], refs: "ISPSC 305 · FBC-R R4501.17 · FS 515.27" },
    { phase: "Phase 7", code: "608", title: "Pool Final Electric", tags: ["Required", "Electrical"], checks: ["Verify GFCI protection on all pool circuits", "Verify time clock installation and labeling", "Verify all lighting circuits connected and operational", "Verify panel connections and breaker labeling", "Verify bonding continuity"], refs: "NEC 680 · FBC-E" },
    { phase: "Phase 8", code: "609", title: "Pool Final Piping", tags: ["Required", "Plumbing"], checks: ["Verify pump, filter, heater, valves, and unions are connected and leak-free under operating pressure", "Verify backwash line termination", "Verify chemical feeder connections", "Verify all equipment labels are visible"], refs: "ISPSC 308 · FBC-P" },
    { phase: "Phase 9", code: "610", title: "Pool Final Building", tags: ["Required", "Typical Final", "Critical"], checks: ["Verify completed pool and decking match approved plans", "Verify barrier height, gate operation, and alarm system all in place", "Verify deck surface is slip-resistant with radiused edges", "Verify equipment labels on pumps, filters, heaters are visible", "Verify emergency shut-off switch is installed where required", "Permit card must be on site — issues Certificate of Completion"], refs: "ISPSC 307.2 · FBC-B 110.3 · NEC 680.12" },
  ],
};

const SPA_HOT_TUB: PortalGuide = {
  slug: "spa-hot-tub",
  category: "Pool & Spa",
  title: "Single Family Spa / Hot Tub",
  docCount: 4,
  inspectionCount: 6,
  lastUpdated: REVIEWED,
  summary: "Residential spa or hot tub permit under the private provider program.",
  documents: [
    D.stampedPlans("Spa"),
    D.equipment("pump, heater, blower, and controls"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Spa barrier or safety cover", tags: ["Life Safety"], description: "Verify spa is protected by a code-compliant barrier or ASTM F1346 lockable safety cover.", code: "ISPSC 305 · FBC-R R4501.17" },
    { n: "02", title: "Pre-fab spa approval", tags: ["Documentation"], description: "Verify pre-fabricated spa carries a valid Florida Product Approval or listing.", code: "FBC-R R326" },
    { n: "03", title: "Electrical panel and disconnect", tags: ["Code"], description: "Confirm dedicated GFCI circuit and disconnect within sight of equipment per NEC 680.", code: "NEC 680.42" },
    { n: "04", title: "Setbacks", tags: ["Code"], description: "Verify jurisdictional setbacks from property lines and structures.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "602", title: "Spa Electric Bond", tags: ["Required", "Electrical", "Life Safety"], checks: ["Verify equipotential bonding of all metallic components", "Verify #8 AWG solid copper bond wire connections"], refs: "NEC 680.26" },
    { phase: "Phase 2", code: "604", title: "Spa Piping Pressure Test", tags: ["Required", "Plumbing"], checks: ["Verify spa plumbing holds 30 PSI for 30 minutes without loss", "Verify pipe material and fittings match approved plans"], refs: "ISPSC 308 · FBC-P" },
    { phase: "Phase 3", code: "607", title: "Spa Safety Cover / Barrier", tags: ["Required", "Life Safety", "Critical"], checks: ["Verify ASTM F1346 lockable safety cover or code-compliant barrier installed"], refs: "ISPSC 305 · ASTM F1346" },
    { phase: "Phase 4", code: "608", title: "Spa Final Electric", tags: ["Required", "Electrical"], checks: ["Verify GFCI protection on spa circuit", "Verify disconnect location within sight of spa equipment", "Verify bonding continuity"], refs: "NEC 680.42" },
    { phase: "Phase 5", code: "609", title: "Spa Final Piping", tags: ["Required", "Plumbing"], checks: ["Verify pump, heater, blower connected and leak-free under operating pressure"], refs: "ISPSC 308 · FBC-P" },
    { phase: "Phase 6", code: "610", title: "Spa Final Building", tags: ["Required", "Typical Final", "Critical"], checks: ["Verify installed spa matches approved plans", "Verify safety cover and emergency shut-off installed", "Permit card on site — issues Certificate of Completion"], refs: "ISPSC 307.2 · FBC-B 110.3" },
  ],
};

const POOL_SPA_COMBO: PortalGuide = {
  slug: "pool-spa-combination",
  category: "Pool & Spa",
  title: "Pool + Spa Combination",
  docCount: 6,
  inspectionCount: 11,
  lastUpdated: REVIEWED,
  summary: "Combined in-ground pool and integrated spa permit under the private provider program.",
  documents: [
    D.stampedPlans("Combined pool + spa"),
    { name: "TDH Calculations", description: "Turnover, Design, and Hydraulic calculations for both pool and spa loops.", required: "always" },
    D.equipment("pool + spa pumps, heaters, blowers, and controls"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Barrier compliance for combined vessel", tags: ["Life Safety"], description: "Verify combined water feature is enclosed by code-compliant barrier and door alarms.", code: "ISPSC 305 · FBC-R R4501.17 · FS 515.27" },
    { n: "02", title: "Shell + spa dam wall structural", tags: ["Life Safety"], description: "Verify engineering of shared shell and spa dam wall.", code: "ISPSC 307 · ACI 318" },
    { n: "03", title: "Separate hydraulic circuits", tags: ["Code"], description: "Verify pool and spa hydraulics are on independent circuits with proper valving.", code: "ISPSC 308" },
    { n: "04", title: "Spa spillway / weir design", tags: ["Code"], description: "Verify spillway flow rate and vessel overflow return sizing.", code: "ISPSC 308 · FBC-P" },
    { n: "05", title: "Deck slope and setbacks", tags: ["Code"], description: "Verify deck slope, coping, and jurisdictional setbacks.", code: "ISPSC 306 · Local zoning" },
  ],
  inspections: [
    ...POOL_CONSTRUCTION.inspections.slice(0, 4),
    { phase: "Phase 5", code: "605", title: "Spa Steel & Dam Wall", tags: ["Required", "Structural"], checks: ["Verify spa shell rebar, dam wall reinforcement, and tie-ins to pool bond beam"], refs: "FBC-R R4501 · ACI 318" },
    ...POOL_CONSTRUCTION.inspections.slice(4, 6),
    { phase: "Phase 8", code: "608", title: "Combined Final Electric", tags: ["Required", "Electrical"], checks: ["Verify GFCI protection on all pool and spa circuits", "Verify time clock and lighting circuits operational", "Verify bonding continuity across both vessels"], refs: "NEC 680" },
    { phase: "Phase 9", code: "609", title: "Combined Final Piping", tags: ["Required", "Plumbing"], checks: ["Verify pool and spa loops independently leak-free under operating pressure", "Verify spillway flow", "Verify chemical feeder connections"], refs: "ISPSC 308" },
    { phase: "Phase 10", code: "610", title: "Combined Final Building", tags: ["Required", "Typical Final", "Critical"], checks: ["Verify installation matches approved plans", "Verify barrier, gate, and alarm compliance", "Permit card on site — issues Certificate of Completion"], refs: "ISPSC 307.2 · FBC-B 110.3" },
    { phase: "Phase 11", code: "611", title: "Spa Feature Final", tags: ["Required", "Life Safety"], checks: ["Verify spa safety cover or barrier method", "Verify emergency shut-off within sight of spa"], refs: "ISPSC 305 · NEC 680.41" },
  ],
};

// ---------- CATEGORY 2: HARDSCAPE & DECKING ----------

const PAVER_DRIVEWAY: PortalGuide = {
  slug: "paver-driveway",
  category: "Hardscape & Decking",
  title: "Paver Driveway Installation",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Residential paver driveway installation permit.",
  documents: [
    D.stampedPlans("Driveway layout and section"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Right-of-way and apron", tags: ["Code"], description: "Verify apron dimensions and connection to public right-of-way.", code: "Local PW standards" },
    { n: "02", title: "Impervious coverage", tags: ["Code"], description: "Verify total impervious surface remains within zoning limits.", code: "Local zoning" },
    { n: "03", title: "Base and setback", tags: ["Code"], description: "Verify base thickness, edge restraint, and side-yard setbacks.", code: "FBC-R Ch. 4" },
  ],
  inspections: [
    { phase: "Phase 1", code: "301", title: "Sub-base / Compaction", tags: ["Required", "Site"], checks: ["Verify sub-base material and compacted depth", "Verify edge restraint locations"], refs: "FDOT §200" },
    { phase: "Phase 2", code: "610", title: "Paver Final", tags: ["Required", "Typical Final"], checks: ["Verify paver pattern, joints, and final elevations", "Verify apron pour and right-of-way restoration"], refs: "Local PW standards" },
  ],
};

const POOL_DECK_PAVERS: PortalGuide = {
  slug: "pool-deck-pavers",
  category: "Hardscape & Decking",
  title: "Pool Deck / Patio Pavers",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Pool deck or patio paver installation permit.",
  documents: [D.stampedPlans("Deck layout"), D.survey(), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Slope and drainage", tags: ["Code"], description: 'Verify deck slopes minimum 1/8" per foot away from structures and pool coping.', code: "ISPSC 306.2" },
    { n: "02", title: "Slip-resistant finish", tags: ["Life Safety"], description: "Verify paver finish is slip-resistant per code around wet vessels.", code: "FBC-R R326" },
    { n: "03", title: "Setbacks", tags: ["Code"], description: "Verify setbacks from property lines and structures.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "301", title: "Sub-base / Compaction", tags: ["Required", "Site"], checks: ["Verify sub-base material and compacted depth", "Verify edge restraint"], refs: "FDOT §200" },
    { phase: "Phase 2", code: "610", title: "Deck Final", tags: ["Required", "Typical Final"], checks: ["Verify pattern, joints, slope, and coping tie-in"], refs: "ISPSC 306" },
  ],
};

const RETAINING_WALL: PortalGuide = {
  slug: "retaining-wall",
  category: "Hardscape & Decking",
  title: "Retaining Wall",
  docCount: 4,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Engineered retaining wall permit.",
  documents: [
    D.stampedPlans("Retaining wall with section and reinforcement details"),
    D.engineering("wall design including soil, surcharge, and drainage"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Structural design and height", tags: ["Life Safety"], description: "Verify wall height, batter, and reinforcement match sealed engineering.", code: "FBC-R R404" },
    { n: "02", title: "Drainage and weep design", tags: ["Code"], description: "Verify drain rock, filter fabric, and weep hole spacing.", code: "FBC-R R405" },
    { n: "03", title: "Backfill specification", tags: ["Code"], description: "Verify backfill material, lift thickness, and compaction.", code: "FBC-R R405" },
    { n: "04", title: "Setbacks and easements", tags: ["Code"], description: "Verify wall placement clear of easements and property lines.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "101", title: "Footing", tags: ["Required", "Structural"], checks: ["Verify footing width, depth, and rebar per engineered plans"], refs: "FBC-R R403" },
    { phase: "Phase 2", code: "302", title: "Steel / Reinforcement", tags: ["Required", "Structural"], checks: ["Verify wall stem reinforcement placement, laps, and coverage"], refs: "ACI 318" },
    { phase: "Phase 3", code: "610", title: "Drainage & Final", tags: ["Required", "Typical Final"], checks: ["Verify weep holes, drain rock, filter fabric, and backfill compaction"], refs: "FBC-R R405" },
  ],
};

const CONCRETE_SLAB: PortalGuide = {
  slug: "concrete-flatwork-slab",
  category: "Hardscape & Decking",
  title: "Concrete Flatwork / Slab",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Concrete flatwork or slab-on-grade permit.",
  documents: [D.stampedPlans("Slab plan with reinforcement"), D.survey(), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Slab thickness and reinforcement", tags: ["Structural"], description: "Verify slab thickness, mesh or rebar, and control joints.", code: "ACI 302 · FBC-R R506" },
    { n: "02", title: "Vapor barrier", tags: ["Code"], description: "Verify 6-mil vapor barrier under conditioned slabs.", code: "FBC-R R506.2.3" },
    { n: "03", title: "Setbacks and impervious limits", tags: ["Code"], description: "Verify impervious coverage and setbacks.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "201", title: "Slab / Pre-Pour", tags: ["Required", "Structural"], checks: ["Verify reinforcement, vapor barrier, and form dimensions before pour"], refs: "FBC-R R506" },
    { phase: "Phase 2", code: "610", title: "Slab Final", tags: ["Required", "Typical Final"], checks: ["Verify final finish, control joints, and slope"], refs: "ACI 302" },
  ],
};

const CONCRETE_FOOTING: PortalGuide = {
  slug: "concrete-footing-foundation",
  category: "Hardscape & Decking",
  title: "Concrete Footing / Foundation",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Concrete footing or foundation permit.",
  documents: [
    D.stampedPlans("Foundation plan with footing sections"),
    D.engineering("footing design based on soil report or presumptive values"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Footing depth and width", tags: ["Structural"], description: "Verify footing dimensions and bearing depth per soil conditions.", code: "FBC-R R403" },
    { n: "02", title: "Reinforcement schedule", tags: ["Structural"], description: "Verify rebar size, spacing, laps, and coverage.", code: "ACI 318" },
    { n: "03", title: "Anchorage", tags: ["Structural"], description: "Verify anchor bolts, straps, and hold-downs shown per plans.", code: "FBC-R R403.1.6" },
  ],
  inspections: [
    { phase: "Phase 1", code: "101", title: "Footing", tags: ["Required", "Structural"], checks: ["Verify footing depth, width, and rebar prior to pour"], refs: "FBC-R R403" },
    { phase: "Phase 2", code: "610", title: "Foundation Final", tags: ["Required", "Typical Final"], checks: ["Verify anchorage placement and stem wall condition"], refs: "FBC-R R403" },
  ],
};

// ---------- CATEGORY 3: OUTDOOR LIVING ----------

const OUTDOOR_KITCHEN: PortalGuide = {
  slug: "outdoor-kitchen",
  category: "Outdoor Living",
  title: "Outdoor Kitchen",
  docCount: 4,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Outdoor kitchen with gas, electric, and plumbing rough-ins.",
  documents: [
    D.stampedPlans("Outdoor kitchen with MEP layout"),
    D.equipment("grill, refrigerator, and gas appliances"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Gas appliance clearances", tags: ["Life Safety"], description: "Verify BTU load, gas line sizing, and clearances to combustibles.", code: "FBC-FG 401" },
    { n: "02", title: "GFCI-protected circuits", tags: ["Electrical"], description: "Verify all countertop and appliance receptacles are GFCI-protected.", code: "NEC 210.8" },
    { n: "03", title: "Drain / vent for sink", tags: ["Plumbing"], description: "Verify DWV routing and connection to sanitary or dry well as approved.", code: "FBC-P" },
    { n: "04", title: "Roof / cover attachment", tags: ["Structural"], description: "Verify attachment for any overhead cover.", code: "FBC-R R802" },
  ],
  inspections: [
    { phase: "Phase 1", code: "401", title: "Rough Electric", tags: ["Required", "Electrical"], checks: ["Verify circuit routing, GFCI provisions, and box locations"], refs: "NEC" },
    { phase: "Phase 2", code: "402", title: "Gas Line Pressure Test", tags: ["Required", "Gas", "Life Safety"], checks: ["Verify gas piping holds test pressure per code (typically 10 PSI / 15 min)", "Verify pipe material and shutoff locations"], refs: "FBC-FG 406" },
    { phase: "Phase 3", code: "608", title: "Final Electric", tags: ["Required", "Electrical"], checks: ["Verify GFCI operation, device covers, and bonding"], refs: "NEC 210.8" },
    { phase: "Phase 4", code: "610", title: "Final Building", tags: ["Required", "Typical Final"], checks: ["Verify appliance installation and clearances match approved plans"], refs: "FBC-B 110.3" },
  ],
};

const FIRE_FEATURE: PortalGuide = {
  slug: "fire-feature",
  category: "Outdoor Living",
  title: "Fire Pit / Fire Bowl / Fire Feature",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Gas-fed fire pit, bowl, or feature permit.",
  documents: [
    D.stampedPlans("Fire feature location plan with gas routing"),
    D.equipment("burner assembly, valves, and shutoffs"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Clearances to combustibles", tags: ["Life Safety"], description: "Verify horizontal and vertical clearances from structures and combustibles.", code: "FBC-FG 308" },
    { n: "02", title: "Emergency shutoff", tags: ["Life Safety"], description: "Verify accessible manual shutoff within sight of feature.", code: "FBC-FG 409" },
    { n: "03", title: "Gas sizing", tags: ["Code"], description: "Verify gas line size for burner BTU load.", code: "FBC-FG 402" },
  ],
  inspections: [
    { phase: "Phase 1", code: "402", title: "Gas Line Pressure Test", tags: ["Required", "Gas", "Life Safety"], checks: ["Verify gas piping holds test pressure per code", "Verify shutoff locations"], refs: "FBC-FG 406" },
    { phase: "Phase 2", code: "610", title: "Fire Feature Final", tags: ["Required", "Typical Final", "Critical"], checks: ["Verify burner operation, clearances, and shutoff accessibility"], refs: "FBC-FG 308" },
  ],
};

const PERGOLA: PortalGuide = {
  slug: "pergola-shade-structure",
  category: "Outdoor Living",
  title: "Pergola / Shade Structure",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Freestanding or attached pergola / shade structure permit.",
  documents: [
    D.stampedPlans("Pergola with framing and connections"),
    D.engineering("wind load design per FBC HVHZ / non-HVHZ as applicable"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind load design", tags: ["Structural"], description: "Verify structure is designed for site wind speed and exposure category.", code: "FBC-B 1609 · ASCE 7" },
    { n: "02", title: "Anchorage and footings", tags: ["Structural"], description: "Verify post anchor design and footing size.", code: "FBC-R R403" },
    { n: "03", title: "Setbacks", tags: ["Code"], description: "Verify setbacks from property lines and structures.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "101", title: "Footing", tags: ["Required", "Structural"], checks: ["Verify post footings depth, width, and rebar"], refs: "FBC-R R403" },
    { phase: "Phase 2", code: "610", title: "Pergola Final", tags: ["Required", "Typical Final"], checks: ["Verify anchors, connections, and finish match approved plans"], refs: "FBC-B 1609" },
  ],
};

const SCREEN_ENCLOSURE: PortalGuide = {
  slug: "screen-enclosure",
  category: "Outdoor Living",
  title: "Screen Enclosure / Lanai",
  docCount: 4,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Aluminum screen enclosure or lanai permit.",
  documents: [
    D.stampedPlans("Screen enclosure framing plan"),
    D.engineering("aluminum framing engineered for site wind loads"),
    D.productApproval(),
    D.survey(),
    D.ntbo(),
    D.ownerAuth(),
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Wind load and framing", tags: ["Structural"], description: "Verify aluminum members sized for site wind speed and exposure.", code: "FBC-B 2002 · AAMA" },
    { n: "02", title: "Attachment to host", tags: ["Structural"], description: "Verify attachment to house / slab meets product approval.", code: "FBC-B 1710" },
    { n: "03", title: "Egress and door swings", tags: ["Life Safety"], description: "Verify emergency egress from dwelling remains unobstructed.", code: "FBC-R R310" },
    { n: "04", title: "Setbacks and impervious", tags: ["Code"], description: "Verify setbacks and impervious coverage.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "101", title: "Footing", tags: ["Required", "Structural"], checks: ["Verify perimeter footing or slab embedment for framing"], refs: "FBC-R R403" },
    { phase: "Phase 2", code: "303", title: "Frame / Structural", tags: ["Required", "Structural"], checks: ["Verify framing members, fasteners, and connections per product approval"], refs: "FBC-B 2002" },
    { phase: "Phase 3", code: "610", title: "Enclosure Final", tags: ["Required", "Typical Final"], checks: ["Verify screen, doors, and finish match approved plans"], refs: "FBC-B 110.3" },
  ],
};

const ALUMINUM_PATIO_COVER: PortalGuide = {
  slug: "aluminum-patio-cover",
  category: "Outdoor Living",
  title: "Aluminum Patio Cover",
  docCount: 2,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Solid aluminum patio cover permit.",
  documents: [
    D.stampedPlans("Patio cover framing"),
    D.productApproval(),
    D.ntbo(),
    D.ownerAuth(),
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Product approval", tags: ["Documentation"], description: "Verify FL Product Approval and installation matches approval drawings.", code: "FL Product Approval" },
    { n: "02", title: "Attachment to host", tags: ["Structural"], description: "Verify ledger connection and fasteners.", code: "FBC-B 1710" },
  ],
  inspections: [
    { phase: "Phase 1", code: "610", title: "Patio Cover Final", tags: ["Required", "Typical Final"], checks: ["Verify installation matches product approval and approved plans"], refs: "FBC-B 110.3" },
  ],
};

// ---------- CATEGORY 4: STRUCTURAL / SITE WORK ----------

const FENCE: PortalGuide = {
  slug: "fence-installation",
  category: "Structural / Site Work",
  title: "Fence Installation",
  docCount: 2,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Residential perimeter fence permit.",
  documents: [D.stampedPlans("Fence plan showing type, height, and location"), D.survey(), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Height and materials", tags: ["Code"], description: "Verify fence height and material match zoning allowances.", code: "Local zoning" },
    { n: "02", title: "Pool barrier compliance (if adjacent)", tags: ["Life Safety"], description: "Verify pool barrier attributes if fence serves as barrier.", code: "ISPSC 305 · FS 515.27" },
    { n: "03", title: "Corner visibility", tags: ["Code"], description: "Verify sight-triangle limits at corners and driveways.", code: "Local zoning" },
  ],
  inspections: [
    { phase: "Phase 1", code: "610", title: "Fence Final", tags: ["Required", "Typical Final"], checks: ["Verify post footings, gate hardware, and setbacks", "Verify pool barrier compliance if applicable"], refs: "FS 515.27" },
  ],
};

const STRUCTURAL_ELEVATION: PortalGuide = {
  slug: "structural-elevation",
  category: "Structural / Site Work",
  title: "Structural Elevation",
  docCount: 4,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Site or structure elevation change permit (grade change / FEMA compliance).",
  documents: [
    D.stampedPlans("Elevation and grading plan"),
    D.engineering("elevation and drainage design"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "FEMA / flood zone compliance", tags: ["Life Safety"], description: "Verify finished floor elevation meets BFE + freeboard for the flood zone.", code: "FBC-R R322 · Local FPO" },
    { n: "02", title: "Drainage impact on neighbors", tags: ["Code"], description: "Verify grading does not discharge concentrated flow onto adjacent property.", code: "Local drainage code" },
    { n: "03", title: "Retaining requirements", tags: ["Structural"], description: "Verify walls where grade differential exceeds allowable slope.", code: "FBC-R R404" },
    { n: "04", title: "Erosion control during work", tags: ["Code"], description: "Verify silt fence and BMPs during construction.", code: "FDEP NPDES" },
  ],
  inspections: [
    { phase: "Phase 1", code: "301", title: "Sub-base / Compaction", tags: ["Required", "Site"], checks: ["Verify fill material, lift thickness, and compaction density"], refs: "FBC-B 1804" },
    { phase: "Phase 2", code: "302", title: "Grading / Drainage", tags: ["Required", "Site"], checks: ["Verify grading matches approved plans and drainage flows to approved outfall"], refs: "Local drainage code" },
    { phase: "Phase 3", code: "610", title: "Elevation Final", tags: ["Required", "Typical Final"], checks: ["Verify finished elevations by surveyor's elevation certificate"], refs: "FEMA / Local FPO" },
  ],
};

const DEMOLITION: PortalGuide = {
  slug: "demolition",
  category: "Structural / Site Work",
  title: "Demolition",
  docCount: 3,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Structural or partial demolition permit.",
  documents: [
    D.stampedPlans("Scope of demolition with existing structures"),
    { name: "Asbestos / NESHAP Notification", description: "Copy of DEP asbestos survey and NESHAP notice.", required: "always" },
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Utility disconnects", tags: ["Life Safety"], description: "Verify letters of disconnect from electric, gas, water, and sewer providers.", code: "FBC-EB 108" },
    { n: "02", title: "Asbestos abatement", tags: ["Life Safety"], description: "Verify DEP survey and abatement plan on record.", code: "40 CFR 61 (NESHAP)" },
    { n: "03", title: "Site protection", tags: ["Code"], description: "Verify tree protection and dust / erosion control.", code: "Local code" },
  ],
  inspections: [
    { phase: "Phase 1", code: "610", title: "Demolition Final", tags: ["Required", "Typical Final"], checks: ["Verify site cleared, capped utilities, and grade left safe"], refs: "FBC-EB 108" },
  ],
};

const SITE_DRAINAGE: PortalGuide = {
  slug: "site-drainage-swale",
  category: "Structural / Site Work",
  title: "Site Drainage / Swale",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Swale, dry well, or site drainage improvement permit.",
  documents: [D.stampedPlans("Drainage plan with grades and outfall"), D.survey(), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Discharge to approved outfall", tags: ["Code"], description: "Verify drainage discharges to right-of-way or approved retention.", code: "Local PW / SWFWMD" },
    { n: "02", title: "Adjacent property impact", tags: ["Code"], description: "Verify no adverse discharge onto neighboring property.", code: "Local drainage code" },
    { n: "03", title: "Erosion control BMPs", tags: ["Code"], description: "Verify silt fence, inlet protection during construction.", code: "FDEP NPDES" },
  ],
  inspections: [
    { phase: "Phase 1", code: "301", title: "Rough Grade", tags: ["Required", "Site"], checks: ["Verify swale profile, slope, and pipe placement before cover"], refs: "Local PW" },
    { phase: "Phase 2", code: "610", title: "Drainage Final", tags: ["Required", "Typical Final"], checks: ["Verify final grades, sod, and flow to outfall"], refs: "Local drainage code" },
  ],
};

// ---------- CATEGORY 5: ELECTRICAL ----------

const POOL_ELECTRICAL: PortalGuide = {
  slug: "pool-electrical-standalone",
  category: "Electrical",
  title: "Pool Electrical (Standalone)",
  docCount: 2,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Standalone pool electrical work — bonding, lighting, or equipment.",
  documents: [D.stampedPlans("Electrical scope plan"), D.equipment("pool equipment being wired"), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Equipotential bonding", tags: ["Life Safety"], description: "Verify equipotential bonding of all metallic components.", code: "NEC 680.26" },
    { n: "02", title: "GFCI protection", tags: ["Life Safety"], description: "Verify GFCI protection on all pool circuits.", code: "NEC 680.22" },
    { n: "03", title: "Wet niche approval", tags: ["Documentation"], description: "Verify wet niche listing and installation depth.", code: "NEC 680.23" },
  ],
  inspections: [
    { phase: "Phase 1", code: "602", title: "Bond", tags: ["Required", "Electrical", "Life Safety"], checks: ["Verify #8 AWG bond wire connections to all metallic components"], refs: "NEC 680.26" },
    { phase: "Phase 2", code: "606", title: "Wet Niche", tags: ["Required", "Electrical"], checks: ["Verify niche embedment, conduit, and bond connection"], refs: "NEC 680.23" },
    { phase: "Phase 3", code: "608", title: "Final Electric", tags: ["Required", "Electrical"], checks: ["Verify GFCI operation and bonding continuity"], refs: "NEC 680" },
  ],
};

const OUTDOOR_LIGHTING: PortalGuide = {
  slug: "outdoor-lighting",
  category: "Electrical",
  title: "Outdoor Lighting / Low Voltage",
  docCount: 2,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Landscape / outdoor low-voltage lighting permit.",
  documents: [D.stampedPlans("Lighting plan with transformer locations"), D.equipment("transformers and fixtures"), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Transformer sizing and location", tags: ["Electrical"], description: "Verify transformer VA rating and mounting height.", code: "NEC 411" },
    { n: "02", title: "GFCI on primary side", tags: ["Life Safety"], description: "Verify primary receptacle is GFCI-protected.", code: "NEC 210.8" },
    { n: "03", title: "Burial depth", tags: ["Code"], description: "Verify low-voltage cable burial depth per code.", code: "NEC 411.4" },
  ],
  inspections: [
    { phase: "Phase 1", code: "610", title: "Lighting Final", tags: ["Required", "Electrical"], checks: ["Verify fixture operation, transformer install, and GFCI protection"], refs: "NEC 411" },
  ],
};

const GENERATOR: PortalGuide = {
  slug: "generator-installation",
  category: "Electrical",
  title: "Generator Installation",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Standby generator installation permit.",
  documents: [
    D.stampedPlans("Generator location, transfer switch, and one-line diagram"),
    D.equipment("generator and automatic transfer switch"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Clearances from openings", tags: ["Life Safety"], description: "Verify generator setback from windows, doors, and combustibles.", code: "NFPA 37 · FBC-FG" },
    { n: "02", title: "Transfer switch and interlock", tags: ["Electrical"], description: "Verify listed transfer switch or interlock kit to prevent back-feed.", code: "NEC 702" },
    { n: "03", title: "Gas / fuel supply sizing", tags: ["Code"], description: "Verify fuel line size and pressure regulator for generator BTU load.", code: "FBC-FG 402" },
  ],
  inspections: [
    { phase: "Phase 1", code: "401", title: "Rough Electric", tags: ["Required", "Electrical"], checks: ["Verify transfer switch install, conductor sizing, and grounding"], refs: "NEC 702" },
    { phase: "Phase 2", code: "608", title: "Final Electric", tags: ["Required", "Electrical", "Critical"], checks: ["Verify generator start / transfer operation and fuel line pressure test"], refs: "NEC 702 · FBC-FG" },
  ],
};

const PANEL_UPGRADE: PortalGuide = {
  slug: "panel-upgrade-service-change",
  category: "Electrical",
  title: "Panel Upgrade / Service Change",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Main panel upgrade or utility service change permit.",
  documents: [D.stampedPlans("One-line diagram and panel schedule"), D.equipment("panel, meter can, and disconnect"), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Service size and grounding", tags: ["Electrical"], description: "Verify service size, grounding electrode, and bonding to water / gas.", code: "NEC 250" },
    { n: "02", title: "AFCI / GFCI provisions", tags: ["Life Safety"], description: "Verify AFCI / GFCI breaker use per current NEC.", code: "NEC 210.12 · 210.8" },
    { n: "03", title: "Utility coordination", tags: ["Code"], description: "Verify utility release / cut-in schedule on file.", code: "Utility rules" },
  ],
  inspections: [
    { phase: "Phase 1", code: "401", title: "Service Rough", tags: ["Required", "Electrical"], checks: ["Verify meter can, service conductors, and grounding electrode"], refs: "NEC 230 · 250" },
    { phase: "Phase 2", code: "608", title: "Final Electric", tags: ["Required", "Electrical"], checks: ["Verify panel labeling, breaker install, and utility release"], refs: "NEC 408" },
  ],
};

// ---------- CATEGORY 6: PLUMBING ----------

const POOL_PLUMBING: PortalGuide = {
  slug: "pool-plumbing-standalone",
  category: "Plumbing",
  title: "Pool Plumbing (Standalone)",
  docCount: 2,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Standalone pool plumbing scope — piping, valves, or equipment.",
  documents: [D.stampedPlans("Plumbing scope plan"), D.equipment("pump, filter, valves"), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Pipe sizing and TDH", tags: ["Plumbing"], description: "Verify pipe size supports circulation flow rate at operating TDH.", code: "ISPSC 308" },
    { n: "02", title: "Suction entrapment (VGB)", tags: ["Life Safety"], description: "Verify VGB-compliant drain covers and dual-suction where required.", code: "VGBA / ISPSC 310" },
    { n: "03", title: "Backwash routing", tags: ["Code"], description: "Verify backwash discharge to approved location.", code: "Local drainage code" },
  ],
  inspections: [
    { phase: "Phase 1", code: "604", title: "Pool Piping Pressure Test", tags: ["Required", "Plumbing"], checks: ["Verify lines hold 30 PSI for 30 min before burial"], refs: "ISPSC 308" },
    { phase: "Phase 2", code: "609", title: "Final Piping", tags: ["Required", "Plumbing"], checks: ["Verify pump / filter operate leak-free"], refs: "ISPSC 308" },
    { phase: "Phase 3", code: "610", title: "Plumbing Final", tags: ["Required", "Typical Final"], checks: ["Verify VGB drain covers and equipment labeling"], refs: "VGBA / ISPSC 310" },
  ],
};

const WATER_FEATURE: PortalGuide = {
  slug: "water-feature-fountain",
  category: "Plumbing",
  title: "Water Feature / Fountain",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Decorative water feature or fountain permit.",
  documents: [
    D.stampedPlans("Feature plan with plumbing and electrical"),
    D.equipment("pump, lights, and controls"),
    D.survey(),
    ...CONDITIONAL_TAIL,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Bonding for metallic components", tags: ["Life Safety"], description: "Verify equipotential bonding for metal features.", code: "NEC 680.53" },
    { n: "02", title: "GFCI protection", tags: ["Life Safety"], description: "Verify GFCI on feature circuits.", code: "NEC 680.51" },
    { n: "03", title: "Auto-fill and backflow", tags: ["Plumbing"], description: "Verify approved backflow prevention on auto-fill.", code: "FBC-P 608" },
  ],
  inspections: [
    { phase: "Phase 1", code: "604", title: "Feature Piping Pressure Test", tags: ["Required", "Plumbing"], checks: ["Verify feature piping holds test pressure"], refs: "ISPSC 308" },
    { phase: "Phase 2", code: "610", title: "Feature Final", tags: ["Required", "Typical Final"], checks: ["Verify operation, GFCI, bonding, and backflow install"], refs: "NEC 680 · FBC-P 608" },
  ],
};

const IRRIGATION: PortalGuide = {
  slug: "irrigation-system",
  category: "Plumbing",
  title: "Irrigation System",
  docCount: 2,
  inspectionCount: 1,
  lastUpdated: REVIEWED,
  summary: "Residential irrigation system permit.",
  documents: [D.stampedPlans("Irrigation zone plan with backflow location"), D.equipment("controller and backflow assembly"), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "Backflow prevention", tags: ["Life Safety"], description: "Verify approved backflow assembly at point of connection.", code: "FBC-P 608" },
    { n: "02", title: "Rain / soil sensor", tags: ["Code"], description: "Verify functioning rain-shutoff or soil-moisture sensor.", code: "FS 373.62" },
    { n: "03", title: "Right-of-way spray", tags: ["Code"], description: "Verify spray heads do not throw onto ROW / streets.", code: "Local code" },
  ],
  inspections: [
    { phase: "Phase 1", code: "610", title: "Irrigation Final", tags: ["Required", "Typical Final"], checks: ["Verify backflow test, sensor operation, and coverage"], refs: "FBC-P 608 · FS 373.62" },
  ],
};

const OUTDOOR_PLUMBING_ROUGH: PortalGuide = {
  slug: "outdoor-plumbing-rough-in",
  category: "Plumbing",
  title: "Outdoor Plumbing Rough-In",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Outdoor plumbing rough-in for kitchens, bars, or half-baths.",
  documents: [D.stampedPlans("Plumbing rough-in with DWV and supply routing"), D.survey(), ...CONDITIONAL_TAIL],
  downloads: STANDARD_DOWNLOADS,
  planReview: [
    { n: "01", title: "DWV sizing and slope", tags: ["Plumbing"], description: "Verify DWV pipe sizing, slope, and venting arrangement.", code: "FBC-P Ch. 7" },
    { n: "02", title: "Water supply sizing", tags: ["Plumbing"], description: "Verify supply line sizing based on fixture units.", code: "FBC-P Ch. 6" },
    { n: "03", title: "Backflow", tags: ["Life Safety"], description: "Verify hose bib vacuum breakers and other backflow devices.", code: "FBC-P 608" },
  ],
  inspections: [
    { phase: "Phase 1", code: "501", title: "Plumbing Rough", tags: ["Required", "Plumbing"], checks: ["Verify DWV, supply, and pressure tests before cover"], refs: "FBC-P" },
    { phase: "Phase 2", code: "610", title: "Plumbing Final", tags: ["Required", "Typical Final"], checks: ["Verify fixtures, trap seals, and backflow devices"], refs: "FBC-P 608" },
  ],
};

// ---------- REGISTRY ----------

import { COMMERCIAL_GUIDES } from "./portal-guides-commercial";
import { SINGLE_FAMILY_GUIDES } from "./portal-guides-single-family";
import { SINGLE_FAMILY_GUIDES_2 } from "./portal-guides-single-family-2";
import { SINGLE_FAMILY_GUIDES_3 } from "./portal-guides-single-family-3";
import { GUIDES_BATCH_4 } from "./portal-guides-batch-4";
import { GUIDES_BATCH_5 } from "./portal-guides-batch-5";
import { GUIDES_BATCH_6 } from "./portal-guides-batch-6";
import { GUIDES_BATCH_7 } from "./portal-guides-batch-7";


export const PORTAL_GUIDES: PortalGuide[] = [
  // Pool & Spa
  POOL_CONSTRUCTION,
  SPA_HOT_TUB,
  POOL_SPA_COMBO,
  // Hardscape & Decking
  PAVER_DRIVEWAY,
  POOL_DECK_PAVERS,
  RETAINING_WALL,
  CONCRETE_SLAB,
  CONCRETE_FOOTING,
  // Outdoor Living
  OUTDOOR_KITCHEN,
  FIRE_FEATURE,
  PERGOLA,
  SCREEN_ENCLOSURE,
  ALUMINUM_PATIO_COVER,
  // Structural / Site Work
  FENCE,
  STRUCTURAL_ELEVATION,
  DEMOLITION,
  SITE_DRAINAGE,
  // Electrical
  POOL_ELECTRICAL,
  OUTDOOR_LIGHTING,
  GENERATOR,
  PANEL_UPGRADE,
  // Plumbing
  POOL_PLUMBING,
  WATER_FEATURE,
  IRRIGATION,
  OUTDOOR_PLUMBING_ROUGH,
  // Commercial
  ...COMMERCIAL_GUIDES,
  // Single Family
  ...SINGLE_FAMILY_GUIDES,
  ...SINGLE_FAMILY_GUIDES_2,
  ...SINGLE_FAMILY_GUIDES_3,
  ...GUIDES_BATCH_4,
  ...GUIDES_BATCH_5,
  // Multi Family
  ...GUIDES_BATCH_6,
  ...GUIDES_BATCH_7,

];


export const PORTAL_GUIDE_CATEGORIES = [
  "Pool & Spa",
  "Hardscape & Decking",
  "Outdoor Living",
  "Structural / Site Work",
  "Electrical",
  "Plumbing",
  "Commercial",
  "Single Family",
  "Multi Family",
];

export function getPortalGuide(slug: string): PortalGuide | undefined {
  return PORTAL_GUIDES.find((g) => g.slug === slug);
}

