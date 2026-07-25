import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, FileText, ClipboardCheck, ArrowRight, ExternalLink } from "lucide-react";
import { PORTAL_GUIDES, PORTAL_GUIDE_CATEGORIES } from "@/lib/portal-guides-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EQUIPMENT_SPECS } from "@/components/equipment-library-dialog";

type TradeKey =
  | "Pool / Spa Construction"
  | "Electrical"
  | "Plumbing"
  | "Structural / Hardscape";

const TRADE_ORDER: TradeKey[] = [
  "Pool / Spa Construction",
  "Electrical",
  "Plumbing",
  "Structural / Hardscape",
];

function tradeFor(title: string): TradeKey {
  const t = title.toLowerCase();
  if (/(heater|pump|filter|blower|automation|truclear|heat pump|pool alarm|nicheless|light)/.test(t))
    return "Pool / Spa Construction";
  if (/(light|automation|alarm|epump|e-pump)/.test(t)) return "Electrical";
  if (/(pump|filter|plumb)/.test(t)) return "Plumbing";
  return "Pool / Spa Construction";
}

const SPECS_BY_TRADE: Record<TradeKey, { title: string; url: string }[]> = {
  "Pool / Spa Construction": [],
  Electrical: [],
  Plumbing: [],
  "Structural / Hardscape": [],
};
for (const s of EQUIPMENT_SPECS) SPECS_BY_TRADE[tradeFor(s.title)].push(s);

export const Route = createFileRoute("/portal/guides/")({
  head: () => ({
    meta: [
      { title: "Project Guides & Building Specs — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalGuidesIndex,
});


function PortalGuidesIndex() {
  const [q, setQ] = useState("");
  const guides = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return PORTAL_GUIDES;
    return PORTAL_GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(n) ||
        g.category.toLowerCase().includes(n) ||
        g.summary.toLowerCase().includes(n),
    );
  }, [q]);

  const grouped = useMemo(() => {
    return PORTAL_GUIDE_CATEGORIES.map(
      (cat) => [cat, guides.filter((g) => g.category === cat)] as const,
    ).filter(([, list]) => list.length > 0);
  }, [guides]);

  return (
    <>
      <div className="-mx-4 sm:-mx-6 md:-mx-8 -mt-6 md:-mt-10">
        {/* Obsidian header */}
        <section
          className="px-4 sm:px-6 md:px-10 py-14 md:py-20 text-paper"
          style={{ backgroundColor: "var(--obsidian)" }}
        >
          <div className="mx-auto max-w-6xl">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.22em]"
              style={{ color: "var(--sky)" }}
            >
              Reference / Florida Permit Library
            </div>
            <h1 className="display-serif mt-4 text-4xl md:text-5xl leading-tight">
              Project Guides &amp; Building Specs
            </h1>

            <p
              className="mt-3 text-lg md:text-xl"
              style={{ color: "color-mix(in oklab, var(--paper) 75%, transparent)" }}
            >
              Know what to submit. Know what we'll inspect.
            </p>
            <p
              className="mt-2 max-w-2xl text-sm md:text-base leading-relaxed"
              style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}
            >
              A printable reference for every project type Flōridian permits. Find your
              project below.
            </p>

            <div className="mt-8 max-w-xl relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
                strokeWidth={1.5}
                style={{ color: "color-mix(in oklab, var(--paper) 50%, transparent)" }}
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search project types…"
                className="rounded-[3px] h-12 pl-11 bg-white/10 border-white/20 text-paper placeholder:text-paper/50 focus-visible:border-white/40"
              />
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="px-4 sm:px-6 md:px-10 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            {grouped.map(([category, list]) => (
              <div key={category} className="mb-12 last:mb-0">
                <div className="flex items-baseline gap-3 mb-6">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}
                  >
                    Category
                  </span>
                  <h2 className="display-serif text-2xl text-obsidian">{category}</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((g) => (
                    <Link
                      key={g.slug}
                      to="/portal/guides/$slug"
                      params={{ slug: g.slug }}
                      className="group flex flex-col bg-white border border-obsidian/12 rounded-[3px] p-6 hover:border-obsidian/40 transition-colors"
                    >
                      <div
                        className="font-mono text-[9px] uppercase tracking-[0.22em] mb-3"
                        style={{ color: "var(--sky-ink, #2b6a86)" }}
                      >
                        {g.category}
                      </div>
                      <h3 className="display-serif text-xl leading-tight text-obsidian flex-1">
                        {g.title}
                      </h3>
                      <div className="mt-5 pt-4 border-t border-obsidian/10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/60">
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Docs {g.docCount}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Insp {g.inspectionCount}
                        </span>
                      </div>
                      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-obsidian group-hover:gap-2.5 transition-all">
                        View <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {guides.length === 0 && (
              <div className="text-center py-16 font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/50">
                No guides match your search
              </div>
            )}
          </div>
        </section>

        {/* Building Specs by Trade */}
        <section className="px-4 sm:px-6 md:px-10 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.22em]"
                style={{ color: "color-mix(in oklab, var(--obsidian) 55%, transparent)" }}
              >
                Reference
              </span>
              <h2 className="display-serif text-2xl text-obsidian">Building Specs by Trade</h2>
            </div>
            <p className="text-sm text-obsidian/70 max-w-2xl mb-6">
              Manufacturer specification sheets organized by permit trade. Open a section to view or download the PDFs.
            </p>

            <Accordion type="multiple" className="bg-white border border-obsidian/12 rounded-[3px] divide-y divide-obsidian/10">
              {TRADE_ORDER.map((trade) => {
                const list = SPECS_BY_TRADE[trade];
                return (
                  <AccordionItem key={trade} value={trade} className="border-none px-5">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-baseline gap-3">
                        <span className="display-serif text-lg text-obsidian">{trade}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">
                          {list.length} {list.length === 1 ? "spec" : "specs"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5">
                      {list.length === 0 ? (
                        <div className="border border-dashed border-obsidian/15 rounded-[3px] p-6 text-center">
                          <FileText className="mx-auto h-5 w-5 text-obsidian/40" strokeWidth={1.5} />
                          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/50">
                            No specs uploaded yet
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {list.map((s) => (
                            <a
                              key={s.url}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-start gap-3 border border-obsidian/12 rounded-[3px] p-4 hover:border-obsidian/40 transition-colors bg-white"
                            >
                              <div className="rounded-[3px] border border-obsidian/15 bg-paper p-1.5 shrink-0">
                                <FileText className="h-4 w-4 text-obsidian/70" strokeWidth={1.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-obsidian leading-snug">{s.title}</div>
                                <div className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/55 group-hover:text-obsidian">
                                  Open <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </section>

      </div>
    </>
  );
}
