import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, EyeOff, FileText } from "lucide-react";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoicesPage,
});

type InvStatus = "paid" | "pending" | "overdue";
type Invoice = {
  number: string;
  status: InvStatus;
  address: string;
  description: string;
  amount_cents: number;
  issued: string;
};

const INVOICES: Invoice[] = [
  { number: "INV-2026-0001", status: "paid", address: "1247 Banyan Trail, Ocean Ridge", description: "New Construction of In-Ground Pool w/ Deck", amount_cents: 9_054_000, issued: "Apr 12, 2026" },
  { number: "INV-2026-0002", status: "paid", address: "1812 S Ocean Blvd, Manalapan", description: "New Construction of In-Ground Pool w/ Deck", amount_cents: 27_456_000, issued: "Apr 21, 2026" },
  { number: "INV-2026-0003", status: "pending", address: "88 Beach Rd, Jupiter Island", description: "Pool, Spa, & Summer Kitchen", amount_cents: 19_164_000, issued: "May 28, 2026" },
  { number: "INV-2026-0004", status: "pending", address: "1247 Banyan Trail, Ocean Ridge", description: "Merchant Processing Fees", amount_cents: 88_600, issued: "May 30, 2026" },
  { number: "INV-2026-0005", status: "overdue", address: "5440 SE Gomez Ave, Hobe Sound", description: "New Construction of In-Ground Pool w/ Deck", amount_cents: 5_352_000, issued: "Apr 02, 2026" },
  { number: "INV-2026-0006", status: "pending", address: "2100 Ocean Dr, Vero Beach", description: "New Construction of In-Ground Pool w/ Deck", amount_cents: 8_741_100, issued: "Apr 29, 2026" },
];

const statusTone: Record<InvStatus, { label: string; cls: string }> = {
  paid: { label: "Paid", cls: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30" },
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-700 border-amber-600/30" },
  overdue: { label: "Overdue", cls: "bg-oxblood/10 text-oxblood border-oxblood/30" },
};

const fmt = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InvoicesPage() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState<string | null>(INVOICES[0].number);

  const stats = useMemo(() => {
    const total = INVOICES.reduce((s, i) => s + i.amount_cents, 0);
    const pending = INVOICES.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount_cents, 0);
    const overdue = INVOICES.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount_cents, 0);
    return { total, pending, overdue };
  }, []);

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-8">
          <div>
            <div className="eyebrow text-obsidian/50">Billing</div>
            <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Invoices</h1>
            <p className="mt-2 text-sm text-obsidian/60">
              Permitting and admin fees, invoiced at submittal under FL 553.791.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="inline-flex items-center gap-2 border border-obsidian/20 bg-paper-warm px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/70 hover:text-obsidian rounded-[3px]"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {show ? "Hide amounts" : "Show amounts"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Total Amount" value={fmt(stats.total)} show={show} />
          <StatCard label="Pending" value={fmt(stats.pending)} show={show} tone="amber" />
          <StatCard label="Overdue" value={fmt(stats.overdue)} show={show} tone="oxblood" />
        </div>

        {/* Accordion list */}
        <div className="mt-10 border border-obsidian/15 bg-white">
          {INVOICES.map((inv) => {
            const isOpen = open === inv.number;
            const t = statusTone[inv.status];
            return (
              <div key={inv.number} className="border-b border-obsidian/10 last:border-0">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : inv.number)}
                  className="w-full flex flex-wrap items-center gap-3 px-5 py-4 text-left hover:bg-paper-warm/50 transition-colors"
                >
                  <ChevronDown
                    className={`h-4 w-4 text-obsidian/40 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  />
                  <span className="font-mono text-[12px] tabular-nums text-obsidian">
                    {inv.number}
                  </span>
                  <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] rounded-[2px] ${t.cls}`}>
                    {t.label}
                  </span>
                  <span className="text-sm text-obsidian/70 truncate flex-1 min-w-0">{inv.address}</span>
                  <span className="font-mono text-sm tabular-nums text-obsidian ml-auto">
                    {show ? fmt(inv.amount_cents) : "••••••"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-12 pb-5 pt-1 space-y-3">
                    <p className="text-sm text-obsidian/75">
                      {inv.description} — {inv.address}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                      Issued {inv.issued}
                    </p>
                    <Button
                      variant={inv.status === "paid" ? "outline" : "dark"}
                      className="w-full rounded-[3px] gap-2"
                      disabled={inv.status === "paid"}
                    >
                      <FileText className="h-4 w-4" />
                      {inv.status === "paid" ? "Paid — view receipt" : inv.status === "overdue" ? "Pay now (overdue)" : "Pay invoice"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}

function StatCard({
  label, value, show, tone,
}: {
  label: string;
  value: string;
  show: boolean;
  tone?: "amber" | "oxblood";
}) {
  return (
    <div
      className="p-5 border rounded-[3px]"
      style={{
        backgroundColor: "var(--obsidian)",
        color: "var(--paper)",
        borderColor: tone === "oxblood"
          ? "color-mix(in oklab, var(--accent) 40%, transparent)"
          : tone === "amber"
          ? "oklch(0.7 0.12 75 / 0.4)"
          : "color-mix(in oklab, var(--paper) 8%, transparent)",
      }}
    >
      <div
        className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3"
        style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}
      >
        {label}
      </div>
      <div
        className="font-display text-3xl tabular-nums"
        style={{
          color: tone === "oxblood"
            ? "var(--accent)"
            : tone === "amber"
            ? "oklch(0.85 0.13 75)"
            : "var(--paper)",
        }}
      >
        {show ? value : "•••••••"}
      </div>
    </div>
  );
}
