import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import {
  listBillingAccounts,
  listServiceFeeInvoices,
  listPaymentsFromInvoices,
  listInvoiceablePermits,
  generateServiceFeeInvoiceForPermit,
  invoiceTotal,
  outstandingBalanceForInvoices,
  hasOverdueInvoices,
  fmtUsd,
  type BillingAccount,
  type Invoice,
  type InvoiceStatus,
  type PaymentRecord,
} from "@/lib/billing";
import {
  chargeServiceFeeWithSavedMethod,
  createPortalSession,
  listSavedPaymentMethods,
} from "@/lib/payments.functions";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export const Route = createFileRoute("/portal/billing")({
  head: () => ({
    meta: [
      { title: "Billing & Invoicing — Cleard" },
      {
        name: "description",
        content:
          "Manage Cleard subscription billing, per-project service fees, and payment history.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

const STATUS_TONE: Record<InvoiceStatus, string> = {
  pending: "bg-sky-600/10 text-sky-700 border-sky-600/30",
  paid: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
  overdue: "bg-oxblood/10 text-oxblood border-oxblood/30",
  refunded: "bg-neutral-400/10 text-neutral-600 border-neutral-400/30",
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

function downloadInvoice(invoice: Invoice, account: BillingAccount | undefined) {
  const lines = [
    `Cleard — Invoice ${invoice.invoiceNumber}`,
    `Client: ${account?.clientName ?? "—"}`,
    `Project: ${invoice.projectName}`,
    `Issued: ${invoice.issuedAt}    Due: ${invoice.dueAt}    Status: ${invoice.status.toUpperCase()}`,
    "",
    "Line Items:",
    ...invoice.lineItems.map(
      (li) =>
        `  ${li.type.padEnd(28)} ${li.description.padEnd(60)} ${fmtUsd(li.amountCents)}`,
    ),
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

function useLiveBilling(tenantFilter: string | null, isAdmin: boolean) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BillingAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const invs = await listServiceFeeInvoices(
        isAdmin && !tenantFilter ? undefined : { tenantId: tenantFilter },
      );
      const accts = await listBillingAccounts();
      const scopedAccounts = isAdmin
        ? accts
        : accts.filter((a) => a.id === tenantFilter);
      const pays = await listPaymentsFromInvoices(invs);
      setInvoices(invs);
      setAccounts(scopedAccounts);
      setPayments(
        isAdmin ? pays : pays.filter((p) => p.accountId === tenantFilter),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }, [tenantFilter, isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, accounts, invoices, payments, error, refresh };
}

function BillingPage() {
  const session = useSession();
  const staff = session.isAdmin;

  if (session.loading) {
    return (
      <PortalShell>
        <div className="mx-auto max-w-6xl px-4 py-16 text-sm text-obsidian/50">
          Loading billing…
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 overflow-x-hidden">
        <header className="border-b border-obsidian/10 pb-8">
          <div className="eyebrow text-obsidian/50 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} /> Billing
          </div>
          <h1 className="display-serif mt-3 text-4xl sm:text-5xl text-obsidian">
            Billing &amp; Invoicing
          </h1>
          <p className="mt-3 text-sm text-obsidian/60 max-w-2xl">
            {staff
              ? "Manage GC tenants, generate service-fee invoices, and charge saved payment methods."
              : "Review your Cleard subscription, per-project service fees, and payment history."}
          </p>
        </header>

        <div className="mt-8">
          {staff ? (
            <StaffView tenantFilter={session.effectiveTenantId} />
          ) : (
            <GcView tenantId={session.effectiveTenantId} />
          )}
        </div>
      </div>
    </PortalShell>
  );
}

// ------------------------------- GC VIEW ---------------------------------

function GcView({ tenantId }: { tenantId: string | null }) {
  const { loading, accounts, invoices, payments, error, refresh } = useLiveBilling(
    tenantId,
    false,
  );
  const account = accounts[0] ?? null;
  const myInvoices = useMemo(
    () => (account ? invoices.filter((i) => i.accountId === account.id) : invoices),
    [account, invoices],
  );
  const myPayments = useMemo(
    () => (account ? payments.filter((p) => p.accountId === account.id) : payments),
    [account, payments],
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [card, setCard] = useState<{ last4: string; exp: string; brand: string } | null>(
    null,
  );
  const listMethods = useServerFn(listSavedPaymentMethods);
  const openPortal = useServerFn(createPortalSession);
  const [updatingCard, setUpdatingCard] = useState(false);

  useEffect(() => {
    if (!isPaymentsConfigured()) return;
    void (async () => {
      try {
        const env = getStripeEnvironment();
        const res = await listMethods({ data: { environment: env } });
        if ("error" in res) return;
        const pm = res.methods[0];
        if (pm) {
          setCard({
            last4: pm.last4 || "————",
            exp:
              pm.expMonth && pm.expYear
                ? `${String(pm.expMonth).padStart(2, "0")}/${String(pm.expYear).slice(-2)}`
                : "—",
            brand: pm.brand,
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [listMethods]);

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function handleUpdateCard() {
    if (!isPaymentsConfigured()) {
      toast.error("Payments are not configured in this environment.");
      return;
    }
    setUpdatingCard(true);
    try {
      const env = getStripeEnvironment();
      const res = await openPortal({
        data: { returnUrl: `${window.location.origin}/portal/billing`, environment: env },
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      window.location.href = res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setUpdatingCard(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-obsidian/50 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing…
      </p>
    );
  }
  if (error) {
    return (
      <div className="text-sm text-oxblood">
        {error}{" "}
        <button className="underline" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }
  if (!account && myInvoices.length === 0) {
    return (
      <p className="text-sm text-obsidian/50 italic">
        No billing account on file yet. Subscribe or wait for a service-fee invoice to appear.
      </p>
    );
  }

  const totalOutstanding = myInvoices
    .filter((i) => i.status !== "paid" && i.status !== "refunded")
    .reduce((s, i) => s + invoiceTotal(i), 0);

  return (
    <div className="space-y-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="border hairline bg-white rounded-[3px] p-5">
          <div className="label-eyebrow">Active Subscription</div>
          <h2 className="mt-3 text-xl font-semibold text-obsidian">
            {account?.planName ?? "—"}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Billing cycle</dt>
              <dd className="text-obsidian capitalize">{account?.billingCycle ?? "monthly"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Next charge date</dt>
              <dd className="text-obsidian">{account?.nextChargeDate ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-obsidian/60">Monthly platform fee</dt>
              <dd className="text-obsidian font-mono">
                {fmtUsd(account?.monthlyPlatformFeeCents ?? 0)}
              </dd>
            </div>
            {totalOutstanding > 0 && (
              <div className="flex justify-between pt-2 border-t hairline">
                <dt className="text-obsidian/60">Outstanding balance</dt>
                <dd className="text-oxblood font-mono font-semibold">
                  {fmtUsd(totalOutstanding)}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="border hairline bg-white rounded-[3px] p-5">
          <div className="label-eyebrow">Card On File</div>
          <div className="mt-3 flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-obsidian/60" strokeWidth={1.5} />
            <div>
              <div className="text-obsidian font-mono">
                •••• •••• •••• {card?.last4 ?? account?.cardLast4 ?? "————"}
              </div>
              <div className="text-xs text-obsidian/50">
                {card?.brand ? `${card.brand} · ` : ""}
                Expires {card?.exp ?? account?.cardExp ?? "—"}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-5 min-h-11"
            disabled={updatingCard}
            onClick={() => void handleUpdateCard()}
          >
            {updatingCard ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening…
              </>
            ) : (
              "Update Card"
            )}
          </Button>
          <p className="mt-2 text-[11px] text-obsidian/40">
            Managed securely via Stripe.{" "}
            <Link to="/forms/payment-authorization" className="underline">
              Payment Authorization
            </Link>
          </p>
        </section>
      </div>

      <InvoiceTable
        invoices={myInvoices}
        account={account ?? undefined}
        expanded={expanded}
        onToggle={toggle}
      />

      <PaymentHistoryTable payments={myPayments} />
    </div>
  );
}

function InvoiceTable({
  invoices,
  account,
  expanded,
  onToggle,
}: {
  invoices: Invoice[];
  account?: BillingAccount;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
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
            {invoices.map((inv) => (
              <InvoiceRows
                key={inv.id}
                inv={inv}
                account={account}
                expanded={expanded.has(inv.id)}
                onToggle={() => onToggle(inv.id)}
              />
            ))}
            {invoices.length === 0 && (
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
  );
}

function InvoiceRows({
  inv,
  account,
  expanded,
  onToggle,
}: {
  inv: Invoice;
  account?: BillingAccount;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b hairline last:border-0">
        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 min-h-11 text-obsidian font-mono"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {inv.invoiceNumber}
          </button>
        </td>
        <td className="px-4 py-3 text-obsidian/80">
          <Link
            to="/portal/permits/$id"
            params={{ id: inv.projectId }}
            className="hover:underline"
          >
            {inv.projectName}
          </Link>
        </td>
        <td className="px-4 py-3 text-obsidian/60">{inv.issuedAt}</td>
        <td className="px-4 py-3">
          <StatusBadge status={inv.status} />
        </td>
        <td className="px-4 py-3 text-right font-mono text-obsidian">
          {fmtUsd(invoiceTotal(inv))}
        </td>
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
      {expanded && (
        <tr className="bg-obsidian/[0.02]">
          <td colSpan={6} className="px-4 py-3">
            <ul className="divide-y hairline">
              {inv.lineItems.map((li) => (
                <li
                  key={li.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50 mr-2">
                      {li.type}
                    </span>
                    <span className="text-obsidian/80">{li.description}</span>
                  </div>
                  <span className="font-mono text-obsidian shrink-0">
                    {fmtUsd(li.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}

function PaymentHistoryTable({ payments }: { payments: PaymentRecord[] }) {
  return (
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
            {payments.map((p) => (
              <tr key={p.id} className="border-b hairline last:border-0">
                <td className="px-4 py-3 text-obsidian/70">{p.paidAt}</td>
                <td className="px-4 py-3 text-obsidian/70">{p.method}</td>
                <td className="px-4 py-3 text-right font-mono text-obsidian">
                  {fmtUsd(p.amountCents)}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
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
  );
}

// ------------------------------ STAFF VIEW --------------------------------

function StaffView({ tenantFilter }: { tenantFilter: string | null }) {
  const { loading, accounts, invoices, error, refresh } = useLiveBilling(
    tenantFilter,
    true,
  );
  const chargeFn = useServerFn(chargeServiceFeeWithSavedMethod);
  const [busy, setBusy] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState<string | null>(null);
  const [permitPicker, setPermitPicker] = useState<{
    tenantId: string;
    permits: Array<{ id: string; projectName: string; valueCents: number }>;
  } | null>(null);

  async function handleGenerate(tenantId: string) {
    setGenBusy(tenantId);
    try {
      const permits = await listInvoiceablePermits(tenantId);
      if (permits.length === 0) {
        toast.error("No invoiceable permits for this tenant");
        return;
      }
      if (permits.length === 1) {
        const inv = await generateServiceFeeInvoiceForPermit(permits[0].id);
        toast.success(`Generated ${inv.invoiceNumber} for ${inv.projectName}`);
        await refresh();
        return;
      }
      setPermitPicker({ tenantId, permits });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate invoice");
    } finally {
      setGenBusy(null);
    }
  }

  async function confirmGenerate(permitId: string) {
    try {
      const inv = await generateServiceFeeInvoiceForPermit(permitId);
      toast.success(`Generated ${inv.invoiceNumber} for ${inv.projectName}`);
      setPermitPicker(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate invoice");
    }
  }

  async function handleCharge(invoiceId: string, invoiceNumber: string) {
    if (!isPaymentsConfigured()) {
      toast.error("Payments are not configured in this environment.");
      return;
    }
    setBusy(invoiceId);
    try {
      const env = getStripeEnvironment();
      const res = await chargeFn({
        data: { invoiceId, environment: env },
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`${invoiceNumber} charged`, {
        description: `${fmtUsd(res.amountCents)} via ${res.methodLabel}`,
      });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Charge failed");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-obsidian/50 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing…
      </p>
    );
  }
  if (error) {
    return (
      <div className="text-sm text-oxblood">
        {error}{" "}
        <button className="underline" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
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
                const balance = outstandingBalanceForInvoices(invoices, acct.id);
                const overdue = hasOverdueInvoices(invoices, acct.id);
                return (
                  <tr key={acct.id} className="border-b hairline last:border-0">
                    <td className="px-4 py-3 text-obsidian font-medium">{acct.clientName}</td>
                    <td className="px-4 py-3 text-obsidian/70">{acct.planName}</td>
                    <td className="px-4 py-3 text-obsidian/70">{acct.nextChargeDate}</td>
                    <td className="px-4 py-3 text-right font-mono text-obsidian">
                      {fmtUsd(balance)}
                    </td>
                    <td className="px-4 py-3">
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 text-oxblood font-mono text-[10px] uppercase tracking-[0.12em]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                        </span>
                      ) : (
                        <span className="text-obsidian/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9"
                        disabled={genBusy === acct.id}
                        onClick={() => void handleGenerate(acct.id)}
                      >
                        {genBusy === acct.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Generate Invoice"
                        )}
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
                    <td className="px-4 py-3 text-obsidian/70">
                      <Link
                        to="/portal/permits/$id"
                        params={{ id: inv.projectId }}
                        className="hover:underline"
                      >
                        {inv.projectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-obsidian">
                      {fmtUsd(invoiceTotal(inv))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-9"
                          onClick={() => downloadInvoice(inv, acct)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {inv.status !== "paid" && inv.status !== "refunded" && (
                          <Button
                            size="sm"
                            className="min-h-9"
                            disabled={busy === inv.id}
                            onClick={() => void handleCharge(inv.id, inv.invoiceNumber)}
                          >
                            {busy === inv.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1.5" /> Charge Card
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-obsidian/50 italic">
                    No service-fee invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-obsidian/40">
          Charges use the payment method saved via Payment Authorization.
        </p>
      </section>

      {permitPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 p-4">
          <div className="w-full max-w-md rounded-[3px] border hairline bg-white p-5 shadow-lg">
            <h3 className="display-serif text-2xl text-obsidian">Select permit</h3>
            <p className="mt-1 text-sm text-obsidian/60">
              Generate a service-fee invoice for one of these permits.
            </p>
            <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
              {permitPicker.permits.map((p) => (
                <li key={p.id}>
                  <button
                    className="w-full rounded-[3px] border hairline px-3 py-3 text-left text-sm hover:bg-obsidian/[0.03]"
                    onClick={() => void confirmGenerate(p.id)}
                  >
                    <div className="font-medium text-obsidian">{p.projectName}</div>
                    <div className="font-mono text-[11px] text-obsidian/50">
                      Value {fmtUsd(p.valueCents)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setPermitPicker(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
