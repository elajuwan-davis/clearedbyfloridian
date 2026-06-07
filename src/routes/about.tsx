import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Flōridian LLC" },
      {
        name: "description",
        content:
          "Flōridian is a Miami-based licensed private provider founded by builders, engineers, and architects who got tired of waiting on the building department.",
      },
      { property: "og:title", content: "About Flōridian" },
      { property: "og:description", content: "Miami-based private provider founded by builders and engineers." },
    ],
  }),
  component: AboutPage,
});

const team = [
  { name: "Maritza Alvarez, P.E.", role: "Principal · Structural Review", bio: "20+ years on South Florida residential. Former plans examiner, Miami-Dade." },
  { name: "Rohan Chen, AIA", role: "Principal · Architectural Review", bio: "Florida-registered architect, HVHZ specialist, ICC plans examiner." },
  { name: "Julian Pereira, P.E.", role: "MEP & Energy", bio: "Mechanical engineer, FBC Energy Conservation lead reviewer." },
  { name: "Dana Ortiz", role: "Inspections Lead", bio: "ICC-certified residential combination inspector. Former municipal inspector." },
  { name: "Sasha Whitfield", role: "Permit Coordinator", bio: "Tracks every file from intake to CO. Knows every counter clerk by name." },
  { name: "Esteban Ruiz", role: "Founder / GC", bio: "Licensed CGC who started Flōridian after his own jobs sat in review for months." },
];

function AboutPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="◇ About"
        title="Built by people who actually run jobsites."
        intro="Flōridian started in a trailer in Coconut Grove in 2019. A GC, a structural engineer, and an architect were tired of watching permits sit in a queue. They got licensed as a private provider and started doing the work themselves."
      />

      <section className="mx-auto max-w-6xl px-6 py-24 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-5">
          <div className="label-eyebrow">§ Principles</div>
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
      </section>

      <section className="border-y hairline bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="label-eyebrow">§ Team</div>
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 grid md:grid-cols-3 gap-px bg-border border hairline">
        {[
          { k: "2019", v: "Founded in Coconut Grove" },
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
