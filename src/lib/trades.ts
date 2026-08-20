// Trade landing page content. Shared services/stats copy lives in the page component.

export type Trade = {
  slug: string;
  eyebrow: string;
  navLabel: string;
  headline: string;
  subhead: string;
  pains: string[];
};

export const TRADES: Trade[] = [
  {
    slug: "general-contractors",
    eyebrow: "General Contractors",
    navLabel: "General Contractors",
    headline: "Your back office. Every jurisdiction you build in.",
    subhead:
      "Cleard handles permitting, plan review, inspections, lien rights, license compliance, and insurance — so your PMs and supers can run the job, not the paperwork.",
    pains: [
      "Permit delays pushing starts, pours, and roughs off schedule",
      "Correction cycles turning one permit into three more weeks of waiting",
      "Chasing sub licenses and expired COIs before every pull",
      "Lien deadlines falling through the cracks on multi-phase projects",
      "Inspection timing forcing crews to sit on site",
    ],
  },
  {
    slug: "pool-builders",
    eyebrow: "Pool Builders",
    navLabel: "Pool Builders",
    headline: "Permits pulled. Inspections passed. Jobs finished.",
    subhead:
      "Cleard manages the full permit and inspection lifecycle for pool contractors — from application to final CO — so your crews stay on schedule and off the phone with the building department.",
    pains: [
      "Permit delays pushing dig and pour dates",
      "Structural and barrier inspection timing",
      "Multi-trade coordination across pool, electric, and plumbing pulls",
      "Sub license and COI gaps holding up inspections",
      "Lien deadlines missed on spec builds",
    ],
  },
  {
    slug: "hvac-contractors",
    eyebrow: "HVAC Contractors",
    navLabel: "HVAC Contractors",
    headline: "Mechanical permits. Managed.",
    subhead:
      "Cleard handles mechanical permit submissions, inspection scheduling, and back-office compliance so your techs stay on the job — not waiting on a permit counter.",
    pains: [
      "Mechanical permit delays pushing equipment installs",
      "Inspection windows forcing crews off schedule",
      "License and COI compliance across large sub rosters",
      "Pulling permits in multiple jurisdictions with different requirements",
      "Missed lien deadlines on larger commercial installs",
    ],
  },
  {
    slug: "roofing-contractors",
    eyebrow: "Roofing Contractors",
    navLabel: "Roofing Contractors",
    headline: "Roof permits. No delays. No paperwork.",
    subhead:
      "Cleard submits roofing permits, tracks inspections, and manages your compliance stack so your crews can focus on production — not the permit portal.",
    pains: [
      "Permit delays pushing start dates on weather-sensitive jobs",
      "Re-inspection cycles costing crew days",
      "License and insurance gaps with subs",
      "Managing permits across multiple active jobs simultaneously",
      "Lien filing deadlines on large replacement projects",
    ],
  },
  {
    slug: "electrical-contractors",
    eyebrow: "Electrical Contractors",
    navLabel: "Electrical Contractors",
    headline: "Electrical permits. Handled end to end.",
    subhead:
      "Cleard manages electrical permit submissions, inspection coordination, and license compliance so your foremen can run the job — not the building department.",
    pains: [
      "Permit delays pushing rough-in and trim schedules",
      "Inspection timing stacking multiple crews on site",
      "License verification for electricians and apprentices",
      "Multi-trade permit coordination on large builds",
      "Lien rights management on commercial projects",
    ],
  },
  {
    slug: "plumbing-contractors",
    eyebrow: "Plumbing Contractors",
    navLabel: "Plumbing Contractors",
    headline: "Plumbing permits. Every jurisdiction. One back office.",
    subhead:
      "Cleard handles plumbing permit applications, inspection scheduling, and compliance tracking across every jurisdiction you work in.",
    pains: [
      "Permit delays pushing rough-in and top-out schedules",
      "Inspection windows forcing crews to sit on site",
      "License and COI compliance for large plumbing crews",
      "Managing permits across multiple active jobs",
      "Lien deadlines on commercial and multi-family projects",
    ],
  },
  {
    slug: "solar-contractors",
    eyebrow: "Solar Contractors",
    navLabel: "Solar Contractors",
    headline: "Solar permits. Faster path to PTO.",
    subhead:
      "Cleard accelerates solar permit submissions and inspection scheduling so your crews spend more time installing and less time waiting on approvals.",
    pains: [
      "Permit delays pushing installation and interconnection timelines",
      "Plan review cycles slowing PTO",
      "Structural and electrical permit coordination",
      "License and insurance compliance for crews and subs",
      "Managing high permit volumes across multiple jurisdictions",
    ],
  },
  {
    slug: "home-builders",
    eyebrow: "Home Builders",
    navLabel: "Home Builders",
    headline: "From permit to CO. Your entire back office.",
    subhead:
      "Cleard manages the full permit and inspection lifecycle for residential home builders — applications, plan reviews, inspections, lien rights, and compliance — across every jurisdiction you build in.",
    pains: [
      "Permit delays pushing starts and frame schedules",
      "Multi-trade inspection coordination across phases",
      "Lien filing deadlines on spec and custom builds",
      "Sub license and COI management across large rosters",
      "Managing permits across multiple active communities",
    ],
  },
  {
    slug: "commercial-builders",
    eyebrow: "Commercial Builders",
    navLabel: "Commercial Builders",
    headline: "Commercial permitting. Built for scale.",
    subhead:
      "Cleard handles complex commercial permit submissions, plan review coordination, multi-trade inspection scheduling, and compliance operations for builders running large and multi-site projects.",
    pains: [
      "Multi-department permit coordination across trades",
      "Plan review cycles delaying construction starts",
      "Inspection scheduling across concurrent phases",
      "Lien rights compliance on large commercial contracts",
      "License and insurance verification for large sub rosters",
    ],
  },
  {
    slug: "aluminum-contractors",
    eyebrow: "Aluminum Contractors",
    navLabel: "Aluminum Contractors",
    headline: "Aluminum and screen permits. No more waiting.",
    subhead:
      "Cleard submits aluminum structure permits, coordinates inspections, and manages your compliance stack so your crews can move from job to job without permit delays.",
    pains: [
      "Permit delays pushing enclosure and screen room installs",
      "Inspection timing on back-to-back jobs",
      "License and COI compliance",
      "Multi-jurisdiction permit management",
      "Lien deadlines on larger enclosure projects",
    ],
  },
  {
    slug: "window-door-contractors",
    eyebrow: "Window & Door Contractors",
    navLabel: "Window & Door Contractors",
    headline: "Window and door permits. Pulled fast.",
    subhead:
      "Cleard manages window and door permit submissions and inspection scheduling so your installation crews stay productive — not waiting on approvals.",
    pains: [
      "Permit delays pushing installation windows",
      "Product approval documentation management",
      "License and COI compliance",
      "High-volume permit management across multiple jobs",
      "Inspection timing on occupied homes",
    ],
  },
  {
    slug: "fence-contractors",
    eyebrow: "Fence Contractors",
    navLabel: "Fence Contractors",
    headline: "Fence permits. Submitted. Approved. Done.",
    subhead:
      "Cleard handles fence permit submissions and inspection scheduling across every jurisdiction you work in — so your crews install on schedule.",
    pains: [
      "Permit delays pushing installation dates",
      "Inconsistent requirements across jurisdictions",
      "License and COI compliance",
      "Managing permits across high job volumes",
      "HOA and setback documentation coordination",
    ],
  },
  {
    slug: "generator-contractors",
    eyebrow: "Generator Contractors",
    navLabel: "Generator Contractors",
    headline: "Generator permits. Every jurisdiction.",
    subhead:
      "Cleard manages generator permit submissions, inspection coordination, and compliance tracking so your install crews stay on schedule.",
    pains: [
      "Permit delays pushing generator installation timelines",
      "Mechanical and electrical permit coordination",
      "License and COI compliance",
      "Multi-jurisdiction permit management",
      "Inspection scheduling on occupied homes",
    ],
  },
  {
    slug: "foundation-contractors",
    eyebrow: "Foundation Contractors",
    navLabel: "Foundation Contractors",
    headline: "Foundation permits. Keep the schedule moving.",
    subhead:
      "Cleard submits foundation permits and coordinates inspections so your crews can break ground on schedule — not wait on a permit counter.",
    pains: [
      "Permit delays pushing dig and pour dates",
      "Structural inspection timing",
      "Multi-trade coordination with GCs",
      "License and COI compliance",
      "Lien rights on large residential and commercial projects",
    ],
  },
  {
    slug: "demolition-contractors",
    eyebrow: "Demolition Contractors",
    navLabel: "Demolition Contractors",
    headline: "Demo permits. Fast.",
    subhead:
      "Cleard handles demolition permit applications and inspection scheduling so your crews can start on time.",
    pains: [
      "Permit delays pushing demo start dates",
      "Utility disconnect coordination",
      "License and COI compliance",
      "Multi-jurisdiction permit management",
      "Environmental clearance documentation",
    ],
  },
  {
    slug: "hurricane-shutter-contractors",
    eyebrow: "Hurricane Shutter Contractors",
    navLabel: "Hurricane Shutter Contractors",
    headline: "Shutter permits. Pulled before storm season.",
    subhead:
      "Cleard manages hurricane shutter permit submissions and inspection scheduling so your installation crews can move fast when demand surges.",
    pains: [
      "Permit delays in high-volume storm prep seasons",
      "Product approval documentation",
      "License and COI compliance",
      "High job volume permit management",
      "Inspection scheduling on occupied homes",
    ],
  },
  {
    slug: "flood-panel-contractors",
    eyebrow: "Flood Panel Contractors",
    navLabel: "Flood Panel Contractors",
    headline: "Flood panel permits. Ready when you are.",
    subhead:
      "Cleard handles flood panel permit submissions and inspection coordination so your crews can install on schedule.",
    pains: [
      "Permit delays on time-sensitive installs",
      "Product approval and documentation management",
      "License and COI compliance",
      "Multi-jurisdiction permit requirements",
      "Inspection coordination on occupied properties",
    ],
  },
];

export function getTrade(slug: string): Trade | undefined {
  return TRADES.find((t) => t.slug === slug);
}
