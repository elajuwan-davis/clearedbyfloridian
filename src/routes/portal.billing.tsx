import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  ChevronDown,
  ChevronRight,
  Calculator,
  AlertTriangle,
  Plus,
  Check,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isInternalUser } from "@/lib/is-internal-user";
import { PROJECTS } from "@/lib/projects-data";
import {
  listAccounts,
  listInvoices,
  listInvoicesForAccount,
  listPayments,
  listPaymentsForAccount,
  invoiceTotal,
  generateInvoice,
  markPaid,
  computeTransactionFee,
  addLineItemToInvoice,
  outstandingBalanceForAccount,
  hasOverdue,
  fmtUsd,
  type BillingAccount,
  type Invoice,
  type InvoiceStatus,
  type PaymentRecord,
} from "@/lib/billing";

export const Route = createFileRoute("/portal/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Invoicing — Cléared" },
      {
        name: "description",
        content: "Manage Cléared subscription billing, per-project invoices, transaction fees, and payment history.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const STATUS_TONE: Record<InvoiceStatus, string> = {
  draft: "bg-neutral-400/10 text-neutral-600 border-neutral-400/30",
  sent: "bg-sky-600/10 text-sky-700 border-sky-600/30",
  paid: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
  overdue: "bg-oxblood/10 text-oxblood border-oxblood/30",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${STATUS_TONE[status]}`}
    >
      {status}
    </span>
  );
}

function useBillingData() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener("billing:changed", onChange);
    return () => window.removeEventListener("billing:changed", onChange);
  }, []);
  const accounts = useMemo(() => listAccounts(), [tick]);
  const invoices = useMemo(() => listInvoices(), [tick]);
  const payments = useMemo(() => listPayments(), [tick]);
  return { accounts, invoices, payments };
}

function projectName(projectId: string) {
  return PROJECTS.find((p) => p.id === projectId)?.name ?? "Unknown project";
}

function downloadInvoice(invoice: Invoice, account: BillingAccount | undefined) {
  const lines = [
    `Cléared — Invoice ${invoice.invoiceNumber}`,
    `Client: ${account?.clientName ?? "—"}`,
    `Project: ${projectName(invoice.projectId)}`,
    `Issued: ${invoice.issuedAt}    Due: ${invoice.dueAt}    Status: ${invoice.status.toUpperCase()}`,
    "",
    "Line Items:",
    ...invoice.lineItems.map((li) => `  ${li.type.padEnd(28)} ${li.description.padEnd(60)} ${fmtUsd(li.amountCents)}`),
    "",
    `Total: ${fmtUsd(invoiceTotal(invoice))}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.invoiceNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function BillingPage() {
  const [staff, setStaff] = useState(false);
  useEffect(() => setStaff(isInternalUser()), []);

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 overflow-x-hidden">
        <header className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} /> Billing
          </div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">Billing &amp; Invoicing</h1>
          <p className="mt-3 text-sm text-obsidian/60 max-w-2xl">
            {staff
              ? "Manage GC billing accounts, generate invoices, and track outstanding balances."
              : "Review your Cléared subscription, per-project invoices, and payment history."}
          </p>
        </header>

        <div className="mt-8">{staff ? <StaffView /> : <GcView />}</div>
      </div>
    </PortalShell>
  );
}

// ------------------------------- GC VIEW ---------------------------------

function GcView() {
  const { accounts, invoices, payments } = useBillingData();
  // Demo: GC portal shows the first seeded account.
  const account = accounts[0];
  const myInvoices = account ? listInvoicesForAccount(account.id) : [];
  const myPayments = account ? listPaymentsForAccount(account.id) : [];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  if (!account) {
    return <p className="text-sm text-obsidian/50 italic">No billing account on file yet.</p>;
  }

  const totalOutstanding = myInvoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + invoiceTotal(i), 0);

  return (
    <div className="space-y-10">
      {/* Subscription + card */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="border hairline bg-white rounded-[3px] p-5">
          <div className="label-eyebrow">Active Subscription</div>
          <h2 className="mt-3 text-xl font-semibold text-obsidian">{account.planName}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Billing cycle</dt>
              <dd className="text-obsidian capitalize">{account.billingCycle}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Next charge date</dt>
              <dd className="text-obsidian">{account.nextChargeDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Monthly platform fee</dt>
              <dd className="text-obsidian font-mono">{fmtUsd(account.monthlyPlatformFeeCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Per-project fee</dt>
              <dd className="text-obsidian font-mono">{fmtUsd(account.perProjectFeeCents)}</dd>
            </div>
            {totalOutstanding > 0 && (
              <div className="flex justify-between pt-2 border-t hairline">
                <dt className="text-obsidian/60">Outstanding balance</dt>
                <dd className="text-oxblood font-mono font-semibold">{fmtUsd(totalOutstanding)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="border hairline bg-white rounded-[3px] p-5">
          <div className="label-eyebrow">Card On File</div>
          <div className="mt-3 flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-obsidian/60" strokeWidth={1.5} />
            <div>
              <div className="text-obsidian font-mono">•••• •••• •••• {account.cardLast4}</div>
              <div className="text-xs text-obsidian/50">Expires {account.cardExp}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-5 min-h-11"
            onClick={() => toast.message("Stripe integration pending", { description: "Card updates will be available once Stripe is connected." })}
          >
            Update Card
          </Button>
          <p className="mt-2 text-[11px] text-obsidian/40 italic">Stripe integration pending</p>
        </section>
      </div>

      {/* Invoices */}
      <section>
        <div className="label-eyebrow mb-3">Project Invoices</div>
        <div className="overflow-x-auto border hairline rounded-[3px] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b hairline text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myInvoices.map((inv) => (
                <>
                  <tr key={inv.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(inv.id)}
                        className="flex items-center gap-1.5 min-h-11 text-obsidian font-mono"
                      >
                        {expanded.has(inv.id) ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-obsidian/80">{projectName(inv.projectId)}</td>
                    <td className="px-4 py-3 text-obsidian/60">{inv.issuedAt}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-obsidian">{fmtUsd(invoiceTotal(inv))}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        onClick={() => downloadInvoice(inv, account)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                      </Button>
                    </td>
                  </tr>
                  {expanded.has(inv.id) && (
                    <tr className="bg-obsidian/[0.02]">
                      <td colSpan={6} className="px-4 py-3">
                        <ul className="divide-y hairline">
                          {inv.lineItems.map((li) => (
                            <li key={li.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                              <div>
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50 mr-2">
                                  {li.type}
                                </span>
                                <span className="text-obsidian/80">{li.description}</span>
                              </div>
                              <span className="font-mono text-obsidian shrink-0">{fmtUsd(li.amountCents)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {myInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-obsidian/50 italic">
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment history */}
      <section>
        <div className="label-eyebrow mb-3">Payment History</div>
        <div className="overflow-x-auto border hairline rounded-[3px] bg-white">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b hairline text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {myPayments.map((p) => (
                <tr key={p.id} className="border-b hairline last:border-0">
                  <td className="px-4 py-3 text-obsidian/70">{p.paidAt}</td>
                  <td className="px-4 py-3 text-obsidian/70">{p.method}</td>
                  <td className="px-4 py-3 text-right font-mono text-obsidian">{fmtUsd(p.amountCents)}</td>
                </tr>
              ))}
              {myPayments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-obsidian/50 italic">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ------------------------------ STAFF VIEW --------------------------------

function StaffView() {
  const { accounts, invoices, payments } = useBillingData();
  const [busy, setBusy] = useState<string | null>(null);

  function handleGenerate(clientName: string) {
    const project = PROJECTS.find((p) => p.client === clientName);
    if (!project) {
      toast.error("No project found for this client");
      return;
    }
    const inv = generateInvoice(project.id);
    if (inv) toast.success(`Generated ${inv.invoiceNumber} for ${projectName(inv.projectId)}`);
  }

  function handleMarkPaid(invoiceId: string, invoiceNumber: string) {
    setBusy(invoiceId);
    markPaid(invoiceId);
    toast.success(`${invoiceNumber} marked paid`, { description: "Stripe integration pending — recorded manually." });
    setBusy(null);
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="label-eyebrow mb-3">GC Billing Accounts</div>
        <div className="overflow-x-auto border hairline rounded-[3px] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b hairline text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Next Charge</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Overdue</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct) => {
                const balance = outstandingBalanceForAccount(acct.id);
                const overdue = hasOverdue(acct.id);
                return (
                  <tr key={acct.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3 text-obsidian font-medium">{acct.clientName}</td>
                    <td className="px-4 py-3 text-obsidian/70">{acct.planName}</td>
                    <td className="px-4 py-3 text-obsidian/70">{acct.nextChargeDate}</td>
                    <td className="px-4 py-3 text-right font-mono text-obsidian">{fmtUsd(balance)}</td>
                    <td className="px-4 py-3">
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 text-oxblood font-mono text-[10px] uppercase tracking-[0.12em]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                        </span>
                      ) : (
                        <span className="text-obsidian/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        onClick={() => handleGenerate(acct.clientName)}
                      >
                        Generate Invoice
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-obsidian/50 italic">
                    No billing accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="label-eyebrow mb-3">All Invoices</div>
        <div className="overflow-x-auto border hairline rounded-[3px] bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b hairline text-left font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const acct = accounts.find((a) => a.id === inv.accountId);
                return (
                  <tr key={inv.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3 font-mono text-obsidian">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-obsidian/80">{acct?.clientName ?? "—"}</td>
                    <td className="px-4 py-3 text-obsidian/70">{projectName(inv.projectId)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-obsidian">{fmtUsd(invoiceTotal(inv))}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        onClick={() => downloadInvoice(inv, acct)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {inv.status !== "paid" && (
                        <Button
                          size="sm"
                          className="min-h-9"
                          disabled={busy === inv.id}
                          onClick={() => handleMarkPaid(inv.id, inv.invoiceNumber)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1.5" /> Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-obsidian/40 italic">Stripe integration pending — payments recorded manually.</p>
      </section>

      <TransactionFeeCalculator invoices={invoices} />
    </div>
  );
}

function TransactionFeeCalculator({ invoices }: { invoices: Invoice[] }) {
  const [standard, setStandard] = useState("3850");
  const [privateFee, setPrivateFee] = useState("2650");
  const [targetInvoiceId, setTargetInvoiceId] = useState<string>("");

  const standardCents = Math.round(Number(standard || 0) * 100);
  const privateCents = Math.round(Number(privateFee || 0) * 100);
  const { savingsCents, feeCents } = computeTransactionFee(standardCents, privateCents);

  const openInvoices = invoices.filter((i) => i.status !== "paid");

  function handleAdd() {
    if (!targetInvoiceId) {
      toast.error("Select an invoice first");
      return;
    }
    addLineItemToInvoice(targetInvoiceId, {
      type: "Transaction Fee",
      description: `50% of $${(savingsCents / 100).toFixed(2)} saved via private provider (same-day inspections)`,
      amountCents: feeCents,
    });
    toast.success("Transaction fee added to invoice");
  }

  return (
    <section className="border hairline bg-white rounded-[3px] p-5 max-w-xl">
      <div className="flex items-center gap-2 text-obsidian">
        <Calculator className="h-4 w-4" strokeWidth={1.5} />
        <h2 className="text-sm font-semibold">Transaction Fee Calculator</h2>
      </div>
      <p className="mt-1 text-xs text-obsidian/50">
        50% of the savings a GC realizes by using a private provider (2-day plan review) instead of the standard
        municipal fee.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="standard-fee">Standard municipal fee ($)</Label>
          <Input
            id="standard-fee"
            inputMode="decimal"
            value={standard}
            onChange={(e) => setStandard(e.target.value)}
            className="mt-1.5 min-h-11"
          />
        </div>
        <div>
          <Label htmlFor="private-fee">Private provider fee ($)</Label>
          <Input
            id="private-fee"
            inputMode="decimal"
            value={privateFee}
            onChange={(e) => setPrivateFee(e.target.value)}
            className="mt-1.5 min-h-11"
          />
        </div>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-obsidian/60">Savings</dt>
          <dd className="font-mono text-obsidian">{fmtUsd(savingsCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-obsidian/60">Transaction fee (50%)</dt>
          <dd className="font-mono text-green font-semibold">{fmtUsd(feeCents)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <Label htmlFor="target-invoice">Add as line item to</Label>
        <select
          id="target-invoice"
          value={targetInvoiceId}
          onChange={(e) => setTargetInvoiceId(e.target.value)}
          className="mt-1.5 w-full min-h-11 rounded-[3px] border hairline bg-white px-3 text-sm text-obsidian"
        >
          <option value="">Select an open invoice…</option>
          {openInvoices.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.invoiceNumber} — {projectName(inv.projectId)}
            </option>
          ))}
        </select>
      </div>
      <Button className="mt-4 min-h-11" onClick={handleAdd} disabled={feeCents <= 0}>
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add as invoice line item
      </Button>
    </section>
  );
}
