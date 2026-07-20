import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ChevronDown, Search, Eye, EyeOff, ArrowUpRight, AlertTriangle } from "lucide-react";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";
import { PROJECTS, fullAddress, isAddressIncomplete } from "@/lib/projects-data";
import { findPortalForAddress } from "@/lib/municipalities";
import { ExternalLink } from "lucide-react";
import { buildInspections, loadInspections, passedCount, POOL_INSPECTION_COUNT } from "@/lib/inspections";
import { totalForProject, fmtUsd } from "@/lib/manual-fees";

import { isPermitTypeComplete, permitTypeAnchor } from "@/lib/permit-type-status";

type Project = {
  id: string;
  name: string;
  address: string;
  county: string;
  status: string;
  updated_at: string;
  incomplete: boolean;
  permit_types: string[];
};

type GroupKey = "intake" | "preparing" | "submitted" | "on_hold" | "outsourced" | "issued" | "cancelled";

const GROUPS: Array<{ key: GroupKey; label: string; statuses: string[]; borderColor: string }> = [
  { key: "intake", label: "Intake", statuses: ["submitted"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "preparing", label: "Preparing Forms", statuses: ["in_review", "corrections_required", "correction_response_under_review"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "submitted", label: "Submitted", statuses: ["resubmitted_to_county", "resubmitted", "approved"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "on_hold", label: "On Hold", statuses: ["on_hold"], borderColor: "oklch(0.72 0.17 65)" },
  { key: "outsourced", label: "Outsourced Permitting", statuses: ["outsourced_permitting"], borderColor: "oklch(0.5 0.2 285)" },
  { key: "issued", label: "Issued", statuses: ["inspection_scheduled", "inspection_complete", "permit_issued"], borderColor: "oklch(0.58 0.16 150)" },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"], borderColor: "oklch(0.5 0.18 25)" },
];

const SEED: Project[] = PROJECTS.map((p) => ({
  id: p.id,
  name: p.name,
  address: fullAddress(p),
  county: p.county,
  status: p.status,
  updated_at: p.updated_at,
  incomplete: isAddressIncomplete(p),
  permit_types: p.permit_types,
}));

const COUNTIES = ["Palm Beach", "Martin", "St. Lucie", "Indian River", "Broward", "Miami-Dade"] as const;
type CountyFilter = "All" | (typeof COUNTIES)[number];

export function MyPermitsPage() {
  const [projects] = useState<Project[]>(SEED);
  const [query, setQuery] = useState("");
  const [countyFilter, setCountyFilter] = useState<CountyFilter>("All");
  const [hideCounts, setHideCounts] = useState(false);
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({
    intake: true, preparing: true, submitted: true, on_hold: true, outsourced: true, issued: true, cancelled: false,
  });
  const [inspectionCounts, setInspectionCounts] = useState<Record<string, number>>({});
  const [feeTotals, setFeeTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      if (!p.permit_types.some((t) => t.toLowerCase() === "pool")) continue;
      const seed = buildInspections(false);
      counts[p.id] = passedCount(loadInspections(p.id, seed));
    }
    setInspectionCounts(counts);

    const refreshTotals = () => {
      const t: Record<string, number> = {};
      for (const p of projects) t[p.id] = totalForProject(p.id);
      setFeeTotals(t);
    };
    refreshTotals();
    window.addEventListener("manual-fees:changed", refreshTotals);
    return () => window.removeEventListener("manual-fees:changed", refreshTotals);
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return projects.filter((p) => {
      if (countyFilter !== "All" && p.county !== countyFilter) return false;
      if (q && !`${p.name} ${p.address} ${p.county}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, query, countyFilter]);

  const countyCounts = useMemo(() => {
    const counts: Record<string, number> = { All: projects.length };
    for (const c of COUNTIES) counts[c] = projects.filter((p) => p.county === c).length;
    return counts;
  }, [projects]);

  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, items: filtered.filter((p) => g.statuses.includes(p.status)) })),
    [filtered],
  );

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">FL Statute 553.791 · Pipeline</div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">My Permits</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/portal/permits/new" className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
              + New Permit
            </Link>
            <button type="button" onClick={() => setHideCounts((v) => !v)} className="inline-flex items-center gap-2 border border-obsidian/20 bg-paper-warm px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian rounded-[3px]">
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

        <div className="mt-4 flex flex-wrap gap-2">
          {(["All", ...COUNTIES] as CountyFilter[]).map((c) => {
            const active = countyFilter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCountyFilter(c)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] rounded-[3px] border transition-colors ${
                  active ? "bg-obsidian text-paper border-obsidian" : "bg-white text-obsidian/70 border-obsidian/15 hover:border-obsidian/40 hover:text-obsidian"
                }`}
              >
                {c}
                <span className={`tabular-nums ${active ? "text-paper/70" : "text-obsidian/40"}`}>{countyCounts[c] ?? 0}</span>
              </button>
            );
          })}
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
                      const portal = findPortalForAddress(p.address);
                      return (
                        <li key={p.id} className="group relative flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-paper-warm/40 transition-colors">
                          <Link
                            to="/portal/projects/$id"
                            params={{ id: p.id }}
                            aria-label={`Open ${p.name}`}
                            className="absolute inset-0"
                          />
                          <div className="relative min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-obsidian truncate">{p.name}</div>
                              {p.incomplete && (
                                <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-50 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.1em] text-amber-700 rounded-[2px]">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  Address Incomplete
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-obsidian/55 truncate">{p.address}</div>
                          </div>
                          <div className="relative flex flex-wrap gap-1">
                            {p.permit_types.map((t) => {
                              const issued = p.status === "permit_issued";
                              const passed = inspectionCounts[p.id] ?? 0;
                              return (
                                <Link
                                  key={t}
                                  to="/portal/projects/$id"
                                  params={{ id: p.id }}
                                  title={issued ? `${t}: issued` : `${t}: in progress — click to view`}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] rounded-[2px] text-white transition-opacity hover:opacity-90 ${
                                    issued ? "bg-[#16a34a]" : "bg-[#dc2626]"
                                  }`}
                                >
                                  {t}
                                  <span className="tabular-nums opacity-90">
                                    {passed}/{POOL_INSPECTION_COUNT}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>

                          <span className="relative inline-flex items-center border border-obsidian/15 bg-paper-warm px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-obsidian/70 rounded-[2px]">
                            {p.county}
                          </span>
                          {feeTotals[p.id] > 0 && (
                            <span className="relative inline-flex items-center border border-emerald-600/30 bg-emerald-50 px-2 py-0.5 text-[10px] font-mono tabular-nums text-emerald-800 rounded-[2px]" title="Manually logged permit fees">
                              {fmtUsd(feeTotals[p.id])} in fees
                            </span>
                          )}
                          {meta && (
                            <span className={`relative inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                              {meta.label}
                            </span>
                          )}
                          <span className="relative w-28 shrink-0 text-right">
                            {portal?.url ? (
                              <a
                                href={portal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-sky-700 hover:text-sky-900"
                                title={`Open ${portal.name} portal`}
                              >
                                Open Portal <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                          </span>
                          <span className="relative font-mono text-[10px] tabular-nums text-obsidian/45 w-24 text-right shrink-0">{p.updated_at}</span>
                          <ArrowUpRight className="relative h-3.5 w-3.5 text-obsidian/40" />
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
