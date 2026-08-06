import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import {
  listAlerts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  severityBadge,
  ALERT_KIND_LABEL,
  type VictoriaAlert,
} from "@/lib/victoria-alerts";
import {
  PageShell,
  Panel,
  Segmented,
  StatusChip,
  EmptyState,
  TableShell,
  type MetricTone,
} from "@/components/ui-kit";

export const Route = createFileRoute("/portal/alerts")({
  head: () => ({
    meta: [
      { title: "Victoria Alerts — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AlertsPage,
});

const severityTone: Record<string, MetricTone> = {
  critical: "danger",
  warning: "warning",
  success: "success",
};

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

  const unreadCount = alerts.filter((a) => !a.acknowledged_at).length;

  return (
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Alerts" }]}
      title="Alerts"
      meta={loading ? "Loading…" : `${alerts.length} total · ${unreadCount} unread`}
      actions={
        <button onClick={onAckAll} className="p-btn p-btn-ghost">
          <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Mark all read
        </button>
      }
      toolbar={
        <>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="h-8 rounded-md border border-[var(--p-border)] bg-transparent px-2 text-[12px] text-foreground outline-none"
          >
            <option value="all">All types</option>
            {kinds.map((k) => <option key={k} value={k}>{ALERT_KIND_LABEL[k] ?? k}</option>)}
          </select>
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ]}
          />
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
              { value: "all", label: "All time" },
            ]}
          />
          <span className="ml-auto hidden text-[11.5px] text-muted-foreground sm:inline">
            {filtered.length} shown
          </span>
        </>
      }
    >
      {loading ? (
        <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Panel padded={false}>
          <EmptyState title="No alerts" description="No alerts match these filters." />
        </Panel>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th className="w-[1%]">Severity</th>
              <th>Alert</th>
              <th className="w-[160px]">Type</th>
              <th className="w-[160px]">Created</th>
              <th className="w-[1%]" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const tone = severityTone[a.severity] ?? "neutral";
              return (
                <tr key={a.id} className={a.acknowledged_at ? "opacity-60" : undefined}>
                  <td>
                    <StatusChip tone={tone}>{a.severity}</StatusChip>
                  </td>
                  <td className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium">{a.title}</div>
                    {a.body && (
                      <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{a.body}</div>
                    )}
                  </td>
                  <td className="text-[11.5px] text-muted-foreground">{ALERT_KIND_LABEL[a.kind] ?? a.kind}</td>
                  <td className="text-[11.5px] tabular-nums text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {a.action_url && (
                        <Link to={a.action_url} className="p-btn p-btn-quiet p-btn-sm">
                          View
                        </Link>
                      )}
                      {!a.acknowledged_at && (
                        <button disabled={busy === a.id} onClick={() => onAck(a.id)} className="p-btn p-btn-ghost p-btn-sm">
                          {busy === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Mark read
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </PageShell>
  );
}
