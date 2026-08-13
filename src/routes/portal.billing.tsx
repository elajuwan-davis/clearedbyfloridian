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
import { PageShell, Panel, KV, StatusChip, TableShell, Segmented } from "@/components/ui-kit";
import { InvoicesView } from "@/components/invoices-view";

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

const STATUS_TONE: Record<InvoiceStatus, "info" | "success" | "danger" | "neutral"> = {
  pending: "info",
  paid: "success",
  overdue: "danger",
  refunded: "neutral",
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusChip tone={STATUS_TONE[status]}>{status}</StatusChip>;
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
  const [tab, setTab] = useState<"billing" | "invoices">("billing");

  return (
    <PageShell
      crumbs={[{ label: "Account" }, { label: "Billing & Invoices" }]}
      title="Billing & Invoices"
      meta={
        session.loading
          ? "Loading…"
          : staff
            ? "Manage GC tenants, service-fee invoices, and saved payment methods."
            : "Subscription, per-project service fees, and payment history."
      }
    >
      <div className="mb-4">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "billing", label: "Billing" },
            { value: "invoices", label: "Invoices" },
          ]}
        />
      </div>

      {session.loading ? (
        <div className="p-12 text-center text-[12.5px] text-muted-foreground">Loading billing…</div>
      ) : tab === "invoices" ? (
        <InvoicesView />
      ) : staff ? (
        <StaffView tenantFilter={session.effectiveTenantId} />
      ) : (
        <GcView tenantId={session.effectiveTenantId} />
      )}
    </PageShell>
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
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="Active Subscription">
          <div className="text-[15px] font-semibold">{account?.planName ?? "—"}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <KV label="Billing cycle">
              <span className="capitalize">{account?.billingCycle ?? "monthly"}</span>
            </KV>
            <KV label="Next charge date">{account?.nextChargeDate ?? "—"}</KV>
            <KV label="Monthly platform fee">{fmtUsd(account?.monthlyPlatformFeeCents ?? 0)}</KV>
            {totalOutstanding > 0 && (
              <KV label="Outstanding balance">
                <span className="text-[var(--p-danger)] font-semibold">{fmtUsd(totalOutstanding)}</span>
              </KV>
            )}
          </div>
        </Panel>

        <Panel title="Card On File">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            <div>
              <div className="text-[13px]">
                •••• •••• •••• {card?.last4 ?? account?.cardLast4 ?? "————"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {card?.brand ? `${card.brand} · ` : ""}
                Expires {card?.exp ?? account?.cardExp ?? "—"}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 p-btn p-btn-ghost disabled:opacity-60"
            disabled={updatingCard}
            onClick={() => void handleUpdateCard()}
          >
            {updatingCard ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening…
              </>
            ) : (
              "Update Card"
            )}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Managed securely via Stripe.{" "}
            <Link to="/forms/payment-authorization" className="underline">
              Payment Authorization
            </Link>
          </p>
        </Panel>
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
    <Panel title="Project Invoices" padded={false}>
      <TableShell>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Project</th>
            <th>Issued</th>
            <th>Status</th>
            <th className="text-right">Total</th>
            <th className="text-right">Actions</th>
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
              <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground italic">
                No invoices yet.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>
    </Panel>
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
      <tr>
        <td>
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {inv.invoiceNumber}
          </button>
        </td>
        <td>
          <Link
            to="/portal/permits/$id"
            params={{ id: inv.projectId }}
            className="hover:underline"
          >
            {inv.projectName}
          </Link>
        </td>
        <td className="text-muted-foreground">{inv.issuedAt}</td>
        <td>
          <StatusBadge status={inv.status} />
        </td>
        <td className="text-right">
          {fmtUsd(invoiceTotal(inv))}
        </td>
        <td className="text-right">
          <button
            type="button"
            className="p-btn p-btn-ghost p-btn-sm"
            onClick={() => downloadInvoice(inv, account)}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-[var(--p-card-2)]">
            <ul className="divide-y divide-[var(--p-border)]">
              {inv.lineItems.map((li) => (
                <li
                  key={li.id}
                  className="flex items-center justify-between gap-3 py-2 text-[12.5px]"
                >
                  <div>
                    <span className="text-[10.5px] uppercase tracking-[0.07em] text-muted-foreground mr-2">
                      {li.type}
                    </span>
                    <span>{li.description}</span>
                  </div>
                  <span className="shrink-0">
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
    <Panel title="Payment History" padded={false}>
      <TableShell>
        <thead>
          <tr>
            <th>Date</th>
            <th>Method</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="text-muted-foreground">{p.paidAt}</td>
              <td className="text-muted-foreground">{p.method}</td>
              <td className="text-right">
                {fmtUsd(p.amountCents)}
              </td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground italic">
                No payments recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>
    </Panel>
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
    <div className="space-y-4">
      <Panel title="GC Billing Accounts" padded={false}>
        <TableShell>
          <thead>
            <tr>
              <th>Client</th>
              <th>Plan</th>
              <th>Next Charge</th>
              <th className="text-right">Outstanding</th>
              <th>Overdue</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acct) => {
              const balance = outstandingBalanceForInvoices(invoices, acct.id);
              const overdue = hasOverdueInvoices(invoices, acct.id);
              return (
                <tr key={acct.id}>
                  <td className="font-medium">{acct.clientName}</td>
                  <td className="text-muted-foreground">{acct.planName}</td>
                  <td className="text-muted-foreground">{acct.nextChargeDate}</td>
                  <td className="text-right">
                    {fmtUsd(balance)}
                  </td>
                  <td>
                    {overdue ? (
                      <StatusChip tone="danger">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                      </StatusChip>
                    ) : (
                      <span className="text-muted-foreground text-[12px]">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="p-btn p-btn-ghost p-btn-sm disabled:opacity-60"
                      disabled={genBusy === acct.id}
                      onClick={() => void handleGenerate(acct.id)}
                    >
                      {genBusy === acct.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Generate Invoice"
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground italic">
                  No billing accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      </Panel>

      <Panel title="All Invoices" padded={false} meta="Charges use the payment method saved via Payment Authorization.">
        <TableShell>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Project</th>
              <th>Status</th>
              <th className="text-right">Total</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const acct = accounts.find((a) => a.id === inv.accountId);
              return (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td className="text-muted-foreground">{acct?.clientName ?? "—"}</td>
                  <td className="text-muted-foreground">
                    <Link
                      to="/portal/permits/$id"
                      params={{ id: inv.projectId }}
                      className="hover:underline"
                    >
                      {inv.projectName}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="text-right">
                    {fmtUsd(invoiceTotal(inv))}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        className="p-btn p-btn-ghost p-btn-sm"
                        onClick={() => downloadInvoice(inv, acct)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {inv.status !== "paid" && inv.status !== "refunded" && (
                        <button
                          type="button"
                          className="p-btn p-btn-primary p-btn-sm disabled:opacity-60"
                          disabled={busy === inv.id}
                          onClick={() => void handleCharge(inv.id, inv.invoiceNumber)}
                        >
                          {busy === inv.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" /> Charge Card
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground italic">
                  No service-fee invoices yet.
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      </Panel>

      {permitPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md p-plate p-4 shadow-lg">
            <h3 className="text-[15px] font-semibold">Select permit</h3>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Generate a service-fee invoice for one of these permits.
            </p>
            <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
              {permitPicker.permits.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full p-surface-flat px-3 py-2.5 text-left text-[12.5px] hover:bg-white/[0.06]"
                    onClick={() => void confirmGenerate(p.id)}
                  >
                    <div className="font-medium">{p.projectName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Value {fmtUsd(p.valueCents)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-end">
              <button type="button" className="p-btn p-btn-ghost" onClick={() => setPermitPicker(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
