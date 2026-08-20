import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bot,
  Building2,
  ClipboardList,
  FileSearch,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/trades/general-contractors")({
  head: () => ({
    meta: [
      { title: "Cleard for General Contractors — Permitting Back Office" },
      {
        name: "description",
        content:
          "Permitting, plan review, inspections, lien rights, license and insurance compliance for general contractors — one back office for every jurisdiction you build in.",
      },
      { property: "og:title", content: "Your back office. Every jurisdiction you build in." },
      {
        property: "og:description",
        content:
          "Cleard runs permitting, plan review, inspections, lien rights, and compliance so your PMs and supers can run the job.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GeneralContractorsPage,
});

const INK = "#2F4F4F";
const GRAY = "#7A5C68";
const LIGHT = "#8B9A97";
const GREEN = "#2F4F4F";
const TEAL = "#673147";
const BORDER = "#E0D3BC";
const OFF = "#F3EAD9";
const PAPER = "#FAF3E6";

const PAINS = [
  "Permit delays pushing starts, pours, and roughs off schedule",
  "Correction cycles turning one permit into three more weeks of waiting",
  "Chasing sub licenses and expired COIs before every pull",
  "Lien deadlines falling through the cracks on multi-phase projects",
  "Inspection timing forcing crews to sit on site",
];

const SERVICES = [
  {
    icon: ClipboardList,
    name: "Permit Administration",
    body: "We prepare, submit, and track every permit application. Coordinate corrections and manage the process through to issuance. You get status updates — not phone calls to make.",
  },
  {
    icon: FileSearch,
    name: "Private Plan Review & Inspections",
    body: "Licensed professionals review plans and conduct inspections under applicable private provider statutes. Faster than the public queue. Results same day or next business day.",
  },
  {
    icon: Scale,
    name: "Lien Rights Management",
    body: "Preliminary notices, lien deadlines, and waivers tracked per project. Never miss a filing window on a multi-phase job.",
  },
  {
    icon: ShieldCheck,
    name: "License & Insurance Compliance",
    body: "Every sub's license and COI verified before they set foot on site. Expiration alerts at 90/60/30 days. You don't chase paper — we do.",
  },
  {
    icon: Building2,
    name: "Building Department Access",
    body: "One login to every jurisdiction you build in. Permit status, document history, and department contacts in one place.",
  },
  {
    icon: Bot,
    name: "Victoria AI",
    body: "Ask Victoria any permitting question — code lookups, checklist validation, jurisdiction-specific requirements — and get an answer in seconds, not a phone call.",
  },
];

const STATS = [
  {
    value: "6–8",
    body: "Tools the average GC uses to manage permits, insurance, and lien rights. Cleard replaces all of them.",
  },
  {
    value: "$50B+",
    body: "In permit fees processed annually in the US. Most still run on paper and email.",
  },
  {
    value: "1 login",
    body: "For every jurisdiction, every trade, every sub. One back office for your entire operation.",
  },
];

function GeneralContractorsPage() {
  return (
    <MarketingShell>
      <div style={{ background: PAPER, color: INK }}>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-16 md:pt-28">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div
                className="text-[10.5px] uppercase tracking-[0.22em]"
                style={{ color: GREEN, fontWeight: 700 }}
              >
                General Contractors
              </div>
              <h1
                className="mt-6 max-w-2xl"
                style={{
                  fontWeight: 800,
                  fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.04em",
                }}
              >
                Your back office. Every jurisdiction you build in.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
                Cleard handles permitting, plan review, inspections, lien rights, license
                compliance, and insurance — so your PMs and supers can run the job, not the
                paperwork.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/join"
                  hash="request"
                  className="inline-flex items-center px-5 py-3 text-[14px] no-underline"
                  style={{ background: GREEN, color: PAPER, fontWeight: 700 }}
                >
                  Get early access
                </Link>
                <Link
                  to="/product"
                  className="inline-flex items-center px-5 py-3 text-[14px] no-underline"
                  style={{ background: PAPER, color: INK, border: `1px solid ${BORDER}`, fontWeight: 600 }}
                >
                  See how it works
                </Link>
              </div>
            </div>

            {/* Pain points */}
            <div className="p-7" style={{ background: OFF, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4" style={{ color: TEAL }} />
                <div
                  className="text-[13px] uppercase tracking-[0.16em]"
                  style={{ color: INK, fontWeight: 700 }}
                >
                  What's slowing your jobs down
                </div>
              </div>
              <ul className="mt-6 space-y-4">
                {PAINS.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0"
                      style={{ background: TEAL }}
                      aria-hidden
                    />
                    <span className="text-[14.5px] leading-snug" style={{ color: INK }}>
                      {p}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Services */}
        <section style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
            <h2
              className="max-w-3xl"
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Everything your permit coordinator does. And everything they don't.
            </h2>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {SERVICES.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.name}
                    className="flex flex-col p-7"
                    style={{ border: `1px solid ${BORDER}` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: GREEN }} />
                    <div
                      className="mt-5 text-[13px] uppercase tracking-[0.16em]"
                      style={{ color: INK, fontWeight: 700 }}
                    >
                      {s.name}
                    </div>
                    <p className="mt-4 text-[14px] leading-relaxed" style={{ color: GRAY }}>
                      {s.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Cleard */}
        <section style={{ borderTop: `1px solid ${BORDER}`, background: OFF }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20">
            <h2
              className="max-w-3xl"
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Built for contractors running multiple projects across multiple jurisdictions
            </h2>

            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.value} style={{ borderTop: `1px solid ${BORDER}` }} className="pt-6">
                  <div
                    style={{
                      color: GREEN,
                      fontWeight: 800,
                      fontSize: "clamp(2.25rem, 4vw, 3rem)",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: GRAY }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 text-center">
            <h2
              className="mx-auto max-w-2xl"
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              Ready to run a cleaner back office?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: LIGHT }}>
              Join contractors already using Cleard to keep jobs moving.
            </p>
            <Link
              to="/join"
              hash="request"
              className="mt-9 inline-flex items-center px-6 py-3.5 text-[14px] no-underline"
              style={{ background: GREEN, color: PAPER, fontWeight: 700 }}
            >
              Get early access
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
