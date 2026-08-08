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

const INK = "#0F1E2E";
const MUTED = "#5B6B7C";
const GREEN = "#16A34A";
const BLUE = "#1B84D4";
const HAIRLINE = "#E8ECF1";

function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <LogoBar />
      <HowClearedWorks />
      <PermitIntelligence />
      <MeetVictoria />
      <BetaCTA />
    </MarketingShell>
  );
}

/* ---------------------------------- HERO ---------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#FAFAF8" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 40% at 50% -5%, color-mix(in oklab, #1B84D4 12%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-0 md:pt-36 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium tracking-[0.06em] uppercase mb-8"
          style={{
            background: "#F2EEE8",
            color: INK,
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: GREEN }} />
          Now in private beta
        </div>

        <h1
          className="mx-auto max-w-4xl"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.5rem, 6.5vw, 5.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: INK,
          }}
        >
          Permits shouldn&apos;t slow your{" "}
          <em className="italic" style={{ color: BLUE }}>
            projects
          </em>{" "}
          down.
        </h1>

        <p className="mt-7 mx-auto max-w-2xl text-lg leading-relaxed" style={{ color: MUTED }}>
          Cleard handles the permit pipeline — submissions, corrections, inspections, closeout — so
          your team stays on the job, not on hold.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-white"
            style={{
              background: GREEN,
              boxShadow: "0 1px 3px color-mix(in oklab, #16A34A 40%, transparent)",
            }}
          >
            Get early access <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/process"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
            style={{ color: INK, border: `1px solid ${HAIRLINE}` }}
          >
            See a live demo
          </Link>
        </div>

        <p className="mt-4 text-[12px]" style={{ color: MUTED }}>
          No credit card · Free during beta · FL general contractors only
        </p>

        <div className="mt-20 md:mt-24 relative mx-auto" style={{ maxWidth: 1000 }}>
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
    tone: "green" as const,
    days: 18,
  },
  {
    permit: "CLR-2026-0208",
    addr: "2840 SW 48th Ct, Miami",
    county: "Miami-Dade",
    status: "Corrections",
    tone: "amber" as const,
    days: 34,
  },
  {
    permit: "CLR-2026-0204",
    addr: "901 Harbour Ct, Jupiter",
    county: "Palm Beach",
    status: "In Review",
    tone: "blue" as const,
    days: 12,
  },
  {
    permit: "CLR-2026-0199",
    addr: "7720 NW 2nd Ave, Boca Raton",
    county: "Palm Beach",
    status: "Issued",
    tone: "green" as const,
    days: 41,
  },
  {
    permit: "CLR-2026-0195",
    addr: "5612 SE Coconut Ter, Stuart",
    county: "Martin County",
    status: "Submitted",
    tone: "slate" as const,
    days: 5,
  },
];

const MOCK_NAV = ["My Permits", "Inspections", "Subcontractors", "Victoria", "Documents"];

function PortalMockup() {
  return (
    <div
      className="rounded-t-2xl border border-b-0 text-left relative overflow-hidden"
      style={{
        background: "#FFFFFF",
        borderColor: HAIRLINE,
        boxShadow: "0 -1px 2px rgba(15,30,46,0.03), 0 30px 60px -30px rgba(15,30,46,0.25)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center gap-4 px-4 py-3 border-b"
        style={{ background: "#F2EEE8", borderColor: HAIRLINE }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
        </div>
        <div
          className="flex-1 rounded-md px-3 py-1 text-[11px]"
          style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}`, color: "#7890A4" }}
        >
          app.cleard.io/permits
        </div>
      </div>

      <div className="grid grid-cols-[168px_1fr]">
        {/* Sidebar */}
        <div
          className="hidden sm:block border-r p-3"
          style={{ background: "#FAFAF8", borderColor: HAIRLINE }}
        >
          {MOCK_NAV.map((n, i) => (
            <div
              key={n}
              className="rounded-md px-3 py-2 text-[12px] font-medium"
              style={
                i === 0
                  ? { background: "color-mix(in oklab, #16A34A 12%, transparent)", color: "#15803D" }
                  : { color: MUTED }
              }
            >
              {n}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="min-w-0">
          <div
            className="flex items-center justify-between gap-3 px-5 py-4 border-b"
            style={{ borderColor: HAIRLINE }}
          >
            <div className="text-[14px] font-semibold" style={{ color: INK }}>
              Active Permits
            </div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2.5 py-1.5 text-[11px] font-medium"
                style={{ border: `1px solid ${HAIRLINE}`, color: MUTED }}
              >
                Filter
              </span>
              <span
                className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-white"
                style={{ background: GREEN }}
              >
                + New permit
              </span>
            </div>
          </div>

          <div>
            {MOCK_ROWS.map((r) => (
              <div
                key={r.permit}
                className="grid grid-cols-[1fr_auto] sm:grid-cols-[130px_1fr_110px_100px_40px] items-center gap-3 px-5 py-3 border-b"
                style={{ borderColor: HAIRLINE }}
              >
                <div className="text-[11.5px] tabular-nums font-medium" style={{ color: BLUE }}>
                  {r.permit}
                </div>
                <div className="hidden sm:block truncate text-[12.5px]" style={{ color: INK }}>
                  {r.addr}
                </div>
                <div className="hidden sm:block text-[11.5px]" style={{ color: MUTED }}>
                  {r.county}
                </div>
                <div className="flex justify-end sm:justify-start">
                  <StatusPill tone={r.tone}>{r.status}</StatusPill>
                </div>
                <div
                  className="hidden sm:block text-right text-[11.5px] tabular-nums"
                  style={{ color: MUTED }}
                >
                  {r.days}
                </div>
              </div>
            ))}
          </div>

          {/* Victoria alert bar */}
          <div
            className="flex items-start gap-3 px-5 py-3.5"
            style={{ background: "linear-gradient(135deg, #0C1B2B 0%, #071018 100%)" }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "#7CC7F5" }} />
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
              <strong style={{ color: "#FFFFFF" }}>Victoria:</strong> CLR-2026-0208 has an active
              correction — Miami-Dade typically responds within 3 days. Deadline is Aug 6. I&apos;ll
              remind you Aug 4.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "blue" | "green" | "amber" | "slate";
  children: React.ReactNode;
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    blue: { bg: "color-mix(in oklab, #1B84D4 12%, transparent)", fg: "#1268AC" },
    green: { bg: "color-mix(in oklab, #16A34A 12%, transparent)", fg: "#15803D" },
    amber: { bg: "color-mix(in oklab, #E8861A 14%, transparent)", fg: "#C4720F" },
    slate: { bg: "color-mix(in oklab, #6B8299 12%, transparent)", fg: "#4A6278" },
  };
  const s = map[tone];
  return (
    <span
      className="text-[10.5px] uppercase tracking-[0.12em] px-2 py-1 rounded-md font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
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
    <section style={{ background: "#FFFFFF", borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-8 flex flex-col md:flex-row md:items-center gap-5 md:gap-10">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.18em] shrink-0"
          style={{ color: "#8A9AAA" }}
        >
          Trusted by builders like
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {GC_NAMES.map((n) => (
            <span
              key={n}
              className="text-[13.5px] font-medium opacity-70"
              style={{ color: "#7890A4" }}
            >
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
    tint: "#EFF6FF",
    fg: "#2563EB",
    title: "Smart permit intake",
    body: "Cleard runs a pre-check before you submit — flood zone, parcel data, wind speed, scope flags. Catch corrections before the reviewer does.",
  },
  {
    icon: CheckCircle2,
    tint: "#ECFDF5",
    fg: "#16A34A",
    title: "Inspection management",
    body: "Schedule, log, and track every inspection in one view. When something fails, Cleard triggers a correction workflow automatically.",
  },
  {
    icon: Zap,
    tint: "#FEF9C3",
    fg: "#CA8A04",
    title: "Victoria",
    body: "Your AI permit advisor. Victoria monitors every active permit, alerts you to deadlines, and predicts how long each municipality will take.",
  },
  {
    icon: BadgeCheck,
    tint: "#FFF1E7",
    fg: "#EA580C",
    title: "Sub compliance",
    body: "Every subcontractor's COI, license, and permit status tracked in one place. Expired COI? Cleard blocks site access automatically.",
  },
  {
    icon: MapPin,
    tint: "#ECFDF5",
    fg: "#16A34A",
    title: "Municipality email parsing",
    body: "Cleard reads your municipality emails and updates permit status automatically. No more scanning inboxes for correction notices.",
  },
  {
    icon: ListChecks,
    tint: "#FEF9C3",
    fg: "#CA8A04",
    title: "GC portal for owners",
    body: "Give homeowners a live window into their project's permit status. No calls, no updates to write — it's automatic.",
  },
];

function HowClearedWorks() {
  return (
    <section style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-24 md:py-28">
        <div
          className="text-center text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: GREEN }}
        >
          How Cleard works
        </div>

        <h2
          className="mt-6 max-w-3xl"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4.4vw, 3.25rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: INK,
          }}
        >
          One place for every permit, start to finish.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: MUTED }}>
          From intake through inspection to CO — Cleard tracks every move and tells you what&apos;s
          next before you have to ask.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WORK_FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${HAIRLINE}`,
                boxShadow: "0 1px 2px rgba(15,30,46,0.04), 0 8px 24px -16px rgba(15,30,46,0.12)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                style={{ background: f.tint, color: f.fg }}
              >
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3
                className="mt-5 text-[17px] font-semibold tracking-[-0.01em]"
                style={{ color: INK }}
              >
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
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
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0C1B2B 0%, #071018 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 50% 60% at 20% 0%, color-mix(in oklab, #1B84D4 22%, transparent) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 85% 100%, color-mix(in oklab, #16A34A 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 lg:px-10 py-24 md:py-28 text-center">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#7CC7F5" }}
        >
          Permit intelligence
        </div>
        <h2
          className="mt-6"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4.4vw, 3.25rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: "#FFFFFF",
          }}
        >
          Built on real permit data.
        </h2>
        <p
          className="mt-5 mx-auto max-w-2xl text-base leading-relaxed"
          style={{ color: "rgba(255,255,255,0.68)" }}
        >
          Every permit Cleard processes trains Victoria to predict timelines, flag corrections, and
          route submissions faster.
        </p>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-10">
          {INTEL_STATS.map((s) => (
            <div key={s.label}>
              <div
                className="font-bold"
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: "#FFFFFF",
                }}
              >
                {s.pre && <span style={{ color: "#4ADE80" }}>{s.pre}</span>}
                {s.num}
                {s.suf && <span style={{ color: "#4ADE80" }}>{s.suf}</span>}
              </div>
              <div
                className="mt-3 text-[11.5px] uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.55)" }}
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
    <section style={{ background: "#FAFAF8" }}>
      <div className="mx-auto px-6 lg:px-10 py-24 md:py-28" style={{ maxWidth: 1100 }}>
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: BLUE }}
            >
              Meet Victoria
            </div>
            <h2
              className="mt-6"
              style={{
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.9rem, 4vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: INK,
              }}
            >
              Your AI permit advisor, always on.
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
              Victoria monitors every active permit, reads municipality emails, and tells you what
              to do next — before a deadline slips.
            </p>
            <Link
              to="/ask-victoria"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: BLUE }}
            >
              See Victoria in action <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div
            className="overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #071018 0%, #0C1B2B 100%)",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 30px 60px -30px rgba(7,16,24,0.5)",
            }}
          >
            <div
              className="flex items-center gap-3 px-6 py-5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg, #1B84D4 0%, #16A34A 100%)" }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold" style={{ color: "#FFFFFF" }}>
                  Victoria
                </div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Cleard AI · Permit Intelligence
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <VictoriaMessage
                tag="Correction due Aug 6"
                tagTone="amber"
                title="CLR-2026-0208 — 2840 SW 48th Ct, Miami"
                body="Miami-Dade flagged a missing NOC. I've drafted the corrected NOC — review and re-submit. Based on 14 prior Miami-Dade submissions, expect 3 days to re-review."
              />
              <VictoriaMessage
                tag="On track"
                tagTone="green"
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
  tagTone,
  title,
  body,
}: {
  tag: string;
  tagTone: "amber" | "green";
  title: string;
  body: string;
}) {
  const tone =
    tagTone === "amber"
      ? { bg: "rgba(232,134,26,0.16)", fg: "#F0B267" }
      : { bg: "rgba(22,163,74,0.16)", fg: "#4ADE80" };
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.1em]"
        style={{ background: tone.bg, color: tone.fg }}
      >
        {tagTone === "amber" ? "⚠" : "✓"} {tag}
      </span>
      <div className="mt-3 text-[13.5px] font-semibold" style={{ color: "#FFFFFF" }}>
        {title}
      </div>
      <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>
        {body}
      </p>
    </div>
  );
}

/* ------------------------------- BETA CTA -------------------------------- */

function BetaCTA() {
  return (
    <section
      style={{
        background: "#F2EEE8",
        borderTop: `1px solid ${HAIRLINE}`,
        borderBottom: `1px solid ${HAIRLINE}`,
      }}
    >
      <div className="mx-auto max-w-3xl px-6 lg:px-10 py-24 md:py-28 text-center">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: BLUE }}
        >
          Private beta
        </div>
        <h2
          className="mt-6"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4.4vw, 3.25rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: INK,
          }}
        >
          Get Cleard before your competitors do.
        </h2>
        <p className="mt-5 mx-auto max-w-xl text-base leading-relaxed" style={{ color: MUTED }}>
          We&apos;re onboarding general contractors now. Early access is free and includes direct
          access to the Cleard team.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: GREEN }}
          >
            Request early access <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold"
            style={{ color: INK, border: `1px solid ${HAIRLINE}`, background: "#FFFFFF" }}
          >
            Talk to the team
          </Link>
        </div>
      </div>
    </section>
  );
}
