import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, FileText, ClipboardCheck, ArrowRight, ExternalLink } from "lucide-react";
import { PageShell, SearchInput } from "@/components/ui-kit";
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
  | "Structural, Hardscape & Outdoor Living";

const TRADE_ORDER: TradeKey[] = [
  "Pool / Spa Construction",
  "Electrical",
  "Plumbing",
  "Structural, Hardscape & Outdoor Living",
];

const TRADE_DESCRIPTIONS: Partial<Record<TradeKey, string>> = {
  "Structural, Hardscape & Outdoor Living":
    "Commonly permitted structures include pergolas, shade structures, outdoor kitchens, summer kitchens, fire features, retaining walls, and paver extensions.",
};

const STRUCTURAL_PLACEHOLDERS = [
  "Structural spec sheets for pergolas and shade structures — coming soon",
  "Outdoor kitchen and summer kitchen submittal requirements — coming soon",
  "Retaining wall structural details — coming soon",
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
  "Structural, Hardscape & Outdoor Living": [],
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
    <PageShell
      crumbs={[{ label: "Resources" }, { label: "Guides" }]}
      title="Project Guides & Building Specs"
      meta="Know what to submit. Know what we'll inspect."
      toolbar={
        <div className="p-inset min-w-0 flex-1 sm:max-w-sm">
          <SearchInput value={q} onChange={setQ} placeholder="Search project types" />
        </div>
      }
    >
      <div>
        {/* Cards */}
        <section>
          <div>
            {grouped.map(([category, list]) => (
              <div key={category} className="mb-6 last:mb-0">
                <div className="mb-2 flex items-baseline gap-2 px-1">
                  <h2 className="text-[12.5px] font-semibold tracking-[-0.01em]">{category}</h2>
                  <span className="text-[11.5px] tabular-nums text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((g) => (
                    <Link
                      key={g.slug}
                      to="/portal/guides/$slug"
                      params={{ slug: g.slug }}
                      className="p-plate p-hover-plate group flex min-w-0 flex-col px-3 py-2.5"
                    >
                      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                        {g.category}
                      </div>
                      <h3 className="mt-1 flex-1 text-[13px] font-medium leading-snug">
                        {g.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" strokeWidth={1.75} />
                          {g.docCount} docs
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" strokeWidth={1.75} />
                          {g.inspectionCount} insp
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 text-foreground">
                          View <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            {guides.length === 0 && (
              <div className="py-12 text-center text-[12px] text-muted-foreground">
                No guides match your search
              </div>
            )}
          </div>
        </section>

        {/* Building Specs by Trade */}
        <section className="mt-6">
          <div>
            <div className="mb-2 px-1">
              <h2 className="text-[12.5px] font-semibold tracking-[-0.01em]">
                Building Specs by Trade
              </h2>
              <p className="mt-0.5 max-w-2xl text-[11.5px] text-muted-foreground">
                Manufacturer specification sheets organized by permit trade. Open a section to view
                or download the PDFs.
              </p>
            </div>

            <Accordion type="multiple" className="p-plate divide-y divide-white/[0.06]">
              {TRADE_ORDER.map((trade) => {
                const list = SPECS_BY_TRADE[trade];
                return (
                  <AccordionItem key={trade} value={trade} className="border-none px-3">
                    <AccordionTrigger className="py-2.5 hover:no-underline">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12.5px] font-semibold tracking-[-0.01em]">{trade}</span>
                        <span className="text-[11.5px] tabular-nums text-muted-foreground">
                          {list.length} {list.length === 1 ? "spec" : "specs"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3">
                      {TRADE_DESCRIPTIONS[trade] && (
                        <div className="p-surface-flat mb-2 px-3 py-2 text-[12px] text-muted-foreground">
                          {TRADE_DESCRIPTIONS[trade]}
                        </div>
                      )}
                      {trade === "Pool / Spa Construction" && list.length > 0 && (
                        <div className="p-surface-flat mb-2 px-3 py-2 text-[12px] text-muted-foreground">
                          These manufacturer specification sheets are commonly required for pool construction permit submittals. Include relevant specs with your submittal package.
                        </div>
                      )}
                      {list.length === 0 ? (
                        trade === "Structural, Hardscape & Outdoor Living" ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {STRUCTURAL_PLACEHOLDERS.map((label) => (
                              <div
                                key={label}
                                className="p-surface-flat flex items-start gap-2 px-3 py-2.5"
                              >
                                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                                <div className="text-[12px] leading-relaxed text-muted-foreground">
                                  {label}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-surface-flat p-6 text-center">
                            <FileText className="mx-auto h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                            <div className="mt-2 text-[12px] text-muted-foreground">
                              {trade === "Electrical" && "Electrical spec sheets coming soon"}
                              {trade === "Plumbing" && "Plumbing spec sheets coming soon"}
                              {trade === "Pool / Spa Construction" && "No specs uploaded yet"}
                            </div>
                          </div>
                        )
                      ) : (

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {list.map((s) => (
                            <a
                              key={s.url}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-plate p-hover-plate group flex items-start gap-2 px-3 py-2.5"
                            >
                              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                              <div className="min-w-0 flex-1">
                                <div className="text-[12.5px] leading-snug">{s.title}</div>
                                <div className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                                  Manufacturer spec sheet
                                </div>
                                <div className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground group-hover:text-foreground">
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
    </PageShell>
  );
}
