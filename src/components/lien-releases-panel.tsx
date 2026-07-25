import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, FileText, Send, AlertTriangle, Stamp } from "lucide-react";
import {
  listLienReleases,
  syncFromSubs,
  requestLienRelease,
  sendLienReminder,
  setLienStatus,
  lienStatusBadge,
  LIEN_STATUS_ORDER,
  LIEN_STATUS_LABEL,
  allFiled,
  notifyOverdue,
  type LienRelease,
  type LienStatus,
} from "@/lib/lien-releases";
import type { PermitRow } from "@/lib/permits-api";
import { useSession } from "@/lib/use-session";

type Props = { permit: PermitRow };

const BIZ_DAY_MS = 24 * 60 * 60 * 1000;

function businessDaysSince(iso: string | null): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  const now = Date.now();
  let days = 0;
  for (let t = start; t < now; t += BIZ_DAY_MS) {
    const d = new Date(t).getDay();
    if (d !== 0 && d !== 6) days++;
  }
  return days;
}

export function LienReleasesPanel({ permit }: Props) {
  const { isAdmin } = useSession();
  const [rows, setRows] = useState<LienRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const synced = await syncFromSubs(
          permit.id,
          permit.tenant_id ?? null,
          (permit.subs ?? []).map((s: any, i: number) => ({
            key: s.accessToken || s.key || `${(s.company || "").toLowerCase()}::${i}`,
            company: s.company,
            trade: s.trade,
            email: s.email,
          })),
        );
        if (!cancelled) setRows(synced);
      } catch (e: any) {
        if (!cancelled) {
          try {
            const fallback = await listLienReleases(permit.id);
            setRows(fallback);
          } catch { toast.error(e?.message ?? "Could not load lien releases"); }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [permit.id]);

  async function refresh() {
    const list = await listLienReleases(permit.id);
    setRows(list);
  }

  async function onRequest(r: LienRelease) {
    setBusy(r.id);
    try {
      await requestLienRelease(r, permit.project_name, permit.job_address);
      toast.success(`Lien release request sent to ${r.sub_company}`);
      await refresh();
    } catch (e: any) { toast.error(e?.message ?? "Could not send request"); }
    finally { setBusy(null); }
  }

  async function onReminder(r: LienRelease) {
    setBusy(r.id);
    try {
      await sendLienReminder(r, permit.project_name);
      await notifyOverdue(r, permit.project_name, permit.id);
      toast.success(`Reminder sent to ${r.sub_company}`);
      await refresh();
    } catch (e: any) { toast.error(e?.message ?? "Could not send reminder"); }
    finally { setBusy(null); }
  }

  async function onSetStatus(r: LienRelease, next: LienStatus) {
    if (!isAdmin) return;
    setBusy(r.id);
    try {
      await setLienStatus(r.id, next);
      await refresh();
    } catch (e: any) { toast.error(e?.message ?? "Could not update status"); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="text-obsidian/60 text-sm p-6">Loading lien releases…</div>;

  const filed = allFiled(rows);
  const hasSubs = (permit.subs ?? []).length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[3px] border border-amber-500/40 bg-amber-50 p-4 text-xs text-amber-900 flex gap-2 items-start">
        <AlertTriangle className="w-4 h-4 mt-[2px] shrink-0" />
        <div>Lien releases must be signed, notarized, and filed before final payment is released to subcontractors. A project cannot be marked CO-ready until every release is <b>Filed</b>.</div>
      </div>

      {filed && (
        <div className="rounded-[3px] border border-emerald-600/40 bg-emerald-50 p-4 text-xs text-emerald-900 flex gap-2 items-center">
          <ShieldCheck className="w-4 h-4" />
          All subcontractor lien releases filed.
        </div>
      )}

      {!hasSubs && (
        <div className="text-sm text-obsidian/60 italic p-6 bg-white border border-obsidian/10 rounded-[3px]">
          Add subcontractors to this permit to track lien releases.
        </div>
      )}

      {rows.length > 0 && (
        <div className="border border-obsidian/10 rounded-[3px] overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-obsidian/5">
              <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60">
                <th className="px-4 py-3">Subcontractor</th>
                <th className="px-4 py-3">Trade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aging</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian/10">
              {rows.map((r) => {
                const b = lienStatusBadge(r.status);
                const daysOut = businessDaysSince(r.last_reminder_at ?? r.requested_at);
                const overdue = r.status === "requested" && daysOut >= 5;
                return (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-obsidian">{r.sub_company}</div>
                      {r.sub_email && <div className="text-[11px] text-obsidian/50">{r.sub_email}</div>}
                    </td>
                    <td className="px-4 py-3 text-obsidian/70">{r.trade ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[11px] font-mono uppercase tracking-[0.12em] ${b.className}`}>{b.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono tabular-nums">
                      {r.status === "not_requested" && <span className="text-obsidian/40">—</span>}
                      {r.status !== "not_requested" && (
                        <span className={overdue ? "text-red-800 font-semibold" : "text-obsidian/60"}>
                          {daysOut}d {overdue ? "· overdue" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {r.status === "not_requested" && (
                          <button disabled={busy === r.id} onClick={() => onRequest(r)}
                            className="inline-flex items-center gap-1 rounded-[3px] border border-obsidian bg-obsidian text-white px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] hover:bg-obsidian/90 disabled:opacity-50">
                            {busy === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Request
                          </button>
                        )}
                        {r.status === "requested" && (
                          <button disabled={busy === r.id} onClick={() => onReminder(r)}
                            className="inline-flex items-center gap-1 rounded-[3px] border border-obsidian/30 bg-white px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian hover:bg-obsidian/5 disabled:opacity-50">
                            {busy === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />} Send Reminder
                          </button>
                        )}
                        {(r.status === "signed" || r.status === "requested") && (
                          <button
                            className="inline-flex items-center gap-1 rounded-[3px] border border-indigo-500/40 bg-indigo-50 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.12em] text-indigo-800 hover:bg-indigo-100"
                            title="Remote notary integration coming soon"
                            onClick={() => toast.info("Remote notary integration coming soon.")}
                          >
                            <Stamp className="w-3 h-3" /> Complete with Remote Notary
                          </button>
                        )}
                        {isAdmin && (
                          <select
                            value={r.status}
                            onChange={(e) => onSetStatus(r, e.target.value as LienStatus)}
                            className="rounded-[3px] border border-obsidian/20 bg-white px-2 py-1 text-[11px] font-mono uppercase tracking-[0.10em]"
                          >
                            {LIEN_STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>{LIEN_STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      {r.status === "signed" && (
                        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.10em] text-amber-800 text-right">
                          Notarization required
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
