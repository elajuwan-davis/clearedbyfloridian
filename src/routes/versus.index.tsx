import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";
import { VERSUS_COMPETITORS } from "@/lib/versus-competitors";

export const Route = createFileRoute("/versus/")({
  head: () => ({
    meta: [
      { title: "Cleard vs The Field — Permit Platforms Compared" },
      {
        name: "description",
        content:
          "Compare Cleard to PermitFlow, GreenLite, and FCC. Private-provider licensing, Victoria AI, and sub compliance built in from day one.",
      },
      { property: "og:title", content: "Cleard vs The Field" },
      {
        property: "og:description",
        content:
          "Every permit platform claims to handle permits. Only Cleard was built as a full back office for general contractors.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cleared.floridianinc.com/versus" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cleared.floridianinc.com/versus" }],
  }),
  component: VersusHub,
});

function VersusHub() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b md-hairline">
        <div className="absolute inset-0 md-grain opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 py-24 md:py-32">
          <div className="md-eyebrow md-in md-in-1">Cleard vs The Field</div>
          <h1
            className="mt-6 md-serif md-in md-in-2 max-w-4xl whitespace-pre-line"
            style={{
              color: "var(--md-text)",
              fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {"Built for contractors.\nNot retrofitted for them."}
          </h1>
          <p className="mt-7 max-w-2xl text-base sm:text-lg md-muted md-in md-in-3">
            Every permit platform claims to handle permits. Only Cleard was built
            as a full back office for general contractors — with private-provider
            licensing, Victoria AI, and sub compliance built in from day one.
          </p>
          <div className="mt-9 md-in md-in-4">
            <Link to="/join" hash="request" className="md-btn-primary">
              Get early access <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Competitor grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-24">
        <div className="md-eyebrow">Compare Cleard to</div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {VERSUS_COMPETITORS.map((c) => (
            <Link
              key={c.slug}
              to="/versus/$slug"
              params={{ slug: c.slug }}
              className="md-card p-7 flex flex-col gap-4 no-underline transition-opacity hover:opacity-90"
            >
              <div
                className="h-11 w-11 rounded-md border md-hairline flex items-center justify-center text-lg font-semibold"
                style={{ color: "var(--md-muted, #7A5C68)" }}
              >
                {c.initial}
              </div>
              <div className="md-serif text-2xl" style={{ color: "var(--md-text)" }}>
                {c.name}
              </div>
              <p className="text-sm md-muted leading-relaxed flex-1">{c.cardBlurb}</p>
              <span className="text-[13px] inline-flex items-center gap-1.5" style={{ color: "var(--brand, #673147)" }}>
                Cleard vs {c.name} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Cleard wins */}
      <section className="md-section-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-20 md:py-24">
          <h2 className="md-serif text-3xl md:text-4xl" style={{ color: "#FAF3E6" }}>
            Why Cleard wins
          </h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                k: "Licensed depth",
                v: "Built around private-provider licensing. PermitFlow and GreenLite don't hold this license.",
              },
              {
                k: "Victoria AI",
                v: "Real-time permit intelligence trained on real municipality data. No competitor has an AI advisor layer.",
              },
              {
                k: "Sub compliance built in",
                v: "COI enforcement, sub portals, trade-by-trade permit tracking. Not an add-on — it's core.",
              },
            ].map((s) => (
              <div key={s.k}>
                <div className="md-serif text-2xl" style={{ color: "#FAF3E6" }}>
                  {s.k}
                </div>
                <p className="mt-3 text-sm md-muted leading-relaxed">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
