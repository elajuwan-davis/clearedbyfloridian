import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClearedHero } from "@/components/cleard-hero";
import { MarketingFooter } from "@/components/marketing-shell";
import { VictoriaSection } from "@/components/victoria-section";
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
import {
  FeaturedTestimonial,
  ReplaceThePermitOffice,
  WatchItRun,
} from "@/components/home-command-center";
import { ProductWalkthroughs } from "@/components/product-walkthroughs";
import { Hb803Callout } from "@/components/hb803-callout";
import { COUNTIES } from "@/lib/counties";


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

const WHITE = "#FFFFFF";
const OFF = "#F5F5F5";
const OFF2 = "rgba(0,0,0,0.05)";
const INK = "#2B1620";
const GRAY = "rgba(43,22,32,0.55)";
const LIGHT = "rgba(43,22,32,0.38)";
const TEAL = "#2B1620";
const PLUM_LT = "var(--copper)"; /* light copper, legible on dark surfaces */
const GREEN = "rgba(43,22,32,0.5)"; /* neutral muted ink for secondary labels */
const GREEN_LT = "rgba(255,255,255,0.72)"; /* warm copper-lite on dark */
const BORDER = "rgba(43,22,32,0.1)";
const SANS = "'Unbounded', sans-serif";

/* --------------------------------- PAGE ---------------------------------- */

function HomePage() {
  return (
    <div style={{ background: WHITE, color: INK, fontFamily: SANS }}>
      <style>{`
        .cl-home *, .cl-home *::before, .cl-home *::after { border-radius: 0 !important; }
        .cl-home .cl-dot { border-radius: 999px !important; }
        .cl-home .cl-glass, .cl-home .cl-glass * { border-radius: 999px !important; }
        .cl-home .cl-phone { border-radius: 44px !important; }
        .cl-home .cl-phone-screen { border-radius: 34px !important; }
        .cl-home .cl-phone-notch { border-radius: 999px !important; }
        .cl-home .cl-round, .cl-home .cl-round::before, .cl-home .cl-round::after { border-radius: 999px !important; }
        .cl-home .cl-soft { border-radius: 8px !important; }

        @keyframes clWordIn { from { opacity: 0; transform: translateY(0.5em); } to { opacity: 1; transform: translateY(0); } }
        @keyframes clSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes clFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes clMarqueeX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <div className="cl-home">
        <ClearedHero />
        <HeroStatBar />
        <div id="watch-it-run">
          <WatchItRun />
        </div>
        <ProductWalkthroughs />
        <VictoriaSection />
        <ReplaceThePermitOffice />
        
        <Hb803Callout background={OFF} />
        <CountyCoverage />
        <MunicipalityTrack />
        <StatsStrip />
        <TrustBar />
        <MobileApp />
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
  { k: "100%", v: "On-time approval rate" },
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
      return { background: "rgba(43,22,32,0.08)", color: "#2B1620" };
    case "Corrections":
    case "Alert":
    case "Expired":
    case "Failed":
      return { background: "rgba(220,60,60,0.1)", color: "#8C3B3B" };
    case "Permit Issued":
    case "Active":
      return { background: "rgba(156,107,63,0.1)", color: "#7A5030" };
    case "En Route":
    case "In Progress":
      return { background: "rgba(43,22,32,0.07)", color: "rgba(43,22,32,0.6)" };
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


/* --------------------------- MUNICIPALITY TRACK -------------------------- */

function CountyCoverage() {
  return (
    <section style={{ background: WHITE }}>
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 lg:px-8 md:pb-24">
        <div className="copper-text mb-6 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.22em]">

          <span className="copper-hairline inline-block h-px w-7" />
          Statewide coverage
        </div>
        <h2
          className="max-w-3xl"
          style={{
            fontWeight: 700,
            fontSize: "clamp(1.8rem, 3.4vw, 2.6rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            color: INK,
          }}
        >
          Every Florida county. Pick yours.
        </h2>
        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed" style={{ color: GRAY }}>
          Private-provider plan review and inspections under Florida Statute 553.791 — 2-day plan
          review, same-day inspections.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {COUNTIES.map((c) => (
            <Link
              key={c.slug}
              to="/coverage/$county"
              params={{ county: c.slug }}
              className="px-4 py-2 text-[13px] no-underline transition-colors"
              style={{ border: `1px solid ${BORDER}`, color: INK, background: "#FFFFFF" }}
            >
              {c.label}
            </Link>
          ))}
          <Link
            to="/coverage"
            className="px-4 py-2 text-[13px] no-underline"
            style={{ border: `1px solid ${TEAL}`, color: TEAL, fontWeight: 600 }}
          >
            All coverage →
          </Link>
        </div>
      </div>
    </section>
  );
}

function MunicipalityTrack() {
  const CARD_BG = "#2B1620";
  const CARD_BORDER = "rgba(255,255,255,0.14)";
  return (
    <section style={{ background: WHITE }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 pb-24 md:pb-28">
        <div className="copper-text mb-6 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.22em]">
          <span className="copper-hairline inline-block h-px w-7" />
          For municipalities
        </div>

        <div className="p-8 md:p-14" style={{ background: CARD_BG, borderLeft: "3px solid var(--copper)" }}>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}>
            CleardGov
          </div>
          <div className="mt-2 text-[17px] font-semibold" style={{ color: "#FFFFFF" }}>
            The building department, outsourced.
          </div>
          <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
            Contract plan review, field inspections, backlog reduction, and staff augmentation for
            municipalities. You retain full oversight and final authority. Cleard provides the licensed
            professionals and the platform they work in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "Contract plan review · All disciplines",
              "Inspections, all trades",
              "Backlog reduction programs",
            ].map((c) => (
              <span
                key={c}
                className="px-4 py-2 text-[12.5px]"
                style={{ border: `1px solid ${CARD_BORDER}`, color: "#FFFFFF" }}
              >
                {c}
              </span>
            ))}
          </div>
          <Link
            to="/contact"
            className="cl-glass mt-10 inline-flex items-center gap-2 px-7 py-3 text-[14px] no-underline transition-transform duration-200 hover:scale-[1.03]"
            style={{
              backgroundImage: "var(--gradient-copper)",
              border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              color: "#FFF8EC",
              fontWeight: 700,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.45), 0 18px 34px -20px rgba(100,55,10,0.4)",
            }}
          >
            Talk to our team <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
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
              <Sparkles className="h-4 w-4" style={{ color: "var(--copper)" }} strokeWidth={1.75} />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.65)" }}>
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
                  <s.icon className="h-3.5 w-3.5" style={{ color: "var(--copper)" }} strokeWidth={1.75} />
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

/* ------------------------------- TRUST BAR ------------------------------- */

function TrustBar() {
  const marquee = [...TRUST_LOGOS, ...TRUST_LOGOS];
  return (
    <section style={{ background: WHITE, borderTop: `1px solid ${BORDER}` }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 md:py-24">
        <div className="flex items-center justify-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: LIGHT }}>
          <span className="copper-hairline inline-block h-px w-7" />
          Trusted by contractors across the country
          <span className="copper-hairline inline-block h-px w-7" />
        </div>


        <div
          className="relative mt-10 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
          }}
        >
          <div
            className="flex w-max items-center gap-16"
            style={{ animation: "clMarqueeX 34s linear infinite" }}
          >
            {marquee.map((l, i) => (
              <span
                key={`${l}-${i}`}
                className="whitespace-nowrap text-[clamp(1.25rem,2.4vw,2rem)] font-bold uppercase"
                style={{ color: INK, letterSpacing: "-0.02em", opacity: 0.82 }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <FeaturedTestimonial items={TESTIMONIALS} />
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
        <div className="mx-auto flex justify-center">
          {/* iPhone shell */}
          <div
            className="cl-phone relative p-[11px]"
            style={{
              width: 326,
              background: "linear-gradient(160deg, #34302E 0%, #17171A 42%, #3A3532 100%)",
              boxShadow:
                "0 60px 90px -40px rgba(43,22,32,0.55), 0 24px 40px -24px rgba(43,22,32,0.4), inset 0 0 0 1px rgba(255,255,255,0.12)",
            }}
          >
            {/* side buttons */}
            <span aria-hidden className="cl-dot absolute -left-[2px] top-[110px] h-14 w-[3px]" style={{ background: "#4A4441" }} />
            <span aria-hidden className="cl-dot absolute -left-[2px] top-[184px] h-9 w-[3px]" style={{ background: "#4A4441" }} />
            <span aria-hidden className="cl-dot absolute -right-[2px] top-[140px] h-20 w-[3px]" style={{ background: "#4A4441" }} />

            <div
              className="cl-phone-screen relative overflow-hidden"
              style={{ background: WHITE, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)" }}
            >
              {/* dynamic island */}
              <div
                aria-hidden
                className="cl-phone-notch absolute left-1/2 top-2 z-10 h-[22px] w-[86px] -translate-x-1/2"
                style={{ background: "#111014" }}
              />
              <div className="pt-9">
        <div className="w-full" style={{ background: WHITE }}>

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
                  <div key={r.id} className="px-4 py-3" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: "#9C6B3F" }}>{r.id}</span>
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
                <div className="m-3 p-4" style={{ background: INK, borderLeft: `3px solid ${PLUM_LT}` }}>
                  <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: GREEN_LT }}>
                    Live inspection
                  </div>
                  <div className="mt-2 text-[15px] font-semibold" style={{ color: WHITE }}>
                    Final Electrical · 14 Pelican Bay
                  </div>
                  <div key={live} className="mt-2 text-[13px] font-bold" style={{ color: PLUM_LT, animation: "clFade 400ms ease-out both" }}>
                    {LIVE_STATUSES[live]}
                    {LIVE_STATUSES[live] === "Passed" ? " ✓" : ""}
                  </div>
                </div>
                {INSPECTIONS.map((r) => (
                  <div key={r.id} className="px-4 py-2.5" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
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
                  <div className="p-3" style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
                    <div className="text-[24px] font-bold" style={{ color: INK }}>4</div>
                    <div className="text-[11px]" style={{ color: GRAY }}>Verified</div>
                  </div>
                  <div className="p-3" style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
                    <div className="text-[24px] font-bold" style={{ color: "#8C3B3B" }}>1</div>
                    <div className="text-[11px]" style={{ color: GRAY }}>Alert</div>
                  </div>
                </div>
                {COMPLIANCE.map((c) => (
                  <div key={c.id} className="px-4 py-2.5" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
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
                  <div key={d} className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid rgba(0,0,0,0.06)` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen className="h-4 w-4 shrink-0" style={{ color: LIGHT }} />
                      <span className="text-[12px] truncate" style={{ color: INK }}>{d}</span>
                    </div>
                    <span className="text-[13px]" style={{ color: PLUM_LT }}>↓</span>
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
                style={{ color: i === screen ? INK : LIGHT, background: i === screen ? "rgba(0,0,0,0.06)" : "transparent" }}
              >
                <div className="text-[14px]">{t.icon}</div>
                <div className="text-[8px] uppercase tracking-[0.04em] leading-tight">{t.label}</div>
              </div>
            ))}
          </div>
            </div>
              </div>
            </div>
          </div>
        </div>


        <div>
          <h2 style={{ fontSize: "clamp(2rem, 3.6vw, 2.875rem)", lineHeight: 1.08, letterSpacing: "-0.035em" }}>
            <span style={{ color: "var(--copper)", fontWeight: 600 }}>Your whole permit office </span>
            <span style={{ color: INK, fontWeight: 800 }}>in your pocket.</span>
          </h2>
          <div className="mt-10 space-y-7">
            {[
              { icon: Smartphone, t: "Live inspection tracking", b: "Watch every inspection move from scheduled to passed, in real time, from the field." },
              { icon: Bell, t: "Instant alerts", b: "Corrections, expirations, and approvals push straight to your phone the moment they happen." },
              { icon: FolderOpen, t: "Documents on site", b: "Permits, plans, COIs and inspection reports — available at the job, not back at the office." },
            ].map((f) => (
              <div key={f.t} className="flex gap-4">
                <f.icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "var(--copper)" }} strokeWidth={1.75} />
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
            className="cl-glass inline-flex items-center gap-2 px-7 py-3 text-[14px] font-bold no-underline transition-transform duration-200 hover:scale-[1.03]"
            style={{
              backgroundImage: "var(--gradient-copper)",
              border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              color: "#FFF8EC",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.45), 0 18px 34px -20px rgba(100,55,10,0.4)",
            }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/join"
            className="cl-glass inline-flex items-center gap-2 px-6 py-3 text-[14px] no-underline transition-transform duration-200 hover:scale-[1.03]"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.24)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 600,
            }}
          >
            See a demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- FOOTER --------------------------------- */

function Footer() {
  return <MarketingFooter />;
}


