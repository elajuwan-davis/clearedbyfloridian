import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Input } from "@/components/ui/input";
import { Search, FileText, ClipboardCheck, ArrowRight } from "lucide-react";
import { PORTAL_GUIDES, PORTAL_GUIDE_CATEGORIES } from "@/lib/portal-guides-data";

export const Route = createFileRoute("/portal/guides/")({
  head: () => ({
    meta: [
      { title: "Project Guides — Cleared by Flōridian" },
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
    <PortalShell>
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
              Project Guides
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
      </div>
    </PortalShell>
  );
}
