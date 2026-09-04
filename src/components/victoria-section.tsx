import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  PenLine,
  Send,
  Compass,
  Sparkle,
} from "lucide-react";
import siteImg from "@/assets/victoria-site.jpg";

/* --------------------- LOCKED NORDIC LUXURY TOKENS ----------------------- */
const OAT = "#FFFFFF";
const INK = "#000000";
const GRAY = "#6B6B6B";
const PLUM = "#000000";
const BORDER = "#E5E5E5";
const COPPER = "#9C6B3F";
const COPPER_LT = "#9C6B3F";
const DARK = "#FFFFFF";
const PLUM_DEEP = "#FFFFFF";
const SERIF = '"Instrument Sans", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';

const METRICS = [
  { icon: Eye, value: "17", label: ["Projects", "monitored"] },
  { icon: FileText, value: "4,821", label: ["Documents", "analyzed"] },
  { icon: AlertTriangle, value: "12", label: ["Risks", "detected"] },
  { icon: CheckCircle2, value: "38", label: ["Actions", "prepared"] },
];

type Card = {
  id: string;
  project: string;
  name: string;
  status: string[];
  tone: "warn" | "copper" | "green";
  detail: string;
  action?: string;
  note?: string;
  /** placement inside the dark stage */
  pos: string;
};

const CARDS: Card[] = [
  {
    id: "c07",
    project: "Project 07",
    name: "Coastal Roofing",
    status: ["COI expiring", "in 23 days"],
    tone: "warn",
    detail: "Renewal drafted",
    action: "Ready for review",
    pos: "left-[3%] top-[13%]",
  },
  {
    id: "c03",
    project: "Project 03",
    name: "Meridian Mechanical",
    status: ["Permit response", "required"],
    tone: "green",
    detail: "Response drafted",
    action: "Review now",
    pos: "right-[3%] top-[16%]",
  },
  {
    id: "c02",
    project: "Project 02",
    name: "Harbor View",
    status: ["Inspection", "scheduled"],
    tone: "green",
    detail: "Thu, 09:30 AM",
    note: "Calendar updated",
    pos: "left-[16%] bottom-[9%] hidden sm:block",
  },
  {
    id: "c12",
    project: "Project 12",
    name: "Northstar Electric",
    status: ["Drawing revision", "detected"],
    tone: "copper",
    detail: "148 drawings",
    action: "See changes",
    pos: "right-[2%] bottom-[16%] hidden sm:block",
  },
];

/* copper intelligence paths, viewBox 1000 x 820 */
const PATHS = [
  "M60,470 C220,600 420,600 520,470 C620,340 820,330 960,430",
  "M120,300 C260,180 460,200 560,320 C660,440 830,470 950,400",
  "M200,700 C330,760 520,720 620,620 C720,520 860,520 970,590",
  "M40,380 C160,300 240,420 380,430 C520,440 560,540 700,520",
  "M660,180 C760,240 800,340 880,380",
  "M420,760 C560,700 640,640 800,660",
];

const NODES = [
  { x: 520, y: 470 },
  { x: 560, y: 320 },
  { x: 880, y: 380 },
  { x: 620, y: 620 },
];

const STEPS = [
  { n: "01", icon: FileText, title: "She reads", lines: ["Drawings", "Submittals", "Certificates", "Correspondence"] },
  { n: "02", icon: Compass, title: "She understands", lines: ["Jurisdictions", "Requirements", "Rules", "Dependencies"] },
  { n: "03", icon: Eye, title: "She watches", lines: ["Deadlines", "Changes", "Risks", "Expirations"] },
  { n: "04", icon: PenLine, title: "She anticipates", lines: ["Problems before", "they happen"] },
  { n: "05", icon: Send, title: "She acts", lines: ["Drafts responses", "Alerts your team", "Escalates issues", "Prepares next steps"] },
];

/* ------------------------------- SECTION -------------------------------- */

export function VictoriaSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { once: true, amount: 0.25 });
  const reduced = useReducedMotion();

  return (
    <>
      <style>{`
        @keyframes vNodePulse { 0%,100% { opacity:.9; transform:scale(1);} 50% { opacity:.35; transform:scale(1.5);} }
        @keyframes vBlink { 0%,100% { opacity:1;} 50% { opacity:.25;} }
        @keyframes vDrift { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-6px);} }
        @keyframes vFlow { to { stroke-dashoffset: -240; } }
        .v-cta .cl-arrow, .v-card .cl-arrow { transition: transform 220ms cubic-bezier(0.16,1,0.3,1); }
        .v-cta:hover .cl-arrow { transform: translateX(5px); }
        .v-card { animation: vDrift 9s ease-in-out infinite; }
        .v-card:nth-child(2n) { animation-duration: 11s; animation-delay: -3s; }
        @media (prefers-reduced-motion: reduce) {
          .v-card, .v-node, .v-blink, .v-flow { animation: none !important; }
        }
      `}</style>

      <section
        id="victoria"
        className="grid lg:grid-cols-[40%_60%]"
        style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
      >
        {/* ---------------------- LEFT · EDITORIAL --------------------- */}
        <div style={{ background: OAT }} className="flex items-center px-6 py-20 sm:px-10 lg:px-14 lg:py-28">
          <div className="mx-auto w-full max-w-[430px]">
            <div
              className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase"
              style={{ letterSpacing: "0.22em", color: PLUM, fontFamily: MONO }}
            >
              <Sparkle className="h-3.5 w-3.5" style={{ color: COPPER }} strokeWidth={1.6} />
              The intelligence layer
            </div>

            <h2
              className="mt-8"
              style={{
                fontFamily: SERIF,
                fontSize: "clamp(2.3rem, 3.4vw, 3.3rem)",
                lineHeight: 1.03,
                letterSpacing: "-0.04em",
                color: PLUM,
                fontWeight: 600,
              }}
            >
              Meet Victoria.
              <br />
              <span style={{ fontStyle: "italic", color: INK }}>
                Your project
                <br />
                intelligence.
              </span>
            </h2>

            <p className="mt-8 text-[16px] leading-[1.8]" style={{ color: GRAY }}>
              Victoria watches every drawing, jurisdiction rule, certificate and deadline across
              your projects, continuously. She flags what matters before it becomes a problem,
              drafts the response, and tells your team exactly what to do next.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-y-0">
              {METRICS.map((m) => (
                <div key={m.value}>
                  <m.icon className="h-[18px] w-[18px]" strokeWidth={1.4} style={{ color: INK }} />
                  <div
                    className="mt-4 tabular-nums"
                    style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1, letterSpacing: "-0.03em", color: PLUM, fontWeight: 600 }}
                  >
                    {m.value}
                  </div>
                  <div
                    className="mt-2.5 text-[9.5px] uppercase leading-[1.5]"
                    style={{ fontFamily: MONO, letterSpacing: "0.16em", color: GRAY }}
                  >
                    {m.label[0]}
                    <br />
                    {m.label[1]}
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#watch-it-run"
              className="v-cta mt-14 inline-flex items-center gap-3 pb-2 text-[15px]"
              style={{ color: PLUM, borderBottom: `1px solid ${COPPER}`, fontFamily: SERIF }}
            >
              See Victoria in action
              <ArrowRight className="cl-arrow h-4 w-4" strokeWidth={1.6} style={{ color: COPPER }} />
            </a>
          </div>
        </div>

        {/* --------------------- RIGHT · VICTORIA'S WORLD -------------- */}
        <div
          ref={stageRef}
          className="relative min-h-[520px] overflow-hidden lg:min-h-[760px]"
          style={{ background: DARK }}
        >
          {/* construction scene */}
          <motion.img
            src={siteImg}
            alt="Aerial visualization of an active construction portfolio monitored by Victoria"
            width={1440}
            height={1200}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={inView ? { opacity: 0.3, scale: 1 } : {}}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 90% at 55% 45%, rgba(255,255,255,0.55), rgba(255,255,255,0.92) 78%)`,
            }}
          />
          {/* blueprint grid */}
          <div
            className="absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                `linear-gradient(${COPPER} 1px, transparent 1px), linear-gradient(90deg, ${COPPER} 1px, transparent 1px)`,
              backgroundSize: "88px 88px",
            }}
          />

          {/* copper intelligence paths + nodes */}
          <svg
            viewBox="0 0 1000 820"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <filter id="vGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g filter="url(#vGlow)">
              {PATHS.map((d, i) => (
                <motion.path
                  key={d}
                  d={d}
                  fill="none"
                  stroke={COPPER_LT}
                  strokeWidth={1.1}
                  strokeOpacity={0.62}
                  initial={{ pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: reduced ? 0 : 2.1, delay: reduced ? 0 : 0.35 + i * 0.22, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </g>

            {/* subtle travelling light along two paths */}
            {!reduced &&
              [PATHS[0], PATHS[2]].map((d, i) => (
                <path
                  key={`flow-${i}`}
                  className="v-flow"
                  d={d}
                  fill="none"
                  stroke={COPPER_LT}
                  strokeWidth={1.6}
                  strokeOpacity={0.85}
                  strokeDasharray="26 300"
                  style={{ animation: `vFlow ${11 + i * 4}s linear infinite`, filter: "url(#vGlow)" }}
                />
              ))}

            {NODES.map((n, i) => (
              <motion.g
                key={`${n.x}-${n.y}`}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.7, delay: reduced ? 0 : 1.2 + i * 0.32 }}
              >
                <circle
                  className="v-node"
                  cx={n.x}
                  cy={n.y}
                  r={13}
                  fill="none"
                  stroke={COPPER}
                  strokeWidth={0.8}
                  strokeOpacity={0.5}
                  style={{ animation: `vNodePulse ${3.4 + i * 0.5}s ease-in-out infinite`, transformOrigin: `${n.x}px ${n.y}px` }}
                />
                <circle cx={n.x} cy={n.y} r={7} fill="none" stroke={COPPER_LT} strokeWidth={1} strokeOpacity={0.8} />
                <circle cx={n.x} cy={n.y} r={2.4} fill={COPPER_LT} filter="url(#vGlow)" />
              </motion.g>
            ))}
          </svg>

          {/* top bar */}
          <div
            className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pb-4 pt-6 sm:px-7"
            style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.2em", color: "rgba(43,22,32,0.72)" }}
          >
            <span className="flex items-center gap-2 uppercase">
              Victoria / Live
              <span
                className="v-blink inline-block h-[5px] w-[5px] rounded-full cl-dot"
                style={{ background: COPPER, animation: "vBlink 2.2s ease-in-out infinite" }}
              />
            </span>
            <span className="hidden items-center gap-2 uppercase sm:flex">
              <span className="inline-block h-[5px] w-[5px] rounded-full cl-dot" style={{ background: COPPER }} />
              Monitoring 17 projects
            </span>
          </div>

          {/* floating intelligence cards */}
          {CARDS.map((c, i) => (
            <motion.div
              key={c.id}
              className={`absolute w-[190px] sm:w-[212px] ${c.pos}`}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, delay: reduced ? 0 : 1.5 + i * 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="v-card">
                <IntelCard card={c} />
              </div>
            </motion.div>
          ))}

          {/* bottom bar */}
          <div
            className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-7"
            style={{ borderTop: "1px solid rgba(201,138,91,0.28)", background: "rgba(255,255,255,0.82)" }}
          >
            <span className="text-[13px]" style={{ color: "rgba(43,22,32,0.9)", fontFamily: SERIF }}>
              Victoria is watching your projects, 24/7.
            </span>
            <span
              className="hidden items-center gap-2 uppercase sm:flex"
              style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.2em", color: "rgba(43,22,32,0.6)" }}
            >
              <span
                className="v-blink inline-block h-[5px] w-[5px] rounded-full cl-dot"
                style={{ background: COPPER, animation: "vBlink 3s ease-in-out infinite" }}
              />
              Last updated 2 min ago
            </span>
          </div>
        </div>
      </section>

      {/* ------------------ HOW VICTORIA THINKS ------------------- */}
      <section style={{ background: PLUM_DEEP }}>
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_2.6fr] lg:items-start">
            <div>
              <h3
                style={{ fontFamily: SERIF, fontSize: "clamp(1.8rem,2.6vw,2.3rem)", lineHeight: 1.06, letterSpacing: "-0.035em", color: INK, fontWeight: 600 }}
              >
                How Victoria thinks.
              </h3>
              <div className="mt-2" style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: COPPER_LT }}>
                From data to action.
              </div>
            </div>

            <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s, i) => (
                <div key={s.n} className="relative">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-full cl-dot"
                    style={{ border: "1px solid rgba(201,138,91,0.45)" }}
                  >
                    <s.icon className="h-[17px] w-[17px]" strokeWidth={1.4} style={{ color: INK }} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <span
                      className="absolute left-[52px] top-[22px] hidden h-px lg:block"
                      style={{
                        width: "calc(100% - 52px)",
                        backgroundImage: `linear-gradient(90deg, rgba(201,138,91,0.5) 0 6px, transparent 6px 12px)`,
                        backgroundSize: "12px 1px",
                      }}
                    />
                  )}
                  <div
                    className="mt-6 text-[10.5px] uppercase"
                    style={{ fontFamily: MONO, letterSpacing: "0.18em", color: INK }}
                  >
                    {s.n} — {s.title}
                  </div>
                  <div className="mt-3 space-y-1 text-[13.5px] leading-[1.6]" style={{ color: "rgba(43,22,32,0.62)" }}>
                    {s.lines.map((l) => (
                      <div key={l}>{l}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------ INTEL CARD ------------------------------- */

function IntelCard({ card }: { card: Card }) {
  const dot = card.tone === "warn" ? COPPER : card.tone === "copper" ? COPPER_LT : COPPER;
  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: "rgba(255,255,255,0.86)",
        border: "1px solid rgba(201,138,91,0.4)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 18px 40px rgba(43,22,32,0.12)",
      }}
    >
      <div className="text-[9px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.2em", color: "rgba(43,22,32,0.5)" }}>
        {card.project}
      </div>
      <div className="mt-1 text-[11.5px] uppercase" style={{ fontFamily: MONO, letterSpacing: "0.13em", color: INK }}>
        {card.name}
      </div>
      <div className="my-3 h-px" style={{ background: "rgba(201,138,91,0.28)" }} />
      <div className="flex items-start gap-2">
        {card.tone === "warn" ? (
          <AlertTriangle className="mt-[2px] h-3 w-3 shrink-0" strokeWidth={1.6} style={{ color: dot }} />
        ) : (
          <span
            className="v-blink mt-[5px] inline-block h-[5px] w-[5px] shrink-0 rounded-full cl-dot"
            style={{ background: dot, animation: "vBlink 2.6s ease-in-out infinite" }}
          />
        )}
        <div className="text-[10px] uppercase leading-[1.55]" style={{ fontFamily: MONO, letterSpacing: "0.14em", color: dot }}>
          {card.status[0]}
          <br />
          {card.status[1]}
        </div>
      </div>
      <div className="mt-3 text-[12px]" style={{ color: "rgba(43,22,32,0.8)", fontFamily: SERIF }}>
        {card.detail}
      </div>
      {card.note && (
        <div className="mt-1.5 text-[11.5px]" style={{ color: "rgba(43,22,32,0.55)", fontFamily: SERIF }}>
          {card.note}
        </div>
      )}
      {card.action && (
        <span
          className="cl-hoverable mt-3 inline-flex items-center gap-1.5 text-[11.5px]"
          style={{ color: INK, fontFamily: SERIF }}
        >
          {card.action}
          <ArrowRight className="cl-arrow h-3 w-3" strokeWidth={1.7} style={{ color: COPPER_LT }} />
        </span>
      )}
    </div>
  );
}
