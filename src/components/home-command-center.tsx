import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileText,
  FolderOpen,
  Hammer,
  LogIn,
  Map,
  Sparkle,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import copperMark from "@/assets/cleard-c-copper.png.asset.json";


/* ----------------------- LOCKED NORDIC LUXURY TOKENS ---------------------- */

const OAT = "#FFFFFF";
const OFF = "#FFFFFF";
const INK = "#2B1620";
const GRAY = "rgba(43,22,32,0.55)";
const LIGHT = "rgba(43,22,32,0.38)";
const PLUM = "#2B1620";
const PLUM_LT = "#9C6B3F";
const GREEN = "#2B1620";
const GREEN_LT = "#9C6B3F";
const BORDER = "rgba(0,0,0,0.1)";
const DARK = "#2B1620";
const DARK_2 = "rgba(255,255,255,0.06)";
const DARK_LINE = "rgba(250,243,230,0.14)";
const COPPER = "#C98A5B";
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

/* Shared keyframes for every home motion primitive. Product motion only. */
export function HomeMotionStyles() {
  return (
    <style>{`
      @keyframes clPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.82); } }
      @keyframes clRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes clSlideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
      @keyframes clTick { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
      .cl-arrow { transition: transform 220ms cubic-bezier(0.16,1,0.3,1); }
      .cl-hoverable:hover .cl-arrow { transform: translateX(5px); }
      .cl-lift { transition: transform 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease; }
      .cl-lift:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(43,22,32,0.10); }
      @media (prefers-reduced-motion: reduce) {
        .cl-lift, .cl-arrow { transition: none !important; }
      }
    `}</style>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  }, []);
  return reduced;
}

function useStep(count: number, ms: number, run = true) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!run || reduced) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms, run, reduced]);
  return reduced ? count - 1 : i;
}

export function useInViewOnce<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver((e) => e.forEach((x) => x.isIntersecting && setSeen(true)), {
      threshold,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return { ref, seen };
}

/* ======================= 1 · LIVE COMMAND CENTER ========================= */
/* The hero doesn't describe Cleard. It runs a project in front of you. */

const CC_TABS = ["Permits", "Inspections", "Compliance", "Documents"] as const;

const CC_BEATS: Array<{
  tab: (typeof CC_TABS)[number];
  status: string;
  statusTone: "review" | "ok" | "warn";
  next: string;
  checks: number;
  toast?: { kind: "ok" | "ai" | "warn"; title: string; sub: string };
}> = [
  { tab: "Permits", status: "In review", statusTone: "review", next: "Plan review · day 1 of 2", checks: 1 },
  { tab: "Permits", status: "In review", statusTone: "review", next: "Victoria scanning submittal", checks: 2, toast: { kind: "ai", title: "Victoria found 1 potential issue", sub: "Product approval / NOA missing" } },
  { tab: "Documents", status: "In review", statusTone: "warn", next: "Correction response drafted", checks: 2, toast: { kind: "warn", title: "Correction resolved", sub: "NOA attached · ready to submit" } },
  { tab: "Permits", status: "Approved", statusTone: "ok", next: "Schedule final inspection", checks: 3, toast: { kind: "ok", title: "Permit approved", sub: "Collier County · CLR-2026-0212" } },
  { tab: "Inspections", status: "Approved", statusTone: "ok", next: "Final inspection · today 10:00", checks: 4 },
  { tab: "Inspections", status: "Cleared", statusTone: "ok", next: "Certificate of occupancy issued", checks: 5, toast: { kind: "ok", title: "Inspection passed", sub: "14 Pelican Bay Ln · 6 of 6" } },
];

const CC_CHECKS = [
  "Plans verified",
  "Permit submitted",
  "Documents complete",
  "Inspection scheduled",
  "Final inspection passed",
];

function toneStyle(t: "review" | "ok" | "warn") {
  if (t === "ok") return { background: "rgba(156,190,178,0.18)", color: GREEN_LT };
  if (t === "warn") return { background: "rgba(217,175,193,0.18)", color: PLUM_LT };
  return { background: "rgba(250,243,230,0.10)", color: "rgba(250,243,230,0.62)" };
}

export function LiveCommandCenter() {
  const i = useStep(CC_BEATS.length, 2300);
  const beat = CC_BEATS[i];

  return (
    <div
      className="relative w-full max-w-[560px]"
      style={{ background: DARK, border: `1px solid ${DARK_LINE}`, boxShadow: "0 30px 70px rgba(43,22,32,0.28)" }}
    >
      {/* console header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${DARK_LINE}` }}
      >
        <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: OFF, letterSpacing: "-0.02em" }}>
          Cleard
        </span>
        <span className="flex items-center gap-2 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.16em", color: PLUM_LT }}>
          <span
            className="inline-block h-1.5 w-1.5"
            style={{ background: GREEN_LT, borderRadius: 999, animation: "clPulse 1.8s ease-in-out infinite" }}
          />
          Victoria online
        </span>
      </div>

      {/* headline metrics */}
      <div className="px-4 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[34px] leading-none tabular-nums" style={{ fontFamily: SERIF, fontWeight: 600, color: OFF }}>
              17
            </div>
            <div className="mt-1.5 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "rgba(250,243,230,0.5)" }}>
              Active projects
            </div>
          </div>
          <div className="text-right">
            <div className="text-[22px] leading-none tabular-nums" style={{ fontFamily: SERIF, fontWeight: 600, color: GREEN_LT }}>
              100%
            </div>
            <div className="mt-1.5 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "rgba(250,243,230,0.5)" }}>
              On time
            </div>
          </div>
        </div>
        <div className="mt-3 h-[3px] w-full" style={{ background: "rgba(250,243,230,0.12)" }}>
          <div style={{ width: "100%", height: "100%", background: GREEN_LT, transition: "width 900ms ease" }} />
        </div>
      </div>

      {/* tabs — the console navigates itself */}
      <div className="mt-4 grid grid-cols-4" style={{ borderTop: `1px solid ${DARK_LINE}`, borderBottom: `1px solid ${DARK_LINE}` }}>
        {CC_TABS.map((t) => {
          const on = t === beat.tab;
          return (
            <div
              key={t}
              className="py-2.5 text-center text-[9.5px] uppercase"
              style={{
                fontFamily: MONO,
                letterSpacing: "0.14em",
                color: on ? OFF : "rgba(250,243,230,0.4)",
                background: on ? DARK_2 : "transparent",
                transition: "background 300ms ease, color 300ms ease",
              }}
            >
              {t}
            </div>
          );
        })}
      </div>

      {/* the project itself */}
      <div className="p-4">
        <div className="p-4" style={{ background: DARK_2, border: `1px solid ${DARK_LINE}` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[15px]" style={{ fontFamily: SERIF, fontWeight: 600, color: OFF, letterSpacing: "-0.02em" }}>
                14 Pelican Bay Ln
              </div>
              <div className="mt-1 text-[10.5px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.14em", color: "rgba(250,243,230,0.45)" }}>
                Collier County · CLR-2026-0212
              </div>
            </div>
            <span
              key={beat.status}
              className="px-2.5 py-1 text-[9.5px] uppercase"
              style={{ ...toneStyle(beat.statusTone), fontFamily: MONO, letterSpacing: "0.14em", animation: "clRise 320ms ease-out both" }}
            >
              {beat.status}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {CC_CHECKS.map((c, idx) => {
              const done = idx < beat.checks;
              return (
                <div
                  key={c}
                  className="flex items-center gap-2.5 text-[12.5px]"
                  style={{
                    color: done ? OFF : "rgba(250,243,230,0.3)",
                    transition: "color 400ms ease",
                  }}
                >
                  <span
                    className="grid h-4 w-4 shrink-0 place-items-center"
                    style={{
                      border: `1px solid ${done ? GREEN_LT : "rgba(250,243,230,0.2)"}`,
                      background: done ? "rgba(156,190,178,0.16)" : "transparent",
                      transition: "all 400ms ease",
                    }}
                  >
                    {done && <Check className="h-2.5 w-2.5" strokeWidth={3} style={{ color: GREEN_LT }} />}
                  </span>
                  {c}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 text-[10.5px] uppercase" style={{ borderTop: `1px solid ${DARK_LINE}`, fontFamily: MONO, letterSpacing: "0.16em", color: PLUM_LT }}>
            Next · {beat.next}
          </div>
        </div>
      </div>

      {/* toast rail */}
      <div className="px-4 pb-4" style={{ minHeight: 74 }}>
        {beat.toast && (
          <div
            key={`${i}-${beat.toast.title}`}
            className="flex items-start gap-3 p-3"
            style={{
              background: DARK_2,
              borderLeft: `2px solid ${beat.toast.kind === "ok" ? GREEN_LT : PLUM_LT}`,
              animation: "clSlideIn 380ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {beat.toast.kind === "ai" ? (
              <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: PLUM_LT }} strokeWidth={1.75} />
            ) : (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: beat.toast.kind === "ok" ? GREEN_LT : PLUM_LT }} strokeWidth={2.5} />
            )}
            <div>
              <div className="text-[12.5px]" style={{ color: OFF }}>
                {beat.toast.title}
              </div>
              <div className="mt-0.5 text-[10.5px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.12em", color: "rgba(250,243,230,0.45)" }}>
                {beat.toast.sub}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== 2 · WATCH CLEARD RUN A PROJECT =================== */

const RUN_STEPS = [
  { k: "Contract", t: "Project enters Cleard", b: "Scope, drawings and your sub roster land in one intake. No kickoff meeting required.", tone: "neutral" as const },
  { k: "Plans", t: "Submittal assembled", b: "Applications, checklists, product approvals and sub compliance are built into one package.", tone: "neutral" as const },
  { k: "Permit", t: "Cleard files it", b: "Filed through licensed private providers instead of sitting in a municipal queue.", tone: "neutral" as const },
  { k: "Review", t: "Victoria checks documents", b: "Every page is read against the jurisdiction's requirements before a reviewer ever sees it.", tone: "ai" as const },
  { k: "Corrections", t: "Issue caught and closed", b: "Missing NOA detected, response drafted, revised drawings attached, resubmitted.", tone: "warn" as const },
  { k: "Inspections", t: "Scheduled and cleared", b: "Every trade booked, confirmed and tracked from the field, with same-day inspections.", tone: "neutral" as const },
  { k: "Certificate", t: "Project cleared", b: "CO issued. The full closeout package is archived in your portal.", tone: "ok" as const },
];

export function WatchItRun() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setActive(RUN_STEPS.length - 1);
      setProgress(1);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const p = span <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / span));
        setProgress(p);
        setActive(Math.min(RUN_STEPS.length - 1, Math.floor(p * RUN_STEPS.length * 0.999)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const step = RUN_STEPS[active];
  const fill = reduced ? 100 : Math.max(2, progress * 100);

  return (
    <section ref={wrapRef} style={{ background: GREEN, position: "relative", height: reduced ? "auto" : `${RUN_STEPS.length * 62}vh` }}>
      <div className={reduced ? "" : "sticky top-0"} style={{ minHeight: reduced ? undefined : "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8">
          <div className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.22em", color: "#FFFFFF", fontFamily: MONO }}>
            Watch it run
          </div>
          <h2
            className="mt-5 max-w-3xl"
            style={{ fontFamily: SERIF, fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)", lineHeight: 1.05, letterSpacing: "-0.035em", color: OAT, fontWeight: 600 }}
          >
            From signed contract to
            <br />
            <span style={{ fontStyle: "italic", color: GREEN_LT }}>certificate of occupancy.</span>
          </h2>

          {/* horizontal scroll rail */}
          <div className="relative mt-12">
            <div className="absolute left-0 right-0 h-px" style={{ top: 7, background: "rgba(250,243,230,0.18)" }} />
            <div
              className="absolute left-0 h-px"
              style={{
                top: 7,
                width: `${fill}%`,
                backgroundImage: "var(--gradient-copper)",
                boxShadow: `0 0 12px ${COPPER}66`,
                transition: "width 220ms linear",
              }}
            />
            <div className="relative flex justify-between">
              {RUN_STEPS.map((s, idx) => {
                const done = idx <= active;
                const now = idx === active;
                return (
                  <div key={s.k} className="flex min-w-0 flex-col items-center" style={{ flex: 1 }}>
                    <span
                      className={done ? "cl-dot grid place-items-center copper-metal" : "cl-dot grid place-items-center"}
                      style={{
                        width: now ? 15 : 11,
                        height: now ? 15 : 11,
                        marginTop: now ? 0 : 2,
                        borderRadius: 999,
                        border: `1px solid ${done ? COPPER : "rgba(250,243,230,0.3)"}`,
                        backgroundColor: done ? COPPER : "transparent",
                        boxShadow: now
                          ? `0 0 0 5px ${COPPER}22, 0 0 10px ${COPPER}88, inset 0 1px 0 rgba(255,255,255,0.4)`
                          : done
                            ? "inset 0 1px 0 rgba(255,255,255,0.35)"
                            : "none",
                        transition: "all 320ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />

                    <span
                      className="mt-3 hidden truncate text-[10px] uppercase sm:block"
                      style={{
                        fontFamily: MONO,
                        letterSpacing: "0.16em",
                        color: now ? OAT : done ? "rgba(250,243,230,0.62)" : "rgba(250,243,230,0.3)",
                        transition: "color 320ms ease",
                      }}
                    >
                      {s.k}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* active step panel */}
          <div className="mt-14 grid items-start gap-6 md:grid-cols-[minmax(0,180px)_1fr] md:gap-12">
            <div
              key={`n-${active}`}
              style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(4rem, 9vw, 7.5rem)", lineHeight: 0.85, letterSpacing: "-0.05em", color: "#FFFFFF", animation: "clRise 520ms cubic-bezier(0.16,1,0.3,1) both" }}
            >
              {String(active + 1).padStart(2, "0")}
            </div>
            <div key={`c-${active}`} style={{ animation: "clRise 560ms cubic-bezier(0.16,1,0.3,1) both" }}>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.2em", color: COPPER }}>
                  {step.k}
                </span>
                {step.tone === "ai" && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: GREEN_LT }}>
                    <Sparkle className="h-3 w-3" strokeWidth={1.75} /> Victoria
                  </span>
                )}
                {step.tone === "ok" && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: GREEN_LT }}>
                    <Check className="h-3 w-3" strokeWidth={2.5} /> Closed
                  </span>
                )}
              </div>
              <h3 className="mt-3" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(1.6rem, 3vw, 2.35rem)", letterSpacing: "-0.03em", color: OAT }}>
                {step.t}
              </h3>
              <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed" style={{ color: "rgba(250,243,230,0.66)" }}>
                {step.b}
              </p>
              <div
                className="mt-8 h-px max-w-md"
                style={{ background: `linear-gradient(90deg, ${COPPER}88, transparent)` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================== 3 · VICTORIA SPOTLIGHT ======================= */

const V_CARDS = [
  {
    kind: "flag" as const,
    head: "I found something that could delay your permit.",
    body: "Product approval / NOA is missing from 14 Pelican Bay Ln.",
    action: "Fix it for me",
  },
  {
    kind: "done" as const,
    head: "I resolved a correction.",
    body: "Miami-Dade · CLR-2026-0208. Response drafted, documents attached, ready to submit.",
    action: "Review and send",
  },
  {
    kind: "watch" as const,
    head: "Two COIs expire inside 30 days.",
    body: "Coastal Roofing LLC and Meridian Mechanical. Renewal requests already sent.",
    action: "See the roster",
  },
];

export function VictoriaSpotlight() {
  const i = useStep(V_CARDS.length, 5200);
  const card = V_CARDS[i];
  return (
    <section className="relative overflow-hidden" style={{ background: OFF, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8 md:py-32">
        <div>
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.22em", color: PLUM }}>
            <span className="copper-hairline inline-block h-px w-7" />
            <Sparkle className="h-3.5 w-3.5" style={{ color: COPPER }} strokeWidth={1.75} /> The intelligence layer
          </div>
          <h2
            className="mt-6"
            style={{ fontFamily: SERIF, fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)", lineHeight: 1.02, letterSpacing: "-0.035em", color: PLUM, fontWeight: 600 }}
          >
            Meet Victoria.
            <br />
            <span style={{ fontStyle: "italic", color: INK }}>Your project intelligence.</span>
          </h2>
          <p className="mt-7 max-w-xl text-[16.5px] leading-[1.75]" style={{ color: GRAY }}>
            Victoria reads every drawing, jurisdiction rule, certificate and deadline behind your
            projects, continuously. She flags what will delay a permit before it does, drafts the
            response, and tells your team exactly what to stage next. You don&apos;t buy Victoria.
            She comes with Cleard.
          </p>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 pt-7 text-[11px] uppercase" style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO, letterSpacing: "0.16em", color: GREEN }}>
            <span>Reads submittals</span>
            <span>Answers jurisdictions</span>
            <span>Drafts corrections</span>
            <span>Watches deadlines</span>
          </div>
        </div>

        <div className="relative">
          <div style={{ background: DARK, border: `1px solid ${DARK_LINE}`, boxShadow: "0 26px 60px rgba(43,22,32,0.24)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DARK_LINE}` }}>
              <span className="flex items-center gap-2 text-[12px]" style={{ color: OFF }}>
                <Sparkle className="h-3.5 w-3.5" style={{ color: PLUM_LT }} strokeWidth={1.75} /> Victoria
              </span>
              <span className="flex items-center gap-2 text-[9.5px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.16em", color: GREEN_LT }}>
                <span className="inline-block h-1.5 w-1.5" style={{ background: GREEN_LT, borderRadius: 999, animation: "clPulse 1.8s ease-in-out infinite" }} />
                Monitoring 17 projects
              </span>
            </div>

            <div key={i} className="p-6" style={{ animation: "clRise 420ms cubic-bezier(0.16,1,0.3,1) both" }}>
              <div className="text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.2em", color: card.kind === "done" ? GREEN_LT : PLUM_LT }}>
                {card.kind === "flag" ? "Risk detected" : card.kind === "done" ? "Resolved" : "Watching"}
              </div>
              <div className="mt-4 text-[21px] leading-tight" style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.03em", color: OFF }}>
                {card.head}
              </div>
              <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "rgba(250,243,230,0.58)" }}>
                {card.body}
              </p>
              <span
                className="cl-glass foil-sheen cl-hoverable mt-6 inline-flex cursor-default items-center gap-2 px-5 py-2.5 text-[12.5px]"
                style={{
                  background: "rgba(103,49,71,0.55)",
                  color: OAT,
                  fontWeight: 600,
                  border: "1px solid rgba(250,243,230,0.22)",
                  backdropFilter: "blur(12px) saturate(150%)",
                  boxShadow: "0 10px 26px rgba(43,22,32,0.3), inset 0 1px 0 rgba(255,255,255,0.24)",
                }}
              >
                {card.action} <ArrowRight className="cl-arrow h-3.5 w-3.5" strokeWidth={2} />
              </span>

            </div>

            <div className="grid grid-cols-3" style={{ borderTop: `1px solid ${DARK_LINE}` }}>
              {V_CARDS.map((c, idx) => (
                <span
                  key={c.head}
                  className="h-[3px]"
                  style={{ background: idx === i ? PLUM_LT : "rgba(250,243,230,0.14)", transition: "background 400ms ease" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================== 4 · THE ARCHITECTURAL ENGINE ======================== */

const CREAM = "#F4EADB";
const TAN = "#B98055";
const TAN_DEEP = "#8E5A38";
const HAIR = "rgba(103,49,71,0.20)";
const HAIR_SOFT = "rgba(103,49,71,0.13)";
const CAD = "rgba(142,90,56,0.55)";

const CHAOS_CARDS: {
  tag: string;
  t: string;
  meta?: string;
  x: number;
  y: number;
  w: number;
  r: number;
  z: number;
  bad?: boolean;
  strike?: boolean;
}[] = [
  { tag: "Expediter", t: "Permit expediter", meta: "Waiting 6 days", x: 4, y: 4, w: 132, r: -3.5, z: 6, bad: true },
  { tag: "Email thread", t: "Plan reviewer", meta: "Re: Re: Fwd:", x: 47, y: 1, w: 128, r: 2.6, z: 4 },
  { tag: "Voicemail", t: "Inspector scheduling", meta: "Missed 3/14", x: 24, y: 21, w: 138, r: 1.4, z: 8, bad: true },
  { tag: "Spreadsheet", t: "COI spreadsheet", meta: "Last edit: unknown", x: 58, y: 27, w: 130, r: -2.2, z: 5 },
  { tag: "Expired", t: "License tracker", meta: "Expired 02/28", x: 2, y: 41, w: 126, r: 3.1, z: 7, bad: true },
  { tag: "Third party", t: "Lien service", meta: "Deadline 4/02", x: 40, y: 49, w: 130, r: -1.6, z: 9, strike: true, bad: true },
  { tag: "Text message", t: "Phone calls", meta: "\u201cCall me back\u201d", x: 8, y: 66, w: 120, r: -3.8, z: 6 },
  { tag: "Manual", t: "Manual emails", meta: "No confirmation", x: 52, y: 72, w: 132, r: 2.9, z: 5 },
];

type NodeKey = "permits" | "review" | "licenses" | "documents";

const NODES: {
  key: NodeKey;
  label: string;
  icon: typeof FileText;
  tip: string;
  status: string;
  coord: string;
  /** node center as % of canvas */
  cx: number;
  cy: number;
  labelPos: string;
  tipPos: string;
  side: "top" | "right" | "bottom" | "left";
}[] = [
  {
    key: "permits",
    label: "Permits",
    icon: FileText,
    tip: "2 COIs expiring",
    status: "Permits",
    coord: "Lat -11.35.59.688",
    cx: 50,
    cy: 20,
    labelPos: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    tipPos: "bottom-full mb-[20px] left-1/2 -translate-x-1/2",
    side: "top",
  },
  {
    key: "review",
    label: "Plan review",
    icon: Map,
    tip: "2-day cycle, rev 04",
    status: "Plan review",
    coord: "Lat -16.36.88.668",
    cx: 76,
    cy: 50,
    labelPos: "left-full ml-3 top-1/2 -translate-y-1/2",
    tipPos: "left-full ml-3 top-1/2 translate-y-[8px]",
    side: "right",
  },
  {
    key: "licenses",
    label: "Licenses",
    icon: BadgeCheck,
    tip: "14 active, 1 renewing",
    status: "Licenses",
    coord: "Lat/Long 21.392.27",
    cx: 50,
    cy: 80,
    labelPos: "top-full mt-2 left-1/2 -translate-x-1/2",
    tipPos: "top-full mt-[20px] left-1/2 -translate-x-1/2",
    side: "bottom",
  },
  {
    key: "documents",
    label: "Documents",
    icon: FolderOpen,
    tip: "148 reviewed",
    status: "Documents",
    coord: "Lat/Long 31.371.15",
    cx: 24,
    cy: 50,
    labelPos: "right-full mr-3 top-1/2 -translate-y-1/2",
    tipPos: "right-full mr-3 top-1/2 translate-y-[8px]",
    side: "left",
  },
];


const ONE_CARDS = [
  { icon: LogIn, head: "One login", body: "Every jurisdiction behind a single sign-in." },
  { icon: Users, head: "One team", body: "The same coordinators on every project." },
  { icon: Hammer, head: "One trades", body: "Subs, licenses and insurance in one place." },
  { icon: TrendingUp, head: "One results", body: "2-day plan review, same-day inspections." },
];

const SWEEP = 3.5; // seconds per full radar rotation

export function ReplaceThePermitOffice() {
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState<NodeKey | null>(null);
  useEffect(() => {
    const t = setInterval(() => setIdx((v) => (v + 1) % NODES.length), (SWEEP * 1000) / NODES.length);
    return () => clearInterval(t);
  }, []);
  const activeNode = NODES[idx];
  const active = hover ?? activeNode.key;

  return (
    <section
      className="flex flex-col overflow-hidden"
      style={{ background: OAT, color: INK }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 lg:px-8">
        {/* ---------------------------- HEADER ---------------------------- */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-3" style={{ borderBottom: `1px solid ${HAIR}` }}>
          <div>
            <div className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.22em", color: GREEN }}>
              Without Victoria vs. with Victoria
            </div>
            <h2
              className="mt-3 max-w-3xl"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                color: PLUM,
                fontWeight: 600,
              }}
            >
              Replace the permit office.{" "}
              <span style={{ fontStyle: "italic", color: INK }}>With Cleard.</span>
            </h2>
            <div
              className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: "0.16em", color: GREEN }}
            >
              <span>2-day plan review</span>
              <span aria-hidden style={{ color: LIGHT }}>·</span>
              <span>Same-day inspections</span>
              </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.span
              className="cl-round inline-block h-[7px] w-[7px]"
              style={{ background: PLUM }}
              animate={{ opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[9.5px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.16em", color: PLUM }}>
              Victoria active — continuous scan
            </span>
          </div>
        </div>

        {/* --------------------------- SPLIT GRID -------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT — without Victoria: scattered, out-of-sync paperwork */}
          <div
            className="flex min-h-[420px] flex-col lg:border-r lg:pr-6"
            style={{ borderColor: HAIR }}
          >
            <div className="text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.2em", color: "rgba(103,49,71,0.7)" }}>
              Without Victoria
            </div>

            <div
              className="relative mt-3 flex-1 overflow-hidden"
              style={{
                background: "rgba(103,49,71,0.035)",
                border: `1px solid ${HAIR_SOFT}`,
                minHeight: 340,
              }}
            >
              {/* misaligned grid, drifting out of register */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(103,49,71,0.10) 1px, transparent 1px), linear-gradient(91.4deg, rgba(103,49,71,0.10) 1px, transparent 1px)`,
                  backgroundSize: "38px 52px",
                  transform: "rotate(-1.4deg) scale(1.15)",
                }}
              />

              {CHAOS_CARDS.map((c) => (
                <div
                  key={c.t}
                  className="cl-chaos absolute"
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    width: c.w,
                    transform: `rotate(${c.r}deg)`,
                    background: CREAM,
                    border: `1px solid ${HAIR}`,
                    boxShadow: "3px 4px 0 rgba(103,49,71,0.07)",
                    padding: "7px 9px",
                    zIndex: c.z,
                  }}
                >
                  <div
                    className="text-[8.5px] uppercase"
                    style={{ fontFamily: MONO, letterSpacing: "0.16em", color: c.bad ? PLUM : "rgba(103,49,71,0.55)" }}
                  >
                    {c.tag}
                  </div>
                  <div className="mt-1 text-[12px] leading-tight" style={{ color: INK }}>
                    {c.t}
                  </div>
                  {c.meta ? (
                    <div
                      className="mt-1 text-[9px]"
                      style={{
                        fontFamily: MONO,
                        color: c.bad ? PLUM : TAN,
                        textDecoration: c.strike ? "line-through" : undefined,
                      }}
                    >
                      {c.meta}
                    </div>
                  ) : null}
                </div>
              ))}

              {/* fragmented, dead-end communication lines */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <g stroke="rgba(103,49,71,0.28)" strokeWidth="0.4" strokeDasharray="2 3" fill="none">
                  <path d="M18 26 L46 18" />
                  <path d="M52 34 L30 58" />
                  <path d="M62 62 L38 76" />
                  <path d="M24 70 L70 44" />
                </g>
              </svg>
            </div>

            <div
              className="mt-4 pt-3 text-[13px] leading-snug"
              style={{ borderTop: `1px solid ${HAIR}`, color: PLUM, fontFamily: SERIF, fontStyle: "italic" }}
            >
              Eight handoffs, four inboxes, nobody holding the schedule. Each one is a delay, a
              re-explanation, and another invoice.
            </div>
          </div>


          {/* RIGHT — compact orrery canvas */}
          <div
            className="cl-soft relative min-h-[420px] overflow-hidden"
            style={{ background: CREAM, border: `1px solid ${HAIR}` }}
          >
            {/* blueprint grid */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(142,90,56,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(142,90,56,0.10) 1px, transparent 1px)`,
                backgroundSize: "44px 44px",
              }}
            />
            <div
              className="absolute left-4 top-3 z-20 text-[9.5px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "rgba(142,90,56,0.8)" }}
            >
              With Victoria
            </div>

            {/* short orthogonal CAD legs */}
            <div className="pointer-events-none absolute inset-0">
              {NODES.map((n) => {
                const on = active === n.key;
                const vertical = n.side === "top" || n.side === "bottom";
                const style: React.CSSProperties = vertical
                  ? {
                      left: `${n.cx}%`,
                      top: `${Math.min(n.cy, 50)}%`,
                      height: `${Math.abs(50 - n.cy)}%`,
                      width: 1,
                    }
                  : {
                      top: `${n.cy}%`,
                      left: `${Math.min(n.cx, 50)}%`,
                      width: `${Math.abs(50 - n.cx)}%`,
                      height: 1,
                    };
                return (
                  <span
                    key={n.key}
                    className="absolute transition-colors duration-300"
                    style={{ ...style, background: on ? PLUM : CAD }}
                  />
                );
              })}
              {/* micro CAD annotations — offset clear of the legs */}
              <span
                className="absolute text-[7.5px] uppercase"
                style={{ left: "6%", bottom: "16%", fontFamily: MONO, letterSpacing: "0.14em", color: "rgba(142,90,56,0.55)" }}
              >
                CAD layer 17.1
              </span>
              <span
                className="absolute text-[7.5px] uppercase"
                style={{ right: "6%", top: "12%", fontFamily: MONO, letterSpacing: "0.14em", color: "rgba(142,90,56,0.55)" }}
              >
                Lat/Long 21.392.27
              </span>
            </div>

            {/* rotating sonar sweep — copper hue, confined */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: SWEEP, repeat: Infinity, ease: "linear" }}
              >
                <div
                  className="cl-round absolute inset-0"
                  style={{
                    background: `conic-gradient(from 0deg, rgba(185,128,85,0.26), rgba(226,178,124,0.14) 50deg, transparent 88deg, transparent 360deg)`,
                  }}
                />
                <div
                  className="absolute left-1/2 top-0 h-1/2 w-px origin-bottom"
                  style={{ background: `linear-gradient(to bottom, rgba(185,128,85,0.05), ${TAN_DEEP})` }}
                />
              </motion.div>
            </div>

            {/* central hub — real Cleard mark */}
            <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div
                className="cl-round grid h-[62px] w-[62px] place-items-center overflow-hidden"
                style={{
                  background: CREAM,
                  border: `2px solid ${PLUM}`,
                  boxShadow: "0 0 0 6px rgba(185,128,85,0.10)",
                }}
              >
                <img src={copperMark.url} alt="Cleard" className="h-[38px] w-[38px] object-contain" />
              </div>
            </div>

            {/* nodes */}
            {NODES.map((n) => {
              const on = active === n.key;
              return (
                <div
                  key={n.key}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${n.cx}%`, top: `${n.cy}%` }}
                  onMouseEnter={() => setHover(n.key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="relative">
                      {on && (
                        <motion.span
                          className="cl-round absolute inset-0"
                          style={{ border: `1px solid ${TAN}` }}
                          animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                      <motion.div
                        className="cl-round cl-copper relative grid h-[44px] w-[44px] place-items-center"
                        data-on={on ? "true" : "false"}
                        animate={{ scale: on ? 1.12 : 1 }}
                        transition={{ type: "spring", stiffness: 240, damping: 18 }}
                      >
                        <n.icon
                          className="relative h-[17px] w-[17px]"
                          strokeWidth={1.6}
                          style={{ color: "#FFF6E8", filter: "drop-shadow(0 1px 1px rgba(70,35,15,0.55))" }}
                        />
                      </motion.div>
                    </div>
                    <div
                      className={`absolute whitespace-nowrap text-[10px] uppercase ${n.labelPos}`}
                      style={{ fontFamily: MONO, letterSpacing: "0.16em", color: on ? PLUM : INK }}
                    >
                      {n.label}
                    </div>
                    <div
                      className={`absolute whitespace-nowrap text-[8px] uppercase transition-opacity duration-200 ${n.tipPos}`}
                      style={{
                        fontFamily: MONO,
                        letterSpacing: "0.12em",
                        color: TAN_DEEP,
                        opacity: on ? 1 : 0,
                      }}
                    >
                      {n.tip}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* overlay annotation line */}
            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 px-4">
              <Sparkle className="h-3 w-3 shrink-0" strokeWidth={1.7} style={{ color: TAN_DEEP }} />
              <span className="truncate text-[8.5px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.14em", color: TAN_DEEP }}>
                Victoria intelligence overlay — analyzing {activeNode.status}
              </span>
            </div>
          </div>
        </div>

        {/* --------------------------- BOTTOM ROW --------------------------- */}
        <div className="grid grid-cols-2 gap-3 pt-5 lg:grid-cols-4" style={{ borderTop: `1px solid ${HAIR}` }}>
          {ONE_CARDS.map((c) => (
            <motion.div
              key={c.head}
              className="cl-onecard flex flex-col items-center gap-2 px-4 py-5 text-center"
              style={{ background: CREAM, border: `1px solid ${HAIR_SOFT}` }}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <c.icon
                className="h-[22px] w-[22px] shrink-0"
                strokeWidth={1.4}
                style={{ color: PLUM }}
              />

              <div
                className="text-[15px] leading-none"
                style={{ fontFamily: SERIF, fontWeight: 600, color: PLUM, letterSpacing: "-0.02em" }}
              >
                {c.head}
              </div>
              <p className="text-[11.5px] leading-snug" style={{ color: INK }}>
                {c.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        .cl-handoff:hover { color: ${PLUM} !important; }
        .cl-chaos { transition: transform 220ms ease, box-shadow 220ms ease; }
        .cl-chaos:hover { transform: rotate(0deg) !important; box-shadow: 5px 6px 0 rgba(103,49,71,0.12); z-index: 20; }
        .cl-copper {
          background:
            linear-gradient(145deg, #F6DCB6 0%, #D79A62 24%, #A9683C 52%, #8E5A38 68%, #E9C49B 86%, #7A4A2C 100%);
          box-shadow:
            inset 0 1px 1px rgba(255,244,224,0.75),
            inset 0 -2px 4px rgba(70,35,15,0.55),
            0 2px 6px rgba(103,49,71,0.22);
          position: relative;
          overflow: hidden;
        }
        .cl-copper::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(115deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.28) 100%);
          pointer-events: none;
        }
        .cl-copper[data-on="true"] {
          box-shadow:
            inset 0 1px 1px rgba(255,246,230,0.85),
            inset 0 -2px 5px rgba(70,35,15,0.5),
            0 0 0 4px rgba(185,128,85,0.18),
            0 4px 12px rgba(103,49,71,0.28);
        }
        .cl-onecard { transition: box-shadow 220ms ease, border-color 220ms ease; }
        .cl-onecard:hover {
          border-color: rgba(103,49,71,0.35) !important;
          box-shadow: 0 12px 26px -14px rgba(103,49,71,0.4);
        }
      `}</style>
    </section>
  );
}



/* ========================= 5 · FEATURED TESTIMONIAL ===================== */

export function FeaturedTestimonial({
  items,
}: {
  items: { quote: string; name: string; role: string }[];
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);
  const t = items[i];
  return (
    <div className="mx-auto max-w-4xl text-center">
      <blockquote
        key={i}
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(1.6rem, 3.4vw, 2.5rem)",
          lineHeight: 1.18,
          letterSpacing: "-0.03em",
          color: PLUM,
          fontWeight: 500,
          animation: "clRise 420ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="mt-8 text-[12px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.16em", color: GRAY }}>
        {t.name} · {t.role}
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        {(
          [
            ["Previous review", -1, "‹"],
            ["Next review", 1, "›"],
          ] as const
        ).map(([label, dir, glyph]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => setI((v) => (v + dir + items.length) % items.length)}
            className="cl-glass inline-flex h-10 w-10 items-center justify-center text-[20px] leading-none transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(103,49,71,0.10)",
              border: "1px solid rgba(103,49,71,0.26)",
              backdropFilter: "blur(10px) saturate(140%)",
              color: PLUM,
            }}
          >
            {glyph}
          </button>
        ))}
      </div>
    </div>
  );
}


/* ======================= 6 · ASK VICTORIA (MARKETING) =================== */

const V_SUGGESTIONS = [
  "Check a permit requirement",
  "Find missing documents",
  "Check my deadlines",
];

export function AskVictoriaLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-[60] w-[320px]"
          style={{ background: DARK, border: `1px solid ${DARK_LINE}`, boxShadow: "0 26px 60px rgba(43,22,32,0.34)", animation: "clRise 260ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DARK_LINE}` }}>
            <span className="flex items-center gap-2 text-[12.5px]" style={{ color: OFF }}>
              <Sparkle className="h-3.5 w-3.5" style={{ color: PLUM_LT }} strokeWidth={1.75} /> Victoria
            </span>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ color: "rgba(250,243,230,0.5)" }}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4">
            <div className="text-[13.5px]" style={{ color: OFF }}>
              What are you working on?
            </div>
            <div className="mt-3 px-3 py-2.5 text-[12.5px]" style={{ background: DARK_2, border: `1px solid ${DARK_LINE}`, color: "rgba(250,243,230,0.42)" }}>
              Ask anything...
            </div>
            <div className="mt-4 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "rgba(250,243,230,0.4)" }}>
              Try
            </div>
            <div className="mt-2.5 space-y-2">
              {V_SUGGESTIONS.map((s) => (
                <div key={s} className="flex items-center gap-2 text-[12.5px]" style={{ color: "rgba(250,243,230,0.7)" }}>
                  <span className="inline-block h-1 w-1" style={{ background: PLUM_LT, borderRadius: 999 }} />
                  {s}
                </div>
              ))}
            </div>
            <Link
              to="/join"
              hash="request"
              onClick={() => setOpen(false)}
              className="cl-hoverable mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-[12.5px] no-underline"
              style={{ background: PLUM, color: OAT, fontWeight: 600 }}
            >
              Get access to Victoria <ArrowRight className="cl-arrow h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-6 right-5 z-[60] inline-flex items-center gap-2.5 px-5 py-3 text-[12.5px]"
        style={{ background: DARK, color: OAT, border: `1px solid ${PLUM_LT}`, boxShadow: "0 14px 30px rgba(43,22,32,0.28)", fontWeight: 600 }}
      >
        <span className="inline-block h-1.5 w-1.5" style={{ background: GREEN_LT, borderRadius: 999, animation: "clPulse 1.8s ease-in-out infinite" }} />
        Ask Victoria
      </button>
    </>
  );
}
