import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Cleared by Flōridian" },
      {
        name: "description",
        content:
          "Cleared by Flōridian is a private-provider permitting practice for South Florida's elite general contractors.",
      },
      { property: "og:title", content: "About Cleared by Flōridian" },
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
        intro="Cleared is what happens when decades of running our own permits gets handed to the team building yours — same in-house engineers, architects, and inspectors, now standing in for the building official under FL Statute 553.791."
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="label-eyebrow">Origin</div>
          <h2 className="mt-4 font-display text-3xl tracking-tight">From the deck end of the job.</h2>
        </div>
        <div className="md:col-span-7 space-y-6 text-muted-foreground text-pretty">
          <p>
            Flōridian was founded in West Palm Beach to build pools and
            hardscape for South Florida's most demanding estates without
            compromising on detail.
          </p>
          <p>
            For most of that history we've run our own structural, MEP, and
            energy reviews in-house — because nobody else moves at the pace a
            $4M oceanfront job requires. We're now a licensed private
            provider under FS 553.791, offering that capability to the
            general contractors working alongside us.
          </p>
          <p>
            That service is Cleared. It's the same team, the same standards,
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-24">
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 grid md:grid-cols-3 gap-px bg-border border hairline">
        {[
          { k: "FS 553.791", v: "Florida Private Provider Statute" },
          { k: "10 days", v: "Statutory affidavit-to-permit window" },
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
