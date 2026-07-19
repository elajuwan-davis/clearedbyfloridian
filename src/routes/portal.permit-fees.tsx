import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Wallet, Upload, CheckCircle2, X, Plus, Pencil, Trash2 } from "lucide-react";
import { LogPermitFeeDialog } from "@/components/log-permit-fee-dialog";
import { listFees, deleteFee, subscribeFees, type ManualFee } from "@/lib/manual-fees";
import { PROJECTS } from "@/lib/projects-data";

export const Route = createFileRoute("/portal/permit-fees")({
  head: () => ({
    meta: [
      { title: "Permit Fees — Cleared by Flōridian" },
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

  const totalSavings = useMemo(
    () => FEES.reduce((s, f) => s + (f.savings_cents || 0), 0),
    [],
  );

  function upload(permit: string, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setReceipts((r) => ({ ...r, [permit]: f.name }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-8">
        <div className="eyebrow text-obsidian/50 flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} /> Finance
        </div>
        <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Permit Fees</h1>
        <p className="mt-3 text-sm text-obsidian/60 max-w-xl">
          Municipality-issued fees payable through each city's portal. Savings column reflects the reduction under Flōridian's private-provider + permit-runner service vs. standard process.
        </p>
      </div>

      {FEES.length === 0 ? (
        <div className="mt-10 border border-dashed border-obsidian/20 rounded-[3px] p-12 text-center">
          <Wallet className="h-8 w-8 mx-auto text-obsidian/30" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-obsidian/70">No permit fees on file.</p>
          <p className="mt-1 text-xs text-obsidian/50">Fees will appear here as permits are issued.</p>
        </div>
      ) : (
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
    </div>
  );
}
