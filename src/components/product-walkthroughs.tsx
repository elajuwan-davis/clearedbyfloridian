import { useState } from "react";
import { Play } from "lucide-react";

const OAT = "#FFFFFF";
const INK = "#2B1620";
const GRAY = "rgba(43,22,32,0.55)";
const PLUM = "#2B1620";
const BRONZE = "#9C6B3F";
const BORDER = "rgba(0,0,0,0.1)";
const SERIF = "'Instrument Sans', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

type Walkthrough = {
  id: string;
  eyebrow: string;
  title: string;
  caption: string;
  runtime: string;
  /** Supply a real MP4/embed URL here when the recordings are ready. */
  src?: string;
  poster?: string;
};

const WALKTHROUGHS: Walkthrough[] = [
  {
    id: "permit-package",
    eyebrow: "Walkthrough 01",
    title: "Permit package, without the busywork",
    caption:
      "Cleard reads the project record and assembles the full permit package — application, scopes, subs, product approvals and plan set — ready for submittal.",
    runtime: "2:10",
  },
  {
    id: "noc-recorded",
    eyebrow: "Walkthrough 02",
    title: "From project address to recorded document",
    caption:
      "One address in. Cleard drafts the Notice of Commencement, routes it for signature and notarization, and returns the recorded document to the project file.",
    runtime: "1:45",
  },
];

function VideoCard({ w }: { w: Walkthrough }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure
      className="m-0 flex flex-col"
      style={{ background: OAT, border: `1px solid ${BORDER}` }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16 / 10", background: INK }}
      >
        {playing && w.src ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={w.src}
            poster={w.poster}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <>
            {w.poster ? (
              <img
                src={w.poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 18px)",
                }}
              />
            )}

            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play: ${w.title}`}
              className="absolute inset-0 grid place-items-center transition-transform duration-200 hover:scale-[1.02]"
              style={{ background: "transparent", border: 0, cursor: "pointer" }}
            >
              <span
                className="grid h-16 w-16 place-items-center"
                style={{
                  borderRadius: 999,
                  background: "rgba(43,22,32,0.75)",
                  border: `1.5px solid ${BRONZE}`,
                  color: OAT,
                  boxShadow: "0 10px 30px -12px rgba(0,0,0,0.55)",
                }}
              >
                <Play className="h-6 w-6" strokeWidth={1.75} />
              </span>
            </button>

            <span
              className="absolute left-4 top-4 px-2 py-1 text-[10px] uppercase"
              style={{
                fontFamily: MONO,
                letterSpacing: "0.16em",
                color: OAT,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              {w.eyebrow}
            </span>
            <span
              className="absolute bottom-4 right-4 text-[10px] uppercase"
              style={{ fontFamily: MONO, letterSpacing: "0.16em", color: "rgba(255,255,255,0.7)" }}
            >
              {w.src ? w.runtime : "Recording coming soon"}
            </span>
          </>
        )}
      </div>

      <figcaption className="p-6 md:p-7">
        <h3
          className="text-[19px] leading-snug"
          style={{ fontFamily: SERIF, fontWeight: 600, letterSpacing: "-0.02em", color: INK }}
        >
          {w.title}
        </h3>
        <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: GRAY }}>
          {w.caption}
        </p>
      </figcaption>
    </figure>
  );
}

/** Two product walkthrough videos, styled to match the hero dashboard demo. */
export function ProductWalkthroughs() {
  return (
    <section style={{ background: "#FFFFFF" }}>
      <div className="mx-auto max-w-7xl px-5 py-20 md:py-28 lg:px-8">
        <div
          className="flex items-center gap-3 text-[10.5px] font-bold uppercase"
          style={{ letterSpacing: "0.22em", color: INK, fontFamily: MONO }}
        >
          <span className="copper-hairline inline-block h-px w-7" />
          See the product
        </div>
        <h2
          className="mt-5 max-w-3xl"
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(1.9rem, 3.6vw, 2.9rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            color: INK,
          }}
        >
          Two minutes inside{" "}
          <span className="copper-emph">the actual platform.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed" style={{ color: GRAY }}>
          No slides. Real screens, real permit data, start to finish.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {WALKTHROUGHS.map((w) => (
            <VideoCard key={w.id} w={w} />
          ))}
        </div>
      </div>
    </section>
  );
}
