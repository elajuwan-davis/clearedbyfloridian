import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";

export const Route = createFileRoute("/411")({
  head: () => ({
    meta: [
      { title: "411 — Permitting Answers | Cleard" },
      {
        name: "description",
        content:
          "The 411 on private-provider permitting: plan review timelines, inspections, fees and how Cleard runs it all for contractors.",
      },
      { property: "og:title", content: "411 — Permitting Answers | Cleard" },
      {
        property: "og:description",
        content:
          "Straight answers on plan review, inspections, fees and jurisdictions — the 411 on permitting with Cleard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FourEleven,
});

const ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "How fast is plan review?",
    a: "2-day plan review on every submittal we handle as your private provider.",
  },
  {
    q: "How do inspections work?",
    a: "Same-day inspections, coordinated and documented in the portal with photos and results attached to the permit.",
  },
  {
    q: "Who files with the jurisdiction?",
    a: "We do. Cleard prepares the package, files it with the building department, and tracks it to issuance.",
  },
  {
    q: "What does it cost?",
    a: "A permitting fee based on construction value plus a flat private provider and administrative fee. Every charge is itemized in the portal at submittal.",
  },
  {
    q: "Where do you work?",
    a: "Across our covered jurisdictions — check Coverage for the current list, and ask us about anything not shown.",
  },
  {
    q: "Do I keep my own portal logins?",
    a: "Yes. Your building-department credentials stay yours in an encrypted vault, and you can jump into any portal straight from Cleard.",
  },
];

const POSTS: Array<{ category: string; title: string; excerpt: string }> = [
  {
    category: "Plan Review",
    title: "What happens when a plan review fails?",
    excerpt:
      "A failed review is a comment list, not a dead end — here is exactly how corrections move back through us.",
  },
  {
    category: "Inspections",
    title: "The inspection sequence every pool contractor needs to know",
    excerpt:
      "From steel to final deck, the order inspections must happen in and where crews usually lose a week.",
  },
  {
    category: "Jurisdictions",
    title: "Five jurisdictions that still require paper submittals",
    excerpt:
      "Some building departments still want ink on paper — here is who, and how we handle it for you.",
  },
];

function FourEleven() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="411"
        title="Straight answers on permitting."
        intro="Answers, field notes, and the information contractors actually need."
      />

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-10">
        <div className="label-eyebrow" style={{ color: "var(--copper-deep)" }}>
          FAQ
        </div>
        <h2
          className="mt-3 text-[28px] leading-tight"
          style={{ color: "var(--md-text)", fontWeight: 600 }}
        >
          FAQ
        </h2>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {ITEMS.map((it) => (
            <div key={it.q}>
              <h3 className="text-[17px] font-semibold" style={{ color: "var(--md-text)" }}>
                {it.q}
              </h3>
              <p className="mt-3 text-[14.5px] leading-relaxed md-muted">{it.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section
        className="mx-auto max-w-5xl px-6 pb-20 lg:px-10"
        style={{ borderTop: "1px solid color-mix(in oklab, var(--md-text) 12%, transparent)" }}
      >
        <div className="pt-16">
          <div className="label-eyebrow" style={{ color: "var(--copper-deep)" }}>
            From the field
          </div>
          <h2
            className="mt-3 text-[28px] leading-tight"
            style={{ color: "var(--md-text)", fontWeight: 600 }}
          >
            Notes from the permit desk.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {POSTS.map((p) => (
              <article
                key={p.title}
                className="flex flex-col p-6"
                style={{
                  border: "1px solid color-mix(in oklab, var(--md-text) 14%, transparent)",
                  background: "color-mix(in oklab, var(--md-text) 3%, transparent)",
                }}
              >
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.16em]"
                  style={{ color: "var(--copper-deep)" }}
                >
                  {p.category}
                </span>
                <h3
                  className="mt-4 text-[17px] font-semibold leading-snug"
                  style={{ color: "var(--md-text)" }}
                >
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed md-muted">{p.excerpt}</p>
                <a
                  href="#"
                  className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] no-underline"
                  style={{ color: "var(--md-text)" }}
                >
                  Read →
                </a>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 text-[14px] no-underline"
            style={{
              backgroundImage: "var(--gradient-copper)",
              border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
              color: "#FFF8EC",
              fontWeight: 600,
            }}
          >
            Still have a question? Talk to us
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

