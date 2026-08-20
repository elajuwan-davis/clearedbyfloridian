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
          "Simple, transparent pricing. Blueprint $99/mo, Foundation $249/mo, Complete $499/mo, plus per-project permit administration and plan review add-ons.",
      },
      { property: "og:title", content: "Simple, transparent pricing." },
      {
        property: "og:description",
        content:
          "The platform runs year-round. Add services when you need them. Subscriptions from $99/month plus per-project add-ons.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const INK = "#2F4F4F";
const GRAY = "#7A5C68";
const LIGHT = "#8B9A97";
const GREEN = "#2F4F4F"; /* minor accent only */
const TEAL = "#673147";
const BORDER = "#E0D3BC";
const OFF = "#F3EAD9";

type Plan = {
  name: string;
  price: string;
  tagline: string;
  blurb?: string;
  inherits?: string;
  features: string[];
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Blueprint",
    price: "$99",
    tagline: "Stay licensed. Stay protected. Stay ready.",
    blurb:
      "For solo contractors and small operators who need compliance infrastructure year-round — not just when they're pulling permits.",
    features: [
      "Permit tracking dashboard (all active permits, status, milestones, alerts)",
      "License expiration alerts (90/60/30-day)",
      "COI storage + expiration monitoring",
      "Lien rights calendar (deadline alerts)",
      "Document vault (license, insurance, W-9, sub agreements)",
      "Project Guides (permit knowledge base)",
      "Victoria AI — 25 questions/day",
    ],
  },
  {
    name: "Foundation",
    price: "$249",
    popular: true,
    tagline: "For growing contractors who need compliance operations, not just tracking.",
    inherits: "Everything in Blueprint, plus:",
    features: [
      "Lien document generation + filing deadlines",
      "Continuing education (CE) hour tracking",
      "Qualifying Agent status monitoring",
      "Sub license verification dashboard",
      "Building Department login manager",
      "Project-threaded messaging inbox",
      "Victoria AI — 100 questions/day",
    ],
  },
  {
    name: "Complete",
    price: "$499",
    tagline: "Your entire back office. One platform.",
    inherits: "Everything in Foundation, plus:",
    features: [
      "Marketplace access (subcontractor network, trade referrals)",
      "License renewal management (Cleard files on your behalf)",
      "Worker's comp exemption tracking",
      "DBPR filing support",
      "COI auto-request for all subs",
      "Unlimited sub roster",
      "Priority support",
      "Victoria AI — unlimited",
    ],
  },
];

type AddOn = {
  name: string;
  description: string;
  rows: { label: string; price: string; detail?: string }[];
  footnote?: { title: string; items: string[] };
};

const ADD_ONS: AddOn[] = [
  {
    name: "Permit Administration",
    description:
      "Cleard prepares and submits the permit application, coordinates with the municipality, and manages the process through to issuance.",
    rows: [
      {
        label: "Standard",
        price: "$249/permit",
        detail: "Residential, single trade, straightforward jurisdiction",
      },
      {
        label: "Complex",
        price: "$449/permit",
        detail: "Multi-trade, difficult jurisdiction, larger project scope",
      },
      {
        label: "Enterprise",
        price: "Custom",
        detail: "Commercial, multi-site, high-volume GC portfolios",
      },
    ],
    footnote: {
      title: "Volume discounts for Foundation + Complete subscribers",
      items: ["3–5 permits/month: 10% off", "6+ permits/month: 15% off"],
    },
  },
  {
    name: "Private Plan Review & Inspections",
    description:
      "Licensed professionals review plans and conduct inspections under applicable private provider statutes.",
    rows: [
      { label: "Residential plan review", price: "$399/project" },
      { label: "Inspection (per visit)", price: "$199/visit" },
      { label: "Full inspection package (3 visits)", price: "$499" },
    ],
  },
];

function PricingLockOverlay() {
  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center px-5 pt-32">
      <div
        className="sticky top-40 w-full max-w-md p-8 text-center"
        style={{
          background: "rgba(250,243,230,0.92)",
          border: `1px solid ${BORDER}`,
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 30px 60px -30px rgba(43,22,32,0.35)",
        }}
      >
        <div className="flex justify-center" style={{ color: TEAL }}>
          <Lock className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <div className="mt-4 text-[10.5px] uppercase tracking-[0.22em]" style={{ color: GREEN }}>
          Locked
        </div>
        <h2 className="mt-3 text-[24px]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          Pricing is locked at the moment.
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: GRAY }}>
          Plans and rates are shared directly with contractors during onboarding. Request access and
          we&apos;ll walk you through the numbers.
        </p>
        <Link
          to="/join"
          hash="request"
          className="mt-6 inline-flex items-center px-5 py-3 text-[14px] no-underline"
          style={{ background: TEAL, color: "#FAF3E6", fontWeight: 600 }}
        >
          Request access
        </Link>
      </div>
    </div>
  );
}

function PricingPage() {
  return (
    <MarketingShell>
      <div className="relative" style={{ background: "#FAF3E6", color: INK }}>
        <PricingLockOverlay />
        <div
          aria-hidden
          className="pointer-events-none select-none"
          style={{ filter: "blur(9px)", opacity: 0.5 }}
        >
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-10 md:pt-28">
          <div className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: GREEN }}>
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
            Simple, transparent pricing.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
            The platform runs year-round. Add services when you need them.
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
                  background: p.popular ? OFF : "#FAF3E6",
                  border: `1px solid ${p.popular ? TEAL : BORDER}`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="text-[13px] uppercase tracking-[0.16em]"
                    style={{ color: INK, fontWeight: 700 }}
                  >
                    {p.name}
                  </div>
                  {p.popular && (
                    <span
                      className="px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                      style={{ background: TEAL, color: "#FAF3E6", fontWeight: 700 }}
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

                <p className="mt-4 text-[14px] italic leading-snug" style={{ color: TEAL }}>
                  {p.tagline}
                </p>

                {p.blurb && (
                  <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: GRAY }}>
                    {p.blurb}
                  </p>
                )}

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

                <Link
                  to="/join"
                  hash="request"
                  className="mt-7 inline-flex items-center justify-center px-5 py-3 text-[14px] no-underline"
                  style={
                    p.popular
                      ? { background: TEAL, color: "#FAF3E6", fontWeight: 700 }
                      : {
                          background: "#FAF3E6",
                          color: INK,
                          border: `1px solid ${BORDER}`,
                          fontWeight: 600,
                        }
                  }
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>

          {/* Add-on services */}
          <div className="mt-20">
            <h2
              style={{
                color: INK,
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Add-on services
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed" style={{ color: GRAY }}>
              Available to all subscribers. Billed per project — not included in monthly
              subscription.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2 items-start">
              {ADD_ONS.map((a) => (
                <div key={a.name} className="p-7" style={{ border: `1px solid ${BORDER}` }}>
                  <div
                    className="text-[13px] uppercase tracking-[0.16em]"
                    style={{ color: INK, fontWeight: 700 }}
                  >
                    {a.name}
                  </div>
                  <p className="mt-4 text-[14px] leading-relaxed" style={{ color: GRAY }}>
                    {a.description}
                  </p>

                  <table className="mt-6 w-full" style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      {a.rows.map((r) => (
                        <tr key={r.label}>
                          <td
                            className="py-3 pr-4 align-top text-[14px]"
                            style={{ color: INK, borderTop: `1px solid ${BORDER}`, fontWeight: 600 }}
                          >
                            {r.label}
                            {r.detail && (
                              <div
                                className="mt-1 text-[12.5px] leading-snug"
                                style={{ color: LIGHT, fontWeight: 400 }}
                              >
                                {r.detail}
                              </div>
                            )}
                          </td>
                          <td
                            className="py-3 align-top text-right text-[14px] whitespace-nowrap"
                            style={{ color: TEAL, borderTop: `1px solid ${BORDER}`, fontWeight: 700 }}
                          >
                            {r.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {a.footnote && (
                    <div className="mt-6 p-4" style={{ background: OFF }}>
                      <div
                        className="text-[11px] uppercase tracking-[0.16em]"
                        style={{ color: GREEN, fontWeight: 700 }}
                      >
                        {a.footnote.title}
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {a.footnote.items.map((i) => (
                          <li key={i} className="text-[13.5px]" style={{ color: INK }}>
                            {i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 text-[14px]" style={{ color: GRAY }}>
            All pricing in USD. Monthly billing, cancel anytime.
          </p>

          <p className="mt-3 text-[14px]" style={{ color: GRAY }}>
            Need something custom? Volume plans and enterprise portfolios are available on request.{" "}
            <Link to="/contact" className="underline" style={{ color: INK, fontWeight: 600 }}>
              Talk to us →
            </Link>
          </p>
        </section>
        </div>
      </div>
    </MarketingShell>
  );
}
