import { useEffect, useState } from "react";
import { listAlerts, acknowledgeAlert, severityBadge, ALERT_KIND_LABEL, type VictoriaAlert } from "@/lib/victoria-alerts";
import { Check, Loader2 } from "lucide-react";

export function PermitAlertsInline({ permitId }: { permitId: string }) {
  const [alerts, setAlerts] = useState<VictoriaAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await listAlerts({ permitId, limit: 25 });
        if (!cancelled) setAlerts(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [permitId]);

  async function onAck(id: string) {
    setBusy(id);
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged_at: new Date().toISOString() } : a)));
    } finally { setBusy(null); }
  }

  if (loading) return <div className="text-sm text-obsidian/50 p-4">Loading alerts…</div>;
  if (alerts.length === 0) return (
    <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 text-sm text-obsidian/50 italic">
      No Victoria alerts on this permit yet. She'll flag stale reviews, new municipality requirements, and upcoming inspections as they happen.
    </div>
  );

  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const b = severityBadge(a.severity);
        return (
          <div key={a.id} className={`rounded-[3px] border p-3 ${a.acknowledged_at ? "bg-white border-obsidian/10 opacity-70" : b.className}`}>
            <div className="flex items-start gap-2">
              <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${b.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <div className="text-sm font-medium text-obsidian">{a.title}</div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">
                    {ALERT_KIND_LABEL[a.kind] ?? a.kind} · {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
                {a.body && <div className="mt-1 text-xs text-obsidian/70">{a.body}</div>}
                {!a.acknowledged_at && (
                  <button disabled={busy === a.id} onClick={() => onAck(a.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/70 hover:text-obsidian">
                    {busy === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Mark read
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
