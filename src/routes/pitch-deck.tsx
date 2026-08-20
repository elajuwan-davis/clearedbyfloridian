import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Maximize2, Lock } from "lucide-react";
import { INVESTOR_PASSCODE } from "@/lib/investor-access";
import s01 from "@/assets/deck/slide-01.png.asset.json";
import s02 from "@/assets/deck/slide-02.png.asset.json";
import s03 from "@/assets/deck/slide-03.png.asset.json";
import s04 from "@/assets/deck/slide-04.png.asset.json";
import s05 from "@/assets/deck/slide-05.png.asset.json";
import s06 from "@/assets/deck/slide-06.png.asset.json";
import s07 from "@/assets/deck/slide-07.png.asset.json";
import s08 from "@/assets/deck/slide-08.png.asset.json";
import s09 from "@/assets/deck/slide-09.png.asset.json";
import s10 from "@/assets/deck/slide-10.png.asset.json";
import s11 from "@/assets/deck/slide-11.png.asset.json";
import s12 from "@/assets/deck/slide-12.png.asset.json";

const SLIDES = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12].map((a) => a.url);

const SLATE = "#2F4F4F";
const OAT = "#FAF3E6";
const UNLOCK_KEY = "pitch_deck_unlocked";

export const Route = createFileRoute("/pitch-deck")({
  head: () => ({
    meta: [
      { title: "Pitch Deck — Cleard" },
      { name: "description", content: "Private investor pitch deck for Cleard. Passcode required." },
      { property: "og:title", content: "Pitch Deck — Cleard" },
      { property: "og:description", content: "Private investor pitch deck for Cleard. Passcode required." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PitchDeckPage,
});

function PitchDeckPage() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  return unlocked ? (
    <Deck />
  ) : (
    <Gate
      onPass={() => {
        try {
          sessionStorage.setItem(UNLOCK_KEY, "1");
        } catch {
          /* storage unavailable */
        }
        setUnlocked(true);
      }}
    />
  );
}

function Gate({ onPass }: { onPass: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ background: SLATE }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim() === INVESTOR_PASSCODE) onPass();
          else setError(true);
        }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2" style={{ color: OAT }}>
          <Lock className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-[0.22em]">Private</span>
        </div>
        <h1 className="mt-4 text-2xl" style={{ color: OAT, fontWeight: 500 }}>
          Pitch deck
        </h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(250,243,230,0.7)" }}>
          Enter the passcode to view the deck.
        </p>
        <input
          type="password"
          value={code}
          autoFocus
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          className="mt-6 w-full bg-transparent px-3 py-2.5 text-sm outline-none"
          style={{ border: "1px solid rgba(250,243,230,0.35)", color: OAT }}
        />
        {error && (
          <div className="mt-2 text-[12.5px]" style={{ color: "#E9A0A0" }}>
            Incorrect passcode.
          </div>
        )}
        <button
          type="submit"
          className="mt-4 w-full px-4 py-2.5 text-[13.5px]"
          style={{ background: OAT, color: SLATE, fontWeight: 600 }}
        >
          View deck
        </button>
      </form>
    </div>
  );
}

function Deck() {
  const [i, setI] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((n: number) => {
    setI((c) => Math.min(SLIDES.length - 1, Math.max(0, c + n)));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Preload remaining slides in the background.
  useEffect(() => {
    const t = window.setTimeout(() => {
      SLIDES.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, []);

  const fullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: SLATE }}
    >
      <div
        className="relative w-full"
        style={{ maxWidth: 1400, maxHeight: "calc(100vh - 96px)", aspectRatio: "16 / 9" }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX ?? null;
          touchX.current = null;
          if (start == null || end == null) return;
          if (Math.abs(end - start) > 40) go(end < start ? 1 : -1);
        }}
      >
        {SLIDES.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={`Slide ${idx + 1} of ${SLIDES.length}`}
            loading={idx <= i + 1 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
            style={{ opacity: idx === i ? 1 : 0, pointerEvents: "none" }}
          />
        ))}

        {/* click-through halves */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize"
        />
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(1)}
          className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize"
        />
      </div>

      {/* arrows */}
      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 opacity-30 transition-opacity hover:opacity-100"
        style={{ color: OAT }}
      >
        <ChevronLeft className="h-8 w-8" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 opacity-30 transition-opacity hover:opacity-100"
        style={{ color: OAT }}
      >
        <ChevronRight className="h-8 w-8" strokeWidth={1.5} />
      </button>

      {/* counter + fullscreen */}
      <div
        className="absolute right-4 top-4 flex items-center gap-4 text-[12px]"
        style={{ color: "rgba(250,243,230,0.7)" }}
      >
        <span>
          {i + 1} / {SLIDES.length}
        </span>
        <button type="button" aria-label="Fullscreen" onClick={fullscreen} className="p-1 hover:opacity-100">
          <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* dots */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2">
        {SLIDES.map((src, idx) => (
          <button
            key={src}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className="h-1.5 w-6 transition-opacity"
            style={{ background: OAT, opacity: idx === i ? 1 : 0.28 }}
          />
        ))}
      </div>
    </div>
  );
}
