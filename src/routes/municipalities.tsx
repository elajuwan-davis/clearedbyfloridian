import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/municipalities")({
  head: () => ({
    meta: [
      { title: "Statewide Coverage — Cleard" },
      {
        name: "description",
        content:
          "Cleard operates across 160+ municipalities and 9 counties statewide — a registered private provider from South Florida to Central Florida.",
      },
      { property: "og:title", content: "Statewide Coverage — Cleard" },
      {
        property: "og:description",
        content: "160+ Municipalities · 9 Counties · Statewide Coverage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MunicipalitiesPublicPage,
});


function FloridaOutline() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-auto max-w-md mx-auto"
      aria-hidden="true"
    >
      {/* Stylized outline of Florida */}
      <path
        d="M50 60 L340 60 L340 120 L310 150 L305 190 L285 215 L270 235 L255 265 L235 295 L205 325 L175 355 L150 375 L130 380 L118 365 L128 335 L145 305 L155 275 L145 245 L120 215 L95 190 L75 165 L60 130 Z"
        fill="none"
        stroke="#153157"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M50 60 L340 60 L340 120 L310 150 L305 190 L285 215 L270 235 L255 265 L235 295 L205 325 L175 355 L150 375 L130 380 L118 365 L128 335 L145 305 L155 275 L145 245 L120 215 L95 190 L75 165 L60 130 Z"
        fill="#153157"
        opacity="0.06"
      />
    </svg>
  );
}

function MunicipalitiesPublicPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF7" }}>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b" style={{ borderColor: "rgba(21,49,87,0.12)" }}>
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-[color:var(--muted-foreground)]">
              Coverage · Statewide
            </div>
            <h1
              className="display-serif mt-4 leading-[0.95]"
              style={{ fontSize: "clamp(44px, 6vw, 84px)", letterSpacing: "-0.02em" }}
            >
              160+ Municipalities <em>Across Florida</em>
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
              Cleard is a registered private provider under Florida Statute
              553.791 — delivering 2-day plan review and same-day inspections
              across nine counties statewide.
            </p>
          </div>
        </section>

        {/* Stat callout */}
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div
            className="grid md:grid-cols-3 border"
            style={{ borderColor: "rgba(21,49,87,0.15)", background: "#fff" }}
          >
            {[
              { k: "160+", v: "Municipalities" },
              { k: "9", v: "Counties" },
              { k: "Statewide", v: "Coverage" },
            ].map((s, i) => (
              <div
                key={s.v}
                className={`p-8 md:p-10 ${i < 2 ? "md:border-r" : ""} border-b md:border-b-0`}
                style={{ borderColor: "rgba(21,49,87,0.15)" }}
              >
                <div
                  className="display-serif leading-none"
                  style={{ fontSize: "clamp(40px, 5vw, 64px)", color: "#153157" }}
                >
                  {s.k}
                </div>
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted-foreground mt-4">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Outline */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <FloridaOutline />
            </div>
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted-foreground mb-3">
                Operating Area
              </div>
              <p className="display-serif leading-tight" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-0.01em", color: "#153157" }}>
                <em>Statewide coverage across Florida.</em>
              </p>
              <p className="mt-6 text-base text-muted-foreground max-w-md">
                A single private provider of record for every jurisdiction, from
                the coast to the interior.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
