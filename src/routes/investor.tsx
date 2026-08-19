import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  checkEmailDomain,
  readInvestorAccess,
  redeemAccessCode,
  writeInvestorAccess,
} from "@/lib/investor-access";



export const Route = createFileRoute("/investor")({
  head: () => ({
    meta: [
      { title: "Investor Deck — Cleard" },
      {
        name: "description",
        content:
          "Cleard investor deck: the operating system for America's built environment. Contractor platform, permit fee processing, and municipal building department infrastructure.",
      },
      { property: "og:title", content: "Cleard Investor Deck" },
      {
        property: "og:description",
        content:
          "$20B+ addressable market across contractor SaaS, permit fee processing, and outsourced municipal building department operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvestorPage,
});

const BG = "#2F4F4F";
const SURFACE = "#2F4F4F";
const LIGHT = "#F3EAD9";
const INK = "#2F4F4F";
const BORDER = "#3F5C5A";
const BORDER_LT = "#DCD9D1";
const TEAL = "#E6E6FA";
const OFF = "#F3EAD9";
const MUTED = "rgba(250, 243, 230, 0.62)";
const MUTED_LT = "#6B6A5E";
const SANS = "'Fraunces', 'Iowan Old Style', Georgia, serif";
const MONO = "ui-monospace, Menlo, Monaco, monospace";

const TOTAL = 11;

function Slide({
  n,
  light,
  children,
  style,
}: {
  n?: number;
  light?: boolean;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className="relative flex min-h-screen w-full flex-col justify-center"
      style={{
        scrollSnapAlign: "start",
        background: light ? LIGHT : BG,
        color: light ? INK : OFF,
        fontFamily: SANS,
        borderTop: `1px solid ${light ? BORDER_LT : BORDER}`,
        ...style,
      }}
    >
      {n !== undefined && (
        <div
          className="absolute right-6 top-6 text-[11px] tracking-[0.18em] lg:right-10 lg:top-10"
          style={{ fontFamily: MONO, color: light ? MUTED_LT : MUTED }}
        >
          {String(n).padStart(2, "0")} / {TOTAL}
        </div>
      )}
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:px-10">{children}</div>
    </section>
  );
}

function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.22em]"
      style={{ fontFamily: MONO, color: light ? "#673147" : TEAL }}
    >
      {children}
    </div>
  );
}

function Headline({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <h2
      className="mt-5 max-w-4xl text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[40px]"
      style={{ color: light ? INK : OFF }}
    >
      {children}
    </h2>
  );
}

function Lede({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className="mt-5 max-w-3xl text-[15px] leading-relaxed"
      style={{ color: light ? MUTED_LT : MUTED }}
    >
      {children}
    </p>
  );
}

function NumRow({
  n,
  children,
  light,
}: {
  n: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[44px_1fr] gap-5 py-5"
      style={{ borderTop: `1px solid ${light ? BORDER_LT : BORDER}` }}
    >
      <div className="text-[13px]" style={{ fontFamily: MONO, color: TEAL }}>
        {n}
      </div>
      <div
        className="text-[14px] leading-relaxed"
        style={{ color: light ? "#2F4F4F" : "#CFBE9F" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- Cover ---------------- */

function Cover() {
  return (
    <section
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden"
      style={{ scrollSnapAlign: "start", background: BG, color: OFF, fontFamily: SANS }}
    >
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[620px] w-[620px]"
        style={{
          background: `radial-gradient(circle, rgba(103, 49, 71,0.20) 0%, rgba(103, 49, 71,0) 68%)`,
        }}
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 py-20 lg:px-10">
        <Eyebrow>Cleard</Eyebrow>
        <h1
          className="mt-6 max-w-4xl text-[34px] leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-[56px]"
          style={{ color: OFF }}
        >
          The Operating System for America&apos;s Built Environment
        </h1>

        <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div
            className="text-[44px] leading-none font-bold sm:text-[52px]"
            style={{ fontFamily: MONO, color: TEAL }}
          >
            $2T
          </div>
          <p className="max-w-md text-[14px] leading-relaxed" style={{ color: MUTED }}>
            Built in the US every year. Permitted by a system that has not changed since the
            fax machine.
          </p>
        </div>

        <div className="mt-12" style={{ borderTop: `1px solid ${BORDER}` }} />
        <p className="mt-8 max-w-2xl text-[15px] leading-relaxed" style={{ color: "#CFBE9F" }}>
          From contractor back office to national building department infrastructure: the
          operating system for America&apos;s construction industry.
        </p>

        <div
          className="mt-20 flex flex-col gap-3 pt-6 text-[12px] sm:flex-row sm:items-center sm:justify-between"
          style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO, color: MUTED }}
        >
          <span>Elajuwan Davis / Founder &amp; CEO</span>
          <span>Confidential · For discussion only · 2026</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 01 Problem ---------------- */

const PROBLEM = [
  "3.5 million licensed US contractors manage permits, lien rights, and insurance across 6 to 8 different tools with no integration between them.",
  "The average building official is 58 years old. Municipalities cannot recruit replacements. Vacancy rates exceed 40% in many markets.",
  "$50B+ in permit fees are processed annually in the US, the majority via paper, check, or email. Zero software layer owns this transaction.",
  "GreenLite ($87M raised) and PermitFlow ($91M raised) addressed a narrow slice: enterprise permitting software. The rest of the market remains uncovered.",
  "No company has attempted to replace the building department function itself: the real infrastructure opportunity hiding in plain sight.",
];

function StackDiagram() {
  const boxes = [
    "In-House Teams + Disjointed Tools",
    "Point-Solution Software",
    "Cleard: Fully Agentic AI",
  ];
  return (
    <svg viewBox="0 0 900 96" className="mt-10 w-full" role="img" aria-label="Market evolution from in-house teams to point solutions to Cleard">
      {boxes.map((b, i) => {
        const x = i * 310;
        const active = i === 2;
        return (
          <g key={b}>
            <rect
              x={x}
              y={18}
              width={280}
              height={60}
              fill={active ? "rgba(103, 49, 71,0.10)" : "#FAF3E6"}
              stroke={active ? TEAL : BORDER_LT}
            />
            <text
              x={x + 140}
              y={52}
              textAnchor="middle"
              fontSize="13"
              fontFamily={SANS}
              fontWeight={active ? 700 : 500}
              fill={active ? "#673147" : INK}
            >
              {b}
            </text>
            {i < 2 && (
              <g stroke={MUTED_LT} strokeWidth="1">
                <line x1={x + 284} y1={48} x2={x + 304} y2={48} />
                <polyline points={`${x + 298},43 ${x + 305},48 ${x + 298},53`} fill="none" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- 02 Market ---------------- */

const MARKET = [
  {
    name: "Contractor SaaS",
    value: "$8.75B",
    pct: 44,
    desc: "3.5M licensed contractors. Annual software spend on compliance, permitting, and back-office tools.",
  },
  {
    name: "Permit Fee Processing",
    value: "$1.25B",
    pct: 12,
    desc: "$50B+ in permit fees processed annually. A transaction margin on this volume is a standalone business.",
  },
  {
    name: "Municipal Infrastructure",
    value: "$10B+",
    pct: 100,
    desc: "Outsourced building department operations. The endgame: replacing municipal staff with Cleard-licensed professionals at scale.",
  },
];

/* ---------------- 03 Why now ---------------- */

const WHYNOW: Array<[string, string]> = [
  [
    "AI made the back office automatable.",
    "Document parsing, jurisdiction lookups, deadline tracking, COI validation — tasks that required human review now run in milliseconds.",
  ],
  [
    "The municipal staffing crisis is acute.",
    "Building official vacancy rates have hit 40%+ in high-growth markets. Municipalities are actively looking for outsourced capacity.",
  ],
  [
    "Private providers are now legally protected.",
    "Statutes in multiple states require municipalities to accept private plan review and inspection results. The legal infrastructure exists.",
  ],
  [
    "An offer they can't refuse.",
    "Retiring building officials get a soft landing into a Cleard contract role. Municipalities solve their vacancy problem without recruiting. Cleard gets licensed staff at scale.",
  ],
];

/* ---------------- 04 Solution ---------------- */

const LAYERS = [
  {
    title: "Layer 1 · Contractor Platform (Live)",
    body: "Full back-office management for licensed contractors: permitting, plan review, license management, insurance compliance, and lien rights. Monthly SaaS. Proof point: Floridian, our internal validation client.",
    revenue: "SaaS subscription ($99–$499/mo per contractor)",
  },
  {
    title: "Layer 2 · Permit Payment Processing (Year 1–3)",
    body: "Permit fees flow through Cleard's platform. We process payments on behalf of contractors, retain a transaction margin. No new product — it's a layer on top of existing permitting workflows.",
    revenue: "Transaction margin on $50B+ annual permit fee volume",
  },
  {
    title: "Layer 3 · Municipal Infrastructure (Year 3–10)",
    body: "Cleard licensed professionals replace building department staff under contract. Municipalities retain oversight. Cleard delivers the work. This is the endgame: the outsourced building department at national scale.",
    revenue: "Government contracts. Per-review and per-inspection fees.",
  },
];

/* ---------------- 05 Ramp ---------------- */

const RAMP: Array<[string, string]> = [
  ["Entry", "Corporate expense card"],
  ["Year 1", "Card + reimbursements"],
  ["Year 2", "AP automation"],
  ["Year 3", "Full finance OS"],
  ["Outcome", "$8.1B valuation, category leader"],
];

const CLEARD_PLAY: Array<[string, string]> = [
  ["Entry", "Contractor back-office (permitting, licenses, insurance, liens)"],
  ["Year 1", "Permit fee payment processing"],
  ["Year 2", "Private plan review + inspections"],
  ["Year 3", "Municipal infrastructure contracts"],
  ["Outcome", "The operating system for America's built environment"],
];

/* ---------------- 06 GTM ---------------- */

const GTM = [
  {
    when: "NOW → 6 MO",
    title: "Contractor Back Office",
    body: "Outbound to licensed GCs via DBPR permit history signals. Target: 100 paying contractors. Prove the product, prove the signal engine.",
    target: "Target: $25K MRR",
  },
  {
    when: "6 → 18 MO",
    title: "Permit Fee Processing",
    body: "Layer transaction processing on existing contractor base. No new sales motion — existing customers opt in. Margin expands per account without CAC.",
    target: "Target: $500K ARR",
  },
  {
    when: "18 MO → 3 YR",
    title: "Private Plan Review",
    body: "Launch licensed private provider services in top-10 high-backlog markets. GCs pay for faster turnaround. Municipalities see the capacity solution.",
    target: "Target: $5M ARR",
  },
  {
    when: "3 → 5 YR",
    title: "Municipal Contracts",
    body: "First city contract. Outsourced building department operations. CleardGov. Scale from one pilot city to regional then national.",
    target: "Target: Category leadership",
  },
];

/* ---------------- 07 Landscape ---------------- */

type Dot = { name: string; x: number; y: number; desc: string; gray?: boolean };

const DOTS: Dot[] = [
  { name: "GreenLite", x: 0.72, y: 0.78, desc: "Enterprise permitting software, moving toward platform" },
  { name: "PermitFlow", x: 0.66, y: 0.5, desc: "Contractor-enterprise permitting, partial platform" },
  { name: "SunRay", x: 0.2, y: 0.2, desc: "Plan review only" },
  { name: "myCOI", x: 0.14, y: 0.32, desc: "Insurance tracking only" },
  { name: "Inspected", x: 0.28, y: 0.32, desc: "Inspections only" },
  { name: "1 Contractor Solutions", x: 0.24, y: 0.08, desc: "Single-workflow contractor point tool" },
  { name: "Freedom Code Compliance", x: 0.14, y: 0.5, desc: "SMB point tool, code compliance" },
  { name: "Manual / Paper", x: 0.06, y: 0.14, desc: "Status quo: paper, email, check", gray: true },
];

function Quadrant() {
  const W = 520;
  const H = 400;
  const px = (v: number) => 46 + v * (W - 70);
  const py = (v: number) => H - 44 - v * (H - 74);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Competitive quadrant chart">
      <rect x={46} y={26} width={W - 70} height={H - 70} fill="#FAF3E6" stroke={BORDER_LT} />
      <line x1={46 + (W - 70) / 2} y1={26} x2={46 + (W - 70) / 2} y2={H - 44} stroke={BORDER_LT} strokeDasharray="3 3" />
      <line x1={46} y1={26 + (H - 70) / 2} x2={W - 24} y2={26 + (H - 70) / 2} stroke={BORDER_LT} strokeDasharray="3 3" />

      <text x={50} y={H - 24} fontSize="10" fontFamily={MONO} fill={MUTED_LT}>POINT TOOL</text>
      <text x={W - 24} y={H - 24} fontSize="10" fontFamily={MONO} fill={MUTED_LT} textAnchor="end">FULL-STACK PLATFORM</text>
      <text x={16} y={H - 48} fontSize="10" fontFamily={MONO} fill={MUTED_LT} transform={`rotate(-90 16 ${H - 48})`}>SMB / CONTRACTOR</text>
      <text x={16} y={128} fontSize="10" fontFamily={MONO} fill={MUTED_LT} transform="rotate(-90 16 128)">ENTERPRISE / MUNICIPAL</text>

      {DOTS.map((d) => (
        <g key={d.name}>
          <circle cx={px(d.x)} cy={py(d.y)} r={5} fill={d.gray ? "#8B9A97" : INK} />
          <text
            x={px(d.x) + 9}
            y={py(d.y) + 4}
            fontSize="10"
            fontFamily={SANS}
            fill={d.gray ? "#8B9A97" : "#2F4F4F"}
          >
            {d.name}
          </text>
        </g>
      ))}

      <g stroke={TEAL} strokeWidth="1.5" fill="none">
        <line x1={px(0.66)} y1={py(0.5)} x2={px(0.84)} y2={py(0.86)} strokeDasharray="4 3" />
        <polyline points={`${px(0.84) - 7},${py(0.86) + 7} ${px(0.84)},${py(0.86)} ${px(0.84) - 9},${py(0.86) + 1}`} />
      </g>
      <circle cx={px(0.86)} cy={py(0.88)} r={13} fill="rgba(103, 49, 71,0.18)" />
      <circle cx={px(0.86)} cy={py(0.88)} r={7.5} fill={TEAL} />
      <text x={px(0.86) - 16} y={py(0.88) - 20} fontSize="11" fontWeight={700} fontFamily={SANS} fill="#673147" textAnchor="end">
        Cleard (now → 5yr trajectory)
      </text>
    </svg>
  );
}

/* ---------------- 08 Momentum ---------------- */

const STATS = [
  { k: "LIVE", v: "Platform deployed. Active accounts." },
  { k: "$3.5M", v: "Permitted project value through Floridian (internal proof)" },
  { k: "$1B+", v: "Contractor permit fee volume in Cleard's initial target markets" },
  { k: "PRE-REV", v: "Revenue launch: Sept 1, 2026" },
];

/* ---------------- 10 Ask ---------------- */

function Donut() {
  const segs = [
    { pct: 70, color: TEAL, label: "GTM", amt: "$3.5M" },
    { pct: 25, color: "#5FD6CD", label: "Engineering", amt: "$1.25M" },
    { pct: 5, color: "#2A5C58", label: "Municipal", amt: "$250K" },
  ];
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="mt-6 flex items-center gap-8">
      <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]" role="img" aria-label="Use of proceeds">
        <g transform="rotate(-90 70 70)">
          {segs.map((s) => {
            const len = (s.pct / 100) * c;
            const el = (
              <circle
                key={s.label}
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={16}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={70} y={76} textAnchor="middle" fontSize="22" fontWeight={700} fontFamily={MONO} fill={OFF}>
          $5M
        </text>
      </svg>
      <ul className="space-y-3 text-[13px]">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span className="h-2.5 w-2.5" style={{ background: s.color }} />
            <span style={{ color: OFF }}>
              {s.pct}% {s.label}
            </span>
            <span style={{ color: MUTED, fontFamily: MONO }}>{s.amt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AskCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="p-7" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ---------------- Page ---------------- */

function InvestorPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (readInvestorAccess()) setUnlocked(true);
    setReady(true);
  }, []);

  if (!ready) return <div style={{ background: BG, minHeight: "100vh" }} />;
  if (!unlocked) return <AccessGate onUnlock={() => setUnlocked(true)} />;
  return <InvestorDeck />;
}

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const [codeError, setCodeError] = useState(false);
  const [busy, setBusy] = useState<"email" | "code" | null>(null);
  const [leaving, setLeaving] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    },
    [],
  );

  function unlock(kind: "domain_verified" | "code_verified") {
    writeInvestorAccess(kind);
    setLeaving(true);
    setTimeout(onUnlock, 400);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setEmailMsg(null);
    setBusy("email");
    const ok = await checkEmailDomain(email);
    setBusy(null);
    if (ok) {
      unlock("domain_verified");
      return;
    }
    setEmailMsg("This email isn't on our access list. Request access at elajuwan@clearedinc.com.");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setCodeMsg(null);
    setBusy("code");
    const ok = await redeemAccessCode(code);
    setBusy(null);
    if (ok) {
      unlock("code_verified");
      return;
    }
    setCodeMsg("Incorrect code — this code is invalid or has already been used.");
    setCode("");
    setCodeError(false);

    requestAnimationFrame(() => setCodeError(true));
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setCodeError(false), 2600);
  }

  const inputStyle = (bad?: boolean): React.CSSProperties => ({
    background: SURFACE,
    border: `1px solid ${bad ? "#8C3B3B" : BORDER}`,
    color: OFF,
    borderRadius: 0,
  });

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-6 ${leaving ? "investor-gate-out" : ""}`}
      style={{ background: BG, color: OFF, fontFamily: SANS }}
    >
      <div
        className="pointer-events-none fixed -left-40 -top-40 h-[560px] w-[560px]"
        style={{
          background: `radial-gradient(circle, rgba(103, 49, 71,0.16) 0%, rgba(103, 49, 71,0) 68%)`,
        }}
      />
      <div className="relative w-full max-w-[760px]">
        <Eyebrow>Cleard · Investor Relations</Eyebrow>
        <h1
          className="mt-5 text-[34px] font-extrabold tracking-[-0.03em]"
          style={{ color: OFF }}
        >
          Investor Deck
        </h1>
        <p className="mt-4 text-[14px]" style={{ color: MUTED }}>
          Enter your work email or an access code to continue.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-start md:gap-6">
          {/* PATH 1 — email domain */}
          <form onSubmit={submitEmail}>
            <label
              htmlFor="investor-email"
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ fontFamily: MONO, color: MUTED }}
            >
              Work email
            </label>
            <input
              id="investor-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@firm.com"
              className="mt-3 w-full px-4 py-3 text-[14px] outline-none"
              style={inputStyle()}
            />
            <button
              type="submit"
              disabled={busy === "email"}
              className="mt-3 w-full px-4 py-3 text-[14px] font-semibold disabled:opacity-60"
              style={{ background: TEAL, color: "#FAF3E6", borderRadius: 0 }}
            >
              {busy === "email" ? "Checking…" : "Request Access →"}
            </button>
            {emailMsg && (
              <p className="mt-3 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                {emailMsg}
              </p>
            )}
          </form>

          {/* divider */}
          <div className="flex items-center justify-center md:h-full md:flex-col">
            <div className="h-px flex-1 md:h-full md:w-px" style={{ background: BORDER }} />
            <span
              className="px-3 py-1 text-[11px] uppercase tracking-[0.2em] md:py-3"
              style={{ fontFamily: MONO, color: MUTED }}
            >
              or
            </span>
            <div className="h-px flex-1 md:h-full md:w-px" style={{ background: BORDER }} />
          </div>

          {/* PATH 2 — one-time code */}
          <form onSubmit={submitCode}>
            <label
              htmlFor="investor-code"
              className="text-[11px] uppercase tracking-[0.2em]"
              style={{ fontFamily: MONO, color: MUTED }}
            >
              Access code or passcode
            </label>
            <div
              className={codeError ? "investor-shake" : undefined}
              key={codeError ? "err" : "ok"}
            >
              <input
                id="investor-code"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Passcode or one-time code"
                maxLength={32}
                className="mt-3 w-full px-4 py-3 text-[14px] tracking-[0.18em] outline-none"

                style={{ ...inputStyle(codeError), fontFamily: MONO }}
              />
            </div>
            <button
              type="submit"
              disabled={busy === "code"}
              className="mt-3 w-full px-4 py-3 text-[14px] font-semibold disabled:opacity-60"
              style={{
                background: "transparent",
                border: `1px solid ${TEAL}`,
                color: TEAL,
                borderRadius: 0,
              }}
            >
              {busy === "code" ? "Checking…" : "Enter →"}
            </button>
            {codeMsg && (
              <p className="mt-3 text-[12px] leading-relaxed" style={{ color: "#D08585" }}>
                {codeMsg}
              </p>
            )}
          </form>
        </div>

        <p className="mt-10 text-[11px]" style={{ fontFamily: MONO, color: MUTED }}>
          Confidential · For discussion only · 2026
        </p>
      </div>
    </div>
  );
}



function InvestorDeck() {

  return (
    <div
      className="h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory", background: BG, fontFamily: SANS }}
    >
      <Cover />

      {/* 01 PROBLEM */}
      <Slide n={1} light>
        <Eyebrow light>The Problem</Eyebrow>
        <Headline light>The permit system is broken. No one is fixing it.</Headline>
        <Lede light>
          America builds $2 trillion in construction annually. Every project touches a permit.
          Most of that process runs on fax machines, aging bureaucrats, and software written
          before the iPhone existed.
        </Lede>
        <div className="mt-10">
          {PROBLEM.map((p, i) => (
            <NumRow key={i} n={String(i + 1).padStart(2, "0")} light>
              {p}
            </NumRow>
          ))}
        </div>
        <StackDiagram />
      </Slide>

      {/* 02 MARKET */}
      <Slide n={2}>
        <Eyebrow>Market Size</Eyebrow>
        <Headline>$20B+ addressable market. Three distinct entry layers.</Headline>
        <div className="mt-12 space-y-8">
          {MARKET.map((m) => (
            <div key={m.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-[15px] font-semibold" style={{ color: OFF }}>
                  {m.name}
                </span>
                <span className="text-[20px]" style={{ fontFamily: MONO, color: TEAL }}>
                  {m.value}
                </span>
              </div>
              <div className="mt-3 h-2 w-full" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                <div className="h-full" style={{ width: `${m.pct}%`, background: TEAL }} />
              </div>
              <p className="mt-3 max-w-3xl text-[13px] leading-relaxed" style={{ color: MUTED }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
        <div
          className="mt-10 flex flex-wrap items-baseline justify-between gap-3 pt-6"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          <span className="text-[13px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color: MUTED }}>
            Total Addressable Market
          </span>
          <span className="text-[32px] font-bold" style={{ fontFamily: MONO, color: TEAL }}>
            $20B+
          </span>
        </div>
        <p className="mt-6 text-[12px]" style={{ fontFamily: MONO, color: MUTED }}>
          $2T US construction volume · $50B+ permit fees · 3.5M licensed contractors
        </p>
      </Slide>

      {/* 03 WHY NOW */}
      <Slide n={3} light>
        <Eyebrow light>Why Now</Eyebrow>
        <Headline light>
          The conditions for this company to exist arrived in the last 36 months.
        </Headline>
        <div className="mt-10">
          {WHYNOW.map(([t, d], i) => (
            <NumRow key={t} n={String(i + 1).padStart(2, "0")} light>
              <span className="font-semibold" style={{ color: INK }}>
                {t}
              </span>{" "}
              {d}
            </NumRow>
          ))}
        </div>
      </Slide>

      {/* 04 SOLUTION */}
      <Slide n={4}>
        <Eyebrow>Solution</Eyebrow>
        <Headline>Three layers. One platform.</Headline>
        <Lede>
          Cleard enters as a contractor back-office tool and expands upmarket into the
          infrastructure layer. Each layer funds the next.
        </Lede>
        <div className="mt-10 space-y-4">
          {LAYERS.map((l) => (
            <div
              key={l.title}
              className="p-7"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${TEAL}` }}
            >
              <div className="text-[15px] font-semibold" style={{ color: OFF }}>
                {l.title}
              </div>
              <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
                {l.body}
              </p>
              <div className="mt-4 pt-4 text-[12px]" style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO, color: TEAL }}>
                {l.revenue}
              </div>
            </div>
          ))}
        </div>
      </Slide>

      {/* 05 RAMP */}
      <Slide n={5}>
        <Eyebrow>The Ramp Playbook</Eyebrow>
        <Headline>We are running Ramp&apos;s playbook.</Headline>
        <Lede>
          Ramp entered as an expense card and used that wedge to become a full finance OS. We
          enter as a permit tool and use that wedge to become the operating system for
          construction compliance.
        </Lede>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            { name: "Ramp", rows: RAMP, accent: false },
            { name: "Cleard", rows: CLEARD_PLAY, accent: true },
          ].map((p) => (
            <div
              key={p.name}
              className="p-7"
              style={{
                background: SURFACE,
                border: `1px solid ${p.accent ? TEAL : BORDER}`,
              }}
            >
              <div
                className="text-[13px] uppercase tracking-[0.2em]"
                style={{ fontFamily: MONO, color: p.accent ? TEAL : MUTED }}
              >
                {p.name}
              </div>
              <dl className="mt-5">
                {p.rows.map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[76px_1fr] gap-4 py-3.5"
                    style={{ borderTop: `1px solid ${BORDER}` }}
                  >
                    <dt className="text-[11px] uppercase tracking-[0.14em]" style={{ fontFamily: MONO, color: MUTED }}>
                      {k}
                    </dt>
                    <dd className="text-[13.5px] leading-snug" style={{ color: "#CFBE9F" }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </Slide>

      {/* 06 GTM */}
      <Slide n={6} light>
        <Eyebrow light>Go To Market</Eyebrow>
        <Headline light>Four stages. Contractor wedge to municipal infrastructure.</Headline>
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-[5px] hidden h-px md:block" style={{ background: BORDER_LT }} />
          <div className="grid gap-10 md:grid-cols-4 md:gap-6">
            {GTM.map((s) => (
              <div key={s.title} className="relative">
                <div className="h-[11px] w-[11px]" style={{ background: TEAL }} />
                <div className="mt-5 text-[11px] uppercase tracking-[0.16em]" style={{ fontFamily: MONO, color: MUTED_LT }}>
                  {s.when}
                </div>
                <div className="mt-2 text-[15px] font-semibold" style={{ color: INK }}>
                  {s.title}
                </div>
                <p className="mt-3 text-[13px] leading-relaxed" style={{ color: MUTED_LT }}>
                  {s.body}
                </p>
                <div className="mt-4 text-[12px] font-semibold" style={{ fontFamily: MONO, color: "#673147" }}>
                  {s.target}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Slide>

      {/* 07 LANDSCAPE */}
      <Slide n={7} light>
        <Eyebrow light>Competitive Landscape</Eyebrow>
        <Headline light>The market is fragmented. Nobody owns the full stack.</Headline>
        <div className="mt-10 grid gap-10 md:grid-cols-[1.25fr_1fr] md:items-center">
          <Quadrant />
          <ul className="space-y-4">
            {DOTS.map((d) => (
              <li key={d.name} className="grid grid-cols-[10px_1fr] gap-3">
                <span className="mt-[6px] h-2 w-2" style={{ background: d.gray ? "#8B9A97" : INK }} />
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: INK }}>
                    {d.name}
                  </div>
                  <div className="text-[12.5px]" style={{ color: MUTED_LT }}>
                    {d.desc}
                  </div>
                </div>
              </li>
            ))}
            <li className="grid grid-cols-[10px_1fr] gap-3 pt-2" style={{ borderTop: `1px solid ${BORDER_LT}` }}>
              <span className="mt-[6px] h-2 w-2" style={{ background: TEAL }} />
              <div>
                <div className="text-[13px] font-semibold" style={{ color: "#673147" }}>
                  Cleard
                </div>
                <div className="text-[12.5px]" style={{ color: MUTED_LT }}>
                  Full-stack: contractor platform, payments, and municipal infrastructure
                </div>
              </div>
            </li>
          </ul>
        </div>
      </Slide>

      {/* 08 MOMENTUM */}
      <Slide n={8}>
        <Eyebrow>Momentum</Eyebrow>
        <Headline>Live. Building. Pre-revenue by design.</Headline>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.k} className="p-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="text-[24px] font-bold" style={{ fontFamily: MONO, color: TEAL }}>
                {s.k}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: MUTED }}>
                {s.v}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <div className="text-[13px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color: TEAL }}>
              Internal Validation
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed" style={{ color: "#CFBE9F" }}>
              Floridian is the first live proof point. $3.5M in permitted project value run
              through Cleard&apos;s platform by Floridian&apos;s own team. Every workflow tested
              in production conditions — not in a sandbox.
            </p>
          </div>
          <div>
            <div className="text-[13px] uppercase tracking-[0.18em]" style={{ fontFamily: MONO, color: TEAL }}>
              Signal Engine
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed" style={{ color: "#CFBE9F" }}>
              NationGraph powers jurisdiction-level permit history signals. DBPR contractor data
              feeds outbound sequences via Throxy. The data infrastructure to find and convert
              3.5M licensed contractors is built.
            </p>
          </div>
        </div>
      </Slide>

      {/* 09 TEAM */}
      <Slide n={9} light>
        <Eyebrow light>Team</Eyebrow>
        <Headline light>Built by someone who lives this problem.</Headline>
        <p className="mt-8 max-w-3xl text-[15px] leading-relaxed" style={{ color: "#2F4F4F" }}>
          Elajuwan Davis founded Floridian (Est. 1998), a full-service exterior hardscape and
          pool construction company serving Miami to Vero Beach. He has personally navigated 25+
          years of permitting delays, lien right disputes, COI collection, and license renewal —
          every workflow Cleard automates is one he has managed by hand. He has deployed
          Cleard&apos;s platform inside Floridian as the first live customer, proving the product
          in production before asking anyone else to pay for it.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { n: "Stepstone Group", c: "Past: Strategic advisory" },
            { n: "Ramp", c: "Past: Finance operations" },
            { n: "Floridian", c: "Founded 1998: Internal proof point" },
          ].map((l) => (
            <div key={l.n} className="p-6" style={{ background: "#FAF3E6", border: `1px solid ${BORDER_LT}` }}>
              <div className="text-[16px] font-bold tracking-[-0.02em]" style={{ color: INK }}>
                {l.n}
              </div>
              <div className="mt-2 text-[12px]" style={{ fontFamily: MONO, color: MUTED_LT }}>
                {l.c}
              </div>
            </div>
          ))}
        </div>
      </Slide>

      {/* 10 ASK */}
      <Slide n={10}>
        <Eyebrow>The Ask</Eyebrow>
        <Headline>Raising $5M.</Headline>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <AskCell label="Round">
            <div className="text-[30px] font-bold" style={{ fontFamily: MONO, color: TEAL }}>
              $5M Seed
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed" style={{ color: MUTED }}>
              Pre-revenue. Strategic round. Targeting close by February 2027.
            </p>
          </AskCell>
          <AskCell label="Use of Proceeds">
            <Donut />
          </AskCell>
          <AskCell label="12-Month Milestones">
            <ul className="space-y-3 text-[13.5px]" style={{ color: "#CFBE9F" }}>
              {[
                "100 paying contractors by December 2026",
                "Permit fee processing live by Q1 2027",
                "First municipal contract letter of intent by Q2 2027",
              ].map((m) => (
                <li key={m} className="flex gap-3">
                  <span style={{ color: TEAL }}>·</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </AskCell>
          <AskCell label="Why Now">
            <ul className="space-y-3 text-[13.5px]" style={{ color: "#CFBE9F" }}>
              {[
                "Municipal vacancy crisis is acute and accelerating",
                "AI infrastructure cost has collapsed",
                "Private provider statutes are expanding nationally",
                "No capitalized competitor owns the full stack",
              ].map((m) => (
                <li key={m} className="flex gap-3">
                  <span style={{ color: TEAL }}>·</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </AskCell>
        </div>
      </Slide>

      {/* 11 VISION */}
      <Slide n={11}>
        <Eyebrow>Vision</Eyebrow>
        <blockquote
          className="mt-8 max-w-4xl text-[28px] leading-[1.15] font-extrabold tracking-[-0.03em] sm:text-[42px]"
          style={{ color: OFF, borderLeft: `3px solid ${TEAL}`, paddingLeft: 24 }}
        >
          Every permit. Every inspection. Every lien. Every license. Processed by Cleard.
        </blockquote>
        <p className="mt-10 max-w-3xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
          In 10 years, Cleard is the infrastructure layer underneath American construction — the
          way Stripe is the infrastructure layer underneath American commerce. The building
          department is not a government function. It is an operations function. And operations
          functions get outsourced to the best operator.
        </p>
        <div
          className="mt-16 pt-6 text-[12px]"
          style={{ borderTop: `1px solid ${BORDER}`, fontFamily: MONO, color: MUTED }}
        >
          Elajuwan Davis · Founder &amp; CEO · elajuwan@clearedinc.com · clearedinc.com
        </div>
      </Slide>
    </div>
  );
}
