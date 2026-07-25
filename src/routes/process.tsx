import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell, PageHeader } from "@/components/marketing-shell";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/process")({
  head: () => ({
    meta: [
      { title: "Process — How Cleared Moves Your Permit" },
      {
        name: "description",
        content:
          "From submittal to certificate of occupancy: how Cleared moves Flōridian-affiliated residential permits through plan review and inspection under Florida's private provider statute.",
      },
      { property: "og:title", content: "Cleared Process" },
      { property: "og:description", content: "From submittal to CO — the private provider workflow." },
    ],
  }),
  component: ProcessPage,
});

const steps = [
  {
    n: "01",
    day: "Day 0",
    t: "Intake",
    d: "Upload drawings, structural calcs, energy compliance, and product approvals into the Cleared portal. We confirm scope within 4 business hours and issue a fixed-fee proposal.",
    out: "Signed agreement · Project number · Reviewer assigned",
  },
  {
    n: "02",
    day: "Day 1–2",
    t: "Plan Review",
    d: "A licensed Florida engineer or architect performs a full code review against the Florida Building Code 8th Edition — 2-day plan review turnaround. Comments are returned on the original set with cloud markups and a tracked correction log.",
    out: "Red-lined set · Correction log · Compliance summary",
  },
  {
    n: "03",
    day: "Day 3–5",
    t: "Affidavit & Permit",
    d: "Once revisions clear, we sign and file the Private Provider Affidavit with the AHJ. By statute, the building department has 10 business days to issue the permit or cite specific plan deficiencies.",
    out: "FS 553.791 affidavit · Permit issued",
  },
  {
    n: "04",
    day: "Construction",
    t: "Inspections",
    d: "Your super requests inspections through the portal — same-day inspections. Our inspectors meet your crews on site, document the work, and deliver digital reports within two hours.",
    out: "Digital inspection reports · Photo records",
  },
  {
    n: "05",
    day: "Close-out",
    t: "Certificate of Occupancy",
    d: "Final inspection, threshold sign-off, and submittal of the Private Provider close-out package to the AHJ. All records remain available in the portal for the life of the building.",
    out: "CO support · Archived project file",
  },
];

function ProcessPage() {
  return (
    <MarketingShell>
      <PageHeader
        eyebrow="Process"
        title="From submittal to CO. Five phases. No surprises."
        intro="Every Cleared project follows the same documented workflow under Florida Statute 553.791. Here is exactly what to expect and when."
      />

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-24">
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border" aria-hidden />
          <ol className="space-y-16">
            {steps.map((s, i) => (
              <li key={s.n} className="relative grid md:grid-cols-2 gap-8 md:gap-16">
                <div className={i % 2 === 0 ? "md:pr-12 md:text-right" : "md:order-2 md:pl-12"}>
                  <div className="font-mono text-xs text-accent">{s.n} · {s.day}</div>
                  <h3 className="mt-3 font-display text-3xl tracking-tight">{s.t}</h3>
                  <p className="mt-4 text-muted-foreground text-pretty">{s.d}</p>
                  <div className="mt-5 inline-flex items-center gap-2 border hairline bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-wider">
                    <ArrowRight className="h-3 w-3 text-accent" /> {s.out}
                  </div>
                </div>
                <div className="hidden md:block" />
                <span
                  className="absolute left-6 md:left-1/2 -translate-x-1/2 top-2 h-3 w-3 bg-accent ring-4 ring-background"
                  aria-hidden
                />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </MarketingShell>
  );
}
