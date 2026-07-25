// Additional commercial project guides — batch 2.
import type { PortalGuide, GuideDoc, GuideDownload, PlanReviewItem, InspectionPhase } from "./portal-guides-data";

const REVIEWED = "Reviewed by Flōridian permitting staff — July 2026";

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

const D_STAMPED_PLUMBING: GuideDoc = { name: "Sealed Plumbing Plans", description: "Plumbing plans sealed by a Florida-registered design professional.", required: "always" };
const D_STAMPED_PLANS = (scope: string): GuideDoc => ({ name: "Construction Plans Sealed by a Florida Registered Design Professional", description: `${scope} plans sealed by a Florida-registered design professional.`, required: "always" });
const D_SURVEY: GuideDoc = { name: "Site Plan / Survey", description: "Surveyed site plan showing property boundaries, setbacks, and improvement locations.", required: "always" };

// ---------- 1. Commercial Plumbing Only ----------
const COMMERCIAL_PLUMBING_ONLY: PortalGuide = {
  slug: "commercial-plumbing-only",
  category: "Commercial",
  title: "Commercial Plumbing Only",
  docCount: 1,
  inspectionCount: 9,
  lastUpdated: REVIEWED,
  summary: "Commercial plumbing-only scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Sealed Plumbing Plans", description: "Plumbing plans sealed by a Florida-registered design professional.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Re-pipe materials and scope", kind: "CODE", description: "Re-pipe scope must show approved materials, routing, and fixture count consistent with DWV sizing.", code: "FBC-P 603 · FBC-P 709" },
    { title: "Backflow prevention", kind: "CODE", description: "Backflow prevention required at well, irrigation, or other cross-connections per FBC-P 608.", code: "FBC-P 608" },
    { title: "Plan review applicability", kind: "DOCUMENTATION", description: "Plan review is not required for minor plumbing repairs (Exemption #3).", code: "FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Rough Plumbing", title: "Supply pipe sizing and material", kind: "CRITICAL", check: "Verify supply pipe sizes and material match approved plans", refs: "FBC-P 604.1" },
    { phase: "Rough Plumbing", title: "DWV pipe sizing and slope", kind: "CRITICAL", check: "Verify drain, waste, and vent pipe sizes and slope per plans", refs: "FBC-P 704.1" },
    { phase: "Rough Plumbing", title: "Pipe support and hanging", kind: "CRITICAL", check: "Verify pipes are properly supported at required intervals", refs: "FBC-P 308.1" },
    { phase: "Rough Plumbing", title: "Vent termination locations", kind: "REQUIRED", check: "Verify vent pipes terminate properly through roof", refs: "FBC-P 903.1" },
    { phase: "Rough Plumbing", title: "Water heater rough-in", kind: "REQUIRED", check: "Verify water heater location, drain pan, and connections per plans", refs: "FBC-P 607.1" },
    { phase: "Final Plumbing", title: "Fixture installation and operation", kind: "CRITICAL", check: "Verify all plumbing fixtures are installed, connected, and operational", refs: "FBC-P 405.1" },
    { phase: "Final Plumbing", title: "Water heater installation", kind: "CRITICAL", check: "Verify water heater is properly installed with TPR valve, drain pan, and discharge pipe", refs: "FBC-P 607.1" },
    { phase: "Final Plumbing", title: "No visible leaks", kind: "CRITICAL", check: "Verify no leaks at any supply or drain connection", refs: "FBC-P 312.1" },
    { phase: "Final Plumbing", title: "Hose bibbs and exterior plumbing", kind: "REQUIRED", check: "Verify exterior hose bibbs have backflow prevention", refs: "FBC-P 608.15.4.2" },
  ]),
};

// ---------- 2. Commercial Pool Construction ----------
const COMMERCIAL_POOL_CONSTRUCTION: PortalGuide = {
  slug: "commercial-pool-construction",
  category: "Commercial",
  title: "Commercial Pool Construction",
  docCount: 5,
  inspectionCount: 45,
  lastUpdated: REVIEWED,
  summary: "Commercial in-ground pool construction under the private provider program (FL Statute §553.791).",
  documents: [
    D_STAMPED_PLANS("Structural and architectural"),
    { name: "TDH Calculations", description: "Total dynamic head calculations for the pool circulation system.", required: "always" },
    { name: "Equipment Specifications", description: "Manufacturer specifications for all pool equipment including pumps, filters, and heaters.", required: "always" },
    { name: "Site Plan / Survey", description: "Surveyed site plan showing pool location, setbacks, and property boundaries.", required: "always" },
    { name: "Safety Barrier Affidavit", description: "Affidavit confirming pool barrier compliance where required by jurisdiction.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Pool barrier (commercial)", kind: "LIFE SAFETY", description: "Commercial pool barrier per ISPSC 305 and FBC-B 3109.4 including fencing, gates, and alarms as applicable.", code: "ISPSC 305 · FBC-B 3109.4" },
    { title: "Design wind speed & exposure", kind: "LIFE SAFETY", description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-B 1609 · ASCE 7-22" },
    { title: "Accessibility scoping (FBC-A)", kind: "CODE", description: "Alteration or new commercial work triggers accessibility requirements in altered areas and along path of travel.", code: "FBC-A 202 · FBC-A 206 · FBC-B 3411" },
    { title: "Engineer of record seal", kind: "DOCUMENTATION", description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
    { title: "Equipotential bonding (commercial pool)", kind: "LIFE SAFETY", description: "Commercial pool equipotential bonding grid per NEC 680.26.", code: "NEC 680.26" },
    { title: "GFCI / luminaires / disconnects (commercial pool)", kind: "LIFE SAFETY", description: "Pool circuits must include GFCI protection; underwater luminaires and motor disconnects per NEC 680.", code: "NEC 680" },
    { title: "Suction entrapment / VGBA (commercial pool)", kind: "LIFE SAFETY", description: "Commercial pool must comply with VGBA suction entrapment prevention.", code: "VGBA · ISPSC 310" },
  ]),
  inspections: mkInsp([
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Rebar grid spacing and size", kind: "CRITICAL", check: "Verify rebar size and spacing match approved plans", refs: "ISPSC 307.2 · FBC-R R506.2.4" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Pool excavation and formwork", kind: "CRITICAL", check: "Verify pool shape, dimensions, and formwork match approved plans", refs: "ISPSC 307.2.1" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Pool depth verification", kind: "CRITICAL", check: "Confirm pool depth matches approved plans at shallow and deep ends", refs: "ISPSC 307.2" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Bonding grid perimeter wire", kind: "CRITICAL", check: "Verify copper bonding wire is installed around pool perimeter per NEC", refs: "NEC 680.26" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Bonding grid to pool steel connections", kind: "CRITICAL", check: "Verify bonding wire is connected to pool steel reinforcement", refs: "NEC 680.26(B)" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Bonding of metallic components within 5 feet", kind: "CRITICAL", check: "Verify all metallic components within 5 feet of pool edge are bonded", refs: "NEC 680.26(B)" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Deck reinforcement layout", kind: "CRITICAL", check: "Verify deck rebar spacing, overlap, and placement per plans", refs: "ISPSC 306.1 · FBC-R R506.2.4" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Deck bonding wire", kind: "CRITICAL", check: "Verify bonding wire is attached to reinforcement steel in deck area", refs: "NEC 680.26(B)" },
    { phase: "Phase 1 — Footing, Slab, UFER (Building)", title: "Plumbing and electrical conduit in place", kind: "REQUIRED", check: "Verify plumbing lines and electrical conduit are installed prior to pour", refs: "FBC-B 110.3" },
    { phase: "Phase 2 — Underground Plumbing", title: "Pipe installation and support", kind: "CRITICAL", check: "Verify plumbing lines are properly installed and supported per plans", refs: "FBC-P 305.1" },
    { phase: "Phase 2 — Underground Plumbing", title: "Burial depth", kind: "CRITICAL", check: "Verify underground pipe burial depth meets code minimum", refs: "FBC-P 305.5" },
    { phase: "Phase 2 — Underground Plumbing", title: "Pressure test", kind: "CRITICAL", check: "Verify plumbing system holds required pressure test", refs: "FBC-P 312.2" },
    { phase: "Phase 2 — Underground Plumbing", title: "Distance from pool edge", kind: "CRITICAL", check: "Verify plumbing lines maintain required distance from pool edge per code", refs: "ISPSC 307.2" },
    { phase: "Phase 2 — Underground Plumbing", title: "Pipe sizing per plans", kind: "REQUIRED", check: "Verify pipe sizes match approved plans", refs: "FBC-P 604.1" },
    { phase: "Phase 3 — Underground Electrical", title: "Conduit and wiring installation", kind: "CRITICAL", check: "Verify electrical conduit and wiring are properly installed per plans", refs: "NEC 680.11" },
    { phase: "Phase 3 — Underground Electrical", title: "Burial depth verification", kind: "CRITICAL", check: "Verify conduit burial depth meets minimum code requirements", refs: "NEC 680.11(A)" },
    { phase: "Phase 3 — Underground Electrical", title: "Distance from pool edge", kind: "CRITICAL", check: "Verify electrical lines maintain required distance from pool edge", refs: "NEC 680.11" },
    { phase: "Phase 3 — Underground Electrical", title: "Bonding connections at underground", kind: "CRITICAL", check: "Verify bonding continuity at all underground electrical connections", refs: "NEC 680.26" },
    { phase: "Phase 4 — Rough Plumbing", title: "Deck drain installation", kind: "CRITICAL", check: "Verify deck drains are installed with proper slope away from pool", refs: "ISPSC 306.5.1" },
    { phase: "Phase 4 — Rough Plumbing", title: "Equipment pad plumbing connections", kind: "CRITICAL", check: "Verify plumbing connections at pump, filter, and heater locations", refs: "ISPSC 308" },
    { phase: "Phase 4 — Rough Plumbing", title: "Suction outlet compliance", kind: "CRITICAL", check: "Verify suction outlets meet entrapment avoidance requirements", refs: "ISPSC 307.1" },
    { phase: "Phase 4 — Rough Plumbing", title: "Deck slope and drainage direction", kind: "REQUIRED", check: "Verify deck slopes drain away from pool or toward deck drains", refs: "ISPSC 306.5" },
    { phase: "Phase 5 — Rough Electrical", title: "Equipment wiring", kind: "CRITICAL", check: "Verify electrical wiring to pump, filter, heater per plans", refs: "NEC 680.21" },
    { phase: "Phase 5 — Rough Electrical", title: "GFCI protection", kind: "CRITICAL", check: "Verify GFCI-protected outlets and circuits in pool area", refs: "NEC 680.22" },
    { phase: "Phase 5 — Rough Electrical", title: "Receptacle locations and distances", kind: "CRITICAL", check: "Verify receptacle placement meets minimum distance requirements from pool", refs: "NEC 680.22(A)" },
    { phase: "Phase 5 — Rough Electrical", title: "Equipment bonding", kind: "CRITICAL", check: "Verify bonding wire connections at all pool equipment", refs: "NEC 680.26(B)" },
    { phase: "Phase 6 — Final Building", title: "Overall pool construction", kind: "CRITICAL", check: "Verify completed pool including decking matches approved plans", refs: "ISPSC 307.2" },
    { phase: "Phase 6 — Final Building", title: "Barrier height", kind: "CRITICAL", check: "Verify barrier is minimum 48 inches above grade on outside face", refs: "ISPSC 305.2.1" },
    { phase: "Phase 6 — Final Building", title: "Gate latch height", kind: "CRITICAL", check: "Verify gate latch release mechanism is at 54 inches from grade on pool side", refs: "ISPSC 305.3.3" },
    { phase: "Phase 6 — Final Building", title: "Gate self-closing and self-latching", kind: "CRITICAL", check: "Verify gates are self-closing and self-latching", refs: "ISPSC 305.3" },
    { phase: "Phase 6 — Final Building", title: "Barrier openings", kind: "CRITICAL", check: "Verify no opening in barrier allows passage of 4-inch sphere", refs: "ISPSC 305.2.2" },
    { phase: "Phase 6 — Final Building", title: "Deck condition and edges", kind: "REQUIRED", check: "Verify deck surface is slip-resistant with radiused edges", refs: "ISPSC 306.2 · ISPSC 306.8" },
    { phase: "Phase 6 — Final Building", title: "Equipment labels visible", kind: "REQUIRED", check: "Verify visible equipment labels on pumps, filters, heaters", refs: "FBC-B 110.3" },
    { phase: "Phase 6 — Final Building", title: "Emergency shut-off switch", kind: "REQUIRED", check: "Verify emergency shut-off switch is installed where required", refs: "NEC 680.12" },
    { phase: "Phase 6 — Final Building", title: "Pool alarm / dwelling-wall protection", kind: "CRITICAL", check: "Where any wall of the dwelling forms part of the pool barrier, verify ONE of three compliance methods is installed: exit alarms on all direct-access doors/windows, self-closing self-latching devices on all direct-access doors, or a certified in-pool alarm. Confirm method matches what was specified on approved plans. Skip if entire barrier is freestanding fence/screen with no dwelling wall participation.", refs: "FBC-R R4501.17.1.9" },
    { phase: "Phase 7 — Final Electrical", title: "Pool light installation", kind: "CRITICAL", check: "Verify pool lights are properly installed per plans and NEC", refs: "NEC 680.23" },
    { phase: "Phase 7 — Final Electrical", title: "Equipotential bonding complete", kind: "CRITICAL", check: "Verify bonding of all required metallic components within 5 feet of pool", refs: "NEC 680.26(B)" },
    { phase: "Phase 7 — Final Electrical", title: "GFCI protection operational", kind: "CRITICAL", check: "Verify all required circuits in pool area have GFCI protection and test", refs: "NEC 680.22" },
    { phase: "Phase 7 — Final Electrical", title: "Grounding connections", kind: "CRITICAL", check: "Verify grounding connections at all pool equipment", refs: "NEC 680.25" },
    { phase: "Phase 7 — Final Electrical", title: "Disconnect switch", kind: "CRITICAL", check: "Verify equipment disconnect switch is accessible and properly rated", refs: "NEC 680.12" },
    { phase: "Phase 8 — Final Plumbing", title: "Pump and filter operation", kind: "CRITICAL", check: "Verify pump and filter are operational and properly installed", refs: "ISPSC 308" },
    { phase: "Phase 8 — Final Plumbing", title: "Drain covers and suction safety", kind: "CRITICAL", check: "Verify main drain covers are compliant and properly secured", refs: "ISPSC 307.1" },
    { phase: "Phase 8 — Final Plumbing", title: "Skimmer installation", kind: "REQUIRED", check: "Verify skimmers are properly installed and functional", refs: "ISPSC 307.2" },
    { phase: "Phase 8 — Final Plumbing", title: "Heater installation", kind: "REQUIRED", check: "If heater present, verify installation per manufacturer specs", refs: "ISPSC 303.1.1" },
    { phase: "Phase 8 — Final Plumbing", title: "Backflow prevention", kind: "CRITICAL", check: "Verify backflow prevention device is installed on water supply", refs: "FBC-P 608.1" },
  ]),
};

// ---------- 3. Commercial Pre-Manufactured Shed Installation ----------
const COMMERCIAL_PREMANUFACTURED_SHED: PortalGuide = {
  slug: "commercial-pre-manufactured-shed-installation",
  category: "Commercial",
  title: "Commercial Pre-Manufactured Shed Installation",
  docCount: 2,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Installation of a pre-manufactured shed on a commercial site under the private provider program.",
  documents: [
    { name: "Manufacturer Plan Specifications", description: "Manufacturer plan/spec package including wind load criteria and anchor method.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and shed location.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Footing / Foundation Design", kind: "LIFE SAFETY", description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { title: "Attachment to Existing Structure", kind: "LIFE SAFETY", description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { title: "Florida Product Approval", kind: "CODE", description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products.", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { title: "Plan Review Applicability", kind: "DOCUMENTATION", description: "Per FBC-B 107.3.5, pre-manufactured / prototype plans are exempt except for local site adaptation, foundations, and modifications.", code: "FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Phase 1", title: "Footing, Slab, UFER", kind: "CONDITIONAL", check: "Inspection criteria coming soon — your FCC inspector will walk you through this inspection on-site.", refs: "See on-site inspector" },
    { phase: "Phase 2", title: "Final Building", kind: "REQUIRED", check: "Inspection criteria coming soon — your FCC inspector will walk you through this inspection on-site.", refs: "See on-site inspector" },
  ]),
};

// ---------- 4. Commercial Re-Pipe ----------
const COMMERCIAL_REPIPE: PortalGuide = {
  slug: "commercial-re-pipe",
  category: "Commercial",
  title: "Commercial Re-Pipe",
  docCount: 1,
  inspectionCount: 3,
  lastUpdated: REVIEWED,
  summary: "Commercial re-pipe scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Sealed Plumbing Plans", description: "Sealed plumbing plans showing approved materials, routing, and fixture count.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Re-pipe materials and scope", kind: "CODE", description: "Re-pipe scope must show approved materials, routing, and fixture count consistent with DWV sizing.", code: "FBC-P 603 · FBC-P 709" },
    { title: "Backflow prevention", kind: "CODE", description: "Backflow prevention required at well, irrigation, or other cross-connections per FBC-P 608.", code: "FBC-P 608" },
    { title: "Plan review applicability (FBC 107.3.5)", kind: "DOCUMENTATION", description: "Per statute, plan review not required for minor plumbing repairs; FCC reviews when building department requests or client opts in.", code: "FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Final Plumbing", title: "Fixture operation", kind: "CRITICAL", check: "Verify all fixtures have proper hot and cold water flow with no leaks", refs: "FBC-P 405.1" },
    { phase: "Final Plumbing", title: "No visible leaks", kind: "CRITICAL", check: "Verify no leaks at any new connection point under normal pressure", refs: "FBC-P 312.1" },
    { phase: "Final Plumbing", title: "Wall and ceiling patches", kind: "REQUIRED", check: "Verify access points are properly patched and finished", refs: "FBC-B 110.3" },
  ]),
};

// ---------- 5. Commercial Re-Roof ----------
const COMMERCIAL_REROOF: PortalGuide = {
  slug: "commercial-re-roof",
  category: "Commercial",
  title: "Commercial Re-Roof",
  docCount: 4,
  inspectionCount: 10,
  lastUpdated: REVIEWED,
  summary: "Commercial re-roof scope under the private provider program (FL Statute §553.791).",
  documents: [
    D_STAMPED_PLANS("Roofing"),
    { name: "Product Approvals", description: "Florida Product Approvals for underlayment and roofing materials.", required: "always" },
    { name: "Roof Sheathing & Dry-In Affidavit", description: "Signed affidavit for roof sheathing and dry-in inspection compliance.", required: "always" },
    { name: "Structural Engineer Verification", description: "Structural engineer verification that the new roofing system does not exceed existing structural capacity. Required if the new roofing system results in a weight increase of more than 10% over the existing system.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Attachment to existing structure", kind: "LIFE SAFETY", description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { title: "Florida product approval", kind: "CODE", description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration, structural panels, covering systems).", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { title: "Plan review applicability (FBC 107.3.5)", kind: "DOCUMENTATION", description: "Per FBC-B 107.3.5, plan review is not required for reroofs (Exemption #2). FCC performs this review only when the building department requires plan review or the client opts in.", code: "FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Roof Dry In, In Progress", title: "Underlayment installation", kind: "CRITICAL", check: "Verify roof underlayment type and installation per code and manufacturer specs", refs: "FBC-R R905.1.1" },
    { phase: "Roof Dry In, In Progress", title: "Drip edge installation", kind: "CRITICAL", check: "Verify drip edge is installed at eaves and rakes", refs: "FBC-R R905.2.8.5" },
    { phase: "Roof Dry In, In Progress", title: "Valley and flashing", kind: "CRITICAL", check: "Verify valley flashing and wall flashing are properly installed", refs: "FBC-R R903.2" },
    { phase: "Roof Dry In, In Progress", title: "Roof penetration sealing", kind: "REQUIRED", check: "Verify all roof penetrations are properly sealed and flashed", refs: "FBC-R R903.2" },
    { phase: "Roof Dry In, In Progress", title: "Deck condition", kind: "CRITICAL", check: "Verify roof deck is in acceptable condition and any damaged sheathing has been replaced", refs: "FBC-R R803.1" },
    { phase: "Roof Final", title: "Roofing material installation", kind: "CRITICAL", check: "Verify roofing material is installed per manufacturer specs and approved plans", refs: "FBC-R R905.2" },
    { phase: "Roof Final", title: "Flashing completeness", kind: "CRITICAL", check: "Verify all flashing is complete at walls, valleys, penetrations, and edges", refs: "FBC-R R903.2" },
    { phase: "Roof Final", title: "Ridge vent or ventilation", kind: "REQUIRED", check: "Verify roof ventilation is installed per plans", refs: "FBC-R R806.1" },
    { phase: "Roof Final", title: "Nailing pattern compliance", kind: "CRITICAL", check: "Verify roofing material nailing pattern meets high-wind requirements", refs: "FBC-R R905.2" },
    { phase: "Roof Final", title: "Cleanup and debris removal", kind: "REQUIRED", check: "Verify job site is clean with no exposed nails or debris in gutters", refs: "FBC-B 110.3" },
  ]),
};

// ---------- 6. Commercial Remodel ----------
const COMMERCIAL_REMODEL: PortalGuide = {
  slug: "commercial-remodel",
  category: "Commercial",
  title: "Commercial Remodel",
  docCount: 3,
  inspectionCount: 12,
  lastUpdated: REVIEWED,
  summary: "Commercial remodel scope under the private provider program (FL Statute §553.791).",
  documents: [
    D_STAMPED_PLANS("Construction"),
    { name: "Scope of Work Description", description: "Very detailed written scope of work describing all work to be performed.", required: "always" },
    { name: "Product Approvals", description: "Florida Product Approvals for any regulated components being installed. Required if installing new windows, doors, roofing, or other regulated products.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Occupancy Classification", kind: "LIFE SAFETY", description: "Occupancy group must be clearly stated. Any change of occupancy requires FBC-EB Ch. 10 compliance path.", code: "FBC-B 302 · FBC-EB Ch. 10" },
    { title: "Fire Protection Systems", kind: "LIFE SAFETY", description: "Sprinkler coverage, alarm coverage, and emergency egress lighting required per occupancy.", code: "FBC-B 903 · FBC-B 907 · FBC-B 1008" },
    { title: "Means of Egress Capacity", kind: "LIFE SAFETY", description: "Occupant load, egress width, travel distance, and number of exits must comply with FBC-B Ch. 10.", code: "FBC-B 1004 · 1005 · 1006 · 1017" },
    { title: "Structural Alterations", kind: "LIFE SAFETY", description: "Wall removal, added openings, or roof alteration require engineered documentation per FBC-EB.", code: "FBC-B 1603 · FBC-EB Ch. 4" },
    { title: "Accessibility Scoping", kind: "CODE", description: "Alteration or new commercial work triggers accessibility requirements in altered areas and along path of travel.", code: "FBC-A 202, 206 · FBC-B 3411" },
  ]),
  inspections: [
    { phase: "Phase 1", code: "001", title: "Rough Framing", tags: ["Required", "Critical"], checks: [
      "Wall stud spacing and size — FBC-R R602.3, R602.3.1",
      "Headers and beams — FBC-R R602.7",
      "Top and bottom plate connections — FBC-R R602.3.2",
      "Corner and intersection bracing — FBC-R R602.10",
      "Window and door rough openings — FBC-R R602.7",
      "Hurricane straps and hold-downs — FBC-R R802.11",
      "Fire blocking — FBC-R R602.8",
    ], refs: "FBC-R R602 · R802" },
    { phase: "Phase 2", code: "002", title: "Roof Dry In, In Progress", tags: ["Required", "Critical"], checks: [
      "Underlayment installation — FBC-R R905.1.1",
      "Drip edge installation — FBC-R R905.2.8.5",
      "Valley and flashing — FBC-R R903.2",
      "Roof penetration sealing — FBC-R R903.2",
    ], refs: "FBC-R R903 · R905" },
    { phase: "Phase 3", code: "003", title: "Rough Plumbing", tags: ["Required", "Critical"], checks: [
      "Supply pipe sizing and material — FBC-P 604.1",
      "DWV pipe sizing and slope — FBC-P 704.1",
      "Pipe support and hanging — FBC-P 308.1",
      "Vent termination locations — FBC-P 903.1",
      "Water heater rough-in — FBC-P 607.1",
    ], refs: "FBC-P 308 · 604 · 704 · 903" },
    { phase: "Phase 4", code: "004", title: "Rough Electrical", tags: ["Required", "Critical"], checks: [
      "Panel installation — NEC 408.4",
      "Wire sizing per circuits — NEC 210.3, 240.4",
      "Box fill and installation — NEC 314.16",
      "GFCI and AFCI locations — NEC 210.8, 210.12",
      "Smoke and CO alarm wiring — FBC-R R314.3, R315",
      "Grounding and bonding — NEC 250.50",
    ], refs: "NEC 210 · 240 · 250 · 314 · 408 · FBC-R R314, R315" },
    { phase: "Phase 5", code: "005", title: "Rough Mechanical/HVAC", tags: ["Required", "Critical"], checks: [
      "Ductwork installation — FBC-M 603.1",
      "Duct sealing — FBC-M 603.9",
      "Equipment placement — FBC-M 304.1",
      "Refrigerant line installation — FBC-M 1101.3",
      "Return air pathway — FBC-M 601.2",
    ], refs: "FBC-M 304 · 601 · 603 · 1101" },
    { phase: "Phase 6", code: "006", title: "Insulation", tags: ["Required", "Critical"], checks: [
      "Wall cavity insulation R-value — FBC-E R402.1",
      "Ceiling/attic insulation R-value — FBC-E R402.1",
      "Insulation coverage and gaps — FBC-E R402.4",
      "Air sealing — FBC-E R402.4.1",
    ], refs: "FBC-E R402" },
    { phase: "Phase 7", code: "007", title: "Lathe, Siding", tags: ["Required", "Critical"], checks: [
      "Wall covering material and installation — FBC-R R703.1",
      "Weather-resistive barrier — FBC-R R703.2",
      "Flashing at penetrations and transitions — FBC-R R703.4",
      "Fastener pattern and spacing — FBC-R R703.1",
    ], refs: "FBC-R R703" },
    { phase: "Phase 8", code: "008", title: "Drywall", tags: ["Required", "Critical"], checks: [
      "Drywall thickness and type — FBC-R R702.3.1",
      "Fastener spacing — FBC-R R702.3.5",
      "Fire-rated assemblies — FBC-R R302.6",
      "Moisture barrier in wet areas — FBC-R R702.4",
    ], refs: "FBC-R R302 · R702" },
    { phase: "Phase 9", code: "009", title: "Final Electrical", tags: ["Required", "Critical"], checks: [
      "Panel complete and labeled — NEC 408.4",
      "GFCI and AFCI operational — NEC 210.8, 210.12",
      "Receptacle and switch function — NEC 210.52",
      "Light fixtures installed — NEC 210.70",
      "Exterior lighting and outlets — NEC 210.8, 210.52(E)",
    ], refs: "NEC 210 · 408" },
    { phase: "Phase 10", code: "010", title: "Final Plumbing", tags: ["Required", "Critical"], checks: [
      "Fixture installation and operation — FBC-P 405.1",
      "Water heater installation — FBC-P 607.1",
      "No visible leaks — FBC-P 312.1",
      "Hose bibbs and exterior plumbing — FBC-P 608.15.4.2",
    ], refs: "FBC-P 312 · 405 · 607 · 608" },
    { phase: "Phase 11", code: "011", title: "Final Mechanical/HVAC", tags: ["Required", "Critical"], checks: [
      "System operational test — FBC-M 304.1",
      "Air handler and condenser installation — FBC-M 304.1",
      "Condensate drain — FBC-M 307.2",
      "Duct registers and grilles — FBC-M 601.2",
      "Equipment labels and data plates — FBC-M 304.1",
    ], refs: "FBC-M 304 · 307 · 601" },
    { phase: "Phase 12", code: "012", title: "Final Building", tags: ["Required", "Critical"], checks: [
      "Egress doors and hardware — FBC-R R311.2",
      "Smoke alarms installed and operational — FBC-R R314.3",
      "CO alarms installed — FBC-R R315",
      "Emergency escape openings — FBC-R R310.1",
      "Stairway compliance — FBC-R R311.7",
      "Address numbers visible — FBC-R R319.1",
      "Exterior finishes complete — FBC-R R703.1",
      "Site grading and drainage — FBC-R R401.3",
    ], refs: "FBC-R R310 · R311 · R314 · R315 · R319 · R401 · R703" },
  ],
};

// ---------- 7. Commercial Retaining Wall ----------
const COMMERCIAL_RETAINING_WALL: PortalGuide = {
  slug: "commercial-retaining-wall",
  category: "Commercial",
  title: "Commercial Retaining Wall",
  docCount: 2,
  inspectionCount: 14,
  lastUpdated: REVIEWED,
  summary: "Commercial retaining wall scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional showing retaining wall layout, dimensions, reinforcement, and drainage.", required: "always" },
    D_SURVEY,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Wall height, surcharge, and geotechnical assumptions", kind: "LIFE SAFETY", description: "Retaining wall design must address wall height, soil type, surcharge load (traffic/structure), and drainage.", code: "FBC-B 1807.2 · FBC-R R404" },
    { title: "Footing / foundation design", kind: "LIFE SAFETY", description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { title: "Engineer of record seal", kind: "DOCUMENTATION", description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Footing, Slab, UFER", title: "Footing dimensions", kind: "CRITICAL", check: "Verify footing width and depth match approved plans", refs: "FBC-R R403.1 · FBC-R R403.1.1" },
    { phase: "Footing, Slab, UFER", title: "Rebar size and spacing", kind: "CRITICAL", check: "Verify rebar size, spacing, and placement per plans", refs: "FBC-R R403.1" },
    { phase: "Footing, Slab, UFER", title: "UFER grounding electrode", kind: "CRITICAL", check: "Verify minimum 20 feet of #4 bare copper or rebar is encased in footing", refs: "NEC 250.52(A)(3)" },
    { phase: "Footing, Slab, UFER", title: "Slab vapor barrier", kind: "CRITICAL", check: "Verify vapor barrier installed under slab per plans", refs: "FBC-R R506.2.3" },
    { phase: "Footing, Slab, UFER", title: "Slab thickness and wire mesh", kind: "CRITICAL", check: "Verify slab thickness and reinforcement per plans", refs: "FBC-R R506.1" },
    { phase: "Footing, Slab, UFER", title: "Foundation anchorage layout", kind: "REQUIRED", check: "Verify anchor bolt placement for sill plate attachment", refs: "FBC-R R403.1.6" },
    { phase: "Final Building", title: "Egress doors and hardware", kind: "CRITICAL", check: "Verify egress doors provide minimum 32-inch clear width and proper hardware", refs: "FBC-R R311.2" },
    { phase: "Final Building", title: "Smoke alarms installed and operational", kind: "CRITICAL", check: "Verify smoke alarms in each bedroom, outside sleeping areas, and each level", refs: "FBC-R R314.3" },
    { phase: "Final Building", title: "CO alarms installed", kind: "CRITICAL", check: "Verify carbon monoxide alarms where required", refs: "FBC-R R315" },
    { phase: "Final Building", title: "Emergency escape openings", kind: "CRITICAL", check: "Verify bedroom windows meet egress size requirements", refs: "FBC-R R310.1" },
    { phase: "Final Building", title: "Stairway compliance", kind: "CRITICAL", check: "Verify stair rise, run, handrail height, and landing dimensions", refs: "FBC-R R311.7" },
    { phase: "Final Building", title: "Address numbers visible", kind: "REQUIRED", check: "Verify address numbers posted and visible from street", refs: "FBC-R R319.1" },
    { phase: "Final Building", title: "Exterior finishes complete", kind: "REQUIRED", check: "Verify exterior cladding, trim, and weatherproofing complete", refs: "FBC-R R703.1" },
    { phase: "Final Building", title: "Site grading and drainage", kind: "REQUIRED", check: "Verify finish grade slopes away from foundation minimum 6 inches in 10 feet", refs: "FBC-R R401.3" },
  ]),
};

// ---------- 8. Commercial Solar Installation ----------
const COMMERCIAL_SOLAR: PortalGuide = {
  slug: "commercial-solar-installation",
  category: "Commercial",
  title: "Commercial Solar Installation",
  docCount: 2,
  inspectionCount: 9,
  lastUpdated: REVIEWED,
  summary: "Commercial solar installation scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Solar installation plans sealed by a Florida-registered design professional including structural attachment details, equipment specifications, and electrical diagrams.", required: "always" },
    { name: "Site Survey", description: "Site survey or plan showing solar panel layout, roof orientation, and property boundaries.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Structural attachment and uplift (commercial solar)", kind: "LIFE SAFETY", description: "Commercial solar racking designed for wind uplift.", code: "FBC-B 1607.13 · ASCE 7" },
    { title: "Roof load and fire access (commercial solar)", kind: "LIFE SAFETY", description: "Commercial roof must support solar array; fire access pathways per jurisdiction.", code: "FBC-B 1603 · NFPA 1" },
    { title: "Engineer of record seal", kind: "DOCUMENTATION", description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
    { title: "PV disconnect, RSD, and labeling (commercial)", kind: "LIFE SAFETY", description: "Commercial PV disconnects per NEC 690.13 and RSD per 690.12.", code: "NEC 690.12 · NEC 690.13" },
    { title: "Grounding and interconnection (commercial solar)", kind: "LIFE SAFETY", description: "Commercial PV grounding and interconnection per NEC 690/705.", code: "NEC 690 · NEC 705.12" },
  ]),
  inspections: mkInsp([
    { phase: "Rough Electrical", title: "Mounting and racking system", kind: "CRITICAL", check: "Verify solar panel mounting and racking system is installed per engineered plans with proper roof attachment", refs: "FBC-B 1603.1 · FBC-R R324.4" },
    { phase: "Rough Electrical", title: "Electrical conduit and wiring", kind: "CRITICAL", check: "Verify conduit routing, wire sizing, and connections per approved plans and NEC", refs: "NEC 690.31 · NEC 690.8" },
    { phase: "Rough Electrical", title: "Grounding and bonding", kind: "CRITICAL", check: "Verify equipment grounding conductor and bonding of all metallic racking components", refs: "NEC 690.43 · NEC 690.47" },
    { phase: "Rough Electrical", title: "Rapid shutdown compliance", kind: "CRITICAL", check: "Verify rapid shutdown system is installed and labeled per NEC", refs: "NEC 690.12" },
    { phase: "Rough Electrical", title: "Roof penetration waterproofing", kind: "CRITICAL", check: "Verify all roof penetrations are properly flashed and sealed", refs: "FBC-R R903.2" },
    { phase: "Final Electrical", title: "Panel installation and layout", kind: "CRITICAL", check: "Verify solar panel layout matches approved plans and all panels are secured", refs: "FBC-R R324.4" },
    { phase: "Final Electrical", title: "Inverter installation", kind: "CRITICAL", check: "Verify inverter is properly installed with required clearances and labeling", refs: "NEC 690.8 · NEC 705.12" },
    { phase: "Final Electrical", title: "Disconnect and labeling", kind: "CRITICAL", check: "Verify AC and DC disconnects are installed, accessible, and properly labeled", refs: "NEC 690.13 · NEC 690.56" },
    { phase: "Final Electrical", title: "System operational test", kind: "REQUIRED", check: "Verify system powers on and produces expected output", refs: "NEC 690.1" },
  ]),
};

export const COMMERCIAL_GUIDES_2: PortalGuide[] = [
  COMMERCIAL_PLUMBING_ONLY,
  COMMERCIAL_POOL_CONSTRUCTION,
  COMMERCIAL_PREMANUFACTURED_SHED,
  COMMERCIAL_REPIPE,
  COMMERCIAL_REROOF,
  COMMERCIAL_REMODEL,
  COMMERCIAL_RETAINING_WALL,
  COMMERCIAL_SOLAR,
];
