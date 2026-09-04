import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/municipalities")({
  head: () => ({
    meta: [
      { title: "CleardGov by Cleard — Contract plan review and inspections" },
      {
        name: "description",
        content:
          "CleardGov by Cleard provides licensed plan reviewers and inspectors to municipal building departments — contract plan review, contract inspections, backlog reduction, and staff augmentation under your oversight.",
      },
      { property: "og:title", content: "CleardGov — The building department, outsourced." },
      {
        property: "og:description",
        content:
          "Licensed professionals performing plan reviews and inspections under your department's oversight — on your timeline, at your standard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MunicipalitiesPage,
});

const BG = "#FFFFFF";
const SURFACE = "#FFFFFF";
const BORDER = "#3F5C5A";
const TEAL = "#9C6B3F";
const TITLE = "#FFFFFF";
const MUTED = "rgba(250, 243, 230, 0.66)";

const PROBLEM = [
  {
    stat: "Understaffed",
    label: "Municipal building departments are understaffed nationwide",
  },
  {
    stat: "6–12 weeks",
    label: "Permit queues in high-growth markets",
  },
  {
    stat: "Real loss",
    label: "Every week of backlog is carrying cost the contractor absorbs",
  },
];

const FEATURES: { name: string; body: string; Icon: LucideIcon }[] = [
  {
    name: "Contract Plan Review",
    body: "Licensed reviewers across all disciplines. Results submitted under your department's oversight, with organized comments and direct communication.",
    Icon: ClipboardList,
  },
  {
    name: "Contract Inspections",
    body: "Same-day and next-day licensed inspections across all trades. Your department retains final authority on every result.",
    Icon: ClipboardCheck,
  },
  {
    name: "Backlog Reduction Programs",
    body: "Surge capacity when volume spikes. We scale up with your demand without adding permanent headcount to your budget.",
    Icon: Gauge,
  },
  {
    name: "Staff Augmentation",
    body: "Embed licensed professionals into your department's workflow during vacancies, leave, or high-volume periods. No recruiting, no benefits overhead.",
    Icon: Users,
  },
];

const STEPS = [
  {
    n: "01",
    t: "Department contracts with Cleard",
    b: "We agree on scope, disciplines, turnaround standards, and oversight protocols before any work begins.",
  },
  {
    n: "02",
    t: "Licensed professionals integrate with your workflow",
    b: "Reviews and inspections are performed under your department's process and authority, not around it.",
  },
  {
    n: "03",
    t: "Results submitted, department issues",
    b: "Your building official retains final review authority. We deliver the work, you make the call.",
  },
];

const DIFFERENTIATORS = [
  {
    t: "Platform-backed, not just staffing",
    b: "Staffing agencies send people. CleardGov delivers licensed professionals plus the software that tracks every review, inspection, comment, and outcome in one auditable record.",
  },
  {
    t: "National scale",
    b: "A licensed bench across jurisdictions means surge capacity when your volume spikes, and continuity when it does not.",
  },
  {
    t: "Victoria, the intelligence layer",
    b: "Victoria reads plans, flags likely code issues before a reviewer opens the file, and drafts organized comments — so your reviewers spend time on judgment, not sorting.",
  },
  {
    t: "Zero overhead to the city",
    b: "No recruiting, no benefits, no software procurement, no permanent headcount added to your budget. Capacity turns on and off with your volume.",
  },
  {
    t: "Fee-share model",
    b: "CleardGov is funded by permit fees, not the general fund. The city retains a share of collected fees; Cleard retains the remainder and carries the people, the platform, and the liability.",
  },
];

const TRUST = [
  "All results carry full legal standing",
  "Your department maintains oversight and final authority",
  "Professionals licensed in your jurisdiction",
  "Turnaround SLAs guaranteed by contract",
];


function QueueMock() {
  const rows = [
    { id: "PR-4821", type: "Structural", who: "K. Alvarez, PE", status: "In review", tone: TEAL },
    { id: "PR-4818", type: "Mechanical", who: "D. Whitfield", status: "Comments issued", tone: "#C9A227" },
    { id: "PR-4809", type: "Electrical", who: "S. Ober, PE", status: "Complete", tone: TEAL },
    { id: "PR-4802", type: "Plumbing", who: "Unassigned", status: "Queued", tone: MUTED },
    { id: "PR-4795", type: "Building", who: "R. Nunez", status: "In review", tone: TEAL },
  ];
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: TITLE }}>
          Review queue
        </div>
        <div className="text-[11px]" style={{ color: MUTED }}>
          5 open · avg 1.8 days
        </div>
      </div>
      <div className="px-5 py-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-12 items-center gap-3 py-3 text-[12.5px]"
            style={{ borderBottom: `1px solid ${BORDER}`, color: MUTED }}
          >
            <span className="col-span-3 tabular-nums" style={{ color: TITLE }}>
              {r.id}
            </span>
            <span className="col-span-3">{r.type}</span>
            <span className="col-span-3">{r.who}</span>
            <span className="col-span-3 flex items-center justify-end gap-2" style={{ color: r.tone }}>
              <span style={{ width: 6, height: 6, background: r.tone, display: "inline-block" }} />
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MunicipalitiesPage() {
  return (
    <MarketingShell>
      <div style={{ background: BG, color: TITLE }}>
        {/* HERO */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-20 md:pt-28">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
            CleardGov · For building departments
          </div>
          <h1
            className="mt-6 max-w-3xl"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
            }}
          >
            The building department, outsourced.
          </h1>

          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: MUTED }}>
            When permit volume outpaces your staff, CleardGov by Cleard provides licensed professionals
            to perform plan reviews and inspections under your oversight — on your timeline, at your
            standard.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] no-underline"
              style={{ background: TEAL, color: "#FFFFFF", fontWeight: 700 }}
            >
              Schedule a conversation <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 text-[14px] no-underline"
              style={{ border: `1px solid ${BORDER}`, color: TITLE, fontWeight: 600 }}
            >
              How it works ↓
            </a>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="px-5 lg:px-8 pb-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl pt-16">
            <div className="grid gap-4 md:grid-cols-3">
              {PROBLEM.map((p) => (
                <div key={p.stat} className="p-7" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <div
                    style={{ color: TEAL, fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}
                  >
                    {p.stat}
                  </div>
                  <div className="mt-3 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                    {p.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT CleardGov DOES */}
        <section className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              The product
            </div>
            <h2
              className="mt-5 max-w-3xl font-bold"
              style={{ fontSize: "clamp(1.875rem, 3.6vw, 2.75rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
            >
              What CleardGov does
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.name} className="p-7" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <f.Icon size={24} strokeWidth={1.5} style={{ color: TEAL }} />
                  <h3 className="mt-5 text-[16px] font-semibold" style={{ color: TITLE }}>
                    {f.name}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              How it works
            </div>
            <h2
              className="mt-5 max-w-3xl font-bold"
              style={{ fontSize: "clamp(1.875rem, 3.6vw, 2.75rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
            >
              Three steps, under your authority.
            </h2>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="pt-6" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center text-[14px] font-bold tabular-nums"
                    style={{ background: TEAL, color: "#FFFFFF" }}
                  >
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-[18px] font-bold" style={{ letterSpacing: "-0.02em" }}>
                    {s.t}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                    {s.b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CLEARD */}
        <section className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
                Why Cleard
              </div>
              <h2
                className="mt-5 font-bold"
                style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", lineHeight: 1.07, letterSpacing: "-0.03em" }}
              >
                Capacity and visibility. Not just bodies.
              </h2>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ color: MUTED }}>
                Unlike staffing agencies, we bring a platform. Every review and inspection is tracked,
                logged, and accessible — assignment, timestamps, comments, and outcome. Your department
                gets capacity and a complete record of the work performed on its behalf.
              </p>
            </div>
            <QueueMock />
          </div>
        </section>

        {/* DIFFERENTIATORS */}
        <section className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              What sets CleardGov apart
            </div>
            <h2
              className="mt-5 max-w-3xl font-bold"
              style={{ fontSize: "clamp(1.875rem, 3.6vw, 2.75rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
            >
              The people and the platform. Funded by fees.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {DIFFERENTIATORS.map((d) => (
                <div key={d.t} className="p-7" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <h3 className="text-[16px] font-semibold" style={{ color: TITLE }}>
                    {d.t}
                  </h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                    {d.b}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="mt-4 grid gap-4 p-7 sm:grid-cols-2"
              style={{ background: SURFACE, border: `1px solid ${TEAL}` }}
            >
              <div>
                <div style={{ color: TEAL, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  City retains a share
                </div>
                <div className="mt-2 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                  Revenue generated from every permit fee collected — no headcount required.
                </div>
              </div>
              <div>
                <div style={{ color: TITLE, fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  Cleard covers operations
                </div>
                <div className="mt-2 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                  Licensed staff, technology, and program liability — fully managed.
                </div>
              </div>

            </div>
          </div>
        </section>



        {/* FOR BUILDING OFFICIALS */}
        <section className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              For building officials
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {TRUST.map((t) => (
                <div
                  key={t}
                  className="flex items-start gap-3 p-6"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                >
                  <CheckCircle2 size={20} strokeWidth={1.75} style={{ color: TEAL, flexShrink: 0 }} />
                  <span className="text-[14.5px] leading-relaxed" style={{ color: TITLE }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className="font-bold"
              style={{ fontSize: "clamp(1.875rem, 4vw, 2.75rem)", letterSpacing: "-0.03em" }}
            >
              Ready to talk capacity?
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed" style={{ color: MUTED }}>
              Schedule a call with your city manager or building official on the line. A 20-minute
              conversation covers your volume, jurisdiction, oversight protocols, and what the
              fee-share arrangement looks like.
            </p>
            <Link
              to="/contact"
              className="mt-9 flex w-full items-center justify-center gap-2 px-6 py-4 text-[14px] no-underline"
              style={{ background: TEAL, color: "#FFFFFF", fontWeight: 700 }}
            >
              Schedule a conversation <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <p className="mt-4 text-[12.5px]" style={{ color: MUTED }}>
              No commitment. We&apos;ll tell you honestly if we&apos;re the right fit.
            </p>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
