import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Clock } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Cleard Permitting for Florida Builders" },
      {
        name: "description",
        content:
          "À la carte permitting: single trade permit administration $500, independent inspections $99, single plan review $250. Full-service Foundation, Builder, and Elite packages coming soon.",
      },
      { property: "og:title", content: "Cleard Pricing — Pay Only For What You Need" },
      {
        property: "og:description",
        content:
          "À la carte permit administration, private provider inspections, and plan review. Full-service packages coming soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type AlaCarte = { name: string; price: string; unit?: string; blurb: string };

const A_LA_CARTE: AlaCarte[] = [
  {
    name: "Single Trade Permit Administration",
    price: "$500",
    blurb:
      "Full permit application, submission, monitoring, and issuance for a single trade.",
  },
  {
    name: "Independent Inspection",
    price: "$99",
    unit: "/ inspection",
    blurb:
      "Licensed private provider inspection for a single milestone. Scheduled and reported through Cleard.",
  },
  {
    name: "Single Plan Review",
    price: "$250",
    blurb:
      "Licensed PE/AE review and stamp for a single trade's plans under F.S. 553.791.",
  },
];

type Tier = {
  name: string;
  blurb: string;
  inheritsLabel?: string;
  bullets: string[];
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Foundation",
    blurb: "Everything required to get a permit filed, tracked, and issued.",
    bullets: [
      "Platform access",
      "Private provider services",
      "SFR permit administration — filing, tracking, corrections, issuance",
      "2-day plan review",
      "Same-day inspections",
    ],
  },
  {
    name: "Builder",
    blurb: "Adds intelligence, homeowner visibility, and trade verification.",
    inheritsLabel: "Everything in Foundation, plus:",
    featured: true,
    bullets: [
      "Victoria AI assistant — 24/7 project Q&A",
      "Homeowner portal access",
      "License & insurance verification",
    ],
  },
  {
    name: "Elite",
    blurb: "Adds municipal fee auditing and recovery on every permit.",
    inheritsLabel: "Everything in Builder, plus:",
    bullets: [
      "Permit fee cost check & recovery — we audit every municipal fee, fight overcharges, and split recovered amounts 75/25 in your favor",
      "Dedicated permit coordinator",
    ],
  },
];

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
            Start à la carte with the exact service you need today, or move to a
            full-service package that covers permit administration, plan review,
            and every inspection.
          </p>
        </div>
      </section>

      {/* Section 1 — À La Carte */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-24">
        <div className="md-eyebrow">À La Carte Services</div>
        <h2
          className="mt-4 md-serif text-3xl md:text-4xl"
          style={{ color: "var(--md-text)" }}
        >
          Partial platform access. Pay only for what you need.
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3 items-stretch">
          {A_LA_CARTE.map((s) => (
            <div
              key={s.name}
              className="rounded-lg border md-hairline p-7 flex flex-col"
              style={{ background: "transparent" }}
            >
              <div
                className="text-[13px] uppercase tracking-[0.14em]"
                style={{ color: "var(--md-text)" }}
              >
                {s.name}
              </div>
              <div
                className="mt-5 flex items-baseline gap-1.5"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--md-text)" }}
              >
                <span style={{ fontWeight: 800, fontSize: "2.5rem", letterSpacing: "-0.03em" }}>
                  {s.price}
                </span>
                {s.unit && <span className="text-[13px] md-muted">{s.unit}</span>}
              </div>
              <p className="mt-4 text-sm md-muted leading-relaxed flex-1">{s.blurb}</p>
              <Link
                to="/contact"
                className="md-btn-ghost mt-7 w-full justify-center"
              >
                Request this service <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 — Full-Service Packages */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-20 md:pb-24">
        <div className="md-eyebrow">Full-Service Packages</div>
        <h2
          className="mt-4 md-serif text-3xl md:text-4xl"
          style={{ color: "var(--md-text)" }}
        >
          Full platform access. SFR permit administration, plans review, and all
          inspections — together.
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-3 items-start">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="md-card p-8 flex flex-col h-full relative"
              style={
                t.featured
                  ? {
                      borderColor: "var(--brand, #1B84D4)",
                      boxShadow: "0 12px 40px rgba(21,49,87,0.12)",
                    }
                  : undefined
              }
            >
              <div
                className="absolute -top-3 left-8 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em]"
                style={{ background: "#153157", color: "#FFFFFF" }}
              >
                <Clock className="h-3 w-3" /> Coming soon
              </div>

              <div className="md-eyebrow mt-2">{t.name}</div>
              <p className="mt-4 text-sm md-muted leading-relaxed">{t.blurb}</p>

              <div className="mt-6 pt-6 border-t md-hairline flex-1">
                {t.inheritsLabel && (
                  <div className="text-[11px] uppercase tracking-[0.16em] md-muted mb-4">
                    {t.inheritsLabel}
                  </div>
                )}
                <ul className="space-y-3">
                  {t.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm"
                      style={{ color: "var(--md-text)" }}
                    >
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
                to="/contact"
                className={
                  t.featured
                    ? "md-btn-primary mt-8 w-full justify-center"
                    : "md-btn-ghost mt-8 w-full justify-center"
                }
              >
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[13px] md-muted">
          Package pricing is being finalized. Join the waitlist and we'll share
          tier pricing before launch.
        </p>
      </section>

      {/* CTA */}
      <section className="md-section-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 text-center">
          <h2 className="md-serif text-3xl md:text-5xl" style={{ color: "#FFFFFF" }}>
            Ready to run your next permit through Cleard?
          </h2>
          <div className="mt-8">
            <Link to="/contact" className="md-btn-primary">
              Talk to us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
