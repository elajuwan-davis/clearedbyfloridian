export type Competitor = {
  slug: string;
  name: string;
  positioning: string;
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "1-contractor-solutions",
    name: "1 Contractor Solutions",
    positioning: "Florida-specific permit management, purpose-built for GCs — not just a permit expediter.",
  },
  {
    slug: "manual-permitting",
    name: "Manual Permitting",
    positioning: "Replace the spreadsheets, sticky notes, and endless email threads with a single system of record.",
  },
  {
    slug: "procore",
    name: "Procore",
    positioning: "Procore manages construction. Cléared manages permits — every jurisdiction, every trade.",
  },
  {
    slug: "buildertrend",
    name: "Buildertrend",
    positioning: "Buildertrend is a scheduling tool. Cléared is a permit operations platform for Florida contractors.",
  },
  {
    slug: "permit-flow",
    name: "Permit Flow",
    positioning: "Built for Florida's 400+ jurisdictions with private provider workflows baked in.",
  },
  {
    slug: "permitzip",
    name: "PermitZIP",
    positioning: "Bundled multi-trade submissions, sub coordination, and Florida jurisdiction intelligence in one platform.",
  },
  {
    slug: "in-house-permit-runner",
    name: "In-House Permit Runner",
    positioning: "One platform replaces the runner, the tracker, and the follow-up calls.",
  },
];

export type FeatureRow = {
  feature: string;
  cleared: boolean;
  competitor: "no" | "limited";
};

export const DEFAULT_FEATURE_MATRIX: FeatureRow[] = [
  { feature: "Permit Tracking", cleared: true, competitor: "limited" },
  { feature: "Bundled Multi-Trade Submission", cleared: true, competitor: "no" },
  { feature: "Sub Coordination & Signing", cleared: true, competitor: "no" },
  { feature: "COI Tracking", cleared: true, competitor: "limited" },
  { feature: "Jurisdiction Intelligence (400+ FL cities)", cleared: true, competitor: "no" },
  { feature: "Private Provider Docs", cleared: true, competitor: "no" },
  { feature: "AI Assistant (Victoria)", cleared: true, competitor: "no" },
  { feature: "Real-Time Status Notifications", cleared: true, competitor: "limited" },
  { feature: "Fee Savings Calculator", cleared: true, competitor: "no" },
  { feature: "Florida-Specific (not generic)", cleared: true, competitor: "no" },
];
