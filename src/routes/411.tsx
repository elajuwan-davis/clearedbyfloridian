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

function FourEleven() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="The 411"
        title="Straight answers on permitting."
        intro="No runaround, no vendor-speak. Here is how permitting actually runs when Cleard is your private provider."
      />

      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2">
          {ITEMS.map((it) => (
            <div key={it.q}>
              <h2 className="text-[17px] font-semibold" style={{ color: "var(--md-text)" }}>
                {it.q}
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed md-muted">{it.a}</p>
            </div>
          ))}
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
