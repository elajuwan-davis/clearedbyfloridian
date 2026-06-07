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
    number: "FLO-2026-0184",
    address: "412 Hibiscus Ln, Coral Gables, FL",
    scope: "Two-story SFR addition · 1,840 sqft",
    jurisdiction: "Miami-Dade",
    status: "Plan Review",
    submittedAt: "2026-05-22",
    reviewer: "M. Alvarez, P.E.",
    valuation: 612000,
    progress: 42,
  },
  {
    id: "p2",
    number: "FLO-2026-0179",
    address: "88 Ocean Dr, Miami Beach, FL",
    scope: "Full interior remodel + impact windows",
    jurisdiction: "Miami Beach",
    status: "Approved",
    submittedAt: "2026-05-14",
    reviewer: "R. Chen, AIA",
    valuation: 285000,
    progress: 78,
  },
  {
    id: "p3",
    number: "FLO-2026-0168",
    address: "1402 Tigertail Ave, Coconut Grove, FL",
    scope: "New custom SFR · 4,200 sqft",
    jurisdiction: "City of Miami",
    status: "Revisions Required",
    submittedAt: "2026-04-30",
    reviewer: "J. Pereira, P.E.",
    valuation: 1840000,
    progress: 35,
  },
  {
    id: "p4",
    number: "FLO-2026-0151",
    address: "27 Palm Island, Miami Beach, FL",
    scope: "Pool, deck, and seawall reconstruction",
    jurisdiction: "Miami Beach",
    status: "Inspections",
    submittedAt: "2026-04-11",
    reviewer: "M. Alvarez, P.E.",
    valuation: 410000,
    progress: 88,
  },
  {
    id: "p5",
    number: "FLO-2026-0142",
    address: "9120 SW 72nd St, Pinecrest, FL",
    scope: "Kitchen + primary suite addition",
    jurisdiction: "Pinecrest",
    status: "Closed",
    submittedAt: "2026-03-02",
    reviewer: "R. Chen, AIA",
    valuation: 198000,
    progress: 100,
  },
  {
    id: "p6",
    number: "FLO-2026-0198",
    address: "601 Sunset Dr, Key Biscayne, FL",
    scope: "Roof replacement + structural reinforcement",
    jurisdiction: "Key Biscayne",
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
    address: "27 Palm Island, Miami Beach, FL",
  },
  {
    id: "i2",
    permitId: "p4",
    type: "Pool steel",
    scheduledFor: "2026-06-10T13:00:00",
    inspector: "D. Ortiz",
    status: "Scheduled",
    address: "27 Palm Island, Miami Beach, FL",
  },
  {
    id: "i3",
    permitId: "p2",
    type: "Window buck",
    scheduledFor: "2026-06-08T08:00:00",
    inspector: "S. Whitfield",
    status: "Passed",
    address: "88 Ocean Dr, Miami Beach, FL",
  },
  {
    id: "i4",
    permitId: "p2",
    type: "Drywall screw pattern",
    scheduledFor: "2026-06-11T10:00:00",
    inspector: "S. Whitfield",
    status: "Scheduled",
    address: "88 Ocean Dr, Miami Beach, FL",
  },
  {
    id: "i5",
    permitId: "p1",
    type: "Foundation form",
    scheduledFor: "2026-06-12T07:30:00",
    inspector: "D. Ortiz",
    status: "Pending Reschedule",
    address: "412 Hibiscus Ln, Coral Gables, FL",
  },
];

export const services = [
  {
    code: "01",
    title: "Private Plan Review",
    summary:
      "Licensed third-party plan review for residential permits across South Florida — typically 5–7 business days, not 5–7 weeks.",
    bullets: [
      "Structural, architectural, MEP, and energy review",
      "Florida Building Code, 8th Edition (2023) compliant",
      "Direct coordination with your design team",
    ],
  },
  {
    code: "02",
    title: "Private Provider Inspections",
    summary:
      "Threshold and routine inspections on your schedule. We meet you on site — no four-hour windows, no missed days.",
    bullets: [
      "Same- or next-day scheduling",
      "Digital reports delivered within 2 hours",
      "Failed-item re-inspections within 24 hours",
    ],
  },
  {
    code: "03",
    title: "Permit Coordination",
    summary:
      "We handle the building department from intake to close-out so your superintendents stay on the jobsite.",
    bullets: [
      "Jurisdiction submittal and corrections",
      "Status visibility through the Flōridian portal",
      "Close-out, CO, and records archival",
    ],
  },
  {
    code: "04",
    title: "Pre-Construction Code Review",
    summary:
      "Engaged early with architects and GCs to surface code issues while they are still pencil edits, not field changes.",
    bullets: [
      "Constructibility and code red-line",
      "High-velocity hurricane zone (HVHZ) detailing",
      "Hardening, flood, and resiliency strategy",
    ],
  },
];

export const jurisdictions = [
  "Miami-Dade",
  "Miami Beach",
  "City of Miami",
  "Coral Gables",
  "Coconut Grove",
  "Pinecrest",
  "Key Biscayne",
  "Doral",
  "Aventura",
  "Hialeah",
  "Broward (Unincorporated)",
  "Fort Lauderdale",
  "Hollywood",
  "Monroe County",
];
