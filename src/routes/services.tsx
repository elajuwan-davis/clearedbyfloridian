import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { services } from "@/lib/mock-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Cleard" },
      {
        name: "description",
        content:
          "Permit administration, subcontractor coordination, private plan review & inspection, and certificate of occupancy — the full permitting lifecycle.",
      },
      { property: "og:title", content: "Cleard Services" },
      {
        property: "og:description",
        content:
          "Permit admin, sub coordination, private plan review & inspection, and CO — the full lifecycle on a statutory clock.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

// Editorial gradient placeholders — construction-site cinematic feel.
// One per service, keyed by code. Alternated left/right in the layout.
const VISUALS: Record<string, { gradient: string; caption: string }> = {
  "01": {
    // deep obsidian → warm concrete, subtle sky wash
    gradient:
      "linear-gradient(135deg, #0A0E17 0%, #153157 45%, #2a3a52 75%, #4a4238 100%)",
    caption: "Framing · Palm Beach",
  },
  "02": {
    gradient:
      "linear-gradient(160deg, #0A0E17 0%, #1a2740 40%, #3a4a60 70%, #C8A97E 130%)",
    caption: "Trades on site · Jupiter",
  },
  "03": {
    gradient:
      "linear-gradient(120deg, #0A0E17 0%, #153157 50%, #5c7a94 100%)",
    caption: "Pool excavation · Manalapan",
  },
  "04": {
    gradient:
      "linear-gradient(145deg, #1a1410 0%, #2a2018 40%, #153157 90%)",
    caption: "Outdoor living close-out · Vero Beach",
  },
};

function ServiceVisual({ code }: { code: string }) {
  const v = VISUALS[code];
  return (
    <div
      className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden border md-hairline"
      style={{ background: v?.gradient ?? "#0A0E17" }}
    >
      {/* Grain / texture overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(200,169,126,0.15) 0%, transparent 55%), radial-gradient(circle at 80% 90%, rgba(21,49,87,0.5) 0%, transparent 60%)",
        }}
      />
      {/* Diagonal wave line pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, #F5F5F0 0 1px, transparent 1px 22px)",
        }}
      />
      {/* Caption */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
        <span
          className="font-mono text-[10px] tracking-[0.22em] uppercase"
          style={{ color: "rgba(245,245,240,0.75)" }}
        >
          {v?.caption}
        </span>
      </div>
    </div>
  );
}

function ServicesPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Services"
        title="Four services. One contract."
        intro="Florida Statute 553.791 lets a licensed private provider act in place of the building official for plan review and inspections. Cleard delivers the full permitting lifecycle on a statutory clock."
      />

      <section className="mx-auto max-w-7xl px-6 lg:px-10 py-16 md:py-24 space-y-16 md:space-y-24">
        {services.map((s, i) => {
          const imageFirst = i % 2 === 0;
          return (
            <article
              key={s.code}
              className="grid md:grid-cols-12 gap-8 md:gap-14 items-center"
            >
              <div
                className={`md:col-span-6 ${
                  imageFirst ? "md:order-1" : "md:order-2"
                }`}
              >
                <ServiceVisual code={s.code} />
              </div>

              <div
                className={`md:col-span-6 relative ${
                  imageFirst ? "md:order-2" : "md:order-1"
                }`}
              >
                <div
                  className="md-serif leading-none"
                  style={{
                    color: "var(--md-gold)",
                    fontSize: "clamp(64px, 8vw, 120px)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {s.code}
                </div>
                <div className="md-eyebrow mt-4">
                  {s.code} / 04 · Service
                </div>
                <h2
                  className="mt-4 md-serif"
                  style={{
                    color: "var(--md-text)",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  {s.title}
                </h2>
                <p
                  className="mt-5 text-base md:text-lg text-pretty max-w-xl"
                  style={{ color: "var(--md-muted)" }}
                >
                  {s.summary}
                </p>
                <ul className="mt-8 space-y-3 max-w-xl">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-3 text-sm">
                      <span
                        className="font-mono mt-0.5"
                        style={{ color: "var(--md-gold)" }}
                      >
                        +
                      </span>
                      <span style={{ color: "var(--md-text)" }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-32">
        <div
          className="border md-hairline p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center"
          style={{ background: "var(--md-surface)" }}
        >
          <div>
            <div className="md-eyebrow">For licensed GCs</div>
            <h3
              className="mt-4 md-serif"
              style={{
                color: "var(--md-text)",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              2-day plan review. Same-day inspections.
            </h3>
            <p className="mt-4" style={{ color: "var(--md-muted)" }}>
              Credential vetting, master services agreement, and your first
              permit moving the same week — while municipal queues sit still.
            </p>
          </div>
          <div className="md:text-right">
            <Link to="/contact" className="md-btn-primary">
              Request access
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
