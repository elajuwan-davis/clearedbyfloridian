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

      {/* full-bleed looping architecture video */}
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src={heroVideo.url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />

      {/* tint + vignette so the card and copy stay legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,26,48,0.72) 0%, rgba(10,26,48,0.55) 45%, rgba(10,26,48,0.88) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{ background: `linear-gradient(to bottom, transparent, ${NAVY})` }}
      />

      {/* translucent glass card */}
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-28 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="mx-auto w-full max-w-3xl text-center">
          <img
            src={wordmark.url}
            alt="Cleard"
            className="mx-auto block h-auto w-full max-w-[640px] object-contain"
          />
          <p
            className="mt-8 text-[13px] font-semibold uppercase sm:text-[15px]"
            style={{ color: CYAN, letterSpacing: "0.26em" }}
          >
            Run projects. Not paperwork.
          </p>
          <p
            className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed sm:text-[17px]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Permitting, private plan review, inspections, licensing, insurance, and lien rights.
            One platform, every jurisdiction along the coast.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
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
