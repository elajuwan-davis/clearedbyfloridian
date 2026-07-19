import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ChevronDown, Search, Eye, EyeOff, ArrowUpRight } from "lucide-react";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";
import { PROJECTS, fullAddress } from "@/lib/projects-data";

export const Route = createFileRoute("/my-permits")({
  head: () => ({
    meta: [
      { title: "My Permits — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyPermitsPage,
});

type Project = {
  id: string;
  name: string;
  address: string;
  county: string;
  status: string;
  updated_at: string;
};

type GroupKey = "intake" | "preparing" | "submitted" | "issued" | "cancelled";

const GROUPS: Array<{
  key: GroupKey;
  label: string;
  statuses: string[];
  borderColor: string;
}> = [
  { key: "intake", label: "Intake", statuses: ["submitted"], borderColor: "oklch(0.78 0.13 75)" },
  {
    key: "preparing",
    label: "Preparing Forms",
    statuses: ["in_review", "corrections_required", "correction_response_under_review"],
    borderColor: "oklch(0.78 0.13 75)",
  },
  {
    key: "submitted",
    label: "Submitted",
    statuses: ["resubmitted_to_county", "approved"],
    borderColor: "oklch(0.78 0.13 75)",
  },
  {
    key: "issued",
    label: "Issued",
    statuses: ["inspection_scheduled", "inspection_complete", "permit_issued"],
    borderColor: "oklch(0.58 0.16 150)",
  },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"], borderColor: "oklch(0.5 0.18 25)" },
];

const SEED: Project[] = PROJECTS.map((p) => ({
  id: p.id,
  name: p.name,
  address: fullAddress(p),
  county: p.county,
  status: p.status,
  updated_at: p.updated_at,
}));

function MyPermitsPage() {
  const [projects] = useState<Project[]>(SEED);
  const [query, setQuery] = useState("");
  const [hideCounts, setHideCounts] = useState(false);
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({
    intake: true,
    preparing: true,
    submitted: true,
    issued: true,
    cancelled: false,
  });


  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter((p) => `${p.name} ${p.address} ${p.county}`.toLowerCase().includes(q));
  }, [projects, query]);

  const grouped = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      items: filtered.filter((p) => g.statuses.includes(p.status)),
    }));
  }, [filtered]);

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">FL Statute 553.791 · Pipeline</div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">My Permits</h1>
          </div>
          <div className="flex items-center gap-2">
          <Link
            to="/portal/permits/new"
            className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
          >
            + New Permit
          </Link>
          <button
            type="button"
            onClick={() => setHideCounts((v) => !v)}
            className="inline-flex items-center gap-2 border border-obsidian/20 bg-paper-warm px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian rounded-[3px]"
          >
            {hideCounts ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {hideCounts ? "Show counts" : "Hide counts"}
          </button>
          </div>
        </div>

        <div className="mt-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by project, address, or county…"
            className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]"
          />
        </div>

        <div className="mt-8 space-y-4">
          {grouped.map((g) => (
            <div key={g.key} className="bg-white border border-obsidian/10" style={{ borderLeftWidth: "3px", borderLeftColor: g.borderColor }}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-paper-warm/50 transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-obsidian/40 transition-transform ${open[g.key] ? "rotate-180" : ""}`} />
                <span className="font-subline text-sm font-bold uppercase tracking-[0.14em] text-obsidian">{g.label}</span>
                {!hideCounts && (
                  <span className="ml-auto font-mono text-[11px] tabular-nums text-obsidian/55 border border-obsidian/15 px-2 py-0.5 rounded-[2px]">
                    {g.items.length}
                  </span>
                )}
              </button>
              {open[g.key] && (
                <ul className="border-t border-obsidian/10 divide-y divide-obsidian/5">
                  {g.items.length === 0 ? (
                    <li className="px-5 py-6 text-center text-sm text-obsidian/45">No permits in this stage.</li>
                  ) : (
                    g.items.map((p) => {
                      const meta = projectStatusMeta[p.status as keyof typeof projectStatusMeta];
                      return (
                        <li key={p.id}>
                          <Link
                            to="/projects/$id"
                            params={{ id: p.id }}
                            className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-paper-warm/40 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-obsidian truncate">{p.name}</div>
                              <div className="mt-0.5 text-xs text-obsidian/55 truncate">{p.address} · {p.county}</div>
                            </div>
                            {meta && (
                              <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                                {meta.label}
                              </span>
                            )}
                            <span className="font-mono text-[10px] tabular-nums text-obsidian/45 w-24 text-right shrink-0">{p.updated_at}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-obsidian/40" />
                          </Link>
                        </li>
                      );
                    })
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
