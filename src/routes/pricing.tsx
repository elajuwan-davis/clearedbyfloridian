import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, ArrowRight } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Cleard Per-Project Permitting for Florida GCs" },
      {
        name: "description",
        content:
          "Three per-project tiers: Foundation $6,500, Builder $8,500, Elite $10,500. Private provider services, permit running, Victoria AI, and fee recovery. Volume discounts at 4+ projects.",
      },
      { property: "og:title", content: "Cleard Pricing — Per Project, No Fluff" },
      {
        property: "og:description",
        content:
          "Foundation $6,500 · Builder $8,500 · Elite $10,500 per project. Volume discounts for 4+ projects per year.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PricingPage,
});

type Tier = {
  id: "foundation" | "builder" | "elite";
  name: string;
  price: string;
  blurb: string;
  inheritsLabel?: string;
  bullets: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "foundation",
    name: "Foundation",
    price: "$6,500",
    blurb: "Everything required to get a permit filed, tracked, and issued.",
    bullets: [
      "Platform access",
      "Private provider services",
      "Permit running — filing, tracking, corrections, issuance",
    ],
  },
  {
    id: "builder",
    name: "Builder",
    price: "$8,500",
    blurb: "Adds intelligence, homeowner visibility, and trade verification.",
    inheritsLabel: "Everything in Foundation, plus:",
    featured: true,
    bullets: [
      "Victoria AI assistant — 24/7 project Q&A on status, requirements, and timelines",
      "Homeowner portal access",
      "License & insurance verification and confirmation",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: "$10,500",
    blurb: "Adds municipal fee auditing and recovery on every permit.",
    inheritsLabel: "Everything in Builder, plus:",
    bullets: [
      "Permit fee cost check & recovery — we audit every municipal fee, fight overcharges, and split recovered amounts 75/25 in your favor",
    ],
  },
];

type Row = { feature: string; foundation: boolean; builder: boolean; elite: boolean };

const MATRIX: Row[] = [
  { feature: "Platform access", foundation: true, builder: true, elite: true },
  { feature: "Private provider services", foundation: true, builder: true, elite: true },
  { feature: "Permit running (filing, tracking, corrections, issuance)", foundation: true, builder: true, elite: true },
  { feature: "Victoria AI assistant (24/7 project Q&A)", foundation: false, builder: true, elite: true },
  { feature: "Homeowner portal access", foundation: false, builder: true, elite: true },
  { feature: "License & insurance verification", foundation: false, builder: true, elite: true },
  { feature: "Permit fee cost check & recovery (75/25 split)", foundation: false, builder: false, elite: true },
];

function Yes() {
  return (
    <span
      className="inline-flex items-center justify-center h-5 w-5 rounded-full"
      style={{ background: "color-mix(in oklab, var(--green, #12A05C) 18%, transparent)" }}
      aria-label="Included"
    >
      <Check className="h-3 w-3" style={{ color: "var(--green, #12A05C)" }} strokeWidth={3} />
    </span>
  );
}

function No() {
  return (
    <span className="inline-flex items-center justify-center h-5 w-5" aria-label="Not included">
      <Minus className="h-3.5 w-3.5 md-muted" strokeWidth={2} />
    </span>
  );
}

function PricingPage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b md-hairline">
        <div className="absolute inset-0 md-grain opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
          <div className="md-eyebrow md-in md-in-1">Pricing</div>
          <h1
            className="mt-6 md-in md-in-2 max-w-4xl"
            style={{
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--md-text)",
            }}
          >
            Priced per project. Nothing hidden.
          </h1>
          <p className="mt-7 max-w-2xl text-base sm:text-lg md-muted md-in md-in-3">
            One fee per project covers private provider services and permit running end to end.
            Pick the tier that matches how much of the process you want us to own.
          </p>
        </div>
      </section>

      {/* Tier cards */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-24">
        <div className="grid gap-5 md:grid-cols-3 items-start">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className="md-card p-8 flex flex-col h-full relative"
              style={
                t.featured
                  ? { borderColor: "var(--brand, #1B84D4)", boxShadow: "0 12px 40px rgba(27,132,212,0.10)" }
                  : undefined
              }
            >
              {t.featured && (
                <div
                  className="absolute -top-3 left-8 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em]"
                  style={{ background: "var(--brand, #1B84D4)", color: "#FFFFFF" }}
                >
                  Most popular
                </div>
              )}
              <div className="md-eyebrow">{t.name}</div>
              <div
                className="mt-4 flex items-baseline gap-1.5"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--md-text)" }}
              >
                <span style={{ fontWeight: 800, fontSize: "2.75rem", letterSpacing: "-0.03em" }}>
                  {t.price}
                </span>
                <span className="text-[13px] md-muted">/ project</span>
              </div>
              <p className="mt-3 text-sm md-muted leading-relaxed">{t.blurb}</p>

              <div className="mt-6 pt-6 border-t md-hairline flex-1">
                {t.inheritsLabel && (
                  <div className="text-[11px] uppercase tracking-[0.16em] md-muted mb-4">
                    {t.inheritsLabel}
                  </div>
                )}
                <ul className="space-y-3">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--md-text)" }}>
                      <Check
                        className="h-4 w-4 mt-0.5 shrink-0"
                        style={{ color: "var(--green, #12A05C)" }}
                        strokeWidth={2.5}
                      />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/join"
                hash="request"
                className={t.featured ? "md-btn-primary mt-8 w-full justify-center" : "md-btn-ghost mt-8 w-full justify-center"}
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-5xl px-6 lg:px-10 pb-20 md:pb-24">
        <div className="md-eyebrow">What's included</div>

        <div className="mt-8 hidden md:block overflow-hidden rounded-lg border md-hairline">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="px-5 py-4 text-[11px] uppercase tracking-[0.2em] md-muted font-normal">
                  Feature
                </th>
                {["Foundation", "Builder", "Elite"].map((h, i) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-[12px] uppercase tracking-[0.16em] text-center"
                    style={
                      i === 1
                        ? { background: "var(--brand, #1B84D4)", color: "#FFFFFF" }
                        : { background: "color-mix(in oklab, #6B8299 12%, transparent)", color: "var(--md-text)" }
                    }
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r, i) => (
                <tr
                  key={r.feature}
                  style={{
                    background: i % 2 === 1 ? "color-mix(in oklab, #6B8299 6%, transparent)" : "transparent",
                  }}
                >
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--md-text)" }}>
                    {r.feature}
                  </td>
                  {[r.foundation, r.builder, r.elite].map((v, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="flex justify-center">{v ? <Yes /> : <No />}</div>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-5 py-4 text-[11px] uppercase tracking-[0.16em] md-muted">
                  Price per project
                </td>
                {TIERS.map((t) => (
                  <td
                    key={t.id}
                    className="px-5 py-4 text-center text-sm"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "var(--md-text)" }}
                  >
                    {t.price}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="mt-8 md:hidden space-y-2">
          {MATRIX.map((r) => (
            <div key={r.feature} className="rounded-lg border md-hairline p-4">
              <div className="text-sm" style={{ color: "var(--md-text)" }}>{r.feature}</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {([["Foundation", r.foundation], ["Builder", r.builder], ["Elite", r.elite]] as const).map(
                  ([label, v]) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-[0.14em] md-muted">{label}</span>
                      {v ? <Yes /> : <No />}
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Volume discounts */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-20 md:pb-24">
        <div className="md-card p-8 md:p-12">
          <div className="md-eyebrow">Volume discounts</div>
          <h2
            className="mt-4 md-serif text-3xl md:text-4xl"
            style={{ color: "var(--md-text)" }}
          >
            Build more, pay less per project.
          </h2>
          <p className="mt-4 max-w-2xl text-sm md-muted leading-relaxed">
            Discounts apply automatically to every project once your annual volume commitment is set.
            They stack on any tier.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { range: "4–8 projects / year", off: "10% off", note: "Applied per project" },
              { range: "9+ projects / year", off: "15% off", note: "Applied per project" },
            ].map((d) => (
              <div key={d.range} className="rounded-lg border md-hairline p-6">
                <div className="text-[11px] uppercase tracking-[0.16em] md-muted">{d.range}</div>
                <div
                  className="mt-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    fontSize: "2.25rem",
                    letterSpacing: "-0.03em",
                    color: "var(--brand, #1B84D4)",
                  }}
                >
                  {d.off}
                </div>
                <div className="mt-1 text-sm md-muted">{d.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="md-section-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 text-center">
          <h2 className="md-serif text-3xl md:text-5xl" style={{ color: "#FFFFFF" }}>
            Ready to run your next permit through Cleard?
          </h2>
          <div className="mt-8">
            <Link to="/join" hash="request" className="md-btn-primary">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
