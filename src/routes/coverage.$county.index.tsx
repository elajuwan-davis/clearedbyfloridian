import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { COUNTIES, findCounty } from "@/lib/counties";
import { Hb803Callout } from "@/components/hb803-callout";

export const Route = createFileRoute("/coverage/$county/")({
  loader: ({ params }) => {
    const county = findCounty(params.county);
    if (!county) throw notFound();
    return { county };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "County not found — Cleard" }, { name: "robots", content: "noindex" }],
      };
    }
    const { county } = loaderData;
    const title = `Private-Provider Permitting in ${county.label}, Florida | Cleard`;
    const description = `Faster plan review and inspections than ${county.label}'s building department — licensed under Florida Statute 553.791. 2-day plan review, same-day inspections.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: CountyNotFound,
  component: CountyPage,
});

function CountyNotFound() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Coverage"
        title="We don't have a page for that county yet."
        intro="Cleard files statewide in Florida — tell us where the project is and we'll confirm coverage."
      />
      <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-10">
        <Link to="/coverage" className="underline" style={{ color: "var(--md-text)" }}>
          Browse all counties →
        </Link>
      </section>
    </MarketingShell>
  );
}

const STATS = [
  {
    k: "2-day plan review",
    v: "Our licensed reviewers work the submittal on our clock, not the county queue.",
  },
  {
    k: "Same-day inspections",
    v: "Field inspections scheduled and documented the day the work is ready.",
  },
  {
    k: "FS 553.791",
    v: "Performed as a private provider under Florida's private-provider statute.",
  },
];

function CountyPage() {
  const { county } = Route.useLoaderData();
  const others = COUNTIES.filter((c) => c.slug !== county.slug).slice(0, 6);

  return (
    <MarketingShell>
      <PageHeader
        eyebrow={`${county.region} · Coverage`}
        title={`Private-provider permitting in ${county.name}, Florida`}
        intro={`Faster plan review and inspections than ${county.label}'s building department — licensed under Florida Statute 553.791.`}
      />

      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <div className="label-eyebrow" style={{ color: "var(--copper-deep)" }}>
          In {county.name}
        </div>
        <h2
          className="mt-3 max-w-3xl text-[28px] leading-tight"
          style={{ color: "var(--md-text)", fontWeight: 600 }}
        >
          What Cleard runs in {county.label}.
        </h2>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed md-muted">
          {county.note} Cleard prepares the permit package, performs eligible private-provider plan
          review and inspections, and tracks the permit through to issuance — across{" "}
          {county.seats} and the rest of {county.label}.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.k}
              className="p-6"
              style={{
                border: "1px solid color-mix(in oklab, var(--md-text) 14%, transparent)",
                background: "color-mix(in oklab, var(--md-text) 3%, transparent)",
              }}
            >
              <div className="text-[18px] font-semibold" style={{ color: "var(--md-text)" }}>
                {s.k}
              </div>
              <p className="mt-3 text-[14px] leading-relaxed md-muted">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link
            to="/join"
            className="inline-flex items-center px-6 py-3 text-[14px] no-underline"
            style={{
              backgroundImage: "var(--gradient-copper)",
              border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
              color: "#FFF8EC",
              fontWeight: 600,
            }}
          >
            Start a permit in {county.name} →
          </Link>
        </div>
      </section>

      <Hb803Callout background="transparent" />

      <section
        className="mx-auto max-w-6xl px-6 pb-24 lg:px-10"
        style={{ borderTop: "1px solid color-mix(in oklab, var(--md-text) 12%, transparent)" }}
      >
        <div className="pt-14">
          <div className="label-eyebrow" style={{ color: "var(--copper-deep)" }}>
            Statewide
          </div>
          <h2 className="mt-3 text-[24px]" style={{ color: "var(--md-text)", fontWeight: 600 }}>
            Other counties we cover.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {others.map((c) => (
              <Link
                key={c.slug}
                to="/coverage/$county"
                params={{ county: c.slug }}
                className="px-4 py-2 text-[13px] no-underline"
                style={{
                  border: "1px solid color-mix(in oklab, var(--md-text) 16%, transparent)",
                  color: "var(--md-text)",
                }}
              >
                {c.label}
              </Link>
            ))}
            <Link
              to="/coverage"
              className="px-4 py-2 text-[13px] no-underline"
              style={{
                border: "1px solid color-mix(in oklab, var(--copper-deep) 50%, transparent)",
                color: "var(--copper-deep)",
              }}
            >
              All counties →
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
