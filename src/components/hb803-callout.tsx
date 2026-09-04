import { Link } from "@tanstack/react-router";
import { Landmark } from "lucide-react";

const OAT = "#FFFFFF";
const INK = "#2B1620";
const PLUM = "#2B1620";
const BRONZE = "#9C6B3F";
const SERIF = "'Fraunces', 'Iowan Old Style', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** Florida HB 803 permit-fee reduction callout. Factual, no guarantee language. */
export function Hb803Callout({ background = OAT }: { background?: string }) {
  return (
    <section style={{ background }}>
      <div className="mx-auto max-w-7xl px-5 py-16 md:py-24 lg:px-8">
        <div
          className="p-8 md:p-14"
          style={{ background: INK, borderLeft: `3px solid ${BRONZE}` }}
        >
          <div
            className="flex items-center gap-3 text-[10.5px] font-bold uppercase"
            style={{ letterSpacing: "0.22em", color: "rgba(255,255,255,0.7)", fontFamily: MONO }}
          >
            <Landmark className="h-4 w-4" strokeWidth={1.75} />
            Florida HB 803 · Effective July 1, 2026
          </div>

          <h2
            className="mt-5 max-w-3xl"
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(1.8rem, 3.4vw, 2.6rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              color: OAT,
            }}
          >
            Using a private provider{" "}
            <span style={{ fontStyle: "italic", color: BRONZE }}>
              reduces your permit fees by law.
            </span>
          </h2>

          <p
            className="mt-6 max-w-3xl text-[15.5px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.78)" }}
          >
            Under Florida House Bill 803, jurisdictions are required to reduce permit fees when a
            private provider is used — at least 25% when a private provider performs plan review or
            inspections, and at least 50% when a private provider performs both. Florida law requires
            this reduction, and Cleard verifies it&apos;s applied to every eligible permit.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { k: "At least 25%", v: "Private provider performs plan review or inspections" },
              { k: "At least 50%", v: "Private provider performs both" },
            ].map((s) => (
              <div
                key={s.k}
                className="p-6"
                style={{ border: "1px solid rgba(255,255,255,0.18)" }}
              >
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    fontSize: "1.9rem",
                    letterSpacing: "-0.03em",
                    color: OAT,
                  }}
                >
                  {s.k}
                </div>
                <div
                  className="mt-2 text-[13.5px] leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/join"
            className="mt-10 inline-flex items-center px-6 py-3 text-[14px] no-underline"
            style={{ backgroundImage: "var(--gradient-copper)", color: "#FFFFFF", fontWeight: 700 }}
          >
            Put the reduction to work →
          </Link>

          <p
            className="mt-6 max-w-3xl text-[12px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Fee reductions apply to eligible permits and are administered by each jurisdiction. This
            is general information, not legal advice.
          </p>
        </div>
      </div>
    </section>
  );
}
