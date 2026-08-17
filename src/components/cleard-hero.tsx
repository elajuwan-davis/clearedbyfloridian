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

      {/* full-bleed looping blueprint video, scaled so it fills every edge */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
          style={{ minWidth: "100%", minHeight: "100%", transform: "translate(-50%,-50%) scale(1.35)" }}
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

      {/* continuously re-drawing blueprint line work, full page */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        fill="none"
        stroke={CYAN}
        strokeWidth={1.25}
      >
        {[
          { d: "M60 760 L60 320 L300 180 L540 320 L540 760 Z", delay: 0 },
          { d: "M120 760 L120 470 L300 470 L300 760", delay: 1.2 },
          { d: "M1060 800 L1060 300 L1300 180 L1540 300 L1540 800 Z", delay: 2.1 },
          { d: "M1120 800 L1120 520 L1300 520 L1300 800", delay: 3 },
          { d: "M620 840 L620 420 L800 300 L980 420 L980 840 Z", delay: 1.6 },
          { d: "M660 840 L660 600 L940 600 L940 840", delay: 3.6 },
          { d: "M0 120 L1600 120", delay: 0.6 },
          { d: "M0 860 L1600 860", delay: 2.6 },
          { d: "M300 60 L300 900", delay: 4.2 },
          { d: "M1300 60 L1300 900", delay: 5 },
        ].map((p) => (
          <path
            key={p.d}
            d={p.d}
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
          className="mx-auto w-full max-w-3xl px-6 py-12 text-center sm:px-12 sm:py-14"
          style={{
            background: "rgba(10,26,48,0.34)",
            backdropFilter: "blur(18px) saturate(140%)",
            border: "none",
            boxShadow: "none",
            maskImage:
              "radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)",
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
