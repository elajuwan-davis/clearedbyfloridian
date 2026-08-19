import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  FileStack,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";
import { M, NeuralArt, TealGlow, VictoriaChatMock } from "@/components/marketing-mockups";

export const Route = createFileRoute("/product")({
  head: () => ({
    meta: [
      { title: "Product — One platform, two tracks | Cleard" },
      {
        name: "description",
        content:
          "Cleard is one compliance platform with two tracks: five products for contractors and [DEPT] for municipalities, all backed by Victoria, the AI intelligence layer.",
      },
      { property: "og:title", content: "One platform. Two tracks. Every compliance function handled." },
      {
        property: "og:description",
        content:
          "Five contractor products, an outsourced building department for municipalities, and a shared AI intelligence layer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

/* Cleard design system tokens for this page */
const CARD_BG = "#111310";
const CARD_BG_HOVER = "#1A1C1A";
const CARD_BORDER = "#2A2E2C";
const TEAL = "#00B4A8";
const CARD_TITLE = "#F5F4F0";
const CARD_MUTED = "#8C8B7A";

const INK = "#2B1620";
const GRAY = "#7A5C68";
const GREEN = "#2F4F4F";
const BORDER = "#E0D3BC";
const PAPER = "#FAF3E6";
const OFF = "#F3EAD9";

type Product = { name: string; job: string; Icon: LucideIcon };

const CONTRACTOR_PRODUCTS: Product[] = [
  {
    name: "Permitting Administration",
    job: "Full-service permit management, application to CO.",
    Icon: FileStack,
  },
  {
    name: "Private Plan Review & Inspections",
    job: "Licensed private providers, faster than the municipal backlog.",
    Icon: ShieldCheck,
  },
  {
    name: "Contractor License Management",
    job: "License verification, renewal, CE tracking.",
    Icon: BadgeCheck,
  },
  {
    name: "Insurance Compliance",
    job: "COI collection, validation, expiration tracking, automated follow-up.",
    Icon: FileCheck2,
  },
  {
    name: "Lien Rights",
    job: "NOC, Preliminary Notice, Lien Waivers, statutory deadline tracking.",
    Icon: Scale,
  },
];

const DEPT_CHIPS = [
  "Contract plan review · All disciplines",
  "Inspections, all trades",
  "Backlog reduction programs",
];

const STEPS = [
  {
    n: "01",
    t: "Connect your projects",
    b: "Send scope, drawings, and your roster once. Cleard builds the applications and the document checklists.",
  },
  {
    n: "02",
    t: "Cleard manages compliance",
    b: "Permits, plan review, inspections, licenses, insurance, and lien notices are run by one team on one platform.",
  },
  {
    n: "03",
    t: "You get time back",
    b: "Live status instead of status calls. Your people stay on the build, not on hold with a jurisdiction.",
  },
];

function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      to="/join"
      hash="request"
      className="group relative block p-7 no-underline transition-colors"
      style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 0 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = CARD_BG_HOVER;
        e.currentTarget.style.borderColor = TEAL;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = CARD_BG;
        e.currentTarget.style.borderColor = CARD_BORDER;
      }}
    >
      <p.Icon size={24} strokeWidth={1.5} style={{ color: TEAL }} />
      <h3 className="mt-5 text-[16px] font-semibold" style={{ color: CARD_TITLE }}>
        {p.name}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed" style={{ color: CARD_MUTED }}>
        {p.job}
      </p>
      <span
        className="mt-5 inline-flex items-center gap-1 text-[12px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: TEAL }}
      >
        Learn more <ArrowRight className="h-3 w-3" strokeWidth={2} />
      </span>
    </Link>
  );
}

function ProductPage() {
  return (
    <MarketingShell>
      <div style={{ background: PAPER, color: INK }}>
        {/* HERO */}
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
            One platform. Two tracks.{" "}
            <span style={{ color: GREEN, fontWeight: 600 }}>Every compliance function handled.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
            Cleard runs the compliance operation on both sides of the counter: five products for
            contractors, and an outsourced building department for municipalities. One team, one
            platform, one login — with Victoria, our AI engine, running underneath all of it.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#contractors"
              className="inline-flex items-center px-5 py-3 text-[14px] no-underline"
              style={{ background: GREEN, color: PAPER, fontWeight: 700 }}
            >
              For Contractors
            </a>
            <a
              href="#municipalities"
              className="inline-flex items-center px-5 py-3 text-[14px] no-underline"
              style={{ border: `1px solid ${BORDER}`, color: INK, fontWeight: 600 }}
            >
              For Municipalities
            </a>
          </div>
        </section>

        {/* CONTRACTOR PRODUCTS */}
        <section id="contractors" className="px-5 lg:px-8 py-20" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
              For contractors
            </div>
            <h2
              className="mt-5 max-w-3xl font-bold"
              style={{ fontSize: "clamp(1.875rem, 3.6vw, 2.75rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
            >
              Five products. One operation.
            </h2>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed" style={{ color: GRAY }}>
              Each product stands on its own and shares the same data, the same portal, and the same
              team. Run one, or run all five.
            </p>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {CONTRACTOR_PRODUCTS.map((p) => (
                <ProductCard key={p.name} p={p} />
              ))}
            </div>
          </div>
        </section>

        {/* MUNICIPALITY PRODUCT — [DEPT] */}
        <section id="municipalities" className="px-5 lg:px-8 pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
              For municipalities
            </div>

            <div
              className="mt-6 p-8 md:p-14"
              style={{ background: CARD_BG, borderLeft: `3px solid ${TEAL}`, borderRadius: 0 }}
            >
              <div className="flex items-center gap-3">
                <Building2 size={22} strokeWidth={1.5} style={{ color: TEAL }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: TEAL }}
                >
                  Government track
                </span>
              </div>
              <div
                className="mt-5"
                style={{ color: CARD_TITLE, fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                [DEPT]
              </div>
              <div className="mt-2 text-[17px] font-semibold" style={{ color: TEAL }}>
                The building department, outsourced.
              </div>
              <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed" style={{ color: CARD_MUTED }}>
                [DEPT] gives a municipality a full building department without the hiring cycle:
                contract plan review across every discipline, field inspections for every trade,
                backlog reduction programs, and staff augmentation when your own reviewers are short.
                Municipalities retain full oversight and final authority on every determination —
                Cleard provides the licensed professionals and the platform they work in.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {DEPT_CHIPS.map((c) => (
                  <span
                    key={c}
                    className="px-4 py-2 text-[12.5px]"
                    style={{ border: `1px solid ${CARD_BORDER}`, color: CARD_TITLE, borderRadius: 0 }}
                  >
                    {c}
                  </span>
                ))}
              </div>

              <Link
                to="/contact"
                className="mt-10 inline-flex items-center gap-2 px-6 py-3 text-[14px] no-underline"
                style={{ background: TEAL, color: "#0B0D0B", fontWeight: 700, borderRadius: 0 }}
              >
                Talk to our team <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
                    The intelligence layer
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
                  You don&apos;t buy Victoria. She comes with Cleard.
                </h2>
                <p className="mt-5 max-w-2xl text-[16px] leading-relaxed" style={{ color: M.muted }}>
                  Victoria is the AI engine running across every product on both tracks — answering
                  jurisdiction questions, flagging missing documents, and surfacing compliance risks
                  before they become delays. She is the central nervous system of the platform, not a
                  line item on an invoice.
                </p>
                <div className="mt-9">
                  <VictoriaChatMock />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ background: PAPER, borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
              How it works
            </div>
            <h2
              className="mt-5 max-w-3xl font-bold"
              style={{ fontSize: "clamp(1.875rem, 3.6vw, 2.75rem)", lineHeight: 1.06, letterSpacing: "-0.035em" }}
            >
              Three steps. That&apos;s your part.
            </h2>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} style={{ borderTop: `1px solid ${BORDER}` }} className="pt-6">
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center text-[14px] font-bold tabular-nums"
                    style={{ background: GREEN, color: PAPER }}
                  >
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-[20px] font-bold" style={{ letterSpacing: "-0.025em" }}>
                    {s.t}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed" style={{ color: GRAY }}>
                    {s.b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARE TEASER */}
        <section style={{ background: OFF, borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.22em]" style={{ color: GREEN }}>
                  Compare
                </div>
                <h2
                  className="mt-5 font-bold"
                  style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
                >
                  Seven competitors. One table.
                </h2>
                <p className="mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: GRAY }}>
                  Permit expediters cover permits. Compliance tools cover documents. See how Cleard
                  lines up against all seven categories side by side.
                </p>
                <Link
                  to="/compare"
                  className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-[14px] no-underline"
                  style={{ background: GREEN, color: PAPER, fontWeight: 700 }}
                >
                  See the full comparison <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
              <div className="lg:col-span-6">
                <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }} className="p-6">
                  {[
                    ["Permitting administration", "Cleard only"],
                    ["Private plan review & inspections", "Cleard only"],
                    ["License + insurance compliance", "Cleard only"],
                    ["Lien rights", "Cleard only"],
                    ["Municipal department services", "Cleard only"],
                  ].map(([row, val]) => (
                    <div
                      key={row}
                      className="flex items-center justify-between gap-4 py-3 text-[13px]"
                      style={{ borderBottom: `1px solid ${CARD_BORDER}`, color: CARD_MUTED }}
                    >
                      <span>{row}</span>
                      <span style={{ color: TEAL, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                  <div className="pt-4 text-[11.5px]" style={{ color: CARD_MUTED }}>
                    Full 7-competitor matrix on the Compare page.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
