import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { X, Trophy, Zap, Award, Printer, Plus, Trash2, Sparkles } from "lucide-react";
import { listSubs, coiLifecycle, type SubRow } from "@/lib/subs-api";
import { updatePermit, type PermitRow } from "@/lib/permits-api";

type BidEntry = {
  key: string;
  sub_id: string | null;         // links to subcontractors row when picked
  company_name: string;
  trade: string;
  bid_cents: number | null;
  timeline_days: number | null;
  license_status: "active" | "expired" | "unknown";
  coi_status: "active" | "expiring_soon" | "expired" | "missing";
  notes: string;
};

export type BidComparisonRecord = {
  id: string;
  trade: string;
  created_at: string;
  entries: BidEntry[];
  awarded_sub_id: string | null;
  awarded_company_name: string | null;
};

function newEntry(): BidEntry {
  return {
    key: Math.random().toString(36).slice(2, 10),
    sub_id: null,
    company_name: "",
    trade: "",
    bid_cents: null,
    timeline_days: null,
    license_status: "unknown",
    coi_status: "missing",
    notes: "",
  };
}

function licenseStatusFromSub(s: SubRow): "active" | "expired" | "unknown" {
  if (s.dbpr_status === "active") return "active";
  if (s.dbpr_status === "expired") return "expired";
  if (!s.license_expiration) return "unknown";
  const exp = new Date(s.license_expiration);
  if (isNaN(exp.getTime())) return "unknown";
  return exp.getTime() < Date.now() ? "expired" : "active";
}

function fmtMoney(cents: number | null): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function BidComparisonDialog({
  permit,
  onClose,
  onSaved,
}: {
  permit: PermitRow;
  onClose: () => void;
  onSaved?: (row: PermitRow) => void;
}) {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [trade, setTrade] = useState(permit.permit_type?.split(" · ")[0] ?? "");
  const [entries, setEntries] = useState<BidEntry[]>([newEntry(), newEntry()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listSubs().then(setSubs).catch(() => {});
  }, []);

  const lowestBidKey = useMemo(() => {
    const withBid = entries.filter((e) => e.bid_cents != null);
    if (withBid.length === 0) return null;
    return withBid.reduce((a, b) => ((a.bid_cents ?? Infinity) <= (b.bid_cents ?? Infinity) ? a : b)).key;
  }, [entries]);

  const fastestKey = useMemo(() => {
    const withTime = entries.filter((e) => e.timeline_days != null);
    if (withTime.length === 0) return null;
    return withTime.reduce((a, b) => ((a.timeline_days ?? Infinity) <= (b.timeline_days ?? Infinity) ? a : b)).key;
  }, [entries]);

  function addEntry() {
    if (entries.length >= 4) return;
    setEntries((e) => [...e, newEntry()]);
  }
  function removeEntry(key: string) {
    if (entries.length <= 2) return;
    setEntries((e) => e.filter((x) => x.key !== key));
  }
  function patch(key: string, p: Partial<BidEntry>) {
    setEntries((e) => e.map((x) => (x.key === key ? { ...x, ...p } : x)));
  }
  function pickSub(key: string, subId: string) {
    const s = subs.find((x) => x.id === subId);
    if (!s) return;
    patch(key, {
      sub_id: s.id,
      company_name: s.company_name,
      trade: s.trade ?? trade,
      license_status: licenseStatusFromSub(s),
      coi_status: coiLifecycle(s),
    });
  }

  async function persist(awarded?: BidEntry) {
    setSaving(true);
    try {
      const ip = (permit.intake_payload ?? {}) as Record<string, unknown>;
      const priorList = Array.isArray(ip.bid_comparisons) ? (ip.bid_comparisons as BidComparisonRecord[]) : [];
      const record: BidComparisonRecord = {
        id: crypto.randomUUID(),
        trade,
        created_at: new Date().toISOString(),
        entries,
        awarded_sub_id: awarded?.sub_id ?? null,
        awarded_company_name: awarded?.company_name ?? null,
      };
      const nextPayload: Record<string, unknown> = {
        ...ip,
        bid_comparisons: [record, ...priorList],
      };
      if (awarded) {
        nextPayload.awarded_bid = {
          comparison_id: record.id,
          sub_id: awarded.sub_id,
          company_name: awarded.company_name,
          trade: awarded.trade,
          bid_cents: awarded.bid_cents,
          awarded_at: new Date().toISOString(),
        };
      }
      const updated = await updatePermit(permit.id, { intake_payload: nextPayload } as any);
      toast.success(awarded ? `Awarded to ${awarded.company_name}` : "Comparison saved");
      onSaved?.(updated);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function printView() {
    window.print();
  }

  const rows: Array<{ label: string; render: (e: BidEntry) => React.ReactNode; highlight?: (e: BidEntry) => "green" | "blue" | null }> = [
    { label: "Trade", render: (e) => e.trade || "—" },
    {
      label: "Bid Amount",
      render: (e) => fmtMoney(e.bid_cents),
      highlight: (e) => (e.key === lowestBidKey && e.bid_cents != null ? "green" : null),
    },
    {
      label: "Timeline",
      render: (e) => (e.timeline_days != null ? `${e.timeline_days} days` : "—"),
      highlight: (e) => (e.key === fastestKey && e.timeline_days != null ? "blue" : null),
    },
    {
      label: "License",
      render: (e) => (
        <span className={
          e.license_status === "active" ? "text-emerald-700"
          : e.license_status === "expired" ? "text-red-700"
          : "text-obsidian/50"
        }>{e.license_status}</span>
      ),
    },
    {
      label: "COI",
      render: (e) => (
        <span className={
          e.coi_status === "active" ? "text-emerald-700"
          : e.coi_status === "expiring_soon" ? "text-amber-700"
          : e.coi_status === "expired" ? "text-red-700"
          : "text-obsidian/50"
        }>{e.coi_status.replace("_", " ")}</span>
      ),
    },
    { label: "Notes", render: (e) => <span className="whitespace-pre-wrap text-xs text-obsidian/70">{e.notes || "—"}</span> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/50 flex items-start justify-center overflow-y-auto p-4 print:bg-white print:p-0 print:static">
      <div className="w-full max-w-6xl bg-white rounded-[3px] shadow-2xl my-8 print:shadow-none print:my-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-obsidian/10 print:hidden">
          <div>
            <div className="eyebrow text-obsidian/50">Compare Bids</div>
            <h2 className="display-serif text-2xl text-obsidian mt-1">{permit.project_name}</h2>
            <div className="text-xs text-obsidian/60 mt-1">{permit.job_address}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={printView} className="inline-flex items-center gap-1.5 border border-obsidian/20 px-3 py-2 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.14em]">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-2 rounded-[3px] hover:bg-obsidian/5">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Trade + controls */}
        <div className="px-6 py-4 border-b border-obsidian/10 flex items-end gap-4 print:hidden">
          <div className="flex-1 max-w-xs">
            <label className="block eyebrow text-obsidian/50 mb-1.5">Trade</label>
            <input
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="e.g. Pool / Spa"
              className="w-full border border-obsidian/20 rounded-[3px] px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={addEntry}
            disabled={entries.length >= 4}
            className="inline-flex items-center gap-1.5 border border-obsidian/20 px-3 py-2 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.14em] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add Sub ({entries.length}/4)
          </button>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-obsidian/[0.03]">
                <th className="text-left px-4 py-3 eyebrow text-obsidian/50 w-40 border-b border-obsidian/10">Field</th>
                {entries.map((e) => (
                  <th key={e.key} className="text-left px-4 py-3 border-b border-obsidian/10 align-top min-w-[220px]">
                    <div className="print:hidden mb-2 flex items-center justify-between gap-2">
                      <select
                        value={e.sub_id ?? ""}
                        onChange={(ev) => { if (ev.target.value) pickSub(e.key, ev.target.value); }}
                        className="text-[11px] border border-obsidian/15 rounded-[3px] px-1.5 py-1 flex-1"
                      >
                        <option value="">Select from library…</option>
                        {subs.map((s) => (
                          <option key={s.id} value={s.id}>{s.company_name}</option>
                        ))}
                      </select>
                      {entries.length > 2 && (
                        <button onClick={() => removeEntry(e.key)} className="text-red-700/70 hover:text-red-700 p-1" title="Remove">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <input
                      value={e.company_name}
                      onChange={(ev) => patch(e.key, { company_name: ev.target.value })}
                      placeholder="Company name"
                      className="w-full font-medium text-obsidian border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm print:border-0 print:px-0"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-obsidian/5">
                  <td className="px-4 py-3 eyebrow text-obsidian/50 align-top">{r.label}</td>
                  {entries.map((e) => {
                    const hl = r.highlight?.(e) ?? null;
                    const bg = hl === "green" ? "bg-emerald-50" : hl === "blue" ? "bg-sky/30" : "";
                    return (
                      <td key={e.key} className={`px-4 py-3 align-top text-sm ${bg}`}>
                        {r.label === "Trade" && (
                          <input value={e.trade} onChange={(ev) => patch(e.key, { trade: ev.target.value })} placeholder={trade} className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm print:border-0 print:px-0" />
                        )}
                        {r.label === "Bid Amount" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={e.bid_cents != null ? e.bid_cents / 100 : ""}
                              onChange={(ev) => patch(e.key, { bid_cents: ev.target.value ? Math.round(Number(ev.target.value) * 100) : null })}
                              placeholder="0"
                              className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm print:border-0 print:px-0"
                            />
                            {hl === "green" && <Trophy className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
                          </div>
                        )}
                        {r.label === "Timeline" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={e.timeline_days ?? ""}
                              onChange={(ev) => patch(e.key, { timeline_days: ev.target.value ? Number(ev.target.value) : null })}
                              placeholder="days"
                              className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-sm print:border-0 print:px-0"
                            />
                            {hl === "blue" && <Zap className="h-3.5 w-3.5 text-sky-800 shrink-0" />}
                          </div>
                        )}
                        {r.label === "License" && r.render(e)}
                        {r.label === "COI" && r.render(e)}
                        {r.label === "Notes" && (
                          <textarea
                            rows={3}
                            value={e.notes}
                            onChange={(ev) => patch(e.key, { notes: ev.target.value })}
                            placeholder="Terms, exclusions, warranty…"
                            className="w-full border border-obsidian/15 rounded-[3px] px-2 py-1.5 text-xs print:border-0 print:px-0"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Award row */}
              <tr className="print:hidden">
                <td className="px-4 py-3 eyebrow text-obsidian/50">Award</td>
                {entries.map((e) => (
                  <td key={e.key} className="px-4 py-3">
                    <button
                      onClick={() => persist(e)}
                      disabled={saving || !e.company_name.trim()}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-obsidian text-white rounded-[3px] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] disabled:opacity-40"
                    >
                      <Award className="h-3.5 w-3.5" /> Select Winner
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-obsidian/10 print:hidden">
          <div className="text-[11px] text-obsidian/60 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Lowest bid highlighted in green. Fastest timeline highlighted in blue.
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="border border-obsidian/20 px-3 py-2 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.14em]">
              Cancel
            </button>
            <button
              onClick={() => persist()}
              disabled={saving}
              className="bg-obsidian text-white px-4 py-2 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.14em] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Comparison"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
