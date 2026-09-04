import { Check, Minus, X } from "lucide-react";

const OAT = "#FFFFFF";
const INK = "#000000";
const GRAY = "#000000";
const PLUM = "#000000";
const BORDER = "#FFFFFF";
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

function MarkCell({ mark, emphasis }: { mark: Mark; emphasis?: boolean }) {
  const color = mark === "yes" ? (emphasis ? OAT : PLUM) : emphasis ? OAT : GRAY;
  const Icon = mark === "yes" ? Check : mark === "no" ? X : Minus;
  const label = mark === "yes" ? "Yes" : mark === "no" ? "No" : "Partial";
  return (
    <span className="inline-flex items-center gap-2" style={{ color }}>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={mark === "yes" ? 2.5 : 2} />
      <span
        className="text-[11px] uppercase"
        style={{ fontFamily: MONO, letterSpacing: "0.14em" }}
      >
        {label}
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
                {COLUMNS.map((c) => {
                  const isCleard = c === "Cleard";
                  return (
                    <th
                      key={c}
                      className="px-5 py-4 text-left text-[11px] uppercase"
                      style={{
                        fontFamily: MONO,
                        letterSpacing: "0.18em",
                        color: isCleard ? OAT : INK,
                        background: isCleard ? PLUM : "transparent",
                        borderBottom: `1px solid ${isCleard ? PLUM : BORDER}`,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td
                    className="px-5 py-4 align-middle text-[14.5px]"
                    style={{ color: INK, borderBottom: `1px solid ${BORDER}`, fontWeight: 500 }}
                  >
                    {r.label}
                  </td>
                  {r.marks.map((m, i) => {
                    const isCleard = i === 2;
                    return (
                      <td
                        key={i}
                        className="px-5 py-4 align-middle"
                        style={{
                          borderBottom: `1px solid ${isCleard ? "rgba(255,255,255,0.18)" : BORDER}`,
                          background: isCleard ? PLUM : "transparent",
                        }}
                      >
                        <MarkCell mark={m} emphasis={isCleard} />
                      </td>
                    );
                  })}
                </tr>
              ))}
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
