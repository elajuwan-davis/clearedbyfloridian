// Additional commercial + multi-family project guides — batch 3.
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

const D_STAMPED = (scope: string): GuideDoc => ({
  name: "Construction Plans Sealed by a Florida Registered Design Professional",
  description: `${scope} plans sealed by a Florida-registered design professional.`,
  required: "always",
});
const D_SURVEY: GuideDoc = { name: "Site Plan / Survey", description: "Site plan or survey showing property boundaries, setbacks, and structure footprint.", required: "always" };

// ---------- 1. Commercial Structural Elevation ----------
const COMMERCIAL_STRUCTURAL_ELEVATION: PortalGuide = {
  slug: "commercial-structural-elevation",
  category: "Commercial",
  title: "Commercial Structural Elevation",
  docCount: 4,
  inspectionCount: 61,
  lastUpdated: REVIEWED,
  summary: "Commercial structural elevation scope under the private provider program (FL Statute §553.791).",
  documents: [
    D_STAMPED("Structural engineering"),
    { name: "Survey / Site Plan", description: "Current survey or site plan showing existing and proposed elevations.", required: "always" },
    { name: "Elevation Certificate", description: "FEMA Elevation Certificate — required if property is located in a flood zone.", required: "conditional" },
    { name: "NOAs / Product Approvals", description: "NOAs and/or Florida Product Approvals for applicable components — required if scope includes products/components requiring NOA or Florida Product Approval.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Design wind speed & exposure", kind: "LIFE SAFETY", description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-B 1609 · ASCE 7-22" },
    { title: "Footing / foundation design", kind: "LIFE SAFETY", description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { title: "Elevation design and lateral anchorage", kind: "LIFE SAFETY", description: "Elevated foundation system must be designed for wind, seismic, and flood-loading with continuous lateral-force path.", code: "ASCE 24 · FBC-B 1612 · FBC-R R322" },
    { title: "Engineer of record seal", kind: "DOCUMENTATION", description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Phase 1: Rough Framing", title: "Wall stud spacing and size", kind: "CRITICAL", check: "Verify stud size and spacing match approved plans", refs: "FBC-R R602.3 · FBC-R R602.3.1" },
    { phase: "Phase 1: Rough Framing", title: "Headers and beams", kind: "CRITICAL", check: "Verify header and beam sizes over openings per plans", refs: "FBC-R R602.7" },
    { phase: "Phase 1: Rough Framing", title: "Top and bottom plate connections", kind: "CRITICAL", check: "Verify double top plates with proper lapping and anchored bottom plates", refs: "FBC-R R602.3.2" },
    { phase: "Phase 1: Rough Framing", title: "Corner and intersection bracing", kind: "CRITICAL", check: "Verify proper bracing at corners and wall intersections", refs: "FBC-R R602.10" },
    { phase: "Phase 1: Rough Framing", title: "Window and door rough openings", kind: "CRITICAL", check: "Verify rough openings match approved plans for size and location", refs: "FBC-R R602.7" },
    { phase: "Phase 1: Rough Framing", title: "Hurricane straps and hold-downs", kind: "CRITICAL", check: "Verify hurricane straps and hold-down hardware installed per plans", refs: "FBC-R R802.11" },
    { phase: "Phase 1: Rough Framing", title: "Fire blocking", kind: "REQUIRED", check: "Verify fire blocking is installed at required locations", refs: "FBC-R R602.8" },
    { phase: "Phase 2: Roof Dry In", title: "Underlayment installation", kind: "CRITICAL", check: "Verify roof underlayment is installed per code and manufacturer specs", refs: "FBC-R R905.1.1" },
    { phase: "Phase 2: Roof Dry In", title: "Drip edge installation", kind: "CRITICAL", check: "Verify drip edge is installed at eaves and rakes", refs: "FBC-R R905.2.8.5" },
    { phase: "Phase 2: Roof Dry In", title: "Valley and flashing", kind: "CRITICAL", check: "Verify valley flashing and wall flashing are properly installed", refs: "FBC-R R903.2" },
    { phase: "Phase 2: Roof Dry In", title: "Roof penetration sealing", kind: "REQUIRED", check: "Verify all roof penetrations are properly sealed and flashed", refs: "FBC-R R903.2" },
    { phase: "Phase 3: Rough Plumbing", title: "Supply pipe sizing and material", kind: "CRITICAL", check: "Verify supply pipe sizes and material match approved plans", refs: "FBC-P 604.1" },
    { phase: "Phase 3: Rough Plumbing", title: "DWV pipe sizing and slope", kind: "CRITICAL", check: "Verify drain, waste, and vent pipe sizes and slope per plans", refs: "FBC-P 704.1" },
    { phase: "Phase 3: Rough Plumbing", title: "Pipe support and hanging", kind: "CRITICAL", check: "Verify pipes are properly supported at required intervals", refs: "FBC-P 308.1" },
    { phase: "Phase 3: Rough Plumbing", title: "Vent termination locations", kind: "REQUIRED", check: "Verify vent pipes terminate properly through roof", refs: "FBC-P 903.1" },
    { phase: "Phase 3: Rough Plumbing", title: "Water heater rough-in", kind: "REQUIRED", check: "Verify water heater location, drain pan, and connections per plans", refs: "FBC-P 607.1" },
    { phase: "Phase 4: Rough Electrical", title: "Panel installation", kind: "CRITICAL", check: "Verify electrical panel is properly mounted and sized per plans", refs: "NEC 408.4" },
    { phase: "Phase 4: Rough Electrical", title: "Wire sizing per circuits", kind: "CRITICAL", check: "Verify wire gauge matches breaker amperage for each circuit", refs: "NEC 210.3 · NEC 240.4" },
    { phase: "Phase 4: Rough Electrical", title: "Box fill and installation", kind: "CRITICAL", check: "Verify electrical boxes are properly installed and not overfilled", refs: "NEC 314.16" },
    { phase: "Phase 4: Rough Electrical", title: "GFCI and AFCI locations", kind: "CRITICAL", check: "Verify GFCI and AFCI protection is provided where required", refs: "NEC 210.8 · NEC 210.12" },
    { phase: "Phase 4: Rough Electrical", title: "Smoke and CO alarm wiring", kind: "CRITICAL", check: "Verify interconnected smoke and CO alarm wiring is in place", refs: "FBC-R R314.3 · FBC-R R315" },
    { phase: "Phase 4: Rough Electrical", title: "Grounding and bonding", kind: "CRITICAL", check: "Verify grounding electrode system and bonding connections", refs: "NEC 250.50" },
    { phase: "Phase 5: Rough Mechanical/HVAC", title: "Ductwork installation", kind: "CRITICAL", check: "Verify duct sizes, routing, and support match approved plans", refs: "FBC-M 603.1" },
    { phase: "Phase 5: Rough Mechanical/HVAC", title: "Duct sealing", kind: "CRITICAL", check: "Verify duct joints and connections are properly sealed", refs: "FBC-M 603.9" },
    { phase: "Phase 5: Rough Mechanical/HVAC", title: "Equipment placement", kind: "CRITICAL", check: "Verify air handler and condenser locations per plans with required clearances", refs: "FBC-M 304.1" },
    { phase: "Phase 5: Rough Mechanical/HVAC", title: "Refrigerant line installation", kind: "REQUIRED", check: "Verify refrigerant line sizing and insulation per plans", refs: "FBC-M 1101.3" },
    { phase: "Phase 5: Rough Mechanical/HVAC", title: "Return air pathway", kind: "REQUIRED", check: "Verify return air pathways are properly sized and located", refs: "FBC-M 601.2" },
    { phase: "Phase 6: Insulation", title: "Wall cavity insulation R-value", kind: "CRITICAL", check: "Verify wall insulation R-value matches energy calculations", refs: "FBC-E R402.1" },
    { phase: "Phase 6: Insulation", title: "Ceiling/attic insulation R-value", kind: "CRITICAL", check: "Verify ceiling or attic insulation R-value per energy calculations", refs: "FBC-E R402.1" },
    { phase: "Phase 6: Insulation", title: "Insulation coverage and gaps", kind: "CRITICAL", check: "Verify no gaps, voids, or compression in insulation installation", refs: "FBC-E R402.4" },
    { phase: "Phase 6: Insulation", title: "Air sealing", kind: "REQUIRED", check: "Verify air sealing at penetrations, top plates, and rim joists", refs: "FBC-E R402.4.1" },
    { phase: "Phase 7: Lathe, Siding", title: "Wall covering material and installation", kind: "CRITICAL", check: "Verify exterior wall covering material matches approved plans and is properly installed", refs: "FBC-R R703.1" },
    { phase: "Phase 7: Lathe, Siding", title: "Weather-resistive barrier", kind: "CRITICAL", check: "Verify weather-resistive barrier is properly installed behind cladding", refs: "FBC-R R703.2" },
    { phase: "Phase 7: Lathe, Siding", title: "Flashing at penetrations and transitions", kind: "CRITICAL", check: "Verify flashing is installed at windows, doors, and wall transitions", refs: "FBC-R R703.4" },
    { phase: "Phase 7: Lathe, Siding", title: "Fastener pattern and spacing", kind: "REQUIRED", check: "Verify cladding fastener type and spacing per manufacturer and plans", refs: "FBC-R R703.1" },
    { phase: "Phase 8: Drywall", title: "Drywall thickness and type", kind: "CRITICAL", check: "Verify drywall thickness matches plans, moisture-resistant board in wet areas", refs: "FBC-R R702.3.1" },
    { phase: "Phase 8: Drywall", title: "Fastener spacing", kind: "CRITICAL", check: "Verify screw or nail spacing meets code requirements", refs: "FBC-R R702.3.5" },
    { phase: "Phase 8: Drywall", title: "Fire-rated assemblies", kind: "CRITICAL", check: "Verify fire-rated walls and ceilings have proper drywall layers per rating", refs: "FBC-R R302.6" },
    { phase: "Phase 8: Drywall", title: "Moisture barrier in wet areas", kind: "REQUIRED", check: "Verify moisture barrier behind tub/shower surrounds where required", refs: "FBC-R R702.4" },
    { phase: "Phase 9: Final Electrical", title: "Panel complete and labeled", kind: "CRITICAL", check: "Verify panel cover installed, all breakers labeled, no open knockouts", refs: "NEC 408.4" },
    { phase: "Phase 9: Final Electrical", title: "GFCI and AFCI operational", kind: "CRITICAL", check: "Verify all GFCI and AFCI devices test and reset properly", refs: "NEC 210.8 · NEC 210.12" },
    { phase: "Phase 9: Final Electrical", title: "Receptacle and switch function", kind: "CRITICAL", check: "Verify outlets and switches operate correctly throughout", refs: "NEC 210.52" },
    { phase: "Phase 9: Final Electrical", title: "Light fixtures installed", kind: "REQUIRED", check: "Verify all light fixtures are installed and operational", refs: "NEC 210.70" },
    { phase: "Phase 9: Final Electrical", title: "Exterior lighting and outlets", kind: "CRITICAL", check: "Verify exterior outlets are GFCI protected and lighting is functional", refs: "NEC 210.8 · NEC 210.52(E)" },
    { phase: "Phase 10: Final Plumbing", title: "Fixture installation and operation", kind: "CRITICAL", check: "Verify all plumbing fixtures are installed, connected, and operational", refs: "FBC-P 405.1" },
    { phase: "Phase 10: Final Plumbing", title: "Water heater installation", kind: "CRITICAL", check: "Verify water heater is properly installed with TPR valve, drain pan, and discharge pipe", refs: "FBC-P 607.1" },
    { phase: "Phase 10: Final Plumbing", title: "No visible leaks", kind: "CRITICAL", check: "Verify no leaks at any supply or drain connection", refs: "FBC-P 312.1" },
    { phase: "Phase 10: Final Plumbing", title: "Hose bibbs and exterior plumbing", kind: "REQUIRED", check: "Verify exterior hose bibbs have backflow prevention", refs: "FBC-P 608.15.4.2" },
    { phase: "Phase 11: Final Mechanical/HVAC", title: "System operational test", kind: "CRITICAL", check: "Verify HVAC system starts, runs, and produces heated and cooled air", refs: "FBC-M 304.1" },
    { phase: "Phase 11: Final Mechanical/HVAC", title: "Air handler and condenser installation", kind: "CRITICAL", check: "Verify equipment is properly installed with required clearances and level", refs: "FBC-M 304.1" },
    { phase: "Phase 11: Final Mechanical/HVAC", title: "Condensate drain", kind: "CRITICAL", check: "Verify condensate drain is properly routed and terminated", refs: "FBC-M 307.2" },
    { phase: "Phase 11: Final Mechanical/HVAC", title: "Duct registers and grilles", kind: "REQUIRED", check: "Verify all supply and return registers are installed and operational", refs: "FBC-M 601.2" },
    { phase: "Phase 11: Final Mechanical/HVAC", title: "Equipment labels and data plates", kind: "REQUIRED", check: "Verify equipment nameplates match approved plans for capacity and efficiency", refs: "FBC-M 304.1" },
    { phase: "Phase 12: Final Building", title: "Egress doors and hardware", kind: "CRITICAL", check: "Verify egress doors provide minimum 32-inch clear width and proper hardware", refs: "FBC-R R311.2" },
    { phase: "Phase 12: Final Building", title: "Smoke alarms installed and operational", kind: "CRITICAL", check: "Verify smoke alarms in each bedroom, outside sleeping areas, and each level", refs: "FBC-R R314.3" },
    { phase: "Phase 12: Final Building", title: "CO alarms installed", kind: "CRITICAL", check: "Verify carbon monoxide alarms where required", refs: "FBC-R R315" },
    { phase: "Phase 12: Final Building", title: "Emergency escape openings", kind: "CRITICAL", check: "Verify bedroom windows meet egress size requirements", refs: "FBC-R R310.1" },
    { phase: "Phase 12: Final Building", title: "Stairway compliance", kind: "CRITICAL", check: "Verify stair rise, run, handrail height, and landing dimensions", refs: "FBC-R R311.7" },
    { phase: "Phase 12: Final Building", title: "Address numbers visible", kind: "REQUIRED", check: "Verify address numbers are posted and visible from street", refs: "FBC-R R319.1" },
    { phase: "Phase 12: Final Building", title: "Exterior finishes complete", kind: "REQUIRED", check: "Verify exterior cladding, trim, and weatherproofing are complete", refs: "FBC-R R703.1" },
    { phase: "Phase 12: Final Building", title: "Site grading and drainage", kind: "REQUIRED", check: "Verify finish grade slopes away from foundation minimum 6 inches in 10 feet", refs: "FBC-R R401.3" },
  ]),
};

// ---------- 2. Commercial Sunroom ----------
const COMMERCIAL_SUNROOM: PortalGuide = {
  slug: "commercial-sunroom",
  category: "Commercial",
  title: "Commercial Sunroom",
  docCount: 4,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Commercial sunroom addition scope under the private provider program (FL Statute §553.791).",
  documents: [
    D_STAMPED("Construction"),
    { name: "Product Approvals", description: "Florida Product Approvals for windows, glass panels, and regulated components.", required: "always" },
    D_SURVEY,
    { name: "Energy Compliance Forms", description: "Energy compliance documentation. Required if sunroom includes conditioned space.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Design wind speed & exposure", kind: "LIFE SAFETY", description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction.", code: "FBC-B 1609 · ASCE 7-22" },
    { title: "Attachment to existing structure", kind: "LIFE SAFETY", description: "Connection details between the new work and the existing structure must show fastener type, spacing, and embedment.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { title: "Florida product approval", kind: "CODE", description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration and regulated components).", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { title: "Engineer of record seal", kind: "DOCUMENTATION", description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
  ]),
  inspections: [
    {
      phase: "Phase 1", code: "001", title: "Rough Framing", tags: ["Required"],
      checks: [
        "Verify stud size and spacing match approved plans",
        "Verify header and beam sizes over openings per plans",
        "Verify double top plates with proper lapping and anchored bottom plates",
        "Verify proper bracing at corners and wall intersections",
        "Verify rough openings match approved plans for size and location",
        "Verify hurricane straps and hold-down hardware installed per plans",
        "Verify fire blocking is installed at required locations",
      ],
      refs: "FBC-R R602.3 · R602.3.1 · R602.7 · R602.3.2 · R602.10 · R802.11 · R602.8",
    },
    {
      phase: "Phase 2", code: "002", title: "Final Building", tags: ["Required"],
      checks: [
        "Verify egress doors provide minimum 32-inch clear width and proper hardware",
        "Verify smoke alarms in each bedroom, outside sleeping areas, and each level",
        "Verify carbon monoxide alarms where required",
        "Verify bedroom windows meet egress size requirements",
        "Verify stair rise, run, handrail height, and landing dimensions",
        "Verify address numbers are posted and visible from street",
        "Verify exterior cladding, trim, and weatherproofing are complete",
        "Verify finish grade slopes away from foundation minimum 6 inches in 10 feet",
      ],
      refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3",
    },
  ],
};

// ---------- 3. Commercial Window/Door Replacement ----------
const COMMERCIAL_WINDOW_DOOR: PortalGuide = {
  slug: "commercial-window-door-replacement",
  category: "Commercial",
  title: "Commercial Window/Door Replacement",
  docCount: 3,
  inspectionCount: 2,
  lastUpdated: REVIEWED,
  summary: "Commercial window/door replacement within existing openings under the private provider program.",
  documents: [
    { name: "Product Approvals", description: "Florida Product Approvals for replacement windows and/or doors showing impact rating, design pressure, and NOA/FL number.", required: "always" },
    { name: "Construction Plans Sealed by a Florida Registered Design Professional", description: "Structural engineering plans sealed by a Florida-registered professional engineer. Required if structural changes are involved (new openings, enlarged openings, header modifications).", required: "conditional" },
    { name: "Opening Modification Guidance", description: "Window/door replacement project type applies to replacement within existing openings only. If opening sizes or locations are modified, submit under Alteration project type instead.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Wind-borne debris protection", kind: "LIFE SAFETY", description: "In the Wind-Borne Debris Region, glazed openings must be impact-rated or protected by an approved shutter/panel system.", code: "FBC-R R301.2.1.2 · FBC-B 1609.2" },
    { title: "Means of egress capacity", kind: "LIFE SAFETY", description: "Occupant load, egress width, travel distance, and number of exits must comply with FBC-B Ch. 10.", code: "FBC-B 1004 · 1005 · 1006 · 1017" },
    { title: "Florida product approval", kind: "CODE", description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration, structural panels, covering systems).", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { title: "Accessibility scoping (FBC-A)", kind: "CODE", description: "Alteration or new commercial work triggers accessibility requirements in altered areas and along path of travel.", code: "FBC-A 202, 206 · FBC-B 3411" },
  ]),
  inspections: [
    {
      phase: "Buck, Flashing", code: "001", title: "Buck and flashing installation", tags: ["Required", "Critical"],
      checks: [
        "Verify window/door bucks and flashing are properly installed per manufacturer specs",
        "Verify anchoring method and fastener spacing per manufacturer installation instructions",
        "Verify sealant is applied per manufacturer specs at all joints",
      ],
      refs: "FBC-R R703.4 · FBC-B 1710.3 · 1710.2 · 1710.4",
    },
    {
      phase: "Final Building", code: "002", title: "Window/door product approval", tags: ["Required", "Critical"],
      checks: [
        "Verify installed windows and doors have valid Florida Product Approval matching approved plans",
        "Verify all windows and doors open, close, lock, and seal properly",
        "Verify impact-rated products where required by wind zone",
        "Verify bedroom windows still meet egress size requirements after replacement",
        "Verify interior trim and exterior caulking are complete",
      ],
      refs: "FBC-R R609.3 · FBC-B 1710.2 · FBC-R R612.1 · FBC-R R301.2.1.2 · FBC-B 1710.1 · FBC-R R310.1 · FBC-R R703.4",
    },
  ],
};

// ---------- 4. Multi Family Alteration ----------
const MULTI_FAMILY_ALTERATION: PortalGuide = {
  slug: "multi-family-alteration",
  category: "Multi Family",
  title: "Multi Family Alteration",
  docCount: 3,
  inspectionCount: 12,
  lastUpdated: REVIEWED,
  summary: "Multi-family alteration scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Scope of Work Description", description: "Very detailed written scope of work describing all work to be performed.", required: "always" },
    D_STAMPED("Construction"),
    { name: "Product Approvals", description: "Florida Product Approvals for any regulated components being installed. Required if installing new windows, doors, roofing, or other regulated products.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Fire-rated unit separation", kind: "LIFE SAFETY", description: "Dwelling-unit and corridor separations must maintain the original fire-resistance rating through any alteration.", code: "FBC-B 420 · FBC-B 711 · FBC-B 708" },
    { title: "Means of egress in altered areas", kind: "LIFE SAFETY", description: "Alterations must not reduce the capacity, width, or arrangement of existing means of egress.", code: "FBC-B 1004 · FBC-B 1005" },
    { title: "Structural alterations (MF)", kind: "LIFE SAFETY", description: "Wall removal or beam substitution requires engineered detail.", code: "FBC-B 1603 · FBC-EB Ch. 4" },
    { title: "Sound transmission (altered party walls)", kind: "CODE", description: "Altered inter-unit assemblies must meet FBC-B 1206 STC/IIC minimums.", code: "FBC-B 1206" },
  ]),
  inspections: [
    { phase: "Phase #1", code: "001", title: "Rough Framing", tags: ["Conditional"], refs: "FBC-R R602.3 · R602.7 · R802.11", checks: [
      "Wall stud spacing and size — Critical — Verify stud size and spacing match approved plans [FBC-R R602.3, R602.3.1]",
      "Headers and beams — Critical — Verify header and beam sizes over openings per plans [FBC-R R602.7]",
      "Top and bottom plate connections — Critical — Verify double top plates with proper lapping and anchored bottom plates [FBC-R R602.3.2]",
      "Corner and intersection bracing — Critical — Verify proper bracing at corners and wall intersections [FBC-R R602.10]",
      "Window and door rough openings — Critical — Verify rough openings match approved plans for size and location [FBC-R R602.7]",
      "Hurricane straps and hold-downs — Critical — Verify hurricane straps and hold-down hardware installed per plans [FBC-R R802.11]",
      "Fire blocking — Verify fire blocking is installed at required locations [FBC-R R602.8]",
    ]},
    { phase: "Phase #2", code: "002", title: "Roof Dry In, In Progress", tags: ["Conditional"], refs: "FBC-R R905.1.1 · R905.2.8.5 · R903.2", checks: [
      "Underlayment installation — Critical — Verify roof underlayment is installed per code and manufacturer specs [FBC-R R905.1.1]",
      "Drip edge installation — Critical — Verify drip edge is installed at eaves and rakes [FBC-R R905.2.8.5]",
      "Valley and flashing — Critical — Verify valley flashing and wall flashing are properly installed [FBC-R R903.2]",
      "Roof penetration sealing — Verify all roof penetrations are properly sealed and flashed [FBC-R R903.2]",
    ]},
    { phase: "Phase #3", code: "003", title: "Rough Plumbing", tags: ["Conditional"], refs: "FBC-P 604.1 · 704.1 · 308.1 · 903.1 · 607.1", checks: [
      "Supply pipe sizing and material — Critical — Verify supply pipe sizes and material match approved plans [FBC-P 604.1]",
      "DWV pipe sizing and slope — Critical — Verify drain, waste, and vent pipe sizes and slope per plans [FBC-P 704.1]",
      "Pipe support and hanging — Critical — Verify pipes are properly supported at required intervals [FBC-P 308.1]",
      "Vent termination locations — Verify vent pipes terminate properly through roof [FBC-P 903.1]",
      "Water heater rough-in — Verify water heater location, drain pan, and connections per plans [FBC-P 607.1]",
    ]},
    { phase: "Phase #4", code: "004", title: "Rough Electrical", tags: ["Conditional"], refs: "NEC 408.4 · 210 · 240 · 250 · 314 · FBC-R R314.3 · R315", checks: [
      "Panel installation — Critical — Verify electrical panel is properly mounted and sized per plans [NEC 408.4]",
      "Wire sizing per circuits — Critical — Verify wire gauge matches breaker amperage for each circuit [NEC 210.3, 240.4]",
      "Box fill and installation — Critical — Verify electrical boxes are properly installed and not overfilled [NEC 314.16]",
      "GFCI and AFCI locations — Critical — Verify GFCI and AFCI protection is provided where required [NEC 210.8, 210.12]",
      "Smoke and CO alarm wiring — Critical — Verify interconnected smoke and CO alarm wiring is in place [FBC-R R314.3, R315]",
      "Grounding and bonding — Critical — Verify grounding electrode system and bonding connections [NEC 250.50]",
    ]},
    { phase: "Phase #5", code: "005", title: "Rough Mechanical/HVAC", tags: ["Conditional"], refs: "FBC-M 603.1 · 603.9 · 304.1 · 1101.3 · 601.2", checks: [
      "Ductwork installation — Critical — Verify duct sizes, routing, and support match approved plans [FBC-M 603.1]",
      "Duct sealing — Critical — Verify duct joints and connections are properly sealed [FBC-M 603.9]",
      "Equipment placement — Critical — Verify air handler and condenser locations per plans with required clearances [FBC-M 304.1]",
      "Refrigerant line installation — Verify refrigerant line sizing and insulation per plans [FBC-M 1101.3]",
      "Return air pathway — Verify return air pathways are properly sized and located [FBC-M 601.2]",
    ]},
    { phase: "Phase #6", code: "006", title: "Insulation", tags: ["Conditional"], refs: "FBC-E R402.1 · R402.4 · R402.4.1", checks: [
      "Wall cavity insulation R-value — Critical — Verify wall insulation R-value matches energy calculations [FBC-E R402.1]",
      "Ceiling/attic insulation R-value — Critical — Verify ceiling or attic insulation R-value per energy calculations [FBC-E R402.1]",
      "Insulation coverage and gaps — Critical — Verify no gaps, voids, or compression in insulation installation [FBC-E R402.4]",
      "Air sealing — Verify air sealing at penetrations, top plates, and rim joists [FBC-E R402.4.1]",
    ]},
    { phase: "Phase #7", code: "007", title: "Lathe, Siding", tags: ["Conditional"], refs: "FBC-R R703.1 · R703.2 · R703.4", checks: [
      "Wall covering material and installation — Critical — Verify exterior wall covering material matches approved plans and is properly installed [FBC-R R703.1]",
      "Weather-resistive barrier — Critical — Verify weather-resistive barrier is properly installed behind cladding [FBC-R R703.2]",
      "Flashing at penetrations and transitions — Critical — Verify flashing is installed at windows, doors, and wall transitions [FBC-R R703.4]",
      "Fastener pattern and spacing — Verify cladding fastener type and spacing per manufacturer and plans [FBC-R R703.1]",
    ]},
    { phase: "Phase #8", code: "008", title: "Drywall", tags: ["Conditional"], refs: "FBC-R R702.3.1 · R702.3.5 · R302.6 · R702.4", checks: [
      "Drywall thickness and type — Critical — Verify drywall thickness matches plans, moisture-resistant board in wet areas [FBC-R R702.3.1]",
      "Fastener spacing — Critical — Verify screw or nail spacing meets code requirements [FBC-R R702.3.5]",
      "Fire-rated assemblies — Critical — Verify fire-rated walls and ceilings have proper drywall layers per rating [FBC-R R302.6]",
      "Moisture barrier in wet areas — Verify moisture barrier behind tub/shower surrounds where required [FBC-R R702.4]",
    ]},
    { phase: "Phase #9", code: "009", title: "Final Electrical", tags: ["Required"], refs: "NEC 408.4 · 210.8 · 210.12 · 210.52 · 210.70", checks: [
      "Panel complete and labeled — Critical — Verify panel cover installed, all breakers labeled, no open knockouts [NEC 408.4]",
      "GFCI and AFCI operational — Critical — Verify all GFCI and AFCI devices test and reset properly [NEC 210.8, 210.12]",
      "Receptacle and switch function — Critical — Verify outlets and switches operate correctly throughout [NEC 210.52]",
      "Light fixtures installed — Verify all light fixtures are installed and operational [NEC 210.70]",
      "Exterior lighting and outlets — Critical — Verify exterior outlets are GFCI protected and lighting is functional [NEC 210.8, 210.52(E)]",
    ]},
    { phase: "Phase #10", code: "010", title: "Final Plumbing", tags: ["Required"], refs: "FBC-P 405.1 · 607.1 · 312.1 · 608.15.4.2", checks: [
      "Fixture installation and operation — Critical — Verify all plumbing fixtures are installed, connected, and operational [FBC-P 405.1]",
      "Water heater installation — Critical — Verify water heater is properly installed with TPR valve, drain pan, and discharge pipe [FBC-P 607.1]",
      "No visible leaks — Critical — Verify no leaks at any supply or drain connection [FBC-P 312.1]",
      "Hose bibbs and exterior plumbing — Verify exterior hose bibbs have backflow prevention [FBC-P 608.15.4.2]",
    ]},
    { phase: "Phase #11", code: "011", title: "Final Mechanical/HVAC", tags: ["Required"], refs: "FBC-M 304.1 · 307.2 · 601.2", checks: [
      "System operational test — Critical — Verify HVAC system starts, runs, and produces heated and cooled air [FBC-M 304.1]",
      "Air handler and condenser installation — Critical — Verify equipment is properly installed with required clearances and level [FBC-M 304.1]",
      "Condensate drain — Critical — Verify condensate drain is properly routed and terminated [FBC-M 307.2]",
      "Duct registers and grilles — Verify all supply and return registers are installed and operational [FBC-M 601.2]",
      "Equipment labels and data plates — Verify equipment nameplates match approved plans for capacity and efficiency [FBC-M 304.1]",
    ]},
    { phase: "Phase #12", code: "012", title: "Final Building", tags: ["Required"], refs: "FBC-R R311.2 · R314.3 · R315 · R310.1 · R311.7 · R319.1 · R703.1 · R401.3", checks: [
      "Egress doors and hardware — Critical — Verify egress doors provide minimum 32-inch clear width and proper hardware [FBC-R R311.2]",
      "Smoke alarms installed and operational — Critical — Verify smoke alarms in each bedroom, outside sleeping areas, and each level [FBC-R R314.3]",
      "CO alarms installed — Critical — Verify carbon monoxide alarms where required [FBC-R R315]",
      "Emergency escape openings — Critical — Verify bedroom windows meet egress size requirements [FBC-R R310.1]",
      "Stairway compliance — Critical — Verify stair rise, run, handrail height, and landing dimensions [FBC-R R311.7]",
      "Address numbers visible — Verify address numbers are posted and visible from street [FBC-R R319.1]",
      "Exterior finishes complete — Verify exterior cladding, trim, and weatherproofing are complete [FBC-R R703.1]",
      "Site grading and drainage — Verify finish grade slopes away from foundation minimum 6 inches in 10 feet [FBC-R R401.3]",
    ]},
  ],
};

// ---------- 5. Multi Family Aluminum ----------
const MULTI_FAMILY_ALUMINUM: PortalGuide = {
  slug: "multi-family-aluminum",
  category: "Multi Family",
  title: "Multi Family Aluminum",
  docCount: 2,
  inspectionCount: 10,
  lastUpdated: REVIEWED,
  summary: "Multi-family aluminum structure scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Plans showing aluminum structure layout and framing, sealed by FL-registered professional.", required: "always" },
    { name: "Site Plan / Survey", description: "Property boundaries, setbacks, and structure footprint documentation.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Design wind speed & exposure", kind: "LIFE SAFETY", description: "Structural drawings must declare design wind speed (Vult) and exposure category matching jurisdiction.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { title: "Attachment to existing structure", kind: "LIFE SAFETY", description: "Connection details with fastener type, spacing, and embedment specifications.", code: "FBC-B 2002.5 · FBC-R R301.1" },
    { title: "Florida product approval", kind: "CODE", description: "FL# or Miami-Dade NOA for regulated products (fenestration, structural panels, covering systems).", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { title: "Engineer of record seal", kind: "DOCUMENTATION", description: "Structural drawings must bear current FL-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Final Building", title: "Base rail attachment and tapcon spacing", kind: "CRITICAL", check: "Verify base rail is secured with tapcons at correct spacing per plans", refs: "FBC-B 2002.1 · FBC-B 2002.4" },
    { phase: "Final Building", title: "Post to base connection", kind: "CRITICAL", check: "Verify structural connection of posts to base rail", refs: "FBC-B 2002.1" },
    { phase: "Final Building", title: "Post to roof beam connection", kind: "CRITICAL", check: "Verify structural connection of posts to roof beams", refs: "FBC-B 2002.1" },
    { phase: "Final Building", title: "Gusset connections", kind: "CRITICAL", check: "Verify gusset plates are installed at structural joints per plans", refs: "FBC-B 2002.1 · FBC-B 2002.4" },
    { phase: "Final Building", title: "Beam to gutter connection", kind: "CRITICAL", check: "Verify beams are properly connected to gutter system", refs: "FBC-B 2002.1" },
    { phase: "Final Building", title: "Gutter clips", kind: "REQUIRED", check: "Verify gutter clips installed at proper intervals", refs: "FBC-B 2002.1" },
    { phase: "Final Building", title: "Overall structure", kind: "CRITICAL", check: "Verify overall shape and construction matches approved plans", refs: "FBC-B 2002.4" },
    { phase: "Final Building", title: "Screen door opening mechanism height", kind: "REQUIRED", check: "Verify door latch at 54 inches where pool barrier applies", refs: "NEC 680.26 · FBC-R R303" },
    { phase: "Final Building", title: "Pool equipment bonding", kind: "REQUIRED", check: "Verify bonding wire at pool equipment and structure if present", refs: "NEC 680.26" },
    { phase: "Final Building", title: "Elite roof panel sealing", kind: "REQUIRED", check: "Verify complete sealing if solid roof panels present", refs: "FBC-B 2002.5" },
  ]),
};

// ---------- 6. Multi Family Aluminum w/ New Footing ----------
const MULTI_FAMILY_ALUMINUM_FOOTING: PortalGuide = {
  slug: "multi-family-aluminum-w-new-footing",
  category: "Multi Family",
  title: "Multi Family Aluminum w/ New Footing",
  docCount: 2,
  inspectionCount: 14,
  lastUpdated: REVIEWED,
  summary: "Multi-family aluminum structure with new footing under the private provider program.",
  documents: [
    { name: "Construction Plans Sealed by Florida Registered Design Professional", description: "Construction plans sealed by a Florida-registered design professional showing aluminum structure layout and framing, including footing and foundation engineering details.", required: "always" },
    D_SURVEY,
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Design Wind Speed & Exposure", kind: "LIFE SAFETY", description: "Structural drawings must declare design wind speed (Vult) and exposure category matching the jurisdiction's wind speed map.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { title: "Footing / Foundation Design", kind: "LIFE SAFETY", description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection to the structure above.", code: "FBC-R R403 · FBC-B 1809" },
    { title: "Florida Product Approval", kind: "CODE", description: "Florida product approval (FL#) or Miami-Dade NOA must be listed for regulated products (fenestration, structural panels, covering systems).", code: "FBC-B 1708 · FBC-R R301.2.1.2" },
    { title: "Engineer of Record Seal", kind: "DOCUMENTATION", description: "Structural drawings must bear a current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Phase 1: Footing, Slab, UFER (Building)", title: "Footing Dimensions", kind: "CRITICAL", check: "Verify footing depth and width match approved plans", refs: "FBC-R R403.1 · FBC-R R403.1.1" },
    { phase: "Phase 1: Footing, Slab, UFER (Building)", title: "Rebar Size and Placement", kind: "CRITICAL", check: "Verify rebar size, spacing, and placement per approved plans", refs: "FBC-R R403.1" },
    { phase: "Phase 1: Footing, Slab, UFER (Building)", title: "Footing Layout and Alignment", kind: "REQUIRED", check: "Verify footing layout matches approved site plan dimensions", refs: "FBC-B 110.3" },
    { phase: "Phase 1: Footing, Slab, UFER (Building)", title: "Clean and Debris-Free Excavation", kind: "REQUIRED", check: "Confirm excavation is free of standing water, loose soil, and debris before pour", refs: "FBC-R R403.1" },
    { phase: "Phase 2: Final Building (Building)", title: "Base Rail Attachment and Tapcon Spacing", kind: "CRITICAL", check: "Verify base rail is secured with tapcons at correct spacing per plans", refs: "FBC-B 2002.1 · FBC-B 2002.4" },
    { phase: "Phase 2: Final Building (Building)", title: "Post to Base Connection", kind: "CRITICAL", check: "Verify structural connection of posts to base rail", refs: "FBC-B 2002.1" },
    { phase: "Phase 2: Final Building (Building)", title: "Post to Roof Beam Connection", kind: "CRITICAL", check: "Verify structural connection of posts to roof beams", refs: "FBC-B 2002.1" },
    { phase: "Phase 2: Final Building (Building)", title: "Gusset Connections", kind: "CRITICAL", check: "Verify gusset plates are installed at structural joints per plans", refs: "FBC-B 2002.1 · FBC-B 2002.4" },
    { phase: "Phase 2: Final Building (Building)", title: "Beam to Gutter Connection", kind: "CRITICAL", check: "Verify beams are properly connected to gutter system", refs: "FBC-B 2002.1" },
    { phase: "Phase 2: Final Building (Building)", title: "Gutter Clips", kind: "REQUIRED", check: "Verify gutter clips are installed at proper intervals", refs: "FBC-B 2002.1" },
    { phase: "Phase 2: Final Building (Building)", title: "Overall Structure", kind: "CRITICAL", check: "Verify overall shape and construction matches approved plans", refs: "FBC-B 2002.4" },
    { phase: "Phase 2: Final Building (Building)", title: "Screen Door Opening Mechanism Height", kind: "REQUIRED", check: "Verify door latch/opening mechanism is at 54 inch height where pool barrier applies", refs: "NEC 680.26 · FBC-R R303" },
    { phase: "Phase 2: Final Building (Building)", title: "Pool Equipment Bonding", kind: "REQUIRED", check: "If pool equipment is present, verify bonding wire at pool equipment and at structure", refs: "NEC 680.26" },
    { phase: "Phase 2: Final Building (Building)", title: "Elite Roof Panel Sealing", kind: "REQUIRED", check: "If elite (solid) roof panels are present, verify sealing is complete", refs: "FBC-B 2002.5" },
  ]),
};

// ---------- 7. Multi Family Concrete Footing/Foundation ----------
const MULTI_FAMILY_CONCRETE_FOOTING: PortalGuide = {
  slug: "multi-family-concrete-footing-foundation",
  category: "Multi Family",
  title: "Multi Family Concrete Footing/Foundation",
  docCount: 2,
  inspectionCount: 14,
  lastUpdated: REVIEWED,
  summary: "Multi-family concrete footing and foundation scope under the private provider program.",
  documents: [
    D_SURVEY,
    { name: "Construction Plans (Design Professional Sealed)", description: "Construction plans sealed by a Florida-registered design professional showing concrete work layout, dimensions, and reinforcement details.", required: "always" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Design Wind Speed & Exposure", kind: "LIFE SAFETY", description: "Structural drawings must declare design wind speed (Vult) and exposure category.", code: "FBC-R R301.2.1 · ASCE 7-22" },
    { title: "Footing / Foundation Design", kind: "LIFE SAFETY", description: "Footing or foundation design must show dimensions, reinforcement, depth, and connection.", code: "FBC-R R403 · FBC-B 1809" },
    { title: "Fire-Rated Unit Separation", kind: "LIFE SAFETY", description: "Dwelling-unit and corridor separations must maintain original fire-resistance rating.", code: "FBC-B 420 · FBC-B 711 · FBC-B 708" },
    { title: "Engineer of Record Seal", kind: "DOCUMENTATION", description: "Structural drawings must bear current Florida-licensed engineer's seal and signature.", code: "FS Ch. 471 · FBC-B 107.3.5" },
  ]),
  inspections: mkInsp([
    { phase: "Footing, Slab, UFER", title: "Footing Dimensions", kind: "CRITICAL", check: "Verify footing dimensions match approved plans", refs: "FBC-R R403.1 · FBC-R R403.1.1" },
    { phase: "Footing, Slab, UFER", title: "Rebar Size and Spacing", kind: "CRITICAL", check: "Verify rebar size and spacing match approved structural drawings", refs: "FBC-R R403.1" },
    { phase: "Footing, Slab, UFER", title: "UFER Grounding Electrode", kind: "CRITICAL", check: "Verify UFER grounding electrode is installed per code prior to concrete pour", refs: "NEC 250.52(A)(3)" },
    { phase: "Footing, Slab, UFER", title: "Slab Vapor Barrier", kind: "CRITICAL", check: "Verify vapor barrier is in place under slab", refs: "FBC-R R506.2.3" },
    { phase: "Footing, Slab, UFER", title: "Slab Thickness and Wire Mesh", kind: "CRITICAL", check: "Verify slab thickness and wire mesh placement meet approved plans", refs: "FBC-R R506.1" },
    { phase: "Footing, Slab, UFER", title: "Foundation Anchorage Layout", kind: "REQUIRED", check: "Verify foundation anchorage layout and hardware match approved plans", refs: "FBC-R R403.1.6" },
    { phase: "Final Building", title: "Egress Doors and Hardware", kind: "CRITICAL", check: "Verify egress doors and hardware comply with code requirements", refs: "FBC-R R311.2" },
    { phase: "Final Building", title: "Smoke Alarms Installed and Operational", kind: "CRITICAL", check: "Verify smoke alarms are installed in all required locations and are operational", refs: "FBC-R R314.3" },
    { phase: "Final Building", title: "CO Alarms Installed", kind: "CRITICAL", check: "Verify carbon monoxide alarms are installed per code", refs: "FBC-R R315" },
    { phase: "Final Building", title: "Emergency Escape Openings", kind: "CRITICAL", check: "Verify emergency escape and rescue openings meet minimum size and operability requirements", refs: "FBC-R R310.1" },
    { phase: "Final Building", title: "Stairway Compliance", kind: "CRITICAL", check: "Verify stairway dimensions, handrails, and guards comply with code", refs: "FBC-R R311.7" },
    { phase: "Final Building", title: "Address Numbers Visible", kind: "REQUIRED", check: "Verify address numbers are posted and visible from the street", refs: "FBC-R R319.1" },
    { phase: "Final Building", title: "Exterior Finishes Complete", kind: "REQUIRED", check: "Verify all exterior finishes are complete per approved plans", refs: "FBC-R R703.1" },
    { phase: "Final Building", title: "Site Grading and Drainage", kind: "REQUIRED", check: "Verify site grading slopes away from structure and drainage is adequate", refs: "FBC-R R401.3" },
  ]),
};

// ---------- 8. Multi Family Demolition ----------
const MULTI_FAMILY_DEMOLITION: PortalGuide = {
  slug: "multi-family-demolition",
  category: "Multi Family",
  title: "Multi Family Demolition",
  docCount: 3,
  inspectionCount: 4,
  lastUpdated: REVIEWED,
  summary: "Multi-family demolition scope under the private provider program (FL Statute §553.791).",
  documents: [
    { name: "Demolition Plan or Detailed Scope of Work", description: "Demolition plan or detailed written scope of work describing all demolition activities.", required: "always" },
    { name: "Site Plan / Survey", description: "Site plan or survey showing structures to be demolished and surrounding features.", required: "always" },
    { name: "Asbestos Survey", description: "Asbestos survey guidance based on year built and risk; verify requirement during downstream review as needed.", required: "conditional" },
  ],
  downloads: STANDARD_DOWNLOADS,
  planReview: mkPR([
    { title: "Asbestos / lead paint assessment", kind: "LIFE SAFETY", description: "Pre-demolition asbestos survey required by federal NESHAP for most structures; lead paint RRP applies to pre-1978.", code: "40 CFR 61 Subpart M · 40 CFR 745 · FBC-B 107.3.5" },
    { title: "Adjacent unit protection (MF-specific)", kind: "LIFE SAFETY", description: "Demolition of one unit in a multi-family structure must protect adjacent units from structural, fire, and environmental impact.", code: "FBC-EB 1401" },
    { title: "Utility disconnect coordination", kind: "LIFE SAFETY", description: "Utility disconnects (water, sewer, gas, electric) must be coordinated with utility providers.", code: "Local demolition standards" },
  ]),
  inspections: mkInsp([
    { phase: "Final Building", title: "Structure fully demolished", kind: "CRITICAL", check: "Verify permitted structure is completely demolished and removed from site", refs: "FBC-B 110.3" },
    { phase: "Final Building", title: "Utility disconnection", kind: "CRITICAL", check: "Verify all utilities (electric, gas, water, sewer) are properly disconnected and capped", refs: "FBC-B 3303.5" },
    { phase: "Final Building", title: "Site condition", kind: "CRITICAL", check: "Verify site is graded, debris is removed, and no hazardous materials remain", refs: "FBC-B 3303.3" },
    { phase: "Final Building", title: "Erosion control", kind: "REQUIRED", check: "Verify erosion control measures are in place if required", refs: "FBC-B 3303.2" },
  ]),
};

export const COMMERCIAL_GUIDES_3: PortalGuide[] = [
  COMMERCIAL_STRUCTURAL_ELEVATION,
  COMMERCIAL_SUNROOM,
  COMMERCIAL_WINDOW_DOOR,
  MULTI_FAMILY_ALTERATION,
  MULTI_FAMILY_ALUMINUM,
  MULTI_FAMILY_ALUMINUM_FOOTING,
  MULTI_FAMILY_CONCRETE_FOOTING,
  MULTI_FAMILY_DEMOLITION,
];
