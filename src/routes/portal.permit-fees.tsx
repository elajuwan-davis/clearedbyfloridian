import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Wallet, Upload, CheckCircle2, X, Plus, Pencil, Trash2, Package } from "lucide-react";
import { LogPermitFeeDialog } from "@/components/log-permit-fee-dialog";
import { listAllFees, deleteFee, fmtUsd, type ManualFee } from "@/lib/manual-fees";
import { PROJECTS } from "@/lib/projects-data";
import { listPermits, type PermitRow } from "@/lib/permits-api";
import { getBundle, bundleBudgetedTotal, bundleAllFeesConfirmed } from "@/lib/bundle";

export const Route = createFileRoute("/portal/permit-fees")({
  head: () => ({
    meta: [
      { title: "Permit Fees — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PermitFeesPage,
});

type FeeRow = {
  permit: string;
  address: string;
  municipality: string;
  description: string;
  amount_cents: number;
  savings_cents: number;
  status: "paid" | "due" | "overdue";
};

const FEES: FeeRow[] = [];

const statusTone: Record<FeeRow["status"], { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" },
  due: { label: "Due", cls: "bg-sky-600/10 text-sky-700 border-sky-600/30" },
  overdue: { label: "Overdue", cls: "bg-oxblood/10 text-oxblood border-oxblood/30" },
};

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PermitFeesPage() {
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [manualFees, setManualFees] = useState<ManualFee[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<ManualFee | null>(null);
  const [bundledPermits, setBundledPermits] = useState<PermitRow[]>([]);

  useEffect(() => {
    const refresh = () => setManualFees(listAllFees());
    refresh();
    window.addEventListener("manual-fees:changed", refresh);
    listPermits()
      .then((rows) => setBundledPermits(rows.filter((r) => getBundle(r)?.enabled)))
      .catch(() => {});
    return () => window.removeEventListener("manual-fees:changed", refresh);
  }, []);

  const totalSavings = useMemo(
    () => FEES.reduce((s, f) => s + (f.savings_cents || 0), 0),
    [],
  );
  const manualTotal = useMemo(
    () => manualFees.reduce((s, f) => s + f.amountCents, 0),
    [manualFees],
  );

  function projectName(id: string) {
    return PROJECTS.find((p) => p.id === id)?.name ?? id;
  }

  function upload(permit: string, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setReceipts((r) => ({ ...r, [permit]: f.name }));
  }

  function openNew() {
    setEditing(null);
    setLogOpen(true);
  }
  function openEdit(fee: ManualFee) {
    setEditing(fee);
    setLogOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow text-obsidian/50 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} /> Finance
            </div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Permit Fees</h1>
            <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
              Municipality-issued fees payable through each city's portal. Log fees manually as you pull them from municipal portals.
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
          >
            <Plus className="h-3.5 w-3.5" /> Log Permit Fee
          </button>
        </div>
      </div>

      {bundledPermits.length > 0 && (
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <h2 className="display-serif text-2xl text-obsidian flex items-center gap-2">
              <Package className="h-5 w-5" /> Bundled Permit Fees
            </h2>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/60">
              {bundledPermits.length} bundle{bundledPermits.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="mt-4 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
            <div className="grid grid-cols-[1.6fr_1.4fr_1.6fr_0.9fr_auto] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
              <div>Project</div>
              <div>Municipality</div>
              <div>Trades</div>
              <div className="text-right">GC Fee</div>
              <div></div>
            </div>
            {bundledPermits.map((p) => {
              const b = getBundle(p)!;
              const tradeLabels = b.trades.map((t) => t.label);
              return (
                <div key={p.id} className="grid grid-cols-[1.6fr_1.4fr_1.6fr_0.9fr_auto] gap-4 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm">
                  <div className="min-w-0">
                    <Link to="/portal/permits/$id/bundle" params={{ id: p.id }} className="text-obsidian hover:underline font-medium">
                      {p.project_name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        title={`Covers ${tradeLabels.length} trades: ${tradeLabels.join(", ")}`}
                        className="inline-flex items-center gap-1 border border-obsidian/20 bg-obsidian/[0.04] rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian"
                      >
                        <Package className="h-3 w-3" /> Bundle
                      </span>
                      <span className="text-[11px] text-obsidian/50 font-mono">{b.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="text-obsidian/70 text-[13px]">{p.municipality || "—"}</div>
                  <div className="text-obsidian/70 text-[12px] truncate">{tradeLabels.join(", ") || "—"}</div>
                  <div className="text-right font-mono text-obsidian">
                    {(() => {
                      const budgeted = bundleBudgetedTotal(b);
                      const total = budgeted || b.gc_fee_cents;
                      const confirmed = bundleAllFeesConfirmed(b);
                      return (
                        <div>
                          <div>{fmtUsd(total)}</div>
                          {!confirmed && (
                            <div className="mt-0.5 italic text-[10px] text-obsidian/55 font-sans normal-case tracking-normal">Budgeted</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <Link
                      to="/portal/permits/$id/bundle"
                      params={{ id: p.id }}
                      className="inline-flex items-center border border-obsidian/20 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manually logged fees */}
      <div className="mt-10">
        <div className="flex items-end justify-between">
          <h2 className="display-serif text-2xl text-obsidian">Logged Fees</h2>
          {manualFees.length > 0 && (
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian/60">
              Total <span className="ml-2 text-obsidian text-sm">{fmtUsd(manualTotal)}</span>
            </div>
          )}
        </div>

        {manualFees.length === 0 ? (
          <div className="mt-4 border border-dashed border-obsidian/20 rounded-[3px] p-10 text-center">
            <Wallet className="h-8 w-8 mx-auto text-obsidian/30" strokeWidth={1.5} />
            <p className="mt-3 text-sm text-obsidian/70">No fees logged yet.</p>
            <p className="mt-1 text-xs text-obsidian/50">Use "Log Permit Fee" to record a payment.</p>
          </div>
        ) : (
          <div className="mt-4 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
            <div className="grid grid-cols-[1.3fr_1.2fr_1fr_0.9fr_1.2fr_auto] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
              <div>Project</div>
              <div>Fee Type</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
              <div>Notes</div>
              <div></div>
            </div>
            {manualFees.map((f) => (
              <div key={f.id} className="grid grid-cols-[1.3fr_1.2fr_1fr_0.9fr_1.2fr_auto] gap-4 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm">
                <div className="text-obsidian">{projectName(f.projectId)}</div>
                <div className="text-obsidian/75 text-[13px]">{f.feeType}</div>
                <div className="text-obsidian/60 font-mono text-[12px]">{f.datePaid}</div>
                <div className="text-right font-mono text-obsidian">{fmtUsd(f.amountCents)}</div>
                <div className="text-obsidian/60 text-[12px] truncate">{f.notes || "—"}</div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => openEdit(f)} className="p-1.5 text-obsidian/60 hover:text-obsidian" aria-label="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteFee(f.id)} className="p-1.5 text-obsidian/60 hover:text-oxblood" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {FEES.length > 0 && (
        <>
          <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
            <div className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.9fr_0.9fr_auto] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
              <div>Permit</div>
              <div>Address</div>
              <div>Municipality</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Savings</div>
              <div>Status</div>
              <div>Receipt</div>
            </div>
            {FEES.map((f) => {
              const s = statusTone[f.status];
              const receipt = receipts[f.permit];
              return (
                <div key={f.permit} className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.9fr_0.9fr_auto] gap-4 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm">
                  <div className="font-mono text-[12px] text-obsidian">{f.permit}</div>
                  <div className="text-obsidian/80">
                    <div>{f.address}</div>
                    <div className="text-[11px] text-obsidian/50">{f.description}</div>
                  </div>
                  <div className="text-obsidian/70 text-[13px]">{f.municipality}</div>
                  <div className="text-right font-mono text-obsidian">{fmt(f.amount_cents)}</div>
                  <div className="text-right font-mono text-emerald-700">{fmt(f.savings_cents)}</div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 border rounded-[2px] font-mono text-[10px] uppercase tracking-[0.12em] ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                  <div>
                    {receipt ? (
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-600/10 px-2 py-1 rounded-[3px] border border-emerald-600/25">
                        <CheckCircle2 className="h-3 w-3" /> {receipt}
                        <button type="button" onClick={() => setReceipts(({ [f.permit]: _, ...rest }) => rest)}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 cursor-pointer border border-obsidian/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                        <Upload className="h-3 w-3" /> Upload
                        <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => upload(f.permit, e)} />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <div
              className="px-6 py-4 rounded-[3px] border"
              style={{
                backgroundColor: "var(--obsidian)",
                color: "var(--paper)",
                borderColor: "color-mix(in oklab, var(--paper) 8%, transparent)",
              }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}
              >
                Total Savings via Flōridian
              </div>
              <div className="font-display text-3xl tabular-nums mt-1 text-emerald-300">
                {fmt(totalSavings)}
              </div>
            </div>
          </div>
        </>
      )}

      <LogPermitFeeDialog open={logOpen} onOpenChange={setLogOpen} editing={editing} />
    </div>
  );
}
