import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  Zap,
  BadgeCheck,
  MapPin,
  ListChecks,
} from "lucide-react";

import { MarketingShell } from "@/components/marketing-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleard — Permits shouldn't slow your projects down." },
      {
        name: "description",
        content:
          "Cleard gives Florida general contractors one intelligent platform to submit, track, and close permits across Florida — powered by Victoria, your AI permit assistant.",
      },
      { property: "og:title", content: "Cleard — Permits shouldn't slow your projects down." },
      {
        property: "og:description",
        content:
          "Cleard gives Florida general contractors one intelligent platform to submit, track, and close permits across Florida — powered by Victoria, your AI permit assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

/* ------------------------------ DESIGN TOKENS ----------------------------- */

const NEAR_BLACK = "#0D0D0B";
const CREAM = "#F0EDE8";
const WHITE = "#FFFFFF";
const BODY = "#C8C4BC";
const AMBER = "#C49A3C";
const DARK_RULE = "rgba(255,255,255,0.10)";
const CREAM_INK = "#1A1A17";
const CREAM_BODY = "#5C574F";
const CREAM_RULE = "rgba(26,26,23,0.12)";

const DISPLAY = "'Space Grotesk', 'Inter', system-ui, sans-serif";

function HomePage() {
  return (
    <MarketingShell>
      <div style={{ background: NEAR_BLACK }}>
        <Hero />
        <LogoBar />
        <HowClearedWorks />
        <PermitIntelligence />
        <MeetVictoria />
        <BetaCTA />
      </div>
    </MarketingShell>
  );
}

/* ---------------------------------- HERO ---------------------------------- */

function Hero() {
  return (
    <section style={{ background: NEAR_BLACK }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-28 pb-24 md:pt-44 md:pb-32 text-center">
        <div
          className="text-[11.5px] uppercase tracking-[0.22em]"
          style={{ color: AMBER, fontWeight: 500 }}
        >
          Now in private beta · FL general contractors only
        </div>

        <h1
          className="mx-auto mt-10 max-w-5xl"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(2.75rem, 7vw, 6rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            color: WHITE,
          }}
        >
          Permits shouldn&apos;t slow your <span style={{ color: AMBER }}>projects</span> down.
        </h1>

        <p
          className="mt-10 mx-auto max-w-3xl text-lg leading-relaxed"
          style={{ color: BODY }}
        >
          Cleard handles the permit pipeline — submissions, corrections, inspections, closeout — so
          your team stays on the job, not on hold.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold"
            style={{ background: AMBER, color: NEAR_BLACK }}
          >
            Get early access <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/process"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: WHITE }}
          >
            See a live demo
          </Link>
        </div>

        <p className="mt-8 text-[12px]" style={{ color: "rgba(200,196,188,0.65)" }}>
          No credit card · Free during beta · FL general contractors only
        </p>

        <div className="mt-24 md:mt-32 relative mx-auto" style={{ maxWidth: 1040 }}>
          <PortalMockup />
        </div>
      </div>
    </section>
  );
}

const MOCK_ROWS = [
  {
    permit: "CLR-2026-0212",
    addr: "14 Pelican Bay Ln, Naples",
    county: "Collier County",
    status: "Approved",
    days: 18,
  },
  {
    permit: "CLR-2026-0208",
    addr: "2840 SW 48th Ct, Miami",
    county: "Miami-Dade",
    status: "Corrections",
    days: 34,
  },
  {
    permit: "CLR-2026-0204",
    addr: "901 Harbour Ct, Jupiter",
    county: "Palm Beach",
    status: "In Review",
    days: 12,
  },
  {
    permit: "CLR-2026-0199",
    addr: "7720 NW 2nd Ave, Boca Raton",
    county: "Palm Beach",
    status: "Issued",
    days: 41,
  },
  {
    permit: "CLR-2026-0195",
    addr: "5612 SE Coconut Ter, Stuart",
    county: "Martin County",
    status: "Submitted",
    days: 5,
  },
];

const MOCK_NAV = ["My Permits", "Inspections", "Subcontractors", "Victoria", "Documents"];

function PortalMockup() {
  return (
    <div
      className="text-left relative overflow-hidden"
      style={{ background: "#111110", border: `1px solid ${DARK_RULE}` }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-4 px-4 py-3"
        style={{ background: "#171714", borderBottom: `1px solid ${DARK_RULE}` }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.22)" }} />
          <div className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.16)" }} />
          <div className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div
          className="flex-1 px-3 py-1 text-[11px]"
          style={{ border: `1px solid ${DARK_RULE}`, color: "rgba(200,196,188,0.6)" }}
        >
          app.cleard.io/permits
        </div>
      </div>

      <div className="grid grid-cols-[168px_1fr]">
        {/* Sidebar */}
        <div className="hidden sm:block p-3" style={{ borderRight: `1px solid ${DARK_RULE}` }}>
          {MOCK_NAV.map((n, i) => (
            <div
              key={n}
              className="px-3 py-2 text-[12px]"
              style={i === 0 ? { color: AMBER, fontWeight: 600 } : { color: "rgba(200,196,188,0.6)" }}
            >
              {n}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="min-w-0">
          <div
            className="flex items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: `1px solid ${DARK_RULE}` }}
          >
            <div className="text-[14px] font-semibold" style={{ color: WHITE }}>
              Active Permits
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-2.5 py-1.5 text-[11px]"
                style={{ border: `1px solid ${DARK_RULE}`, color: BODY }}
              >
                Filter
              </span>
              <span
                className="px-2.5 py-1.5 text-[11px] font-semibold"
                style={{ background: AMBER, color: NEAR_BLACK }}
              >
                + New permit
              </span>
            </div>
          </div>

          <div>
            {MOCK_ROWS.map((r) => (
              <div
                key={r.permit}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[130px_1fr_110px_100px_40px] items-center gap-3 px-5 py-3"
                style={{ borderBottom: `1px solid ${DARK_RULE}` }}
              >
                <div className="text-[11.5px] tabular-nums" style={{ color: AMBER }}>
                  {r.permit}
                </div>
                <div className="hidden sm:block truncate text-[12.5px]" style={{ color: WHITE }}>
                  {r.addr}
                </div>
                <div className="hidden sm:block text-[11.5px]" style={{ color: "rgba(200,196,188,0.6)" }}>
                  {r.county}
                </div>
                <div
                  className="flex justify-end sm:justify-start text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ color: BODY }}
                >
                  {r.status}
                </div>
                <div
                  className="hidden sm:block text-right text-[11.5px] tabular-nums"
                  style={{ color: "rgba(200,196,188,0.55)" }}
                >
                  {r.days}
                </div>
              </div>
            ))}
          </div>

          {/* Victoria alert bar */}
          <div className="flex items-start gap-3 px-5 py-4" style={{ background: "#171714" }}>
            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: AMBER }} />
            <p className="text-[12px] leading-relaxed" style={{ color: BODY }}>
              <strong style={{ color: WHITE }}>Victoria:</strong> CLR-2026-0208 has an active
              correction — Miami-Dade typically responds within 3 days. Deadline is Aug 6. I&apos;ll
              remind you Aug 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- LOGO BAR -------------------------------- */

const GC_NAMES = [
  "Coastal Builders",
  "Marquesa Construction",
  "Gulf Coast Custom Homes",
  "Atlantic Residential",
  "Sawgrass Developers",
];

function LogoBar() {
  return (
    <section style={{ background: NEAR_BLACK, borderTop: `1px solid ${DARK_RULE}` }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-12 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
        <div
          className="text-[11px] uppercase tracking-[0.22em] shrink-0"
          style={{ color: "rgba(200,196,188,0.55)" }}
        >
          Trusted by builders like
        </div>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          {GC_NAMES.map((n) => (
            <span key={n} className="text-[13.5px]" style={{ color: BODY }}>
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- HOW CLEARD WORKS ----------------------------- */

const WORK_FEATURES = [
  {
    icon: ClipboardList,
    title: "Smart permit intake",
    body: "Cleard runs a pre-check before you submit — flood zone, parcel data, wind speed, scope flags. Catch corrections before the reviewer does.",
  },
  {
    icon: CheckCircle2,
    title: "Inspection management",
    body: "Schedule, log, and track every inspection in one view. When something fails, Cleard triggers a correction workflow automatically.",
  },
  {
    icon: Zap,
    title: "Victoria",
    body: "Your AI permit advisor. Victoria monitors every active permit, alerts you to deadlines, and predicts how long each municipality will take.",
  },
  {
    icon: BadgeCheck,
    title: "Sub compliance",
    body: "Every subcontractor's COI, license, and permit status tracked in one place. Expired COI? Cleard blocks site access automatically.",
  },
  {
    icon: MapPin,
    title: "Municipality email parsing",
    body: "Cleard reads your municipality emails and updates permit status automatically. No more scanning inboxes for correction notices.",
  },
  {
    icon: ListChecks,
    title: "GC portal for owners",
    body: "Give homeowners a live window into their project's permit status. No calls, no updates to write — it's automatic.",
  },
];

function HowClearedWorks() {
  return (
    <section style={{ background: CREAM }}>
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-28 md:py-36">
        <div
          className="text-[11.5px] uppercase tracking-[0.22em]"
          style={{ color: AMBER, fontWeight: 500 }}
        >
          How Cleard works
        </div>

        <h2
          className="mt-8 max-w-3xl"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: CREAM_INK,
          }}
        >
          One place for every permit, start to finish.
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed" style={{ color: CREAM_BODY }}>
          From intake through inspection to CO — Cleard tracks every move and tells you what&apos;s
          next before you have to ask.
        </p>

        <div className="mt-20 grid gap-y-16 gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {WORK_FEATURES.map((f) => (
            <div key={f.title}>
              <f.icon className="h-5 w-5" strokeWidth={1.5} style={{ color: AMBER }} />
              <h3
                className="mt-6 text-[18px] font-semibold tracking-[-0.015em]"
                style={{ color: CREAM_INK }}
              >
                {f.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed" style={{ color: CREAM_BODY }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- PERMIT INTELLIGENCE -------------------------- */

const INTEL_STATS = [
  { pre: "", num: "95", suf: "+", label: "Municipalities covered" },
  { pre: "~", num: "18", suf: "", label: "Days avg permit approval" },
  { pre: "", num: "0", suf: "", label: "Missed deadlines on Cleard" },
  { pre: "", num: "3", suf: "x", label: "Faster correction response" },
];

function PermitIntelligence() {
  return (
    <section style={{ background: NEAR_BLACK }}>
      <div className="mx-auto max-w-5xl px-6 lg:px-10 py-28 md:py-36 text-center">
        <div
          className="text-[11.5px] uppercase tracking-[0.22em]"
          style={{ color: AMBER, fontWeight: 500 }}
        >
          Permit intelligence
        </div>
        <h2
          className="mt-8"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: WHITE,
          }}
        >
          Built on real permit data.
        </h2>
        <p className="mt-6 mx-auto max-w-2xl text-base leading-relaxed" style={{ color: BODY }}>
          Every permit Cleard processes trains Victoria to predict timelines, flag corrections, and
          route submissions faster.
        </p>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-12">
          {INTEL_STATS.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: "clamp(2.1rem, 5vw, 3.25rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.035em",
                  color: WHITE,
                }}
              >
                {s.pre && <span style={{ color: AMBER }}>{s.pre}</span>}
                {s.num}
                {s.suf && <span style={{ color: AMBER }}>{s.suf}</span>}
              </div>
              <div
                className="mt-4 text-[11.5px] uppercase tracking-[0.18em]"
                style={{ color: "rgba(200,196,188,0.6)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ MEET VICTORIA ----------------------------- */

function MeetVictoria() {
  return (
    <section style={{ background: NEAR_BLACK, borderTop: `1px solid ${DARK_RULE}` }}>
      <div className="mx-auto px-6 lg:px-10 py-28 md:py-36" style={{ maxWidth: 1100 }}>
        <div className="grid gap-16 md:grid-cols-2 md:items-center">
          <div>
            <div
              className="text-[11.5px] uppercase tracking-[0.22em]"
              style={{ color: AMBER, fontWeight: 500 }}
            >
              Meet Victoria
            </div>
            <h2
              className="mt-8"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: "clamp(2rem, 4.2vw, 3.25rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.035em",
                color: WHITE,
              }}
            >
              Your AI permit advisor, always on.
            </h2>
            <p className="mt-6 text-base leading-relaxed" style={{ color: BODY }}>
              Victoria monitors every active permit, reads municipality emails, and tells you what
              to do next — before a deadline slips.
            </p>
            <Link
              to="/ask-victoria"
              className="mt-10 inline-flex items-center gap-2 px-7 py-4 text-sm font-semibold"
              style={{ background: AMBER, color: NEAR_BLACK }}
            >
              See Victoria in action <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden" style={{ border: `1px solid ${DARK_RULE}` }}>
            <div
              className="flex items-center gap-3 px-6 py-5"
              style={{ borderBottom: `1px solid ${DARK_RULE}` }}
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.5} style={{ color: AMBER }} />
              <div>
                <div className="text-[13.5px] font-semibold" style={{ color: WHITE }}>
                  Victoria
                </div>
                <div className="text-[11px]" style={{ color: "rgba(200,196,188,0.6)" }}>
                  Cleard AI · Permit Intelligence
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <VictoriaMessage
                tag="Correction due Aug 6"
                title="CLR-2026-0208 — 2840 SW 48th Ct, Miami"
                body="Miami-Dade flagged a missing NOC. I've drafted the corrected NOC — review and re-submit. Based on 14 prior Miami-Dade submissions, expect 3 days to re-review."
              />
              <VictoriaMessage
                tag="On track"
                title="CLR-2026-0204 — 901 Harbour Ct, Jupiter"
                body="Palm Beach is on day 12 of review. Their median is 14 days — you're right on pace. No action needed."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VictoriaMessage({
  tag,
  title,
  body,
}: {
  tag: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.2em]" style={{ color: AMBER }}>
        {tag}
      </div>
      <div className="mt-3 text-[13.5px] font-semibold" style={{ color: WHITE }}>
        {title}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed" style={{ color: BODY }}>
        {body}
      </p>
    </div>
  );
}

/* ------------------------------- BETA CTA -------------------------------- */

function BetaCTA() {
  return (
    <section style={{ background: NEAR_BLACK, borderTop: `1px solid ${DARK_RULE}` }}>
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-28 md:py-36 text-center">
        <div
          className="text-[11.5px] uppercase tracking-[0.22em]"
          style={{ color: AMBER, fontWeight: 500 }}
        >
          Private beta
        </div>
        <h2
          className="mt-8"
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: WHITE,
          }}
        >
          Get Cleard before your competitors do.
        </h2>
        <p className="mt-6 mx-auto max-w-xl text-base leading-relaxed" style={{ color: BODY }}>
          We&apos;re onboarding general contractors now. Early access is free and includes direct
          access to the Cleard team.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold"
            style={{ background: AMBER, color: NEAR_BLACK }}
          >
            Request early access <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium"
            style={{ color: WHITE, border: "1px solid rgba(255,255,255,0.45)" }}
          >
            Talk to the team
          </Link>
        </div>
      </div>
    </section>
  );
}
