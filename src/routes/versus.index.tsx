import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, OBSIDIAN, HAIRLINE, MUTED } from "@/components/public-shell";
import { COMPETITORS } from "@/lib/competitors";
import { Square } from "lucide-react";

export const Route = createFileRoute("/versus/")({
  component: VersusHub,
  head: () => ({
    meta: [
      { title: "Cleard vs the Alternatives — Compare Permit Software" },
      { name: "description", content: "See how Cleard compares to the alternatives for Florida contractors." },
      { property: "og:title", content: "Better than the alternative: Build with Cleard" },
      { property: "og:description", content: "Exploring other ways to handle permitting in Florida? See how Cleard compares." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function VersusHub() {
  return (
    <PublicShell>
      {/* HERO */}
      <section className="px-6 lg:px-10 py-24 lg:py-32" style={{ backgroundColor: OBSIDIAN }}>
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="font-mono text-[10px] uppercase mb-8"
            style={{ color: "rgba(255,255,255,0.65)", letterSpacing: "0.32em" }}
          >
            Comparison
          </div>
          <h1
            className="display-serif font-bold leading-[1.05] mb-8"
            style={{ color: "#fff", fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)", letterSpacing: "-0.02em" }}
          >
            Better than the alternative:<br />Build with Cleard.
          </h1>
          <p className="text-lg mb-12 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
            Exploring other ways to handle permitting in Florida? See how Cleard compares.
          </p>
          <Link
            to="/join"
            hash="request"
            className="inline-flex items-center px-8 h-14 text-[12px] font-mono uppercase tracking-[0.24em] transition-opacity hover:opacity-85"
            style={{ backgroundColor: "#fff", color: OBSIDIAN, borderRadius: 0 }}
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* GRID */}
      <section className="px-6 lg:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <div
            className="font-mono text-[10px] uppercase mb-6 text-center"
            style={{ color: OBSIDIAN, letterSpacing: "0.32em" }}
          >
            Head to Head
          </div>
          <h2
            className="display-serif font-bold leading-[1.05] mb-16 text-center"
            style={{ color: OBSIDIAN, fontSize: "clamp(1.75rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            See how we stack up.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPETITORS.map((c) => (
              <Link
                key={c.slug}
                to="/versus/$slug"
                params={{ slug: c.slug }}
                className="group block bg-white p-6 transition-all hover:-translate-y-0.5"
                style={{ border: `1px solid ${HAIRLINE}` }}
              >
                <div
                  className="w-14 h-14 mb-6 flex items-center justify-center"
                  style={{ backgroundColor: `color-mix(in oklab, ${OBSIDIAN} 6%, transparent)` }}
                >
                  <Square size={22} strokeWidth={1.25} style={{ color: MUTED }} />
                </div>
                <div className="font-mono text-[9px] uppercase mb-2" style={{ color: MUTED, letterSpacing: "0.22em" }}>
                  Cleard vs
                </div>
                <div
                  className="display-serif font-bold leading-tight"
                  style={{ color: OBSIDIAN, fontSize: "1.25rem", letterSpacing: "-0.01em" }}
                >
                  {c.name}
                </div>
                <div
                  className="mt-6 text-[11px] font-mono uppercase transition-opacity opacity-60 group-hover:opacity-100"
                  style={{ color: OBSIDIAN, letterSpacing: "0.22em" }}
                >
                  Compare →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
