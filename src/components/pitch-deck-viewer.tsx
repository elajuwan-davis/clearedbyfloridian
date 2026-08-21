import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
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

export const SLIDES = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12].map((a) => a.url);

export const SLATE = "#2F4F4F";
export const OAT = "#FAF3E6";

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
        {SLIDES.map((src, idx) => (
          <button
            key={src}
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
