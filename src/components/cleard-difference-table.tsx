import { Check, Minus } from "lucide-react";

const OAT = "#FFFFFF";
const INK = "#000000";
const GRAY = "#000000";
const PLUM = "#000000";
const BORDER = "rgba(0,0,0,0.10)";
const SERIF = "'Instrument Sans', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

type Mark = "yes" | "no" | "partial";

const COLUMNS = ["Permit Expediter", "Private Provider", "Cleard"] as const;

const ROWS: Array<{ label: string; marks: [Mark, Mark, Mark] }> = [
  { label: "Prepare permit applications", marks: ["yes", "partial", "yes"] },
  { label: "Coordinate submission with the jurisdiction", marks: ["yes", "partial", "yes"] },
  { label: "Perform eligible private-provider plan review", marks: ["no", "yes", "yes"] },
  { label: "Perform eligible private-provider inspections", marks: ["no", "yes", "yes"] },
  { label: "License management & renewal tracking", marks: ["no", "no", "yes"] },
  { label: "COI / insurance compliance tracking", marks: ["no", "no", "yes"] },
  { label: "Lien rights & Notice of Commencement", marks: ["partial", "no", "yes"] },
  { label: "Sub coordination & verification", marks: ["partial", "no", "yes"] },
  { label: "AI monitoring across every project (Victoria)", marks: ["no", "no", "yes"] },
  { label: "Statewide Florida coverage", marks: ["partial", "partial", "yes"] },
];

const COL_COLOR = ["#C0392B", "#D4A017", "#2E7D32"] as const;
const NEUTRAL = "rgba(0,0,0,0.35)";

function MarkCell({ mark, colorIndex }: { mark: Mark; colorIndex: number }) {
  const color = COL_COLOR[colorIndex] ?? INK;
  if (mark === "no") {
    return (
      <span
        className="inline-flex items-center gap-2 text-[13px]"
        style={{ color: NEUTRAL, fontFamily: MONO }}
      >
        —
      </span>
    );
  }
  if (mark === "partial") {
    return (
      <span
        className="inline-flex items-center gap-2 text-[11px] uppercase"
        style={{ color, opacity: 0.6, fontFamily: MONO, letterSpacing: "0.14em" }}
      >
        <Minus className="h-4 w-4 shrink-0" strokeWidth={2} />
        Partial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2" style={{ color }}>
      <span
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: color, color: "#FFFFFF" }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span
        className="text-[11px] uppercase"
        style={{ fontFamily: MONO, letterSpacing: "0.14em" }}
      >
        Yes
      </span>
    </span>
  );
}

/** "The Cleard difference" — expediter vs private provider vs Cleard. */
export function ClearedDifferenceTable({ background = OAT }: { background?: string }) {
  return (
    <section style={{ background }}>
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28 lg:px-8">
        <div
          className="flex items-center gap-3 text-[10.5px] font-bold uppercase"
          style={{ letterSpacing: "0.22em", color: INK, fontFamily: MONO }}
        >
          <span className="copper-hairline inline-block h-px w-7" />
          Side by side
        </div>
        <h2
          className="mt-5 max-w-3xl"
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: INK,
          }}
        >
          The Cleard <span className="copper-emph">difference.</span>
        </h2>

        <div className="mt-12 overflow-x-auto">
          <table
            className="w-full min-w-[720px]"
            style={{ borderCollapse: "collapse", background: OAT }}
          >
            <thead>
              <tr>
                <th
                  className="px-5 py-4 text-left text-[10px] uppercase"
                  style={{
                    fontFamily: MONO,
                    letterSpacing: "0.18em",
                    color: GRAY,
                    borderBottom: `1px solid ${BORDER}`,
                    fontWeight: 600,
                  }}
                >
                  Capability
                </th>
                {COLUMNS.map((c, ci) => {
                  const isCleard = c === "Cleard";
                  const bg = COL_COLOR[ci];
                  return (
                    <th
                      key={c}
                      className="px-5 py-4 text-left text-[11px] uppercase"
                      style={{
                        fontFamily: MONO,
                        letterSpacing: "0.18em",
                        color: "#FFFFFF",
                        background: bg,
                        borderBottom: `1px solid ${bg}`,
                        fontWeight: isCleard ? 800 : 700,
                        whiteSpace: "nowrap",
                        width: isCleard ? "22%" : "18%",
                      }}
                    >
                      {c}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, ri) => {
                const stripe = ri % 2 === 0 ? "#FFFFFF" : "#F8F8F8";
                return (
                  <tr key={r.label} style={{ background: stripe }}>
                    <td
                      className="px-5 py-4 align-middle text-[14.5px]"
                      style={{
                        color: INK,
                        borderBottom: "1px solid rgba(0,0,0,0.10)",
                        fontWeight: 500,
                      }}
                    >
                      {r.label}
                    </td>
                    {r.marks.map((m, i) => (
                      <td
                        key={i}
                        className="px-5 py-4 align-middle"
                        style={{
                          borderBottom: "1px solid rgba(0,0,0,0.10)",
                          background: i === 2 ? "rgba(46,125,50,0.06)" : "transparent",
                        }}
                      >
                        <MarkCell mark={m} colorIndex={i} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-3xl text-[12.5px] leading-relaxed" style={{ color: GRAY }}>
          Comparison reflects typical service models in the Florida private-provider market and is
          not intended to describe every provider.
        </p>
      </div>
    </section>
  );
}
