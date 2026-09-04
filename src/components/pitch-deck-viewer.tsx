import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export const SLATE = "#000000";
export const OAT = "#FFFFFF";

type Slide = { img: string };

/** Slide artwork, served from the Lovable CDN. */
export const SLIDES: Slide[] = [
  { img: "/__l5e/assets-v1/6f4005ef-4e74-4c9e-8a45-a8f3a3af1bc8/slide-01-v2.png" },
  { img: "/__l5e/assets-v1/20bee46c-85be-409d-aa73-9fa5468ea395/slide-02-v2.png" },
  { img: "/__l5e/assets-v1/ff0f499a-598d-4178-b6a7-47cbdb30f89b/slide-03-v2.png" },
  { img: "/__l5e/assets-v1/8a021ac5-483b-4e37-88cc-87e3cf5de994/slide-04-v2.png" },
  { img: "/__l5e/assets-v1/fc5b90b5-0344-4ba5-aed4-d5bf7231d307/slide-05-v2.png" },
  { img: "/__l5e/assets-v1/13f4b59e-a8bf-4dbe-9e01-c443fbd07bcc/slide-06-v2.png" },
  { img: "/__l5e/assets-v1/5e4edbf8-bdf3-4362-979a-78ac2c5443db/slide-07-v2.png" },
  { img: "/__l5e/assets-v1/b0d97de8-3738-4222-94a9-a295fee7e2a5/slide-08-v2.png" },
  { img: "/__l5e/assets-v1/59857a9c-6c36-4997-b334-6fba91eba642/slide-09-v2.png" },
  { img: "/__l5e/assets-v1/a489e6d8-5981-4754-9563-8b70ee88f1cf/slide-10-v2.png" },
  { img: "/__l5e/assets-v1/bd0e06df-7a82-4ed7-bdc8-01b6eb8f2469/slide-11-v2.png" },
  { img: "/__l5e/assets-v1/b362cabb-8b2e-43cd-99d0-f182b20d3b47/slide-12-v2.png" },
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
      style={{ backgroundColor: "#2A4442" }}
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
        style={{ color: "rgba(255,255,255,0.7)" }}
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
