import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createSubscriptionCheckout } from "@/lib/payments.functions";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { StripeEmbedded } from "@/components/stripe-embedded";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { PublicShell } from "@/components/public-shell";
import { Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Cleard" },
      {
        name: "description",
        content:
          "Cleard SaaS pricing: Solo $149, Pro $299, Firm $599 per month. Per-project service fee: 1% under $1M, 0.5% at $1M and above — bundled permit administration, plan review, inspections, and C.O. coordination.",
      },
      { property: "og:title", content: "Pricing — Cleard" },
      {
        property: "og:description",
        content:
          "Transparent Cleard pricing — SaaS tiers plus a single per-project service fee. No à la carte.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingPage,
});

type Tier = {
  id: string;
  name: string;
  priceLabel: string;
  tagline: string;
  priceId: string;
  featured?: boolean;
  bullets: string[];
};

const TIERS: Tier[] = [
  {
    id: "solo",
    name: "Solo",
    priceLabel: "$149",
    tagline: "Up to 5 active permits",
    priceId: "cleard_solo_monthly",
    bullets: [
      "Full permit pipeline & Dispatch",
      "Sub coordination & COI tracking",
      "HOA submittal engine",
      "Victoria AI (50 questions/day)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceLabel: "$299",
    tagline: "Up to 15 active permits",
    priceId: "cleard_pro_monthly",
    featured: true,
    bullets: [
      "Everything in Solo",
      "Team seats & tenant sharing",
      "Weekly executive reports",
      "Priority Victoria intelligence",
    ],
  },
  {
    id: "firm",
    name: "Firm",
    priceLabel: "$599",
    tagline: "Unlimited permits",
    priceId: "cleard_firm_monthly",
    bullets: [
      "Everything in Pro",
      "Unlimited active permits",
      "Custom onboarding",
      "Dedicated account routing",
    ],
  },
];

function PricingPage() {
  const startCheckout = useServerFn(createSubscriptionCheckout);
  const [openTier, setOpenTier] = useState<string | null>(null);

  const fetchClientSecret = async (priceId: string) => {
    if (!isPaymentsConfigured()) throw new Error("Checkout unavailable — payments not configured");
    const result = await startCheckout({
      data: {
        priceId,
        returnUrl: `${window.location.origin}/portal?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  const activeTier = TIERS.find((t) => t.id === openTier);

  return (
    <PublicShell>
      <PaymentTestModeBanner />
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-obsidian/60">
            Pricing · Transparent · No à la carte
          </div>
          <h1 className="display-serif text-5xl md:text-6xl mt-4 leading-[1.05] text-obsidian">
            One subscription. One service fee. <em>Everything included.</em>
          </h1>
          <p className="mt-5 text-obsidian/70 leading-relaxed">
            Cleard bundles permit administration, plan review, inspections, C.O. coordination, sub
            coordination, HOA submittal, Dispatch, Victoria AI, and municipal follow-up into a single
            per-project service fee — on top of your SaaS subscription. No line-item surprises.
          </p>
        </div>

        {/* SaaS tiers */}
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-[3px] border ${
                tier.featured
                  ? "border-obsidian bg-obsidian text-white"
                  : "border-obsidian/15 bg-white text-obsidian"
              } p-8 flex flex-col`}
            >
              <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tier.featured ? "text-white/60" : "text-obsidian/50"}`}>
                {tier.name}
              </div>
              <div className="display-serif text-5xl mt-3">
                {tier.priceLabel}
                <span className={`ml-1 text-sm font-mono uppercase tracking-[0.14em] ${tier.featured ? "text-white/60" : "text-obsidian/50"}`}>
                  /mo
                </span>
              </div>
              <div className={`mt-2 text-sm ${tier.featured ? "text-white/80" : "text-obsidian/70"}`}>
                {tier.tagline}
              </div>
              <ul className="mt-6 space-y-2 flex-1">
                {tier.bullets.map((b) => (
                  <li key={b} className={`text-sm flex items-start gap-2 ${tier.featured ? "text-white/85" : "text-obsidian/80"}`}>
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${tier.featured ? "text-[#B6DAEA]" : "text-obsidian/60"}`} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!isPaymentsConfigured()) {
                    toast.error("Checkout is not configured for this build.");
                    return;
                  }
                  setOpenTier(tier.id);
                }}
                className={`mt-7 h-11 rounded-[3px] font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  tier.featured
                    ? "bg-white text-obsidian hover:bg-[#B6DAEA]"
                    : "bg-obsidian text-white hover:bg-obsidian/90"
                }`}
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>

        {/* Service fee */}
        <div className="mt-16 rounded-[3px] border border-obsidian/15 bg-white p-10">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">
            Service Fee · Per Project
          </div>
          <h2 className="display-serif text-3xl md:text-4xl mt-3 text-obsidian leading-tight">
            One flat percentage of total project value. <em>Everything bundled.</em>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="rounded-[3px] border border-obsidian/10 p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-obsidian/50">
                Under $1,000,000
              </div>
              <div className="display-serif text-5xl mt-2 text-obsidian">1%</div>
              <div className="text-sm text-obsidian/60 mt-1">of total project value</div>
            </div>
            <div className="rounded-[3px] border border-obsidian bg-obsidian text-white p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
                $1,000,000 and above
              </div>
              <div className="display-serif text-5xl mt-2">0.5%</div>
              <div className="text-sm text-white/70 mt-1">of total project value</div>
            </div>
          </div>
          <p className="mt-6 text-sm text-obsidian/70 leading-relaxed">
            Covers everything: full permit administration (all scopes + sub-permits bundled), sub
            coordination, HOA submittal, Dispatch pre-flight intelligence, Private Provider plan
            review and inspections, C.O. coordination, Victoria AI, and municipal follow-up + resubmittals.
            Invoiced when the permit reaches <em>Cleared for Takeoff</em>. Stripe processing (2.9% + $0.30)
            is passed through at checkout.
          </p>
        </div>
      </section>

      {activeTier && (
        <StripeEmbedded
          fetchClientSecret={() => fetchClientSecret(activeTier.priceId)}
          onClose={() => setOpenTier(null)}
        />
      )}
    </PublicShell>
  );
}
