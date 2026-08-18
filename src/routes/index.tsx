import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClearedHero } from "@/components/cleard-hero";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  ClipboardCheck,
  FileCheck2,
  FileText,
  FolderOpen,
  Scale,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import {
  AppFrame,
  CertificateMock,
  IntakeFormMock,
  KanbanMock,
  M,
  NeuralArt,
  TealGlow,
  TESTIMONIALS,
  TRUST_LOGOS,
  VictoriaChatMock,
} from "@/components/marketing-mockups";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleard — Run projects. Not paperwork." },
      {
        name: "description",
        content:
          "Cleard runs the entire back office behind your projects — permitting administration, private plan review and inspections, license management, insurance compliance, and lien rights.",
      },
      { property: "og:title", content: "Cleard — Run projects. Not paperwork." },
      {
        property: "og:description",
        content:
          "Cleard runs the entire back office behind your projects — permits, plan review, corrections, inspections, licenses, insurance and documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

/* ------------------------------ DESIGN TOKENS ----------------------------- */

const WHITE = "#FAF3E6";
const OFF = "#F3EAD9";
const OFF2 = "#EDE0C9";
const INK = "#2F4F4F";
const GRAY = "#5F7373";
const LIGHT = "#9A8E7C";
const TEAL = "#673147";
const BORDER = "#E0D3BC";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/* --------------------------------- PAGE ---------------------------------- */

function HomePage() {
  return (
    <div style={{ background: WHITE, color: INK, fontFamily: SANS }}>
      <style>{`
        .cl-home *, .cl-home *::before, .cl-home *::after { border-radius: 0 !important; }
        .cl-home .cl-dot { border-radius: 999px !important; }
        @keyframes clWordIn { from { opacity: 0; transform: translateY(0.5em); } to { opacity: 1; transform: translateY(0); } }
        @keyframes clSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes clFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
      <div className="cl-home">
        <ClearedHero />
        <HeroStatBar />
        <Circle360 />
        <StatsStrip />
        <Services />
        <ThreeSteps />
        <VictoriaLayer />
        <TrustBar />
        <PortalShowcase />
        <MobileApp />
        <HowItWorks />
        <BottomCTA />
        <Footer />
      </div>
    </div>
  );
}

/* -------------------------------- HOOKS ---------------------------------- */

function useCountUp(target: number, duration = 1600, start = true) {
  const [value, setValue] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!start || done.current) return;
    done.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return { ref, seen };
}

function useCycle(length: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % length), ms);
    return () => clearInterval(t);
  }, [length, ms]);
  return i;
}

/* ---------------------------------- HERO --------------------------------- */
/* ----------------------------- HERO STAT BAR ----------------------------- */

const HERO_STATS = [
  { k: "1,200+", v: "Permits managed" },
  { k: "94%", v: "On-time approval rate" },
  { k: "48 hr", v: "Average plan review" },
  { k: "400+", v: "Jurisdictions covered" },
];

function HeroStatBar() {
  return (
    <section style={{ background: M.bg0 }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {HERO_STATS.map((s, i) => (
            <div
              key={s.v}
              className="py-8 md:py-10 px-5"
              style={{
                borderLeft: i === 0 ? "none" : `1px solid ${M.line}`,
                borderTop: i > 1 ? `1px solid ${M.line}` : "none",
              }}
            >
              <div
                className="text-[26px] md:text-[32px] font-bold leading-none tabular-nums"
                style={{ color: M.text, letterSpacing: "-0.04em" }}
              >
                {s.k}
              </div>
              <div className="mt-2.5 text-[10.5px] uppercase tracking-[0.16em]" style={{ color: M.teal }}>
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- PORTAL MOCKUPS ---------------------------- */

const ROWS = [
  { id: "CLR-2026-0212", addr: "14 Pelican Bay Ln, Naples", juris: "Collier County", status: "Approved" },
  { id: "CLR-2026-0208", addr: "2840 SW 48th Ct, Miami", juris: "Miami-Dade", status: "Corrections" },
  { id: "CLR-2026-0204", addr: "901 Harbour Ct, Jupiter", juris: "Palm Beach", status: "In Review" },
  { id: "CLR-2026-0199", addr: "7720 NW 2nd Ave, Boca Raton", juris: "Palm Beach", status: "Permit Issued" },
  { id: "CLR-2026-0195", addr: "5612 SE Coconut Ter, Stuart", juris: "Martin County", status: "In Review" },
];

const APP_NAV = [
  "My Permits",
  "Inspections",
  "Subcontractors",
  "Licenses",
  "Insurance",
  "Documents",
];

function statusStyle(status: string) {
  switch (status) {
    case "Approved":
    case "Verified":
    case "Passed":
    case "Clear":
      return { background: "rgba(103,49,71,0.12)", color: "#52243A" };
    case "Corrections":
    case "Alert":
    case "Expired":
    case "Failed":
      return { background: "rgba(220,60,60,0.1)", color: "#C03030" };
    case "Permit Issued":
    case "Active":
      return { background: "rgba(0,95,163,0.1)", color: "#005fa3" };
    case "En Route":
    case "In Progress":
      return { background: "rgba(120,80,200,0.1)", color: "#6040a0" };
    default:
      return { background: "rgba(0,0,0,0.06)", color: GRAY };
  }
}

function Tag({ children }: { children: string }) {
  return (
    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]" style={statusStyle(children)}>
      {children}
    </span>
  );
}

function BrowserChrome({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5" style={{ background: OFF, borderBottom: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-1.5">
        <span className="cl-dot h-2.5 w-2.5" style={{ background: "#FF5F57" }} />
        <span className="cl-dot h-2.5 w-2.5" style={{ background: "#FEBC2E" }} />
        <span className="cl-dot h-2.5 w-2.5" style={{ background: "#28C840" }} />
      </div>
      <div className="flex-1 px-3 py-1 text-[11px]" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: LIGHT }}>
        {path}
      </div>
    </div>
  );
}

function AppSidebar({ active }: { active: string }) {
  return (
    <div className="hidden sm:block py-3" style={{ background: OFF, borderRight: `1px solid ${BORDER}` }}>
      <div className="px-4 pb-3 text-[16px] font-bold" style={{ color: INK, letterSpacing: "-0.03em" }}>
        Cleard
      </div>
      {APP_NAV.map((n) => (
        <div
          key={n}
          className="px-4 py-2 text-[12px]"
          style={n === active ? { color: INK, fontWeight: 600, background: OFF2 } : { color: GRAY }}
        >
          {n}
        </div>
      ))}
    </div>
  );
}

function PermitsTable() {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-[13px] font-semibold" style={{ color: INK }}>
          Active permits
        </span>
        <span className="px-2.5 py-1 text-[11px] font-bold" style={{ background: TEAL, color: WHITE }}>
          + New permit
        </span>
      </div>
      <div
        className="hidden sm:grid grid-cols-[104px_1fr_96px_100px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em]"
        style={{ color: LIGHT, borderBottom: `1px solid ${BORDER}` }}
      >
        <span>ID</span>
        <span>Address</span>
        <span>Jurisdiction</span>
        <span>Status</span>
      </div>
      {ROWS.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[1fr_auto] sm:grid-cols-[104px_1fr_96px_100px] items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${OFF2}` }}
        >
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: TEAL }}>
            {r.id}
          </span>
          <span className="hidden sm:block truncate text-[12px]" style={{ color: INK }}>
            {r.addr}
          </span>
          <span className="hidden sm:block text-[11px]" style={{ color: GRAY }}>
            {r.juris}
          </span>
          <span className="justify-self-end sm:justify-self-start">
            <Tag>{r.status}</Tag>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ 360 SECTION ------------------------------ */

const NODES = [
  "Permit Submission",
  "Private Provider Plan Review",
  "Correction Management",
  "Inspection Scheduling",
  "Subcontractor Coordination",
  "License Verification",
  "Insurance & COI Tracking",
  "Document Management",
];

function Circle360() {
  return (
    <section style={{ background: OFF, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28 text-center">
        <div className="text-[10.5px] uppercase tracking-[0.18em] font-bold" style={{ color: TEAL }}>
          What we run for you
        </div>
        <h2
          className="mt-6 mx-auto max-w-3xl"
          style={{ fontSize: "clamp(2rem, 3.6vw, 2.875rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}
        >
          <span style={{ color: GRAY, fontWeight: 600 }}>Every moving part. </span>
          <span style={{ color: INK, fontWeight: 800 }}>From signed contract to CO.</span>
        </h2>
        <p className="mt-5 mx-auto max-w-2xl text-[16px] leading-relaxed" style={{ color: GRAY }}>
          Most back offices juggle 6–8 vendors to get a project through. Cleard replaces all of them.
        </p>

        {/* Ring — desktop */}
        <div className="hidden lg:block relative mx-auto mt-16" style={{ width: 720, height: 720 }}>
          <div
            className="absolute inset-0"
            style={{ animation: "clSpin 60s linear infinite" }}
          >
            {NODES.map((n, i) => {
              const angle = (i / NODES.length) * 2 * Math.PI - Math.PI / 2;
              const r = 300;
              const x = 360 + r * Math.cos(angle);
              const y = 360 + r * Math.sin(angle);
              return (
                <div
                  key={n}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-4 py-3 text-[12.5px] font-semibold w-[190px]"
                  style={{
                    left: x,
                    top: y,
                    background: WHITE,
                    border: `1px solid ${BORDER}`,
                    color: INK,
                    animation: "clSpin 60s linear infinite reverse",
                  }}
                >
                  {n}
                </div>
              );
            })}
          </div>
          <div
            className="cl-dot absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center"
            style={{ width: 220, height: 220, background: INK, borderRadius: "999px" }}
          >
            <div className="text-center">
              <div className="text-[22px] font-bold" style={{ color: WHITE, letterSpacing: "-0.03em" }}>
                Cleard
              </div>
              <div className="mt-1 text-[10.5px] uppercase tracking-[0.16em]" style={{ color: TEAL }}>
                Back office
              </div>
            </div>
          </div>
        </div>

        {/* Grid — mobile/tablet */}
        <div className="lg:hidden mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {NODES.map((n) => (
            <div key={n} className="px-4 py-3 text-[13px] font-semibold" style={{ background: WHITE, border: `1px solid ${BORDER}`, color: INK }}>
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ STATS STRIP ------------------------------ */

const APPROVALS = [
  { label: "Gas permit", days: 2 },
  { label: "Electrical permit", days: 4 },
  { label: "Pool permit", days: 5 },
  { label: "Roofing permit", days: 8 },
  { label: "Residential SFR", days: 10 },
];

function StatsStrip() {
  const { ref, seen } = useInView<HTMLDivElement>();
  const permits = useCountUp(4847, 3000, seen);
  const [extra, setExtra] = useState(0);
  const rate = useCountUp(100, 2000, seen);
  const ai = useCycle(APPROVALS.length, 3000);

  useEffect(() => {
    if (!seen) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        setExtra((v) => v + 1 + Math.floor(Math.random() * 2));
        schedule();
      }, 8000 + Math.random() * 6000);
    };
    schedule();
    return () => clearTimeout(t);
  }, [seen]);

  return (
    <section style={{ background: WHITE, borderBottom: `1px solid ${BORDER}` }}>
      <div ref={ref} className="mx-auto max-w-7xl px-5 lg:px-8 py-14">
        <div className="text-[10.5px] uppercase tracking-[0.16em] font-bold" style={{ color: LIGHT }}>
          Cleard by the numbers
        </div>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <div>
            <div className="text-[44px] font-bold tabular-nums leading-none" style={{ color: INK, letterSpacing: "-0.04em" }}>
              {(permits + extra).toLocaleString()}
            </div>
            <div className="mt-2 text-[13.5px]" style={{ color: GRAY }}>
              Permits submitted — and counting
            </div>
          </div>
          <div>
            <div className="text-[44px] font-bold tabular-nums leading-none" style={{ color: INK, letterSpacing: "-0.04em" }}>
              {APPROVALS[ai].days} <span className="text-[24px] font-semibold">days</span>
            </div>
            <div key={ai} className="mt-2 text-[13.5px]" style={{ color: GRAY, animation: "clFade 500ms ease-out both" }}>
              Avg. approval time — {APPROVALS[ai].label}
            </div>
          </div>
          <div>
            <div className="text-[44px] font-bold tabular-nums leading-none" style={{ color: INK, letterSpacing: "-0.04em" }}>
              {rate}%
            </div>
            <div className="mt-2 text-[13.5px]" style={{ color: GRAY }}>
              On-time submission rate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- SERVICES ------------------------------- */

const SERVICES = [
  {
    icon: Send,
    title: "Permitting Administration",
    body: "Full-service permit management — application, submission, tracking, corrections, and certificate of occupancy, handled end to end.",
    tag: "Core service",
  },
  {
    icon: FileCheck2,
    title: "Private Plan Review & Inspections",
    body: "Faster approvals through licensed private providers. Plan review and field inspections performed by certified professionals, not municipal backlogs.",
    tag: "Speeds approval",
  },
  {
    icon: ShieldCheck,
    title: "Contractor License Management",
    body: "License verification, renewal tracking, CE hour monitoring, and qualifying agent oversight — all in one dashboard.",
    tag: "Active monitoring",
  },
  {
    icon: Users,
    title: "Insurance Compliance",
    body: "Certificate of insurance collection, coverage validation, expiration tracking, and automated follow-up for your entire subcontractor roster.",
    tag: "COI management",
  },
  {
    icon: Scale,
    title: "Lien Rights",
    body: "Notice of Commencement, Preliminary Notices, Lien Waivers, and statutory deadline tracking — generated, signed, and recorded without leaving the platform.",
    tag: "Statutory deadlines",
  },
];


function Services() {
  return (
    <section style={{ background: WHITE }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28">
        <h2
          className="max-w-3xl"
          style={{ fontSize: "clamp(2rem, 3.6vw, 2.875rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}
        >
          <span style={{ color: INK, fontWeight: 800 }}>One team runs it all. </span>
          <span style={{ color: GRAY, fontWeight: 600 }}>So yours doesn&apos;t have to.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[16px] leading-relaxed" style={{ color: GRAY }}>
          Most contractors spread this across 4–6 vendors, two admins, and a lot of phone calls. Cleard
          consolidates the entire compliance and administrative operation — under one roof, in one portal.
        </p>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className={`relative p-6 lg:p-7 ${i < 2 ? "lg:col-span-3" : "lg:col-span-2"}`}
              style={{ background: OFF, border: `1px solid ${BORDER}` }}
            >
              <ArrowUpRight className="absolute right-5 top-5 h-4 w-4" style={{ color: LIGHT }} />
              <span
                className="inline-flex h-11 w-11 items-center justify-center"
                style={{ background: M.bg0 }}
              >
                <s.icon className="h-[19px] w-[19px]" style={{ color: TEAL }} strokeWidth={1.5} />
              </span>
              <h3 className={`mt-5 font-bold ${i < 2 ? "text-[19px]" : "text-[17px]"}`} style={{ color: INK, letterSpacing: "-0.02em" }}>
                {s.title}
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed" style={{ color: GRAY }}>
                {s.body}
              </p>
              <span
                className="mt-5 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]"
                style={{ background: "rgba(103,49,71,0.12)", color: "#52243A" }}
              >
                {s.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- VICTORIA (PLATFORM LAYER) --------------------- */

function VictoriaLayer() {
  return (
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
              answers jurisdiction questions, flags missing documents, routes correction responses, and
              surfaces compliance risks before they become delays. You don&apos;t buy Victoria. She
              comes with Cleard.
            </p>
            <div className="mt-9">
              <VictoriaChatMock />
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {SERVICES.map((s) => (
                <span key={s.title} className="flex items-center gap-2 text-[12px]" style={{ color: M.faint }}>
                  <s.icon className="h-3.5 w-3.5" style={{ color: TEAL }} strokeWidth={1.75} />
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- 3 STEPS --------------------------------- */

function ThreeSteps() {
  const steps = [
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
  return (
    <section style={{ background: M.bg1 }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-32">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: TEAL }}>
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
          {steps.map((s, i) => (
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
  );
}

/* ------------------------------- TRUST BAR ------------------------------- */

function TrustBar() {
  return (
    <section style={{ background: WHITE, borderTop: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-32">
        <div className="text-center text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: LIGHT }}>
          Trusted by contractors across the country
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6" style={{ background: BORDER }}>
          {TRUST_LOGOS.map((l) => (
            <div
              key={l}
              className="flex items-center justify-center px-4 py-7 text-center text-[11px] font-bold uppercase tracking-[0.12em]"
              style={{ background: WHITE, color: INK }}
            >
              {l}
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col p-7" style={{ background: OFF, border: `1px solid ${BORDER}` }}>
              <div className="text-[28px] font-bold leading-none" style={{ color: TEAL }}>
                &ldquo;
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed" style={{ color: INK }}>
                {t.quote}
              </blockquote>
              <figcaption className="mt-6 pt-5 text-[12.5px]" style={{ borderTop: `1px solid ${BORDER}`, color: GRAY }}>
                <span className="font-bold" style={{ color: INK }}>
                  {t.name}
                </span>
                <br />
                {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- PORTAL SHOWCASE ----------------------------- */

const INSPECTIONS = [
  { id: "INS-4821", addr: "14 Pelican Bay Ln", type: "Final Electrical", when: "Today · 10:00 AM", status: "In Progress" },
  { id: "INS-4818", addr: "901 Harbour Ct", type: "Framing", when: "Today · 1:30 PM", status: "En Route" },
  { id: "INS-4810", addr: "2840 SW 48th Ct", type: "Plumbing Rough", when: "Yesterday", status: "Passed" },
  { id: "INS-4802", addr: "5612 SE Coconut Ter", type: "Roof Dry-In", when: "Aug 11", status: "Failed" },
];

const COMPLIANCE = [
  { id: "SUB-0142", name: "Gulfstream Electric", license: "EC13009821", ins: "Verified", status: "Clear" },
  { id: "SUB-0138", name: "Atlantic Plumbing Co", license: "CFC1428817", ins: "Verified", status: "Clear" },
  { id: "SUB-0131", name: "Coastal Roofing LLC", license: "CCC1331902", ins: "Expired", status: "Alert" },
  { id: "SUB-0127", name: "Meridian Mechanical", license: "CAC1819330", ins: "Verified", status: "Clear" },
];

const TABS = ["My Permits", "Inspections", "License & Insurance"] as const;

function PortalShowcase() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Permits");
  return (
    <section style={{ background: OFF, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28">
        <h2
          className="max-w-3xl"
          style={{ fontSize: "clamp(2rem, 3.6vw, 2.875rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}
        >
          <span style={{ color: INK, fontWeight: 800 }}>One dashboard. </span>
          <span style={{ color: GRAY, fontWeight: 600 }}>Every moving part.</span>
        </h2>

        <div className="mt-9 flex flex-wrap gap-0" style={{ border: `1px solid ${BORDER}`, background: WHITE, width: "fit-content" }}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="px-5 py-2.5 text-[13px]"
              style={
                tab === t
                  ? { background: INK, color: WHITE, fontWeight: 600 }
                  : { background: WHITE, color: GRAY }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div key={tab} className="mt-8" style={{ animation: "clFade 400ms ease-out both" }}>
          <div style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
            <BrowserChrome path={`app.cleard.io/${tab.toLowerCase().replace(/[^a-z]+/g, "-")}`} />
            <div className="grid grid-cols-[1fr] sm:grid-cols-[160px_1fr]">
              <AppSidebar active={tab === "License & Insurance" ? "Licenses" : tab} />
              {tab === "My Permits" && <PermitsTable />}
              {tab === "Inspections" && <MockTable
                title="Scheduled inspections"
                cols={["ID", "Project", "Type", "Status"]}
                rows={INSPECTIONS.map((r) => [r.id, r.addr, `${r.type} · ${r.when}`, r.status])}
              />}
              {tab === "License & Insurance" && <MockTable
                title="Subcontractor compliance"
                cols={["ID", "Subcontractor", "License / Insurance", "Status"]}
                rows={COMPLIANCE.map((r) => [r.id, r.name, `${r.license} · COI ${r.ins}`, r.status])}
              />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockTable({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <span className="text-[13px] font-semibold" style={{ color: INK }}>
          {title}
        </span>
      </div>
      <div
        className="hidden sm:grid grid-cols-[112px_1fr_1fr_104px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em]"
        style={{ color: LIGHT, borderBottom: `1px solid ${BORDER}` }}
      >
        {cols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {rows.map((r) => (
        <div
          key={r[0]}
          className="grid grid-cols-[1fr_auto] sm:grid-cols-[112px_1fr_1fr_104px] items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${OFF2}` }}
        >
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: TEAL }}>
            {r[0]}
          </span>
          <span className="hidden sm:block truncate text-[12px]" style={{ color: INK }}>
            {r[1]}
          </span>
          <span className="hidden sm:block truncate text-[11px]" style={{ color: GRAY }}>
            {r[2]}
          </span>
          <span className="justify-self-end sm:justify-self-start">
            <Tag>{r[3]}</Tag>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ MOBILE APP ------------------------------- */

const LIVE_STATUSES = ["Scheduled", "En Route", "In Progress", "Passed"];

function MobileApp() {
  const screen = useCycle(4, 4000);
  const live = useCycle(LIVE_STATUSES.length, 3800);
  const tabs = [
    { icon: "⊞", label: "Permits" },
    { icon: "✓", label: "Inspections" },
    { icon: "☑", label: "Compliance" },
    { icon: "☰", label: "Documents" },
  ];

  return (
    <section style={{ background: WHITE }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28 grid gap-16 lg:grid-cols-2 lg:items-center">
        <div className="mx-auto w-[300px]" style={{ border: `1px solid ${BORDER}`, background: WHITE, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="text-[15px] font-bold" style={{ color: INK, letterSpacing: "-0.03em" }}>
              Cleard
            </span>
            <Bell className="h-4 w-4" style={{ color: GRAY }} />
          </div>

          <div key={screen} className="h-[420px] overflow-hidden" style={{ animation: "clFade 400ms ease-out both" }}>
            {screen === 0 && (
              <div>
                {ROWS.slice(0, 5).map((r) => (
                  <div key={r.id} className="px-4 py-3" style={{ borderBottom: `1px solid ${OFF2}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: TEAL }}>{r.id}</span>
                      <Tag>{r.status}</Tag>
                    </div>
                    <div className="mt-1 text-[12.5px] truncate" style={{ color: INK }}>{r.addr}</div>
                    <div className="text-[11px]" style={{ color: GRAY }}>{r.juris}</div>
                  </div>
                ))}
              </div>
            )}

            {screen === 1 && (
              <div>
                <div className="m-3 p-4" style={{ background: INK, borderLeft: `3px solid ${TEAL}` }}>
                  <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: TEAL }}>
                    Live inspection
                  </div>
                  <div className="mt-2 text-[15px] font-semibold" style={{ color: WHITE }}>
                    Final Electrical · 14 Pelican Bay
                  </div>
                  <div key={live} className="mt-2 text-[13px] font-bold" style={{ color: TEAL, animation: "clFade 400ms ease-out both" }}>
                    {LIVE_STATUSES[live]}
                    {LIVE_STATUSES[live] === "Passed" ? " ✓" : ""}
                  </div>
                </div>
                {INSPECTIONS.map((r) => (
                  <div key={r.id} className="px-4 py-2.5" style={{ borderBottom: `1px solid ${OFF2}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px]" style={{ color: INK }}>{r.type}</span>
                      <Tag>{r.status}</Tag>
                    </div>
                    <div className="text-[11px]" style={{ color: GRAY }}>{r.addr} · {r.when}</div>
                  </div>
                ))}
              </div>
            )}

            {screen === 2 && (
              <div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  <div className="p-3" style={{ background: OFF, border: `1px solid ${BORDER}` }}>
                    <div className="text-[24px] font-bold" style={{ color: INK }}>4</div>
                    <div className="text-[11px]" style={{ color: GRAY }}>Verified</div>
                  </div>
                  <div className="p-3" style={{ background: OFF, border: `1px solid ${BORDER}` }}>
                    <div className="text-[24px] font-bold" style={{ color: "#C03030" }}>1</div>
                    <div className="text-[11px]" style={{ color: GRAY }}>Alert</div>
                  </div>
                </div>
                {COMPLIANCE.map((c) => (
                  <div key={c.id} className="px-4 py-2.5" style={{ borderBottom: `1px solid ${OFF2}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] truncate" style={{ color: INK }}>{c.name}</span>
                      <Tag>{c.status}</Tag>
                    </div>
                    <div className="text-[11px]" style={{ color: GRAY }}>
                      {c.license} · COI {c.ins}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {screen === 3 && (
              <div>
                {[
                  "Permit-Application-CLR-0212.pdf",
                  "Stamped-Plans-Rev-B.pdf",
                  "COI-Gulfstream-Electric.pdf",
                  "NOC-14-Pelican-Bay.pdf",
                  "Inspection-Report-4810.pdf",
                ].map((d) => (
                  <div key={d} className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${OFF2}` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen className="h-4 w-4 shrink-0" style={{ color: LIGHT }} />
                      <span className="text-[12px] truncate" style={{ color: INK }}>{d}</span>
                    </div>
                    <span className="text-[13px]" style={{ color: TEAL }}>↓</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4" style={{ borderTop: `1px solid ${BORDER}`, background: OFF }}>
            {tabs.map((t, i) => (
              <div
                key={t.label}
                className="py-2.5 text-center"
                style={{ color: i === screen ? INK : LIGHT, background: i === screen ? OFF2 : "transparent" }}
              >
                <div className="text-[14px]">{t.icon}</div>
                <div className="text-[9.5px] uppercase tracking-[0.08em]">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "clamp(2rem, 3.6vw, 2.875rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}>
            <span style={{ color: GRAY, fontWeight: 600 }}>Your whole permit office </span>
            <span style={{ color: INK, fontWeight: 800 }}>in your pocket.</span>
          </h2>
          <div className="mt-10 space-y-7">
            {[
              { icon: Smartphone, t: "Live inspection tracking", b: "Watch every inspection move from scheduled to passed, in real time, from the field." },
              { icon: Bell, t: "Instant alerts", b: "Corrections, expirations, and approvals push straight to your phone the moment they happen." },
              { icon: FolderOpen, t: "Documents on site", b: "Permits, plans, COIs and inspection reports — available at the job, not back at the office." },
            ].map((f) => (
              <div key={f.t} className="flex gap-4">
                <f.icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: TEAL }} strokeWidth={1.75} />
                <div>
                  <div className="text-[15.5px] font-bold" style={{ color: INK, letterSpacing: "-0.02em" }}>{f.t}</div>
                  <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: GRAY }}>{f.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ HOW IT WORKS ----------------------------- */

const STEPS = [
  { t: "Send the plans", b: "Share drawings and scope. We intake, review, and prep for submission — including sub license and insurance collection." },
  { t: "We submit", b: "We submit through licensed private providers — bypassing county review queues and compressing your approval window." },
  { t: "Manage corrections", b: "If the building department flags issues, we handle it — drafting responses, coordinating revised drawings, resubmitting." },
  { t: "Inspections coordinated", b: "We schedule and confirm every required inspection. Your super gets the date, type, and what to have staged." },
  { t: "Inspections approved", b: "Each trade passes. We track every result, flag failures, and coordinate resolution before the next phase moves." },
  { t: "Certificate of Occupancy", b: "Final inspections clear. CO is issued. Full documentation stored in your portal — project closed, cleanly." },
];

function HowItWorks() {
  return (
    <section style={{ background: OFF, borderTop: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28">
        <div className="text-[10.5px] uppercase tracking-[0.18em] font-bold" style={{ color: TEAL }}>
          How it works
        </div>
        <h2
          className="mt-6 max-w-3xl"
          style={{ fontSize: "clamp(2rem, 3.6vw, 2.875rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}
        >
          <span style={{ color: INK, fontWeight: 800 }}>Six steps. </span>
          <span style={{ color: GRAY, fontWeight: 600 }}>Contract to certificate.</span>
        </h2>

        <div className="mt-14 grid gap-px sm:grid-cols-2 lg:grid-cols-6" style={{ background: BORDER, border: `1px solid ${BORDER}` }}>
          {STEPS.map((s, i) => (
            <div key={s.t} className="p-5" style={{ background: WHITE }}>
              <div className="text-[11px] font-bold tabular-nums" style={{ color: TEAL }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-3 text-[14.5px] font-bold" style={{ color: INK, letterSpacing: "-0.02em" }}>
                {s.t}
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed" style={{ color: GRAY }}>
                {s.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- CTA ----------------------------------- */

function BottomCTA() {
  return (
    <section style={{ background: INK }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <h2
          className="max-w-xl"
          style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", lineHeight: 1.1, letterSpacing: "-0.035em", color: WHITE, fontWeight: 800 }}
        >
          Stop running permits. Start building.
        </h2>
        <div className="flex items-center gap-6">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-bold no-underline"
            style={{ background: TEAL, color: WHITE }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/product" className="text-[14px] no-underline" style={{ color: "rgba(255,255,255,0.72)" }}>
            See a demo →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- FOOTER --------------------------------- */

function Footer() {
  return (
    <footer style={{ background: INK, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-12 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <Link
          to="/"
          className="no-underline"
          style={{ color: WHITE, fontWeight: 700, fontSize: 18, letterSpacing: "-0.03em" }}
        >
          Cleard
        </Link>
        <nav className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px]">
          <Link to="/product" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>
            Product
          </Link>
          <Link to="/join" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>
            Contractors
          </Link>
          <a href="https://floridianinc.com/privacy" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>
            Privacy
          </a>
          <a href="https://floridianinc.com/terms" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>
            Terms
          </a>
        </nav>
        <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          © 2026 Cleard
        </div>
      </div>
    </footer>
  );
}
