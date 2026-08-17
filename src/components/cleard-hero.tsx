import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import heroVideo from "@/assets/hero-blueprint.mp4.asset.json";
import wordmark from "@/assets/cleard-wordmark.png.asset.json";
import cIcon from "@/assets/cleard-c-icon.png.asset.json";

/* ------------------------------- BRAND TOKENS ------------------------------ */

const NAVY = "#0a1a30";
const BLUE = "#1e6fd9";
const CYAN = "#7ec3ec";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/* ---------------------------------- NAV ---------------------------------- */

const NAV = [
  { to: "/product", label: "Product" },
  { to: "/join", label: "For Contractors" },
  { to: "/pricing", label: "Pricing" },
  { to: "/compare", label: "Compare" },
  { to: "/about", label: "About" },
] as const;

function HeroNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || open ? "rgba(10,26,48,0.86)" : "transparent",
        backdropFilter: scrolled || open ? "blur(14px)" : "none",
        borderBottom:
          scrolled || open ? "1px solid rgba(126,195,236,0.16)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link to="/" className="flex items-center" style={{ flexShrink: 0 }}>
          <img
            src={cIcon.url}
            alt="Cleard"
            className="h-9 w-9 object-contain"
            style={{ filter: "drop-shadow(0 0 10px rgba(30,111,217,0.35))" }}
          />
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          style={{ whiteSpace: "nowrap", flexWrap: "nowrap" }}
        >
          {NAV.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[13.5px] no-underline transition-opacity hover:opacity-100"
              style={{ color: "rgba(255,255,255,0.78)", whiteSpace: "nowrap" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
          <Link
            to="/login"
            className="hidden text-[13.5px] no-underline sm:inline"
            style={{ color: "rgba(255,255,255,0.78)", whiteSpace: "nowrap" }}
          >
            Sign in
          </Link>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-4 py-2 text-[13px] font-semibold no-underline"
            style={{
              background: `linear-gradient(135deg, ${BLUE}, #2f8ef0)`,
              color: "#fff",
              boxShadow: `0 0 24px rgba(30,111,217,0.45)`,
              whiteSpace: "nowrap",
            }}
          >
            Get Early Access
          </Link>
          <button
            type="button"
            className="-mr-1 p-2 text-[13px] md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((s) => !s)}
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden" style={{ borderTop: "1px solid rgba(126,195,236,0.16)" }}>
          <div className="space-y-3 px-5 py-5">
            {[...NAV, { to: "/login", label: "Sign in" } as const].map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block text-[15px] no-underline"
                style={{ color: "rgba(255,255,255,0.85)" }}
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
      className="relative isolate flex min-h-[92vh] items-center overflow-hidden"
      style={{ background: NAVY, color: "#fff", fontFamily: SANS }}
    >
      <HeroNav />

      {/* full-bleed looping blueprint video */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="absolute -inset-[8%] h-[116%] w-[116%] object-cover"
          src={heroVideo.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>

      {/* tint + vignette so the card and copy stay legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,26,48,0.58) 0%, rgba(10,26,48,0.42) 45%, rgba(10,26,48,0.80) 100%)",
        }}
      />
      {/* blueprint graph-paper grid across the whole viewport */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(126,195,236,0.10) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(126,195,236,0.10) 1px, transparent 1px),
            linear-gradient(to right, rgba(126,195,236,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(126,195,236,0.05) 1px, transparent 1px)`,
          backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px",
        }}
      />

      {/* continuously re-drawing architectural line work across the full page */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        fill="none"
        stroke={CYAN}
        strokeWidth={1.25}
      >
        {[
          { d: "M0 170 H1600 M0 730 H1600", delay: 0 },
          { d: "M170 0 V900 M530 0 V900 M1070 0 V900 M1430 0 V900", delay: 0.8 },
          { d: "M-80 400 L280 145 L640 400 L640 815 H-80 Z", delay: 0.2 },
          { d: "M20 815 V455 H500 V815 M20 570 H500 M165 455 V815 M350 455 V815", delay: 1.1 },
          { d: "M960 400 L1320 145 L1680 400 L1680 815 H960 Z", delay: 1.7 },
          { d: "M1100 815 V455 H1580 V815 M1100 570 H1580 M1245 455 V815 M1430 455 V815", delay: 2.5 },
          { d: "M560 770 V340 L800 205 L1040 340 V770 Z", delay: 1.2 },
          { d: "M620 770 V470 H980 V770 M620 590 H980 M800 470 V770", delay: 3.2 },
          { d: "M70 105 H420 M70 88 V122 M420 88 V122 M1180 105 H1530 M1180 88 V122 M1530 88 V122", delay: 2.1 },
          { d: "M710 105 H890 M710 88 V122 M890 88 V122", delay: 3.8 },
          { d: "M85 260 H455 M85 245 V275 M455 245 V275 M1145 260 H1515 M1145 245 V275 M1515 245 V275", delay: 4.4 },
          { d: "M0 845 H1600 M35 825 V865 M1565 825 V865", delay: 2.8 },
        ].map((p) => (
          <path
            key={p.d}
            d={p.d}
            pathLength={1}
            vectorEffect="non-scaling-stroke"
            className="hero-blueprint-line"
            style={{ animationDelay: `${p.delay}s` }}
          />
        ))}
      </svg>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{ background: `linear-gradient(to bottom, transparent, ${NAVY})` }}
      />

      {/* seamless translucent card */}
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-28 lg:px-8 lg:pb-28 lg:pt-32">
        <div
          className="hero-glass mx-auto w-full max-w-3xl px-6 py-12 text-center sm:px-12 sm:py-14"
          style={{
            background: "rgba(10,26,48,0.14)",
            backdropFilter: "blur(9px) saturate(125%)",
            border: "none",
            boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
          }}
        >
          <img
            src={wordmark.url}
            alt="Cleard"
            className="mx-auto block h-auto w-full max-w-[400px] object-contain sm:max-w-[460px]"
          />
          <p
            className="mt-7 text-[12px] font-semibold uppercase sm:text-[14px]"
            style={{ color: CYAN, letterSpacing: "0.26em" }}
          >
            Run projects. Not paperwork.
          </p>
          <p
            className="mx-auto mt-5 max-w-2xl text-[15.5px] leading-relaxed sm:text-[16.5px]"
            style={{ color: "rgba(255,255,255,0.86)" }}
          >
            Permitting, private plan review, inspections, licensing, insurance, and lien rights.
            One platform, every jurisdiction along the coast.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/join"
              hash="request"
              className="hero-pill inline-flex items-center px-7 py-3 text-[14px] font-semibold no-underline"
              style={{
                background: `linear-gradient(135deg, ${BLUE}, #3b9bf5)`,
                color: "#fff",
                boxShadow: "0 0 34px rgba(30,111,217,0.5)",
              }}
            >
              Get Early Access
            </Link>
            <Link
              to="/contact"
              className="hero-pill inline-flex items-center px-7 py-3 text-[14px] font-semibold no-underline"
              style={{ border: `1px solid rgba(126,195,236,0.45)`, color: "#fff" }}
            >
              See A Live Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClearedHero;
