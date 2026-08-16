import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-shell";

/* Homepage-matching brand tokens */
const OBSIDIAN = "#111110";
const MUTED = "#6B6860";
const HAIRLINE = "#E4E2DE";
const TEAL = "#00B4A8";
import {
  FileStack,
  ShieldCheck,
  BadgeCheck,
  FileCheck2,
  Scale,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AppFrame,
  CoiCheckMock,
  InspectionCalendarMock,
  KanbanMock,
  LicenseDashMock,
  LienDocsMock,
} from "@/components/marketing-mockups";

const PRODUCT_VISUALS: Record<string, { path: string; nav: string; node: React.ReactNode }> = {
  "Permitting Administration": {
    path: "app.cleard.io/permits",
    nav: "Permits",
    node: <KanbanMock />,
  },
  "Private Plan Review & Inspections": {
    path: "app.cleard.io/inspections",
    nav: "Inspections",
    node: <InspectionCalendarMock />,
  },
  "Contractor License Management": {
    path: "app.cleard.io/licenses",
    nav: "Licenses",
    node: <LicenseDashMock />,
  },
  "Insurance Compliance": {
    path: "app.cleard.io/insurance",
    nav: "Insurance",
    node: <CoiCheckMock />,
  },
  "Lien Rights": {
    path: "app.cleard.io/lien-rights",
    nav: "Lien Rights",
    node: <LienDocsMock />,
  },
};

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Cleard" },
      {
        name: "description",
        content:
          "Permitting administration, private plan review and inspections, contractor license management, insurance compliance, and lien rights — built for licensed contractors.",
      },
      { property: "og:title", content: "Every tool your operation needs." },
      {
        property: "og:description",
        content:
          "Five services. One platform. Permitting, private plan review, license management, insurance compliance, and lien rights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Product = {
  name: string;
  tagline: string;
  bullets: string[];
  Icon: LucideIcon;
};

const PRODUCTS: Product[] = [
  {
    name: "Permitting Administration",
    tagline:
      "Full-service permit management — application, submission, tracking, corrections, and certificate of occupancy, handled end to end.",
    bullets: [
      "Application prep and jurisdiction submittal",
      "Smart document checklists per jurisdiction",
      "Correction responses and resubmittals",
      "Real-time status tracking through certificate of occupancy",
      "Supports every trade: pool/spa, roofing, electrical, plumbing, HVAC, general/residential, foundation, and commercial",
    ],
    Icon: FileStack,
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
  },
  {
    name: "Contractor License Management",
    tagline:
      "License verification, renewal tracking, CE hour monitoring, and qualifying agent oversight — all in one dashboard.",
    bullets: [
      "Live license status for your company and every sub",
      "Renewal alerts at 90/60/30 days",
      "Continuing education hour tracking with course directory",
      "Qualifying agent monitoring and change-of-status support",
    ],
    Icon: BadgeCheck,
  },
  {
    name: "Insurance Compliance",
    tagline:
      "Certificate of insurance collection, coverage validation, expiration tracking, and automated follow-up for your entire subcontractor roster.",
    bullets: [
      "COI requests with required coverage specs per trade",
      "Vendor portal — a unique link for every sub",
      "Coverage validation: types, limits, additional insured",
      "Automated follow-up reminders at day 3, 7, and 14",
      "Expiration alerts at 90/60/30 days",
    ],
    Icon: FileCheck2,
  },
  {
    name: "Lien Rights",
    tagline:
      "Notice of Commencement, Preliminary Notices, Lien Waivers, and statutory deadline tracking — generated, signed, and recorded without leaving the platform.",
    bullets: [
      "Notice of Commencement prep, signature, and recording",
      "Preliminary Notices and Notices to Owner",
      "Conditional and unconditional lien waivers",
      "Statutory deadline tracking with countdown alerts",
      "County e-recording requests from inside the platform",
    ],
    Icon: Scale,
  },
];

function ProductsPage() {
  return (
    <PublicShell>
      {/* HERO */}
      <section className="px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-8"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            What's Inside Cleard
          </div>
          <h1
            className="font-bold leading-[1.02] mb-8 max-w-3xl"
            style={{ color: OBSIDIAN, fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            Every tool your operation needs.
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: MUTED, lineHeight: 1.55 }}>
            Five services. One platform. Built for licensed contractors — pool, roofing,
            electrical, plumbing, HVAC, general, foundation, and commercial.
          </p>
        </div>
      </section>

      {/* PRODUCT SECTIONS */}
      <div>
        {PRODUCTS.map((p, idx) => {
          const i = idx + 1;
          const reverse = i % 2 === 1;
          const stripe = i % 2 === 1;
          return (
            <section
              key={p.name}
              className="px-6 lg:px-10 py-24 lg:py-32"
              style={{
                backgroundColor: stripe ? "#fafafa" : "#ffffff",
                borderTop: `1px solid ${HAIRLINE}`,
              }}
            >
              <div
                className={`max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Copy */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center"
                      style={{ background: OBSIDIAN }}
                    >
                      <p.Icon size={18} strokeWidth={1.5} style={{ color: TEAL }} />
                    </span>
                    <div
                      className="font-mono text-[10px] uppercase"
                      style={{ color: MUTED, letterSpacing: "0.22em" }}
                    >
                      {String(i).padStart(2, "0")} · Service
                    </div>
                  </div>
                  <h3
                    className="font-bold leading-[1.05] mb-6"
                    style={{
                      color: OBSIDIAN,
                      fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {p.name}
                  </h3>
                  <p className="text-lg mb-8" style={{ color: MUTED, lineHeight: 1.55 }}>
                    {p.tagline}
                  </p>
                  <ul className="space-y-4">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span
                          className="mt-2 w-1.5 h-1.5 shrink-0"
                          style={{ backgroundColor: OBSIDIAN }}
                        />
                        <span className="text-[15px]" style={{ color: OBSIDIAN, lineHeight: 1.55 }}>
                          {b}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual — live product mockup */}
                <div className="relative">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-8"
                    style={{
                      background:
                        "radial-gradient(55% 50% at 50% 45%, rgba(0,180,168,0.16) 0%, transparent 70%)",
                    }}
                  />
                  <div className="relative">
                    <AppFrame
                      path={PRODUCT_VISUALS[p.name]?.path ?? "app.cleard.io"}
                      active={PRODUCT_VISUALS[p.name]?.nav ?? "Permits"}
                    >
                      {PRODUCT_VISUALS[p.name]?.node ?? <KanbanMock />}
                    </AppFrame>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>


      {/* VICTORIA — platform intelligence layer, not a service */}
      <section
        className="px-6 lg:px-10 py-20"
        style={{ background: "#F5F4F0", borderTop: `1px solid ${HAIRLINE}` }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Sparkles size={16} strokeWidth={1.75} style={{ color: TEAL }} />
            <span
              className="font-mono text-[10px] uppercase"
              style={{ color: OBSIDIAN, letterSpacing: "0.28em" }}
            >
              Platform intelligence
            </span>
          </div>
          <h2
            className="font-bold mt-6 mb-6"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            Powered by Victoria
          </h2>
          <p className="text-lg" style={{ color: MUTED, lineHeight: 1.55 }}>
            Every service on this platform is backed by Victoria — Cleard&apos;s AI engine. She
            answers jurisdiction questions, flags missing documents, routes correction responses, and
            surfaces compliance risks before they become delays. You don&apos;t buy Victoria. She
            comes with Cleard.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-10 py-24" style={{ backgroundColor: OBSIDIAN }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-bold leading-[1.05] mb-6"
            style={{ color: "#fff", fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            One platform. Your entire back office.
          </h2>
          <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.7)" }}>
            See how Cleard runs permitting, private plan review, licensing, insurance compliance, and lien rights for your operation.
          </p>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-8 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: TEAL, color: OBSIDIAN, borderRadius: 0 }}
          >
            Get early access
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
