import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare — Cleard vs GreenLite, SunRay, myCOI" },
      {
        name: "description",
        content:
          "Side-by-side comparison of Cleard against GreenLite, PermitRockstar, SunRay, myCOI, and 1 Contractor Solutions across permitting, private plan review, licensing, insurance compliance, and AI.",
      },
      { property: "og:title", content: "Built where others stop." },
      {
        property: "og:description",
        content:
          "Most tools do one thing. Cleard delivers all five services — permitting, private plan review, licensing, insurance compliance, and Victoria.AI — in one platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const INK = "#111110";
const GRAY = "#6B6860";
const LIGHT = "#9E9B96";
const TEAL = "#00B4A8";
const BORDER = "#E4E2DE";
const OFF = "#F5F4F0";

const COMPETITORS = ["GreenLite", "PermitRockstar", "SunRay", "myCOI", "1 Contractor Solutions"];

type Row = { feature: string; cells: string[] }; // [cleard, ...competitors]

const ROWS: Row[] = [
  { feature: "Permitting Administration", cells: ["✓", "✓", "✓", "—", "—", "✓"] },
  { feature: "Private Plan Review & Inspections", cells: ["✓", "✓", "✓", "—", "—", "—"] },
  { feature: "Contractor License Management", cells: ["✓", "—", "—", "—", "—", "✓"] },
  { feature: "Insurance Compliance", cells: ["✓", "—", "—", "—", "✓", "—"] },
  { feature: "Victoria.AI back-office assistant", cells: ["✓", "—", "—", "—", "—", "—"] },
];

const CALLOUTS = [
  {
    title: "vs. GreenLite",
    body:
      "GreenLite handles permitting and inspections. Cleard handles those — plus contractor license management, insurance compliance, and Victoria.AI. GreenLite is a permit tool. Cleard is your back office.",
  },
  {
    title: "vs. SunRay + myCOI",
    body:
      "SunRay manages documents. myCOI manages certificates. Using both means two logins, two bills, and no connection between them. Cleard covers both — integrated.",
  },
  {
    title: "vs. PermitRockstar + 1 Contractor Solutions",
    body:
      "Both are agency models — they do the work, you wait. Cleard gives you the platform to run it yourself, with support when you need it.",
  },
];

function ComparePage() {
  return (
    <MarketingShell>
      <div style={{ background: "#FFFFFF", color: INK }}>
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
            Victoria.AI — in one platform.
          </p>
        </section>

        {/* Table */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pb-16">
          <div className="overflow-x-auto" style={{ border: `1px solid ${BORDER}` }}>
            <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 880 }}>
              <thead>
                <tr style={{ background: OFF }}>
                  <th
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: GRAY, borderBottom: `1px solid ${BORDER}` }}
                  >
                    Feature
                  </th>
                  <th
                    className="px-4 py-3 text-center text-[11px] uppercase tracking-[0.16em]"
                    style={{
                      color: INK,
                      fontWeight: 800,
                      background: "rgba(0,180,168,0.14)",
                      borderBottom: `2px solid ${TEAL}`,
                    }}
                  >
                    Cleard
                  </th>
                  {COMPETITORS.map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3 text-center text-[10px] uppercase tracking-[0.16em]"
                      style={{ color: GRAY, borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" }}
                    >
                      {c}
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
                            background: isCleard ? "rgba(0,180,168,0.06)" : "transparent",
                            color: isCleard && yes ? "#00917F" : yes ? INK : LIGHT,
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
              <div key={c.title} className="p-6" style={{ border: `1px solid ${BORDER}`, background: "#FFFFFF" }}>
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
              to="/process"
              className="mt-8 inline-flex items-center px-6 py-3 text-[14px] no-underline"
              style={{ background: TEAL, color: INK, fontWeight: 700 }}
            >
              See a live demo
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
