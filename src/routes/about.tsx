import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Cleared by Flōridian" },
      {
        name: "description",
        content:
          "Cleared is the private-provider permitting arm of Flōridian LLC, a luxury pool and hardscape builder established in West Palm Beach in 1998.",
      },
      { property: "og:title", content: "About Cleared by Flōridian" },
      { property: "og:description", content: "Twenty-eight years of luxury South Florida construction, now applied to permitting." },
    ],
  }),
  component: AboutPage,
});

const team = [
  { name: "Maritza Alvarez, P.E.", role: "Principal · Structural Review", bio: "20+ years on South Florida residential. Former plans examiner, Palm Beach County." },
  { name: "Rohan Chen, AIA", role: "Principal · Architectural Review", bio: "Florida-registered architect, HVHZ specialist, ICC plans examiner." },
  { name: "Julian Pereira, P.E.", role: "MEP & Energy", bio: "Mechanical engineer, FBC Energy Conservation lead reviewer." },
  { name: "Dana Ortiz", role: "Inspections Lead", bio: "ICC-certified residential combination inspector. Former municipal inspector." },
  { name: "Sasha Whitfield", role: "Permit Coordinator", bio: "Tracks every file from intake to CO. Knows every counter clerk in Palm Beach County by name." },
  { name: "Esteban Ruiz", role: "Founder · Flōridian LLC", bio: "Licensed CGC. Founded Flōridian in 1998 to build pools the way they should be built." },
];

function AboutPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="About"
        title="A permitting service built inside a luxury construction company."
        intro="Flōridian LLC has been designing and building South Florida's most considered pools, spas, and hardscapes since 1998. Cleared is what happens when twenty-eight years of running our own permits gets handed to the team building yours."
      />

      <section className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="label-eyebrow">Origin</div>
          <h2 className="mt-4 font-display text-3xl tracking-tight">From the deck end of the job.</h2>
        </div>
        <div className="md:col-span-7 space-y-6 text-muted-foreground text-pretty">
          <p>
            Flōridian was founded in 1998 in West Palm Beach by Esteban Ruiz, a
            licensed CGC who wanted to build pools and hardscapes for South
            Florida's most demanding estates without compromising on detail.
          </p>
          <p>
            For nearly three decades we've run our own structural, MEP, and
            energy reviews in-house — because nobody else moves at the pace a
            $4M oceanfront job requires. In 2021 we became a licensed private
            provider under FS 553.791 and began offering that capability to the
            general contractors we work alongside.
          </p>
          <p>
            That service is Cleared. It is offered, by invitation, to the
            licensed GCs delivering Flōridian's projects — and only to them.
          </p>
        </div>
      </section>

      <section className="border-y hairline bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-12 gap-12">
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

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="label-eyebrow">Team</div>
        <h2 className="mt-4 font-display text-4xl tracking-tight">Reviewers & inspectors</h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border hairline">
          {team.map((m) => (
            <div key={m.name} className="bg-background p-8">
              <div className="aspect-square bg-muted blueprint-grid-fine border hairline mb-6" />
              <div className="font-display text-lg">{m.name}</div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-accent mt-1">{m.role}</div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 grid md:grid-cols-3 gap-px bg-border border hairline">
        {[
          { k: "1998", v: "Flōridian LLC founded · West Palm Beach" },
          { k: "FS 553.791", v: "Florida Private Provider Statute" },
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
