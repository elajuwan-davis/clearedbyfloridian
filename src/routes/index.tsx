import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronDown, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleard — Permits cleared. Projects move." },
      {
        name: "description",
        content:
          "Cleard handles the full permit pipeline — submissions, corrections, inspections, closeout — so your team builds instead of waiting.",
      },
      { property: "og:title", content: "Cleard — Permits cleared. Projects move." },
      {
        property: "og:description",
        content:
          "Cleard handles the full permit pipeline — submissions, corrections, inspections, closeout — so your team builds instead of waiting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

/* ------------------------------ DESIGN TOKENS ----------------------------- */

const WHITE = "#FFFFFF";
const OFFWHITE = "#F5F4F0";
const INK = "#111110";
const GRAY = "#6B6860";
const LIGHT = "#9E9B96";
const TEAL = "#00B4A8";
const BORDER = "#E4E2DE";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/* --------------------------------- PAGE ---------------------------------- */

function HomePage() {
  return (
    <div style={{ background: WHITE, color: INK, fontFamily: SANS }}>
      <AnnouncementBanner />
      <Nav />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <BottomCTA />
      <Footer />
    </div>
  );
}

/* ---------------------------- ANNOUNCEMENT BAR --------------------------- */

function AnnouncementBanner() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div style={{ background: "#000000" }}>
      <div className="mx-auto max-w-7xl px-5 py-2.5 flex items-center justify-center gap-3 relative">
        <p className="text-[13px]" style={{ color: WHITE }}>
          Now accepting contractor applications for the private beta.{" "}
          <Link to="/join" hash="request" className="underline" style={{ color: WHITE }}>
            Apply here →
          </Link>
        </p>
        <button
          onClick={() => setOpen(false)}
          aria-label="Dismiss announcement"
          className="absolute right-5 top-1/2 -translate-y-1/2 p-1"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------- NAV --------------------------------- */

const NAV_LINKS: Array<{ to: string; label: string; caret?: boolean }> = [
  { to: "/products", label: "Product", caret: true },
  { to: "/join", label: "Contractors", caret: true },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

function Nav() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: WHITE, borderBottom: `1px solid ${BORDER}` }}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 h-[58px] flex items-center justify-between gap-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link
            to="/"
            className="no-underline"
            style={{
              color: INK,
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.03em",
            }}
          >
            Cleard
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="inline-flex items-center gap-1 text-[14px] no-underline transition-opacity hover:opacity-70"
                style={{ color: GRAY }}
              >
                {l.label}
                {l.caret && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline text-[14px] no-underline"
            style={{ color: GRAY }}
          >
            Sign in
          </Link>
          <Link
            to="/process"
            className="hidden sm:inline-flex items-center px-4 py-2 text-[13.5px] font-medium no-underline"
            style={{ color: INK, border: `1px solid ${BORDER}`, background: WHITE }}
          >
            See a demo
          </Link>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-4 py-2 text-[13.5px] font-semibold no-underline"
            style={{ background: TEAL, color: "#000000" }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------- HERO --------------------------------- */

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Hero() {
  const count = useCountUp(847);
  return (
    <section
      style={{
        background: WHITE,
        backgroundImage: `radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 md:py-28 grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span
                className="absolute inline-flex h-full w-full rounded-full animate-ping"
                style={{ background: TEAL, opacity: 0.6 }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: TEAL }}
              />
            </span>
            <span
              className="text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: LIGHT }}
            >
              Permits managed through Cleard today:
            </span>
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: INK }}
            >
              {count}
            </span>
          </div>

          <h1
            className="mt-7"
            style={{
              fontWeight: 800,
              fontSize: "clamp(2.5rem, 5.2vw, 3.875rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              color: INK,
            }}
          >
            Permits cleared. Projects move.
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: GRAY }}>
            Cleard handles the full permit pipeline — submissions, corrections,
            inspections, closeout — so your team builds instead of waiting.
          </p>

          <form
            className="mt-9 flex flex-col sm:flex-row gap-3 max-w-lg"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="What's your work email?"
              aria-label="Work email"
              className="flex-1 px-4 py-3 text-[14px] outline-none"
              style={{ border: `1px solid ${BORDER}`, background: WHITE, color: INK }}
            />
            <Link
              to="/join"
              hash="request"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-semibold no-underline"
              style={{ background: TEAL, color: "#000000" }}
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </form>

          <Link
            to="/process"
            className="mt-5 inline-block text-[14px] no-underline"
            style={{ color: GRAY }}
          >
            See a live demo →
          </Link>
        </div>

        <AppPreview />
      </div>
    </section>
  );
}

const ROWS = [
  {
    id: "CLR-2026-0212",
    addr: "14 Pelican Bay Ln, Naples",
    juris: "Collier County",
    status: "Approved",
  },
  {
    id: "CLR-2026-0208",
    addr: "2840 SW 48th Ct, Miami",
    juris: "Miami-Dade",
    status: "Corrections",
  },
  {
    id: "CLR-2026-0204",
    addr: "901 Harbour Ct, Jupiter",
    juris: "Palm Beach",
    status: "In Review",
  },
  {
    id: "CLR-2026-0199",
    addr: "7720 NW 2nd Ave, Boca Raton",
    juris: "Palm Beach",
    status: "Approved",
  },
  {
    id: "CLR-2026-0195",
    addr: "5612 SE Coconut Ter, Stuart",
    juris: "Martin County",
    status: "In Review",
  },
];

const NAV_ITEMS = ["My Permits", "Inspections", "Subcontractors", "Documents", "Reports"];

function statusStyle(status: string) {
  if (status === "Approved")
    return { background: "rgba(0,180,168,0.12)", color: "#00786F" };
  if (status === "Corrections")
    return { background: "rgba(220,38,38,0.10)", color: "#B42318" };
  return { background: "rgba(17,17,16,0.06)", color: GRAY };
}

function AppPreview() {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}` }}>
      <div
        className="flex items-center gap-3 px-3 py-2.5"
        style={{ background: OFFWHITE, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
        </div>
        <div
          className="flex-1 px-3 py-1 text-[11px]"
          style={{ background: WHITE, border: `1px solid ${BORDER}`, color: LIGHT }}
        >
          app.cleard.io/permits
        </div>
      </div>

      <div className="grid grid-cols-[1fr] sm:grid-cols-[150px_1fr]">
        <div
          className="hidden sm:block py-3"
          style={{ background: OFFWHITE, borderRight: `1px solid ${BORDER}` }}
        >
          {NAV_ITEMS.map((n, i) => (
            <div
              key={n}
              className="px-4 py-2 text-[12px]"
              style={
                i === 0
                  ? { color: INK, fontWeight: 600, background: WHITE }
                  : { color: GRAY }
              }
            >
              {n}
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${BORDER}` }}
          >
            <span className="text-[13px] font-semibold" style={{ color: INK }}>
              Active permits
            </span>
            <span
              className="px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: TEAL, color: "#000000" }}
            >
              + New permit
            </span>
          </div>
          <div
            className="hidden sm:grid grid-cols-[110px_1fr_100px_86px] gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.12em]"
            style={{ color: LIGHT, borderBottom: `1px solid ${BORDER}` }}
          >
            <span>ID</span>
            <span>Address</span>
            <span>Jurisdiction</span>
            <span>Status</span>
          </div>
          {ROWS.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[110px_1fr_100px_86px] items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <span className="text-[11px] tabular-nums" style={{ color: GRAY }}>
                {r.id}
              </span>
              <span className="hidden sm:block truncate text-[12px]" style={{ color: INK }}>
                {r.addr}
              </span>
              <span className="hidden sm:block text-[11px]" style={{ color: LIGHT }}>
                {r.juris}
              </span>
              <span
                className="justify-self-end sm:justify-self-start px-2 py-0.5 text-[10.5px] font-medium"
                style={statusStyle(r.status)}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ SOCIAL PROOF ----------------------------- */

const STATS = [
  { num: "340+", label: "Permits submitted" },
  { num: "11 days", label: "Avg. approval time" },
  { num: "98%", label: "On-time submission rate" },
  { num: "2 hrs", label: "Average intake to submission" },
];

function SocialProof() {
  return (
    <section
      style={{
        background: WHITE,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-8 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">
        <div className="text-[10.5px] uppercase tracking-[0.16em] shrink-0" style={{ color: LIGHT }}>
          Cleard by the numbers
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-[22px] font-bold tracking-[-0.03em]" style={{ color: INK }}>
                {s.num}
              </div>
              <div className="mt-1 text-[13px]" style={{ color: GRAY }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- FEATURES ------------------------------- */

const FEATURES = [
  {
    title: "Permit submission that doesn't stall.",
    secondary: "Complete packages, first time.",
    body: "We assemble, pre-check, and file the submittal package with the jurisdiction so nothing bounces back for a missing form.",
    arrow: true,
  },
  {
    title: "Corrections handled without the back-and-forth.",
    secondary: "One thread, one owner.",
    body: "Every comment is logged, assigned, and answered on the clock — your PM never chases a reviewer again.",
  },
  {
    title: "Inspections scheduled and tracked.",
    secondary: "Booked, logged, closed.",
    body: "Request, confirm, and record every inspection with results attached to the permit record automatically.",
  },
  {
    title: "Full visibility across every project.",
    secondary: "One live pipeline view.",
    body: "See every permit, jurisdiction, and deadline in one place — with status that updates as it happens.",
  },
];

function Features() {
  return (
    <section style={{ background: WHITE }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <div>
            <div
              className="text-[10.5px] uppercase tracking-[0.18em] font-semibold"
              style={{ color: TEAL }}
            >
              What Cleard does
            </div>
            <h2
              className="mt-6"
              style={{
                fontSize: "clamp(2rem, 3.6vw, 2.875rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.035em",
              }}
            >
              <span style={{ color: INK, fontWeight: 800 }}>One platform for the </span>
              <span style={{ color: GRAY, fontWeight: 600 }}>entire permit lifecycle.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-relaxed" style={{ color: GRAY }}>
              We handle every phase — from application to certificate of occupancy — so
              your PM doesn&apos;t have to.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <Link
                to="/join"
                hash="request"
                className="inline-flex items-center px-5 py-3 text-[14px] font-semibold no-underline"
                style={{ background: TEAL, color: "#000000" }}
              >
                Get started
              </Link>
              <Link to="/process" className="text-[14px] no-underline" style={{ color: GRAY }}>
                View demo →
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 relative" style={{ background: OFFWHITE }}>
                {f.arrow && (
                  <ArrowUpRight
                    className="absolute right-5 top-5 h-4 w-4"
                    style={{ color: LIGHT }}
                  />
                )}
                <h3
                  className="pr-6 text-[16px] font-bold tracking-[-0.02em]"
                  style={{ color: INK }}
                >
                  {f.title}
                </h3>
                <div className="mt-1.5 text-[13.5px] font-medium" style={{ color: GRAY }}>
                  {f.secondary}
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: GRAY }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ HOW IT WORKS ----------------------------- */

const STEPS = [
  {
    n: "01",
    title: "Send the plans",
    body: "Upload the stamped set and project details. Defer anything not ready yet.",
  },
  {
    n: "02",
    title: "We submit",
    body: "Cleard prepares the package and files it with the jurisdiction on your behalf.",
  },
  {
    n: "03",
    title: "Track in real time",
    body: "Watch review status, corrections, and inspections move as they happen.",
  },
  {
    n: "04",
    title: "Permit issued",
    body: "Approved permit and closeout documents land in your project record.",
  },
];

function HowItWorks() {
  return (
    <section
      style={{
        background: OFFWHITE,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28">
        <div
          className="text-[10.5px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: TEAL }}
        >
          How it works
        </div>
        <h2
          className="mt-6 max-w-2xl"
          style={{
            fontWeight: 800,
            fontSize: "clamp(2rem, 3.6vw, 2.75rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: INK,
          }}
        >
          From contract to CO. Without the chaos.
        </h2>

        <div
          className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}
        >
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="p-7"
              style={{ borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
            >
              <div className="text-[11px] font-semibold tabular-nums" style={{ color: TEAL }}>
                Step {s.n}
              </div>
              <h3 className="mt-4 text-[16px] font-bold tracking-[-0.02em]" style={{ color: INK }}>
                {s.title}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: GRAY }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ BOTTOM CTA ------------------------------- */

function BottomCTA() {
  return (
    <section style={{ background: "#000000" }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-24 md:py-28 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <h2
          style={{
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3.25rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.04em",
            color: WHITE,
          }}
        >
          Your next permit is already behind. Fix that today.
        </h2>
        <div className="flex flex-col items-start lg:items-end gap-4">
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-semibold no-underline"
            style={{ background: TEAL, color: "#000000" }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/process"
            className="text-[14px] no-underline"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            See a demo →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- FOOTER -------------------------------- */

const FOOTER_LINKS: Array<{ to: string; label: string }> = [
  { to: "/products", label: "Product" },
  { to: "/join", label: "Contractors" },
  { to: "/about", label: "Privacy" },
  { to: "/about", label: "Terms" },
];

function Footer() {
  return (
    <footer
      style={{ background: "#000000", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <span
          style={{ color: WHITE, fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}
        >
          Cleard
        </span>
        <div className="flex flex-wrap items-center gap-7">
          {FOOTER_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-[13.5px] no-underline"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          © {new Date().getFullYear()} Cleard
        </span>
      </div>
    </footer>
  );
}
