import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export const SLATE = "#2F4F4F";
export const OAT = "#FAF3E6";

type Slide = { img: string; bgImage: string; light: boolean };

/** Slide artwork served locally from /public/deck over a photo background. */
export const SLIDES: Slide[] = [
  { img: "/deck/slide-01.png", bgImage: "https://picsum.photos/seed/construction-crane-steel/1600/900", light: false },
  { img: "/deck/slide-02.png", bgImage: "https://picsum.photos/seed/ancient-rome-ruins-columns/1600/900", light: true },
  { img: "/deck/slide-03.png", bgImage: "https://picsum.photos/seed/city-aerial-skyscraper/1600/900", light: false },
  { img: "/deck/slide-04.png", bgImage: "https://picsum.photos/seed/government-capitol-building/1600/900", light: true },
  { img: "/deck/slide-05.png", bgImage: "https://picsum.photos/seed/ai-technology-circuit/1600/900", light: false },
  { img: "/deck/slide-06.png", bgImage: "https://picsum.photos/seed/blueprint-architecture-plan/1600/900", light: false },
  { img: "/deck/slide-07.png", bgImage: "https://picsum.photos/seed/urban-construction-site/1600/900", light: true },
  { img: "/deck/slide-08.png", bgImage: "https://picsum.photos/seed/ancient-greek-parthenon/1600/900", light: true },
  { img: "/deck/slide-09.png", bgImage: "https://picsum.photos/seed/crane-skyline-workers/1600/900", light: false },
  { img: "/deck/slide-10.png", bgImage: "https://picsum.photos/seed/glass-modern-tower/1600/900", light: true },
  { img: "/deck/slide-11.png", bgImage: "https://picsum.photos/seed/concrete-steel-bridge/1600/900", light: false },
  { img: "/deck/slide-12.png", bgImage: "https://picsum.photos/seed/future-city-horizon/1600/900", light: false },
];





export function DeckViewer({ footer }: { footer?: React.ReactNode }) {
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

  useEffect(() => {
    const t = window.setTimeout(() => {
      SLIDES.forEach((s) => {
        const a = new Image();
        a.src = s.img;
        const b = new Image();
        b.src = s.bgImage;
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
      className="cl-public relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
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
        {SLIDES.map((s, idx) => (
          <div
            key={s.img}
            className="absolute inset-0 overflow-hidden transition-opacity duration-300"
            style={{
              opacity: idx === i ? 1 : 0,
              pointerEvents: "none",
              backgroundImage: `url(${s.bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: s.light ? OAT : SLATE,
            }}
          >
            <img
              src={s.img}
              alt={`Slide ${idx + 1} of ${SLIDES.length}`}
              loading={idx <= i + 1 ? "eager" : "lazy"}
              width="100%"
              className="absolute inset-0 h-full w-full object-contain"
              style={{
                display: "block",
                position: "absolute",
                zIndex: 1,
                mixBlendMode: s.light ? "multiply" : "screen",
              }}
            />
          </div>


        ))}



        <button
          type="button"
          data-plain
          aria-label="Previous slide"
          onClick={() => go(-1)}
          className="absolute inset-y-0 left-0 w-1/2 cursor-w-resize bg-transparent"
        />
        <button
          type="button"
          data-plain
          aria-label="Next slide"
          onClick={() => go(1)}
          className="absolute inset-y-0 right-0 w-1/2 cursor-e-resize bg-transparent"
        />
      </div>

      <button
        type="button"
        data-plain
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 opacity-30 transition-opacity hover:opacity-100"
        style={{ color: OAT }}
      >
        <ChevronLeft className="h-8 w-8" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        data-plain
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 opacity-30 transition-opacity hover:opacity-100"
        style={{ color: OAT }}
      >
        <ChevronRight className="h-8 w-8" strokeWidth={1.5} />
      </button>

      <div
        className="absolute right-4 top-4 flex items-center gap-4 text-[12px]"
        style={{ color: "rgba(250,243,230,0.7)" }}
      >
        {footer}
        <span>
          {i + 1} / {SLIDES.length}
        </span>
        <button type="button" data-plain aria-label="Fullscreen" onClick={fullscreen} className="p-1 hover:opacity-100">
          <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2">
        {SLIDES.map((s, idx) => (
          <button
            key={s.img}

            type="button"
            data-plain
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
