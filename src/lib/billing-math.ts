/**
 * Pure billing arithmetic. Kept free of Stripe / Supabase so overdue and
 * fee rules can run under tsx.
 */

export type InvoiceStatus = "pending" | "paid" | "refunded" | "overdue";

const OVERDUE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

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

export function mapInvoiceStatus(
  status: string,
  createdAt: string | null,
  nowMs = Date.now(),
): InvoiceStatus {
  if (status === "paid") return "paid";
  if (status === "refunded") return "refunded";
  if (status === "pending" && createdAt) {
    const ageMs = nowMs - new Date(createdAt).getTime();
    if (ageMs > OVERDUE_AFTER_MS) return "overdue";
  }
  return "pending";
}

export function invoiceTotal(invoice: { lineItems: { amountCents: number }[] }): number {
  return invoice.lineItems.reduce((s, l) => s + l.amountCents, 0);
}

export function outstandingBalanceForInvoices(
  invoices: { accountId: string; status: string; lineItems: { amountCents: number }[] }[],
  accountId: string,
): number {
  return invoices
    .filter((i) => i.accountId === accountId && i.status !== "paid" && i.status !== "refunded")
    .reduce((s, i) => s + invoiceTotal(i), 0);
}

export function hasOverdueInvoices(
  invoices: { accountId: string; status: string }[],
  accountId: string,
): boolean {
  return invoices.some((i) => i.accountId === accountId && i.status === "overdue");
}
