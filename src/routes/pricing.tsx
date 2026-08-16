import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Cleard" },
      {
        name: "description",
        content:
          "Five services, one subscription. Starter $99/mo, Pro $249/mo, Back Office $499/mo. 14-day free trial, no credit card required.",
      },
      { property: "og:title", content: "One subscription. Your entire back office." },
      {
        property: "og:description",
        content:
          "Permitting administration, private plan review, license management, insurance compliance, and Victoria.AI from $99/month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const INK = "#111110";
const GRAY = "#6B6860";
const LIGHT = "#9E9B96";
const TEAL = "#00B4A8";
const BORDER = "#E4E2DE";
const OFF = "#F5F4F0";

type Plan = {
  name: string;
  price: string;
  inherits?: string;
  features: string[];
  limits: string;
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$99",
    features: [
      "Permitting Administration — tracking & pipeline",
      "Insurance Compliance — basic COI monitoring & expiration alerts",
      "Contractor License Management — verification dashboard",
      "Building department portal hub",
    ],
    limits: "Up to 5 active projects · 1 user seat",
  },
  {
    name: "Pro",
    price: "$249",
    popular: true,
    inherits: "Everything in Starter, plus:",
    features: [
      "Permitting Administration — full submission, corrections & CO management",
      "Private Plan Review & Inspections — 2-day plan review, same-day inspections",
      "Contractor License Management — renewal alerts and CE hour tracking",
      "Insurance Compliance — coverage validation and automated sub follow-up",
      "Victoria.AI — jurisdiction answers and missing-document flags",
    ],
    limits: "Up to 25 active projects · 3 user seats",
  },
  {
    name: "Back Office",
    price: "$499",
    inherits: "Everything in Pro, plus:",
    features: [
      "Contractor License Management — Cleard submits renewals on your behalf",
      "Contractor License Management — qualifying agent oversight",
      "Insurance Compliance — full subcontractor roster at any size",
      "Private Plan Review & Inspections — priority scheduling",
      "Victoria.AI — proactive compliance risk monitoring and correction routing",
    ],
    limits: "Unlimited projects · Unlimited user seats",
  },
];

function PricingPage() {
  return (
    <MarketingShell>
      <div style={{ background: "#FFFFFF", color: INK }}>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-10 md:pt-28">
          <div className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: LIGHT }}>
            Pricing
          </div>
          <h1
            className="mt-6 max-w-3xl"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            One subscription. Your entire back office.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
            Start with what you need today. Upgrade as your operation grows.
          </p>
        </section>

        {/* Plans */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-16">
          <div className="grid gap-5 md:grid-cols-3 items-stretch">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className="flex flex-col p-7"
                style={{
                  background: p.popular ? OFF : "#FFFFFF",
                  border: `1px solid ${p.popular ? TEAL : BORDER}`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[13px] uppercase tracking-[0.16em]" style={{ color: INK, fontWeight: 700 }}>
                    {p.name}
                  </div>
                  {p.popular && (
                    <span
                      className="px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                      style={{ background: TEAL, color: INK, fontWeight: 700 }}
                    >
                      Most popular
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span style={{ fontWeight: 800, fontSize: "2.75rem", letterSpacing: "-0.04em" }}>
                    {p.price}
                  </span>
                  <span className="text-[13px]" style={{ color: GRAY }}>
                    /month
                  </span>
                </div>

                {p.inherits && (
                  <p className="mt-5 text-[13px]" style={{ color: INK, fontWeight: 600 }}>
                    {p.inherits}
                  </p>
                )}

                <ul className="mt-5 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
                      <span className="text-[14px] leading-snug" style={{ color: INK }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 pt-5 text-[13px]" style={{ color: GRAY, borderTop: `1px solid ${BORDER}` }}>
                  {p.limits}
                </p>

                <Link
                  to="/join"
                  hash="request"
                  className="mt-6 inline-flex items-center justify-center px-5 py-3 text-[14px] no-underline"
                  style={
                    p.popular
                      ? { background: TEAL, color: INK, fontWeight: 700 }
                      : { background: "#FFFFFF", color: INK, border: `1px solid ${BORDER}`, fontWeight: 600 }
                  }
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[14px]" style={{ color: GRAY }}>
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>

          <p className="mt-3 text-[14px]" style={{ color: GRAY }}>
            Need something custom? Volume plans and specialty services are available on request.{" "}
            <Link to="/contact" className="underline" style={{ color: INK, fontWeight: 600 }}>
              Talk to us →
            </Link>
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
