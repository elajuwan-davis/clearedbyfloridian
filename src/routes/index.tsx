import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
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
    <section className="relative border-b hairline overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-70" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-secondary/40 to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6 pt-28 pb-32 md:pt-36 md:pb-40">
        <div className="grid md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="label-eyebrow"
            >
              By invitation · FL Statute 553.791
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-8 font-display text-[clamp(2.75rem,7vw,6.25rem)] leading-[0.95] tracking-tight text-balance"
            >
              Permits in days.<br />
              <span className="text-muted-foreground">Not weeks.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 max-w-xl text-lg text-muted-foreground text-pretty"
            >
              Cleared is the private-provider permitting arm of Flōridian LLC —
              offered exclusively to the licensed general contractors building
              Flōridian's luxury pool and hardscape projects. Twenty-eight years
              of South Florida residential construction, applied to your permit.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="rounded-sm h-12 px-6">
                <Link to="/contact">Request access</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-sm h-12 px-6">
                <Link to="/services">See services</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="md:col-span-4"
          >
            <div className="border hairline bg-card p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="label-eyebrow">Project · CLR-2026-0184</div>
              <div className="mt-4 font-display text-xl leading-tight">
                1217 S Ocean Blvd<br />Manalapan
              </div>
              <div className="mt-6 space-y-3 font-mono text-xs">
                <Row k="Submitted" v="2026.05.22" />
                <Row k="Review" v="In progress · 3d" />
                <Row k="Reviewer" v="M. Alvarez, P.E." />
                <Row k="Jurisdiction" v="Palm Beach County" />
              </div>
              <div className="mt-6">
                <div className="h-1 bg-secondary overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: "42%" }} />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>INTAKE</span>
                  <span>REVIEW</span>
                  <span>APPROVED</span>
                  <span>CLOSED</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground uppercase tracking-wider">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
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
          <h2 className="mt-4 font-display text-4xl md:text-5xl tracking-tight text-balance">
            What we do for your GC.
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
            <h3 className="mt-6 font-display text-2xl tracking-tight">{s.title}</h3>
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
        <h2 className="mt-4 font-display text-4xl md:text-5xl tracking-tight max-w-2xl">
          A workflow your superintendents will actually use.
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
        <h2 className="mt-4 font-display text-4xl md:text-5xl tracking-tight">
          Palm Beach<br />and the Treasure Coast.
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
    <section className="border-t hairline bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-28 grid md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <div className="font-mono text-xs uppercase tracking-[0.22em] opacity-60">
            By invitation
          </div>
          <h2 className="mt-6 font-display text-4xl md:text-6xl tracking-tight text-balance">
            Building with Flōridian? Get your GC Cleared.
          </h2>
        </div>
        <div className="md:col-span-4 flex md:justify-end">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="rounded-sm h-12 px-6 bg-background text-foreground hover:bg-background/90"
          >
            <Link to="/contact" className="inline-flex items-center gap-2">Request access <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
