import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Sparkles,
  FileCheck,
  ShieldCheck,
  Bell,
  Building2,
  FileSignature,
  LayoutGrid,
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

function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <HowClearedWorks />
      <VictoriaIntro />
      <TrustStrip />
      <BuildersCTA />
    </MarketingShell>
  );
}

/* ---------------------------------- HERO ---------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#FAFAF8" }}>
      {/* Subtle light grain */}
      <div className="absolute inset-0 md-grain opacity-40" />
      {/* Soft brand glow at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 40% at 50% -5%, color-mix(in oklab, #1B84D4 12%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pt-24 pb-20 md:pt-36 md:pb-28 text-center">
        {/* Eyebrow pill */}
        <div
          className="md-in md-in-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium tracking-[0.06em] uppercase mb-8"
          style={{
            background: "color-mix(in oklab, #12A05C 12%, transparent)",
            color: "#12A05C",
            border: "1px solid color-mix(in oklab, #12A05C 30%, transparent)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#12A05C] inline-block" />
          Now in private beta · Florida GCs
        </div>

        {/* Headline — bold geometric sans */}
        <h1
          className="md-in md-in-2 mx-auto max-w-4xl"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.5rem, 6.5vw, 5.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--ink, #0F1E2E)",
          }}
        >
          Permits shouldn't slow your{" "}
          <span style={{ color: "#1B84D4" }}>projects</span> down.
        </h1>

        {/* Subline */}
        <p
          className="md-in md-in-3 mt-7 mx-auto max-w-xl text-lg leading-relaxed"
          style={{ color: "var(--md-muted, #6B8299)" }}
        >
          Cleard gives Florida general contractors one intelligent platform to
          submit, track, and close permits — powered by Victoria, your AI
          assistant.
        </p>

        {/* CTAs */}
        <div className="md-in md-in-4 mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{
              background: "#12A05C",
              boxShadow: "0 1px 3px color-mix(in oklab, #12A05C 40%, transparent)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0D8049")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#12A05C")}
          >
            Get early access <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/process"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold transition-all"
            style={{ color: "var(--ink, #0F1E2E)", border: "1px solid var(--md-hairline, #E2E8F0)" }}
          >
            See a live demo
          </Link>
        </div>

        {/* Trust line */}
        <p className="md-in md-in-4 mt-4 text-[12px]" style={{ color: "var(--md-muted, #6B8299)" }}>
          No credit card · Free during beta · FL general contractors only
        </p>

        {/* App frame mockup */}
        <div className="md-in md-in-4 mt-20 md:mt-24 relative mx-auto max-w-5xl">
          <div
            className="absolute -inset-8 rounded-3xl blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at center, #1B84D4 0%, transparent 65%)",
            }}
          />
          <PortalMockup />
        </div>
      </div>
    </section>
  );
}

function PortalMockup() {
  const rows = [
    { addr: "412 Ocean Dr, Delray Beach", status: "In Review", tone: "blue" as const },
    { addr: "88 Banyan Way, Palm Beach", status: "Approved", tone: "green" as const },
    { addr: "1120 Coral Cay, Jupiter", status: "Corrections", tone: "amber" as const },
    { addr: "27 Bayside Rd, Stuart", status: "Submitted", tone: "slate" as const },
  ];
  return (
    <div
      className="rounded-2xl border text-left relative overflow-hidden shadow-2xl"
      style={{
        background: "#FAFAF8",
        borderColor: "#E2E8F0",
        transform: "perspective(1800px) rotateX(2deg)",
      }}
    >
      {/* Browser chrome */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ background: "#F2EEE8", borderColor: "#E2E8F0" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "#7890A4" }}>
          Cleard · Permit Pipeline
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "#1B84D4" }}>
          <Sparkles className="h-3 w-3" /> Victoria
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 p-6 pb-4">
        {[
          { k: "12", v: "Active", color: "#1B84D4" },
          { k: "3", v: "In Review", color: "#E8861A" },
          { k: "2", v: "Corrections", color: "#DC2626" },
        ].map((s) => (
          <div
            key={s.v}
            className="rounded-lg p-4 border"
            style={{ borderColor: "#E2E8F0", background: "#fff" }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {s.k}
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] mt-1" style={{ color: "#7890A4" }}>
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* Permit rows */}
      <div className="px-6 pb-4 space-y-2">
        {rows.map((r) => (
          <div
            key={r.addr}
            className="flex items-center justify-between px-4 py-3 rounded-lg border"
            style={{ background: "#fff", borderColor: "#E2E8F0" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileCheck className="h-4 w-4 shrink-0" style={{ color: "#1B84D4" }} />
              <div className="text-sm truncate" style={{ color: "#0F1E2E" }}>
                {r.addr}
              </div>
            </div>
            <StatusPill tone={r.tone}>{r.status}</StatusPill>
          </div>
        ))}
      </div>

      {/* Victoria alert bar */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-t"
        style={{ background: "color-mix(in oklab, #1B84D4 8%, transparent)", borderColor: "#E2E8F0" }}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: "#1B84D4" }} />
        <p className="text-[12px]" style={{ color: "#1B84D4" }}>
          <strong>Victoria:</strong> COI for Blue Ridge Plumbing expires in 4 days — action required.
        </p>
      </div>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "blue" | "green" | "amber" | "slate" | "gold";
  children: React.ReactNode;
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    blue: { bg: "color-mix(in oklab, #1B84D4 12%, transparent)", fg: "#1268AC" },
    green: { bg: "color-mix(in oklab, #12A05C 12%, transparent)", fg: "#0D8049" },
    amber: { bg: "color-mix(in oklab, #E8861A 14%, transparent)", fg: "#C4720F" },
    slate: { bg: "color-mix(in oklab, #6B8299 12%, transparent)", fg: "#4A6278" },
    gold: { bg: "color-mix(in oklab, #E8861A 14%, transparent)", fg: "#C4720F" },
  };
  const s = map[tone];
  return (
    <span
      className="text-[11px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-md font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
}

/* --------------------------------- VICTORIA ---------------------------------- */

function VictoriaIntro() {
  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
      <div
        className="md-card overflow-hidden grid md:grid-cols-12 gap-0"
        style={{ background: "linear-gradient(135deg, #111827 0%, #153157 100%)" }}
      >
        <div className="md:col-span-5 p-10 md:p-14 flex items-center justify-center border-b md:border-b-0 md:border-r md-hairline">
          <VictoriaMark />
        </div>
        <div className="md:col-span-7 p-10 md:p-14">
          <div className="md-eyebrow">Meet Victoria</div>
          <h2 className="mt-4 md-serif text-4xl md:text-5xl" style={{ color: "var(--md-text)" }}>
            Your AI permitting <em className="italic md-gold">assistant.</em><br /> Always on.
          </h2>
          <p className="mt-6 md-muted text-lg max-w-lg">
            Victoria monitors your permits, flags compliance gaps, notifies your
            subs, and answers questions at every stage — so nothing slips
            through.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="md-chip">Document OCR Scanning</span>
            <span className="md-chip">DBPR License Verification</span>
            <span className="md-chip">Real-Time Status Alerts</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function VictoriaMark() {
  return (
    <div className="relative w-56 h-56">
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, #C8A97E 50%, transparent) 0%, transparent 65%)",
        }}
      />
      <svg viewBox="0 0 200 200" className="relative w-full h-full">
        <defs>
          <linearGradient id="victoriaGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F4E4C3" />
            <stop offset="50%" stopColor="#C8A97E" />
            <stop offset="100%" stopColor="#8B6F47" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="88" fill="none" stroke="#C8A97E" strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#C8A97E" strokeOpacity="0.35" strokeWidth="1" />
        <path
          d="M 55 55 L 100 150 L 145 55"
          fill="none"
          stroke="url(#victoriaGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="100" r="4" fill="#C8A97E" />
      </svg>
    </div>
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
          style={{ color: "#16A34A" }}
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
            color: "#0F1E2E",
          }}
        >
          One place for every permit, start to finish.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: "#5B6B7C" }}>
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
                border: "1px solid #E8ECF1",
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
                style={{ color: "#0F1E2E" }}
              >
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#5B6B7C" }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- TRUST STRIP ------------------------------ */

function TrustStrip() {
  const stats = [
    { k: "160+", v: "Municipalities" },
    { k: "2-Day", v: "Plan Review" },
    { k: "Same-Day", v: "Inspections" },
  ];
  return (
    <section className="border-y md-hairline">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-16 text-center">
        <div className="md-eyebrow">Trusted across South Florida</div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s) => (
            <div key={s.v}>
              <div className="md-serif text-5xl md:text-6xl md-gold">{s.k}</div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.24em] md-muted">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- CTA CARD -------------------------------- */

function BuildersCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-10 py-24">
      <div
        className="md-card p-12 md:p-20 text-center overflow-hidden relative"
        style={{ background: "linear-gradient(140deg, #111827 0%, #153157 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab, #C8A97E 20%, transparent) 0%, transparent 55%)",
          }}
        />
        <div className="relative">
          <div className="md-eyebrow justify-center inline-flex items-center gap-2">
            <Bell className="h-3 w-3" /> Get Started
          </div>
          <h2 className="mt-6 md-serif text-4xl md:text-6xl max-w-3xl mx-auto" style={{ color: "var(--md-text)" }}>
            Built for the GC who <em className="italic md-gold">moves fast.</em>
          </h2>
          <p className="mt-6 md-muted text-lg max-w-xl mx-auto">
            Cleard is invite-only. Request access and our team will reach out
            within 24 hours.
          </p>
          <div className="mt-10">
            <Link to="/join" hash="request" className="md-btn-primary">
              Request Access <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-[12px] md-muted">
            No commitment. No setup fee. Just a faster way to permit.
          </p>
        </div>
      </div>
    </section>
  );
}
