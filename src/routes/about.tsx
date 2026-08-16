import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Cleard" },
      {
        name: "description",
        content:
          "Cleard is a private-provider permitting practice for leading general contractors.",
      },
      { property: "og:title", content: "About Cleard" },
      { property: "og:description", content: "Built inside a luxury construction firm. Applied to permitting." },
    ],
  }),
  component: AboutPage,
});


function AboutPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="About"
        title="A permitting practice built inside a luxury construction firm."
        intro="Cleard is what happens when decades of running our own permits gets handed to the team building yours — same in-house engineers, architects, and inspectors, now standing in for the building official as a licensed private provider."
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="label-eyebrow">Origin</div>
          <h2 className="mt-4 font-display text-3xl tracking-tight">From the deck end of the job.</h2>
        </div>
        <div className="md:col-span-7 space-y-6 text-muted-foreground text-pretty">
          <p>
            Cleard was founded inside a construction firm building pools and
            hardscape for some of the most demanding estates in the country,
            without compromising on detail.
          </p>
          <p>
            For most of that history we've run our own structural, MEP, and
            energy reviews in-house — because nobody else moves at the pace a
            $4M oceanfront job requires. We're now a licensed private
            provider, offering that capability to the general contractors
            working alongside us.
          </p>
          <p>
            That service is Cleard. It's the same team, the same standards,
            scaled to whatever your firm is building.
          </p>
        </div>
      </section>

      <section className="border-y hairline bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-24 grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="label-eyebrow">Principles</div>
          </div>
          <div className="md:col-span-7 space-y-12">
            {[
              { t: "Code is the floor, not the ceiling.", d: "We design our reviews around what holds up in a Cat 4. Code minimums are a starting point." },
              { t: "Speed without shortcuts.", d: "Faster turnaround comes from process and staffing — not from skipping line items." },
              { t: "Documentation is the deliverable.", d: "Every inspection comes with photos, every comment with a code citation. The file should defend itself." },
              { t: "We meet you on site.", d: "No four-hour windows. No 'sometime Tuesday.' A real human, with a real schedule." },
            ].map((p) => (
              <div key={p.t}>
                <h3 className="font-display text-2xl tracking-tight">{p.t}</h3>
                <p className="mt-3 text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 grid md:grid-cols-3 gap-px bg-border border hairline">
        {[
          { k: "Licensed", v: "Certified private provider" },
          { k: "10 days", v: "Affidavit-to-permit window" },
          { k: "$10M", v: "Errors & omissions coverage" },
        ].map((s) => (
          <div key={s.k} className="bg-background p-10">
            <div className="font-display text-3xl tracking-tight">{s.k}</div>
            <div className="mt-3 text-sm text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
