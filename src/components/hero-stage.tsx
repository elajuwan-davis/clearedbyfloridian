import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import cLogo from "@/assets/cleard-c-copper.png.asset.json";

/* Nordic Luxury tokens (marketing only) */
const OAT = "#FFFFFF";
const PAPER = "#FFFFFF";
const BORDER = "rgba(43,22,32,0.09)";
const INK = "#000000";
const BRONZE = "#9C6B3F";
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SERIF = '"Instrument Sans", sans-serif';

const FRAME_H = 480;

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

function Eyebrow({ children, color = "rgba(0,0,0,0.45)" }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[8px] uppercase"
      style={{ fontFamily: MONO, letterSpacing: "0.18em", color, opacity: 0.85 }}
    >
      {children}
    </div>
  );
}

function Meter({ pct, color = BRONZE }: { pct: number; color?: string }) {
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

function Chip({ label }: { label: string }) {
  const tone =
    /correction|delay|fail/i.test(label) ? { color: "#C0392B", bg: "rgba(192,57,43,0.12)", border: "rgba(192,57,43,0.35)" } :
    /review|warn/i.test(label) ? { color: "#B7791F", bg: "rgba(183,121,31,0.12)", border: "rgba(183,121,31,0.35)" } :
    /pass|clear|verif|current|track|complete|ok/i.test(label) ? { color: "#2E7D32", bg: "rgba(46,125,50,0.12)", border: "rgba(46,125,50,0.35)" } :
    { color: "#2563EB", bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.35)" };
  return (
    <span
      className="shrink-0 px-1.5 py-[2px] text-[7.5px] uppercase"
      style={{ fontFamily: MONO, letterSpacing: "0.14em", color: tone.color, background: tone.bg, border: `1px solid ${tone.border}` }}
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
            <span className="text-[8.5px]" style={{ fontFamily: MONO, color: "rgba(43,22,32,0.45)" }}>
              {pcts[i]}%
            </span>
          </div>
          <div className="mt-1">
            <Meter pct={pcts[i]} color={active ? BRONZE : "#8B6B50"} />
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
        <span className="copper-sweep" style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1 }}>{hours}h</span>
        <span className="pb-[3px] text-[8px] uppercase" style={{ fontFamily: MONO, color: "rgba(43,22,32,0.45)" }}>
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
            <span style={{ color: "rgba(43,22,32,0.45)" }}> · {trade}</span>
          </span>
          {idx === i ? <Chip label={ok ? "Passed" : "Correction"} /> : null}
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
        <span className="copper-sweep" style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1 }}>{n}</span>
        <Chip label="All current" />
      </div>
      <Meter pct={100} color={BRONZE} />
      <div className="text-[8.5px] uppercase" style={{ fontFamily: MONO, color: "rgba(43,22,32,0.45)" }}>
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
        <span className="copper-sweep" style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1 }}>{n}</span>
        <span className="text-[8.5px] uppercase" style={{ fontFamily: MONO, color: "rgba(43,22,32,0.45)" }}>
          COIs valid
        </span>
      </div>
      <Meter pct={97} color={BRONZE} />
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
            style={{ fontFamily: MONO, letterSpacing: "0.12em", color: "rgba(43,22,32,0.45)" }}
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



/* ------------------------- bento card chrome + chart ------------------------- */

function BentoCard({
  title,
  hint,
  area,
  delay,
  active,
  children,
  padded = true,
  fill = false,
}: {
  title: string;
  hint?: string;
  area: string;
  delay: number;
  active?: boolean;
  children: React.ReactNode;
  padded?: boolean;
  fill?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      className="group relative flex min-h-0 min-w-0 flex-col overflow-hidden"
      style={{
        gridArea: area,
        background: active ? PAPER : "#FFFFFF",
        border: `1px solid ${active ? BRONZE : BORDER}`,
        borderRadius: 10,
        boxShadow: active
          ? "0 26px 44px -24px rgba(43,22,32,0.34)"
          : "0 14px 30px -24px rgba(43,22,32,0.30)",
        transform: active ? "translateY(-2px)" : "none",
        transition: "all 700ms cubic-bezier(0.16,1,0.3,1)",
        animation: reduced ? undefined : `clRise 700ms ${delay}ms cubic-bezier(0.16,1,0.3,1) both`,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-between px-3 pb-1.5 pt-2.5"
        style={{ borderBottom: `1px solid ${active ? "rgba(156,107,63,0.28)" : "rgba(43,22,32,0.07)"}` }}
      >
        <Eyebrow color={active ? INK : "rgba(43,22,32,0.45)"}>{title}</Eyebrow>
        {hint ? (
          <span
            className="shrink-0 text-[7.5px] uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.14em", color: "rgba(43,22,32,0.45)", opacity: 0.65 }}
          >
            {hint}
          </span>
        ) : (
          <span
            className="h-1 w-1 rounded-full"
            style={{ background: active ? BRONZE : "rgba(43,22,32,0.18)" }}
          />
        )}
      </div>
      <div
        className={
          padded
            ? `flex min-h-0 flex-1 flex-col px-3 py-2.5 ${fill ? "" : "justify-center"}`
            : "min-h-0 flex-1"
        }
      >
        <div className={fill ? "flex min-h-0 w-full flex-1 flex-col" : "min-h-0 w-full"}>{children}</div>
      </div>
    </div>
  );
}

const REPORT_BARS = [
  { key: "Palm Bch", value: 22, color: "#000000" },
  { key: "Martin", value: 14, color: BRONZE },
  { key: "St Lucie", value: 18, color: "rgba(43,22,32,0.65)" },
  { key: "Broward", value: 9, color: "rgba(43,22,32,0.48)" },
  { key: "Ind River", value: 12, color: "rgba(43,22,32,0.35)" },
  { key: "Sarasota", value: 16, color: "rgba(43,22,32,0.65)" },
  { key: "Collier", value: 7, color: "#000000" },
];

function TrendArrow({ dir }: { dir: "up" | "down" }) {
  const color = BRONZE;
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden style={{ overflow: "visible" }}>
      <path
        d={dir === "down" ? "M5 1 L5 9 M2 6 L5 9 L8 6" : "M5 9 L5 1 M2 4 L5 1 L8 4"}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Tall "Permit Report" card: animated bar chart + response metrics. */
function ReportCard() {
  const reduced = useReducedMotion();
  const [grown, setGrown] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const filed = useLiveNumber(88, { live: 1, period: 2800 });

  useEffect(() => {
    if (reduced) {
      setGrown(true);
      return;
    }
    const id = window.setTimeout(() => setGrown(true), 220);
    return () => window.clearTimeout(id);
  }, [reduced]);

  const max = Math.max(...REPORT_BARS.map((b) => b.value));

  const metrics: Array<[string, string, "up" | "down"]> = [
    ["Time to permit", "8 days", "down"],
    ["Plan review", "48 hours", "down"],
    ["Correction rate", "4%", "down"],
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between">
        <div>
          <div className="copper-sweep" style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1 }}>{filed}</div>
          <div
            className="mt-1 text-[8px] uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(43,22,32,0.45)" }}
          >
            permits filed · 30 days
          </div>
        </div>
        <Chip label="On track" />
      </div>

      {/* bar chart */}
      <div className="mt-3 min-h-0 flex-1">
        <div className="relative h-full w-full">
          {[0, 1, 2, 3].map((g) => (
            <div
              key={g}
              aria-hidden
              className="absolute inset-x-0"
              style={{ top: `${(g / 3) * 100}%`, height: 1, background: "rgba(43,22,32,0.07)" }}
            />
          ))}
          <div className="absolute inset-0 flex gap-[6px]">
            {REPORT_BARS.map((b, i) => {
              const hot = hoverIdx === i;
              return (
                <div
                  key={b.key}
                  className="flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end gap-1"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <span
                    className="text-[8px]"
                    style={{
                      fontFamily: MONO,
                      color: b.color,
                      opacity: hot ? 1 : 0,
                      transition: "opacity 220ms ease",
                    }}
                  >
                    {b.value}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      height: grown ? `${(b.value / max) * 100}%` : 0,
                      background: b.color,
                      opacity: hoverIdx === null || hot ? 1 : 0.42,
                      borderRadius: "3px 3px 0 0",
                      transition: `height 900ms ${i * 70}ms cubic-bezier(0.16,1,0.3,1), opacity 220ms ease`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex gap-[6px]">
        {REPORT_BARS.map((b) => (
          <span
            key={b.key}
            className="min-w-0 flex-1 truncate text-center text-[6.5px] uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.06em", color: INK, opacity: 0.5 }}
          >
            {b.key}
          </span>
        ))}
      </div>

      {/* metric rows */}
      <div className="mt-3 space-y-1.5 border-t pt-2.5" style={{ borderColor: "rgba(43,22,32,0.08)" }}>
        {metrics.map(([label, value, dir], i) => (
          <div
            key={label}
            className="flex items-center justify-between gap-2"
            style={{
              animation: reduced ? undefined : `clSceneIn 500ms ${400 + i * 90}ms cubic-bezier(0.16,1,0.3,1) both`,
            }}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0"
                style={{ background: i === 2 ? "rgba(43,22,32,0.5)" : i === 1 ? BRONZE : "rgba(43,22,32,0.75)", transform: "rotate(45deg)" }}
              />
              <span className="min-w-0 truncate text-[9.5px]" style={{ color: INK, opacity: 0.75 }}>
                {label}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[10.5px]" style={{ color: INK, fontWeight: 600 }}>
                {value}
              </span>
              <TrendArrow dir={dir} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneOrbit() {
  const reduced = useReducedMotion();
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setFocus((f) => (f + 1) % ORBIT.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced]);

  const byKey = (k: string) => ORBIT.find((c) => c.key === k)!;
  const isActive = (k: string) => ORBIT[focus]?.key === k;

  return (
    <div className="relative h-full w-full">
      {/* desktop: asymmetric bento with the mark seated in the middle column */}
      <div
        className="absolute inset-0 hidden px-4 pb-[46px] pt-9 md:block"
        style={{ perspective: 1200 }}
      >
        <div
          className="grid h-full w-full gap-2.5"
          style={{
            gridTemplateColumns: "minmax(0,1.12fr) minmax(0,1.05fr) minmax(0,0.92fr)",
            gridTemplateRows: "repeat(6, minmax(0,1fr))",
            gridTemplateAreas: `
              "report inspect license"
              "report inspect license"
              "report mark insure"
              "report mark insure"
              "report lien permit"
              "report lien permit"
            `,
          }}
        >
          <BentoCard title="Permit report" hint="Live" area="report" delay={0} fill>
            <ReportCard />
          </BentoCard>

          <BentoCard
            title="Inspections"
            hint="Same day"
            area="inspect"
            delay={90}
            active={isActive("inspections")}
          >
            <InspectionBody />
          </BentoCard>

          <BentoCard
            title="Licenses"
            area="license"
            delay={150}
            active={isActive("licenses")}
          >
            <LicenseBody />
          </BentoCard>

          {/* centre mark — no card chrome, seated in the gap */}
          <div
            className="relative flex items-center justify-center"
            style={{ gridArea: "mark" }}
          >
            <img
              src={cLogo.url}
              alt="Cleard"
              className="h-[128px] w-[128px] object-contain"
              style={{
                animation: reduced ? undefined : "clSpin 14s linear infinite",
                filter: "drop-shadow(0 18px 30px rgba(43,22,32,0.22))",
              }}
            />
          </div>

          <BentoCard
            title="Insurance"
            hint="Verified"
            area="insure"
            delay={210}
            active={isActive("insurance")}
          >
            <InsuranceBody />
          </BentoCard>

          <BentoCard
            title="Lien rights"
            area="lien"
            delay={270}
            active={isActive("lien")}
          >
            <LienBody />
          </BentoCard>

          <BentoCard
            title="Permitting"
            hint="Tracking"
            area="permit"
            delay={330}
            active={isActive("permitting")}
          >
            {byKey("permitting").body(isActive("permitting"))}
          </BentoCard>
        </div>
      </div>

      {/* mobile: mark + report card + the focused capability */}
      <div className="absolute inset-0 flex flex-col gap-2.5 p-3 md:hidden">
        <div className="flex shrink-0 items-center justify-center">
          <img
            src={cLogo.url}
            alt="Cleard"
            className="h-[88px] w-[88px] object-contain"
            style={{ animation: reduced ? undefined : "clSpin 14s linear infinite" }}
          />
        </div>
        <div className="min-h-0 flex-1">
          <BentoCard title="Permit report" hint="Live" area="auto" delay={0} fill>
            <ReportCard />
          </BentoCard>
        </div>
        <div className="shrink-0">
          <BentoCard title={ORBIT[focus].title} area="auto" delay={80} active>
            {ORBIT[focus].body(true)}
          </BentoCard>
        </div>
      </div>

      {/* the story line — a caption band across the bottom of the frame */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 hidden items-center justify-center md:flex"
        style={{
          height: 38,
          background: "rgba(255,255,255,0.94)",
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
          <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.2em", color: "rgba(43,22,32,0.45)", textTransform: "uppercase", marginRight: 10 }}>
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
        className="flex h-full max-h-[400px] w-full max-w-[720px] flex-col overflow-hidden"
        style={{
          background: "#000000",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 10,
          boxShadow: "0 40px 70px -40px rgba(43,22,32,0.55)",
          animation: "clRise 700ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div
          className="flex items-center gap-3 px-3.5 py-2.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        >
          <img src={cLogo.url} alt="" className="h-3.5 w-3.5 object-contain" />
          <span style={{ fontFamily: SERIF, color: OAT, fontSize: 12.5, fontWeight: 600 }}>CLEARD</span>
          <div className="ml-auto hidden gap-3.5 sm:flex">
            {TABS.map((t, i) => (
              <span
                key={t}
                className="text-[9px] uppercase transition-colors duration-500"
                style={{
                  fontFamily: MONO,
                  letterSpacing: "0.14em",
                  color: i === activeTab ? OAT : "rgba(255,255,255,0.42)",
                  borderBottom: i === activeTab ? `1px solid ${BRONZE}` : "1px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------- status system ------------------------------- */

const STATUS = {
  enroute: { label: "En Route", color: "#4F9CF9" },
  delayed: { label: "Delayed", color: "#FF6B6B" },
  completed: { label: "Completed", color: "#3ECF8E" },
  review: { label: "In Review", color: "#B7791F" },
} as const;
type StatusKey = keyof typeof STATUS;

function StatusPill({ k }: { k: StatusKey }) {
  const s = STATUS[k];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 px-1.5 py-[2px] text-[7.5px] uppercase"
      style={{
        fontFamily: MONO,
        letterSpacing: "0.13em",
        color: s.color,
        background: `${s.color}1F`,
        border: `1px solid ${s.color}59`,
        borderRadius: 3,
      }}
    >
      <span className="h-1 w-1 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {s.label}
    </span>
  );
}

const DASH_METRICS: Array<[string, number, string, string]> = [
  ["Active permits", 17, "", STATUS.enroute.color],
  ["On time", 100, "%", STATUS.completed.color],
  ["Avg review", 48, "h", STATUS.review.color],
  ["Corrections", 2, "", STATUS.delayed.color],
];

function Metric({
  label,
  value,
  suffix,
  color,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
  delay: number;
}) {
  const n = useLiveNumber(value);
  return (
    <div
      className="group flex flex-col justify-center px-2.5 py-2.5 transition-colors duration-300"
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 6,
        background: "rgba(255,255,255,0.02)",
        animation: `clRise 640ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[7.5px] uppercase"
        style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(255,255,255,0.55)" }}
      >
        <span className="h-1 w-1 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span style={{ fontFamily: SERIF, fontSize: 26, color: OAT, lineHeight: 1 }}>
          {n}
          {suffix}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------ interactive chart ---------------------------- */

const CHART_SERIES: Array<{ key: string; color: string; points: number[] }> = [
  { key: "Filed", color: "#4F9CF9", points: [8, 12, 10, 16, 14, 21, 19, 26] },
  { key: "Issued", color: "#3ECF8E", points: [4, 7, 9, 8, 12, 13, 17, 22] },
  { key: "Corrections", color: "#FF6B6B", points: [3, 2, 4, 2, 3, 1, 2, 1] },
];
const CHART_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

function PermitAreaChart() {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = 96;
  const max = 30;
  const n = CHART_LABELS.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - (v / max) * H;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 108, overflow: "visible" }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {CHART_SERIES.map((s) => (
            <linearGradient key={s.key} id={`clg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.42" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={0}
            x2={W}
            y1={H * g}
            y2={H * g}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={0.6}
          />
        ))}

        {CHART_SERIES.map((s, si) => {
          const line = s.points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
          return (
            <g key={s.key}>
              <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#clg-${s.key})`} opacity={0.9}>
                <animate attributeName="opacity" from="0" to="0.9" dur="900ms" fill="freeze" />
              </path>
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={1.6}
                strokeLinecap="round"
                style={{
                  strokeDasharray: 900,
                  animation: `clDraw 1400ms ${si * 160}ms cubic-bezier(0.16,1,0.3,1) both`,
                }}
              />
              {hover !== null && (
                <circle cx={x(hover)} cy={y(s.points[hover])} r={2.6} fill={s.color} stroke="#000000" strokeWidth={1} />
              )}
            </g>
          );
        })}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="rgba(255,255,255,0.35)" strokeWidth={0.7} />
        )}

        {CHART_LABELS.map((_, i) => (
          <rect
            key={i}
            x={x(i) - W / (n * 2)}
            y={0}
            width={W / n}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      <div className="mt-1 flex items-center justify-between">
        <div className="flex gap-2.5">
          {CHART_SERIES.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-1 text-[7.5px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: "0.13em", color: "rgba(255,255,255,0.6)" }}
            >
              <span className="h-[5px] w-[5px] rounded-full" style={{ background: s.color }} />
              {s.key}
            </span>
          ))}
        </div>
        <span
          className="text-[7.5px] uppercase tabular-nums"
          style={{ fontFamily: MONO, letterSpacing: "0.13em", color: hover === null ? "rgba(255,255,255,0.4)" : OAT }}
        >
          {hover === null
            ? "Hover for detail"
            : `${CHART_LABELS[hover]} · ${CHART_SERIES.map((s) => s.points[hover]).join(" / ")}`}
        </span>
      </div>
    </div>
  );
}

/* --------------------------------- scene 2 ---------------------------------- */

const DASH_PERMITS: Array<{ id: string; addr: string; status: StatusKey; pct: number }> = [
  { id: "CLR-2026-0208", addr: "1217 S Ocean Blvd", status: "enroute", pct: 82 },
  { id: "CLR-2026-0211", addr: "88 N County Rd", status: "completed", pct: 100 },
  { id: "CLR-2026-0214", addr: "1402 Banyan Rd", status: "delayed", pct: 34 },
  { id: "CLR-2026-0219", addr: "27 S Beach Rd", status: "review", pct: 58 },
];

function SceneDashboard() {
  const [sel, setSel] = useState(0);
  return (
    <Laptop activeTab={0}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
          {DASH_METRICS.map(([label, value, suffix, color], i) => (
            <Metric
              key={label}
              label={label}
              value={value}
              suffix={suffix}
              color={color}
              delay={i * 90}
            />
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-5">
          <div
            className="min-w-0 sm:col-span-3"
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 6,
              padding: 10,
              animation: "clRise 700ms 220ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <DarkEyebrow>Permit throughput · 8 mo</DarkEyebrow>
            <div className="mt-2">
              <PermitAreaChart />
            </div>
          </div>

          <div
            className="min-w-0 sm:col-span-2"
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 6,
              padding: 10,
              animation: "clRise 700ms 320ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <DarkEyebrow>Live permits</DarkEyebrow>
            <div className="mt-2 space-y-1.5">
              {DASH_PERMITS.map((p, i) => {
                const on = sel === i;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    className="w-full cursor-default px-1.5 py-1 text-left transition-all duration-300"
                    style={{
                      background: on ? "rgba(255,255,255,0.07)" : "transparent",
                      border: `1px solid ${on ? `${STATUS[p.status].color}55` : "transparent"}`,
                      borderRadius: 4,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[9px]" style={{ fontFamily: MONO, color: OAT }}>
                        {p.id}
                      </span>
                      <StatusPill k={p.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-[3px] flex-1" style={{ background: "rgba(255,255,255,0.14)" }}>
                        <div
                          className="h-full transition-all duration-700"
                          style={{ background: STATUS[p.status].color, width: on ? `${p.pct}%` : `${p.pct * 0.9}%` }}
                        />
                      </div>
                      <span
                        className="shrink-0 text-[7.5px] tabular-nums"
                        style={{ fontFamily: MONO, color: "rgba(255,255,255,0.55)" }}
                      >
                        {p.pct}%
                      </span>
                    </div>
                    <div
                      className="truncate text-[8px]"
                      style={{ color: "rgba(255,255,255,0.45)", height: on ? 12 : 0, overflow: "hidden", transition: "height 300ms ease" }}
                    >
                      {p.addr}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
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
        color: "rgba(255,255,255,0.55)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {children}
    </div>
  );
}

/* --------------------------------- scene 3 ---------------------------------- */

const FILING_STEPS = [
  "Project details",
  "Scope & valuation",
  "Stamped plans",
  "Private provider affidavit",
  "Filed with jurisdiction",
];

const FILED_FEED: Array<{ id: string; addr: string; juris: string; status: StatusKey }> = [
  { id: "CLR-2026-0231", addr: "3012 Payson Way", juris: "Wellington", status: "completed" },
  { id: "CLR-2026-0230", addr: "9399 SE Delafield St", juris: "Hobe Sound", status: "enroute" },
  { id: "CLR-2026-0229", addr: "104 Manor Circle", juris: "Jupiter", status: "review" },
  { id: "CLR-2026-0228", addr: "8566 SW Felicita Wy", juris: "Port St. Lucie", status: "delayed" },
  { id: "CLR-2026-0227", addr: "123 Fairview W", juris: "Tequesta", status: "completed" },
  { id: "CLR-2026-0226", addr: "1261 Spanish River Rd", juris: "Boca Raton", status: "enroute" },
];

function ScenePortal() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % (FILING_STEPS.length + 1)), 850);
    return () => window.clearInterval(t);
  }, [reduced]);

  const feed = [...FILED_FEED, ...FILED_FEED];

  return (
    <Laptop activeTab={1}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between pb-2">
          <span style={{ fontFamily: SERIF, fontSize: 15, color: OAT }}>Permits filed</span>
          <span
            className="text-[7.5px] uppercase"
            style={{ fontFamily: MONO, letterSpacing: "0.16em", color: STATUS.completed.color }}
          >
            Live · 231 this year
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-5">
          {/* filing wizard */}
          <div
            className="min-w-0 sm:col-span-2"
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 6,
              padding: 10,
              animation: "clRise 640ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <DarkEyebrow>New permit</DarkEyebrow>
            <div className="mt-2.5 space-y-2">
              {FILING_STEPS.map((s, i) => {
                const done = i < step;
                const now = i === step;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span
                      className="flex h-[13px] w-[13px] shrink-0 items-center justify-center text-[7px] transition-all duration-400"
                      style={{
                        borderRadius: 3,
                        border: `1px solid ${done ? STATUS.completed.color : now ? BRONZE : "rgba(255,255,255,0.22)"}`,
                        background: done ? `${STATUS.completed.color}26` : "transparent",
                        color: STATUS.completed.color,
                        fontFamily: MONO,
                      }}
                    >
                      {done ? "✓" : ""}
                    </span>
                    <span
                      className="min-w-0 truncate text-[9.5px] transition-colors duration-400"
                      style={{ color: done || now ? OAT : "rgba(255,255,255,0.4)" }}
                    >
                      {s}
                    </span>
                    {now && (
                      <span
                        className="ml-auto h-[3px] w-6 shrink-0 overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.16)" }}
                      >
                        <span
                          className="block h-full"
                          style={{ background: BRONZE, animation: "clGrow 800ms linear both", width: "100%" }}
                        />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              className="mt-3 px-2 py-1.5 text-center text-[8px] uppercase transition-all duration-500"
              style={{
                fontFamily: MONO,
                letterSpacing: "0.16em",
                borderRadius: 4,
                border: `1px solid ${step >= FILING_STEPS.length ? STATUS.completed.color : "rgba(255,255,255,0.2)"}`,
                color: step >= FILING_STEPS.length ? STATUS.completed.color : "rgba(255,255,255,0.45)",
                background: step >= FILING_STEPS.length ? `${STATUS.completed.color}1A` : "transparent",
              }}
            >
              {step >= FILING_STEPS.length ? "Submitted · CLR-2026-0232" : "Submitting…"}
            </div>
          </div>

          {/* sliding filed feed */}
          <div
            className="relative min-w-0 overflow-hidden sm:col-span-3"
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 6,
              padding: 10,
              animation: "clRise 640ms 140ms cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            <DarkEyebrow>Filed today</DarkEyebrow>
            <div className="relative mt-2 overflow-hidden" style={{ height: 240 }}>
              <div
                style={{
                  animation: reduced ? undefined : "clMarquee 14s linear infinite",
                }}
              >
                {feed.map((p, i) => (
                  <div
                    key={`${p.id}-${i}`}
                    className="mb-1.5 flex items-center gap-2 px-2 py-1.5"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderLeft: `2px solid ${STATUS[p.status].color}`,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span className="shrink-0 text-[9px]" style={{ fontFamily: MONO, color: OAT }}>
                      {p.id}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[8.5px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {p.addr} · {p.juris}
                    </span>
                    <StatusPill k={p.status} />
                  </div>
                ))}
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-5"
                style={{ background: "linear-gradient(to bottom, #000000, transparent)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-5"
                style={{ background: "linear-gradient(to top, #000000, transparent)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </Laptop>
  );
}

/* --------------------------------- the stage --------------------------------- */

const SCENES = [
  { render: () => <SceneOrbit />, ms: 16000, label: "Everything Cleard runs" },
  { render: () => <SceneDashboard />, ms: 8000, label: "Your dashboard" },
  { render: () => <ScenePortal />, ms: 9000, label: "Permits filed" },
];

function SceneArrow({
  label,
  glyph,
  onClick,
}: {
  label: string;
  glyph: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[21px] leading-none transition-all duration-200 hover:scale-105 hover:brightness-110"
      style={{
        background: "linear-gradient(140deg, #7F562F 0%, #9C6B3F 45%, #D8A870 100%)",
        border: "1.5px solid #7F562F",
        color: "#FFFFFF",
        borderRadius: 999,
        cursor: "pointer",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -12px rgba(127,86,47,0.9)",
      }}
    >
      {glyph}
    </button>
  );
}

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
        @keyframes clDraw { from { stroke-dashoffset: 900; } to { stroke-dashoffset: 0; } }
        @keyframes clMarquee { from { transform: translateY(0); } to { transform: translateY(-50%); } }
      `}</style>

      <div className="mt-8 flex items-center justify-center gap-3 sm:gap-5">
        <SceneArrow
          label="Previous scene"
          glyph="‹"
          onClick={() => setScene((v) => (v - 1 + SCENES.length) % SCENES.length)}
        />

        <div
          className="relative min-w-0 flex-1 overflow-hidden"
          style={{
            height: FRAME_H,
            background: "rgba(255,255,255,0.42)",
            backdropFilter: "blur(22px) saturate(150%)",
            border: "1px solid rgba(255,255,255,0.45)",
            borderRadius: 14,
            boxShadow: "0 40px 90px -55px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.5)",
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
            style={{ fontFamily: MONO, letterSpacing: "0.2em", color: "rgba(255,255,255,0.55)", opacity: 0.9 }}
          >
            {SCENES[scene].label}
          </div>
        </div>

        <SceneArrow
          label="Next scene"
          glyph="›"
          onClick={() => setScene((v) => (v + 1) % SCENES.length)}
        />
      </div>

      {/* pagination dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SCENES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            aria-label={`Go to ${s.label}`}
            aria-current={i === scene}
            onClick={() => setScene(i)}
            className="h-2 shrink-0 transition-all duration-300"
            style={{
              width: i === scene ? 20 : 8,
              borderRadius: 999,
              background: i === scene ? BRONZE : "rgba(43,22,32,0.18)",
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
          className="cl-glass foil-sheen cta-copper inline-flex items-center px-6 py-2.5 text-[12.5px] no-underline transition-all duration-200 hover:scale-[1.03]"
          style={{
            border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
            backdropFilter: "blur(12px) saturate(140%)",
            WebkitBackdropFilter: "blur(12px) saturate(140%)",
            color: "var(--black)",
            fontWeight: 600,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45), 0 14px 30px -16px color-mix(in oklab, var(--copper-deep) 70%, transparent)",
          }}
        >
          See it in action
        </Link>

        <Link
          to="/join"
          hash="request"
          className="cl-glass foil-sheen cta-copper inline-flex items-center px-6 py-2.5 text-[12.5px] no-underline transition-all duration-200 hover:scale-[1.03]"
          style={{
            border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
            backdropFilter: "blur(12px) saturate(140%)",
            WebkitBackdropFilter: "blur(12px) saturate(140%)",
            color: "var(--black)",
            fontWeight: 600,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45), 0 14px 30px -16px color-mix(in oklab, var(--copper-deep) 70%, transparent)",
          }}
        >
          Get early access
        </Link>

      </div>

    </div>
  );
}

export default HeroStage;
