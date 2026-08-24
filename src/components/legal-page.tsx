import type { ReactNode } from "react";

const OAT = "#FAF3E6";
const SLATE = "#2F4F4F";
const PLUM = "#673147";
const BODY = "#7A5C68";
const BORDER = "#E0D3BC";
const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';

/** Shared shell for the Privacy / Terms documents — Nordic Luxury theme. */
export function LegalDoc({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div style={{ background: OAT }}>
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto max-w-3xl px-5 py-20 lg:px-8 lg:py-28">
          <div
            className="text-[10.5px] font-bold uppercase"
            style={{ letterSpacing: "0.22em", color: SLATE }}
          >
            {eyebrow}
          </div>
          <h1
            className="mt-5"
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: PLUM,
            }}
          >
            {title}
          </h1>
          <p className="mt-5 text-[13px]" style={{ color: BODY }}>
            {updated}
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="legal-body" style={{ color: BODY }}>
            {children}
          </div>
        </div>
      </section>

      <style>{`
        .legal-body h2 {
          font-family: ${SERIF};
          font-weight: 500;
          font-size: 1.4rem;
          letter-spacing: -0.02em;
          color: ${PLUM};
          margin-top: 2.75rem;
          margin-bottom: 0.85rem;
          line-height: 1.2;
        }
        .legal-body h3 {
          font-weight: 600;
          font-size: 0.98rem;
          color: ${SLATE};
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .legal-body p { font-size: 0.95rem; line-height: 1.75; margin-bottom: 1rem; }
        .legal-body ul { margin: 0 0 1.15rem 1.1rem; list-style: disc; }
        .legal-body li { font-size: 0.95rem; line-height: 1.7; margin-bottom: 0.4rem; }
        .legal-body strong { color: ${SLATE}; font-weight: 600; }
        .legal-body a { color: ${PLUM}; text-decoration: underline; }
        .legal-body hr { border: 0; border-top: 1px solid ${BORDER}; margin: 2.5rem 0; }
      `}</style>
    </div>
  );
}
