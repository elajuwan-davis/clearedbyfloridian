import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ChevronDown, Search, AlertTriangle, Plus, FileText, RefreshCw } from "lucide-react";
import { listPermits, permitCompleteness, type PermitRow, type PermitStatus } from "@/lib/permits-api";
import { syncAllPermits, getLastRun, formatRelative } from "@/lib/permit-sync";

type GroupKey = "intake" | "preparing" | "submitted" | "on_hold" | "outsourced" | "issued" | "cancelled";

const GROUPS: Array<{ key: GroupKey; label: string; statuses: PermitStatus[]; borderColor: string }> = [
  { key: "intake", label: "Intake", statuses: ["submitted"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "preparing", label: "Preparing Forms", statuses: ["in_review", "corrections_required"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "submitted", label: "Submitted / Approved", statuses: ["approved"], borderColor: "oklch(0.78 0.13 75)" },
  { key: "on_hold", label: "On Hold", statuses: ["on_hold"], borderColor: "oklch(0.72 0.17 65)" },
  { key: "outsourced", label: "Outsourced Permitting", statuses: ["outsourced_permitting"], borderColor: "oklch(0.5 0.2 285)" },
  { key: "issued", label: "Issued", statuses: ["permit_issued"], borderColor: "oklch(0.58 0.16 150)" },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"], borderColor: "oklch(0.5 0.18 25)" },
];

const STATUS_LABEL: Record<PermitStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  corrections_required: "Corrections",
  approved: "Approved",
  permit_issued: "Issued",
  on_hold: "On Hold",
  outsourced_permitting: "Outsourced",
  cancelled: "Cancelled",
};

export function MyPermitsPage() {
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({
    intake: true, preparing: true, submitted: true, on_hold: true, outsourced: true, issued: true, cancelled: false,
  });

  async function refresh() {
    setLoading(true);
    try {
      const rows = await listPermits();
      setPermits(rows);
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return permits;
    return permits.filter((p) => `${p.project_name} ${p.job_address} ${p.county ?? ""} ${p.municipality ?? ""}`.toLowerCase().includes(q));
  }, [permits, query]);

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
            <p className="mt-2 text-[12px] text-obsidian/55">{loading ? "Loading…" : `${permits.length} permit${permits.length === 1 ? "" : "s"} on file`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian hover:bg-paper-warm rounded-[3px]">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link to="/portal/permits/new" className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
              <Plus className="h-3.5 w-3.5" /> New Permit
            </Link>
          </div>
        </div>

        <div className="mt-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-obsidian/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by project, address, county…" className="block w-full border border-obsidian/15 bg-white pl-9 pr-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]" />
        </div>

        {permits.length === 0 && !loading && (
          <div className="mt-10 border border-dashed border-obsidian/20 rounded-[3px] p-12 text-center">
            <FileText className="h-8 w-8 mx-auto text-obsidian/30" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-obsidian/60">No permits yet. Create your first one.</p>
            <Link to="/portal/permits/new" className="mt-4 inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]">
              <Plus className="h-3.5 w-3.5" /> New Permit
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {grouped.map((g) => (
            <div key={g.key} className="bg-white border border-obsidian/10" style={{ borderLeftWidth: "3px", borderLeftColor: g.borderColor }}>
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-paper-warm/50">
                <ChevronDown className={`h-4 w-4 text-obsidian/40 transition-transform ${open[g.key] ? "rotate-180" : ""}`} />
                <span className="font-subline text-sm font-bold uppercase tracking-[0.14em] text-obsidian">{g.label}</span>
                <span className="ml-auto font-mono text-[11px] tabular-nums text-obsidian/55 border border-obsidian/15 px-2 py-0.5 rounded-[2px]">{g.items.length}</span>
              </button>
              {open[g.key] && (
                <ul className="border-t border-obsidian/10 divide-y divide-obsidian/5">
                  {g.items.length === 0 ? (
                    <li className="px-5 py-6 text-center text-sm text-obsidian/45">No permits in this stage.</li>
                  ) : (
                    g.items.map((p) => {
                      const c = permitCompleteness(p);
                      const issued = p.status === "permit_issued";
                      const barColor = c.percent === 100 ? "#16a34a" : c.percent >= 60 ? "#153157" : c.percent >= 30 ? "#d97706" : "#dc2626";
                      return (
                        <li key={p.id}>
                          <Link to="/portal/permits/$id" params={{ id: p.id }} className="block px-5 py-4 hover:bg-paper-warm/40">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-sm font-medium text-obsidian truncate">{p.project_name}</div>
                                  {c.missingFields.length > 0 && (
                                    <span className="inline-flex items-center gap-1 border border-red-500/40 bg-red-50 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.1em] text-red-700 rounded-[2px]">
                                      <AlertTriangle className="h-2.5 w-2.5" /> {c.missingFields.length} field{c.missingFields.length === 1 ? "" : "s"}
                                    </span>
                                  )}
                                  {c.missingDocs.length > 0 && (
                                    <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-50 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.1em] text-amber-700 rounded-[2px]">
                                      <FileText className="h-2.5 w-2.5" /> {c.missingDocs.length} doc{c.missingDocs.length === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 text-xs text-obsidian/55 truncate">{p.job_address}</div>
                              </div>
                              {p.permit_type && (
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] rounded-[2px] text-white ${issued ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}>
                                  {p.permit_type}
                                </span>
                              )}
                              {p.municipality && (
                                <span className="inline-flex items-center border border-obsidian/15 bg-paper-warm px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] text-obsidian/70 rounded-[2px]">
                                  {p.municipality}
                                </span>
                              )}
                              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian/70 border border-obsidian/15 px-2 py-0.5 rounded-[2px]">
                                {STATUS_LABEL[p.status]}
                              </span>
                              <span className="font-mono text-[10px] tabular-nums text-obsidian/45 w-24 text-right shrink-0">{new Date(p.updated_at).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-obsidian/10 rounded-full overflow-hidden">
                                <div className="h-full transition-all" style={{ width: `${c.percent}%`, background: barColor }} />
                              </div>
                              <span className="font-mono text-[10px] tabular-nums text-obsidian/60 shrink-0">
                                {c.done}/{c.total} · {c.percent}%
                              </span>
                            </div>
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
