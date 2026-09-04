import { useState } from "react";

export type RegisteredMuni = {
  name: string;
  county: string;
  lat: number;
  lng: number;
};

export const REGISTERED_MUNIS: RegisteredMuni[] = [
  { name: "Village of Wellington", county: "Palm Beach", lat: 26.658, lng: -80.267 },
  { name: "City of Port St. Lucie", county: "St. Lucie", lat: 27.273, lng: -80.358 },
  { name: "North Palm Beach", county: "Palm Beach", lat: 26.817, lng: -80.083 },
  { name: "City of Westlake", county: "Palm Beach", lat: 26.752, lng: -80.320 },
  { name: "Loxahatchee / Royal Palm Beach", county: "Palm Beach", lat: 26.708, lng: -80.230 },
  { name: "Jupiter", county: "Palm Beach", lat: 26.934, lng: -80.094 },
  { name: "Hobe Sound", county: "Martin", lat: 27.068, lng: -80.135 },
  { name: "Palm Beach Gardens", county: "Palm Beach", lat: 26.823, lng: -80.139 },
  { name: "Plantation", county: "Broward", lat: 26.133, lng: -80.234 },
  { name: "Miami Beach", county: "Miami-Dade", lat: 25.790, lng: -80.130 },
  { name: "Fort Pierce", county: "St. Lucie", lat: 27.446, lng: -80.326 },
  { name: "Vero Beach", county: "Indian River", lat: 27.638, lng: -80.397 },
  { name: "Boca Raton", county: "Palm Beach", lat: 26.359, lng: -80.083 },
  { name: "Palm Beach", county: "Palm Beach", lat: 26.706, lng: -80.037 },
];

const OBSIDIAN = "#000000";
const SKY = "#E6E6FA";

// Projection bounds — South Florida coastal corridor
const LAT_MAX = 27.85;
const LAT_MIN = 25.55;
const LNG_MIN = -80.75;
const LNG_MAX = -79.85;

const VB_W = 600;
const VB_H = 900;

function project(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VB_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VB_H;
  return { x, y };
}

// Reference points for the FL Atlantic coastline (lat, lng) — stylized
const COAST: [number, number][] = [
  [27.85, -80.45], // above Vero
  [27.64, -80.37],
  [27.45, -80.30],
  [27.27, -80.24],
  [27.07, -80.14],
  [26.93, -80.07],
  [26.82, -80.03],
  [26.70, -80.02],
  [26.50, -80.03],
  [26.35, -80.05],
  [26.13, -80.11],
  [25.95, -80.12],
  [25.77, -80.13],
  [25.55, -80.16],
];

export default function MunicipalityMap() {
  const [hover, setHover] = useState<number | null>(null);

  const coastPts = COAST.map(([la, ln]) => project(la, ln));
  const landPath =
    `M -20 -20 L ${VB_W + 20} -20 ` +
    coastPts.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${VB_W + 20} ${VB_H + 20} L -20 ${VB_H + 20} Z`;
  // Land = left of coastline
  const oceanPath =
    coastPts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") +
    ` L ${VB_W + 40} ${VB_H + 40} L ${VB_W + 40} -40 Z`;

  // County reference labels
  const countyLabels: { name: string; lat: number; lng: number }[] = [
    { name: "INDIAN RIVER", lat: 27.72, lng: -80.62 },
    { name: "ST. LUCIE", lat: 27.35, lng: -80.62 },
    { name: "MARTIN", lat: 27.05, lng: -80.55 },
    { name: "PALM BEACH", lat: 26.55, lng: -80.55 },
    { name: "BROWARD", lat: 26.15, lng: -80.55 },
    { name: "MIAMI-DADE", lat: 25.75, lng: -80.55 },
  ];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto block"
        style={{ maxHeight: 820 }}
        role="img"
        aria-label="Municipalities where Cleard is registered"
      >
        <defs>
          <pattern id="wave-pattern" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke={OBSIDIAN} strokeWidth="1" opacity="0.06" />
          </pattern>
          <pattern id="ocean-wave" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="18" stroke={SKY} strokeWidth="1.2" opacity="0.45" />
          </pattern>
          <radialGradient id="pin-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={SKY} stopOpacity="0.9" />
            <stop offset="60%" stopColor={SKY} stopOpacity="0.15" />
            <stop offset="100%" stopColor={SKY} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ocean */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="#EEF6FB" />
        <path d={oceanPath} fill="url(#ocean-wave)" />

        {/* Land */}
        <path d={landPath} fill="#FFFFFF" />
        <path d={landPath} fill="url(#wave-pattern)" />

        {/* Coastline stroke */}
        <path
          d={coastPts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")}
          fill="none"
          stroke={OBSIDIAN}
          strokeWidth="1.5"
          opacity="0.55"
        />

        {/* County labels */}
        {countyLabels.map((c) => {
          const p = project(c.lat, c.lng);
          return (
            <text
              key={c.name}
              x={p.x}
              y={p.y}
              fill={OBSIDIAN}
              opacity="0.35"
              fontSize="13"
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing="2"
              textAnchor="middle"
            >
              {c.name}
            </text>
          );
        })}

        {/* Ocean label */}
        <text
          x={project(26.9, -79.95).x}
          y={project(26.9, -79.95).y}
          fill={OBSIDIAN}
          opacity="0.35"
          fontSize="14"
          fontFamily="'JetBrains Mono', monospace"
          letterSpacing="4"
          textAnchor="middle"
          transform={`rotate(-90 ${project(26.9, -79.95).x} ${project(26.9, -79.95).y})`}
        >
          ATLANTIC OCEAN
        </text>

        {/* Pins */}
        {REGISTERED_MUNIS.map((m, i) => {
          const p = project(m.lat, m.lng);
          const active = hover === i;
          return (
            <g
              key={m.name}
              transform={`translate(${p.x} ${p.y})`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              style={{ cursor: "pointer" }}
            >
              <circle r="22" fill="url(#pin-glow)" opacity={active ? 1 : 0.7} />
              <circle
                r={active ? 10 : 7}
                fill={OBSIDIAN}
                stroke="#FFFFFF"
                strokeWidth="2"
                style={{ transition: "r 150ms ease" }}
              />
              <circle r="3" fill={SKY} />
            </g>
          );
        })}

        {/* Tooltip */}
        {hover !== null &&
          (() => {
            const m = REGISTERED_MUNIS[hover];
            const p = project(m.lat, m.lng);
            const tw = Math.max(m.name.length * 7.2 + 90, 210);
            const th = 56;
            // Flip to left if near right edge
            const flip = p.x > VB_W - tw - 20;
            const tx = flip ? p.x - tw - 16 : p.x + 16;
            const ty = Math.min(Math.max(p.y - th / 2, 8), VB_H - th - 8);
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect
                  x={tx}
                  y={ty}
                  width={tw}
                  height={th}
                  rx="3"
                  fill={OBSIDIAN}
                  stroke={SKY}
                  strokeWidth="1"
                />
                <text
                  x={tx + 14}
                  y={ty + 22}
                  fill="#FFFFFF"
                  fontSize="14"
                  fontFamily="'Instrument Sans', sans-serif"
                  fontWeight="600"
                >
                  {m.name}
                </text>
                <text
                  x={tx + 14}
                  y={ty + 40}
                  fill={SKY}
                  fontSize="10"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="1.5"
                >
                  {m.county.toUpperCase()} COUNTY · REGISTERED
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}

export function MunicipalityMapHero() {
  return (
    <section
      className="relative rounded-sm border overflow-hidden"
      style={{ background: "#FFFFFF", borderColor: "rgba(0,0,0,0.15)" }}
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-0">
        <div className="p-8 md:p-10 flex flex-col justify-center" style={{ background: OBSIDIAN, color: "#FFFFFF" }}>
          <div className="font-mono text-[10px] tracking-[0.24em] uppercase" style={{ color: SKY }}>
            Coverage Map
          </div>
          <h2
            className="mt-4 leading-[0.95]"
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: "clamp(48px, 6vw, 88px)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            Registered in
            <br />
            <span style={{ color: SKY }}>{REGISTERED_MUNIS.length}</span> Municipalities
          </h2>
          <p className="mt-6 text-sm md:text-base leading-relaxed opacity-90 max-w-md">
            From Miami Beach to Vero Beach — we pull permits where you build.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Miami-Dade", "Broward", "Palm Beach", "Martin", "St. Lucie", "Indian River"].map((c) => (
              <span
                key={c}
                className="font-mono text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 border"
                style={{ borderColor: "rgba(182,218,234,0.4)", color: SKY }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="p-4 md:p-6 bg-white">
          <MunicipalityMap />
        </div>
      </div>
      <div className="border-t px-6 py-4 flex flex-wrap gap-x-6 gap-y-2" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
        {REGISTERED_MUNIS.map((m) => (
          <div key={m.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: OBSIDIAN }} />
            <span className="text-xs" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
              {m.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
