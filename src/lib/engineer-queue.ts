/* Frontend-only mock data + local bid store for the Engineer Portal.
   Engineers see a BLIND queue: no GC, trade contractor, owner, or contact
   details are ever included in these records. Backend wiring is separate. */

export type EngineerRequestStatus = "open" | "bid_submitted" | "assigned" | "closed";

export type EngineerRequest = {
  id: string;
  inspections: string[];
  trade: string;
  permitType: string;
  county: string;
  city: string;
  photoCount: number;
  submittedAt: string;
  status: EngineerRequestStatus;
  scope: string;
};

export type EngineerBid = {
  requestId: string;
  fee: number;
  turnaround: string;
  notes: string;
  submittedAt: string;
  outcome: "pending" | "awarded" | "not_selected";
};

export const ENGINEER_REQUESTS: EngineerRequest[] = [
  {
    id: "ENG-2041",
    inspections: ["Rough Framing", "Rough Plumbing"],
    trade: "Residential Structural",
    permitType: "Pool & Spa",
    county: "Palm Beach",
    city: "Jupiter",
    photoCount: 12,
    submittedAt: "2026-08-28",
    status: "open",
    scope:
      "Gunite shell shot and rough plumbing lines were covered with fill prior to inspection. Engineer certification requested for the covered rough framing of the equipment pad and the pressure-tested rough plumbing runs.",
  },
  {
    id: "ENG-2039",
    inspections: ["Foundation", "Sheathing"],
    trade: "Residential Structural",
    permitType: "New Construction",
    county: "Martin",
    city: "Stuart",
    photoCount: 18,
    submittedAt: "2026-08-26",
    status: "open",
    scope:
      "Monolithic slab poured and exterior sheathing installed ahead of scheduled inspection. Certification requested covering footing steel placement and sheathing nailing pattern, documented by photo set.",
  },
  {
    id: "ENG-2034",
    inspections: ["Rough Electrical", "Insulation"],
    trade: "Electrical",
    permitType: "Interior Renovation",
    county: "St. Lucie",
    city: "Port St. Lucie",
    photoCount: 9,
    submittedAt: "2026-08-21",
    status: "assigned",
    scope:
      "Drywall closed over rough electrical and batt insulation in three bedrooms. Certification requested for conductor sizing, box fill, and insulation R-value continuity.",
  },
  {
    id: "ENG-2028",
    inspections: ["Fire Blocking"],
    trade: "Residential Structural",
    permitType: "Addition",
    county: "Indian River",
    city: "Vero Beach",
    photoCount: 6,
    submittedAt: "2026-08-14",
    status: "closed",
    scope:
      "Fire blocking at the two-story chase was concealed during framing close-in. Certification requested for blocking material and placement at each floor line.",
  },
];

const STORE_KEY = "cleard:engineer-bids";

export function loadBids(): EngineerBid[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as EngineerBid[]) : [];
  } catch {
    return [];
  }
}

export function saveBids(bids: EngineerBid[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(bids));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

export function statusLabel(status: EngineerRequestStatus): string {
  return status === "bid_submitted"
    ? "Bid Submitted"
    : status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusChipClass(status: EngineerRequestStatus): string {
  switch (status) {
    case "open":
      return "border-[#2E7D32]/35 bg-[#2E7D32]/10 text-[#215C24]";
    case "bid_submitted":
      return "border-[#D4A017]/40 bg-[#D4A017]/12 text-[#8A6A0B]";
    case "assigned":
      return "border-[#0072CE]/35 bg-[#0072CE]/10 text-[#005AA3]";
    default:
      return "border-black/15 bg-black/5 text-black/55";
  }
}

export function outcomeChipClass(outcome: EngineerBid["outcome"]): string {
  switch (outcome) {
    case "awarded":
      return "border-[#2E7D32]/35 bg-[#2E7D32]/10 text-[#215C24]";
    case "not_selected":
      return "border-black/15 bg-black/5 text-black/55";
    default:
      return "border-[#D4A017]/40 bg-[#D4A017]/12 text-[#8A6A0B]";
  }
}

export function outcomeLabel(outcome: EngineerBid["outcome"]): string {
  return outcome === "not_selected"
    ? "Not Selected"
    : outcome.charAt(0).toUpperCase() + outcome.slice(1);
}
