import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import { Wallet, Upload, CheckCircle2, X } from "lucide-react";

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
  status: "paid" | "due" | "overdue";
};

const FEES: FeeRow[] = [
  { permit: "CLR-2026-0142", address: "1247 Banyan Trail, Ocean Ridge", municipality: "Town of Ocean Ridge", description: "Building Permit Fee", amount_cents: 4_527_00 * 100 / 100, status: "due" },
  { permit: "CLR-2026-0151", address: "1812 S Ocean Blvd, Manalapan", municipality: "Town of Manalapan", description: "Plan Review Fee", amount_cents: 2_150_00, status: "paid" },
  { permit: "CLR-2026-0163", address: "88 Beach Rd, Jupiter Island", municipality: "Town of Jupiter Island", description: "Building Permit Fee", amount_cents: 9_582_00, status: "due" },
  { permit: "CLR-2026-0177", address: "5440 SE Gomez Ave, Hobe Sound", municipality: "Martin County", description: "Impact Fee", amount_cents: 12_800_00, status: "overdue" },
  { permit: "CLR-2026-0188", address: "2100 Ocean Dr, Vero Beach", municipality: "City of Vero Beach", description: "Building Permit Fee", amount_cents: 6_240_00, status: "due" },
];

const statusTone: Record<FeeRow["status"], { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" },
  due: { label: "Due", cls: "bg-sky-600/10 text-sky-700 border-sky-600/30" },
  overdue: { label: "Overdue", cls: "bg-oxblood/10 text-oxblood border-oxblood/30" },
};

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PermitFeesPage() {
  const [receipts, setReceipts] = useState<Record<string, string>>({});

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
          Municipality-issued fees payable through each city's portal. Upload the receipt or payment confirmation after paying.
        </p>
      </div>

      <div className="mt-8 border border-obsidian/10 bg-white rounded-[3px] overflow-hidden">
        <div className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.9fr_auto] gap-4 px-5 py-3 border-b border-obsidian/10 bg-obsidian/5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
          <div>Permit</div>
          <div>Address</div>
          <div>Municipality</div>
          <div className="text-right">Amount</div>
          <div>Status</div>
          <div>Receipt</div>
        </div>
        {FEES.map((f) => {
          const s = statusTone[f.status];
          const receipt = receipts[f.permit];
          return (
            <div key={f.permit} className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.9fr_auto] gap-4 px-5 py-4 border-b border-obsidian/10 last:border-b-0 items-center text-sm">
              <div className="font-mono text-[12px] text-obsidian">{f.permit}</div>
              <div className="text-obsidian/80">
                <div>{f.address}</div>
                <div className="text-[11px] text-obsidian/50">{f.description}</div>
              </div>
              <div className="text-obsidian/70 text-[13px]">{f.municipality}</div>
              <div className="text-right font-mono text-obsidian">{fmt(f.amount_cents)}</div>
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
    </div>
  );
}
