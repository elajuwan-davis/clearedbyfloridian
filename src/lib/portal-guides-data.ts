// Data for /portal/guides — Florida pool & spa permitting reference.

export type GuideDoc = {
  name: string;
  description: string;
  required: "always" | "conditional";
};

export type GuideDownload = {
  title: string;
  meta: string;
  href?: string; // undefined = pending upload
};

export type PlanReviewItem = {
  n: string;
  title: string;
  tags: string[]; // e.g. LIFE SAFETY, CODE, DOCUMENTATION
  description: string;
  code: string;
};

export type InspectionPhase = {
  phase: string;
  code: string; // 601, 602...
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

export const POOL_CONSTRUCTION: PortalGuide = {
  slug: "pool-construction",
  category: "Pool & Spa",
  title: "Single Family Pool Construction",
  docCount: 6,
  inspectionCount: 9,
  lastUpdated: "Reviewed by Flōridian permitting staff — July 2026",
  summary:
    "Reference guide for permitting a single family in-ground pool in Florida under the private provider program (FL Statute §553.791).",
  documents: [
    {
      name: "Stamped Construction Plans",
      description:
        "Pool construction plans sealed by a Florida-licensed design professional showing layout, dimensions, structural details, plumbing, and electrical.",
      required: "always",
    },
    {
      name: "TDH Calculations",
      description: "Turnover, Design, and Hydraulic calculations for the pool system.",
      required: "always",
    },
    {
      name: "Equipment Specifications",
      description: "Manufacturer specs for pump, filter, heater, and all pool equipment.",
      required: "always",
    },
    {
      name: "Site / Spot Survey",
      description: "Current survey showing property lines, setbacks, and pool location.",
      required: "always",
    },
    {
      name: "Product Approvals / NOA",
      description: "Florida Product Approvals or Notice of Acceptance for non-standard materials.",
      required: "conditional",
    },
    {
      name: "Notice to Building Official (NTBO)",
      description: "Required when using a private provider (Flōridian). Download below.",
      required: "conditional",
    },
    {
      name: "Owner Authorization Form",
      description: "Private Provider Owner Authorization & Indemnification. Download below.",
      required: "conditional",
    },
  ],
  downloads: [
    {
      title: "Notice to Building Official — Use of Private Provider",
      meta: "Form 61G20-2.005 · FL Statute §553.791",
    },
    {
      title: "Private Provider Owner Authorization & Indemnification",
      meta: "FL Statute §553.791",
    },
  ],
  planReview: [
    {
      n: "01",
      title: "Pool barrier compliance",
      tags: ["Life Safety"],
      description:
        'Verify a code-compliant pool barrier is shown on plans: height ≥48", clearances, gate self-closing/self-latching hardware, and door alarms on dwelling openings facing pool.',
      code: "ISPSC 305 · FBC-R R4501.17 · Florida Statutes 515.27",
    },
    {
      n: "02",
      title: "Pool shell structural design",
      tags: ["Life Safety"],
      description:
        "Verify pool shell engineering shows soil bearing, reinforcement schedule, and shell thickness.",
      code: "ISPSC 307 · FBC-R R403 · ACI 318",
    },
    {
      n: "03",
      title: "Deck and coping design",
      tags: ["Code"],
      description:
        "Verify deck slopes away from pool, slip-resistant finish noted, coping connection detailed.",
      code: "ISPSC 306 · FBC-R R326",
    },
    {
      n: "04",
      title: "Setbacks from property lines and structures",
      tags: ["Code"],
      description:
        "Verify pool meets jurisdictional setback requirements from property lines, septic fields, and easements.",
      code: "ISPSC 305.3 · Local zoning ordinance",
    },
    {
      n: "05",
      title: "Engineer seal on structural",
      tags: ["Documentation"],
      description:
        "Confirm pool structural drawings bear a current Florida-licensed engineer seal.",
      code: "Florida Statutes Chapter 471",
    },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "601",
      title: "Pool Steel",
      tags: ["Required", "Structural"],
      checks: [
        "Verify rebar size, spacing, and coverage per approved plans",
        'Verify chair height maintains minimum 3" concrete cover',
        "Verify tie-wire connections at all intersections",
        "Verify bond beam reinforcement is continuous",
      ],
      refs: "FBC-R R4501 · ACI 318",
    },
    {
      phase: "Phase 2",
      code: "602",
      title: "Pool Electric Bond",
      tags: ["Required", "Electrical", "Life Safety"],
      checks: [
        "Verify #8 AWG solid copper bonding wire connects all metallic components",
        "Verify bond wire ties to rebar grid, pump, filter, heater, light niches, and handrails",
        "Verify equipment pad bonding lug installed",
      ],
      refs: "NEC 680.26 · FBC-E",
    },
    {
      phase: "Phase 3",
      code: "603",
      title: "Pool Deck",
      tags: ["Required", "Structural"],
      checks: [
        "Verify deck form and reinforcement match approved plans",
        'Verify deck slopes minimum 1/8" per foot away from pool edge',
        "Verify expansion joint placement between deck and coping",
        "Verify setback from pool shell is maintained",
      ],
      refs: "ISPSC 306.2 · FBC-R R326",
    },
    {
      phase: "Phase 4",
      code: "604",
      title: "Pool Piping Pressure Test",
      tags: ["Required", "Plumbing"],
      checks: [
        "Verify all pool plumbing lines (suction, return, cleaner, feature lines) are pressure tested before burial",
        "Lines must hold minimum 30 PSI for 30 minutes without loss",
        "Verify pipe size, material, and fittings match approved plans",
      ],
      refs: "ISPSC 308 · FBC-P",
    },
    {
      phase: "Phase 5",
      code: "606",
      title: "Wet Niche",
      tags: ["Required", "Electrical"],
      checks: [
        "Verify underwater light niche is properly embedded in shell",
        "Verify conduit routing from niche to junction box is watertight",
        "Verify niche bonding wire is connected",
        "Verify niche manufacturer approval on file",
      ],
      refs: "NEC 680.23 · FBC-E",
    },
    {
      phase: "Phase 6",
      code: "607",
      title: "Pool Alarms / Barriers",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        'Verify pool barrier height is minimum 48" above grade on outside face',
        'Verify gate latch release is at 54" from grade on pool side',
        "Verify gates are self-closing and self-latching",
        "Verify no barrier opening allows passage of a 4-inch sphere",
        "Verify pool alarm or dwelling-wall compliance method installed per approved plans",
      ],
      refs: "ISPSC 305 · FBC-R R4501.17 · Florida Statutes 515.27",
    },
    {
      phase: "Phase 7",
      code: "608",
      title: "Pool Final Electric",
      tags: ["Required", "Electrical"],
      checks: [
        "Verify GFCI protection on all pool circuits",
        "Verify time clock installation and labeling",
        "Verify all lighting circuits are connected and operational",
        "Verify panel connections and breaker labeling",
        "Verify bonding continuity",
      ],
      refs: "NEC 680 · FBC-E",
    },
    {
      phase: "Phase 8",
      code: "609",
      title: "Pool Final Piping",
      tags: ["Required", "Plumbing"],
      checks: [
        "Verify pump, filter, heater, valves, and unions are connected and leak-free under operating pressure",
        "Verify backwash line termination",
        "Verify chemical feeder connections",
        "Verify all equipment labels are visible",
      ],
      refs: "ISPSC 308 · FBC-P",
    },
    {
      phase: "Phase 9",
      code: "610",
      title: "Pool Final Building",
      tags: ["Required", "Typical Final", "Critical"],
      checks: [
        "Verify completed pool and decking match approved plans",
        "Verify barrier height, gate operation, and alarm system are all in place",
        "Verify deck surface is slip-resistant with radiused edges",
        "Verify equipment labels on pumps, filters, heaters are visible",
        "Verify emergency shut-off switch is installed where required",
        "Permit card must be on site — issues Certificate of Completion",
      ],
      refs: "ISPSC 307.2 · FBC-B 110.3 · NEC 680.12",
    },
  ],
};

export const SPA_HOT_TUB: PortalGuide = {
  slug: "spa-hot-tub",
  category: "Pool & Spa",
  title: "Single Family Spa / Hot Tub",
  docCount: 4,
  inspectionCount: 6,
  lastUpdated: "Reviewed by Flōridian permitting staff — July 2026",
  summary:
    "Reference guide for permitting a residential spa or hot tub in Florida under the private provider program.",
  documents: [
    {
      name: "Stamped Construction Plans",
      description:
        "Spa plans sealed by a Florida-licensed design professional showing layout, plumbing, and electrical.",
      required: "always",
    },
    {
      name: "Equipment Specifications",
      description: "Manufacturer specs for pump, heater, blower, and controls.",
      required: "always",
    },
    {
      name: "Site / Spot Survey",
      description: "Survey showing property lines, setbacks, and spa location.",
      required: "always",
    },
    {
      name: "Product Approvals / NOA",
      description: "Product approvals for pre-fabricated shells when applicable.",
      required: "conditional",
    },
    {
      name: "Notice to Building Official (NTBO)",
      description: "Required when using a private provider (Flōridian).",
      required: "conditional",
    },
    {
      name: "Owner Authorization Form",
      description: "Private Provider Owner Authorization & Indemnification.",
      required: "conditional",
    },
  ],
  downloads: [
    {
      title: "Notice to Building Official — Use of Private Provider",
      meta: "Form 61G20-2.005 · FL Statute §553.791",
    },
    {
      title: "Private Provider Owner Authorization & Indemnification",
      meta: "FL Statute §553.791",
    },
  ],
  planReview: [
    {
      n: "01",
      title: "Spa barrier compliance",
      tags: ["Life Safety"],
      description:
        "Verify spa is protected by an approved code-compliant barrier or a lockable safety cover meeting ASTM F1346.",
      code: "ISPSC 305 · FBC-R R4501.17",
    },
    {
      n: "02",
      title: "Spa shell / pre-fab approval",
      tags: ["Documentation"],
      description:
        "Verify pre-fabricated spa carries a valid Florida Product Approval or listing.",
      code: "FBC-R R326 · FL Product Approval",
    },
    {
      n: "03",
      title: "Electrical panel and disconnect",
      tags: ["Code"],
      description:
        "Confirm dedicated GFCI circuit and disconnecting means are located per NEC 680.",
      code: "NEC 680.42",
    },
    {
      n: "04",
      title: "Setbacks",
      tags: ["Code"],
      description: "Verify jurisdictional setbacks from property lines and structures.",
      code: "Local zoning ordinance",
    },
  ],
  inspections: [
    {
      phase: "Phase 1",
      code: "602",
      title: "Spa Electric Bond",
      tags: ["Required", "Electrical", "Life Safety"],
      checks: [
        "Verify equipotential bonding of all metallic components per NEC 680",
        "Verify #8 AWG solid copper bond wire connections",
      ],
      refs: "NEC 680.26",
    },
    {
      phase: "Phase 2",
      code: "604",
      title: "Spa Piping Pressure Test",
      tags: ["Required", "Plumbing"],
      checks: [
        "Verify all spa plumbing lines hold 30 PSI for 30 minutes without loss",
        "Verify pipe material and fittings match approved plans",
      ],
      refs: "ISPSC 308 · FBC-P",
    },
    {
      phase: "Phase 3",
      code: "607",
      title: "Spa Safety Cover / Barrier",
      tags: ["Required", "Life Safety", "Critical"],
      checks: [
        "Verify ASTM F1346 lockable safety cover or code-compliant barrier is installed",
      ],
      refs: "ISPSC 305 · ASTM F1346",
    },
    {
      phase: "Phase 4",
      code: "608",
      title: "Spa Final Electric",
      tags: ["Required", "Electrical"],
      checks: [
        "Verify GFCI protection on spa circuit",
        "Verify disconnect location within sight of spa equipment",
        "Verify bonding continuity",
      ],
      refs: "NEC 680.42",
    },
    {
      phase: "Phase 5",
      code: "609",
      title: "Spa Final Piping",
      tags: ["Required", "Plumbing"],
      checks: [
        "Verify pump, heater, blower connected and leak-free under operating pressure",
      ],
      refs: "ISPSC 308 · FBC-P",
    },
    {
      phase: "Phase 6",
      code: "610",
      title: "Spa Final Building",
      tags: ["Required", "Typical Final", "Critical"],
      checks: [
        "Verify installed spa matches approved plans",
        "Verify safety cover and emergency shut-off installed",
        "Permit card must be on site — issues Certificate of Completion",
      ],
      refs: "ISPSC 307.2 · FBC-B 110.3",
    },
  ],
};

export const PORTAL_GUIDES: PortalGuide[] = [POOL_CONSTRUCTION, SPA_HOT_TUB];

export function getPortalGuide(slug: string): PortalGuide | undefined {
  return PORTAL_GUIDES.find((g) => g.slug === slug);
}
