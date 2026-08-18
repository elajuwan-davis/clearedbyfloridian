import { createFileRoute, Link } from "@tanstack/react-router";

import { Layers, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";
import { AppFrame, KanbanMock, M } from "@/components/marketing-mockups";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare — Cleard vs GreenLite, Permit Flow, SunRay, myCOI" },
      {
        name: "description",
        content:
          "Side-by-side comparison of Cleard against GreenLite, Permit Flow, SunRay, myCOI, Inspected, 1 Contractor Solutions, and Freedom Code Compliance across permitting, private plan review, licensing, insurance compliance, and lien rights.",
      },
      { property: "og:title", content: "Built where others stop." },
      {
        property: "og:description",
        content:
          "Most tools do one thing. Cleard delivers all five services — permitting, private plan review, licensing, insurance compliance, and lien rights — in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const INK = "#2F4F4F";
const GRAY = "#5F7373";
const LIGHT = "#9A8E7C";
const TEAL = "#673147";
const BORDER = "#E0D3BC";
const OFF = "#F3EAD9";

const COMPETITORS = [
  "GreenLite",
  "Permit Flow",
  "SunRay",
  "myCOI",
  "Inspected",
  "1 Contractor Solutions",
  "Freedom Code Compliance",
];

type Row = { feature: string; cells: string[] }; // [Cleard, ...COMPETITORS]

const ROWS: Row[] = [
  {
    feature: "Permitting Administration",
    cells: ["\u2713", "\u2713", "\u2713", "\u2014", "\u2014", "\u2014", "\u2713", "\u2014"],
  },
  {
    feature: "Private Plan Review & Inspections",
    cells: ["\u2713", "\u2713", "\u2014", "\u2014", "\u2014", "\u2713", "\u2014", "\u2713"],
  },
  {
    feature: "Contractor License Management",
    cells: ["\u2713", "\u2014", "\u2014", "\u2014", "\u2014", "\u2014", "\u2713", "\u2014"],
  },
  {
    feature: "Insurance Compliance",
    cells: ["\u2713", "\u2014", "\u2014", "\u2014", "\u2713", "\u2014", "\u2014", "\u2014"],
  },
  {
    feature: "Lien Rights",
    cells: ["\u2713", "\u2014", "\u2014", "\u2713", "\u2014", "\u2014", "\u2014", "\u2014"],
  },
  {
    feature: "Permit flow / submission tracking",
    cells: ["\u2713", "\u2713", "\u2713", "\u2014", "\u2014", "\u2014", "\u2713", "\u2014"],
  },
  {
    feature: "AI assistant",
    cells: ["\u2713", "\u2713", "\u2713", "\u2014", "\u2014", "\u2014", "\u2014", "\u2014"],
  },
  {
    feature: "Pricing model",
    cells: [
      "Subscription",
      "Per-project",
      "Subscription",
      "Per-document",
      "Subscription",
      "Per-inspection",
      "Per-project",
      "Per-project",
    ],
  },
  {
    feature: "Dedicated back-office support",
    cells: ["\u2713", "\u2014", "\u2014", "\u2014", "\u2014", "\u2014", "\u2713", "\u2014"],
  },
];

const CALLOUTS = [
  {
    title: "vs. GreenLite",
    body:
      "GreenLite handles permitting and inspections. Cleard handles those — plus contractor license management, insurance compliance, and lien rights. GreenLite is a permit tool. Cleard is your back office.",
  },
  {
    title: "vs. SunRay + myCOI",
    body:
      "SunRay manages documents. myCOI manages certificates. Using both means two logins, two bills, and no connection between them. Cleard covers both — integrated.",
  },
  {
    title: "vs. 1 Contractor Solutions + Freedom Code Compliance",
    body:
      "Both are service-agency models — they do the work, you wait, and there is no platform of record. Cleard gives you the software plus the back office, so you can see every permit, license, COI, and lien deadline yourself.",
  },
];

function ComparePage() {
  return (
    <MarketingShell>
      <div style={{ background: "#FAF3E6", color: INK }}>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-10 md:pt-28">
          <div className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: LIGHT }}>
            Compare
          </div>
          <h1
            className="mt-6 max-w-3xl"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            Built where others stop.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
            Most tools do one thing. Cleard delivers all five services — permitting administration,
            private plan review and inspections, license management, insurance compliance, and
            lien rights — in one platform.
          </p>
        </section>

        {/* Table */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-16">
          <div className="overflow-x-auto" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 1120 }}>
              <thead>
                <tr style={{ background: OFF }}>
                  <th
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: GRAY, borderBottom: `1px solid ${BORDER}` }}
                  >
                    Feature
                  </th>
                  <th
                    className="px-4 py-4 align-bottom text-center"
                    style={{
                      background: "rgba(103,49,71,0.14)",
                      borderBottom: `2px solid ${TEAL}`,
                    }}
                  >
                    <span
                      className="mx-auto mb-2 flex h-9 w-9 items-center justify-center text-[13px] font-bold"
                      style={{ background: M.bg0, color: TEAL }}
                    >
                      C
                    </span>
                    <span
                      className="block text-[11px] uppercase tracking-[0.16em]"
                      style={{ color: INK, fontWeight: 800 }}
                    >
                      Cleard
                    </span>
                  </th>
                  {COMPETITORS.map((c) => (
                    <th
                      key={c}
                      className="px-4 py-4 align-bottom text-center"
                      style={{ borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" }}
                    >
                      <span
                        className="mx-auto mb-2 flex h-9 w-9 items-center justify-center text-[13px] font-bold"
                        style={{ background: OFF, border: `1px solid ${BORDER}`, color: GRAY }}
                      >
                        {c.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase()}
                      </span>
                      <span
                        className="block text-[10px] uppercase tracking-[0.16em]"
                        style={{ color: GRAY }}
                      >
                        {c}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.feature}>
                    <td
                      className="px-4 py-3 text-[14px]"
                      style={{ borderBottom: `1px solid ${BORDER}`, color: INK }}
                    >
                      {r.feature}
                    </td>
                    {r.cells.map((cell, i) => {
                      const isCleard = i === 0;
                      const yes = cell === "✓";
                      return (
                        <td
                          key={`${r.feature}-${i}`}
                          className="px-4 py-3 text-center text-[14px]"
                          style={{
                            borderBottom: `1px solid ${BORDER}`,
                            background: isCleard ? "rgba(103,49,71,0.06)" : "transparent",
                            color: isCleard && yes ? "#52243A" : yes ? INK : LIGHT,
                            fontWeight: isCleard ? 700 : 500,
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Callouts */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {CALLOUTS.map((c) => (
              <div key={c.title} className="p-6" style={{ border: `1px solid ${BORDER}`, background: "#FAF3E6" }}>
                <div className="text-[13px] uppercase tracking-[0.16em]" style={{ color: INK, fontWeight: 700 }}>
                  {c.title}
                </div>
                <p className="mt-4 text-[14px] leading-relaxed" style={{ color: GRAY }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Cleard wins */}
        <section style={{ background: M.bg0 }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-32">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: TEAL }}>
              Why Cleard wins
            </div>
            <h2
              className="mt-6 max-w-3xl"
              style={{
                color: M.text,
                fontWeight: 800,
                fontSize: "clamp(2rem, 3.8vw, 3rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
              }}
            >
              One platform instead of four vendors.
            </h2>

            <div className="mt-14 grid gap-px md:grid-cols-3" style={{ background: M.line }}>
              {[
                {
                  Icon: Layers,
                  t: "Full lifecycle, one login",
                  b: "Permits, private plan review, licenses, insurance, and lien rights share the same project record — nothing gets re-keyed between systems.",
                },
                {
                  Icon: ShieldCheck,
                  t: "Licensed private provider",
                  b: "We do not just track submittals. Certified professionals perform plan review and field inspections, so approvals do not wait behind a municipal queue.",
                },
                {
                  Icon: Sparkles,
                  t: "Victoria watches everything",
                  b: "Missing documents, expiring COIs, and statutory deadlines get flagged before they turn into a delay or a lost lien right.",
                },
              ].map((c) => (
                <div key={c.t} className="p-8" style={{ background: M.bg1 }}>
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center"
                    style={{ background: "rgba(103,49,71,0.12)" }}
                  >
                    <c.Icon className="h-5 w-5" style={{ color: TEAL }} strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-6 text-[17px] font-bold" style={{ color: M.text, letterSpacing: "-0.02em" }}>
                    {c.t}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed" style={{ color: M.muted }}>
                    {c.b}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16">
              <AppFrame path="app.cleard.io/permits" active="Permits">
                <KanbanMock />
              </AppFrame>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: OFF, borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 text-center">
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                letterSpacing: "-0.03em",
                color: INK,
              }}
            >
              See Cleard in action
            </h2>
            <Link
              to="/product"
              className="mt-8 inline-flex items-center px-6 py-3 text-[14px] no-underline"
              style={{ background: TEAL, color: "#FAF3E6", fontWeight: 700 }}
            >
              See a live demo
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
