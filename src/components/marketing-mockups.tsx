/**
 * Shared marketing visuals — UI mockups, SVG line art, and data viz built from
 * the Cleard design language (zero radius, teal accents, dark surfaces).
 * Public marketing site only. Never imported by portal routes.
 */
import type { ReactNode } from "react";
import { Check, Minus, Sparkles } from "lucide-react";

/* ------------------------------- tokens ---------------------------------- */

export const M = {
  bg0: "#1E3333",
  bg1: "#26403F",
  bg2: "#26403F",
  line: "rgba(250,243,230,0.12)",
  line2: "rgba(250,243,230,0.07)",
  text: "#F3EAD9",
  muted: "rgba(250,243,230,0.56)",
  faint: "rgba(250,243,230,0.34)",
  teal: "#673147",
  amber: "#E0A83A",
  red: "#E06060",
  blue: "#5FA8E0",
} as const;

const CHIP: Record<string, { bg: string; fg: string }> = {
  APPROVED: { bg: "rgba(103,49,71,0.16)", fg: M.teal },
  PASSED: { bg: "rgba(103,49,71,0.16)", fg: M.teal },
  CLEAR: { bg: "rgba(103,49,71,0.16)", fg: M.teal },
  VERIFIED: { bg: "rgba(103,49,71,0.16)", fg: M.teal },
  RECORDED: { bg: "rgba(103,49,71,0.16)", fg: M.teal },
  "IN REVIEW": { bg: "rgba(95,168,224,0.16)", fg: M.blue },
  SCHEDULED: { bg: "rgba(95,168,224,0.16)", fg: M.blue },
  SIGNED: { bg: "rgba(95,168,224,0.16)", fg: M.blue },
  CORRECTIONS: { bg: "rgba(224,96,96,0.16)", fg: M.red },
  EXPIRED: { bg: "rgba(224,96,96,0.16)", fg: M.red },
  FAILED: { bg: "rgba(224,96,96,0.16)", fg: M.red },
  MISSING: { bg: "rgba(224,96,96,0.16)", fg: M.red },
  "DUE SOON": { bg: "rgba(224,168,58,0.16)", fg: M.amber },
  DRAFT: { bg: "rgba(224,168,58,0.16)", fg: M.amber },
  PENDING: { bg: "rgba(224,168,58,0.16)", fg: M.amber },
};

export function Chip({ children }: { children: string }) {
  const c = CHIP[children.toUpperCase()] ?? { bg: "rgba(250,243,230,0.08)", fg: M.faint };
  return (
    <span
      className="inline-block px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.1em] whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

/* --------------------------- frames & shells ----------------------------- */

export function TealGlow({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 55% at 50% 40%, rgba(103,49,71,0.30) 0%, rgba(103,49,71,0.07) 45%, transparent 72%)",
        opacity,
      }}
    />
  );
}

export function BrowserFrame({
  path,
  children,
  compact = false,
}: {
  path: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: M.bg1,
        border: `1px solid ${M.line}`,
        boxShadow: "0 40px 90px -40px rgba(0,0,0,0.85)",
      }}
    >
      <div
        className="flex items-center gap-3 px-3 py-2.5"
        style={{ background: M.bg0, borderBottom: `1px solid ${M.line}` }}
      >
        <div className="flex items-center gap-1.5">
          {["rgba(250,243,230,0.22)", "rgba(250,243,230,0.16)", "rgba(250,243,230,0.12)"].map((c) => (
            <span key={c} className="h-2 w-2" style={{ background: c, borderRadius: 999 }} />
          ))}
        </div>
        <div
          className="flex-1 truncate px-3 py-1 text-[10.5px]"
          style={{ background: M.bg1, border: `1px solid ${M.line2}`, color: M.faint }}
        >
          {path}
        </div>
      </div>
      <div className={compact ? "" : "min-h-[240px]"}>{children}</div>
    </div>
  );
}

function Rail({ active }: { active: string }) {
  const items = ["Permits", "Inspections", "Licenses", "Insurance", "Lien Rights", "Documents"];
  return (
    <div className="hidden sm:block py-3" style={{ background: M.bg0, borderRight: `1px solid ${M.line}` }}>
      <div className="px-4 pb-4 text-[14px] font-bold" style={{ color: M.text, letterSpacing: "-0.03em" }}>
        Cleard
      </div>
      {items.map((i) => (
        <div
          key={i}
          className="px-4 py-[7px] text-[11.5px]"
          style={
            i === active
              ? { color: M.text, fontWeight: 600, background: M.bg2, borderLeft: `2px solid ${M.teal}` }
              : { color: M.muted, borderLeft: "2px solid transparent" }
          }
        >
          {i}
        </div>
      ))}
    </div>
  );
}

export function AppFrame({
  path,
  active,
  children,
}: {
  path: string;
  active: string;
  children: ReactNode;
}) {
  return (
    <BrowserFrame path={path} compact>
      <div className="grid grid-cols-[1fr] sm:grid-cols-[148px_1fr]">
        <Rail active={active} />
        <div className="min-w-0">{children}</div>
      </div>
    </BrowserFrame>
  );
}

function PanelHead({ title, action }: { title: string; action?: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3"
      style={{ borderBottom: `1px solid ${M.line}` }}
    >
      <span className="text-[12.5px] font-semibold" style={{ color: M.text }}>
        {title}
      </span>
      {action && (
        <span className="px-2.5 py-1 text-[10.5px] font-bold" style={{ background: M.teal, color: M.bg0 }}>
          {action}
        </span>
      )}
    </div>
  );
}

/* ------------------------------ 1. kanban -------------------------------- */

const KANBAN: { col: string; count: string; cards: { id: string; addr: string; juris: string; chip: string }[] }[] = [
  {
    col: "In Review",
    count: "04",
    cards: [
      { id: "CLR-2026-0212", addr: "14 Pelican Bay Ln", juris: "Collier County", chip: "IN REVIEW" },
      { id: "CLR-2026-0204", addr: "901 Harbour Ct", juris: "Palm Beach", chip: "IN REVIEW" },
    ],
  },
  {
    col: "Corrections",
    count: "02",
    cards: [
      { id: "CLR-2026-0208", addr: "2840 SW 48th Ct", juris: "Miami-Dade", chip: "CORRECTIONS" },
      { id: "CLR-2026-0186", addr: "318 Beachway Dr", juris: "Martin County", chip: "CORRECTIONS" },
    ],
  },
  {
    col: "Approved",
    count: "11",
    cards: [
      { id: "CLR-2026-0199", addr: "7720 NW 2nd Ave", juris: "Palm Beach", chip: "APPROVED" },
      { id: "CLR-2026-0195", addr: "5612 SE Coconut Ter", juris: "St. Lucie", chip: "APPROVED" },
    ],
  },
];

export function KanbanMock() {
  return (
    <div>
      <PanelHead title="My Permits · Pipeline" action="+ New permit" />
      <div className="flex items-center gap-5 px-4 py-3" style={{ borderBottom: `1px solid ${M.line2}` }}>
        {[
          { k: "17", v: "Active" },
          { k: "94%", v: "On time" },
          { k: "48h", v: "Avg review" },
        ].map((s) => (
          <div key={s.v} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold tabular-nums" style={{ color: M.text }}>
              {s.k}
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: M.faint }}>
              {s.v}
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-px sm:grid-cols-3" style={{ background: M.line2 }}>
        {KANBAN.map((c) => (
          <div key={c.col} className="p-3" style={{ background: M.bg1 }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: M.faint }}>
                {c.col}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: M.faint }}>
                {c.count}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {c.cards.map((k) => (
                <div key={k.id} className="p-3" style={{ background: M.bg2, borderLeft: `2px solid ${M.teal}` }}>
                  <div className="text-[10.5px] font-semibold tabular-nums" style={{ color: M.teal }}>
                    {k.id}
                  </div>
                  <div className="mt-1.5 truncate text-[12px]" style={{ color: M.text }}>
                    {k.addr}
                  </div>
                  <div className="mt-0.5 text-[10.5px]" style={{ color: M.faint }}>
                    {k.juris}
                  </div>
                  <div className="mt-2.5">
                    <Chip>{k.chip}</Chip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- 2. intake form ------------------------------ */

export function IntakeFormMock() {
  const fields: [string, string][] = [
    ["Project address", "14 Pelican Bay Ln, Naples"],
    ["Jurisdiction", "Collier County · Unincorporated"],
    ["Scope of work", "New pool, spa & paver deck"],
    ["Construction value", "$284,500"],
  ];
  return (
    <div>
      <PanelHead title="New permit application" action="Submit" />
      <div className="p-4 space-y-3">
        {fields.map(([l, v]) => (
          <div key={l}>
            <div className="text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: M.faint }}>
              {l}
            </div>
            <div
              className="mt-1.5 px-3 py-2 text-[12px]"
              style={{ background: M.bg2, border: `1px solid ${M.line2}`, color: M.text }}
            >
              {v}
            </div>
          </div>
        ))}
        <div className="pt-1">
          <div className="text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: M.faint }}>
            Documents
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              ["Stamped construction plans", "VERIFIED"],
              ["Site / spot survey", "VERIFIED"],
              ["Product approvals / NOA", "PENDING"],
            ].map(([d, s]) => (
              <div
                key={d}
                className="flex items-center justify-between gap-2 px-3 py-2"
                style={{ background: M.bg2, border: `1px solid ${M.line2}` }}
              >
                <span className="truncate text-[11.5px]" style={{ color: M.text }}>
                  {d}
                </span>
                <Chip>{s}</Chip>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 3. CO cert ------------------------------- */

export function CertificateMock() {
  return (
    <div className="p-5" style={{ background: M.bg1 }}>
      <div className="relative p-6" style={{ background: M.bg2, border: `1px solid ${M.line}` }}>
        <div className="text-[9.5px] font-bold uppercase tracking-[0.24em]" style={{ color: M.teal }}>
          Certificate of Occupancy
        </div>
        <div className="mt-4 text-[17px] font-bold" style={{ color: M.text, letterSpacing: "-0.02em" }}>
          14 Pelican Bay Ln
        </div>
        <div className="mt-1 text-[11.5px]" style={{ color: M.muted }}>
          Permit CLR-2026-0212 · Collier County
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          {[
            ["Final inspections", "6 of 6 passed"],
            ["Issued", "Aug 14, 2026"],
            ["Private provider", "Cleard · Licensed"],
            ["Closeout package", "12 documents"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: M.faint }}>
                {k}
              </div>
              <div className="mt-1 text-[12px]" style={{ color: M.text }}>
                {v}
              </div>
            </div>
          ))}
        </div>

        {/* APPROVED stamp */}
        <div
          className="absolute -right-2 bottom-4 px-4 py-2"
          style={{
            border: `2px solid ${M.teal}`,
            color: M.teal,
            transform: "rotate(-8deg)",
            background: "rgba(103,49,71,0.08)",
          }}
        >
          <div className="text-[13px] font-bold uppercase tracking-[0.22em]">Approved</div>
          <div className="text-[8.5px] uppercase tracking-[0.16em]" style={{ opacity: 0.8 }}>
            Cleared for occupancy
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- 4. inspection calendar ----------------------- */

export function InspectionCalendarMock() {
  const days = ["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14"];
  const slots: Record<string, { t: string; chip: string }[]> = {
    "Mon 10": [{ t: "Framing · 901 Harbour", chip: "PASSED" }],
    "Tue 11": [{ t: "Roof dry-in · 5612 SE", chip: "FAILED" }],
    "Wed 12": [
      { t: "Final elec · 14 Pelican", chip: "SCHEDULED" },
      { t: "Plumbing · 2840 SW", chip: "SCHEDULED" },
    ],
    "Thu 13": [{ t: "Mechanical · 318 Beachway", chip: "SCHEDULED" }],
    "Fri 14": [{ t: "Final · 7720 NW 2nd", chip: "SCHEDULED" }],
  };
  return (
    <div>
      <PanelHead title="Inspections · This week" action="Schedule" />
      <div className="p-3">
        <div className="p-3" style={{ background: M.bg2, borderLeft: `2px solid ${M.teal}` }}>
          <div className="text-[9.5px] font-bold uppercase tracking-[0.16em]" style={{ color: M.teal }}>
            Live now
          </div>
          <div className="mt-1.5 text-[13px] font-semibold" style={{ color: M.text }}>
            Final Electrical · 14 Pelican Bay Ln
          </div>
          <div className="mt-1 text-[11px]" style={{ color: M.muted }}>
            Inspector on site · same-day inspection
          </div>
        </div>
        <div className="mt-3 grid gap-px sm:grid-cols-5" style={{ background: M.line2 }}>
          {days.map((d) => (
            <div key={d} className="p-2.5" style={{ background: M.bg1, minHeight: 118 }}>
              <div className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: M.faint }}>
                {d}
              </div>
              <div className="mt-2 space-y-2">
                {(slots[d] ?? []).map((s) => (
                  <div key={s.t} className="p-2" style={{ background: M.bg2 }}>
                    <div className="text-[10.5px] leading-snug" style={{ color: M.text }}>
                      {s.t}
                    </div>
                    <div className="mt-1.5">
                      <Chip>{s.chip}</Chip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- 5. license dashboard ------------------------- */

export function LicenseDashMock() {
  const rows: [string, string, string, string][] = [
    ["Gulfstream Electric", "EC13009821", "Renews in 214 days", "VERIFIED"],
    ["Atlantic Plumbing Co", "CFC1428817", "Renews in 41 days", "DUE SOON"],
    ["Coastal Roofing LLC", "CCC1331902", "Expired 6 days ago", "EXPIRED"],
    ["Meridian Mechanical", "CAC1819330", "Renews in 302 days", "VERIFIED"],
  ];
  return (
    <div>
      <PanelHead title="License management" action="Verify" />
      <div className="grid grid-cols-3 gap-px" style={{ background: M.line2 }}>
        {[
          { k: "38", v: "Licenses tracked", c: M.text },
          { k: "3", v: "Renewals < 60 days", c: M.amber },
          { k: "1", v: "Expired", c: M.red },
        ].map((s) => (
          <div key={s.v} className="p-4" style={{ background: M.bg1 }}>
            <div className="text-[26px] font-bold leading-none tabular-nums" style={{ color: s.c }}>
              {s.k}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.12em]" style={{ color: M.faint }}>
              {s.v}
            </div>
          </div>
        ))}
      </div>
      <div>
        {rows.map((r) => (
          <div
            key={r[1]}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
            style={{ borderTop: `1px solid ${M.line2}` }}
          >
            <div className="min-w-0">
              <div className="truncate text-[12px]" style={{ color: M.text }}>
                {r[0]}
              </div>
              <div className="text-[10.5px]" style={{ color: M.faint }}>
                {r[1]} · {r[2]}
              </div>
            </div>
            <Chip>{r[3]}</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------- 6. COI compliance ---------------------------- */

export function CoiCheckMock() {
  const subs: { name: string; checks: boolean[]; chip: string }[] = [
    { name: "Gulfstream Electric", checks: [true, true, true, true], chip: "CLEAR" },
    { name: "Atlantic Plumbing Co", checks: [true, true, true, false], chip: "PENDING" },
    { name: "Coastal Roofing LLC", checks: [true, false, false, false], chip: "EXPIRED" },
    { name: "Meridian Mechanical", checks: [true, true, true, true], chip: "CLEAR" },
  ];
  const cols = ["GL", "WC", "Auto", "Addl insured"];
  return (
    <div>
      <PanelHead title="COI compliance checker" action="Request COI" />
      <div
        className="grid grid-cols-[1fr_repeat(4,44px)_84px] gap-2 px-4 py-2 text-[9.5px] font-bold uppercase tracking-[0.1em]"
        style={{ color: M.faint, borderBottom: `1px solid ${M.line}` }}
      >
        <span>Subcontractor</span>
        {cols.map((c) => (
          <span key={c} className="text-center">
            {c === "Addl insured" ? "AI" : c}
          </span>
        ))}
        <span>Status</span>
      </div>
      {subs.map((s) => (
        <div
          key={s.name}
          className="grid grid-cols-[1fr_repeat(4,44px)_84px] items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `1px solid ${M.line2}` }}
        >
          <span className="truncate text-[12px]" style={{ color: M.text }}>
            {s.name}
          </span>
          {s.checks.map((ok, i) => (
            <span key={i} className="flex justify-center">
              {ok ? (
                <Check className="h-3.5 w-3.5" style={{ color: M.teal }} strokeWidth={2.5} />
              ) : (
                <Minus className="h-3.5 w-3.5" style={{ color: M.red }} strokeWidth={2.5} />
              )}
            </span>
          ))}
          <Chip>{s.chip}</Chip>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- 7. lien rights ----------------------------- */

export function LienDocsMock() {
  const docs: [string, string][] = [
    ["NOC — 14 Pelican Bay Ln", "RECORDED"],
    ["Preliminary Notice — 901 Harbour Ct", "SIGNED"],
    ["Conditional Waiver — 2840 SW 48th", "DRAFT"],
    ["Final Waiver — 7720 NW 2nd Ave", "SIGNED"],
  ];
  const deadlines: [string, string, string][] = [
    ["Preliminary Notice", "5612 SE Coconut Ter", "4 days"],
    ["Claim of Lien", "318 Beachway Dr", "19 days"],
    ["Action on Lien", "2840 SW 48th Ct", "88 days"],
  ];
  return (
    <div>
      <PanelHead title="Lien rights" action="Generate" />
      <div className="grid gap-px sm:grid-cols-2" style={{ background: M.line2 }}>
        <div style={{ background: M.bg1 }}>
          <div className="px-4 py-2 text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: M.faint }}>
            Documents
          </div>
          {docs.map((d) => (
            <div
              key={d[0]}
              className="flex items-center justify-between gap-2 px-4 py-2.5"
              style={{ borderTop: `1px solid ${M.line2}` }}
            >
              <span className="truncate text-[11.5px]" style={{ color: M.text }}>
                {d[0]}
              </span>
              <Chip>{d[1]}</Chip>
            </div>
          ))}
        </div>
        <div style={{ background: M.bg1 }}>
          <div className="px-4 py-2 text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: M.faint }}>
            Deadline tracker
          </div>
          {deadlines.map((d, i) => (
            <div key={d[1]} className="px-4 py-2.5" style={{ borderTop: `1px solid ${M.line2}` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11.5px]" style={{ color: M.text }}>
                  {d[0]}
                </span>
                <span
                  className="text-[10.5px] font-bold tabular-nums"
                  style={{ color: i === 0 ? M.red : i === 1 ? M.amber : M.teal }}
                >
                  {d[2]}
                </span>
              </div>
              <div className="mt-1 text-[10.5px]" style={{ color: M.faint }}>
                {d[1]}
              </div>
              <div className="mt-2 h-[3px]" style={{ background: M.line2 }}>
                <div
                  style={{
                    width: i === 0 ? "88%" : i === 1 ? "54%" : "22%",
                    height: "100%",
                    background: i === 0 ? M.red : i === 1 ? M.amber : M.teal,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Victoria visuals ---------------------------- */

export function NeuralArt() {
  const nodes = [
    [40, 60],
    [40, 150],
    [40, 240],
    [140, 40],
    [140, 110],
    [140, 190],
    [140, 260],
    [240, 80],
    [240, 160],
    [240, 240],
    [330, 150],
  ];
  const edges = [
    [0, 3],
    [0, 4],
    [1, 4],
    [1, 5],
    [2, 5],
    [2, 6],
    [3, 7],
    [4, 7],
    [4, 8],
    [5, 8],
    [5, 9],
    [6, 9],
    [7, 10],
    [8, 10],
    [9, 10],
  ];
  return (
    <svg viewBox="0 0 380 300" className="w-full h-auto" aria-hidden>
      <path
        d="M0 250 C 60 200, 100 290, 160 240 S 260 160, 380 210"
        fill="none"
        stroke={M.teal}
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M0 275 C 70 235, 110 305, 175 262 S 275 190, 380 236"
        fill="none"
        stroke={M.teal}
        strokeWidth="1"
        opacity="0.18"
      />
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke={M.teal}
          strokeWidth="0.75"
          opacity="0.4"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === 10 ? 9 : 4} fill={M.bg0} stroke={M.teal} strokeWidth="1.25" />
          {i === 10 && <circle cx={x} cy={y} r="3" fill={M.teal} />}
        </g>
      ))}
    </svg>
  );
}

export function VictoriaChatMock() {
  return (
    <div style={{ background: M.bg1, border: `1px solid ${M.line}` }}>
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: M.bg0, borderBottom: `1px solid ${M.line}` }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: M.teal }} strokeWidth={1.75} />
        <span className="text-[11.5px] font-semibold" style={{ color: M.text }}>
          Ask Victoria
        </span>
        <span className="ml-auto text-[9.5px] uppercase tracking-[0.14em]" style={{ color: M.teal }}>
          Online
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-end">
          <div
            className="max-w-[85%] px-3.5 py-2.5 text-[12px] leading-relaxed"
            style={{ background: M.bg2, color: M.text }}
          >
            What&apos;s the setback requirement for a pool in Martin County?
          </div>
        </div>
        <div className="flex">
          <div
            className="max-w-[92%] px-3.5 py-2.5 text-[12px] leading-relaxed"
            style={{ background: "rgba(103,49,71,0.1)", borderLeft: `2px solid ${M.teal}`, color: M.text }}
          >
            Martin County requires a 7.5-ft rear setback for pool equipment and 6 ft from the water&apos;s
            edge to the rear property line. Screen enclosures reduce to 5 ft with an engineered tie-down
            detail.
            <div className="mt-2.5 text-[10.5px]" style={{ color: M.muted }}>
              Cited from the county land development code · updated 11 days ago
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {["Flag missing docs", "Draft correction reply", "Check my deadlines"].map((s) => (
            <span
              key={s}
              className="px-2.5 py-1.5 text-[10px]"
              style={{ border: `1px solid ${M.line}`, color: M.muted }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ trust bar -------------------------------- */

export const TRUST_LOGOS = [
  "GULFSTREAM BUILDERS",
  "HARBOUR RIDGE CO",
  "MERIDIAN CONSTRUCTION",
  "ATLANTIC POOLS GROUP",
  "CROSSWIND HOMES",
  "NORTHSTAR GENERAL",
];

export const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      "We cut three weeks off every permit and stopped chasing COIs entirely. My PM got her Fridays back.",
    name: "D. Alvarez",
    role: "VP Operations · Gulfstream Builders",
  },
  {
    quote:
      "Victoria caught a missing product approval before submittal. That single flag saved us a full review cycle.",
    name: "M. Whitfield",
    role: "Preconstruction Manager · Crosswind Homes",
  },
  {
    quote:
      "Lien deadlines, licenses, insurance, permits — one login. We replaced four vendors with Cleard.",
    name: "R. Okafor",
    role: "Owner · Northstar General",
  },
];
