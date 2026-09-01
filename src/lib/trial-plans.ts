// The three subscription tiers a trial account picks from when it authorizes payment.
// Prices mirror /pricing exactly — Blueprint $99, Foundation $249, Complete $499 per month —
// and the price ids are the Stripe lookup keys, stable across test and live.

export const TRIAL_DAYS = 90;

export type TrialPlan = {
  priceId: string;
  name: string;
  monthlyCents: number;
  tagline: string;
  highlights: string[];
  popular?: boolean;
};

export const TRIAL_PLANS: TrialPlan[] = [
  {
    priceId: "cleard_blueprint_monthly",
    name: "Blueprint",
    monthlyCents: 9900,
    tagline: "Stay licensed. Stay protected. Stay ready.",
    highlights: [
      "Permit tracking dashboard",
      "Licence & COI expiration alerts",
      "Document vault + portal login vault",
    ],
  },
  {
    priceId: "cleard_foundation_monthly",
    name: "Foundation",
    monthlyCents: 24900,
    tagline: "Everything in Blueprint, plus your subs.",
    highlights: [
      "Subcontractor onboarding & invites",
      "Licence verification + COI chasing",
      "Permit desk support on every job",
    ],
    popular: true,
  },
  {
    priceId: "cleard_complete_monthly",
    name: "Complete",
    monthlyCents: 49900,
    tagline: "The full private-provider platform.",
    highlights: [
      "Lien rights tracking & e-recording",
      "HOA submittals",
      "Priority handling across every municipality",
    ],
  },
];

export function planForPriceId(priceId: string | null | undefined): TrialPlan | undefined {
  return TRIAL_PLANS.find((p) => p.priceId === priceId);
}

export function formatMonthly(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}/mo`;
}
