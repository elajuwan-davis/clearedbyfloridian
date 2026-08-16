export type Competitor = {
  slug: string;
  name: string;
  positioning: string;
};

export const COMPETITORS: Competitor[] = [
  {
    slug: "1-contractor-solutions",
    name: "1 Contractor Solutions",
    positioning: "Purpose-built permit management for GCs — not just a permit expediter.",
  },
  {
    slug: "permit-flow",
    name: "Permit Flow",
    positioning: "Built for thousands of jurisdictions with private provider workflows baked in.",
  },
  {
    slug: "in-house-permit-runner",
    name: "In-House Permit Runner",
    positioning: "One platform replaces the runner, the tracker, and the follow-up calls.",
  },
  {
    slug: "freedom-code-compliance",
    name: "Freedom Code Compliance",
    positioning: "Fast plan reviews and inspections — but no software, no sub coordination, and no permit management platform.",
  },
  {
    slug: "construct-cc",
    name: "Construct CC",
    positioning: "Permitting admin support — but without the bundled submission capability, jurisdiction intelligence, or integrated sub signing that Cleard delivers.",
  },
  {
    slug: "tew-and-taylor",
    name: "Tew & Taylor",
    positioning: "Respected private provider services — but a human-staffed service bureau, not a platform your team operates inside.",
  },
  {
    slug: "ues",
    name: "UES (Team UES)",
    positioning: "Engineering-backed inspections at scale — but no GC-facing permit management, no document workflows, and no fee savings tools.",
  },
];

export type FeatureRow = {
  feature: string;
  cleared: boolean;
  competitor: "no" | "limited";
};

export const DEFAULT_FEATURE_MATRIX: FeatureRow[] = [
  { feature: "Permitting Administration", cleared: true, competitor: "limited" },
  { feature: "Private Plan Review & Inspections", cleared: true, competitor: "no" },
  { feature: "Contractor License Management", cleared: true, competitor: "no" },
  { feature: "Insurance Compliance", cleared: true, competitor: "limited" },
  { feature: "Victoria.AI", cleared: true, competitor: "no" },
];
