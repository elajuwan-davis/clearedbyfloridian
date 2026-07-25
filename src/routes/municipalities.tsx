import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MunicipalityMapHero, REGISTERED_MUNIS } from "@/components/municipality-map";

export const Route = createFileRoute("/municipalities")({
  head: () => ({
    meta: [
      { title: "Where We're Registered — Cleared by Flōridian" },
      {
        name: "description",
        content:
          "Flōridian pulls permits across South Florida — from Miami Beach to Vero Beach. See every municipality where we are a registered private provider.",
      },
      { property: "og:title", content: "Where We're Registered — Cleared by Flōridian" },
      {
        property: "og:description",
        content: "Registered across Miami-Dade, Broward, Palm Beach, Martin, St. Lucie, and Indian River counties.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MunicipalitiesPublicPage,
});

function MunicipalitiesPublicPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF7" }}>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b" style={{ borderColor: "rgba(21,49,87,0.12)" }}>
          <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
            <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-[color:var(--muted-foreground)]">
              Coverage · South Florida
            </div>
            <h1
              className="display-serif mt-4 leading-[0.95]"
              style={{ fontSize: "clamp(44px, 6vw, 84px)", letterSpacing: "-0.02em" }}
            >
              Where We're <em>Registered</em>
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground">
              From Miami Beach to Vero Beach — we pull permits where you build. As a registered
              private provider under Florida Statute 553.791, Flōridian delivers a 2-day plan review
              and same-day inspections across South Florida's coastal corridor.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <MunicipalityMapHero />
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-muted-foreground mb-6">
            Full Registered List · {REGISTERED_MUNIS.length} Municipalities
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {REGISTERED_MUNIS.map((m) => (
              <div
                key={m.name}
                className="border rounded-sm p-4 bg-white flex items-start gap-3"
                style={{ borderColor: "rgba(21,49,87,0.15)" }}
              >
                <span
                  className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: "#153157" }}
                />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#153157" }}>
                    {m.name}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground mt-1">
                    {m.county} County
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
