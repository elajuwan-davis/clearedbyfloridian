export type PermitStatus =
  | "Intake"
  | "Plan Review"
  | "Revisions Required"
  | "Approved"
  | "Inspections"
  | "Closed";

export type Permit = {
  id: string;
  number: string;
  address: string;
  scope: string;
  jurisdiction: string;
  status: PermitStatus;
  submittedAt: string;
  reviewer: string;
  valuation: number;
  progress: number;
};

export type Inspection = {
  id: string;
  permitId: string;
  type: string;
  scheduledFor: string;
  inspector: string;
  status: "Scheduled" | "Passed" | "Failed" | "Pending Reschedule";
  address: string;
};

export const permits: Permit[] = [
  {
    id: "p1",
    number: "CLR-2026-0184",
    address: "1217 S Ocean Blvd, Manalapan, FL",
    scope: "Oceanfront pool, spa, summer kitchen · Flōridian",
    jurisdiction: "Manalapan",
    status: "Plan Review",
    submittedAt: "2026-05-22",
    reviewer: "M. Alvarez, P.E.",
    valuation: 612000,
    progress: 42,
  },
  {
    id: "p2",
    number: "CLR-2026-0179",
    address: "88 N County Rd, Palm Beach, FL",
    scope: "Full hardscape + impact windows",
    jurisdiction: "Palm Beach",
    status: "Approved",
    submittedAt: "2026-05-14",
    reviewer: "R. Chen, AIA",
    valuation: 285000,
    progress: 78,
  },
  {
    id: "p3",
    number: "CLR-2026-0168",
    address: "1402 Banyan Rd, Boca Raton, FL",
    scope: "New custom SFR · 4,200 sqft · Flōridian pool",
    jurisdiction: "Boca Raton",
    status: "Revisions Required",
    submittedAt: "2026-04-30",
    reviewer: "J. Pereira, P.E.",
    valuation: 1840000,
    progress: 35,
  },
  {
    id: "p4",
    number: "CLR-2026-0151",
    address: "27 S Beach Rd, Jupiter Island, FL",
    scope: "Pool, deck, and seawall reconstruction",
    jurisdiction: "Hobe Sound",
    status: "Inspections",
    submittedAt: "2026-04-11",
    reviewer: "M. Alvarez, P.E.",
    valuation: 410000,
    progress: 88,
  },
  {
    id: "p5",
    number: "CLR-2026-0142",
    address: "9120 SE Mariposa Ave, Hobe Sound, FL",
    scope: "Lanai expansion + primary suite addition",
    jurisdiction: "Martin County",
    status: "Closed",
    submittedAt: "2026-03-02",
    reviewer: "R. Chen, AIA",
    valuation: 198000,
    progress: 100,
  },
  {
    id: "p6",
    number: "CLR-2026-0198",
    address: "601 Bridge Rd, Tequesta, FL",
    scope: "Roof replacement + structural reinforcement",
    jurisdiction: "Tequesta",
    status: "Intake",
    submittedAt: "2026-06-01",
    reviewer: "Unassigned",
    valuation: 92000,
    progress: 8,
  },
];

export const inspections: Inspection[] = [
  {
    id: "i1",
    permitId: "p4",
    type: "Final framing",
    scheduledFor: "2026-06-09T09:30:00",
    inspector: "D. Ortiz",
    status: "Scheduled",
    address: "27 S Beach Rd, Jupiter Island, FL",
  },
  {
    id: "i2",
    permitId: "p4",
    type: "Pool steel",
    scheduledFor: "2026-06-10T13:00:00",
    inspector: "D. Ortiz",
    status: "Scheduled",
    address: "27 S Beach Rd, Jupiter Island, FL",
  },
  {
    id: "i3",
    permitId: "p2",
    type: "Window buck",
    scheduledFor: "2026-06-08T08:00:00",
    inspector: "S. Whitfield",
    status: "Passed",
    address: "88 N County Rd, Palm Beach, FL",
  },
  {
    id: "i4",
    permitId: "p2",
    type: "Drywall screw pattern",
    scheduledFor: "2026-06-11T10:00:00",
    inspector: "S. Whitfield",
    status: "Scheduled",
    address: "88 N County Rd, Palm Beach, FL",
  },
  {
    id: "i5",
    permitId: "p1",
    type: "Pool deck form",
    scheduledFor: "2026-06-12T07:30:00",
    inspector: "D. Ortiz",
    status: "Pending Reschedule",
    address: "1217 S Ocean Blvd, Manalapan, FL",
  },
];

export const services = [
  {
    code: "01",
    title: "Permit Administration",
    summary:
      "We manage the full permit lifecycle — intake, submittal, corrections, and close-out — so your team stays on site, not in line at the building department.",
    bullets: [
      "Permit intake and document preparation",
      "Jurisdiction submittal and corrections",
      "Status tracking through the Cleard portal",
      "Records archival and close-out",
    ],
  },
  {
    code: "02",
    title: "Subcontractor Coordination",
    summary:
      "Cleard verifies every sub's license, insurance, and compliance documentation before they touch the job — automatically.",
    bullets: [
      "DBPR license verification",
      "COI, Workers' Comp, and Umbrella review",
      "W-9 and onboarding document collection",
      "Real-time compliance status dashboard",
    ],
  },
  {
    code: "03",
    title: "Private Plan Review & Inspection",
    summary:
      "As a registered private provider under Florida Statute 553.791, we deliver 2-day plan review and same-day inspections — on a statutory clock.",
    bullets: [
      "Structural, mechanical, electrical, and plumbing review",
      "High-velocity hurricane zone (HVHZ) compliance",
      "Same-day field inspection scheduling",
      "Code red-line and constructibility feedback",
    ],
  },
  {
    code: "04",
    title: "Certificate of Occupancy",
    summary:
      "We coordinate final inspections, punch through outstanding corrections, and drive every job to CO — without leaving it on someone else's desk.",
    bullets: [
      "Final inspection coordination",
      "CO and TCO tracking",
      "Lien release and NTO compliance",
      "Project close-out documentation",
    ],
  },
];

export const jurisdictions = [
  "Palm Beach",
  "West Palm Beach",
  "Manalapan",
  "Jupiter",
  "Tequesta",
  "Wellington",
  "Boca Raton",
  "Delray Beach",
  "Highland Beach",
  "Gulf Stream",
  "Hobe Sound",
  "Stuart",
  "Vero Beach",
  "Martin County",
];
