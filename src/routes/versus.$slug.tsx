import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicShell, OBSIDIAN, HAIRLINE, MUTED } from "@/components/public-shell";
import { COMPETITORS, DEFAULT_FEATURE_MATRIX } from "@/lib/competitors";
import { Check, X, Minus } from "lucide-react";

export const Route = createFileRoute("/versus/$slug")({
  loader: ({ params }) => {
    const competitor = COMPETITORS.find((c) => c.slug === params.slug);
    if (!competitor) throw notFound();
    return { competitor };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Comparison — Cléared" }, { name: "robots", content: "noindex" }] };
    }
    const { competitor } = loaderData;
    return {
      meta: [
        { title: `Cléared vs ${competitor.name} — Permit Management Compared` },
        { name: "description", content: competitor.positioning },
        { property: "og:title", content: `Cléared vs ${competitor.name}` },
        { property: "og:description", content: competitor.positioning },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: VersusDetail,
  notFoundComponent: NotFoundView,
});

function NotFoundView() {
  return (
    <PublicShell>
      <section className="px-6 py-32 text-center">
        <h1 className="display-serif font-bold mb-6" style={{ color: OBSIDIAN, fontSize: "2rem" }}>
          Comparison not found
        </h1>
        <Link to="/versus" className="text-[13px] hover:underline" style={{ color: MUTED }}>
          ← See all comparisons
        </Link>
      </section>
    </PublicShell>
  );
}

function VersusDetail() {
  const { competitor } = Route.useLoaderData();

  return (
    <PublicShell>
      {/* HERO */}
      <section className="px-6 lg:px-10 py-24 lg:py-28" style={{ backgroundColor: OBSIDIAN }}>
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="font-mono text-[10px] uppercase mb-8"
            style={{ color: "rgba(255,255,255,0.65)", letterSpacing: "0.32em" }}
          >
            Comparison
          </div>
          <h1
            className="display-serif font-bold leading-[1.05] mb-8"
            style={{ color: "#fff", fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.02em" }}
          >
            Cléared vs {competitor.name}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.55 }}>
            {competitor.positioning}
          </p>
        </div>
      </section>

      {/* TABLE */}
      <section className="px-6 lg:px-10 py-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-6 text-center"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            Feature Comparison
          </div>
          <h2
            className="display-serif font-bold leading-[1.05] mb-16 text-center"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", letterSpacing: "-0.02em" }}
          >
            What you get, side by side.
          </h2>
          <div className="overflow-hidden bg-white" style={{ border: `1px solid ${HAIRLINE}` }}>
            {/* header */}
            <div
              className="grid grid-cols-[1.5fr_1fr_1fr] items-center"
              style={{ backgroundColor: `color-mix(in oklab, ${OBSIDIAN} 4%, transparent)`, borderBottom: `1px solid ${HAIRLINE}` }}
            >
              <div className="px-6 py-4 font-mono text-[10px] uppercase" style={{ color: MUTED, letterSpacing: "0.22em" }}>
                Feature
              </div>
              <div className="px-6 py-4 text-center font-mono text-[10px] uppercase" style={{ color: OBSIDIAN, letterSpacing: "0.22em" }}>
                Cléared
              </div>
              <div className="px-6 py-4 text-center font-mono text-[10px] uppercase" style={{ color: MUTED, letterSpacing: "0.22em" }}>
                {competitor.name}
              </div>
            </div>
            {/* rows */}
            {DEFAULT_FEATURE_MATRIX.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-[1.5fr_1fr_1fr] items-center"
                style={{ borderBottom: i === DEFAULT_FEATURE_MATRIX.length - 1 ? undefined : `1px solid ${HAIRLINE}` }}
              >
                <div className="px-6 py-5 text-[14px]" style={{ color: OBSIDIAN }}>
                  {row.feature}
                </div>
                <div className="px-6 py-5 flex justify-center">
                  {row.cleared ? (
                    <Check size={20} strokeWidth={2} style={{ color: "#0a7a3f" }} />
                  ) : (
                    <X size={20} strokeWidth={2} style={{ color: "#b91c1c" }} />
                  )}
                </div>
                <div className="px-6 py-5 flex justify-center">
                  {row.competitor === "no" ? (
                    <X size={20} strokeWidth={2} style={{ color: "#b91c1c", opacity: 0.7 }} />
                  ) : (
                    <Minus size={20} strokeWidth={2} style={{ color: MUTED }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-6 text-[11px]" style={{ color: MUTED }}>
            <span className="flex items-center gap-2">
              <Check size={14} style={{ color: "#0a7a3f" }} /> Included
            </span>
            <span className="flex items-center gap-2">
              <Minus size={14} /> Limited
            </span>
            <span className="flex items-center gap-2">
              <X size={14} style={{ color: "#b91c1c" }} /> Not available
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-10 py-24" style={{ backgroundColor: "#fafafa" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="font-mono text-[10px] uppercase mb-6"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            Make the Switch
          </div>
          <h2
            className="display-serif font-bold leading-[1.05] mb-6"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            Ready to switch?
          </h2>
          <p className="text-lg mb-10" style={{ color: MUTED }}>
            Tell us about your operation and we'll get you set up.
          </p>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-8 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: OBSIDIAN, color: "#fff", borderRadius: 0 }}
          >
            Get Started
          </Link>
          <div className="mt-8">
            <Link to="/versus" className="text-[13px] hover:underline" style={{ color: MUTED }}>
              ← See all comparisons
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
