import { useEffect, useState } from "react";
import cLogo from "@/assets/cleard-c-copper.png.asset.json";

/* Nordic Luxury tokens (marketing only) */
const OAT = "#FAF3E6";
const BORDER = "#E0D3BC";
const PLUM = "#673147";
const GREEN = "#2F4F4F";
const INK = "#2F4F4F";
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';

/* --------------------------- act 1: capability boxes --------------------------- */

type Box = {
  label: string;
  meta: string;
  /* final position, % of stage */
  x: number;
  y: number;
};

const BOXES: Box[] = [
  { label: "Permitting Administration", meta: "Submitted · tracked", x: 6, y: 12 },
  { label: "Private Plan Review", meta: "2-day plan review", x: 68, y: 8 },
  { label: "Inspections", meta: "Same-day inspections", x: 74, y: 40 },
  { label: "License Management", meta: "36 licenses current", x: 4, y: 46 },
  { label: "Insurance Compliance", meta: "184 COIs valid", x: 10, y: 76 },
  { label: "Lien Rights", meta: "NOC recorded", x: 66, y: 72 },
];

type Act = "boxes" | "app";

function CapabilityStage({ live }: { live: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* the mark, hovering */}
      <div
        className="absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 lg:h-[190px] lg:w-[190px]"
        style={{
          animation: live ? "clHover 5s ease-in-out infinite" : undefined,
          filter: "drop-shadow(0 26px 34px rgba(43,22,32,0.22))",
        }}
      >
        <img src={cLogo.url} alt="Cleard" className="h-full w-full object-contain" />
      </div>

      {/* boxes popping out of the mark */}
      {BOXES.map((b, i) => (
        <div
          key={b.label}
          className="absolute w-[168px] px-3.5 py-3 lg:w-[196px]"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            background: OAT,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 14px 30px rgba(43,22,32,0.10)",
            opacity: live ? 0 : 1,
            animation: live
              ? `clBoxPop 720ms cubic-bezier(0.16,1,0.3,1) ${360 + i * 150}ms both`
              : undefined,
          }}
        >
          <div
            className="text-[11.5px] leading-tight"
            style={{ color: PLUM, fontWeight: 600 }}
          >
            {b.label}
          </div>
          <div
            className="mt-1.5 text-[9px] uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.14em", color: GREEN, opacity: 0.75 }}
          >
            {b.meta}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ act 2: app window ----------------------------- */

const TABS = ["Dashboard", "My Permits", "Inspections"] as const;

const DASH_METRICS = [
  ["Active permits", "17"],
  ["On time", "94%"],
  ["Avg review", "48h"],
  ["Open corrections", "2"],
];

const PERMIT_ROWS = [
  ["CLR-2026-0208", "14 Pelican Bay Ln", "Approved"],
  ["CLR-2026-0211", "82 Harbour Ridge", "In review"],
  ["CLR-2026-0214", "6 Crosswind Ct", "Submitted"],
  ["CLR-2026-0219", "331 Meridian Ave", "Approved"],
];

const INSPECTION_ROWS = [
  ["Structural framing", "Today · 9:40 AM", "Passed"],
  ["Electrical rough", "Today · 1:15 PM", "Scheduled"],
  ["Plumbing top-out", "Tomorrow", "Scheduled"],
  ["Final building", "Aug 27", "Queued"],
];

function statusTone(s: string) {
  if (s === "Approved" || s === "Passed") return GREEN;
  if (s === "In review" || s === "Scheduled") return PLUM;
  return "#8B7A6B";
}

function AppWindow({ tab }: { tab: number }) {
  return (
    <div
      className="w-[min(100%,720px)]"
      style={{
        background: "#241017",
        border: `1px solid rgba(250,243,230,0.14)`,
        boxShadow: "0 40px 80px rgba(43,22,32,0.28)",
        animation: "clAppIn 700ms cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* chrome */}
      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(250,243,230,0.12)" }}
      >
        <img src={cLogo.url} alt="" className="h-4 w-4 object-contain" />
        <span style={{ fontFamily: SERIF, color: OAT, fontSize: 13, fontWeight: 600 }}>
          Cleard
        </span>
        <div className="ml-auto flex gap-4">
          {TABS.map((t, i) => (
            <span
              key={t}
              className="text-[10px] uppercase transition-all duration-300"
              style={{
                fontFamily: MONO,
                letterSpacing: "0.14em",
                color: i === tab ? OAT : "rgba(250,243,230,0.42)",
                borderBottom: i === tab ? `1px solid ${OAT}` : "1px solid transparent",
                paddingBottom: 3,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div key={tab} className="p-4" style={{ animation: "clTabIn 420ms ease-out both" }}>
        {tab === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DASH_METRICS.map(([label, value]) => (
              <div
                key={label}
                className="px-3 py-4"
                style={{ border: "1px solid rgba(250,243,230,0.12)" }}
              >
                <div
                  className="text-[8.5px] uppercase"
                  style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(250,243,230,0.5)" }}
                >
                  {label}
                </div>
                <div
                  className="mt-2"
                  style={{ fontFamily: SERIF, fontSize: 30, color: OAT, lineHeight: 1 }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {(tab === 1 || tab === 2) && (
          <div>
            {(tab === 1 ? PERMIT_ROWS : INSPECTION_ROWS).map((r) => (
              <div
                key={r[0]}
                className="flex items-center gap-3 py-2.5"
                style={{ borderBottom: "1px solid rgba(250,243,230,0.09)" }}
              >
                <span
                  className="w-[42%] truncate text-[11px]"
                  style={{ color: OAT, fontWeight: 500 }}
                >
                  {r[0]}
                </span>
                <span
                  className="hidden flex-1 truncate text-[10px] sm:block"
                  style={{ fontFamily: MONO, color: "rgba(250,243,230,0.5)" }}
                >
                  {r[1]}
                </span>
                <span
                  className="ml-auto px-2 py-1 text-[8.5px] uppercase"
                  style={{
                    fontFamily: MONO,
                    letterSpacing: "0.14em",
                    color: OAT,
                    background: statusTone(r[2]),
                  }}
                >
                  {r[2]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- the stage --------------------------------- */

export function HeroStage() {
  const [act, setAct] = useState<Act>("boxes");
  const [tab, setTab] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const r =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (r) {
      setReduced(true);
      return;
    }
    let t: number;
    const toApp = () => {
      setAct("app");
      setTab(0);
      t = window.setTimeout(() => setTab(1), 2600);
      t = window.setTimeout(() => setTab(2), 5000);
      t = window.setTimeout(() => setAct("boxes"), 7600);
      t = window.setTimeout(toApp, 13600);
    };
    t = window.setTimeout(toApp, 5200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full">
      <style>{`
        @keyframes clHover {
          0%,100% { transform: translateY(-6px) rotate(-1.5deg); }
          50% { transform: translateY(8px) rotate(1.5deg); }
        }
        @keyframes clBoxPop {
          from { opacity: 0; transform: translate(calc(var(--dx,0) * 1px), 0) scale(0.72); filter: blur(3px); }
          to { opacity: 1; transform: none; scale: 1; filter: blur(0); }
        }
        @keyframes clAppIn {
          from { opacity: 0; transform: translateY(14px) scale(0.94); }
          to { opacity: 1; transform: none; }
        }
        @keyframes clTabIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* dotted field, Ramp-style */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${INK}22 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          maskImage: "radial-gradient(60% 60% at 50% 50%, #000 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(60% 60% at 50% 50%, #000 0%, transparent 100%)",
        }}
      />

      <div className="relative h-[420px] sm:h-[460px] lg:h-[520px]">
        {reduced || act === "boxes" ? (
          <CapabilityStage live={!reduced} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <AppWindow tab={tab} />
          </div>
        )}
      </div>
    </div>
  );
}

export default HeroStage;
