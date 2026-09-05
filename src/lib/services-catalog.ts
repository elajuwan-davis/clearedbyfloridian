// Canonical marketing service catalog — exactly 5 services, national/jurisdiction-neutral.
// These names are canonical: use them verbatim everywhere services are listed.

export type MarketingService = {
  code: string;
  name: string;
  description: string;
  bullets: string[];
};

export const MARKETING_SERVICES: MarketingService[] = [
  {
    code: "01",
    name: "Permitting Administration",
    description:
      "Full-service permit management — application, submission, tracking, corrections, and certificate of occupancy, handled end to end.",
    bullets: [
      "Application prep and jurisdiction submittal",
      "Smart document checklists per jurisdiction",
      "Correction responses and resubmittals",
      "Real-time status tracking through certificate of occupancy",
    ],
  },
  {
    code: "02",
    name: "Private Plan Review & Inspections",
    description:
      "Faster approvals through licensed private providers. Plan review and field inspections performed by certified professionals, not municipal backlogs.",
    bullets: [
      "2-day plan review by licensed engineers and architects",
      "Same-day inspections coordinated with your super",
      "Structural, mechanical, electrical, and plumbing review",
      "Documented correction log on the original plan set",
    ],
  },
  {
    code: "03",
    name: "Contractor License Management",
    description:
      "License verification, renewal tracking, CE hour monitoring, and qualifying agent oversight — all in one dashboard.",
    bullets: [
      "Live license status for your company and every sub",
      "Renewal alerts at 90/60/30 days",
      "Continuing education hour tracking",
      "Qualifying agent monitoring and change-of-status support",
    ],
  },
  {
    code: "04",
    name: "Insurance Compliance",
    description:
      "Certificate of insurance collection, coverage validation, expiration tracking, and automated follow-up for your entire subcontractor roster.",
    bullets: [
      "COI requests with required coverage specs per trade",
      "Coverage validation: types, limits, additional insured",
      "Automated follow-up reminders until compliant",
      "Expiration alerts at 90/60/30 days",
    ],
  },
  {
    code: "05",
    name: "Lien Rights",
    description:
      "Notice of Commencement, Notices to Owner, Lien Waivers, and statutory deadline tracking — generated, signed, and recorded without leaving the platform.",
    bullets: [
      "Notice of Commencement prep, signature, and recording",
      "Notices to Owner",
      "Conditional and unconditional lien waivers",
      "Statutory deadline tracking with countdown alerts",
    ],
  },
];
