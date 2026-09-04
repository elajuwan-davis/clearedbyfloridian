import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";

const OAT = "#FAF3E6";
const SLATE = "#2F4F4F";
const PLUM = "#673147";
const BORDER = "#E0D3BC";
const BODY = "#7A5C68";
const SERIF = '"Unbounded", sans-serif';

export const Route = createFileRoute("/cleardapproval")({
  head: () => ({
    meta: [
      { title: "CleardApproval — HOA Architectural Review" },
      {
        name: "description",
        content:
          "CleardApproval gives HOA management companies a structured, trackable system for architectural review — from homeowner submission to committee decision to recorded outcome.",
      },
      { property: "og:title", content: "CleardApproval — HOA Architectural Review" },
      {
        property: "og:description",
        content:
          "A structured, trackable system for architectural review — from homeowner submission to committee decision to recorded outcome.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClearApprovalPage,
});

const PAIN_POINTS = [
  {
    title: "Incomplete submissions slow everything down",
    body: "Homeowners submit the wrong docs, the wrong format, or nothing at all. Your team spends hours chasing paperwork instead of processing it.",
  },
  {
    title: "Decisions live in email threads",
    body: "When a homeowner disputes a denial three years later, your paper trail is a chain of forwarded emails and a handwritten note from a board meeting.",
  },
  {
    title: "Statutory deadlines don't wait",
    body: "Most states require a response within 30–45 days. Miss it and the request is deemed approved by law. Manual tracking is a liability.",
  },
];

const STEPS = [
  {
    title: "Homeowner submits through a branded portal",
    body: "Guided intake captures the right documents, photos, and scope details upfront. Incomplete packages are rejected before they reach your team.",
  },
  {
    title: "Committee reviews in one place",
    body: "Board members access the request, add notes, vote, and record the decision — all inside CleardApproval. No email chains.",
  },
  {
    title: "Decision is recorded and stored",
    body: "Approved or denied, the outcome is timestamped, documented, and retrievable. Compliance is built in.",
  },
];

const STATS = [
  { value: "72%", label: "reduction in incomplete submission follow-ups" },
  { value: "45-day", label: "statutory deadline tracked automatically" },
  { value: "100%", label: "of decisions documented with audit trail" },
];

function ClearApprovalPage() {
  return (
    <MarketingShell>
      <div style={{ background: OAT }}>
        <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-10 md:py-32">
          <div
            className="text-[10.5px] uppercase"
            style={{ color: PLUM, letterSpacing: "0.22em", fontWeight: 700 }}
          >
            CleardApproval
          </div>
          <h1
            className="mt-6"
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: "clamp(2.25rem, 6vw, 4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: SLATE,
            }}
          >
            The ARC process, without the back-and-forth.
          </h1>

          <div
            className="mx-auto mt-12 max-w-xl px-8 py-10"
            style={{ border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.5)" }}
          >
            <div
              className="text-[10.5px] uppercase"
              style={{ color: PLUM, letterSpacing: "0.22em", fontWeight: 700 }}
            >
              Coming Soon
            </div>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: BODY }}>
              We're building something for HOA management companies. Be the first to know.
            </p>
            <Link
              to="/contact"
              className="mt-7 inline-flex items-center px-6 py-2.5 text-[13.5px] no-underline"
              style={{ background: PLUM, color: OAT, fontWeight: 600 }}
            >
              Talk to our team
            </Link>
          </div>
        </section>

        {/* Full page content — hidden until launch */}
        <div hidden style={{ display: "none" }}>
          <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
            <div className="grid gap-8 md:grid-cols-3">
              {PAIN_POINTS.map((p) => (
                <div key={p.title} style={{ borderTop: `1px solid ${BORDER}` }} className="pt-6">
                  <h3
                    className="text-[19px]"
                    style={{ fontFamily: SERIF, fontWeight: 500, color: SLATE }}
                  >
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: BODY }}>
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
            <h2
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                color: SLATE,
              }}
            >
              How it works
            </h2>
            <ol className="mt-10 space-y-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-6">
                  <span
                    className="text-[13px]"
                    style={{ color: PLUM, fontWeight: 700, paddingTop: 4 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3
                      className="text-[19px]"
                      style={{ fontFamily: SERIF, fontWeight: 500, color: SLATE }}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: BODY }}>
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
            <div className="grid gap-10 sm:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.value}>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontWeight: 500,
                      fontSize: "2.5rem",
                      color: PLUM,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {s.value}
                  </div>
                  <p className="mt-2 text-[14px] leading-relaxed" style={{ color: BODY }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-10">
            <div
              className="text-[10.5px] uppercase"
              style={{ color: PLUM, letterSpacing: "0.22em", fontWeight: 700 }}
            >
              Who it's for
            </div>
            <p
              className="mt-5"
              style={{
                fontFamily: SERIF,
                fontWeight: 500,
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                color: SLATE,
                lineHeight: 1.2,
              }}
            >
              HOA management companies overseeing 5+ communities.
            </p>
            <Link
              to="/contact"
              className="mt-9 inline-flex items-center px-6 py-2.5 text-[13.5px] no-underline"
              style={{ background: PLUM, color: OAT, fontWeight: 600 }}
            >
              Request early access
            </Link>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
