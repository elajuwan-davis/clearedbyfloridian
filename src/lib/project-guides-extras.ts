import type { Guide } from "./project-guides-data";

// 79 additional guides — appended to the original 20 for a 99-guide library.
export const GUIDES_EXTRA: Guide[] = [
  // ============================================================
  // POOL / SPA / WATER (9)
  // ============================================================
  {
    id: "new-pool-com",
    title: "New Pool Construction — Commercial",
    trade: "Pool", category: "Commercial",
    excerpt: "Commercial (HOA, hotel, condo, club) pool requiring DOH public pool permit in parallel with building permit.",
    documents: [
      { name: "DOH Public Pool Construction Permit", description: "Florida DOH plan review approval per FAC 64E-9 — must be issued before building permit final.", status: "Required" },
      { name: "Signed/Sealed Architectural & Structural Set", description: "Pool shell, deck, equipment building, chemical room, bather load calc.", status: "Required" },
      { name: "Mechanical Plan", description: "Recirculation turnover, filtration sizing, chemical feed, automated controller.", status: "Required" },
      { name: "Electrical Plan & Bonding", description: "Equipotential grid, GFCI, panel schedule, lighting.", status: "Required" },
      { name: "Barrier / Lifeguard / Signage Plan", description: "Required posting and barrier per FAC 64E-9.", status: "Required" },
      { name: "NOC", description: "Recorded prior to first inspection.", status: "Required" },
    ],
    inspections: [
      { name: "Steel / Pre-Gunite", confirm: "Rebar, bonding grid, depth." },
      { name: "Deck Steel & Bonding", confirm: "Continuous bonding of all reinforcement." },
      { name: "Rough Plumbing Pressure Test", confirm: "25 PSI held for 15 minutes, anti-entrapment plumbed correctly." },
      { name: "Rough Electrical", confirm: "GFCI, bonding, panel labeled." },
      { name: "DOH Pre-Opening Inspection", confirm: "Bather load, signage, chemical controller, lifeguard equipment." },
      { name: "Final Building", confirm: "All trades complete, DOH operating permit issued." },
    ],
    codes: ["FAC 64E-9 — Public Swimming Pools", "FL Statute 514 — Public Swimming and Bathing Facilities", "FBC Building Ch. 3109", "NEC Article 680", "ADA 2010 Standards Sections 242/1009 — Pool Accessibility"],
    pitfalls: [
      "Filing building permit without DOH plan approval — building reviewer holds in queue.",
      "Missing ADA pool lift specification — final fails.",
      "Bather load not matching deck/equipment sizing.",
      "Chemical room not separated/ventilated per FAC.",
    ],
  },
  {
    id: "pool-renovation",
    title: "Pool Renovation / Remodel",
    trade: "Pool", category: "Residential",
    excerpt: "Pool remodel changing shape, depth, plumbing, or equipment — broader scope than resurface.",
    documents: [
      { name: "Sealed Scope & Demo Plan", description: "Detailed scope of what is demoed vs retained.", status: "Required" },
      { name: "Structural Engineering", description: "Required when shell, depth, or coping is structurally altered.", status: "Conditional" },
      { name: "Plumbing & Electrical Plans", description: "New equipment, suction/return, bonding grid touch-up.", status: "Required" },
      { name: "Existing Permit History", description: "Originals on file with the building department.", status: "Conditional" },
      { name: "Barrier Compliance Statement", description: "Confirms safety barrier remains compliant during/after work.", status: "Required" },
    ],
    inspections: [
      { name: "Demo / Pre-Construction", confirm: "Scope contained, no unpermitted damage." },
      { name: "Steel (if shell touched)", confirm: "New rebar tied into existing per engineer." },
      { name: "Rough Plumbing & Electrical", confirm: "Pressure test, bonding continuity." },
      { name: "Final", confirm: "VGB covers, equipment operational, barrier intact." },
    ],
    codes: ["FBC-R 4501.17", "FBC Existing Building", "NEC 680", "VGB Pool & Spa Safety Act"],
    pitfalls: [
      "Treating as resurface when scope adds depth or new plumbing.",
      "Failing to re-bond new equipment to existing grid.",
      "Disabling barrier during construction without temporary alternative.",
    ],
  },
  {
    id: "spa-new-retrofit",
    title: "Spa / Hot Tub — New or Retrofit",
    trade: "Pool", category: "Residential",
    excerpt: "New standalone spa or retrofit spa attached to existing pool. Includes plumbing, gas (if heated), and electrical.",
    documents: [
      { name: "Site Plan & Setbacks", description: "Spa location, equipment pad, gas/electric route.", status: "Required" },
      { name: "Manufacturer Cut Sheet", description: "For self-contained spas — confirms listed for installation.", status: "Required" },
      { name: "Electrical Riser & Load Calc", description: "240V dedicated circuit, GFCI, bonding.", status: "Required" },
      { name: "Gas Piping Plan", description: "Required if gas-heated.", status: "Conditional" },
      { name: "Barrier Plan", description: "Spa cover with lockable lid satisfies barrier if listed.", status: "Required" },
    ],
    inspections: [
      { name: "Pad / Setting", confirm: "Pad level, capacity for spa weight when full." },
      { name: "Rough Electrical & Bonding", confirm: "Equipotential bond to spa shell, GFCI breaker." },
      { name: "Rough Gas (if applicable)", confirm: "Pressure test." },
      { name: "Final", confirm: "Cover ASTM-compliant, anti-entrapment, drain cover labeled." },
    ],
    codes: ["FBC-R 4501.17.1.14", "NEC 680 Part IV", "FBC Fuel Gas", "ASTM F1346 — Safety Covers"],
    pitfalls: [
      "Wireless disconnect within sight of spa not provided.",
      "Using extension cord for self-contained spa — listing requires hard-wired or factory cord-and-plug per UL spec.",
      "No bonding around perimeter when spa is in ground or attached to pool.",
    ],
  },
  {
    id: "pool-heater",
    title: "Pool Heater Installation",
    trade: "Plumbing", category: "Residential",
    excerpt: "Gas, electric, or heat pump pool heater installation. Triggers mechanical and possibly gas permits.",
    documents: [
      { name: "Manufacturer Specs / Cut Sheet", description: "BTU input, clearances, venting requirements.", status: "Required" },
      { name: "Gas Piping Plan", description: "When gas-fired — pipe sizing for added BTU load.", status: "Conditional" },
      { name: "Electrical Detail", description: "Dedicated circuit when electric or heat pump.", status: "Conditional" },
      { name: "Site Plan", description: "Setbacks from openings, structures, and combustible materials.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Gas / Pressure Test", confirm: "15-minute hold at 10 PSI." },
      { name: "Rough Electrical", confirm: "Bonding, GFCI on heat pump, conductor sizing." },
      { name: "Final", confirm: "Venting clearances, condensate routing, operational check." },
    ],
    codes: ["FBC Fuel Gas Ch. 6", "NFPA 54", "NEC 680.9", "ANSI Z21.56 — Pool Heaters"],
    pitfalls: [
      "Existing gas line undersized for added heater load.",
      "Heater placed under overhang violating vent clearance.",
      "No bonding lug used on metallic heater.",
    ],
  },
  {
    id: "pool-pump-replace",
    title: "Pool Pump / Equipment Replacement",
    trade: "Pool", category: "Residential",
    excerpt: "Replacement of pump, filter, controller. Variable-speed pump now required by FL Energy Code.",
    documents: [
      { name: "Equipment Cut Sheets", description: "AHRI/Energy Star for VSP, GPM, HP.", status: "Required" },
      { name: "Energy Compliance Statement", description: "Variable-speed pump required for pools >0.71 THP per FBC Energy.", status: "Required" },
      { name: "Scope Letter", description: "What's being replaced; like-for-like or upgrade.", status: "Required" },
    ],
    inspections: [
      { name: "Final", confirm: "VSP installed, bonding intact, equipment labeled, programmed run schedule." },
    ],
    codes: ["FBC Energy R403.10 — Pool & Spa Energy", "NEC 680.6 — Bonding", "FL Statute 553.909"],
    pitfalls: [
      "Installing single-speed pump in violation of FBC Energy — final rejected.",
      "Skipping bonding lug — old grid may not connect cleanly.",
      "No timer/automation on circulation — fails energy.",
    ],
  },
  {
    id: "pool-light-replace",
    title: "Pool Light Replacement",
    trade: "Electrical", category: "Residential",
    excerpt: "Replacement of submerged pool light. Low-voltage LED encouraged; 120V replacement requires GFCI verification.",
    documents: [
      { name: "Fixture Cut Sheet", description: "UL listed for pool use, voltage, lumen output.", status: "Required" },
      { name: "Scope Letter", description: "Like-for-like or voltage change.", status: "Required" },
      { name: "Bonding Verification", description: "Niche bonding lug condition documented.", status: "Conditional" },
    ],
    inspections: [
      { name: "Final", confirm: "GFCI tested, bonding continuity, fixture seated, listing label visible." },
    ],
    codes: ["NEC 680.23", "NEC 680.26 — Equipotential Bonding"],
    pitfalls: [
      "Replacing 120V with low-voltage but not removing now-energized junction box.",
      "Missing GFCI protection at panel.",
      "Failing to test bonding lug to verify the niche is still part of the grid.",
    ],
  },
  {
    id: "above-ground-pool",
    title: "Above Ground Pool",
    trade: "Pool", category: "Residential",
    excerpt: "Above-ground pool with depth >24\". Requires building permit, electrical, and barrier compliance.",
    documents: [
      { name: "Manufacturer Specs", description: "Engineering for the prefabricated pool.", status: "Required" },
      { name: "Site Plan & Setbacks", description: "Distance to overhead conductors, property lines.", status: "Required" },
      { name: "Electrical Plan & Bonding", description: "Equipotential bond around perimeter; GFCI.", status: "Required" },
      { name: "Barrier / Removable Ladder Detail", description: "Self-closing/latching access or removable ladder.", status: "Required" },
    ],
    inspections: [
      { name: "Bonding", confirm: "Equipotential ring around pool, bonded to equipment." },
      { name: "Final Electrical", confirm: "GFCI tested." },
      { name: "Final Barrier", confirm: "Listed safety pool cover, ladder, or removable steps." },
    ],
    codes: ["FBC-R 4501.17", "NEC 680.26", "NEC 680.8 — Overhead Conductor Clearances"],
    pitfalls: [
      "Placement under power lines violating NEC 680.8 clearances.",
      "Skipping perimeter bonding — universal rejection.",
      "Treating ladder as adequate barrier without manufacturer listing for that use.",
    ],
  },
  {
    id: "waterfall-feature",
    title: "Waterfall / Water Feature",
    trade: "Specialty", category: "Residential",
    excerpt: "Structural waterfall or rock feature integrated with pool. Often requires engineering for weight and reinforcement.",
    documents: [
      { name: "Structural Engineering", description: "Footer/foundation for feature weight, anchorage to pool shell if attached.", status: "Required" },
      { name: "Plumbing Detail", description: "Dedicated pump, GPM, return integration.", status: "Required" },
      { name: "Electrical Bonding", description: "All metallic components bonded to grid.", status: "Required" },
      { name: "Anti-Entrapment Detail", description: "When suction is added to recirculation.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer / Anchor", confirm: "Reinforcement and anchor to shell." },
      { name: "Rough Plumbing & Electrical", confirm: "Bonding, suction safety." },
      { name: "Final", confirm: "Operational, no leaks, anti-entrapment compliant." },
    ],
    codes: ["FBC 1604 — Structural Loads", "NEC 680", "VGB Act"],
    pitfalls: [
      "Anchoring rockwork to coping without engineered detail — cracks shell.",
      "Adding suction line without anti-entrapment cover.",
      "Forgetting to bond stainless steel pins inside the rockwork.",
    ],
  },
  {
    id: "fountain-com",
    title: "Fountain Installation — Commercial",
    trade: "Specialty", category: "Commercial",
    excerpt: "Decorative commercial fountain. May trigger DOH review when basin meets pool definition (>24\" depth) or recirculates over 250 GPM.",
    documents: [
      { name: "Site Plan & Engineering", description: "Footings, basin structure.", status: "Required" },
      { name: "Plumbing & Electrical Plans", description: "Make-up water, drain, GFCI, bonding.", status: "Required" },
      { name: "DOH Determination Letter", description: "Required when feature may meet public pool definition.", status: "Conditional" },
      { name: "Anti-Entrapment Spec", description: "VGB-compliant covers on any suction.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Basin", confirm: "Structural per engineer." },
      { name: "Rough Plumbing & Electrical", confirm: "Bonding of metallic elements, GFCI, pressure test." },
      { name: "Final", confirm: "Operational, drain covers VGB-compliant, signage if required." },
    ],
    codes: ["FBC Plumbing", "NEC 680 Part V", "FAC 64E-9 (if classified as pool)", "VGB Act"],
    pitfalls: [
      "Skipping DOH determination — DOH later classifies it as a public pool.",
      "Inadequate make-up water with no backflow preventer.",
      "Bonding overlooked on submerged stainless mounts.",
    ],
  },

  // ============================================================
  // SCREEN / ALUMINUM (7 — Pool Cage Replacement already exists)
  // ============================================================
  {
    id: "screen-room-new",
    title: "Screen Room — New",
    trade: "Specialty", category: "Residential",
    excerpt: "New screened porch or sunroom with screen walls and roof system.",
    documents: [
      { name: "Site Plan with Setbacks", description: "Footprint, tie-in to house.", status: "Required" },
      { name: "Wind Load Engineering", description: "ASCE 7-22 per PBC/TC wind speed.", status: "Required" },
      { name: "Product Approval (FL/NOA)", description: "Roof panels, frame, fasteners.", status: "Required" },
      { name: "Attachment Detail", description: "Ledger / hostbeam to existing structure.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Slab", confirm: "Depth, rebar." },
      { name: "Tie-Down", confirm: "Anchor pattern per engineering." },
      { name: "Final", confirm: "All panels installed, door self-closes (if pool side)." },
    ],
    codes: ["FBC 1609", "ASCE 7-22", "FBC-R 4501.17 (when over pool)"],
    pitfalls: [
      "Stock engineering not matching site wind speed.",
      "Roof panel uplift fasteners under-driven.",
      "Forgetting that screen door over a pool deck still needs self-closing/latching.",
    ],
  },
  {
    id: "alum-patio-new",
    title: "Aluminum Patio Cover — New",
    trade: "Specialty", category: "Residential",
    excerpt: "Insulated or non-insulated aluminum patio roof attached to existing house.",
    documents: [
      { name: "Site Plan & Setbacks", description: "Footprint, height, ledger location.", status: "Required" },
      { name: "Wind Load Engineering", description: "Sealed for project address.", status: "Required" },
      { name: "Product Approval", description: "Panel system FL/NOA approval.", status: "Required" },
      { name: "Ledger Attachment Detail", description: "Hits structural framing, flashing detail.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Posts", confirm: "Footer depth, post base anchorage." },
      { name: "Tie-Down / Ledger", confirm: "Lag pattern into framing, flashing." },
      { name: "Final", confirm: "Panels installed, fasteners per spec." },
    ],
    codes: ["FBC 1609", "ASCE 7-22", "FBC-R 502"],
    pitfalls: [
      "Lagged into stucco only — fails framing inspection.",
      "Missing flashing causes leaks at house wall.",
      "Post base on existing slab without verifying slab thickness/reinforcement.",
    ],
  },
  {
    id: "alum-patio-replace",
    title: "Aluminum Patio Cover — Replacement",
    trade: "Specialty", category: "Residential",
    excerpt: "Replacement of storm-damaged or aged aluminum patio cover. Treated as new construction.",
    documents: [
      { name: "Photo Documentation", description: "Existing cover condition.", status: "Required" },
      { name: "Wind Load Engineering (Current Code)", description: "Old engineering does not carry forward.", status: "Required" },
      { name: "Current Product Approvals", description: "Active FL approvals.", status: "Required" },
    ],
    inspections: [
      { name: "Tie-Down", confirm: "Verified anchors meet current code." },
      { name: "Final", confirm: "All connections per current engineering." },
    ],
    codes: ["FBC 1609", "ASCE 7-22", "FBC Existing Building 706"],
    pitfalls: [
      "Re-using existing posts/footers without engineer sign-off on capacity.",
      "Filing as repair to avoid engineering.",
      "Pulling permit but not updating ledger flashing where leaks were occurring.",
    ],
  },
  {
    id: "pergola-attached-wood",
    title: "Pergola — Attached (Wood)",
    trade: "General Contractors", category: "Residential",
    excerpt: "Wood pergola attached to existing residence. Engineering required for ledger and uplift.",
    documents: [
      { name: "Site Plan", description: "Setbacks, footprint.", status: "Required" },
      { name: "Structural Engineering", description: "Wood species, connector schedule, ledger detail.", status: "Required" },
      { name: "Material Spec", description: "Pressure-treated rating, fastener type (HDG or SS).", status: "Required" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, rebar, post anchor placement." },
      { name: "Framing / Connectors", confirm: "Hurricane straps, ledger lag pattern." },
      { name: "Final", confirm: "All connectors per detail." },
    ],
    codes: ["FBC-R 502", "FBC 1609", "AWC NDS — National Design Spec for Wood"],
    pitfalls: [
      "Wrong fastener type — black coated fasteners corrode in PT wood.",
      "Ledger lagged into stucco-only.",
      "No flashing at ledger.",
    ],
  },
  {
    id: "pergola-freestanding-wood",
    title: "Pergola — Freestanding (Wood)",
    trade: "General Contractors", category: "Residential",
    excerpt: "Freestanding wood pergola. Independent footers and uplift design.",
    documents: [
      { name: "Site Plan", description: "Location, setbacks.", status: "Required" },
      { name: "Structural Engineering", description: "Footer, post anchor, beam-to-post connectors.", status: "Required" },
      { name: "Material Spec", description: "PT rating, fasteners.", status: "Required" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, rebar, anchor bolt placement." },
      { name: "Framing", confirm: "Connectors installed." },
      { name: "Final", confirm: "All hardware per detail." },
    ],
    codes: ["FBC-R 502", "FBC 1609", "AWC NDS"],
    pitfalls: [
      "Surface-mount post bases on existing slab without verifying slab spec.",
      "Generic Simpson connectors not matching engineer's schedule.",
      "Pergola placed inside pool safety zone.",
    ],
  },
  {
    id: "awning",
    title: "Awning Installation",
    trade: "Specialty", category: "Residential",
    excerpt: "Fixed or retractable awning attached to residence.",
    documents: [
      { name: "Manufacturer Specs", description: "Wind rating, attachment hardware.", status: "Required" },
      { name: "Attachment Detail", description: "Hits structural framing, fastener schedule.", status: "Required" },
      { name: "Wind Load Statement", description: "Manufacturer or engineer confirms rated for site wind speed.", status: "Required" },
    ],
    inspections: [
      { name: "Final", confirm: "All anchors per detail, retractable arm operational, no fascia-only attachment." },
    ],
    codes: ["FBC 1609", "FBC-R 502"],
    pitfalls: [
      "Anchoring to gutter or fascia only.",
      "Fixed awnings exceeding manufacturer wind rating for jurisdiction.",
      "Retractable arms not anchored to wall studs.",
    ],
  },
  {
    id: "carport-alum-new",
    title: "Carport — Aluminum (New)",
    trade: "Specialty", category: "Residential",
    excerpt: "New aluminum carport — freestanding or attached.",
    documents: [
      { name: "Site Plan & Setbacks", description: "Many jurisdictions restrict front-yard carports.", status: "Required" },
      { name: "Wind Load Engineering", description: "Site wind speed.", status: "Required" },
      { name: "Product Approval", description: "FL/NOA for panel and frame.", status: "Required" },
      { name: "HOA Approval", description: "Often required.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth and post anchorage." },
      { name: "Tie-Down", confirm: "Roof anchors per engineering." },
      { name: "Final", confirm: "All connections complete." },
    ],
    codes: ["FBC 1609", "ASCE 7-22", "Local zoning code"],
    pitfalls: [
      "Front-yard placement violating local zoning.",
      "Stock engineering vs sealed project-specific.",
      "Tying into existing structure not designed for added uplift.",
    ],
  },

  // ============================================================
  // GAS / PLUMBING (7)
  // ============================================================
  {
    id: "gas-interior-res",
    title: "Gas Piping — Interior Residential",
    trade: "Plumbing", category: "Residential",
    excerpt: "Interior gas piping for range, dryer, water heater, fireplace.",
    documents: [
      { name: "Gas Piping Plan", description: "Isometric, pipe sizing, BTU load per appliance.", status: "Required" },
      { name: "Appliance Cut Sheets", description: "BTU input per device.", status: "Required" },
      { name: "Riser to Meter / Tank", description: "Demonstrates capacity at source.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Gas Pressure Test", confirm: "10 PSI hold for 15 minutes." },
      { name: "Final Gas", confirm: "All appliances connected, shutoffs accessible, leak check." },
    ],
    codes: ["FBC Fuel Gas Ch. 4 & 6", "NFPA 54"],
    pitfalls: [
      "Undersized pipe for total BTU load.",
      "Hidden joints behind drywall — must be accessible.",
      "Missing shutoff at each appliance.",
    ],
  },
  {
    id: "gas-line-extension",
    title: "Gas Line Extension",
    trade: "Plumbing", category: "Residential",
    excerpt: "Extension of existing gas system for added appliance (pool heater, generator, outdoor kitchen).",
    documents: [
      { name: "Existing & Proposed BTU Load Calc", description: "Verifies meter/tank capacity and pipe sizing.", status: "Required" },
      { name: "Routing Plan", description: "Trench depth, sleeve, building penetrations.", status: "Required" },
      { name: "Appliance Cut Sheets", description: "BTU per new appliance.", status: "Required" },
    ],
    inspections: [
      { name: "Trench (before backfill)", confirm: "Depth, sleeve, tracer wire." },
      { name: "Pressure Test", confirm: "10 PSI hold 15 minutes." },
      { name: "Final", confirm: "Connections complete, shutoffs accessible." },
    ],
    codes: ["FBC Fuel Gas", "NFPA 54", "NFPA 58 (if LP)"],
    pitfalls: [
      "Backfilling trench before inspection.",
      "No tracer wire on plastic gas line.",
      "Tee'd off existing line without verifying full-system capacity.",
    ],
  },
  {
    id: "outdoor-kitchen-gas",
    title: "Outdoor Kitchen — Gas Connections",
    trade: "Plumbing", category: "Residential",
    excerpt: "Gas hookups for grill, side burner, pizza oven within an outdoor kitchen.",
    documents: [
      { name: "Gas Plan", description: "Pipe sizing for all appliances combined.", status: "Required" },
      { name: "Appliance Specs", description: "BTU per device, listing for outdoor use.", status: "Required" },
      { name: "Connection Detail", description: "Quick disconnect, drip leg, shutoff.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Pressure Test", confirm: "10 PSI hold." },
      { name: "Final Gas", confirm: "Shutoffs, leak check at each fitting." },
    ],
    codes: ["FBC Fuel Gas Ch. 6", "NFPA 54"],
    pitfalls: [
      "Indoor-rated appliance installed outdoors.",
      "Hidden shutoff inside masonry.",
      "Undersized line feeding multi-burner kitchen.",
    ],
  },
  {
    id: "gas-fireplace",
    title: "Gas Fireplace / Fire Feature",
    trade: "Plumbing", category: "Residential",
    excerpt: "Indoor or outdoor gas fireplace, fire pit, or fire feature.",
    documents: [
      { name: "Manufacturer Specs", description: "Clearances, venting, BTU.", status: "Required" },
      { name: "Gas Plan", description: "Pipe sizing, shutoff location.", status: "Required" },
      { name: "Venting Detail (indoor)", description: "Direct vent termination clearances.", status: "Conditional" },
      { name: "Electrical Detail", description: "If electronic ignition.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough Gas", confirm: "Pressure test, shutoff accessible." },
      { name: "Venting (indoor)", confirm: "Termination clearance from openings." },
      { name: "Final", confirm: "Operational, ignition, glass safety screen." },
    ],
    codes: ["FBC Fuel Gas", "FBC Mechanical 805 (Venting)", "NFPA 54"],
    pitfalls: [
      "Vent termination below required clearance from windows.",
      "No safety screen on indoor unit — code now requires it.",
      "Outdoor unit not listed for outdoor use.",
    ],
  },
  {
    id: "lp-tank",
    title: "LP / Propane Tank Installation",
    trade: "Plumbing", category: "Residential",
    excerpt: "Above-ground or buried LP tank with regulator and yard lines.",
    documents: [
      { name: "Site Plan", description: "Tank setbacks from buildings, ignition sources, property lines, openings.", status: "Required" },
      { name: "Tank Spec & Listing", description: "ASME or DOT spec, capacity.", status: "Required" },
      { name: "Yard Line / Regulator Detail", description: "Two-stage regulator schematic.", status: "Required" },
      { name: "Anchor Detail (buried tanks)", description: "Hold-down strap, anti-buoyancy.", status: "Conditional" },
    ],
    inspections: [
      { name: "Tank Set & Trench", confirm: "Setbacks, sleeve through walls, tracer wire." },
      { name: "Pressure Test", confirm: "10 PSI hold 15 minutes." },
      { name: "Final", confirm: "Regulator set, label, fire extinguisher per AHJ." },
    ],
    codes: ["NFPA 58 — LP-Gas Code", "FBC Fuel Gas Ch. 4"],
    pitfalls: [
      "Tank too close to AC condenser ignition source.",
      "No anti-buoyancy hold-down on buried tank.",
      "Tank between house and lot line without 10 ft clear.",
    ],
  },
  {
    id: "backflow",
    title: "Backflow Preventer Installation",
    trade: "Plumbing", category: "Residential",
    excerpt: "Reduced pressure zone (RPZ) or double-check backflow preventer for irrigation, pool fill, fire line.",
    documents: [
      { name: "Site Plan", description: "Location, distance to hazard.", status: "Required" },
      { name: "Device Spec", description: "ASSE-listed model.", status: "Required" },
      { name: "Initial Test Report", description: "Performed by certified tester at install.", status: "Required" },
    ],
    inspections: [
      { name: "Final", confirm: "Device installed, accessible, tag affixed with test date." },
    ],
    codes: ["FBC Plumbing 608 — Protection of Potable Water Supply", "ASSE 1013 / 1015", "AWWA M14"],
    pitfalls: [
      "RPZ buried — code requires above-ground installation with clearance.",
      "Wrong device for hazard level.",
      "No initial certified test on file.",
    ],
  },
  {
    id: "tankless-gas",
    title: "Tankless Water Heater — Gas",
    trade: "Plumbing", category: "Residential",
    excerpt: "Gas-fired tankless water heater replacement or new install.",
    documents: [
      { name: "Manufacturer Specs", description: "BTU, vent type, clearances.", status: "Required" },
      { name: "Gas Sizing Calc", description: "Tankless typically requires 3/4\" or larger feed.", status: "Required" },
      { name: "Venting Detail", description: "Category III stainless venting per manufacturer.", status: "Required" },
      { name: "Electrical Detail", description: "Dedicated outlet for ignition/controls.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Gas Pressure Test", confirm: "10 PSI hold." },
      { name: "Vent Inspection", confirm: "Termination clearances and slope." },
      { name: "Final", confirm: "Operational, T&P relief, condensate routing." },
    ],
    codes: ["FBC Fuel Gas", "FBC Plumbing 504 — Water Heaters", "NFPA 54"],
    pitfalls: [
      "Re-using 1/2\" gas line from old tank heater — undersized for tankless.",
      "Standard B-vent used instead of category III stainless.",
      "No condensate drain or relief discharge.",
    ],
  },

  // ============================================================
  // ELECTRICAL (8)
  // ============================================================
  {
    id: "panel-200a",
    title: "Electrical Panel Upgrade — 200A",
    trade: "Electrical", category: "Residential",
    excerpt: "Service upgrade to 200A. Most common upgrade for added pool, generator, EV load.",
    documents: [
      { name: "NEC 220 Load Calc", description: "Existing & proposed loads.", status: "Required" },
      { name: "Riser Diagram", description: "Service entrance, meter, main, grounding.", status: "Required" },
      { name: "Utility Letter", description: "FPL release for service change.", status: "Required" },
    ],
    inspections: [
      { name: "Rough / Grounding", confirm: "GEC, ground rods, intersystem bond." },
      { name: "Utility Release", confirm: "Inspector releases to FPL." },
      { name: "Final", confirm: "Panel labeled, AFCI/GFCI per code." },
    ],
    codes: ["NEC 220, 230, 250", "FBC Existing Building"],
    pitfalls: [
      "No load calc — automatic rejection.",
      "Ground rods less than 6 ft apart.",
      "Reusing existing SE cable when undersized.",
    ],
  },
  {
    id: "panel-400a",
    title: "Electrical Panel Upgrade — 400A",
    trade: "Electrical", category: "Residential",
    excerpt: "Service upgrade to 400A. Required for large homes with pool, full generator, EV chargers, and HVAC stacks.",
    documents: [
      { name: "NEC 220 Load Calc", description: "Detailed showing why 200A insufficient.", status: "Required" },
      { name: "Riser Diagram", description: "400A meter / 320A continuous, dual 200A panels or 400A panel.", status: "Required" },
      { name: "Utility Coordination", description: "FPL approves transformer capacity.", status: "Required" },
      { name: "Trench Detail (URD)", description: "Depth and conduit for underground service.", status: "Conditional" },
    ],
    inspections: [
      { name: "Trench", confirm: "Depth, conduit, warning tape." },
      { name: "Rough / Grounding", confirm: "Dual GEC connections, ground rods." },
      { name: "Utility Release", confirm: "FPL release." },
      { name: "Final", confirm: "Panels labeled, all breakers torqued, surge protection." },
    ],
    codes: ["NEC 220, 230, 240, 250", "FPL Service Requirements"],
    pitfalls: [
      "FPL transformer at street can't support 400A — months of delay.",
      "Undersized parallel feeders.",
      "Missing surge protection — increasingly required at AHJ level.",
    ],
  },
  {
    id: "ev-charger",
    title: "EV Charger Installation",
    trade: "Electrical", category: "Residential",
    excerpt: "Level 2 (240V) EV charging station, hardwired or NEMA 14-50.",
    documents: [
      { name: "Charger Spec", description: "Amperage, listing.", status: "Required" },
      { name: "Load Calc", description: "Confirms service can carry continuous EV load.", status: "Required" },
      { name: "Circuit Detail", description: "Wire size, breaker, GFCI/AFCI as required.", status: "Required" },
    ],
    inspections: [
      { name: "Rough (if concealed)", confirm: "Conductor and conduit." },
      { name: "Final", confirm: "GFCI tested, EVSE operational, labeling." },
    ],
    codes: ["NEC 625 — EVSE", "NEC 210 — Branch Circuits"],
    pitfalls: [
      "Not derating circuit for continuous load (80%).",
      "No GFCI on receptacle-fed charger.",
      "Adding charger without updated load calc; pushes total over service.",
    ],
  },
  {
    id: "transfer-switch",
    title: "Transfer Switch / Generator Electrical",
    trade: "Electrical", category: "Residential",
    excerpt: "ATS or manual transfer switch installation for backup power.",
    documents: [
      { name: "Switch Spec", description: "ATS rating matched to service or selected loads.", status: "Required" },
      { name: "Riser Diagram", description: "Line side or load side configuration.", status: "Required" },
      { name: "Load Calc / Schedule", description: "Critical loads supplied during outage.", status: "Required" },
    ],
    inspections: [
      { name: "Rough", confirm: "Wiring, grounding/bonding at ATS, neutral handling." },
      { name: "Final", confirm: "Transfer tested under load, labels in place." },
    ],
    codes: ["NEC 702 — Optional Standby Systems", "NEC 250.30 — Separately Derived Systems"],
    pitfalls: [
      "Mishandling neutral on a separately-derived system.",
      "ATS not listed for service entrance when installed line side.",
      "No backfeed protection — life safety failure.",
    ],
  },
  {
    id: "pool-electrical-new",
    title: "Pool / Spa Electrical — New",
    trade: "Electrical", category: "Residential",
    excerpt: "Electrical sub-permit pulled with new pool/spa for bonding, GFCI, lighting, and equipment.",
    documents: [
      { name: "Electrical Plan & Riser", description: "Panel sub-feed, equipment circuits, lighting.", status: "Required" },
      { name: "Bonding Detail", description: "Equipotential grid, deck reinforcement bond, water bond.", status: "Required" },
      { name: "Load Calc", description: "Pool load added to dwelling.", status: "Required" },
    ],
    inspections: [
      { name: "Bonding Grid", confirm: "All reinforcement and metal within 5 ft bonded continuously." },
      { name: "Rough Electrical", confirm: "GFCI breakers, conduit, equipment grounding." },
      { name: "Final", confirm: "GFCI tested, niche bond, labels." },
    ],
    codes: ["NEC Article 680", "NEC 250"],
    pitfalls: [
      "Missing water bond at skimmer or return.",
      "Single-point bond instead of continuous grid.",
      "Non-GFCI receptacle within 20 ft of pool.",
    ],
  },
  {
    id: "pool-electrical-upgrade",
    title: "Pool / Spa Electrical — Upgrade",
    trade: "Electrical", category: "Residential",
    excerpt: "Upgrade existing pool electrical to current code — typically triggered by equipment replacement or addition of automation.",
    documents: [
      { name: "Scope Letter", description: "Existing condition and proposed upgrades.", status: "Required" },
      { name: "Riser & Circuit Detail", description: "New automation/controller, sub-panel if added.", status: "Required" },
      { name: "Bonding Continuity Test Plan", description: "Verify existing grid before adding equipment.", status: "Required" },
    ],
    inspections: [
      { name: "Rough", confirm: "New circuits, controller wiring." },
      { name: "Final", confirm: "GFCI tested, automation operational, labels updated." },
    ],
    codes: ["NEC Article 680", "NEC 250"],
    pitfalls: [
      "Assuming old grid is intact without testing — must verify.",
      "Adding heat pump without bonding lug.",
      "No GFCI on replacement light fixture.",
    ],
  },
  {
    id: "outdoor-lighting-line",
    title: "Outdoor Lighting — Line Voltage",
    trade: "Electrical", category: "Residential",
    excerpt: "120V or 277V landscape and architectural lighting (low-voltage not permittable).",
    documents: [
      { name: "Lighting Plan", description: "Fixture locations, circuit layout, controls.", status: "Required" },
      { name: "Photometric (HOA)", description: "Sometimes required by ARB.", status: "Conditional" },
      { name: "Circuit Detail", description: "GFCI, conduit, burial depth.", status: "Required" },
    ],
    inspections: [
      { name: "Trench (before backfill)", confirm: "Conduit type, burial depth, warning tape." },
      { name: "Rough", confirm: "Fixtures bonded, GFCI." },
      { name: "Final", confirm: "All fixtures operational, dark-sky compliant if HOA requires." },
    ],
    codes: ["NEC 410", "NEC 300 — Burial Depth", "NEC 210.8 — GFCI"],
    pitfalls: [
      "Direct-burial cable used where conduit required.",
      "Buried splices without listed enclosure.",
      "Non-GFCI circuit serving exterior fixtures.",
    ],
  },
  {
    id: "solar-rooftop",
    title: "Solar Panel — Rooftop",
    trade: "Electrical", category: "Residential",
    excerpt: "Photovoltaic system installation on residential rooftop with grid-tie inverter.",
    documents: [
      { name: "Structural Letter", description: "Engineer confirms roof structure handles PV load.", status: "Required" },
      { name: "PV Plan Set", description: "Module layout, string sizing, inverter spec.", status: "Required" },
      { name: "Single-Line Diagram", description: "DC and AC, disconnects, labeling.", status: "Required" },
      { name: "Utility Interconnection Agreement", description: "FPL approval prior to energizing.", status: "Required" },
      { name: "Roofing Attachment Detail", description: "Standoffs, flashing, warranty acknowledgment.", status: "Required" },
    ],
    inspections: [
      { name: "Roof Mount", confirm: "Standoffs flashed, attached to rafters/trusses." },
      { name: "Rough Electrical", confirm: "Conduit, grounding, conductor sizing." },
      { name: "Final", confirm: "Disconnects labeled per NEC 690, rapid shutdown operational, utility witness if required." },
    ],
    codes: ["NEC Article 690 — PV Systems", "NEC 705 — Interconnected Power Sources", "FBC 1609 — Wind Loads on Modules"],
    pitfalls: [
      "Standoffs into sheathing only — must hit framing.",
      "Missing rapid-shutdown initiator at array.",
      "No PV-specific signage at meter and disconnect.",
    ],
  },

  // ============================================================
  // HVAC (4)
  // ============================================================
  {
    id: "hvac-new",
    title: "HVAC — New System Installation",
    trade: "HVAC", category: "Residential",
    excerpt: "First-time installation of central HVAC including duct system in a previously un-conditioned space.",
    documents: [
      { name: "Manual J / D / S", description: "Load, duct sizing, equipment selection.", status: "Required" },
      { name: "Equipment Cut Sheets", description: "AHRI match, SEER2.", status: "Required" },
      { name: "Florida Energy Form R-405", description: "Whole-house compliance.", status: "Required" },
      { name: "Duct Layout", description: "Plan with CFM per register.", status: "Required" },
      { name: "Electrical Detail", description: "Dedicated circuits for air handler and condenser.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Duct", confirm: "Sealed, supported, R-value." },
      { name: "Rough Electrical", confirm: "Disconnects, conductor sizing." },
      { name: "Final", confirm: "AHRI match, condensate pan + float switch, system operational." },
    ],
    codes: ["FBC Mechanical", "FBC Energy", "ACCA Manual J/S/D"],
    pitfalls: [
      "Skipping Manual J — energy compliance fails.",
      "Air handler in attic without secondary pan + float.",
      "Missing AHRI match certificate at final.",
    ],
  },
  {
    id: "mini-split",
    title: "Mini-Split Installation",
    trade: "HVAC", category: "Residential",
    excerpt: "Ductless mini-split for addition, garage, or zone supplement.",
    documents: [
      { name: "Equipment Specs", description: "Indoor and outdoor unit, AHRI match.", status: "Required" },
      { name: "Manual J (small)", description: "Load justification for zone.", status: "Required" },
      { name: "Electrical Detail", description: "Dedicated circuit and disconnect.", status: "Required" },
      { name: "Mounting / Penetration Detail", description: "Pad or wall mount, sleeve/sealant.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Electrical", confirm: "Conductor and disconnect." },
      { name: "Final", confirm: "Refrigerant pressures, condensate drain, AHRI match." },
    ],
    codes: ["FBC Mechanical", "FBC Energy", "NEC 440"],
    pitfalls: [
      "No condensate drain — water damages wall.",
      "Wall penetration not sealed.",
      "Outdoor unit on grade without pad.",
    ],
  },
  {
    id: "whole-house-fan",
    title: "Whole House Fan",
    trade: "HVAC", category: "Residential",
    excerpt: "Attic-mounted whole house fan for natural ventilation.",
    documents: [
      { name: "Equipment Specs", description: "CFM, listing.", status: "Required" },
      { name: "Attic Ventilation Calc", description: "Confirms intake-to-exhaust ratio.", status: "Required" },
      { name: "Electrical Detail", description: "Switched circuit.", status: "Required" },
      { name: "Damper / Insulated Cover Detail", description: "Required for energy compliance.", status: "Required" },
    ],
    inspections: [
      { name: "Final", confirm: "Damper operational, insulated cover, switch wired correctly." },
    ],
    codes: ["FBC Mechanical 401", "FBC Energy"],
    pitfalls: [
      "Insufficient attic intake area — fan ineffective and depressurizes house.",
      "No insulated cover — fails energy.",
      "Fan placed where it pulls combustion gases from atmospheric water heater.",
    ],
  },
  {
    id: "hvac-com-rooftop",
    title: "HVAC — Commercial Rooftop",
    trade: "HVAC", category: "Commercial",
    excerpt: "RTU replacement or new install on commercial building.",
    documents: [
      { name: "Equipment Specs & AHRI Match", description: "Tonnage, electrical, gas, weight.", status: "Required" },
      { name: "Structural Letter", description: "Roof can carry new RTU and curb adapter.", status: "Required" },
      { name: "Curb Adapter / Roof Detail", description: "Sealed, flashed, code-compliant.", status: "Required" },
      { name: "Electrical & Gas Plans", description: "Service capacity, disconnects.", status: "Required" },
      { name: "Florida Energy Compliance", description: "Commercial energy code.", status: "Required" },
    ],
    inspections: [
      { name: "Curb & Roof", confirm: "Flashing, structural attachment." },
      { name: "Rough Electrical / Gas", confirm: "Disconnects, pressure test on gas." },
      { name: "Final", confirm: "Operational, refrigerant pressures, smoke detector tie-in (>2000 CFM)." },
    ],
    codes: ["FBC Mechanical", "FBC Energy Commercial", "NEC 440", "NFPA 54"],
    pitfalls: [
      "Curb leak after roofing — coordination with roofer required.",
      "Skipping structural letter on a larger replacement unit.",
      "No smoke detector / interlock on units >2000 CFM.",
    ],
  },

  // ============================================================
  // STRUCTURAL / GC (10)
  // ============================================================
  {
    id: "sfh-shell",
    title: "New SFH — Shell Only",
    trade: "General Contractors", category: "Residential",
    excerpt: "Shell-only permit for spec home — slab, frame, dry-in. Interior trades pulled separately.",
    documents: [
      { name: "Sealed Architectural", description: "Site, foundation, floor, elevations.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, lateral, uplift.", status: "Required" },
      { name: "Truss Package", description: "Sealed.", status: "Required" },
      { name: "Energy Calc", description: "Required even for shell to set envelope.", status: "Required" },
      { name: "NOC", description: "Recorded before first inspection.", status: "Required" },
    ],
    inspections: [
      { name: "Footer", confirm: "Trench, rebar, depth." },
      { name: "Slab", confirm: "Vapor barrier, embedded sleeves." },
      { name: "Tie-Down / Sheathing", confirm: "Connectors, nailing pattern." },
      { name: "Dry-In", confirm: "Roof dried-in, windows installed." },
    ],
    codes: ["FBC-R 2023", "ASCE 7-22", "FL Statute 553"],
    pitfalls: [
      "Pouring slab without recorded NOC.",
      "Sheathing nailing pattern off — fails tie-down.",
      "Engineered truss layout mismatched to framing.",
    ],
  },
  {
    id: "addition-master",
    title: "Addition — Master Suite",
    trade: "General Contractors", category: "Residential",
    excerpt: "Master bedroom + bath addition with new foundation, framing, and full MEP.",
    documents: [
      { name: "Existing & Proposed Plans", description: "Architectural set.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, tie-in.", status: "Required" },
      { name: "Energy Calc Update", description: "Whole-house with addition.", status: "Required" },
      { name: "Survey", description: "Footprint change.", status: "Required" },
      { name: "Septic Update", description: "If on septic and bedroom count increases.", status: "Conditional" },
      { name: "NOC", description: "Recorded.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Slab", confirm: "Tie-in to existing." },
      { name: "Framing / Rough MEP", confirm: "Existing-to-new connections." },
      { name: "Insulation", confirm: "Per energy calc." },
      { name: "Final all trades", confirm: "C/O for addition area." },
    ],
    codes: ["FBC Existing Building", "FBC-R 2023", "FBC Energy"],
    pitfalls: [
      "Adding bedroom on septic without HRS update.",
      "Removing load-bearing wall without engineer.",
      "Window egress in new bedroom not meeting clear opening.",
    ],
  },
  {
    id: "addition-room",
    title: "Addition — Room / Space",
    trade: "General Contractors", category: "Residential",
    excerpt: "General room addition (living, dining, office) without bedroom/bath.",
    documents: [
      { name: "Plans (Existing & Proposed)", description: "Architectural set.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, tie-in.", status: "Required" },
      { name: "Energy Calc", description: "Updated.", status: "Required" },
      { name: "Survey", description: "Footprint change.", status: "Required" },
      { name: "NOC", description: "Recorded.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Slab", confirm: "Tie-in to existing." },
      { name: "Framing / Rough MEP", confirm: "As applicable." },
      { name: "Insulation", confirm: "Per energy calc." },
      { name: "Final", confirm: "C/O." },
    ],
    codes: ["FBC Existing Building", "FBC-R 2023", "FBC Energy"],
    pitfalls: [
      "Opening between existing and new not engineered.",
      "Energy calc not updated.",
      "Window/door schedule missing impact rating.",
    ],
  },
  {
    id: "addition-garage",
    title: "Addition — Garage",
    trade: "General Contractors", category: "Residential",
    excerpt: "Attached garage addition.",
    documents: [
      { name: "Plans", description: "Existing & proposed.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, garage door header, tie-in.", status: "Required" },
      { name: "Garage Door Product Approval", description: "Impact-rated FL approval.", status: "Required" },
      { name: "Survey", description: "Footprint change.", status: "Required" },
      { name: "NOC", description: "Recorded.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Slab", confirm: "Tie-in." },
      { name: "Framing", confirm: "Garage door header, hurricane strapping." },
      { name: "Final", confirm: "Fire separation if living above garage, self-closing door to house." },
    ],
    codes: ["FBC-R 309 — Garages", "FBC 1609", "FBC Existing Building"],
    pitfalls: [
      "Missing self-closing fire-rated door to house.",
      "Garage door not impact rated.",
      "No fire-rated ceiling assembly when living space above.",
    ],
  },
  {
    id: "remodel-kitchen",
    title: "Remodel — Kitchen",
    trade: "General Contractors", category: "Residential",
    excerpt: "Kitchen remodel touching MEP, gas, or layout.",
    documents: [
      { name: "Existing & Proposed Plans", description: "Layout change.", status: "Required" },
      { name: "Electrical Detail", description: "New circuits, AFCI/GFCI per current code.", status: "Required" },
      { name: "Plumbing & Gas Detail", description: "If relocated.", status: "Conditional" },
      { name: "Structural Letter", description: "If walls removed.", status: "Conditional" },
      { name: "NOC", description: "If >$5,000.", status: "Required" },
    ],
    inspections: [
      { name: "Framing (if walls touched)", confirm: "Headers, beams." },
      { name: "Rough MEP", confirm: "Per trade." },
      { name: "Final each trade + Building", confirm: "Sign-offs complete." },
    ],
    codes: ["FBC Existing Building", "NEC 210.52(C)", "FBC Plumbing 410"],
    pitfalls: [
      "Removing peninsula wall without structural sign-off.",
      "Counter receptacles not added per NEC 210.52(C).",
      "Range relocated without updated gas sizing.",
    ],
  },
  {
    id: "remodel-bath",
    title: "Remodel — Bathroom",
    trade: "General Contractors", category: "Residential",
    excerpt: "Bathroom remodel involving plumbing, electrical, ventilation.",
    documents: [
      { name: "Plans", description: "Existing and proposed fixture layout.", status: "Required" },
      { name: "Plumbing Riser", description: "If fixture count or DWV changes.", status: "Conditional" },
      { name: "Electrical Detail", description: "GFCI, dedicated circuits, fan.", status: "Required" },
      { name: "Ventilation Detail", description: "Exhaust fan ducted to exterior.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Plumbing", confirm: "DWV pressure test, water test." },
      { name: "Rough Electrical", confirm: "GFCI circuits, fan circuit." },
      { name: "Final", confirm: "Fan ducts to exterior, fixtures functional." },
    ],
    codes: ["FBC Plumbing", "NEC 210.8", "FBC Mechanical 403"],
    pitfalls: [
      "Fan vented to attic instead of exterior.",
      "No GFCI on receptacle within 6 ft of basin.",
      "Shower drain undersized (must be 2\").",
    ],
  },
  {
    id: "remodel-interior",
    title: "Remodel — Interior",
    trade: "General Contractors", category: "Residential",
    excerpt: "General interior remodel — flooring, finishes, non-structural walls.",
    documents: [
      { name: "Scope Letter & Plans", description: "Existing and proposed.", status: "Required" },
      { name: "Structural Letter", description: "Required if any wall removed.", status: "Conditional" },
      { name: "MEP Sub-Permits", description: "If applicable, pulled separately.", status: "Conditional" },
    ],
    inspections: [
      { name: "Framing (if applicable)", confirm: "Per scope." },
      { name: "Final", confirm: "Complete." },
    ],
    codes: ["FBC Existing Building"],
    pitfalls: [
      "Removing wall declared 'non-bearing' that is actually bearing — engineer letter required.",
      "Adding fixtures without sub-permit.",
      "Disturbing fire separation between units (in attached structures).",
    ],
  },
  {
    id: "garage-detached",
    title: "Garage — Detached (New)",
    trade: "General Contractors", category: "Residential",
    excerpt: "New detached garage. Separate structure, full structural design.",
    documents: [
      { name: "Architectural Set", description: "Site, floor, elevations, sections.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, uplift.", status: "Required" },
      { name: "Truss Package", description: "Sealed.", status: "Conditional" },
      { name: "Electrical Plan", description: "Sub-feed from main panel.", status: "Required" },
      { name: "Garage Door Product Approval", description: "Impact-rated.", status: "Required" },
      { name: "NOC", description: "Recorded.", status: "Required" },
    ],
    inspections: [
      { name: "Footer / Slab", confirm: "Depth, rebar." },
      { name: "Framing / Tie-Down", confirm: "Connectors, sheathing." },
      { name: "Rough Electrical", confirm: "Sub-feed, grounding." },
      { name: "Final", confirm: "All trades, garage door operational." },
    ],
    codes: ["FBC-R 2023", "FBC-R 309", "FBC 1609"],
    pitfalls: [
      "Setback violations — detached structures often have different setbacks.",
      "Sub-feed undersized for proposed use (workshop / EV).",
      "Truss layout mismatched to framing plan.",
    ],
  },
  {
    id: "shed-workshop",
    title: "Detached Structure — Shed / Workshop",
    trade: "General Contractors", category: "Residential",
    excerpt: "Detached shed or workshop. Many jurisdictions exempt <100 sf, but anchorage/wind always apply.",
    documents: [
      { name: "Site Plan", description: "Setbacks, distance to other structures.", status: "Required" },
      { name: "Structural / Anchorage", description: "Tie-down to engineered system.", status: "Required" },
      { name: "Manufacturer Specs (prefab)", description: "FL product approval.", status: "Conditional" },
      { name: "Electrical Plan", description: "If powered.", status: "Conditional" },
    ],
    inspections: [
      { name: "Anchorage", confirm: "Auger anchors or slab connection." },
      { name: "Final", confirm: "Tie-down verified, electrical operational if powered." },
    ],
    codes: ["FBC-R 105.2 — Exemptions", "FBC 1609", "Local zoning"],
    pitfalls: [
      "Assuming <100 sf exemption when AHJ requires permit anyway.",
      "Setbacks violated.",
      "No tie-down system on shed in wind zone.",
    ],
  },
  {
    id: "carport-wood",
    title: "Carport — Wood (New)",
    trade: "General Contractors", category: "Residential",
    excerpt: "New wood-framed carport — attached or freestanding.",
    documents: [
      { name: "Site Plan & Setbacks", description: "Local zoning compliance.", status: "Required" },
      { name: "Structural Engineering", description: "Foundation, framing, wind uplift.", status: "Required" },
      { name: "Roofing Product Approval", description: "Metal, shingle, etc.", status: "Required" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, post anchorage." },
      { name: "Framing / Tie-Down", confirm: "Connectors per detail." },
      { name: "Final", confirm: "Roofing complete, all anchors set." },
    ],
    codes: ["FBC-R 502", "FBC 1609", "AWC NDS"],
    pitfalls: [
      "Zoning violation — front-yard carports restricted.",
      "Lagged to fascia (if attached) instead of framing.",
      "Skipping hurricane strapping at posts.",
    ],
  },

  // ============================================================
  // HARDSCAPE / EXTERIOR (11)
  // ============================================================
  {
    id: "driveway-pavers",
    title: "Driveway — New / Replacement Pavers",
    trade: "General Contractors", category: "Residential",
    excerpt: "Paver driveway new or replacement, often combined with public works for ROW.",
    documents: [
      { name: "Site Plan", description: "Footprint, drainage, ROW transition.", status: "Required" },
      { name: "Public Works Permit", description: "Required for ROW / apron work.", status: "Conditional" },
      { name: "Impervious Calc", description: "Some jurisdictions limit impervious coverage.", status: "Conditional" },
      { name: "HOA Approval", description: "Often required for material/color.", status: "Conditional" },
    ],
    inspections: [
      { name: "Sub-Base", confirm: "Compaction, thickness." },
      { name: "Final", confirm: "Joint sand, drainage functional, ROW restored." },
    ],
    codes: ["FBC-R 105", "Local PW standards", "FDOT Index 522"],
    pitfalls: [
      "No PW permit when apron touches ROW.",
      "Impervious cap exceeded.",
      "Pavers settling from inadequate base.",
    ],
  },
  {
    id: "patio-pavers",
    title: "Patio — Pavers (New)",
    trade: "General Contractors", category: "Residential",
    excerpt: "Paver patio in rear yard. May or may not require permit by jurisdiction.",
    documents: [
      { name: "Site Plan", description: "Footprint, setbacks, drainage.", status: "Required" },
      { name: "Drainage Detail", description: "Slope away from house.", status: "Required" },
      { name: "HOA Approval", description: "Common.", status: "Conditional" },
    ],
    inspections: [
      { name: "Sub-Base", confirm: "Compaction." },
      { name: "Final", confirm: "Drainage functional, edging restraint." },
    ],
    codes: ["FBC-R 105.2 — Exemptions vary by AHJ"],
    pitfalls: [
      "Patio sloped toward house.",
      "No permit pulled in AHJ that requires it.",
      "Edge restraint omitted — pavers spread.",
    ],
  },
  {
    id: "deck-wood",
    title: "Deck — Wood (New)",
    trade: "General Contractors", category: "Residential",
    excerpt: "New wood deck attached or freestanding.",
    documents: [
      { name: "Site Plan & Plans", description: "Footprint, elevation.", status: "Required" },
      { name: "Structural Engineering or Prescriptive", description: "DCA 6 prescriptive or engineer-sealed.", status: "Required" },
      { name: "Ledger Attachment / Flashing", description: "Required when attached.", status: "Conditional" },
      { name: "Guard / Stair Detail", description: "If elevated over 30\".", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, post anchorage." },
      { name: "Framing", confirm: "Joist, ledger, connectors." },
      { name: "Final", confirm: "Guards, stairs, decking complete." },
    ],
    codes: ["FBC-R 507 — Decks", "DCA 6 — Prescriptive Residential Wood Deck", "FBC 1609"],
    pitfalls: [
      "Ledger lagged with carriage bolts instead of approved fasteners.",
      "Missing joist hangers.",
      "Guards under 36\" or balusters wider than 4\".",
    ],
  },
  {
    id: "deck-composite",
    title: "Deck — Composite (New)",
    trade: "General Contractors", category: "Residential",
    excerpt: "Composite decking on wood/steel substructure.",
    documents: [
      { name: "Site Plan & Plans", description: "Footprint.", status: "Required" },
      { name: "Structural Detail", description: "Joist spacing per composite manufacturer.", status: "Required" },
      { name: "Manufacturer Installation Guide", description: "Composite-specific fastener / spacing.", status: "Required" },
      { name: "Guard Detail", description: "If elevated.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, anchorage." },
      { name: "Framing", confirm: "Joist spacing per composite spec." },
      { name: "Final", confirm: "Decking installed per manufacturer, guards." },
    ],
    codes: ["FBC-R 507", "FBC-R 317 — Decay", "ICC-ES report for composite boards"],
    pitfalls: [
      "Joist spacing too wide for composite span rating.",
      "Hidden fastener system installed against manufacturer spec.",
      "PT lumber chemistry incompatible with fasteners — corrosion.",
    ],
  },
  {
    id: "fence-wood",
    title: "Fence — Wood",
    trade: "General Contractors", category: "Residential",
    excerpt: "Wood fence — privacy or picket.",
    documents: [
      { name: "Site Plan", description: "Layout, height, setbacks, easements.", status: "Required" },
      { name: "Survey", description: "Required when fence is on property line.", status: "Conditional" },
      { name: "HOA Approval", description: "Common.", status: "Conditional" },
    ],
    inspections: [
      { name: "Final", confirm: "Height, setbacks, no encroachment." },
    ],
    codes: ["Local zoning code", "FBC 1609 (taller fences)"],
    pitfalls: [
      "Fence in easement.",
      "Height exceeds zoning (typically 4 ft front, 6 ft side/rear).",
      "Encroachment over property line — survey discrepancy.",
    ],
  },
  {
    id: "fence-alum-vinyl",
    title: "Fence — Aluminum / Vinyl",
    trade: "General Contractors", category: "Residential",
    excerpt: "Aluminum or vinyl fence — often used around pools.",
    documents: [
      { name: "Site Plan", description: "Layout, height.", status: "Required" },
      { name: "Product Cut Sheet", description: "Manufacturer spec.", status: "Required" },
      { name: "Pool Barrier Compliance Statement", description: "If serving as pool barrier.", status: "Conditional" },
      { name: "Survey", description: "If on property line.", status: "Conditional" },
    ],
    inspections: [
      { name: "Final", confirm: "Pool barrier compliance (gates self-closing/latching, no climbable horizontals)." },
    ],
    codes: ["Local zoning", "FBC-R 4501.17 (when pool barrier)"],
    pitfalls: [
      "Picket spacing >4\" — fails pool barrier.",
      "Gate hardware below required 54\" trigger.",
      "Setback violation.",
    ],
  },
  {
    id: "gate-motorized",
    title: "Gate — Motorized",
    trade: "Specialty", category: "Residential",
    excerpt: "Motorized entry gate — swing or slide. Electrical, safety devices, and UL 325 compliance.",
    documents: [
      { name: "Site Plan", description: "Gate location, electrical run.", status: "Required" },
      { name: "Operator Spec / Listing", description: "UL 325 listed operator.", status: "Required" },
      { name: "Safety Device Detail", description: "Photo eyes, reversing edges per UL 325 class.", status: "Required" },
      { name: "Electrical Detail", description: "Dedicated circuit, GFCI.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Electrical", confirm: "Conduit, GFCI." },
      { name: "Final", confirm: "Operator tested, safety devices functional, signage posted." },
    ],
    codes: ["UL 325 — Gate Operators", "ASTM F2200 — Gate Construction", "NEC 210"],
    pitfalls: [
      "Inadequate entrapment protection for UL 325 class.",
      "Operator paired with gate not meeting ASTM F2200.",
      "No warning signage on both sides of gate.",
    ],
  },
  {
    id: "retaining-cmu",
    title: "Retaining Wall — Concrete Block",
    trade: "General Contractors", category: "Residential",
    excerpt: "CMU retaining wall — engineered design required over 4 ft.",
    documents: [
      { name: "Site Plan", description: "Wall location, grade change, drainage.", status: "Required" },
      { name: "Structural Engineering", description: "CMU spec, rebar, footer, grout cells.", status: "Required" },
      { name: "Drainage Plan", description: "Weep holes, drain tile.", status: "Required" },
      { name: "Geotech (>6 ft or surcharge)", description: "Soil bearing report.", status: "Conditional" },
    ],
    inspections: [
      { name: "Footer", confirm: "Dimensions, rebar." },
      { name: "Reinforcement / Grout", confirm: "Vertical/horizontal rebar before grout pour." },
      { name: "Drainage / Backfill", confirm: "Weep holes clear, drain tile installed." },
      { name: "Final", confirm: "Wall plumb, no settlement, drainage functional." },
    ],
    codes: ["FBC 1807", "ACI 530 — Masonry", "TMS 402"],
    pitfalls: [
      "Backfilling before drainage inspection.",
      "Cells ungrouted where rebar exists.",
      "No reinforcement at corners.",
    ],
  },
  {
    id: "seawall-repair",
    title: "Seawall Repair",
    trade: "Specialty", category: "Specialty",
    excerpt: "Seawall repair or replacement. Triggers DEP / Army Corps in addition to building.",
    documents: [
      { name: "Sealed Engineering", description: "Cap, tieback, anchor design.", status: "Required" },
      { name: "Survey & Mean High Water Line", description: "Locates wall relative to OHWL.", status: "Required" },
      { name: "FDEP / Army Corps Permit", description: "Required for any work waterward of MHWL.", status: "Required" },
      { name: "Adjacent Property Notification", description: "Some AHJs require.", status: "Conditional" },
    ],
    inspections: [
      { name: "Cap Steel", confirm: "Rebar, tieback connections." },
      { name: "Cap Pour", confirm: "Concrete spec, cover." },
      { name: "Final", confirm: "Cap complete, backfill restored." },
    ],
    codes: ["FBC 1807", "FAC 62-330 — Environmental Resource Permits", "33 CFR — Army Corps"],
    pitfalls: [
      "Starting work without DEP/Corps — stop work, criminal exposure.",
      "Inadequate tiebacks — wall fails in storm.",
      "Damaging neighbor's wall without coordination.",
    ],
  },
  {
    id: "dock-new",
    title: "Dock — New / Repair",
    trade: "Specialty", category: "Specialty",
    excerpt: "Residential dock new build or repair. DEP / Corps + Sovereign Submerged Lands.",
    documents: [
      { name: "Sealed Engineering", description: "Piles, decking, attachment.", status: "Required" },
      { name: "Survey & Bathymetric Plan", description: "Water depth and dimensions.", status: "Required" },
      { name: "FDEP / Army Corps Permit", description: "Even on private waterways.", status: "Required" },
      { name: "Submerged Lands Lease (if applicable)", description: "When extending into sovereign submerged lands.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pile Driving", confirm: "Depth, batter, spacing per engineer." },
      { name: "Framing", confirm: "Cross-bracing, connectors." },
      { name: "Final", confirm: "Decking, guards, electrical (if any)." },
    ],
    codes: ["FBC 1807", "FAC 62-330", "33 CFR — Army Corps", "FAC 18-21 — Sovereign Lands"],
    pitfalls: [
      "Starting without state/federal permits.",
      "Pile depth less than engineered.",
      "Electrical without bonding and GFCI.",
    ],
  },
  {
    id: "boat-lift",
    title: "Boat Lift",
    trade: "Specialty", category: "Specialty",
    excerpt: "Boat lift on existing or new dock. Electrical and structural.",
    documents: [
      { name: "Lift Spec & Engineering", description: "Capacity, motor, pile attachment.", status: "Required" },
      { name: "Dock Capacity Verification", description: "Engineer confirms dock can handle lift load.", status: "Required" },
      { name: "Electrical Plan", description: "GFCI, disconnect, bonding.", status: "Required" },
      { name: "DEP / Corps Concurrence", description: "If outside previously permitted footprint.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pile / Attachment", confirm: "Lift hardware secured per engineering." },
      { name: "Rough Electrical", confirm: "GFCI, bonding to lift frame." },
      { name: "Final", confirm: "Operational, disconnect labeled." },
    ],
    codes: ["FBC 1807", "NEC 555 — Marinas, Boatyards, Floating Buildings", "NEC 680.27"],
    pitfalls: [
      "No GFCI on lift circuit — life safety in water.",
      "Lift outside previously approved dock footprint.",
      "Pile/cradle not engineered for boat weight.",
    ],
  },

  // ============================================================
  // MIAMI-DADE SPECIFIC (3)
  // ============================================================
  {
    id: "mdc-impact",
    title: "Miami-Dade — Impact Window / Door",
    trade: "General Contractors", category: "Residential",
    excerpt: "Impact-rated window and door replacement in HVHZ jurisdiction.",
    documents: [
      { name: "Miami-Dade NOA", description: "Notice of Acceptance for each product.", status: "Required" },
      { name: "Window / Door Schedule", description: "Sizes, locations, NOA reference.", status: "Required" },
      { name: "Installation Detail per NOA", description: "Anchor schedule, sealant, buck.", status: "Required" },
      { name: "Elevation Plan", description: "Marked with each opening.", status: "Required" },
    ],
    inspections: [
      { name: "In-Progress Anchorage", confirm: "Anchor type, spacing, embedment per NOA." },
      { name: "Final", confirm: "All openings complete, sealant per NOA, labels visible." },
    ],
    codes: ["FBC HVHZ — High Velocity Hurricane Zone", "FBC 1626 — Test Standards", "Miami-Dade NOAs"],
    pitfalls: [
      "Field-modifying installation outside NOA — voids approval.",
      "Wrong anchor for substrate.",
      "Missing NOA label on installed product.",
    ],
  },
  {
    id: "mdc-fence",
    title: "Miami-Dade DERM — Fence",
    trade: "General Contractors", category: "Specialty",
    excerpt: "Fence in Miami-Dade — DERM tree and drainage review may apply.",
    documents: [
      { name: "Site Plan & Survey", description: "Layout relative to property lines and trees.", status: "Required" },
      { name: "DERM Tree Verification", description: "When fence touches drip line of protected trees.", status: "Required" },
      { name: "Drainage Check", description: "Solid fences impact site flow.", status: "Conditional" },
    ],
    inspections: [
      { name: "DERM Tree Protection (if applicable)", confirm: "Barricades in place." },
      { name: "Final Building", confirm: "Height, setbacks, hardware." },
    ],
    codes: ["Miami-Dade Code Ch. 24", "Local zoning"],
    pitfalls: [
      "Trenching for posts inside tree drip line without DERM.",
      "Solid fence blocking established drainage.",
      "Encroaching across property line.",
    ],
  },
  {
    id: "mdc-noc-bonding",
    title: "Miami-Dade NOC / Bonding",
    trade: "General Contractors", category: "Specialty",
    excerpt: "NOC recording and surety bonding requirements specific to Miami-Dade.",
    documents: [
      { name: "Recorded NOC", description: "Per FS 713.135 — recorded with Clerk of Court.", status: "Required" },
      { name: "Posted NOC at Site", description: "Visible from public way.", status: "Required" },
      { name: "Performance / Permit Bond", description: "Required for ROW and certain DERM permits.", status: "Conditional" },
    ],
    inspections: [
      { name: "First Inspection", confirm: "NOC recorded and posted before inspector arrives." },
    ],
    codes: ["FL Statute 713.135 — NOC", "Miami-Dade Code", "Local AHJ bonding requirements"],
    pitfalls: [
      "Calling for inspection without NOC on file — voids lien rights and inspection.",
      "Bond not in place for ROW work — permit voided.",
      "NOC expired before final.",
    ],
  },

  // ============================================================
  // PUBLIC WORKS (5)
  // ============================================================
  {
    id: "pbc-public-works",
    title: "Palm Beach County Public Works",
    trade: "General Contractors", category: "Specialty",
    excerpt: "PBC PW permit for any work in County ROW — apron, sidewalk, drainage tie-in.",
    documents: [
      { name: "PBC Right of Way Permit Application", description: "PBC-specific.", status: "Required" },
      { name: "Site Plan with ROW", description: "Work limits, MOT.", status: "Required" },
      { name: "MOT Plan", description: "When affecting travel lanes or sidewalks.", status: "Conditional" },
      { name: "Liability Insurance Cert", description: "Naming PBC as additional insured.", status: "Required" },
      { name: "Surety Bond", description: "Restoration bond for ROW work.", status: "Conditional" },
    ],
    inspections: [
      { name: "Pre-Construction", confirm: "MOT, work limits." },
      { name: "Sub-Base", confirm: "Compaction." },
      { name: "Final Restoration", confirm: "ROW restored, sod, no damage to infrastructure." },
    ],
    codes: ["Palm Beach County ULDC", "FDOT Index 304/522", "MUTCD"],
    pitfalls: [
      "Pouring apron without PW permit.",
      "No MOT when blocking sidewalk.",
      "Tying drainage into County system without approval.",
    ],
  },
  {
    id: "broward-public-works",
    title: "Broward County Public Works",
    trade: "General Contractors", category: "Specialty",
    excerpt: "Broward County ROW work permit.",
    documents: [
      { name: "Broward ROW Application", description: "BC-specific.", status: "Required" },
      { name: "Site Plan", description: "ROW lines, work area.", status: "Required" },
      { name: "MOT Plan", description: "When applicable.", status: "Conditional" },
      { name: "Liability Insurance", description: "Naming Broward County.", status: "Required" },
    ],
    inspections: [
      { name: "Pre-Construction", confirm: "MOT in place." },
      { name: "Sub-Base", confirm: "Compaction." },
      { name: "Final Restoration", confirm: "ROW restored." },
    ],
    codes: ["Broward County Code", "FDOT Index 304/522", "MUTCD"],
    pitfalls: [
      "No MOT — stop work.",
      "Improper restoration — bond pulled.",
      "Tie-in to drainage without approval.",
    ],
  },
  {
    id: "water-sewer",
    title: "Water / Sewer Connection",
    trade: "Plumbing", category: "Residential",
    excerpt: "New or replacement water and sewer service to property.",
    documents: [
      { name: "Utility Provider Application", description: "Capacity reservation.", status: "Required" },
      { name: "Site Plan & Profile", description: "Service routing, depths.", status: "Required" },
      { name: "Backflow Device Spec (water)", description: "ASSE-listed.", status: "Required" },
      { name: "Cleanout Detail (sewer)", description: "Per FBC Plumbing.", status: "Required" },
    ],
    inspections: [
      { name: "Trench (before backfill)", confirm: "Depth, bedding, pressure test." },
      { name: "Tap / Tie-in", confirm: "Performed or witnessed by utility." },
      { name: "Final", confirm: "Operational, backflow tagged, cleanouts accessible." },
    ],
    codes: ["FBC Plumbing 603 / 712", "Utility provider standards"],
    pitfalls: [
      "Backfilling before pressure test.",
      "Insufficient cover depth.",
      "Sewer cleanouts buried.",
    ],
  },
  {
    id: "irrigation-new",
    title: "Irrigation System — New",
    trade: "Plumbing", category: "Residential",
    excerpt: "New irrigation system with backflow preventer.",
    documents: [
      { name: "Irrigation Plan", description: "Zone layout, head spacing, GPM.", status: "Required" },
      { name: "Backflow Device Spec", description: "PVB or RPZ.", status: "Required" },
      { name: "Water Source Detail", description: "Potable, well, or reuse.", status: "Required" },
    ],
    inspections: [
      { name: "Backflow Final", confirm: "Device installed, tested, tagged." },
      { name: "Final Irrigation", confirm: "System operational, controller programmed." },
    ],
    codes: ["FBC Plumbing 608", "ASSE 1013 (RPZ) / 1056 (PVB)", "Local irrigation code"],
    pitfalls: [
      "Direct connection to potable without backflow.",
      "PVB buried (must be above grade).",
      "Reuse water mislabeled or cross-connected.",
    ],
  },
  {
    id: "irrigation-backflow",
    title: "Irrigation Backflow",
    trade: "Plumbing", category: "Residential",
    excerpt: "Standalone permit for adding or replacing backflow on existing irrigation.",
    documents: [
      { name: "Device Spec", description: "ASSE-listed.", status: "Required" },
      { name: "Site Detail", description: "Location, height above grade.", status: "Required" },
      { name: "Initial Test Report", description: "Certified tester signs at install.", status: "Required" },
    ],
    inspections: [
      { name: "Final", confirm: "Device above grade, tested, tagged." },
    ],
    codes: ["FBC Plumbing 608", "ASSE 1013 / 1056"],
    pitfalls: [
      "Device installed below grade.",
      "No initial test on file.",
      "Wrong device class for hazard level.",
    ],
  },

  // ============================================================
  // ROOFING (5)
  // ============================================================
  {
    id: "roof-tile",
    title: "Roof Replacement — Tile",
    trade: "Roofing", category: "Residential",
    excerpt: "Tile roof tear-off and replacement. Higher uplift loads and engineering coordination.",
    documents: [
      { name: "Product Approval", description: "Tile, underlayment, fasteners, anti-ponding.", status: "Required" },
      { name: "Scope & System Detail", description: "Tear-off, decking, SWB, underlayment, tile, hip/ridge attachment.", status: "Required" },
      { name: "Structural Letter", description: "Required when going from shingle to tile.", status: "Conditional" },
      { name: "Mitigation Form", description: "At final.", status: "Required" },
    ],
    inspections: [
      { name: "Dry-In / Tin Tag", confirm: "Underlayment per NOA, SWB, fastener pattern." },
      { name: "In-Progress", confirm: "Tile attachment, hip/ridge per NOA." },
      { name: "Final", confirm: "All flashings, drip edge, no exposed fasteners outside spec." },
    ],
    codes: ["FBC-R 905", "FBC-R R4402 (SWB)", "TRI Tile Installation Manual"],
    pitfalls: [
      "Switching from shingle to tile without structural letter — added dead load fails roof.",
      "Hip/ridge tiles not foam-set or mechanically attached per NOA.",
      "Missing SWB in HVHZ / required jurisdictions.",
    ],
  },
  {
    id: "roof-shingle",
    title: "Roof Replacement — Shingle",
    trade: "Roofing", category: "Residential",
    excerpt: "Asphalt shingle roof tear-off and replacement.",
    documents: [
      { name: "Product Approval", description: "Shingle, underlayment, drip edge, starter, fasteners.", status: "Required" },
      { name: "Scope & System", description: "Tear-off, SWB, underlayment, shingle.", status: "Required" },
      { name: "Mitigation Form", description: "At final.", status: "Required" },
    ],
    inspections: [
      { name: "Dry-In / Tin Tag", confirm: "Underlayment per NOA, fasteners, SWB." },
      { name: "Final", confirm: "Drip edge, starter, ridge vent, no exposed fasteners." },
    ],
    codes: ["FBC-R 905.2", "FBC-R R4402 (SWB)", "ASTM D3161 / D7158 — Wind Resistance"],
    pitfalls: [
      "Re-using underlayment.",
      "Wrong nailing zone — fails dry-in.",
      "Missing drip edge.",
    ],
  },
  {
    id: "roof-flat-tpo",
    title: "Roof Replacement — Flat / TPO",
    trade: "Roofing", category: "Commercial",
    excerpt: "Low-slope TPO, PVC, or modified bitumen roof — typically commercial.",
    documents: [
      { name: "Product Approval", description: "Membrane, insulation, fasteners or adhesive, edge metal.", status: "Required" },
      { name: "Wind Uplift Detail", description: "Fastening pattern per zone — corner / perimeter / field.", status: "Required" },
      { name: "Edge Metal / ANSI SPRI ES-1", description: "Edge securement detail.", status: "Required" },
      { name: "Tear-Off Scope", description: "Or recover assembly justification.", status: "Required" },
    ],
    inspections: [
      { name: "Tear-Off / Deck", confirm: "Deck condition, repairs." },
      { name: "Insulation Attachment", confirm: "Pattern per NOA." },
      { name: "Membrane Attachment", confirm: "Pattern per NOA, seam welds." },
      { name: "Final", confirm: "Edge metal, terminations, drainage flow tested." },
    ],
    codes: ["FBC-R 1504 / 1507", "ANSI SPRI ES-1", "FM 4470 — Single-Ply Roof Assemblies"],
    pitfalls: [
      "Field pattern used in corner/perimeter zones.",
      "Edge metal not ES-1 tested for wind speed.",
      "Recover when tear-off required (>2 layers, wet insulation).",
    ],
  },
  {
    id: "skylight",
    title: "Skylight Installation",
    trade: "Roofing", category: "Residential",
    excerpt: "New or replacement skylight in residential roof.",
    documents: [
      { name: "Product Approval", description: "Skylight FL/NOA.", status: "Required" },
      { name: "Cut / Framing Detail", description: "Header / opening framing per engineer or prescriptive.", status: "Required" },
      { name: "Flashing Detail", description: "Manufacturer-specific flashing kit.", status: "Required" },
    ],
    inspections: [
      { name: "Framing", confirm: "Header sized correctly." },
      { name: "Dry-In", confirm: "Flashing per manufacturer." },
      { name: "Final", confirm: "Curb installed, weatherproof, glass intact." },
    ],
    codes: ["FBC-R 905.16", "FBC 2405 — Glazed Roofs"],
    pitfalls: [
      "Skipping flashing kit — leaks within months.",
      "Cutting truss chord without engineer.",
      "Skylight glazing not impact-rated where required.",
    ],
  },
  {
    id: "roof-repair-partial",
    title: "Roof Repair — Partial",
    trade: "Roofing", category: "Residential",
    excerpt: "Partial roof repair — typically under 25% per FS 553.844 threshold.",
    documents: [
      { name: "Scope & Photos", description: "Defines affected area, percentage of total roof.", status: "Required" },
      { name: "Matching Product Approval", description: "Repair materials match existing as feasible.", status: "Required" },
      { name: "FS 553.844 Compliance Statement", description: "Confirms repair is below replacement threshold.", status: "Required" },
    ],
    inspections: [
      { name: "Dry-In (if reaches deck)", confirm: "Underlayment per NOA." },
      { name: "Final", confirm: "Repair complete, water-tight." },
    ],
    codes: ["FL Statute 553.844 — Roof Repair Threshold", "FBC Existing Building", "FBC-R 905"],
    pitfalls: [
      "Repair exceeds 25% — must convert to full replacement.",
      "Mismatched materials without approval.",
      "Skipping permit on repairs that AHJ requires.",
    ],
  },

  // ============================================================
  // SPECIALTY / OUTDOOR LIVING (7)
  // ============================================================
  {
    id: "outdoor-kitchen-full",
    title: "Outdoor Kitchen — Full Build",
    trade: "General Contractors", category: "Residential",
    excerpt: "Full outdoor kitchen — masonry counters, appliances, gas, electric, plumbing, sometimes roof structure.",
    documents: [
      { name: "Site Plan & Plans", description: "Footprint, appliances, utility routes.", status: "Required" },
      { name: "Structural (if roof structure)", description: "Engineered roof per pergola/cover guide.", status: "Conditional" },
      { name: "Gas / Plumbing / Electrical Plans", description: "Sub-permits typically required.", status: "Required" },
      { name: "Appliance Cut Sheets", description: "Outdoor-listed.", status: "Required" },
    ],
    inspections: [
      { name: "Footer (if applicable)", confirm: "Per structural." },
      { name: "Rough MEP", confirm: "All trades pre-cover." },
      { name: "Final", confirm: "All appliances operational, GFCI, gas leak check." },
    ],
    codes: ["FBC Fuel Gas", "NEC 210.8", "FBC Plumbing", "FBC-R 502 (if roof)"],
    pitfalls: [
      "Indoor-rated appliances installed outdoors.",
      "No GFCI on outdoor receptacles.",
      "Gas / electric tied in without sub-permits.",
    ],
  },
  {
    id: "fire-pit-gas",
    title: "Fire Pit — Gas",
    trade: "Plumbing", category: "Residential",
    excerpt: "Gas-fed fire pit. Triggers gas piping permit and clearance review.",
    documents: [
      { name: "Manufacturer Specs", description: "BTU, clearances, ignition.", status: "Required" },
      { name: "Gas Piping Plan", description: "Pipe sizing, shutoff.", status: "Required" },
      { name: "Site Plan & Clearances", description: "Distance from combustibles and structures.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Gas Pressure Test", confirm: "10 PSI hold." },
      { name: "Final", confirm: "Operational, shutoff accessible, clearances per manufacturer." },
    ],
    codes: ["FBC Fuel Gas", "NFPA 54", "Local fire prevention code"],
    pitfalls: [
      "Pit too close to overhead structure.",
      "No accessible shutoff.",
      "Undersized gas line.",
    ],
  },
  {
    id: "fire-pit-wood",
    title: "Fire Pit — Wood Burning",
    trade: "General Contractors", category: "Residential",
    excerpt: "Wood-burning fire pit. Local fire prevention code drives clearance and burn restrictions.",
    documents: [
      { name: "Site Plan & Clearances", description: "Distance from combustibles, structures, property line.", status: "Required" },
      { name: "Materials & Construction", description: "Non-combustible construction.", status: "Required" },
      { name: "HOA Approval", description: "Often required.", status: "Conditional" },
    ],
    inspections: [
      { name: "Final", confirm: "Setbacks, non-combustible construction, screen if required." },
    ],
    codes: ["FFPC — Florida Fire Prevention Code", "NFPA 1 Ch. 10", "Local fire prevention code"],
    pitfalls: [
      "Pit within 10-15 ft of structure or combustibles (varies by AHJ).",
      "Built into wood deck.",
      "No spark screen where required.",
    ],
  },
  {
    id: "exterior-fireplace",
    title: "Exterior Fireplace",
    trade: "General Contractors", category: "Residential",
    excerpt: "Masonry or prefabricated exterior fireplace — wood or gas.",
    documents: [
      { name: "Site Plan", description: "Setbacks, clearances.", status: "Required" },
      { name: "Structural Engineering or Manufacturer Specs", description: "Footer, chimney support.", status: "Required" },
      { name: "Gas Plan", description: "If gas-fired.", status: "Conditional" },
      { name: "Chimney Height & Termination", description: "Per code.", status: "Required" },
    ],
    inspections: [
      { name: "Footer", confirm: "Depth, rebar." },
      { name: "Framing / Chimney", confirm: "Clearances, lining." },
      { name: "Rough Gas (if applicable)", confirm: "Pressure test." },
      { name: "Final", confirm: "Spark arrestor, clearances, gas operational." },
    ],
    codes: ["FBC-R 1003 — Masonry Fireplaces", "FBC Fuel Gas (if gas)", "NFPA 211 — Chimneys & Fireplaces"],
    pitfalls: [
      "Chimney height below 2 ft above any point within 10 ft.",
      "Missing spark arrestor.",
      "Wood-burning hearth too small.",
    ],
  },
  {
    id: "built-in-bbq",
    title: "Built-in BBQ / Grill",
    trade: "Specialty", category: "Residential",
    excerpt: "Built-in grill within masonry surround — gas connection and clearance.",
    documents: [
      { name: "Manufacturer Specs", description: "Clearances to combustibles, BTU.", status: "Required" },
      { name: "Gas Plan", description: "Pipe sizing, shutoff.", status: "Required" },
      { name: "Masonry Detail", description: "Non-combustible surround per manufacturer.", status: "Required" },
    ],
    inspections: [
      { name: "Rough Gas Pressure Test", confirm: "Held pressure." },
      { name: "Final", confirm: "Clearances per manufacturer, shutoff accessible." },
    ],
    codes: ["FBC Fuel Gas", "NFPA 54", "Manufacturer install manual"],
    pitfalls: [
      "Grill insert too close to combustible surround.",
      "No ventilation cutouts per manufacturer.",
      "Shutoff buried inside masonry.",
    ],
  },
  {
    id: "summer-kitchen",
    title: "Summer Kitchen Permit",
    trade: "General Contractors", category: "Residential",
    excerpt: "Permit category for outdoor 'summer kitchen' — counter, sink, sometimes refrigeration, often without gas.",
    documents: [
      { name: "Site Plan & Plans", description: "Footprint, appliances, plumbing.", status: "Required" },
      { name: "Plumbing Plan", description: "Sink, drain, water supply, backflow if irrigation tie-in.", status: "Required" },
      { name: "Electrical Plan", description: "GFCI receptacles, fridge circuit.", status: "Required" },
      { name: "HOA Approval", description: "Often required.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough Plumbing", confirm: "Drain, water test." },
      { name: "Rough Electrical", confirm: "GFCI." },
      { name: "Final", confirm: "All fixtures operational." },
    ],
    codes: ["FBC Plumbing", "NEC 210.8", "Local zoning"],
    pitfalls: [
      "Sink drain run to grade instead of sanitary sewer.",
      "Non-GFCI receptacles.",
      "Indoor refrigerator used outdoors.",
    ],
  },
  {
    id: "outdoor-bar",
    title: "Outdoor Bar / Countertop",
    trade: "Specialty", category: "Residential",
    excerpt: "Outdoor bar counter with optional sink, ice maker, refrigeration.",
    documents: [
      { name: "Site Plan", description: "Footprint, utility runs.", status: "Required" },
      { name: "Plumbing Detail", description: "If sink or ice maker.", status: "Conditional" },
      { name: "Electrical Detail", description: "GFCI receptacles, dedicated circuit for fridge.", status: "Required" },
      { name: "Structural Detail (if integral roof/cover)", description: "Engineered per cover.", status: "Conditional" },
    ],
    inspections: [
      { name: "Rough MEP", confirm: "As applicable." },
      { name: "Final", confirm: "All equipment operational, GFCI tested." },
    ],
    codes: ["FBC Plumbing", "NEC 210.8", "FBC Mechanical (ventilation if applicable)"],
    pitfalls: [
      "Ice maker drain to grade.",
      "Indoor-rated appliances outdoors.",
      "No GFCI on receptacles.",
    ],
  },
];
