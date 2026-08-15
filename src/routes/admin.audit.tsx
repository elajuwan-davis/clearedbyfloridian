import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { PortalShell } from "@/components/portal-shell";
import { listAudit, toCsv, type AuditAction, type AuditEvent } from "@/lib/audit-log";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail · Admin — Cleard" },
      { name: "description", content: "Read-only global audit trail of project, document, fee and permit events across the Cleard portal." },
      { property: "og:title", content: "Audit Trail · Admin — Cleard" },
      { property: "og:description", content: "Read-only global audit trail of project, document, fee and permit events across the Cleard portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState<"all" | AuditAction>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listAudit({ limit: 1000 });
    setEvents(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const on = () => { void load(); };
    window.addEventListener("audit-log:changed", on);
    return () => window.removeEventListener("audit-log:changed", on);
  }, [load]);

  const actors = useMemo(() => Array.from(new Set(events.map((e) => e.actor))).sort(), [events]);
  const actions = useMemo(() => Array.from(new Set(events.map((e) => e.action))).sort(), [events]);
  const projects = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of events) {
      if (e.projectId) map.set(e.projectId, e.record || e.projectId);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (projectFilter !== "all" && e.projectId !== projectFilter) return false;
      if (userFilter !== "all" && e.actor !== userFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (from && new Date(e.ts) < new Date(from)) return false;
      if (to && new Date(e.ts) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [events, projectFilter, userFilter, actionFilter, from, to]);

  function exportCsv() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleared-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="label-eyebrow text-obsidian/50">Admin · Internal Ops</div>
        <h1 className="display-serif mt-2 text-4xl leading-tight text-obsidian">Audit Trail</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Read-only, append-only log of activity across all Cleard projects (activity_events).
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="min-h-[44px] rounded-[3px] border border-obsidian/20 bg-white px-3 text-sm">
            <option value="all">All projects</option>
            {projects.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="min-h-[44px] rounded-[3px] border border-obsidian/20 bg-white px-3 text-sm">
            <option value="all">All users</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as any)} className="min-h-[44px] rounded-[3px] border border-obsidian/20 bg-white px-3 text-sm">
            <option value="all">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{String(a).replace(/[._]/g, " ")}</option>)}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="min-h-[44px] rounded-[3px] border border-obsidian/20 bg-white px-3 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="min-h-[44px] rounded-[3px] border border-obsidian/20 bg-white px-3 text-sm" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
            {loading ? "Loading…" : `${filtered.length} events`}
          </span>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[3px] border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian hover:bg-paper-warm"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[3px] border border-border">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-paper-warm text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Record / Project</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-obsidian/45">No matching events.</td></tr>
              ) : filtered.slice(0, 500).map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 font-mono text-[11px] tabular-nums text-obsidian/60 whitespace-nowrap">{new Date(e.ts).toLocaleString()}</td>
                  <td className="px-4 py-3 text-obsidian/80 whitespace-nowrap">{e.actor}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-[3px] border border-obsidian/15 bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-obsidian/70">
                      {String(e.action).replace(/[._]/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-obsidian/80">
                    <div>{e.record}</div>
                    {e.details && <div className="mt-0.5 text-xs text-obsidian/50">{e.details}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
