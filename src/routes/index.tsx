import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing-shell";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleared by Flōridian — Private Provider Permitting, by Invitation" },
      {
        name: "description",
        content:
          "Cleared is the private-provider permitting arm of Flōridian LLC. Plan review and inspections for the licensed GCs building Flōridian's luxury pool and hardscape projects across South Florida.",
      },
      { property: "og:title", content: "Cleared by Flōridian — Private Provider Permitting" },
      {
        property: "og:description",
        content:
          "Permits in days, not weeks — for the GCs entrusted with Flōridian's luxury work.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <Lineage />
      <Stats />
      <ServicesPreview />
      <Process />
      <Coverage />
      <CTA />
    </MarketingShell>
  );
}

function Hero() {
  return (
    <section className="relative border-b hairline">
      <div className="mx-auto max-w-7xl px-6 pt-28 pb-32 md:pt-40 md:pb-44">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              Florida Statute 553.791
            </div>
            <h1 className="mt-10 display-serif text-[clamp(2.25rem,7.5vw,7rem)] leading-[1.04] tracking-tight text-balance">
              Private-provider<br />
              permitting for the<br />
              <em className="italic font-light text-muted-foreground">Treasure Coast.</em>
            </h1>
            <p className="mt-10 max-w-xl font-display text-lg md:text-xl leading-relaxed text-foreground/80 text-pretty">
              White-shoe counsel for expedited plan review and inspections —
              extended by Flōridian LLC to the licensed general contractors
              building our luxury pool and hardscape projects.
            </p>
            <div className="mt-14 flex items-center gap-4">
              <div className="w-12 h-px bg-accent" />
              <span className="font-subline text-[11px] uppercase tracking-[0.22em] font-bold">
                By invitation only
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}




function Lineage() {
  return (
    <section className="border-b hairline bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-20 grid md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <div className="label-eyebrow">Lineage</div>
          <div className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            EST. 1998 · WEST PALM BEACH
          </div>
        </div>
        <div className="md:col-span-8">
          <p className="font-display text-2xl md:text-3xl leading-snug tracking-tight text-pretty">
            Flōridian has been building South Florida's most considered pools
            and hardscapes for nearly three decades. Cleared brings that same
            standard — and our in-house engineers, architects, and inspectors —
            to the permitting side of your job.
          </p>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { k: "5–7 days", v: "Typical plan review turnaround" },
    { k: "2 hr", v: "Inspection report delivery" },
    { k: "1998", v: "Year Flōridian was established" },
    { k: "By invitation", v: "Active Flōridian clients only" },
  ];
  return (
    <section className="border-b hairline">
      <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        {stats.map((s) => (
          <div key={s.k} className="bg-background p-8">
            <div className="font-display text-4xl tracking-tight">{s.k}</div>
            <div className="mt-3 text-sm text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ServicesPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="grid md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-4">
          <div className="label-eyebrow">Services</div>
          <h2 className="mt-4 display-serif text-4xl md:text-6xl tracking-tight text-balance">
            What we do<br />for your GC.
          </h2>
        </div>
        <p className="md:col-span-7 md:col-start-6 self-end text-lg text-muted-foreground text-pretty">
          Florida law lets a licensed private provider stand in for the
          building official on plan review and inspections. We are that
          provider for every Flōridian project — credentialed, insured, and
          operating to the standards the AHJ would apply.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-border border hairline">
        {services.map((s) => (
          <article key={s.code} className="bg-background p-8 md:p-10 group">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-accent">{s.code}</span>
              <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                SERVICE
              </span>
            </div>
            <h3 className="mt-6 display-serif text-3xl tracking-tight">{s.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.summary}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="font-mono text-accent">+</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <figure className="mt-20 max-w-3xl">
        <div className="w-12 h-px bg-accent mb-6" />
        <blockquote className="display-serif italic text-2xl md:text-3xl leading-snug text-foreground/85 text-pretty">
          “The priority is keeping the sub-trades moving without municipal lag.”
        </blockquote>
        <figcaption className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          M. Alvarez, P.E. · Cleared Plan Review
        </figcaption>
      </figure>
    </section>
  );
}

function Process() {
  const steps = [
    { n: "01", t: "Intake", d: "Your GC submits drawings, structural calcs, energy & product approvals through the Cleared portal." },
    { n: "02", t: "Plan Review", d: "A licensed reviewer red-lines the set — usually within a week." },
    { n: "03", t: "Affidavit & Permit", d: "We file the private provider affidavit; the AHJ issues the permit." },
    { n: "04", t: "Inspections", d: "Our inspectors meet the crew on site, document everything, deliver reports same-day." },
    { n: "05", t: "Close-out", d: "Final inspection, CO support, and records archived in the portal." },
  ];
  return (
    <section className="border-y hairline bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="label-eyebrow">Process</div>
        <h2 className="mt-4 display-serif text-4xl md:text-6xl tracking-tight max-w-3xl">
          A workflow your superintendents <em className="italic font-light text-muted-foreground">will actually use.</em>
        </h2>
        <div className="mt-16 grid md:grid-cols-5 gap-px bg-border border hairline">
          {steps.map((s) => (
            <div key={s.n} className="bg-background p-6 flex flex-col">
              <div className="font-mono text-xs text-accent">{s.n}</div>
              <div className="mt-4 font-display text-lg">{s.t}</div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Coverage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 grid md:grid-cols-12 gap-12">
      <div className="md:col-span-5">
        <div className="label-eyebrow">Coverage</div>
        <h2 className="mt-4 display-serif text-4xl md:text-6xl tracking-tight">
          Palm Beach<br />and the <em className="italic font-light text-muted-foreground">Treasure Coast.</em>
        </h2>
        <p className="mt-6 text-muted-foreground max-w-md">
          Anchored in West Palm Beach. We work the HVHZ amendments, the
          oceanfront flood maps, the historic-district reviews, and the local
          product approvals — same as the people behind every Flōridian pool.
        </p>
      </div>
      <div className="md:col-span-7">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border border hairline">
          {[
            "Palm Beach","West Palm Beach","Manalapan","Jupiter","Tequesta",
            "Wellington","Boca Raton","Delray Beach","Highland Beach","Gulf Stream",
            "Vero Beach","Stuart","Hobe Sound","Martin County",
          ].map((j) => (
            <div key={j} className="bg-background p-5 font-mono text-xs uppercase tracking-wider hover:text-accent transition-colors">
              {j}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t hairline bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-60">
          By invitation
        </div>
        <h2 className="mt-8 display-serif text-4xl md:text-7xl tracking-tight text-balance max-w-4xl">
          Building with Flōridian?<br />
          <em className="italic font-light opacity-80">Get your GC Cleared.</em>
        </h2>
        <div className="mt-16 max-w-md">
          <Button
            asChild
            variant="outline"
            className="w-full h-14 px-6 rounded-none border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background justify-between font-subline text-xs uppercase tracking-[0.22em] font-bold"
          >
            <Link to="/contact">
              Request access
              <ArrowRight className="h-4 w-4 opacity-70" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
