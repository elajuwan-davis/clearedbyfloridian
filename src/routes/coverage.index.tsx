import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { COUNTIES } from "@/lib/counties";

export const Route = createFileRoute("/coverage/")({
  head: () => ({
    meta: [
      { title: "Florida Coverage — Private-Provider Permitting | Cleard" },
      {
        name: "description",
        content:
          "Cleard provides private-provider plan review and inspections statewide in Florida. Browse coverage by county — 2-day plan review, same-day inspections.",
      },
      { property: "og:title", content: "Statewide Florida coverage | Cleard" },
      {
        property: "og:description",
        content:
          "Private-provider permitting under Florida Statute 553.791, county by county across Florida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoverageIndex,
});

function CoverageIndex() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Coverage"
        title="Private-provider permitting across Florida."
        intro="Licensed under Florida Statute 553.791. Choose a county to see how Cleard runs plan review and inspections there."
      />

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTIES.map((c) => (
            <Link
              key={c.slug}
              to="/coverage/$county"
              params={{ county: c.slug }}
              className="block p-6 no-underline"
              style={{
                border: "1px solid color-mix(in oklab, var(--md-text) 14%, transparent)",
                background: "color-mix(in oklab, var(--md-text) 3%, transparent)",
              }}
            >
              <span
                className="font-mono text-[10px] uppercase tracking-[0.16em]"
                style={{ color: "var(--text-2)" }}
              >
                {c.region}
              </span>
              <h2
                className="mt-3 text-[19px] font-semibold"
                style={{ color: "var(--md-text)" }}
              >
                {c.label}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed md-muted">{c.seats}</p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-[14px] md-muted">
          Not seeing your county?{" "}
          <Link to="/contact" className="underline" style={{ color: "var(--md-text)" }}>
            Ask us — we file statewide.
          </Link>
        </p>
      </section>
    </MarketingShell>
  );
}
