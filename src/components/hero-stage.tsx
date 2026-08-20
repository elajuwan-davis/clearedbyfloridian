import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import cLogo from "@/assets/cleard-c-copper.png.asset.json";

/* Nordic Luxury tokens (marketing only) */
const OAT = "#FAF3E6";
const PAPER = "#FFFDF7";
const BORDER = "#E0D3BC";
const PLUM = "#673147";
const INK = "#2B1620";
const GREEN = "#2F4F4F";
const BRONZE = "#9C6B3F";
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';

const FRAME_H = 640;

/* ------------------------------ small helpers ------------------------------ */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** counts up to `to`, then holds, then drifts by small live increments */
function useLiveNumber(to: number, { live = 0, period = 2600 }: { live?: number; period?: number } = {}) {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, reduced]);

  useEffect(() => {
    if (reduced || !live) return;
    const id = window.setInterval(() => {
      setValue((v) => {
        const next = v + Math.round((Math.random() * 2 - 0.6) * live);
        return Math.max(to - live * 2, Math.min(to + live * 3, next));
      });
    }, period);
    return () => window.clearInterval(id);
  }, [live, period, to, reduced]);

  return value;
}

function Eyebrow({ children, color = GREEN }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[8px] uppercase"
      style={{ fontFamily: MONO, letterSpacing: "0.18em", color, opacity: 0.85 }}
    >
      {children}
    </div>
  );
}

function Meter({ pct, color = PLUM }: { pct: number; color?: string }) {
  return (
    <div className="h-[3px] w-full overflow-hidden" style={{ background: "rgba(43,22,32,0.10)" }}>
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: color,
          transition: "width 900ms cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  );
}

function Chip({ label, tone = "green" }: { label: string; tone?: "green" | "plum" | "bronze" }) {
  const bg = tone === "green" ? GREEN : tone === "bronze" ? BRONZE : PLUM;
  return (
    <span
      className="shrink-0 px-1.5 py-[2px] text-[7.5px] uppercase"
      style={{ fontFamily: MONO, letterSpacing: "0.14em", color: OAT, background: bg }}
    >
      {label}
    </span>
  );
}

/* ------------------------------- orbit cards -------------------------------- */

type OrbitCard = {
  key: string;
  title: string;
  story: string;
  body: (active: boolean) => React.ReactNode;
};

function PermitBody({ active }: { active: boolean }) {
  const [pcts, setPcts] = useState([64, 38]);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setPcts(([a, b]) => [a >= 96 ? 42 : a + 6, b >= 96 ? 21 : b + 9]);
    }, 1800);
    return () => window.clearInterval(id);
  }, [reduced]);
  return (
    <div className="space-y-2">
      {(["CLR-2026-0208", "CLR-2026-0211"] as const).map((id, i) => (
        <div key={id}>
          <div className="flex items-baseline justify-between">
            <span className="text-[9.5px]" style={{ color: INK, fontWeight: 600 }}>
              {id}
            </span>
            <span className="text-[8.5px]" style={{ fontFamily: MONO, color: GREEN }}>
              {pcts[i]}%
            </span>
          </div>
          <div className="mt-1">
            <Meter pct={pcts[i]} color={active ? BRONZE : PLUM} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewBody() {
  const hours = useLiveNumber(48, { live: 1, period: 2400 });
  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-1.5">
        <span style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1, color: PLUM }}>{hours}h</span>
        <span className="pb-[3px] text-[8px] uppercase" style={{ fontFamily: MONO, color: GREEN }}>
          avg review
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9.5px]" style={{ color: INK }}>
          Structural set · Rev 02
        </span>
        <Chip label="Cleared" />
      </div>
    </div>
  );
}

function InspectionBody() {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const rows = useMemo(
    () =>
      [
        ["14 Pelican Bay Ln", "Structural", true],
        ["82 Harbour Ridge", "Electrical", false],
        ["9 Ocean Ridge Way", "Plumbing", true],
      ] as Array<[string, string, boolean]>,
    [],
  );
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % rows.length), 1700);
    return () => window.clearInterval(id);
  }, [reduced, rows.length]);
  return (
    <div className="space-y-1.5">
      {rows.map(([addr, trade, ok], idx) => (
        <div
          key={addr}
          className="flex items-center gap-2"
          style={{
            opacity: idx === i ? 1 : 0.45,
            transform: idx === i ? "translateX(2px)" : "none",
            transition: "all 500ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="min-w-0 flex-1 truncate text-[9.5px]" style={{ color: INK }}>
            {addr}
            <span style={{ color: GREEN, opacity: 0.7 }}> · {trade}</span>
          </span>
          {idx === i ? <Chip label={ok ? "Passed" : "Correction"} tone={ok ? "green" : "plum"} /> : null}
        </div>
      ))}
    </div>
  );
}

function LicenseBody() {
  const n = useLiveNumber(36, { live: 1, period: 3200 });
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1, color: PLUM }}>{n}</span>
        <Chip label="All current" />
      </div>
      <Meter pct={100} color={GREEN} />
      <div className="text-[8.5px] uppercase" style={{ fontFamily: MONO, color: GREEN }}>
        0 expiring · 90d window
      </div>
    </div>
  );
}

function InsuranceBody() {
  const n = useLiveNumber(184, { live: 2, period: 2600 });
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1, color: PLUM }}>{n}</span>
        <span className="text-[8.5px] uppercase" style={{ fontFamily: MONO, color: GREEN }}>
          COIs valid
        </span>
      </div>
      <Meter pct={97} color={PLUM} />
      <div className="flex items-center justify-between">
        <span className="text-[9.5px]" style={{ color: INK }}>
          Roofing · Gen. liability
        </span>
        <Chip label="Verified" />
      </div>
    </div>
  );
}

function LienBody() {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();
  const docs = [
    ["Notice of Commencement", "Recorded Aug 12"],
    ["Conditional Waiver", "Recorded Aug 18"],
    ["Final Release", "Awaiting signature"],
  ];
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % docs.length), 1900);
    return () => window.clearInterval(id);
  }, [reduced, docs.length]);
  return (
    <div className="space-y-1.5">
      {docs.map(([doc, when], idx) => (
        <div
          key={doc}
          className="flex items-center justify-between gap-2"
          style={{ opacity: idx === i ? 1 : 0.42, transition: "opacity 500ms ease" }}
        >
          <span className="min-w-0 truncate text-[9.5px]" style={{ color: INK }}>
            {doc}
          </span>
          <span
            className="shrink-0 text-[7.5px] uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.12em", color: GREEN }}
          >
            {when}
          </span>
        </div>
      ))}
    </div>
  );
}

const ORBIT: OrbitCard[] = [
  {
    key: "permitting",
    title: "Permitting",
    story: "Applications filed, tracked, and corrected without a single phone call.",
    body: (active) => <PermitBody active={active} />,
  },
  {
    key: "review",
    title: "Plan review",
    story: "Private plan review clears sets in two days, not two months.",
    body: () => <ReviewBody />,
  },
  {
    key: "inspections",
    title: "Inspections",
    story: "Same-day inspections, logged the moment the inspector signs off.",
    body: () => <InspectionBody />,
  },
  {
    key: "licenses",
    title: "Licenses",
    story: "Every license and qualifier watched, renewed before it lapses.",
    body: () => <LicenseBody />,
  },
  {
    key: "insurance",
    title: "Insurance",
    story: "Certificates collected, validated, and chased until every sub is compliant.",
    body: () => <InsuranceBody />,
  },
  {
    key: "lien",
    title: "Lien rights",
    story: "Notices and waivers generated, signed, and recorded on the statutory clock.",
    body: () => <LienBody />,
  },
];

const ORBIT_SECONDS = 46;

function SceneOrbit() {
  const reduced = useReducedMotion();
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setFocus((f) => (f + 1) % ORBIT.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <div className="relative h-full w-full">
      {/* orbit rings */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        style={{
          width: 520,
          height: 520,
          marginTop: -24,
          borderRadius: "50%",
          border: `1px solid rgba(43,22,32,0.08)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        style={{
          width: 340,
          height: 340,
          marginTop: -24,
          borderRadius: "50%",
          border: `1px dashed rgba(43,22,32,0.10)`,
        }}
      />

      {/* centre mark */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ perspective: 900, marginTop: -24 }}
      >
        <div>
          <img
            src={cLogo.url}
            alt="Cleard"
            className="h-[104px] w-[104px] object-contain md:h-[132px] md:w-[132px]"
            style={{
              animation: reduced ? undefined : "clSpin 14s linear infinite",
              filter: "drop-shadow(0 18px 30px rgba(43,22,32,0.22))",
            }}
          />
        </div>
      </div>

      {/* desktop: static ring of cards */}
      <div
        className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        style={{
          width: 0,
          height: 0,
          marginTop: -24,
        }}
      >
        {ORBIT.map((card, i) => {
          const angle = (360 / ORBIT.length) * i;
          const active = focus === i;
          return (
            <div
              key={card.key}
              className="absolute"
              style={{ transform: `rotate(${angle}deg) translate(182px) rotate(${-angle}deg)` }}
            >
              <div>

                <div
                  className="-translate-x-1/2 -translate-y-1/2 px-3 py-2.5"
                  style={{
                    width: 178,
                    background: active ? PAPER : OAT,
                    border: `1px solid ${active ? BRONZE : BORDER}`,
                    boxShadow: active
                      ? "0 22px 40px -18px rgba(43,22,32,0.35)"
                      : "0 10px 22px -18px rgba(43,22,32,0.30)",
                    transform: active ? "scale(1.07)" : "scale(1)",
                    transition: "all 700ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <Eyebrow color={active ? BRONZE : GREEN}>{card.title}</Eyebrow>
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: active ? BRONZE : "rgba(43,22,32,0.18)" }}
                    />
                  </div>
                  <div className="mt-2">{card.body(active)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* mobile: stacked pair of cards, no orbit */}
      <div className="absolute inset-x-3 bottom-4 grid grid-cols-1 gap-2 md:hidden">
        {[ORBIT[focus], ORBIT[(focus + 1) % ORBIT.length]].map((card, idx) => (
          <div
            key={card.key}
            className="px-3 py-2.5"
            style={{
              background: idx === 0 ? PAPER : OAT,
              border: `1px solid ${idx === 0 ? BRONZE : BORDER}`,
              animation: reduced ? undefined : "clSceneIn 500ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <Eyebrow color={idx === 0 ? BRONZE : GREEN}>{card.title}</Eyebrow>
            <div className="mt-2">{card.body(idx === 0)}</div>
          </div>
        ))}
      </div>

      {/* the story line — a caption band across the bottom of the frame */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden items-center justify-center md:flex"
        style={{
          height: 38,
          background: "rgba(250,243,230,0.94)",
          backdropFilter: "blur(3px)",
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <div
          key={focus}
          className="px-6 text-center text-[12.5px]"
          style={{
            color: INK,
            opacity: 0.8,
            animation: reduced ? undefined : "clSceneIn 500ms cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.2em", color: BRONZE, textTransform: "uppercase", marginRight: 10 }}>
            {ORBIT[focus].title}
          </span>
          {ORBIT[focus].story}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- laptop chrome for 2 & 3 -------------------------- */

const TABS = ["Dashboard", "My Permits", "Inspections", "Compliance"] as const;

function Laptop({ activeTab, children }: { activeTab: number; children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-5">
      <div
        className="flex h-full max-h-[400px] w-full max-w-[720px] flex-col"
        style={{
          background: "#241017",
          border: "1px solid rgba(250,243,230,0.14)",
          borderRadius: 10,
          boxShadow: "0 40px 70px -40px rgba(43,22,32,0.55)",
          animation: "clRise 700ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div
          className="flex items-center gap-3 px-3.5 py-2.5"
          style={{ borderBottom: "1px solid rgba(250,243,230,0.12)" }}
        >
          <img src={cLogo.url} alt="" className="h-3.5 w-3.5 object-contain" />
          <span style={{ fontFamily: SERIF, color: OAT, fontSize: 12.5, fontWeight: 600 }}>Cleard</span>
          <div className="ml-auto hidden gap-3.5 sm:flex">
            {TABS.map((t, i) => (
              <span
                key={t}
                className="text-[9px] uppercase transition-colors duration-500"
                style={{
                  fontFamily: MONO,
                  letterSpacing: "0.14em",
                  color: i === activeTab ? OAT : "rgba(250,243,230,0.42)",
                  borderBottom: i === activeTab ? `1px solid ${BRONZE}` : "1px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}

const DASH_METRICS: Array<[string, number, string]> = [
  ["Active permits", 17, ""],
  ["On time", 94, "%"],
  ["Avg review", 48, "h"],
  ["Open corrections", 2, ""],
];

function Metric({ label, value, suffix, delay }: { label: string; value: number; suffix: string; delay: number }) {
  const n = useLiveNumber(value);
  return (
    <div
      className="flex flex-col items-center justify-center px-2 py-4 text-center"
      style={{
        border: "1px solid rgba(250,243,230,0.14)",
        animation: `clRise 640ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div
        className="text-[8px] uppercase"
        style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(250,243,230,0.55)" }}
      >
        {label}
      </div>
      <div className="mt-2" style={{ fontFamily: SERIF, fontSize: 34, color: OAT, lineHeight: 1 }}>
        {n}
        {suffix}
      </div>
    </div>
  );
}

function SceneDashboard() {
  return (
    <Laptop activeTab={0}>
      <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-4">
        {DASH_METRICS.map(([label, value, suffix], i) => (
          <Metric key={label} label={label} value={value} suffix={suffix} delay={i * 110} />
        ))}
      </div>
    </Laptop>
  );
}

function DarkEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pb-1.5 text-[8px] uppercase"
      style={{
        fontFamily: MONO,
        letterSpacing: "0.16em",
        color: "rgba(250,243,230,0.55)",
        borderBottom: "1px solid rgba(250,243,230,0.12)",
      }}
    >
      {children}
    </div>
  );
}

function ScenePortal() {
  return (
    <Laptop activeTab={1}>
      <div className="grid h-full grid-cols-1 gap-5 sm:grid-cols-3">
        <div style={{ animation: "clRise 640ms cubic-bezier(0.16,1,0.3,1) both" }}>
          <DarkEyebrow>Permits</DarkEyebrow>
          <div className="mt-2.5 space-y-3">
            {(
              [
                ["CLR-2026-0208", 82],
                ["CLR-2026-0211", 46],
                ["CLR-2026-0214", 21],
              ] as Array<[string, number]>
            ).map(([id, pct]) => (
              <div key={id}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px]" style={{ color: OAT }}>
                    {id}
                  </span>
                  <span className="text-[8.5px]" style={{ fontFamily: MONO, color: "rgba(250,243,230,0.55)" }}>
                    {pct}%
                  </span>
                </div>
                <div className="mt-1 h-[3px] w-full" style={{ background: "rgba(250,243,230,0.14)" }}>
                  <div
                    className="h-full"
                    style={{ background: BRONZE, animation: `clGrow 1100ms cubic-bezier(0.16,1,0.3,1) both`, width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ animation: "clRise 640ms cubic-bezier(0.16,1,0.3,1) 120ms both" }}>
          <DarkEyebrow>Inspections</DarkEyebrow>
          <div className="mt-2.5 space-y-2.5">
            {(
              [
                ["Structural framing", true],
                ["Electrical rough", false],
                ["Plumbing top-out", true],
              ] as Array<[string, boolean]>
            ).map(([trade, ok]) => (
              <div key={trade} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[10px]" style={{ color: OAT }}>
                  {trade}
                </span>
                <span className="shrink-0 text-[11px]" style={{ color: ok ? "#9BB8A6" : "#D89A9A" }} aria-hidden>
                  {ok ? "✓" : "✕"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ animation: "clRise 640ms cubic-bezier(0.16,1,0.3,1) 240ms both" }}>
          <DarkEyebrow>Compliance</DarkEyebrow>
          <div className="mt-2.5 space-y-2.5">
            {[
              ["Licenses", "36 current"],
              ["COIs", "184 valid"],
              ["Expiring 30d", "0"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-[10px]" style={{ color: "rgba(250,243,230,0.62)" }}>
                  {label}
                </span>
                <span className="text-[10px]" style={{ color: OAT, fontWeight: 500 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Laptop>
  );
}

/* --------------------------------- the stage --------------------------------- */

const SCENES = [
  { render: () => <SceneOrbit />, ms: 16000, label: "Everything Cleard runs" },
  { render: () => <SceneDashboard />, ms: 5200, label: "Your dashboard" },
  { render: () => <ScenePortal />, ms: 5600, label: "Inside the portal" },
];

export function HeroStage() {
  const [scene, setScene] = useState(0);
  const reduced = useReducedMotion();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return;
    timer.current = window.setTimeout(
      () => setScene((s) => (s + 1) % SCENES.length),
      SCENES[scene].ms,
    );
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [scene, reduced]);

  const Active = SCENES[scene].render;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <style>{`
        @keyframes clSpin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        @keyframes clSpinZ { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes clSpinZRev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes clFloat { 0%,100% { transform: translateY(-6px); } 50% { transform: translateY(8px); } }
        @keyframes clSceneIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes clRise { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes clGrow { from { width: 0; } }
      `}</style>

      <div
        className="relative mt-8 overflow-hidden"
        style={{
          height: FRAME_H,
          background: `radial-gradient(120% 90% at 50% 40%, ${PAPER} 0%, ${OAT} 62%, #F3E9D6 100%)`,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          boxShadow: "0 40px 80px -60px rgba(43,22,32,0.45)",
        }}
      >
        {/* drafting grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(43,22,32,0.045) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(43,22,32,0.045) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />

        <div
          key={scene}
          className="relative h-full w-full"
          style={{ animation: reduced ? undefined : "clSceneIn 640ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <Active />
        </div>

        {/* scene label */}
        <div
          className="pointer-events-none absolute left-4 top-4 text-[8px] uppercase"
          style={{ fontFamily: MONO, letterSpacing: "0.2em", color: GREEN, opacity: 0.7 }}
        >
          {SCENES[scene].label}
        </div>
      </div>

      {/* scene selectors */}
      <div className="mt-4 flex items-center justify-center gap-2.5">
        {SCENES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-label={s.label}
            onClick={() => setScene(i)}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === scene ? 26 : 6,
              background: i === scene ? BRONZE : PLUM,
              opacity: i === scene ? 1 : 0.22,
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/contact"
          className="inline-flex items-center rounded-full px-5 py-2 text-[12.5px] no-underline transition-transform duration-200 hover:scale-[1.03]"
          style={{ border: `1px solid ${GREEN}`, color: GREEN, fontWeight: 600 }}
        >
          See it in action
        </Link>
        <Link
          to="/join"
          hash="request"
          className="inline-flex items-center rounded-full px-5 py-2 text-[12.5px] no-underline transition-transform duration-200 hover:scale-[1.03]"
          style={{ background: BRONZE, color: OAT, fontWeight: 600 }}
        >
          Get early access
        </Link>
      </div>
    </div>
  );
}

export default HeroStage;
