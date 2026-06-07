import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/mock-data";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Flōridian Private Provider" },
      {
        name: "description",
        content:
          "Private plan review, third-party inspections, permit coordination, and pre-construction code review for South Florida residential builders.",
      },
      { property: "og:title", content: "Flōridian Services" },
      { property: "og:description", content: "Plan review, inspections, coordination, and pre-construction code review." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="◇ Services"
        title="Four services. One contract. Built for residential GCs."
        intro="Florida Statute 553.791 lets us act in place of the building official for plan review and inspections. Pick the scope that fits your project."
      />

      <section className="mx-auto max-w-7xl px-6 py-24 space-y-px bg-border border-x hairline">
        {services.map((s, i) => (
          <article
            key={s.code}
            className="bg-background p-10 md:p-14 grid md:grid-cols-12 gap-10"
          >
            <div className="md:col-span-3">
              <div className="font-mono text-xs text-accent">{s.code} / 04</div>
              <h2 className="mt-4 font-display text-3xl tracking-tight">{s.title}</h2>
            </div>
            <div className="md:col-span-6">
              <p className="text-lg text-muted-foreground text-pretty">{s.summary}</p>
              <ul className="mt-8 space-y-3">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-sm">
                    <span className="font-mono text-accent mt-0.5">+</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-3 md:text-right">
              <div className="label-eyebrow">Engagement</div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                Per-project or<br />master services agreement
              </p>
              {i === 0 && (
                <Button asChild size="sm" variant="outline" className="rounded-sm mt-6">
                  <Link to="/contact">Get an estimate</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="border hairline bg-secondary/40 p-10 md:p-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="label-eyebrow">◇ Already mid-permit?</div>
            <h3 className="mt-4 font-display text-3xl tracking-tight">
              We can take over a stalled file.
            </h3>
            <p className="mt-4 text-muted-foreground">
              If your project is parked in plan review at the AHJ, we can pull it
              private under FS 553.791 and have a reviewer on it the same week.
            </p>
          </div>
          <div className="md:text-right">
            <Button asChild size="lg" className="rounded-sm h-12">
              <Link to="/contact">Talk to a reviewer</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
