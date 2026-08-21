import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  FileCheck2,
  FolderOpen,
  Scale,
  Send,
  ShieldCheck,
  Sparkle,
  Users,
  X,
} from "lucide-react";

/* ----------------------- LOCKED NORDIC LUXURY TOKENS ---------------------- */

const OAT = "#FAF3E6";
const OFF = "#F3EAD9";
const INK = "#2F4F4F";
const GRAY = "#7A5C68";
const LIGHT = "#8B9A97";
const PLUM = "#673147";
const PLUM_LT = "#D9AFC1";
const GREEN = "#2F4F4F";
const GREEN_LT = "#9CBEB2";
const BORDER = "#E0D3BC";
const DARK = "#241017";
const DARK_2 = "#2F4F4F";
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
              94%
            </div>
            <div className="mt-1.5 text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: "rgba(250,243,230,0.5)" }}>
              On time
            </div>
          </div>
        </div>
        <div className="mt-3 h-[3px] w-full" style={{ background: "rgba(250,243,230,0.12)" }}>
          <div style={{ width: "94%", height: "100%", background: GREEN_LT, transition: "width 900ms ease" }} />
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

/* ================== 4 · BEFORE / AFTER + ARCHITECTURE =================== */

const BEFORE = [
  "Permit expediter",
  "County counter",
  "Plan reviewer",
  "Inspector scheduling",
  "License tracker",
  "COI spreadsheet",
  "Lien service",
  "Phone calls and email",
];

const PILLARS = [
  { icon: Send, label: "Permits" },
  { icon: FileCheck2, label: "Plan review & inspections" },
  { icon: ShieldCheck, label: "Licenses" },
  { icon: Users, label: "Insurance" },
  { icon: Scale, label: "Lien rights" },
  { icon: FolderOpen, label: "Documents" },
];

export function ReplaceThePermitOffice() {
  return (
    <section style={{ background: OAT }}>
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 md:py-28">
        <div className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.22em", color: GREEN }}>
          Before and after
        </div>
        <h2
          className="mt-6 max-w-3xl"
          style={{ fontFamily: SERIF, fontSize: "clamp(2rem, 3.9vw, 3.05rem)", lineHeight: 1.04, letterSpacing: "-0.035em", color: PLUM, fontWeight: 600 }}
        >
          Replace the permit office.
          <br />
          <span style={{ fontStyle: "italic", color: INK }}>With Cleard.</span>
        </h2>

        <div
          className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 text-[11px] uppercase"
          style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO, letterSpacing: "0.16em", color: GREEN }}
        >
          <span>2-day plan review</span>
          <span aria-hidden style={{ color: LIGHT }}>·</span>
          <span>Same-day inspections</span>
          <span aria-hidden style={{ color: LIGHT }}>·</span>
          <span>By invitation</span>
        </div>


        <div className="mt-14 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          {/* BEFORE — a chain */}
          <div className="p-7" style={{ background: OFF, border: `1px solid ${BORDER}` }}>
            <div className="text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.2em", color: GRAY }}>
              Before · eight handoffs
            </div>
            <div className="mt-6 space-y-0">
              {BEFORE.map((b, idx) => (
                <div key={b}>
                  <div className="flex items-center gap-3 py-1.5 text-[13.5px]" style={{ color: GRAY }}>
                    <span className="text-[10px] tabular-nums" style={{ fontFamily: MONO, color: LIGHT }}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {b}
                  </div>
                  {idx < BEFORE.length - 1 && (
                    <span className="ml-[9px] block h-3 w-px" style={{ background: BORDER }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 text-[12px]" style={{ borderTop: `1px solid ${BORDER}`, color: LIGHT }}>
              Each handoff is a delay, a re-explanation, and another invoice.
            </div>
          </div>

          {/* AFTER — one system */}
          <div className="relative p-7 md:p-10" style={{ background: DARK, border: `1px solid ${DARK_LINE}` }}>
            <div className="text-[10px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.2em", color: GREEN_LT }}>
              After · one system
            </div>
            <div className="mt-8 text-center">
              <div className="inline-block px-7 py-4" style={{ background: DARK_2, border: `1px solid ${DARK_LINE}` }}>
                <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: OFF, letterSpacing: "-0.03em" }}>
                  Cleard
                </span>
              </div>
              <div className="mx-auto h-8 w-px" style={{ background: "rgba(250,243,230,0.2)" }} />
              <div className="grid gap-px sm:grid-cols-3" style={{ background: DARK_LINE }}>
                {PILLARS.map((p) => (
                  <div key={p.label} className="flex flex-col items-center gap-2.5 px-3 py-6" style={{ background: DARK_2 }}>
                    <p.icon className="h-[18px] w-[18px]" style={{ color: GREEN_LT }} strokeWidth={1.5} />
                    <span className="text-[11px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.12em", color: "rgba(250,243,230,0.7)" }}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mx-auto h-8 w-px" style={{ background: "rgba(250,243,230,0.2)" }} />
              <div className="inline-flex items-center gap-2 px-6 py-3" style={{ border: `1px solid ${PLUM_LT}` }}>
                <Sparkle className="h-3.5 w-3.5" style={{ color: PLUM_LT }} strokeWidth={1.75} />
                <span className="text-[11px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.18em", color: PLUM_LT }}>
                  Victoria · across all of it
                </span>
              </div>
            </div>
            <p className="mt-9 text-[14px] leading-relaxed" style={{ color: "rgba(250,243,230,0.56)" }}>
              Your team builds. Cleard handles everything around it — one login, one team, one
              invoice, every jurisdiction you work in.
            </p>
          </div>
        </div>
      </div>
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
