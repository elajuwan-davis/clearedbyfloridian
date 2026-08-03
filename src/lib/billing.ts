// Billing & Invoicing — localStorage-backed mock store for GC billing accounts,
// invoices, line items, and payment history.

import { PROJECTS } from "./projects-data";

export type BillingCycle = "monthly";

export type BillingAccount = {
  id: string;
  clientName: string; // matches Project.client for a GC/company
  planName: string; // "Cléared Pro"
  billingCycle: BillingCycle;
  nextChargeDate: string; // ISO yyyy-mm-dd
  monthlyPlatformFeeCents: number;
  perProjectFeeCents: number;
  cardLast4: string;
  cardExp: string; // MM/YY
};

export type LineItemType =
  | "Platform Fee"
  | "Per-Project Fee"
  | "Transaction Fee"
  | "Permit Fee Pass-Through";

export type InvoiceLineItem = {
  id: string;
  type: LineItemType;
  description: string;
  amountCents: number;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type Invoice = {
  id: string;
  accountId: string;
  projectId: string;
  invoiceNumber: string;
  issuedAt: string; // ISO
  dueAt: string; // ISO
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
};

export type PaymentRecord = {
  id: string;
  accountId: string;
  invoiceId: string;
  amountCents: number;
  paidAt: string; // ISO
  method: string; // e.g. "Card ending 4242"
};

const ACCOUNTS_KEY = "cleared.billingAccounts.v1";
const INVOICES_KEY = "cleared.billingInvoices.v1";
const PAYMENTS_KEY = "cleared.billingPayments.v1";
const SEEDED_KEY = "cleared.billingSeeded.v1";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[], eventName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(eventName));
}

export function fmtUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 50% of savings vs standard municipal fee; 0 when there is no savings. */
export function computeTransactionFee(
  standardMunicipalFeeCents: number,
  privateProviderFeeCents: number,
): { savingsCents: number; feeCents: number } {
  const savingsCents = Math.max(0, standardMunicipalFeeCents - privateProviderFeeCents);
  const feeCents = Math.round(savingsCents * 0.5);
  return { savingsCents, feeCents };
}

function id() {
  return Math.random().toString(36).slice(2, 10);
}

// ---- Seed generation -------------------------------------------------

const CLIENTS = Array.from(new Set(PROJECTS.map((p) => p.client))).filter((c) => c !== "TBD");

function seedAccounts(): BillingAccount[] {
  // Group projects loosely by client "company" — take a handful of GCs.
  const gcNames = [
    "Watlee Construction",
    "Cannatelli Builders (Perle)",
    "Gonzalo Garcia",
    "Christian Youngblood",
  ].filter((n) => CLIENTS.includes(n));

  const plans = ["Cléared Pro", "Cléared Growth", "Cléared Pro", "Cléared Starter"];
  const fees = [29900, 49900, 29900, 14900];
  const perProject = [7500, 9500, 7500, 5000];

  return gcNames.map((client, i) => ({
    id: `acct_${id()}`,
    clientName: client,
    planName: plans[i % plans.length],
    billingCycle: "monthly" as const,
    nextChargeDate: `2026-0${((i % 3) + 6)}-01`,
    monthlyPlatformFeeCents: fees[i % fees.length],
    perProjectFeeCents: perProject[i % perProject.length],
    cardLast4: ["4242", "1881", "0005", "3311"][i % 4],
    cardExp: ["09/27", "03/26", "11/28", "06/27"][i % 4],
  }));
}

function seedInvoicesAndPayments(accounts: BillingAccount[]): {
  invoices: Invoice[];
  payments: PaymentRecord[];
} {
  const invoices: Invoice[] = [];
  const payments: PaymentRecord[] = [];
  let counter = 1001;

  for (const acct of accounts) {
    const projects = PROJECTS.filter((p) => p.client === acct.clientName).slice(0, 3);
    projects.forEach((project, idx) => {
      const standardFee = 385000; // $3,850 typical municipal plan-review + permit fee
      const privateFee = 265000; // $2,650 via private provider (2-day plan review)
      const { savingsCents, feeCents } = computeTransactionFee(standardFee, privateFee);
      const lineItems: InvoiceLineItem[] = [
        {
          id: id(),
          type: "Platform Fee",
          description: `${acct.planName} — monthly platform subscription`,
          amountCents: acct.monthlyPlatformFeeCents,
        },
        {
          id: id(),
          type: "Per-Project Fee",
          description: `Per-project fee — ${project.name}`,
          amountCents: acct.perProjectFeeCents,
        },
        {
          id: id(),
          type: "Transaction Fee",
          description: `50% of $${(savingsCents / 100).toFixed(2)} saved via private provider (same-day inspections)`,
          amountCents: feeCents,
        },
        {
          id: id(),
          type: "Permit Fee Pass-Through",
          description: `${project.county} County permit fees — pass-through at cost`,
          amountCents: privateFee,
        },
      ];
      const status: InvoiceStatus = idx === 0 ? "paid" : idx === 1 ? "sent" : "overdue";
      const invoice: Invoice = {
        id: `inv_${id()}`,
        accountId: acct.id,
        projectId: project.id,
        invoiceNumber: `CLR-${counter++}`,
        issuedAt: "2026-05-01",
        dueAt: "2026-05-15",
        status,
        lineItems,
      };
      invoices.push(invoice);
      if (status === "paid") {
        payments.push({
          id: `pay_${id()}`,
          accountId: acct.id,
          invoiceId: invoice.id,
          amountCents: lineItems.reduce((s, l) => s + l.amountCents, 0),
          paidAt: "2026-05-10",
          method: `Card ending ${acct.cardLast4}`,
        });
      }
    });
  }
  return { invoices, payments };
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEEDED_KEY)) return;
  const accounts = seedAccounts();
  const { invoices, payments } = seedInvoicesAndPayments(accounts);
  write(ACCOUNTS_KEY, accounts, "billing:changed");
  write(INVOICES_KEY, invoices, "billing:changed");
  write(PAYMENTS_KEY, payments, "billing:changed");
  window.localStorage.setItem(SEEDED_KEY, "1");
}

// ---- Public API --------------------------------------------------------

export function listAccounts(): BillingAccount[] {
  ensureSeeded();
  return read<BillingAccount>(ACCOUNTS_KEY);
}

export function getAccountByClient(clientName: string): BillingAccount | undefined {
  return listAccounts().find((a) => a.clientName === clientName);
}

export function listInvoices(): Invoice[] {
  ensureSeeded();
  return read<Invoice>(INVOICES_KEY).sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

export function listInvoicesForAccount(accountId: string): Invoice[] {
  return listInvoices().filter((i) => i.accountId === accountId);
}

export function listPayments(): PaymentRecord[] {
  ensureSeeded();
  return read<PaymentRecord>(PAYMENTS_KEY).sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
}

export function listPaymentsForAccount(accountId: string): PaymentRecord[] {
  return listPayments().filter((p) => p.accountId === accountId);
}

export function invoiceTotal(invoice: Invoice): number {
  return invoice.lineItems.reduce((s, l) => s + l.amountCents, 0);
}

export function generateInvoice(
  projectId: string,
  extraLineItems: Omit<InvoiceLineItem, "id">[] = [],
): Invoice | null {
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) return null;
  const account = getAccountByClient(project.client);
  if (!account) return null;

  const existing = listInvoices();
  const counter = 1001 + existing.length;

  const lineItems: InvoiceLineItem[] = [
    {
      id: id(),
      type: "Platform Fee",
      description: `${account.planName} — monthly platform subscription`,
      amountCents: account.monthlyPlatformFeeCents,
    },
    {
      id: id(),
      type: "Per-Project Fee",
      description: `Per-project fee — ${project.name}`,
      amountCents: account.perProjectFeeCents,
    },
    ...extraLineItems.map((li) => ({ ...li, id: id() })),
  ];

  const today = new Date();
  const due = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const invoice: Invoice = {
    id: `inv_${id()}`,
    accountId: account.id,
    projectId: project.id,
    invoiceNumber: `CLR-${counter}`,
    issuedAt: today.toISOString().slice(0, 10),
    dueAt: due.toISOString().slice(0, 10),
    status: "sent",
    lineItems,
  };

  write(INVOICES_KEY, [invoice, ...existing], "billing:changed");
  return invoice;
}

export function markPaid(invoiceId: string): void {
  const invoices = listInvoices();
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice || invoice.status === "paid") return;
  const updated = invoices.map((i) => (i.id === invoiceId ? { ...i, status: "paid" as const } : i));
  write(INVOICES_KEY, updated, "billing:changed");

  const account = listAccounts().find((a) => a.id === invoice.accountId);
  const payments = listPayments();
  const payment: PaymentRecord = {
    id: `pay_${id()}`,
    accountId: invoice.accountId,
    invoiceId: invoice.id,
    amountCents: invoiceTotal(invoice),
    paidAt: new Date().toISOString().slice(0, 10),
    method: account ? `Card ending ${account.cardLast4}` : "Manual payment",
  };
  write(PAYMENTS_KEY, [payment, ...payments], "billing:changed");
}

export function addLineItemToInvoice(invoiceId: string, item: Omit<InvoiceLineItem, "id">): void {
  const invoices = listInvoices();
  const updated = invoices.map((i) =>
    i.id === invoiceId ? { ...i, lineItems: [...i.lineItems, { ...item, id: id() }] } : i,
  );
  write(INVOICES_KEY, updated, "billing:changed");
}

export function outstandingBalanceForAccount(accountId: string): number {
  return listInvoicesForAccount(accountId)
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + invoiceTotal(i), 0);
}

export function hasOverdue(accountId: string): boolean {
  return listInvoicesForAccount(accountId).some((i) => i.status === "overdue");
}
