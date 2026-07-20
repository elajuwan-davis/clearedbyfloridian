// Standard pool inspection sequence (Palm Beach / Treasure Coast convention).
// Code 605 is skipped intentionally (fiberglass-only).

export type InspectionStatus = "pending" | "scheduled" | "passed" | "corrections";

export type InspectionWindow = "morning" | "afternoon";

export type Inspection = {
  code: string;
  name: string;
  description: string;
  status: InspectionStatus;
  phase?: number;
  notes?: string;
  scheduledDate?: string; // yyyy-mm-dd
  scheduledWindow?: InspectionWindow;
  scheduledNotes?: string;
};



export const POOL_INSPECTIONS: Omit<Inspection, "status">[] = [
  {
    code: "601",
    name: "Pool Steel",
    description:
      "Inspection of reinforcing steel (rebar) placement before concrete/gunite is applied. Inspector verifies bar spacing, coverage, chair height, and tie-wire compliance per approved plans.",
  },
  {
    code: "602",
    name: "Pool Electric Bond",
    description:
      "Inspection of equipotential bonding system — copper bond wire connecting all metallic components (steel, light niches, equipment pad, handrails) to prevent electric shock hazard.",
  },
  {
    code: "603",
    name: "Pool Deck",
    description:
      "Inspection of deck formwork, reinforcement, and drainage slope before concrete pour. Verifies setbacks, coping placement, and expansion joints per approved plans.",
  },
  {
    code: "604",
    name: "Pool Piping Pressure Test",
    description:
      "Pressure test of all pool plumbing lines (suction, return, cleaner, feature lines) before burial. Lines must hold pressure for a minimum duration without loss.",
  },
  {
    code: "606",
    name: "Wet Niche",
    description:
      "Inspection of underwater light niche installation — verifies niche bonding, conduit routing, and proper embedment in shell before plaster.",
  },
  {
    code: "607",
    name: "Pool Alarms / Barriers",
    description:
      "Inspection of pool safety barriers: fence height and gate self-closing/self-latching mechanism, door alarms, and/or pool alarm system per Florida Statute 515. Must pass before water fill.",
  },
  {
    code: "608",
    name: "Pool Final Electric",
    description:
      "Final inspection of all electrical work: equipment bonding, GFCI protection, time clocks, lighting circuits, and panel connections. Performed by electrical inspector.",
  },
  {
    code: "609",
    name: "Pool Final Piping",
    description:
      "Final inspection of all exposed plumbing at equipment pad: pump, filter, heater, valves, and unions. Verifies proper connections and no leaks under operating pressure.",
  },
  {
    code: "610",
    name: "Pool Final Building",
    description:
      "Final building inspection — overall structural and site compliance review. Inspector verifies all previous inspections passed, plaster is complete, equipment is operational, and permit card is on site. Issues Certificate of Completion.",
  },
];

export const POOL_INSPECTION_COUNT = POOL_INSPECTIONS.length;

// PSL (Port St. Lucie) permit-specific inspection sequence for the Henderson project (permit 2619180).
// Grouped by phase: 1 = pre-shell, 2 = rough / pre-deck, 4 = finals.
export const PSL_HENDERSON_INSPECTIONS: Omit<Inspection, "status">[] = [
  { code: "1802", phase: 1, name: "A-FMBD — Formboard Survey", description: "Formboard survey verifying pool footprint, setbacks, and elevations match approved site plan prior to steel placement." },
  { code: "6400", phase: 1, name: "POOL — Pool Steel", description: "Inspection of reinforcing steel (rebar) placement, spacing, coverage, and tie-wire compliance prior to gunite/shotcrete application." },
  { code: "1014", phase: 1, name: "EQBS — Equipotential Shell Bonding", description: "Verification of equipotential bonding of the pool shell steel per NEC 680.26 prior to shell encapsulation." },
  { code: "6200", phase: 1, name: "UPLU — Underground Plumbing Inspection", description: "Inspection of underground pool plumbing lines (suction, return, cleaner, feature) pressure-tested prior to cover." },
  { code: "6300", phase: 2, name: "R-PLUR — Plumbing Rough Inspection", description: "Rough plumbing inspection of equipment-pad piping and manifolds prior to deck pour / equipment set." },
  { code: "1013", phase: 2, name: "EQBP — Equipotential Perimeter Bonding", description: "Perimeter equipotential bonding grid inspection (3-ft perimeter conductor) per NEC 680.26(B)(2) prior to deck pour." },
  { code: "1451", phase: 2, name: "BARR — Pool Barrier", description: "Pool safety barrier inspection: fence height, gate self-close/self-latch, door alarms per FS 515 prior to water fill." },
  { code: "8803", phase: 2, name: "UGPE — Underground Piping Electric", description: "Inspection of underground electrical conduits and raceways prior to backfill." },
  { code: "3100", phase: 2, name: "R-ELER — Electric Rough-In Inspection", description: "Rough-in electrical inspection: bonding, conduit runs, GFCI provisions, and equipment feeder rough at equipment pad." },
  { code: "3400", phase: 4, name: "FINL — Final Inspection", description: "Final building inspection — overall structural and site compliance review; confirms all prior inspections passed and permit card is on site." },
  { code: "3000", phase: 4, name: "F-ELEF — Electric Final Inspection", description: "Final electrical: bonding, GFCI protection, lighting circuits, panel terminations, and equipment operation." },
  { code: "6100", phase: 4, name: "F-PLUF — Plumbing Final", description: "Final plumbing at equipment pad: pump, filter, heater, valves, and unions verified leak-free under operating pressure." },
  { code: "1000", phase: 4, name: "A-PPCC — Private Provider Certificate of Compliance", description: "Private Provider issues Certificate of Compliance per FS 553.791; triggers 2-business-day Certificate of Occupancy window." },
  { code: "1500", phase: 4, name: "LD-APEN — Approval by Engineering", description: "Land Development engineering approval. Contact PSL Engineering at (772) 871-5177 to schedule." },
];

// PSL permit-specific inspection sequence for the Knight project (permit 2621607).
// Phases: 1 = pre-shell, 2 = rough / pre-deck, 3 = final survey, 4 = finals.
export const PSL_KNIGHT_INSPECTIONS: Omit<Inspection, "status">[] = [
  { code: "6400", phase: 1, name: "POOL — Pool Steel", description: "Inspection of reinforcing steel (rebar) placement, spacing, coverage, and tie-wire compliance prior to gunite/shotcrete application." },
  { code: "8803", phase: 1, name: "UGPE — Underground Piping Electric", description: "Inspection of underground electrical conduits and raceways prior to backfill." },
  { code: "6221", phase: 1, name: "A-TERM1 — Termite Initial Certification", description: "Initial termite treatment certification of soil / slab area prior to concrete placement per FBC 1816." },
  { code: "1014", phase: 1, name: "EQBS — Equipotential Shell Bonding", description: "Verification of equipotential bonding of the pool shell steel per NEC 680.26 prior to shell encapsulation." },
  { code: "1013", phase: 2, name: "EQBP — Equipotential Perimeter Bonding", description: "Perimeter equipotential bonding grid inspection (3-ft perimeter conductor) per NEC 680.26(B)(2) prior to deck pour." },
  { code: "4000", phase: 2, name: "FOOT — Footing / Foundation / Slab Inspection", description: "Footing, foundation, and slab reinforcement inspection prior to concrete pour." },
  { code: "6300", phase: 2, name: "R-PLUR — Plumbing Rough Inspection", description: "Rough plumbing inspection of equipment-pad piping and manifolds prior to deck pour / equipment set." },
  { code: "6200", phase: 2, name: "UPLU — Underground Plumbing Inspection", description: "Inspection of underground pool plumbing lines (suction, return, cleaner, feature) pressure-tested prior to cover." },
  { code: "3100", phase: 2, name: "R-ELER — Electric Rough-In Inspection", description: "Rough-in electrical inspection: bonding, conduit runs, GFCI provisions, and equipment feeder rough at equipment pad." },
  { code: "1451", phase: 2, name: "BARR — Pool Barrier", description: "Pool safety barrier inspection: fence height, gate self-close/self-latch, door alarms per FS 515 prior to water fill." },
  { code: "1803", phase: 3, name: "A-FLSV — Final Survey", description: "Final as-built survey confirming pool, deck, and equipment placement match approved site plan and setbacks." },
  { code: "1500", phase: 4, name: "LD-APEN — Approval by Engineering", description: "Land Development engineering approval. Contact PSL Engineering at (772) 871-5177 to schedule." },
  { code: "6100", phase: 4, name: "F-PLUF — Plumbing Final", description: "Final plumbing at equipment pad: pump, filter, heater, valves, and unions verified leak-free under operating pressure." },
  { code: "1000", phase: 4, name: "A-PPCC — Private Provider Certificate of Compliance", description: "Private Provider issues Certificate of Compliance per FS 553.791; triggers 2-business-day Certificate of Occupancy window." },
  { code: "3400", phase: 4, name: "FINL — Final Inspection", description: "Final building inspection — overall structural and site compliance review; confirms all prior inspections passed and permit card is on site." },
  { code: "6200-F", phase: 4, name: "A-TERMF — Termite Final Certification", description: "Final termite certification issued after all wood/framing complete; required for Certificate of Occupancy." },
  { code: "3000", phase: 4, name: "F-ELEF — Electric Final Inspection", description: "Final electrical: bonding, GFCI protection, lighting circuits, panel terminations, and equipment operation." },
];


export function buildInspections(allPassed: boolean, template: Omit<Inspection, "status">[] = POOL_INSPECTIONS): Inspection[] {
  return template.map((i) => ({ ...i, status: allPassed ? "passed" : "pending" }));
}


const STORAGE_PREFIX = "cleared:inspections:";

export function loadInspections(projectId: string, seed: Inspection[]): Inspection[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + projectId);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Inspection[];
    // Merge: seed order + persisted mutable fields by code
    return seed.map((s) => {
      const p = parsed.find((x) => x.code === s.code);
      return p
        ? {
            ...s,
            status: p.status,
            notes: p.notes,
            scheduledDate: p.scheduledDate,
            scheduledWindow: p.scheduledWindow,
            scheduledNotes: p.scheduledNotes,
          }
        : s;
    });

  } catch {
    return seed;
  }
}

export function saveInspections(projectId: string, inspections: Inspection[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + projectId, JSON.stringify(inspections));
  } catch {
    /* ignore */
  }
}

export function passedCount(inspections: Inspection[]): number {
  return inspections.filter((i) => i.status === "passed").length;
}
