export type Trade =
  | "Pool"
  | "Plumbing"
  | "Electrical"
  | "General Contractors"
  | "HVAC"
  | "Roofing"
  | "Specialty";

export type Category = "Residential" | "Commercial" | "Specialty";

export type Doc = { name: string; description: string; status: "Required" | "Conditional" };
export type Inspection = { name: string; confirm: string };

export type Guide = {
  id: string;
  title: string;
  trade: Trade;
  category: Category;
  excerpt: string;
  documents: Doc[];
  inspections: Inspection[];
  codes: string[];
  pitfalls: string[];
};

const POOL_DOCS: Doc[] = [
  { name: "Site Plan (Signed & Sealed)", description: "Survey-based plan showing pool location, setbacks from property lines, easements, septic, and existing structures.", status: "Required" },
  { name: "Structural Engineering", description: "Signed & sealed shell drawings with rebar schedule, gunite specs, and soil bearing assumptions.", status: "Required" },
  { name: "Pool Plumbing & Equipment Plan", description: "Suction/return layout, equipment pad detail, anti-entrapment compliance (VGB).", status: "Required" },
  { name: "Electrical Plan & Bonding Detail", description: "Equipotential bonding grid, GFCI protection, panel load calc.", status: "Required" },
  { name: "Barrier / Safety Compliance", description: "Fence, self-closing/self-latching gates, alarms per FBC-R 4501.17.", status: "Required" },
  { name: "NOC (Notice of Commencement)", description: "Required when valuation exceeds $5,000. Recorded copy must be posted on site.", status: "Conditional" },
  { name: "HOA Approval Letter", description: "Required when subdivision or HOA has architectural review.", status: "Conditional" },
];

export const GUIDES: Guide[] = [
  {
    id: "new-pool-res",
    title: "New Pool Construction — Residential",
    trade: "Pool", category: "Residential",
    excerpt: "Full in-ground residential pool with attached spa, equipment pad, deck, and code-compliant safety barrier.",
    documents: POOL_DOCS,
    inspections: [
      { name: "Steel / Pre-Gunite", confirm: "Rebar spacing, bonding grid continuity, depth of shell." },
      { name: "Deck Steel", confirm: "Bonding of deck reinforcement before concrete pour." },
      { name: "Rough Plumbing", confirm: "Pressure test of suction/return lines holds 25 PSI for 15 minutes." },
      { name: "Rough Electrical & Bonding", confirm: "Equipotential bonding of all metal within 5 ft, GFCI on all 120V circuits." },
      { name: "Final Barrier", confirm: "48\" min height, self-closing/self-latching gate, no climbable surfaces within 24\"." },
      { name: "Final Pool", confirm: "Anti-entrapment cover (VGB), functioning equipment, signage." },
    ],
    codes: ["FBC-R 4501.17 — Residential Swimming Pools", "FBC-R 4501.17.1.14 — Pool Safety Act", "NEC Article 680 — Swimming Pools, Fountains, Similar Installations", "FL Statute 515 — Residential Pool Safety Act", "FBC Plumbing — Anti-Entrapment (VGB)"],
    pitfalls: [
      "Submitting site plan without sealed survey — auto-reject by reviewer.",
      "Missing bonding detail on equipment pad — fails rough electrical every time.",
      "Gate latch installed below 54\" trigger height — final barrier fails.",
      "Equipment located in side setback without variance — full redesign required.",
    ],
  },
  {
    id: "pool-resurface-res",
    title: "Pool Resurfacing — Residential",
    trade: "Pool", category: "Residential",
    excerpt: "Replacement of interior pool finish (plaster, pebble, quartz) on existing residential pool. Often combined with tile and waterline updates.",
    documents: [
      { name: "Scope Letter", description: "Description of finish removal method, replacement product, and tile work if any.", status: "Required" },
      { name: "Existing Permit / Pool History", description: "Documentation of original pool permit or as-builts.", status: "Conditional" },
      { name: "VGB Drain Cover Affidavit", description: "Required if drain covers are replaced or older than VGB compliance date.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pre-Plaster", confirm: "Shell prep, bond coat, no exposed rebar." },
      { name: "Final", confirm: "Finish cured, VGB-compliant drain covers in place, equipment operational." },
    ],
    codes: ["FBC-R 4501.17 — Residential Pools", "Virginia Graeme Baker Act — Anti-Entrapment", "FBC Existing Building — Repair/Alteration"],
    pitfalls: [
      "Filing as repair when scope includes plumbing — wrong permit type causes re-submittal.",
      "Skipping VGB affidavit when drains are touched.",
      "Resurfacing under a pool without original permit on record — county may require structural review first.",
    ],
  },
  {
    id: "pool-resurface-com",
    title: "Pool Resurfacing — Commercial",
    trade: "Pool", category: "Commercial",
    excerpt: "Resurfacing of commercial (HOA, hotel, condo) pool. Requires DOH/FDOH coordination in addition to building permit.",
    documents: [
      { name: "DOH Public Pool Operating Permit", description: "Current Florida DOH public pool permit must be on file and active.", status: "Required" },
      { name: "Sealed Scope Letter", description: "Engineer-sealed scope describing finish, tile, and any chemical feed updates.", status: "Required" },
      { name: "VGB Drain Cover Cert", description: "Manufacturer certification of replacement covers (5-year cycle).", status: "Required" },
      { name: "Chemical Controller Documentation", description: "Required if automated chem controller is added/replaced.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pre-Plaster", confirm: "Shell prep, drain cover installation per VGB." },
      { name: "DOH Re-Open Inspection", confirm: "DOH sign-off before pool may be returned to public use." },
      { name: "Final Building", confirm: "All trades complete, equipment operational." },
    ],
    codes: ["FAC 64E-9 — Public Swimming Pools", "FL Statute 514 — Public Swimming and Bathing Facilities", "VGB Pool & Spa Safety Act", "FBC Existing Building"],
    pitfalls: [
      "Re-opening pool to public before DOH re-inspection — operating permit suspended.",
      "Using non-NSF certified drain covers.",
      "Missing chemical log updates during shutdown period.",
    ],
  },
  {
    id: "screen-new",
    title: "Screen Enclosure — New",
    trade: "Specialty", category: "Residential",
    excerpt: "New aluminum screen enclosure over pool, patio, or lanai. Wind-load engineering required.",
    documents: [
      { name: "Site Plan with Setbacks", description: "Show enclosure footprint, setbacks, and tie-in to existing structure.", status: "Required" },
      { name: "Wind Load Engineering", description: "Signed & sealed calcs for ASCE 7-22 wind speed (160-180 MPH in PBC).", status: "Required" },
      { name: "Attachment Details", description: "Shows hostbeam attachment to existing structure or new footers.", status: "Required" },
      { name: "Product Approval (NOA/FL)", description: "Florida product approval numbers for screen, frame, and fasteners.", status: "Required" },
      { name: "HOA Approval", description: "Required when subdivision has architectural review.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer / Slab", confirm: "Footer dimensions, rebar, and compaction." },
      { name: "Tie-Down / Anchorage", confirm: "Hostbeam attachment per engineered detail." },
      { name: "Final", confirm: "Screen complete, doors operate, no unattached panels." },
    ],
    codes: ["FBC 1609 — Wind Loads", "ASCE 7-22", "FBC-R 4501.17 — When over a pool, must integrate with safety barrier"],
    pitfalls: [
      "Using stock generic engineering instead of project-specific calc — rejected at intake.",
      "Forgetting that screen door over pool must self-close/self-latch.",
      "Attaching to existing fascia without verifying truss capacity.",
    ],
  },
  {
    id: "pool-cage-replace",
    title: "Pool Cage Replacement",
    trade: "Specialty", category: "Residential",
    excerpt: "Replacement of existing screen pool enclosure damaged by storm or age. Treated as new construction by most jurisdictions.",
    documents: [
      { name: "Demo Scope & Photos", description: "Photo documentation of existing cage and damage.", status: "Required" },
      { name: "Wind Load Engineering", description: "Current ASCE 7-22 calcs — old engineering does NOT carry over.", status: "Required" },
      { name: "Product Approval", description: "Current FL product approvals for all assemblies.", status: "Required" },
      { name: "Existing Permit History", description: "Records of original cage permit, if any.", status: "Conditional" },
    ],
    inspections: [
      { name: "Anchor / Tie-Down", confirm: "New anchorage to existing footers verified or new footers poured." },
      { name: "Final", confirm: "All connections per engineering, pool barrier still compliant." },
    ],
    codes: ["FBC 1609", "ASCE 7-22", "FBC Existing Building 706 — Replacement"],
    pitfalls: [
      "Re-using existing footers without engineer verifying capacity for new wind loads.",
      "Filing as repair to avoid engineering — replacement requires full permit.",
      "Damaging pool safety barrier during demo and not restoring it.",
    ],
  },
  {
    id: "pergola-attached",
    title: "Pergola — Attached",
    trade: "Specialty", category: "Residential",
    excerpt: "Pergola attached to existing residence, requires engineering for ledger and wind uplift.",
    documents: [
      { name: "Site Plan", description: "Setbacks, footprint, distance to property lines.", status: "Required" },
      { name: "Structural Engineering", description: "Signed/sealed including ledger attachment and uplift connectors.", status: "Required" },
      { name: "Product Approval (if prefab)", description: "FL approval for manufactured pergola systems.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer", confirm: "Dimensions and reinforcement." },
      { name: "Framing / Connectors", confirm: "Ledger lag pattern, hurricane straps." },
      { name: "Final", confirm: "All connections per detail." },
    ],
    codes: ["FBC 1609 — Wind Loads", "FBC-R 502 — Floor & Roof Framing", "ASCE 7-22"],
    pitfalls: [
      "Ledger lagged into stucco only — must hit structural framing.",
      "Missing flashing at ledger causes water intrusion failures.",
      "Setback violations — pergolas count as structures in most jurisdictions.",
    ],
  },
  {
    id: "pergola-freestanding",
    title: "Pergola — Freestanding",
    trade: "Specialty", category: "Residential",
    excerpt: "Freestanding pergola in yard or pool deck. Requires independent footers and uplift design.",
    documents: [
      { name: "Site Plan", description: "Location, setbacks, easements.", status: "Required" },
      { name: "Structural Engineering", description: "Footer design, post-to-footer anchorage, wind uplift.", status: "Required" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, rebar, post anchor placement." },
      { name: "Final", confirm: "All connectors installed per detail." },
    ],
    codes: ["FBC 1609", "FBC-R 502", "ASCE 7-22"],
    pitfalls: [
      "Surface-mount post bases on existing slab without verifying slab thickness.",
      "Skipping permit because structure is 'not attached' — most jurisdictions still require it.",
      "Placement inside pool safety zone without barrier review.",
    ],
  },
  {
    id: "retaining-wall",
    title: "Retaining Wall",
    trade: "General Contractors", category: "Residential",
    excerpt: "Engineered retaining wall over 4 ft, or any wall with surcharge. Geotech may be required.",
    documents: [
      { name: "Site Plan & Survey", description: "Wall location, grading, drainage.", status: "Required" },
      { name: "Structural Engineering", description: "Signed/sealed wall design with soil assumptions.", status: "Required" },
      { name: "Geotech Report", description: "Required for walls over 6 ft or with surcharge.", status: "Conditional" },
      { name: "Drainage Plan", description: "Weep holes, drain tile, backfill spec.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Foundation", confirm: "Dimensions and rebar." },
      { name: "Wall Reinforcement", confirm: "Vertical/horizontal rebar before grout/pour." },
      { name: "Drainage / Backfill", confirm: "Weep holes clear, drain tile installed before backfill." },
      { name: "Final", confirm: "Wall complete, no settlement, drainage functioning." },
    ],
    codes: ["FBC 1807 — Foundation Walls & Retaining Walls", "ACI 318 — Concrete Design"],
    pitfalls: [
      "Backfilling before drainage inspection — wall fails and must be exposed again.",
      "Stacked dry walls over 4 ft without engineering.",
      "Ignoring surcharge from driveway or pool above wall.",
    ],
  },
  {
    id: "gas-piping-res",
    title: "Gas Piping — Residential",
    trade: "Plumbing", category: "Residential",
    excerpt: "Natural gas or LP piping for appliances, pool heaters, generators, or outdoor kitchens.",
    documents: [
      { name: "Gas Piping Plan", description: "Pipe sizing chart, BTU load per appliance, isometric layout.", status: "Required" },
      { name: "Appliance Cut Sheets", description: "Manufacturer specs for each connected appliance.", status: "Required" },
      { name: "Gas Riser / Tank Detail", description: "LP tank size, setbacks, regulator details.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough Gas / Pressure Test", confirm: "Hold 10 PSI for 15 minutes minimum, no drop." },
      { name: "Final Gas", confirm: "All appliances connected, leak check at fittings, shutoffs accessible." },
    ],
    codes: ["FBC Fuel Gas — Chapter 4 & 6", "NFPA 54 — National Fuel Gas Code", "NFPA 58 — LP-Gas Code"],
    pitfalls: [
      "Undersized piping for total BTU load — fails at rough.",
      "LP tank too close to ignition source or property line.",
      "Missing shutoff at each appliance.",
    ],
  },
  {
    id: "generator",
    title: "Generator Installation",
    trade: "Electrical", category: "Residential",
    excerpt: "Standby generator (typically 22-26 kW) with automatic transfer switch and gas supply.",
    documents: [
      { name: "Electrical Riser & Load Calc", description: "Existing service, generator output, transfer switch detail.", status: "Required" },
      { name: "Site Plan", description: "Generator location, setbacks from openings, gas line route.", status: "Required" },
      { name: "Gas Piping Permit (separate)", description: "Must be pulled in parallel for fuel supply.", status: "Required" },
      { name: "Manufacturer Installation Manual", description: "Reviewer references for clearances.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pad / Anchorage", confirm: "Concrete pad and anchor bolts per manufacturer." },
      { name: "Rough Electrical", confirm: "Transfer switch wiring, grounding, conduit." },
      { name: "Final Combined", confirm: "Operational test under load, gas leak check, code clearances." },
    ],
    codes: ["NEC 702 — Optional Standby Systems", "NEC 250 — Grounding & Bonding", "FBC Fuel Gas", "NFPA 37 — Stationary Combustion Engines"],
    pitfalls: [
      "Generator within 5 ft of an openable window — code violation.",
      "Transfer switch on the load side of the meter instead of line side — re-work.",
      "Pulling electrical but not gas permit.",
    ],
  },
  {
    id: "new-sfh",
    title: "New SFH Construction",
    trade: "General Contractors", category: "Residential",
    excerpt: "Ground-up single family home. Master permit with sub-permits for each trade.",
    documents: [
      { name: "Signed/Sealed Architectural Set", description: "Full plans including site, floor, elevations, sections, details.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, lateral, uplift connectors.", status: "Required" },
      { name: "Energy Calc (Form R-405)", description: "Florida energy compliance.", status: "Required" },
      { name: "Truss Package", description: "Signed/sealed truss layout and individual sheets.", status: "Required" },
      { name: "MEP Plans", description: "Mechanical, electrical, plumbing — sub-permits required.", status: "Required" },
      { name: "Survey & Site Plan", description: "Boundary survey, drainage, setbacks.", status: "Required" },
      { name: "NOC", description: "Recorded prior to first inspection.", status: "Required" },
      { name: "HOA / ARB Approval", description: "Required in HOA subdivisions.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer", confirm: "Trench, rebar, depth." },
      { name: "Slab", confirm: "Vapor barrier, plumbing, electrical stub-ups." },
      { name: "Tie-Down / Sheathing", confirm: "Strap pattern, nailing schedule, shear wall." },
      { name: "Rough MEP", confirm: "All sub trades pass before insulation." },
      { name: "Insulation", confirm: "R-values per energy calc." },
      { name: "Final each trade + Building", confirm: "C/O issued after all finals + impact fees paid." },
    ],
    codes: ["FBC-R 2023", "FBC Energy", "ASCE 7-22", "Florida Statute 553 — Building Code", "Florida Statute 713 — Construction Liens (NOC)"],
    pitfalls: [
      "Starting work before NOC is recorded — payment can be lost.",
      "Truss package mismatch with framing plan — full re-submittal.",
      "Missing impact fee payment delays C/O.",
    ],
  },
  {
    id: "addition-remodel",
    title: "Addition / Remodel",
    trade: "General Contractors", category: "Residential",
    excerpt: "Addition to existing residence or significant remodel affecting structure, electrical, plumbing, or HVAC.",
    documents: [
      { name: "Existing & Proposed Plans", description: "Show what is being removed, kept, and added.", status: "Required" },
      { name: "Structural Engineering", description: "Required when load paths or openings change.", status: "Conditional" },
      { name: "Energy Calc", description: "Required when conditioned area changes.", status: "Conditional" },
      { name: "Survey", description: "Required when footprint changes.", status: "Conditional" },
      { name: "NOC", description: "Over $5,000 valuation.", status: "Required" },
    ],
    inspections: [
      { name: "Demolition", confirm: "Scope contained, no structural damage." },
      { name: "Footer / Slab (if applicable)", confirm: "Tie-in to existing foundation." },
      { name: "Framing & MEP Rough", confirm: "Existing-to-new connections, sub trades aligned." },
      { name: "Insulation", confirm: "Per energy calc for new conditioned area." },
      { name: "Final each trade", confirm: "All trades and building final before occupancy of new area." },
    ],
    codes: ["FBC Existing Building", "FBC-R 2023", "FBC Energy"],
    pitfalls: [
      "Removing a load-bearing wall under a 'cosmetic remodel' permit.",
      "Adding conditioned space without updated energy calc.",
      "No NOC recorded — lien rights compromised.",
    ],
  },
  {
    id: "mdc-derm-pool",
    title: "Miami-Dade DERM — Pool",
    trade: "Pool", category: "Residential",
    excerpt: "Miami-Dade pool requires DERM environmental review in addition to building permit.",
    documents: [
      { name: "DERM Application", description: "Submitted parallel to building permit.", status: "Required" },
      { name: "Tree Survey & Disposition", description: "All trees over 4\" DBH within work zone.", status: "Required" },
      { name: "Septic / Sewer Verification", description: "DERM verifies sewer connection or septic clearance.", status: "Required" },
      { name: "Building Permit Documents", description: "Full pool packet per standard new pool.", status: "Required" },
    ],
    inspections: [
      { name: "DERM Tree Inspection", confirm: "Tree protection in place before any work." },
      { name: "Standard Pool Inspections", confirm: "Per FBC-R 4501.17 cycle." },
      { name: "DERM Final", confirm: "Site restored, mitigation trees planted if required." },
    ],
    codes: ["Miami-Dade Code Ch. 24 — Environmental Protection", "FBC-R 4501.17", "NEC 680"],
    pitfalls: [
      "Removing protected trees before DERM approval — heavy fines.",
      "Filing building permit without companion DERM application — both delay.",
      "Septic too close to new pool footprint — site redesign required.",
    ],
  },
  {
    id: "mdc-derm-addition",
    title: "Miami-Dade DERM — Addition",
    trade: "General Contractors", category: "Residential",
    excerpt: "Miami-Dade addition requires DERM review for impervious area, trees, and septic if applicable.",
    documents: [
      { name: "DERM Application", description: "Tree, water, impervious surface review.", status: "Required" },
      { name: "Tree Survey", description: "All protected trees in work zone.", status: "Required" },
      { name: "Impervious Surface Calc", description: "Existing vs proposed coverage.", status: "Required" },
      { name: "Septic Permit Update", description: "Required when bedrooms added or footprint expands over drainfield.", status: "Conditional" },
      { name: "Standard Addition Plans", description: "Per addition/remodel packet.", status: "Required" },
    ],
    inspections: [
      { name: "DERM Tree Inspection", confirm: "Tree barricade installed." },
      { name: "Standard Building Inspections", confirm: "Per addition cycle." },
      { name: "DERM Final", confirm: "Mitigation complete, drainage verified." },
    ],
    codes: ["Miami-Dade Code Ch. 24", "FBC Existing Building", "FBC-R 2023"],
    pitfalls: [
      "Increasing bedroom count without HRS septic update — fails DERM final.",
      "Exceeding impervious cap without retention — requires drywell.",
      "Skipping tree inspection — stop work order.",
    ],
  },
  {
    id: "mdc-derm-remodel",
    title: "Miami-Dade DERM — Remodel",
    trade: "General Contractors", category: "Residential",
    excerpt: "Miami-Dade remodel triggers DERM when site work, drainage, or septic is affected.",
    documents: [
      { name: "DERM Application", description: "Determines whether environmental review applies.", status: "Required" },
      { name: "Scope Letter", description: "Defines whether site or septic is affected.", status: "Required" },
      { name: "Standard Remodel Plans", description: "Existing & proposed.", status: "Required" },
      { name: "Tree Survey", description: "Required when exterior work occurs.", status: "Conditional" },
    ],
    inspections: [
      { name: "DERM Pre-Construction", confirm: "Site protection in place if exterior work." },
      { name: "Standard Remodel Inspections", confirm: "Per remodel cycle." },
      { name: "DERM Final (if triggered)", confirm: "Site restored, no encroachments." },
    ],
    codes: ["Miami-Dade Code Ch. 24", "FBC Existing Building"],
    pitfalls: [
      "Assuming interior-only remodel doesn't need DERM — still required as no-impact determination.",
      "Touching septic distribution without septic permit.",
      "Driveway expansion without impervious review.",
    ],
  },
  {
    id: "psl-public-works",
    title: "Port St Lucie Public Works",
    trade: "General Contractors", category: "Specialty",
    excerpt: "PSL Public Works permit for any work within ROW, driveway aprons, sidewalks, or drainage tie-ins.",
    documents: [
      { name: "Public Works Application", description: "PSL-specific form, separate from building permit.", status: "Required" },
      { name: "Site Plan with ROW Detail", description: "Show ROW lines, work limits, driveway apron, MOT.", status: "Required" },
      { name: "MOT Plan (Maintenance of Traffic)", description: "Required when work affects travel lanes or sidewalk.", status: "Conditional" },
      { name: "Liability Insurance Cert", description: "Naming City of Port St Lucie as additional insured.", status: "Required" },
      { name: "Bond / Surety", description: "Restoration bond for ROW work.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pre-Construction", confirm: "MOT in place, work limits flagged." },
      { name: "Sub-Base / Compaction", confirm: "Driveway or sidewalk sub-base compacted per spec." },
      { name: "Final Restoration", confirm: "ROW restored, sod re-established, no damage to City infrastructure." },
    ],
    codes: ["City of Port St Lucie Code Ch. 154 — Streets & Sidewalks", "FDOT Index 304/522 — Driveway & Sidewalk Standards", "MUTCD — Manual on Uniform Traffic Control Devices"],
    pitfalls: [
      "Pouring driveway apron without PW permit — must demo and re-permit.",
      "No MOT when blocking sidewalk — stop work + fine.",
      "Tying drainage into City system without approval — bond pulled.",
    ],
  },
  {
    id: "electrical-panel",
    title: "Electrical Panel Upgrade",
    trade: "Electrical", category: "Residential",
    excerpt: "Service upgrade — typically 150A → 200A or 400A — for added load (pool, generator, EV, addition).",
    documents: [
      { name: "Load Calculation", description: "NEC 220 calc showing existing & proposed loads.", status: "Required" },
      { name: "Electrical Riser Diagram", description: "Service entrance, meter, main, grounding electrode system.", status: "Required" },
      { name: "Utility Coordination Letter", description: "FPL coordination for service change.", status: "Required" },
      { name: "Site Plan (if meter relocated)", description: "Required when meter moves.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough / Grounding", confirm: "GEC sizing, ground rod count and spacing, intersystem bond." },
      { name: "Utility Release", confirm: "Inspector releases to FPL for new service connection." },
      { name: "Final", confirm: "Panel labeled, breakers torqued, AFCI/GFCI per code." },
    ],
    codes: ["NEC 220 — Load Calculations", "NEC 230 — Services", "NEC 250 — Grounding", "FBC Existing Building"],
    pitfalls: [
      "Skipping load calc — almost always rejected at intake.",
      "Ground rods spaced less than 6 ft apart.",
      "Tandem breakers in non-CTL panels.",
    ],
  },
  {
    id: "hvac-replace",
    title: "HVAC Replacement",
    trade: "HVAC", category: "Residential",
    excerpt: "Replacement of air handler, condenser, or full system. Like-for-like or upgraded.",
    documents: [
      { name: "Manual J / Equipment Selection", description: "Cooling/heating load justification.", status: "Required" },
      { name: "Equipment Cut Sheets", description: "AHRI match certificate, SEER2, refrigerant type.", status: "Required" },
      { name: "Florida Energy Form (R-405)", description: "Required for SEER/efficiency compliance.", status: "Required" },
      { name: "Duct Modification Plan", description: "If duct changes are scoped.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough (if duct work)", confirm: "Duct seal, support, R-value." },
      { name: "Final", confirm: "AHRI match, refrigerant pressures, condensate drain with safety pan/switch." },
    ],
    codes: ["FBC Mechanical", "FBC Energy", "ACCA Manual J / S / D"],
    pitfalls: [
      "No AHRI match certificate — final rejected.",
      "Air handler in attic without secondary drain pan + float switch.",
      "Refrigerant line reuse without flush — voids warranty and may fail final.",
    ],
  },
  {
    id: "roof-replace-res",
    title: "Roof Replacement — Residential",
    trade: "Roofing", category: "Residential",
    excerpt: "Tear-off and replacement of residential roof. FBC 2023 secondary water barrier required.",
    documents: [
      { name: "Product Approval (NOA/FL)", description: "Underlayment, primary roof covering, fasteners, drip edge.", status: "Required" },
      { name: "Scope & System Detail", description: "Tear-off, decking repair allowance, SWB, underlayment, primary covering.", status: "Required" },
      { name: "Uniform Mitigation Form", description: "Issued at final for insurance discount.", status: "Required" },
      { name: "Engineering (if structural)", description: "Required if rafters/trusses reinforced or replaced.", status: "Conditional" },
    ],
    inspections: [
      { name: "Tin Tag / Dry-In", confirm: "Underlayment installed per NOA, fasteners and pattern correct, SWB in place." },
      { name: "In-Progress (tile/metal)", confirm: "Fastener pattern, hip/ridge attachment." },
      { name: "Final", confirm: "All flashings, drip edge, ventilation, no exposed fasteners outside spec." },
    ],
    codes: ["FBC-R 905 — Roof Coverings", "FBC-R R4402 — Secondary Water Barrier (HVHZ & High-Wind)", "FL Statute 553.844 — Roof Mitigation"],
    pitfalls: [
      "Installing without SWB in jurisdictions that require it — fails dry-in.",
      "Mixing underlayment and primary covering brands not listed together on NOA.",
      "Missing drip edge at eaves — automatic re-inspection.",
    ],
  },
  {
    id: "fountain-res",
    title: "Fountain Installation — Residential",
    trade: "Specialty", category: "Residential",
    excerpt: "Decorative water feature or fountain. Triggers plumbing, electrical, and (if circulating) anti-entrapment review.",
    documents: [
      { name: "Site Plan", description: "Location, setbacks, water supply, drain.", status: "Required" },
      { name: "Plumbing & Electrical Detail", description: "Pump, GFCI, bonding, fill/drain plumbing.", status: "Required" },
      { name: "Structural Detail (if monumental)", description: "Footer/anchorage for large or freestanding features.", status: "Conditional" },
      { name: "Anti-Entrapment Detail", description: "Required when basin >18\" deep or recirculating pump >250 GPM.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough Plumbing & Electrical", confirm: "Bonding of metal parts, GFCI, supply/drain pressure test." },
      { name: "Final", confirm: "Operational, anti-entrapment cover if applicable, no exposed wiring." },
    ],
    codes: ["NEC 680 Part V — Fountains", "FBC Plumbing", "VGB Act — when basin meets pool definition"],
    pitfalls: [
      "Treating fountain as cosmetic — bonding always required for any metal in the feature.",
      "Pump on non-GFCI circuit.",
      "Drain too deep without VGB-compliant cover.",
    ],
  },
];

export const TRADES: Trade[] = ["Pool", "Plumbing", "Electrical", "General Contractors", "HVAC", "Roofing", "Specialty"];
export const CATEGORIES: Category[] = ["Residential", "Commercial", "Specialty"];
