import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import mark3d from "@/assets/cleard-3d-mark.png.asset.json";
import mark2d from "@/assets/cleard-mark-2d.png.asset.json";
import heroBackdrop from "@/assets/hero-construction.jpg";
import { HomeMotionStyles } from "@/components/home-command-center";
import { HeroStage } from "@/components/hero-stage";
import { TRADES } from "@/lib/trades";


/* ---------------------- NORDIC LUXURY BRAND TOKENS ---------------------- */

const OAT = "#FAF3E6";
const SLATE = "#2F4F4F";
const PLUM = "#673147";
const GREEN = "#2F4F4F"; /* minor accent only: eyebrows, secondary CTA, metadata */

const SERIF = '"Fraunces", "Iowan Old Style", Georgia, serif';

const NAV = [
  { to: "/", label: "Home", hash: undefined },
  { to: "/join", label: "For Contractors", hash: undefined },
  { to: "/pricing", label: "Pricing", hash: undefined },
  { to: "/compare", label: "Compare", hash: undefined },
  { to: "/pitch-deck", label: "Pitch Deck", hash: undefined },
] as const;

/* ------------------------- HERO MOMENT SEQUENCE -------------------------- */
/* Beats: 1 assemble · 2 settle · 3 sweep (clears paperwork) · 4 dock in nav */

type Beat = "assemble" | "settle" | "sweep" | "dock" | "done";

const BEAT_TIMING: Array<[Beat, number]> = [
  ["settle", 900],
  ["sweep", 1750],
  ["dock", 2950],
  ["done", 3800],
];

/* 4 wedges of the same rendered 3D mark, each drifting in from its own vector */
const SHARDS: Array<{ clip: string; from: string }> = [
  { clip: "polygon(0 0, 55% 0, 55% 52%, 0 52%)", from: "translate3d(-26%, -22%, 0) rotate(-13deg)" },
  { clip: "polygon(55% 0, 100% 0, 100% 52%, 55% 52%)", from: "translate3d(24%, -18%, 0) rotate(11deg)" },
  { clip: "polygon(0 52%, 55% 52%, 55% 100%, 0 100%)", from: "translate3d(-20%, 25%, 0) rotate(9deg)" },
  { clip: "polygon(55% 52%, 100% 52%, 100% 100%, 55% 100%)", from: "translate3d(22%, 21%, 0) rotate(-10deg)" },
];

const CLUTTER: Array<{ label: string; top: string; left: string; rot: number; size: number; boxed: boolean }> = [
  { label: "Permit A-2041", top: "18%", left: "8%", rot: -9, size: 11, boxed: true },
  { label: "Resubmit", top: "62%", left: "13%", rot: 6, size: 13, boxed: true },
  { label: "Rev 04 · pending", top: "38%", left: "31%", rot: -3, size: 10, boxed: false },
  { label: "Missing stamp", top: "75%", left: "38%", rot: 8, size: 11, boxed: true },
  { label: "NOC not recorded", top: "22%", left: "52%", rot: -6, size: 10, boxed: false },
  { label: "COI expired", top: "56%", left: "63%", rot: 4, size: 12, boxed: true },
  { label: "Plan review · 6 wks", top: "12%", left: "72%", rot: -11, size: 11, boxed: true },
  { label: "Inspection failed", top: "80%", left: "70%", rot: 5, size: 10, boxed: false },
  { label: "Lien deadline", top: "44%", left: "84%", rot: -7, size: 11, boxed: true },
];

function useHeroSequence(navSlot: React.RefObject<HTMLElement | null>) {
  const [beat, setBeat] = useState<Beat>("assemble");
  const [dockTf, setDockTf] = useState<string>("");
  const stageMark = useRef<HTMLDivElement | null>(null);
  const skipped = useRef(false);

  const skip = useCallback(() => {
    if (skipped.current) return;
    skipped.current = true;
    setBeat("done");
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("cleard-hero-moment") === "1";
    } catch {
      /* storage unavailable */
    }
    if (reduced || seen) {
      skipped.current = true;
      setBeat("done");
      return;
    }
    try {
      sessionStorage.setItem("cleard-hero-moment", "1");
    } catch {
      /* storage unavailable */
    }

    const timers = BEAT_TIMING.map(([b, at]) =>
      window.setTimeout(() => {
        if (!skipped.current) setBeat(b);
      }, at),
    );
    const onSkip = () => skip();
    window.addEventListener("wheel", onSkip, { passive: true });
    window.addEventListener("touchmove", onSkip, { passive: true });
    window.addEventListener("pointerdown", onSkip);
    window.addEventListener("keydown", onSkip);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("wheel", onSkip);
      window.removeEventListener("touchmove", onSkip);
      window.removeEventListener("pointerdown", onSkip);
      window.removeEventListener("keydown", onSkip);
    };
  }, [skip]);

  /* measure the nav logo slot so the mark docks exactly into it */
  useLayoutEffect(() => {
    if (beat !== "dock") return;
    const a = stageMark.current?.getBoundingClientRect();
    const b = navSlot.current?.getBoundingClientRect();
    if (!a || !b || !a.width || !b.width) return;
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    setDockTf(`translate3d(${Math.round(dx)}px, ${Math.round(dy)}px, 0) scale(${(b.width / a.width).toFixed(3)})`);
  }, [beat, navSlot]);

  return { beat, dockTf, stageMark, skip };
}

/* ---------------------------------- NAV ---------------------------------- */

function HeroTrades() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="text-[13.5px] transition-colors"
        style={{ color: SLATE, whiteSpace: "nowrap" }}
        aria-expanded={open}
      >
        Trades
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-3" style={{ zIndex: 10 }}>
          <div
            className="grid grid-cols-2"
            style={{ background: OAT, border: "1px solid #E0D3BC", minWidth: 460 }}
          >
            {TRADES.map((t) => (
              <Link
                key={t.slug}
                to="/trades/$slug"
                params={{ slug: t.slug }}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-[13.5px] no-underline transition-opacity hover:opacity-70"
                style={{ color: SLATE }}
              >
                {t.navLabel}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroNav({ logoSlot, logoVisible }: { logoSlot: React.Ref<HTMLDivElement>; logoVisible: boolean }) {
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
      className="fixed inset-x-0 top-0 z-[100] transition-all duration-300"
      style={{
        background: "#FAF3E6",
        boxShadow: scrolled || open ? "0 1px 0 rgba(43,22,32,0.06)" : "none",
        borderBottom: `1px solid ${scrolled || open ? "#E0D3BC" : "transparent"}`,
      }}
    >
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 no-underline" style={{ flexShrink: 0 }}>
          <div ref={logoSlot} className="h-8 w-8">
            <img
              src={mark2d.url}
              alt="Cleard"
              className="h-8 w-8 object-contain transition-opacity duration-300"
              style={{ opacity: logoVisible ? 1 : 0 }}
            />
          </div>
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
              key={l.label}
              to={l.to}
              hash={l.hash}
              className="text-[13.5px] no-underline transition-colors"
              style={{ color: SLATE, whiteSpace: "nowrap" }}
            >
              {l.label}
            </Link>
          ))}
          <HeroTrades />
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
            className="cl-glass foil-sheen inline-flex items-center px-5 py-2.5 text-[13px] no-underline transition-transform duration-200 hover:scale-[1.03]"
            style={{
              backgroundImage: "var(--gradient-copper)",
              border: "1px solid color-mix(in oklab, var(--copper-deep) 70%, transparent)",
              backdropFilter: "blur(12px) saturate(140%)",
              WebkitBackdropFilter: "blur(12px) saturate(140%)",
              color: "#FFF8EC",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.45), 0 12px 26px -16px color-mix(in oklab, var(--copper-deep) 70%, transparent)",
            }}
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
  const navSlot = useRef<HTMLDivElement | null>(null);
  const { beat, dockTf, stageMark, skip } = useHeroSequence(navSlot);

  /* The hero moment now lives in HeroStage (mark + capability boxes + app). */
  const running = false;
  const assembled = beat !== "assemble";
  const swept = beat === "sweep" || beat === "dock";
  /* content is revealed right-to-left in the wake of the mark */
  const contentInset = "inset(0 0 0 0)";
  const clutterInset = swept || beat === "done" ? "inset(0 100% 0 0)" : "inset(0 0 0 0)";

  const stageTf =
    beat === "dock"
      ? dockTf || "translate3d(-38vw, -22vh, 0) scale(0.16)"
      : beat === "sweep"
        ? "translate3d(-34vw, 0, 0) rotateY(-16deg) rotateZ(-4deg) scale(1.04)"
        : "translate3d(0, 0, 0)";

  return (
    <>
      <HeroNav logoSlot={navSlot} logoVisible={!running} />
    <section data-beat={beat} className="relative isolate overflow-hidden" style={{ background: OAT, color: SLATE }}>
      <style>{`
        @keyframes clShardIn { to { transform: none; opacity: 1; } }
        @keyframes clGloss { 0% { transform: translateX(-140%) skewX(-16deg); opacity: 0; }
          35% { opacity: 1; } 100% { transform: translateX(180%) skewX(-16deg); opacity: 0; } }
      `}</style>
      <HomeMotionStyles />



      {/* muted construction-site backdrop, bottom-anchored and washed out so copy stays legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-0"
        style={{
          backgroundImage: `url(${heroBackdrop})`,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          opacity: 0.72,
          filter: "saturate(0.9)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(250,243,230,0.86) 0%, rgba(250,243,230,0.62) 38%, rgba(250,243,230,0.28) 72%, rgba(250,243,230,0.42) 100%)`,
        }}
      />

      {/* Beat 3 — the paperwork mess that the mark clears away */}
      {running && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            clipPath: clutterInset,
            transition: "clip-path 1150ms cubic-bezier(0.7, 0, 0.2, 1)",
          }}
        >
          {CLUTTER.map((c) => (
            <span
              key={c.label}
              className="absolute uppercase"
              style={{
                top: c.top,
                left: c.left,
                fontSize: c.size,
                letterSpacing: "0.14em",
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                color: "rgba(43,22,32,0.34)",
                transform: `rotate(${c.rot}deg)`,
                border: c.boxed ? "1px solid rgba(43,22,32,0.22)" : "none",
                padding: c.boxed ? "5px 9px" : 0,
                whiteSpace: "nowrap",
              }}
            >
              {c.label}
            </span>
          ))}
        </div>
      )}

      <div
        className="relative z-10 mx-auto max-w-5xl px-5 pb-10 pt-24 text-center lg:px-8 lg:pb-14 lg:pt-28"
        style={{
          clipPath: contentInset,
          transition: running ? "clip-path 1150ms cubic-bezier(0.7, 0, 0.2, 1)" : undefined,
        }}
      >

        {/* copy */}
        <div className="mx-auto max-w-3xl">
          <div
            className="text-[10.5px] uppercase"
            style={{ letterSpacing: "0.32em", color: GREEN, fontWeight: 600 }}
          >
            The operating system for contractors
          </div>

          <h1
            className="mx-auto mt-5 max-w-[20ch]"
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: "clamp(2.3rem, 5vw, 3.9rem)",
              lineHeight: 0.99,
              letterSpacing: "-0.035em",
              color: PLUM,
              fontVariationSettings: '"SOFT" 0, "WONK" 1',
            }}
          >
            Run projects, not paperwork.
          </h1>

          <p
            className="mx-auto mt-5 max-w-[52ch] text-[16px] leading-[1.65]"
            style={{ color: SLATE }}
          >
            Permits, inspections, licenses, and lien rights — cleared automatically.
          </p>
        </div>


        {/* the platform itself: mark hovering, capabilities popping out, then the app */}
        <div className="mt-8 lg:mt-10">
          <HeroStage />
        </div>
      </div>



      {/* Beats 1-4 — the mark itself, above everything, one arc, one direction */}
      {running && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-end px-5 lg:px-10"
          style={{ perspective: 1400 }}
        >
          <div
            ref={stageMark}
            className="relative mr-[4vw] h-[230px] w-[230px] lg:h-[300px] lg:w-[300px]"
            style={{
              transform: stageTf,
              transformStyle: "preserve-3d",
              transition:
                beat === "dock"
                  ? "transform 850ms cubic-bezier(0.65, 0, 0.2, 1)"
                  : beat === "sweep"
                    ? "transform 1150ms cubic-bezier(0.7, 0, 0.2, 1)"
                    : "transform 550ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {SHARDS.map((s, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  clipPath: s.clip,
                  transform: assembled ? "none" : s.from,
                  opacity: assembled ? 1 : 0,
                  animation: `clShardIn 780ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 70}ms both`,
                  filter: "drop-shadow(0 18px 26px rgba(43,22,32,0.22))",
                }}
              >
                <img src={mark3d.url} alt="" className="h-full w-full object-contain" />
              </div>
            ))}

            {/* settle: one light sweep catches an edge */}
            {beat === "settle" && (
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-y-0 w-1/3"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
                    animation: "clGloss 780ms ease-in-out both",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {running && (
        <button
          type="button"
          onClick={skip}
          className="absolute bottom-6 left-1/2 z-50 -translate-x-1/2 text-[10px] uppercase"
          style={{ letterSpacing: "0.24em", color: "rgba(47,79,79,0.5)" }}
        >
          Skip
        </button>
      )}
    </section>
    </>
  );
}

export default ClearedHero;
