// Standard pool inspection sequence (Palm Beach / Treasure Coast convention).
// Code 605 is skipped intentionally (fiberglass-only).

export type InspectionStatus = "pending" | "passed" | "corrections";

export type Inspection = {
  code: string;
  name: string;
  description: string;
  status: InspectionStatus;
  notes?: string;
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

export function buildInspections(allPassed: boolean): Inspection[] {
  return POOL_INSPECTIONS.map((i) => ({ ...i, status: allPassed ? "passed" : "pending" }));
}

const STORAGE_PREFIX = "cleared:inspections:";

export function loadInspections(projectId: string, seed: Inspection[]): Inspection[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + projectId);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Inspection[];
    // Merge: seed order + persisted status/notes by code
    return seed.map((s) => {
      const p = parsed.find((x) => x.code === s.code);
      return p ? { ...s, status: p.status, notes: p.notes } : s;
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
