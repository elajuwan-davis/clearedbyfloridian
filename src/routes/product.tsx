import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  FileCheck2,
  FileStack,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";
import {
  AppFrame,
  CertificateMock,
  CoiCheckMock,
  InspectionCalendarMock,
  IntakeFormMock,
  KanbanMock,
  LicenseDashMock,
  LienDocsMock,
  M,
  NeuralArt,
  TealGlow,
  VictoriaChatMock,
} from "@/components/marketing-mockups";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Product — Cleard permitting and compliance platform" },
      {
        name: "description",
        content:
          "One platform for permitting administration, private plan review and inspections, contractor license management, insurance compliance, and lien rights — plus how Cleard works, start to certificate of occupancy.",
      },
      { property: "og:title", content: "Every tool your operation needs." },
      {
        property: "og:description",
        content:
          "Five services, one platform, one login. See the product, the five services, and how Cleard works end to end.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

const INK = "#2B1620";
const GRAY = "#7A5C68";
const LIGHT = "#9A8E7C";
const GREEN = "#2F4F4F"; /* minor accent only */
const TEAL = "#673147";
const BORDER = "#E0D3BC";
const OFF = "#F3EAD9";

type Service = {
  name: string;
  tagline: string;
  bullets: string[];
  Icon: LucideIcon;
  path: string;
  nav: string;
  visual: React.ReactNode;
};

const SERVICES: Service[] = [
  {
    name: "Permitting Administration",
    tagline:
      "Full-service permit management — application, submission, tracking, corrections, and certificate of occupancy, handled end to end.",
    bullets: [
      "Application prep and jurisdiction submittal",
      "Smart document checklists per jurisdiction",
      "Correction responses and resubmittals",
      "Real-time status tracking through certificate of occupancy",
    ],
    Icon: FileStack,
    path: "app.cleard.io/permits",
    nav: "Permits",
    visual: <KanbanMock />,
  },
  {
    name: "Private Plan Review & Inspections",
    tagline:
      "Faster approvals through licensed private providers. Plan review and field inspections performed by certified professionals, not municipal backlogs.",
    bullets: [
      "2-day plan review by licensed engineers and architects",
      "Same-day inspections coordinated with your super",
      "Structural, mechanical, electrical, and plumbing review",
      "Documented correction log on the original plan set",
    ],
    Icon: ShieldCheck,
    path: "app.cleard.io/inspections",
    nav: "Inspections",
    visual: <InspectionCalendarMock />,
  },
  {
    name: "Contractor License Management",
    tagline:
      "License verification, renewal tracking, CE hour monitoring, and qualifying agent oversight — all in one dashboard.",
    bullets: [
      "Live license status for your company and every sub",
      "Renewal alerts at 90/60/30 days",
      "Continuing education hour tracking",
      "Qualifying agent monitoring and change-of-status support",
    ],
    Icon: BadgeCheck,
    path: "app.cleard.io/licenses",
    nav: "Licenses",
    visual: <LicenseDashMock />,
  },
  {
    name: "Insurance Compliance",
    tagline:
      "Certificate of insurance collection, coverage validation, expiration tracking, and automated follow-up for your entire subcontractor roster.",
    bullets: [
      "COI requests with required coverage specs per trade",
      "Vendor portal — a unique link for every sub",
      "Coverage validation: types, limits, additional insured",
      "Automated follow-up and expiration alerts",
    ],
    Icon: FileCheck2,
    path: "app.cleard.io/insurance",
    nav: "Insurance",
    visual: <CoiCheckMock />,
  },
  {
    name: "Lien Rights",
    tagline:
      "Notice of Commencement, Preliminary Notices, Lien Waivers, and statutory deadline tracking — generated, signed, and recorded without leaving the platform.",
    bullets: [
      "Document generation for every notice and waiver type",
      "E-signature routing built in",
      "Statutory deadline tracker per project",
      "County e-recording requests and status",
    ],
    Icon: Scale,
    path: "app.cleard.io/lien-rights",
    nav: "Lien Rights",
    visual: <LienDocsMock />,
  },
];

const STEPS = [
  {
    n: "01",
    t: "Submit",
    b: "Send scope and drawings once. We build the application, run the document checklist, and file it.",
    visual: (
      <AppFrame path="app.cleard.io/permits/new" active="Permits">
        <IntakeFormMock />
      </AppFrame>
    ),
  },
  {
    n: "02",
    t: "Track",
    b: "Every permit, correction, and inspection moves across one live pipeline — no status calls.",
    visual: (
      <AppFrame path="app.cleard.io/permits" active="Permits">
        <KanbanMock />
      </AppFrame>
    ),
  },
  {
    n: "03",
    t: "Close",
    b: "Final inspections clear, the CO is issued, and your full closeout package is archived.",
    visual: (
      <AppFrame path="app.cleard.io/permits/CLR-2026-0212" active="Documents">
        <CertificateMock />
      </AppFrame>
    ),
  },
];

function ProductPage() {
  return (
    <MarketingShell>
      <div style={{ background: "#FAF3E6", color: INK }}>
        {/* INTRO */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-16 md:pt-28">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
            The platform
          </div>
          <h1
            className="mt-6 max-w-4xl"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
            }}
          >
            Every tool your operation needs.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
            Cleard is the back office behind your projects. Five services, one platform, one login —
            permitting, private plan review and inspections, license management, insurance compliance,
            and lien rights. Built for licensed contractors across every trade.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/join"
              hash="request"
              className="inline-flex items-center px-5 py-3 text-[14px] no-underline"
              style={{ background: TEAL, color: "#FAF3E6", fontWeight: 700 }}
            >
              Get early access
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center px-5 py-3 text-[14px] no-underline"
              style={{ border: `1px solid ${BORDER}`, color: INK, fontWeight: 600 }}
            >
              See pricing
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {SERVICES.map((s) => (
              <span key={s.name} className="flex items-center gap-2 text-[12.5px]" style={{ color: GRAY }}>
                <s.Icon className="h-3.5 w-3.5" style={{ color: TEAL }} strokeWidth={1.75} />
                {s.name}
              </span>
            ))}
          </div>
        </section>

        {/* THE 5 SERVICES */}
        <div>
          {SERVICES.map((s, idx) => {
            const reverse = idx % 2 === 1;
            return (
              <section
                key={s.name}
                className="px-5 lg:px-8 py-24 lg:py-32"
                style={{ background: idx % 2 === 1 ? "#FAF3E6" : "#FAF3E6", borderTop: `1px solid ${BORDER}` }}
              >
                <div
                  className={`mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20 ${
                    reverse ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div>
                    <div className="mb-6 flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center"
                        style={{ background: M.bg0 }}
                      >
                        <s.Icon size={18} strokeWidth={1.5} style={{ color: TEAL }} />
                      </span>
                      <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: GRAY }}>
                        {String(idx + 1).padStart(2, "0")} · Service
                      </div>
                    </div>
                    <h2
                      className="mb-6 font-bold"
                      style={{
                        fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                        lineHeight: 1.05,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {s.name}
                    </h2>
                    <p className="mb-8 text-[17px] leading-relaxed" style={{ color: GRAY }}>
                      {s.tagline}
                    </p>
                    <ul className="space-y-4">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0" style={{ background: INK }} />
                          <span className="text-[15px] leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-8"
                      style={{
                        background:
                          "radial-gradient(55% 50% at 50% 45%, rgba(103,49,71,0.16) 0%, transparent 70%)",
                      }}
                    />
                    <div className="relative">
                      <AppFrame path={s.path} active={s.nav}>
                        {s.visual}
                      </AppFrame>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* HOW IT WORKS */}
        <section style={{ background: M.bg1 }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-32">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: GREEN }}>
              How it works
            </div>
            <h2
              className="mt-6 max-w-3xl"
              style={{ fontSize: "clamp(2rem, 3.8vw, 3rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
            >
              <span style={{ color: M.text, fontWeight: 800 }}>Submit. Track. Close. </span>
              <span style={{ color: M.muted, fontWeight: 600 }}>That&apos;s your part.</span>
            </h2>

            <div className="mt-16 space-y-16 md:space-y-24">
              {STEPS.map((s, i) => (
                <div key={s.t} className="grid gap-10 lg:grid-cols-12 lg:items-center">
                  <div className={`lg:col-span-4 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center text-[15px] font-bold tabular-nums"
                      style={{ background: TEAL, color: M.bg0 }}
                    >
                      {s.n}
                    </div>
                    <h3
                      className="mt-6 font-bold"
                      style={{ color: M.text, fontSize: "clamp(1.5rem, 2.4vw, 2rem)", letterSpacing: "-0.03em" }}
                    >
                      {s.t}
                    </h3>
                    <p className="mt-4 text-[15px] leading-relaxed" style={{ color: M.muted }}>
                      {s.b}
                    </p>
                  </div>
                  <div className={`lg:col-span-8 ${i % 2 === 1 ? "lg:order-1" : ""}`}>{s.visual}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VICTORIA */}
        <section className="relative overflow-hidden" style={{ background: M.bg0 }}>
          <TealGlow opacity={0.45} />
          <div className="relative mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-32">
            <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <NeuralArt />
              </div>
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: TEAL }} strokeWidth={1.75} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: TEAL }}
                  >
                    Platform intelligence
                  </span>
                </div>
                <h2
                  className="mt-5"
                  style={{
                    color: M.text,
                    fontWeight: 800,
                    fontSize: "clamp(2rem, 3.8vw, 3rem)",
                    lineHeight: 1.06,
                    letterSpacing: "-0.035em",
                  }}
                >
                  Powered by Victoria
                </h2>
                <p className="mt-5 max-w-2xl text-[16px] leading-relaxed" style={{ color: M.muted }}>
                  Every service on this platform is backed by Victoria — Cleard&apos;s AI engine. She
                  answers jurisdiction questions, flags missing documents, routes correction responses,
                  and surfaces compliance risks before they become delays. You don&apos;t buy Victoria.
                  She comes with Cleard.
                </p>
                <div className="mt-9">
                  <VictoriaChatMock />
                </div>
              </div>
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
              Run projects. Not paperwork.
            </h2>
            <Link
              to="/join"
              hash="request"
              className="mt-8 inline-flex items-center px-6 py-3 text-[14px] no-underline"
              style={{ background: TEAL, color: "#FAF3E6", fontWeight: 700 }}
            >
              Get early access
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
