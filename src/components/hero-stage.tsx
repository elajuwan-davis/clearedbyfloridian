import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import cLogo from "@/assets/cleard-c-copper.png.asset.json";

/* Nordic Luxury tokens (marketing only) */
const OAT = "#FAF3E6";
const BORDER = "#E0D3BC";
const PLUM = "#673147";
const GREEN = "#2F4F4F";
const BRONZE = "#9C6B3F";
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';

const FRAME_H = 340;

/* --------------------------------- scene 1 --------------------------------- */

function Eyebrow({ children, color = GREEN }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[8.5px] uppercase"
      style={{ fontFamily: MONO, letterSpacing: "0.16em", color, opacity: 0.85 }}
    >
      {children}
    </div>
  );
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-[3px] w-full" style={{ background: "rgba(43,22,32,0.10)" }}>
      <div className="h-full" style={{ width: `${pct}%`, background: PLUM }} />
    </div>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-3 py-2.5 ${className ?? ""}`}
      style={{ background: OAT, border: `1px solid ${BORDER}` }}
    >
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function SceneOverview() {
  return (
    <div className="relative h-full w-full p-3">
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-8">
        <Card title="Permits">
          {[
            ["CLR-2026-0208", 82],
            ["CLR-2026-0211", 46],
          ].map(([id, pct]) => (
            <div key={id as string}>
              <div className="flex items-baseline justify-between">
                <span className="text-[10.5px]" style={{ color: PLUM, fontWeight: 600 }}>
                  {id}
                </span>
                <span className="text-[9px]" style={{ fontFamily: MONO, color: GREEN }}>
                  {pct}%
                </span>
              </div>
              <div className="mt-1">
                <Bar pct={pct as number} />
              </div>
            </div>
          ))}
        </Card>

        <Card title="Inspections">
          {[
            ["14 Pelican Bay Ln", "Structural", "Approved"],
            ["82 Harbour Ridge", "Electrical", "Denied"],
          ].map(([addr, trade, status]) => (
            <div key={addr} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[10.5px]" style={{ color: PLUM }}>
                {addr}
                <span style={{ color: GREEN, opacity: 0.7 }}> · {trade}</span>
              </span>
              <span
                className="shrink-0 px-1.5 py-0.5 text-[8px] uppercase"
                style={{
                  fontFamily: MONO,
                  letterSpacing: "0.12em",
                  color: OAT,
                  background: status === "Approved" ? GREEN : PLUM,
                }}
              >
                {status}
              </span>
            </div>
          ))}
        </Card>

        <Card title="Licenses & Insurance">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px]" style={{ color: PLUM }}>
              36 licenses
            </span>
            <span className="text-[9px] uppercase" style={{ fontFamily: MONO, color: GREEN }}>
              Current
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10.5px]" style={{ color: PLUM }}>
              184 COIs
            </span>
            <span className="text-[9px] uppercase" style={{ fontFamily: MONO, color: GREEN }}>
              Valid
            </span>
          </div>
        </Card>

        <Card title="Lien Rights">
          {[
            ["Notice of Commencement", "Recorded Aug 12"],
            ["Conditional Waiver", "Recorded Aug 18"],
          ].map(([doc, when]) => (
            <div key={doc} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[10.5px]" style={{ color: PLUM }}>
                {doc}
              </span>
              <span
                className="shrink-0 text-[8.5px] uppercase"
                style={{ fontFamily: MONO, letterSpacing: "0.1em", color: GREEN }}
              >
                {when}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* the mark, centered in the gap where the four cards meet */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2"
        style={{ perspective: 600 }}
      >
        <img
          src={cLogo.url}
          alt="Cleard"
          className="h-full w-full object-contain"
          style={{ animation: "clSpin 9s linear infinite" }}
        />
      </div>
    </div>
  );
}

/* -------------------------- laptop chrome for 2 & 3 -------------------------- */

const TABS = ["Dashboard", "My Permits", "Inspections", "Compliance"] as const;

function Laptop({ activeTab, children }: { activeTab: number; children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-3">
      <div
        className="flex h-full w-full max-w-[600px] flex-col"
        style={{ background: "#241017", border: "1px solid rgba(250,243,230,0.14)" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{ borderBottom: "1px solid rgba(250,243,230,0.12)" }}
        >
          <img src={cLogo.url} alt="" className="h-3.5 w-3.5 object-contain" />
          <span style={{ fontFamily: SERIF, color: OAT, fontSize: 12, fontWeight: 600 }}>
            Cleard
          </span>
          <div className="ml-auto hidden gap-3.5 sm:flex">
            {TABS.map((t, i) => (
              <span
                key={t}
                className="text-[9px] uppercase"
                style={{
                  fontFamily: MONO,
                  letterSpacing: "0.14em",
                  color: i === activeTab ? OAT : "rgba(250,243,230,0.42)",
                  borderBottom: i === activeTab ? `1px solid ${OAT}` : "1px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 p-3">{children}</div>
      </div>
      {/* laptop base */}
    </div>
  );
}

const DASH_METRICS: [string, string][] = [
  ["Active permits", "17"],
  ["On time", "94%"],
  ["Avg review", "48h"],
  ["Open corrections", "2"],
];

function SceneDashboard() {
  return (
    <Laptop activeTab={0}>
      <div className="grid h-full grid-cols-2 gap-2.5 sm:grid-cols-4">
        {DASH_METRICS.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center px-2 py-3 text-center"
            style={{ border: "1px solid rgba(250,243,230,0.14)" }}
          >
            <div
              className="text-[8px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(250,243,230,0.55)" }}
            >
              {label}
            </div>
            <div className="mt-2" style={{ fontFamily: SERIF, fontSize: 30, color: OAT, lineHeight: 1 }}>
              {value}
            </div>
          </div>
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
      <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <DarkEyebrow>Permits</DarkEyebrow>
          <div className="mt-2 space-y-2.5">
            {[
              ["CLR-2026-0208", 82],
              ["CLR-2026-0211", 46],
              ["CLR-2026-0214", 21],
            ].map(([id, pct]) => (
              <div key={id as string}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px]" style={{ color: OAT }}>
                    {id}
                  </span>
                  <span className="text-[8.5px]" style={{ fontFamily: MONO, color: "rgba(250,243,230,0.55)" }}>
                    {pct}%
                  </span>
                </div>
                <div className="mt-1 h-[3px] w-full" style={{ background: "rgba(250,243,230,0.14)" }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: OAT }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <DarkEyebrow>Inspections</DarkEyebrow>
          <div className="mt-2 space-y-2">
            {[
              ["Structural framing", true],
              ["Electrical rough", false],
              ["Plumbing top-out", true],
            ].map(([trade, ok]) => (
              <div key={trade as string} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[10px]" style={{ color: OAT }}>
                  {trade}
                </span>
                <span
                  className="shrink-0 text-[11px]"
                  style={{ color: ok ? "#9BB8A6" : "#D89A9A" }}
                  aria-hidden
                >
                  {ok ? "✓" : "✕"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <DarkEyebrow>Compliance</DarkEyebrow>
          <div className="mt-2 space-y-2">
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

const SCENES = [SceneOverview, SceneDashboard, ScenePortal];

export function HeroStage() {
  const [scene, setScene] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setReduced(true);
      return;
    }
    const id = window.setInterval(() => setScene((s) => (s + 1) % SCENES.length), 4000);
    return () => window.clearInterval(id);
  }, []);

  const Active = SCENES[scene];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <style>{`
        @keyframes clSpin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        @keyframes clSceneIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>




      {/* the frame */}
      <div
        className="mt-8 overflow-hidden"
        style={{
          height: FRAME_H,
          background: "#FFFFFF",
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
        }}
      >
        <div
          key={scene}
          className="h-full w-full"
          style={{ animation: reduced ? undefined : "clSceneIn 600ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <Active />
        </div>
      </div>

      {/* dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SCENES.map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full transition-opacity duration-300"
            style={{ background: i === scene ? BRONZE : PLUM, opacity: i === scene ? 1 : 0.22 }}
          />
        ))}
      </div>

      {/* pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/contact"
          className="inline-flex items-center rounded-full px-5 py-2 text-[12.5px] no-underline"
          style={{ border: `1px solid ${GREEN}`, color: GREEN, fontWeight: 600 }}
        >
          See it in action
        </Link>
        <Link
          to="/join"
          hash="request"
          className="inline-flex items-center rounded-full px-5 py-2 text-[12.5px] no-underline"
          style={{ background: BRONZE, color: OAT, fontWeight: 600 }}
        >
          Get early access
        </Link>
      </div>
    </div>
  );
}

export default HeroStage;
