// Versus / competitor comparison content for the marketing site.
// Slugs map to /versus/cleard-vs-<slug-suffix> routes.

export type VersusRow = {
  feature: string;
  cleard: true | false;
  competitor: true | false | string; // string = short note e.g. "Limited"
};

export type VersusDiff = {
  icon: "shield" | "sparkles" | "layers";
  headline: string;
  body: string;
};

export type VersusCompetitor = {
  slug: string; // full route slug, e.g. "cleard-vs-permitflow"
  name: string;
  initial: string;
  cardBlurb: string;
  headline: string; // "\n" = line break
  sub: string;
  rows: VersusRow[];
  diffs: VersusDiff[];
};

export const VERSUS_COMPETITORS: VersusCompetitor[] = [
  {
    slug: "cleard-vs-permitflow",
    name: "PermitFlow",
    initial: "P",
    cardBlurb: "National permit software. No FL private-provider depth.",
    headline: "The permit platform built\nfor Florida. Not retrofitted.",
    sub: "PermitFlow is a $54M national platform — built for scale, not FL depth. Cleard holds Florida private-provider licensing under Statute 553.791, which PermitFlow does not. That means Cleard can legally submit and sign off on permits; PermitFlow cannot.",
    rows: [
      { feature: "FL private-provider license", cleard: true, competitor: false },
      { feature: "Victoria AI permit advisor", cleard: true, competitor: false },
      { feature: "Sub management + COI enforcement", cleard: true, competitor: false },
      { feature: "FL municipality intelligence", cleard: true, competitor: "Limited" },
      { feature: "Homeowner portal", cleard: true, competitor: false },
      { feature: "Inspection scheduling", cleard: true, competitor: "Limited" },
      { feature: "Failed inspection workflow", cleard: true, competitor: false },
      { feature: "Sub permit tracking", cleard: true, competitor: false },
      { feature: "Weekly GC reports", cleard: true, competitor: false },
      { feature: "FL-specific scope flags", cleard: true, competitor: false },
      { feature: "National coverage", cleard: false, competitor: true },
      { feature: "Enterprise pricing", cleard: false, competitor: true },
    ],
    diffs: [
      {
        icon: "shield",
        headline: "Private-provider license",
        body: "Cleard holds FL Statute 553.791 private-provider certification. This means we can legally review plans and sign off on permits — not just track them. PermitFlow is a SaaS tracking layer; Cleard is a licensed permit entity.",
      },
      {
        icon: "sparkles",
        headline: "Victoria AI",
        body: "Victoria monitors every active permit, reads municipality emails, and predicts timelines based on real FL data. PermitFlow has no AI advisor layer.",
      },
      {
        icon: "layers",
        headline: "FL depth, not FL support",
        body: "PermitFlow covers 50 states and treats Florida like every other market. Cleard is FL-only by design — every feature was built for FL municipalities, HVHZ requirements, and FL GC workflows.",
      },
    ],
  },
  {
    slug: "cleard-vs-greenlite",
    name: "GreenLite",
    initial: "G",
    cardBlurb: "General permit tracking. No sub management or COI gates.",
    headline: "Permit tracking is the floor.\nCleard is the ceiling.",
    sub: "GreenLite tracks permits. Cleard manages the entire permit lifecycle — submissions, corrections, sub compliance, inspections, and closeout — with an AI advisor watching every move.",
    rows: [
      { feature: "FL private-provider license", cleard: true, competitor: false },
      { feature: "Victoria AI permit advisor", cleard: true, competitor: false },
      { feature: "Sub management + COI enforcement", cleard: true, competitor: false },
      { feature: "Failed inspection workflow", cleard: true, competitor: false },
      { feature: "Municipality email parsing", cleard: true, competitor: false },
      { feature: "Sub portal (token-based)", cleard: true, competitor: false },
      { feature: "Homeowner portal", cleard: true, competitor: false },
      { feature: "Inspection scheduling", cleard: true, competitor: false },
      { feature: "Weekly GC email reports", cleard: true, competitor: false },
      { feature: "FL HVHZ + scope flags", cleard: true, competitor: false },
      { feature: "Permit tracking", cleard: true, competitor: true },
      { feature: "Document storage", cleard: true, competitor: true },
    ],
    diffs: [
      {
        icon: "shield",
        headline: "Sub compliance is built in",
        body: "Cleard enforces COI expiry, tracks sub permits by trade, and blocks site access when compliance lapses. GreenLite has no sub management layer.",
      },
      {
        icon: "sparkles",
        headline: "Victoria reads your emails",
        body: "When a municipality sends a correction notice, Victoria parses it, updates your permit status, and tells you what to do next. GreenLite requires manual status updates.",
      },
      {
        icon: "layers",
        headline: "Inspection lifecycle",
        body: "Schedule, log, and manage every inspection in Cleard. When something fails, a correction workflow fires automatically. GreenLite tracks permits; it doesn't manage what happens inside them.",
      },
    ],
  },
  {
    slug: "cleard-vs-fcc",
    name: "FCC",
    initial: "F",
    cardBlurb: "FL-based, one engineer. No AI, no sub portal, no automation.",
    headline: "One engineer or\nan AI-powered platform?",
    sub: "FCC is a one-person operation running FL permit compliance manually. Cleard is a full platform — Victoria AI, sub portals, automated COI enforcement, and inspection management — operating at the speed of software, not headcount.",
    rows: [
      { feature: "Victoria AI permit advisor", cleard: true, competitor: false },
      { feature: "Sub management + COI enforcement", cleard: true, competitor: false },
      { feature: "Sub portal (token-based)", cleard: true, competitor: false },
      { feature: "Homeowner portal", cleard: true, competitor: false },
      { feature: "Automated inspection workflow", cleard: true, competitor: false },
      { feature: "Municipality email parsing", cleard: true, competitor: false },
      { feature: "Weekly GC reports", cleard: true, competitor: false },
      { feature: "24/7 availability", cleard: true, competitor: false },
      { feature: "Scalable (10–100 projects)", cleard: true, competitor: false },
      { feature: "FL permit tracking", cleard: true, competitor: true },
      { feature: "Document management", cleard: true, competitor: "Limited" },
      { feature: "Personal service", cleard: false, competitor: true },
    ],
    diffs: [
      {
        icon: "layers",
        headline: "Software scales. Headcount doesn't.",
        body: "FCC is one person. Cleard runs on software — Victoria monitors permits at 2am, automations fire on municipality emails, and your GC portal updates in real time. No single point of failure.",
      },
      {
        icon: "shield",
        headline: "Your subs get a portal, not an email chain.",
        body: "Cleard gives every sub a token-based portal for COI uploads, permit status, and compliance tracking. FCC manages this manually.",
      },
      {
        icon: "sparkles",
        headline: "Intelligence, not effort",
        body: "Cleard's Victoria AI predicts FL municipality timelines, flags scope issues before submission, and drafts correction responses. FCC relies on human review of the same information.",
      },
    ],
  },
];

export function findVersusCompetitor(slug: string): VersusCompetitor | undefined {
  return VERSUS_COMPETITORS.find((c) => c.slug === slug);
}
