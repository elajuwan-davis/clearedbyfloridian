import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, AlertTriangle, FileText, ClipboardCheck, BookOpen } from "lucide-react";
import { GUIDES as BASE_GUIDES, TRADES, CATEGORIES, type Guide } from "@/lib/project-guides-data";
import { GUIDES_EXTRA } from "@/lib/project-guides-extras";

const GUIDES: Guide[] = [...BASE_GUIDES, ...GUIDES_EXTRA];

export const Route = createFileRoute("/project-guides")({
  head: () => ({ meta: [{ title: "Project Guides — Cleard" }, { name: "robots", content: "noindex" }] }),
  component: ProjectGuidesPage,
});

function ProjectGuidesPage() {
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [active, setActive] = useState<Guide | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GUIDES.filter((g) => {
      if (trade !== "all" && g.trade !== trade) return false;
      if (cat !== "all" && g.category !== cat) return false;
      if (!needle) return true;
      return (
        g.title.toLowerCase().includes(needle) ||
        g.excerpt.toLowerCase().includes(needle) ||
        g.trade.toLowerCase().includes(needle)
      );
    });
  }, [q, trade, cat]);

  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Reference / Florida Permit Library</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">Project Guides</h1>
          <p className="mt-3 text-sm text-obsidian/70 max-w-2xl">
            Florida-specific document, inspection, and code requirements for every project type Cleard permits.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_180px_180px_auto] items-end">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 block mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-obsidian/40" strokeWidth={1.5} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search guides…"
                className="rounded-[3px] pl-9"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 block mb-1.5">Trade</label>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trades</SelectItem>
                {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 block mb-1.5">Category</label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/55 pb-2.5 sm:text-right">
            {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
          </div>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <article
              key={g.id}
              className="group flex flex-col border border-obsidian/12 bg-paper-warm rounded-[3px] p-5 hover:border-obsidian/30 transition-colors"
            >
              <div className="flex flex-wrap gap-1.5">
                <Tag variant="trade">{g.trade}</Tag>
                <Tag variant="cat">{g.category}</Tag>
              </div>
              <h3 className="display-serif text-xl text-obsidian mt-3 leading-tight">{g.title}</h3>
              <p className="mt-2 text-sm text-obsidian/70 leading-relaxed line-clamp-3 flex-1">{g.excerpt}</p>
              <Button
                variant="outline"
                className="rounded-[3px] mt-4 self-start"
                onClick={() => setActive(g)}
              >
                View Details
              </Button>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-obsidian/55 font-mono uppercase tracking-[0.14em]">
              No guides match your filters
            </div>
          )}
        </div>
      </div>

      <GuideDialog guide={active} onClose={() => setActive(null)} />
    </PortalShell>
  );
}

function Tag({ children, variant }: { children: React.ReactNode; variant: "trade" | "cat" }) {
  const isTrade = variant === "trade";
  return (
    <span
      className="inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] rounded-[2px] border"
      style={
        isTrade
          ? { color: "var(--sky)", borderColor: "color-mix(in oklab, var(--sky) 30%, transparent)", backgroundColor: "color-mix(in oklab, var(--sky) 8%, transparent)" }
          : { color: "var(--oxblood)", borderColor: "color-mix(in oklab, var(--oxblood) 30%, transparent)", backgroundColor: "color-mix(in oklab, var(--oxblood) 6%, transparent)" }
      }
    >
      {children}
    </span>
  );
}

function GuideDialog({ guide, onClose }: { guide: Guide | null; onClose: () => void }) {
  return (
    <Dialog open={!!guide} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3px]">
        {guide && (
          <>
            <DialogHeader className="border-b border-obsidian/10 pb-4">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Tag variant="trade">{guide.trade}</Tag>
                <Tag variant="cat">{guide.category}</Tag>
              </div>
              <DialogTitle className="display-serif text-3xl text-obsidian text-left leading-tight">
                {guide.title}
              </DialogTitle>
              <DialogDescription className="text-left text-obsidian/70 text-sm leading-relaxed pt-1">
                {guide.excerpt}
              </DialogDescription>
            </DialogHeader>

            {/* 1. Required Documents */}
            <Section icon={FileText} eyebrow="01" title="Required Documents">
              <ul className="space-y-3">
                {guide.documents.map((d) => (
                  <li key={d.name} className="flex gap-3">
                    <StatusBadge status={d.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-obsidian">{d.name}</div>
                      <div className="text-sm text-obsidian/65 leading-relaxed mt-0.5">{d.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            {/* 2. Required Inspections */}
            <Section icon={ClipboardCheck} eyebrow="02" title="Required Inspections">
              <ol className="space-y-3">
                {guide.inspections.map((i, idx) => (
                  <li key={i.name} className="flex gap-3">
                    <span className="font-mono text-[11px] text-obsidian/45 mt-0.5 w-6 shrink-0">{String(idx + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-obsidian">{i.name}</div>
                      <div className="text-sm text-obsidian/65 leading-relaxed mt-0.5">{i.confirm}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            {/* 3. Code References */}
            <Section icon={BookOpen} eyebrow="03" title="Code References">
              <ul className="space-y-2 list-disc pl-5">
                {guide.codes.map((c) => (
                  <li key={c} className="text-sm text-obsidian/75 leading-relaxed">{c}</li>
                ))}
              </ul>
            </Section>

            {/* 4. Common Pitfalls */}
            <Section icon={AlertTriangle} eyebrow="04" title="Common Pitfalls">
              <ul className="space-y-2.5">
                {guide.pitfalls.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-obsidian/80 leading-relaxed">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-oxblood" strokeWidth={1.75} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof FileText;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <div className="flex items-baseline gap-3 mb-4">
        <Icon className="h-4 w-4 text-obsidian/55 self-center" strokeWidth={1.5} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/45">{eyebrow}</span>
        <h2 className="display-serif text-xl text-obsidian">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: "Required" | "Conditional" }) {
  const isReq = status === "Required";
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] rounded-[2px] border h-fit mt-0.5"
      style={
        isReq
          ? { color: "oklch(0.45 0.14 145)", borderColor: "oklch(0.62 0.14 145 / 0.4)", backgroundColor: "oklch(0.62 0.14 145 / 0.1)" }
          : { color: "oklch(0.48 0.13 70)", borderColor: "oklch(0.65 0.14 70 / 0.45)", backgroundColor: "oklch(0.7 0.14 70 / 0.12)" }
      }
    >
      {status}
    </span>
  );
}
