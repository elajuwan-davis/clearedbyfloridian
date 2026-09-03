/**
 * Data model for the /coverage/[county]/[permitType] permit-timeline landing pages.
 * Every number and fact here comes from the build reference — do not invent values.
 */

export type TimelineTier = "A" | "B" | "C";

export type TimelineCounty = {
  slug: string;
  /** Display name without the word "County". */
  name: string;
  label: string;
  tier: TimelineTier;
  /** General building baseline range, submission → issuance. */
  rangeLow: number;
  rangeHigh: number;
  /** County-specific SEO paragraph (real, distinct facts). */
  fact: string;
};

export const TIER_FEE_MULTIPLIER: Record<TimelineTier, number> = {
  A: 1.6,
  B: 1.15,
  C: 0.85,
};

export const TIER_LABEL: Record<TimelineTier, string> = {
  A: "Tier A · highest-complexity jurisdiction",
  B: "Tier B · moderate-complexity jurisdiction",
  C: "Tier C · lighter-volume jurisdiction",
};

export const TIMELINE_COUNTIES: TimelineCounty[] = [
  {
    slug: "miami-dade",
    name: "Miami-Dade",
    label: "Miami-Dade County",
    tier: "A",
    rangeLow: 45,
    rangeHigh: 65,
    fact: "Even simple permits often take 6–8 weeks from initial submittal to approval. Florida's SB 102 / Section 553.792 imposes strict review deadlines specifically for Miami-Dade permits, requiring qualifying residential reviewers to complete initial review quickly, with applicants given 10 business days to respond to comments.",
  },
  {
    slug: "broward",
    name: "Broward",
    label: "Broward County",
    tier: "B",
    rangeLow: 25,
    rangeHigh: 40,
    fact: "The Broward County Building Department issues permits only for unincorporated areas. Cities within the county — Fort Lauderdale, Hollywood, Pembroke Pines, and others — run their own separate building departments with their own timelines.",
  },
  {
    slug: "palm-beach",
    name: "Palm Beach",
    label: "Palm Beach County",
    tier: "B",
    rangeLow: 25,
    rangeHigh: 40,
    fact: "Cities within the county — West Palm Beach, Boca Raton, Jupiter — handle their own permitting separately from the county-level department. Confirming the correct jurisdiction before applying prevents delays from submitting to the wrong department.",
  },
  {
    slug: "martin",
    name: "Martin",
    label: "Martin County",
    tier: "C",
    rangeLow: 15,
    rangeHigh: 28,
    fact: "Permits for unincorporated areas (Palm City, Hobe Sound, Jensen Beach, Port Salerno) run through the Accela Citizen Access portal, with zoning review layered on by the Growth Management Department. The City of Stuart and the island towns of Sewall's Point and Jupiter Island each run their own separate, often stricter, review process — waterfront or oceanfront parcels can pick up additional environmental and landscape conditions no mainland lot sees.",
  },
  {
    slug: "st-lucie",
    name: "St. Lucie",
    label: "St. Lucie County",
    tier: "C",
    rangeLow: 15,
    rangeHigh: 28,
    fact: "The City of Port St. Lucie — home to most of the county's residents — runs its own building department with its own in-ground pool application and child-safety-barrier forms, requiring Public Works engineering approval of site drainage before a pool permit issues, separate from unincorporated St. Lucie County's process.",
  },
  {
    slug: "indian-river",
    name: "Indian River",
    label: "Indian River County",
    tier: "C",
    rangeLow: 15,
    rangeHigh: 28,
    fact: "The Building Division currently limits permit intake to 10 permits per day per applicant/company due to workload. Reviews are based on the county's FEMA Flood Insurance Rate Maps, updated January 26, 2023 — projects in flood zones are reviewed against the newer map data.",
  },
];

export type TimelinePermitType = {
  slug: string;
  /** Full display name. */
  name: string;
  /** Short name used in headings/titles. */
  shortName: string;
  dayMult: number;
  minDays?: number;
  feeLow: number;
  feeHigh: number;
  /** Permit-type-specific technical review explanation. */
  technical: string;
};

export const TIMELINE_PERMIT_TYPES: TimelinePermitType[] = [
  {
    slug: "pool-permit",
    name: "Pool + Deck (New Construction)",
    shortName: "Pool + Deck",
    dayMult: 1.0,
    feeLow: 1400,
    feeHigh: 3200,
    technical:
      "A pool package carries three separate reviews at once: structural review of the shell and deck, electrical review of the equipment bonding grid, and barrier-code review of the child-safety enclosure — plus the barrier inspection before final. That combination is why a pool permit moves slower than any single-trade permit in the same jurisdiction.",
  },
  {
    slug: "building-permit",
    name: "General Building / Addition-Remodel",
    shortName: "General Building / Addition-Remodel",
    dayMult: 0.85,
    feeLow: 900,
    feeHigh: 2400,
    technical:
      "Additions and remodels get structural review and zoning/setback review layered together, so the plan set has to satisfy two reviewers whose comments arrive independently — a setback correction can restart drawings that already cleared structural.",
  },
  {
    slug: "screen-enclosure-permit",
    name: "Screen Enclosure",
    shortName: "Screen Enclosure",
    dayMult: 0.45,
    minDays: 5,
    feeLow: 350,
    feeHigh: 900,
    technical:
      "Screen enclosures are reviewed primarily for wind-load rating on the frame and attachment details — typically a lighter review than a full structural package, which is why the range is shorter than a building permit in the same county.",
  },
  {
    slug: "electrical-permit",
    name: "Electrical",
    shortName: "Electrical",
    dayMult: 0.3,
    minDays: 3,
    feeLow: 180,
    feeHigh: 500,
    technical:
      "Electrical review focuses on load calculations and panel capacity — whether the existing service can carry the added load, and whether the panel schedule and conductor sizing match the calculation submitted.",
  },
  {
    slug: "plumbing-permit",
    name: "Plumbing",
    shortName: "Plumbing",
    dayMult: 0.3,
    minDays: 3,
    feeLow: 170,
    feeHigh: 460,
    technical:
      "Plumbing review is driven by fixture count and backflow prevention — fixture units against the supply and drain sizing, and the backflow device protecting the potable supply.",
  },
  {
    slug: "gas-permit",
    name: "Gas",
    shortName: "Gas",
    dayMult: 0.35,
    minDays: 3,
    feeLow: 220,
    feeHigh: 600,
    technical:
      "Gas review checks total appliance BTU load and line sizing — every appliance on the run, the developed length, and whether the pipe diameter delivers the required pressure at the farthest outlet.",
  },
  {
    slug: "roofing-permit",
    name: "Roofing",
    shortName: "Roofing",
    dayMult: 0.2,
    minDays: 2,
    feeLow: 150,
    feeHigh: 420,
    technical:
      "Roofing review is a wind-uplift and Florida Building Code wind-load check — product approval, fastening schedule, and secondary water barrier. Post-hurricane enforcement is stricter in coastal counties, so uplift documentation is where these permits stall.",
  },
];

export type TimelineEstimate = {
  daysLow: number;
  daysHigh: number;
  feeLow: number;
  feeHigh: number;
};

export function computeEstimate(
  county: TimelineCounty,
  permitType: TimelinePermitType,
): TimelineEstimate {
  let daysLow = Math.round(county.rangeLow * permitType.dayMult);
  let daysHigh = Math.round(county.rangeHigh * permitType.dayMult);
  if (permitType.minDays !== undefined) {
    daysLow = Math.max(daysLow, permitType.minDays);
    daysHigh = Math.max(daysHigh, permitType.minDays + 2);
  }
  const mult = TIER_FEE_MULTIPLIER[county.tier];
  const feeLow = Math.round((permitType.feeLow * mult) / 10) * 10;
  const feeHigh = Math.round((permitType.feeHigh * mult) / 10) * 10;
  return { daysLow, daysHigh, feeLow, feeHigh };
}

export function findTimelineCounty(slug: string): TimelineCounty | undefined {
  return TIMELINE_COUNTIES.find((c) => c.slug === slug);
}

export function findTimelinePermitType(slug: string): TimelinePermitType | undefined {
  return TIMELINE_PERMIT_TYPES.find((p) => p.slug === slug);
}

/** All 42 county × permit-type paths, for sitemap generation and internal linking. */
export function allTimelinePaths(): string[] {
  return TIMELINE_COUNTIES.flatMap((c) =>
    TIMELINE_PERMIT_TYPES.map((p) => `/coverage/${c.slug}/${p.slug}`),
  );
}
