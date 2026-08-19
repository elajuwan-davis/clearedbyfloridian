import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import mark3d from "@/assets/cleard-3d-mark.png.asset.json";
import mark2d from "@/assets/cleard-mark-2d.png.asset.json";

/* ---------------------- NORDIC LUXURY BRAND TOKENS ---------------------- */

const OAT = "#FAF3E6";
const OAT_DEEP = "#F3EAD9";
const SLATE = "#2F4F4F";
const PLUM = "#673147";
const LAVENDER = "#E6E6FA";
const GREEN = "#2F4F4F"; /* minor accent only: eyebrows, secondary CTA, metadata */

const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';

const NAV = [
  { to: "/product", label: "Product" },
  { to: "/join", label: "For Contractors" },
  { to: "/pricing", label: "Pricing" },
  { to: "/compare", label: "Compare" },
  { to: "/about", label: "About" },
] as const;

/* ---------------------------------- NAV ---------------------------------- */

function HeroNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || open ? "rgba(250,243,230,0.92)" : "transparent",
        backdropFilter: scrolled || open ? "blur(10px)" : "none",
        borderBottom: `1px solid ${scrolled || open ? "#E0D3BC" : "transparent"}`,
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 no-underline" style={{ flexShrink: 0 }}>
          <img src={mark2d.url} alt="Cleard" className="h-8 w-8 object-contain" />
          <span
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 21,
              letterSpacing: "-0.02em",
              color: PLUM,
            }}
          >
            Cleard
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          style={{ whiteSpace: "nowrap", flexWrap: "nowrap" }}
        >
          {NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13.5px] no-underline transition-colors"
              style={{ color: SLATE, whiteSpace: "nowrap" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
          <Link
            to="/login"
            className="hidden text-[13.5px] no-underline sm:inline"
            style={{ color: SLATE, whiteSpace: "nowrap" }}
          >
            Sign in
          </Link>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-5 py-2.5 text-[13px] no-underline"
            style={{ background: PLUM, color: OAT, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            Get early access
          </Link>
          <button
            type="button"
            className="-mr-1 p-2 text-[13px] md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((s) => !s)}
            style={{ color: SLATE }}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: OAT, borderTop: `1px solid #E0D3BC` }}>
          <div className="space-y-4 px-5 py-6">
            {[...NAV, { to: "/login", label: "Sign in" } as const].map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block text-[15px] no-underline"
                style={{ color: SLATE }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/* --------------------------------- HERO ---------------------------------- */

export function ClearedHero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ background: OAT, color: SLATE }}
    >
      <HeroNav />

      {/* fine slate line-art: quiet drafting grid, no glow, no gradients */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(43,22,32,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(43,22,32,0.06) 1px, transparent 1px)`,
          backgroundSize: "88px 88px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px lg:block"
        style={{ background: "rgba(43,22,32,0.10)" }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:pb-32 lg:pt-44">
        {/* copy */}
        <div>
          <div
            className="text-[10.5px] uppercase"
            style={{ letterSpacing: "0.32em", color: GREEN, fontWeight: 600 }}
          >
            Private provider permitting
          </div>

          <h1
            className="mt-7 max-w-[15ch]"
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: "clamp(2.9rem, 6.4vw, 5.1rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              color: PLUM,
              fontVariationSettings: '"SOFT" 0, "WONK" 1',
            }}
          >
            Run projects.
            <br />
            <span style={{ fontStyle: "italic", color: SLATE }}>Not paperwork.</span>
          </h1>

          <p
            className="mt-8 max-w-xl text-[16px] leading-[1.75]"
            style={{ color: SLATE }}
          >
            Permitting administration, private plan review and inspections, license
            management, insurance compliance and lien rights. One back office, every
            jurisdiction you build in.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/join"
              hash="request"
              className="inline-flex items-center px-7 py-3.5 text-[13.5px] no-underline"
              style={{ background: GREEN, color: OAT, fontWeight: 600 }}
            >
              Get early access
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-7 py-3.5 text-[13.5px] no-underline"
              style={{ border: `1px solid ${GREEN}`, color: GREEN, fontWeight: 600 }}
            >
              See a live demo
            </Link>
          </div>

          <div
            className="mt-12 flex flex-wrap gap-x-10 gap-y-4 pt-8 text-[11px] uppercase"
            style={{ borderTop: "1px solid #E0D3BC", letterSpacing: "0.16em", color: GREEN }}
          >
            <span>2-day plan review</span>
            <span>Same-day inspections</span>
            <span>By invitation</span>
          </div>
        </div>

        {/* 3D mark, set on a lavender plate like a pressed seal */}
        <div className="relative flex justify-center lg:justify-end">
          <div
            className="relative flex aspect-square w-full max-w-[430px] items-center justify-center"
            style={{ background: LAVENDER, border: `1px solid ${OAT_DEEP}` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-6"
              style={{ border: "1px solid rgba(43,22,32,0.14)" }}
            />
            <img
              src={mark3d.url}
              alt="Cleard mark"
              className="relative w-[62%] object-contain"
            />
            <div
              className="absolute bottom-5 left-6 text-[10px] uppercase"
              style={{ letterSpacing: "0.28em", color: SLATE }}
            >
              Cleard · private provider · by invitation
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClearedHero;
