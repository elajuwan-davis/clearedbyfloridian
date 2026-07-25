import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BellRing, Check, CheckCheck, Filter, Loader2 } from "lucide-react";
import {
  listAlerts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  severityBadge,
  ALERT_KIND_LABEL,
  type VictoriaAlert,
} from "@/lib/victoria-alerts";

export const Route = createFileRoute("/portal/alerts")({
  head: () => ({
    meta: [
      { title: "Victoria Alerts — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const [alerts, setAlerts] = useState<VictoriaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [kind, setKind] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  async function load() {
    setLoading(true);
    try {
      const rows = await listAlerts({ limit: 300 });
      setAlerts(rows);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = range === "7d" ? now - 7 * 864e5 : range === "30d" ? now - 30 * 864e5 : 0;
    return alerts.filter((a) => {
      if (kind !== "all" && a.kind !== kind) return false;
      if (status === "unread" && a.acknowledged_at) return false;
      if (status === "read" && !a.acknowledged_at) return false;
      if (cutoff && new Date(a.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [alerts, kind, status, range]);

  const kinds = useMemo(() => {
    const s = new Set(alerts.map((a) => a.kind));
    return Array.from(s);
  }, [alerts]);

  async function onAck(id: string) {
    setBusy(id);
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a)));
    } finally { setBusy(null); }
  }

  async function onAckAll() {
    try {
      await acknowledgeAllAlerts();
      await load();
      toast.success("All alerts marked read");
    } catch (e: any) { toast.error(e?.message ?? "Could not mark all read"); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-6">
        <div>
          <div className="eyebrow text-obsidian/50 flex items-center gap-2"><BellRing className="w-3 h-3" /> Victoria</div>
          <h1 className="display-serif text-3xl mt-1">Alerts</h1>
          <p className="mt-1 text-sm text-obsidian/60">Proactive notices from Victoria across every active permit.</p>
        </div>
        <button
          onClick={onAckAll}
          className="inline-flex items-center gap-2 rounded-[3px] border border-obsidian/20 bg-white px-3 py-2 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian hover:bg-obsidian/5"
        >
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/50">
          <Filter className="w-3 h-3" /> Filters
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-[3px] border border-obsidian/20 bg-white px-2 py-1 text-xs">
          <option value="all">All types</option>
          {kinds.map((k) => <option key={k} value={k}>{ALERT_KIND_LABEL[k] ?? k}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded-[3px] border border-obsidian/20 bg-white px-2 py-1 text-xs">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <select value={range} onChange={(e) => setRange(e.target.value as any)} className="rounded-[3px] border border-obsidian/20 bg-white px-2 py-1 text-xs">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <div className="text-sm text-obsidian/50 p-6">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="bg-white border border-obsidian/10 rounded-[3px] p-10 text-center text-obsidian/50 text-sm">
            No alerts match these filters.
          </div>
        )}
        {filtered.map((a) => {
          const b = severityBadge(a.severity);
          return (
            <div key={a.id} className={`rounded-[3px] border p-4 ${a.acknowledged_at ? "bg-white border-obsidian/10 opacity-70" : b.className}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 w-2 h-2 rounded-full ${b.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <div className="text-sm font-medium text-obsidian">{a.title}</div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">
                      {ALERT_KIND_LABEL[a.kind] ?? a.kind} · {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  {a.body && <div className="mt-1 text-sm text-obsidian/70">{a.body}</div>}
                  <div className="mt-2 flex items-center gap-3">
                    {a.action_url && (
                      <Link to={a.action_url} className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian underline underline-offset-4">
                        View
                      </Link>
                    )}
                    {!a.acknowledged_at && (
                      <button disabled={busy === a.id} onClick={() => onAck(a.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/70 hover:text-obsidian">
                        {busy === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
