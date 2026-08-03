// Live Billing & Invoicing — backed by tenants, subscriptions, and service_fee_invoices.

import { supabase } from "@/integrations/supabase/client";
import { calculateCleardFee } from "@/lib/pricing";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";

export type BillingCycle = "monthly";

export type BillingAccount = {
  id: string; // tenant_id
  clientName: string;
  planName: string;
  billingCycle: BillingCycle;
  nextChargeDate: string;
  monthlyPlatformFeeCents: number;
  perProjectFeeCents: number;
  cardLast4: string;
  cardExp: string;
  stripeCustomerId: string | null;
  subscriptionStatus: string | null;
};

export type LineItemType = "Service Fee" | "Processing Fee";

export type InvoiceLineItem = {
  id: string;
  type: LineItemType;
  description: string;
  amountCents: number;
};

export type InvoiceStatus = "pending" | "paid" | "refunded" | "overdue";

export type Invoice = {
  id: string;
  accountId: string; // tenant_id
  projectId: string; // permit_id
  projectName: string;
  invoiceNumber: string;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  feeCents: number;
  processingFeeCents: number;
  projectValueCents: number;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
};

export type PaymentRecord = {
  id: string;
  accountId: string;
  invoiceId: string;
  amountCents: number;
  paidAt: string;
  method: string;
};

const PLAN_BY_PRICE: Record<string, { name: string; monthlyCents: number }> = {
  cleard_solo_monthly: { name: "Cleard Solo", monthlyCents: 14900 },
  cleard_pro_monthly: { name: "Cleard Pro", monthlyCents: 29900 },
  cleard_firm_monthly: { name: "Cleard Firm", monthlyCents: 59900 },
};

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

function invoiceNumberFromId(id: string, createdAt: string | null): string {
  const y = (createdAt ?? "").slice(0, 4) || "CLR";
  return `CLR-${y}-${id.slice(0, 8).toUpperCase()}`;
}

function mapInvoiceStatus(status: string, createdAt: string | null): InvoiceStatus {
  if (status === "paid") return "paid";
  if (status === "refunded") return "refunded";
  if (status === "pending" && createdAt) {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    if (ageMs > 14 * 24 * 60 * 60 * 1000) return "overdue";
  }
  return "pending";
}

function rowToInvoice(row: any): Invoice {
  const feeCents = Number(row.fee_cents ?? 0);
  const processingFeeCents = Number(row.processing_fee_cents ?? 0);
  const projectValueCents = Number(row.project_value_cents ?? 0);
  const permit = row.permits ?? null;
  const projectName =
    permit?.project_name ||
    permit?.job_address ||
    "Permit";
  const issuedAt = (row.created_at ?? new Date().toISOString()).slice(0, 10);
  const dueDate = row.created_at
    ? new Date(new Date(row.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : issuedAt;
  const status = mapInvoiceStatus(row.status, row.created_at);
  return {
    id: row.id,
    accountId: row.tenant_id ?? permit?.tenant_id ?? "",
    projectId: row.permit_id,
    projectName,
    invoiceNumber: invoiceNumberFromId(row.id, row.created_at),
    issuedAt,
    dueAt: dueDate,
    status,
    feeCents,
    processingFeeCents,
    projectValueCents,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    paidAt: row.paid_at ? String(row.paid_at).slice(0, 10) : null,
    lineItems: [
      {
        id: `${row.id}-fee`,
        type: "Service Fee",
        description: `Cleard service fee — ${projectName}`,
        amountCents: feeCents,
      },
      {
        id: `${row.id}-proc`,
        type: "Processing Fee",
        description: "Payment processing fee (2.9% + $0.30)",
        amountCents: processingFeeCents,
      },
    ].filter((li) => li.amountCents > 0),
  };
}

export function invoiceTotal(invoice: Invoice): number {
  return invoice.lineItems.reduce((s, l) => s + l.amountCents, 0);
}

function environmentFilter(): string | null {
  try {
    return isPaymentsConfigured() ? getStripeEnvironment() : "sandbox";
  } catch {
    return "sandbox";
  }
}

export async function listServiceFeeInvoices(opts?: {
  tenantId?: string | null;
}): Promise<Invoice[]> {
  const env = environmentFilter();
  let q = (supabase.from("service_fee_invoices" as any) as any)
    .select(
      "id, permit_id, tenant_id, project_value_cents, fee_cents, processing_fee_cents, status, stripe_payment_intent_id, paid_at, created_at, permits:permit_id ( id, project_name, job_address, tenant_id, contractor_company )",
    )
    .order("created_at", { ascending: false });
  if (env) q = q.eq("environment", env);
  if (opts?.tenantId) q = q.eq("tenant_id", opts.tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as any[]).map(rowToInvoice);
}

export async function listBillingAccounts(): Promise<BillingAccount[]> {
  // Admins see all tenants; GCs only see their own via RLS on tenants/memberships.
  const { data: tenants, error: tErr } = await (supabase.from("tenants" as any) as any)
    .select("id, name")
    .order("name", { ascending: true });
  if (tErr) throw tErr;

  const env = environmentFilter();
  let subQ = (supabase.from("subscriptions" as any) as any)
    .select(
      "id, tenant_id, user_id, status, price_id, product_id, stripe_customer_id, current_period_end, environment",
    )
    .order("created_at", { ascending: false });
  if (env) subQ = subQ.eq("environment", env);
  const { data: subs } = await subQ;

  const subByTenant = new Map<string, any>();
  for (const s of (subs ?? []) as any[]) {
    const tid = s.tenant_id as string | null;
    if (tid && !subByTenant.has(tid)) subByTenant.set(tid, s);
  }

  const invoices = await listServiceFeeInvoices();
  const tenantIdsWithInvoices = new Set(invoices.map((i) => i.accountId).filter(Boolean));

  const accounts: BillingAccount[] = ((tenants ?? []) as any[]).map((t) => {
    const sub = subByTenant.get(t.id);
    const planMeta = sub ? PLAN_BY_PRICE[sub.price_id] : undefined;
    return {
      id: t.id as string,
      clientName: (t.name as string) || "Tenant",
      planName: planMeta?.name ?? (sub ? "Cleard Subscription" : "No subscription"),
      billingCycle: "monthly" as const,
      nextChargeDate: sub?.current_period_end
        ? String(sub.current_period_end).slice(0, 10)
        : "—",
      monthlyPlatformFeeCents: planMeta?.monthlyCents ?? 0,
      perProjectFeeCents: 0,
      cardLast4: "————",
      cardExp: "—",
      stripeCustomerId: (sub?.stripe_customer_id as string) ?? null,
      subscriptionStatus: (sub?.status as string) ?? null,
    };
  });

  // Keep tenants that have a subscription or any service-fee invoice.
  return accounts.filter(
    (a) => a.stripeCustomerId || tenantIdsWithInvoices.has(a.id) || a.planName !== "No subscription",
  );
}

export async function listPaymentsFromInvoices(invoices: Invoice[]): Promise<PaymentRecord[]> {
  return invoices
    .filter((i) => i.status === "paid" && i.paidAt)
    .map((i) => ({
      id: `pay_${i.id}`,
      accountId: i.accountId,
      invoiceId: i.id,
      amountCents: invoiceTotal(i),
      paidAt: i.paidAt!,
      method: "Stripe",
    }))
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
}

export function outstandingBalanceForInvoices(invoices: Invoice[], accountId: string): number {
  return invoices
    .filter((i) => i.accountId === accountId && i.status !== "paid" && i.status !== "refunded")
    .reduce((s, i) => s + invoiceTotal(i), 0);
}

export function hasOverdueInvoices(invoices: Invoice[], accountId: string): boolean {
  return invoices.some((i) => i.accountId === accountId && i.status === "overdue");
}

/** Create a pending service_fee_invoices row for a permit (staff "Generate Invoice"). */
export async function generateServiceFeeInvoiceForPermit(permitId: string): Promise<Invoice> {
  const { data: permit, error: pErr } = await (supabase.from("permits" as any) as any)
    .select("id, tenant_id, project_name, job_address, total_project_value_cents, construction_value_cents")
    .eq("id", permitId)
    .single();
  if (pErr) throw pErr;

  const valueCents = Number(
    permit.total_project_value_cents ?? permit.construction_value_cents ?? 0,
  );
  if (!valueCents || valueCents <= 0) {
    throw new Error("Permit has no project value — set Total Project Value before invoicing.");
  }

  const env = environmentFilter() ?? "sandbox";
  const { data: existing } = await (supabase.from("service_fee_invoices" as any) as any)
    .select("id, status")
    .eq("permit_id", permitId)
    .eq("environment", env)
    .neq("status", "refunded")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing && existing.status !== "paid") {
    throw new Error("A pending service-fee invoice already exists for this permit.");
  }
  if (existing && existing.status === "paid") {
    throw new Error("Service fee is already paid for this permit.");
  }

  const projectValueUsd = valueCents / 100;
  const feeCents = Math.round(calculateCleardFee(projectValueUsd) * 100);
  const processingFeeCents = Math.round(feeCents * 0.029 + 30);

  const { data, error } = await (supabase.from("service_fee_invoices" as any) as any)
    .insert({
      permit_id: permitId,
      tenant_id: permit.tenant_id ?? null,
      project_value_cents: valueCents,
      fee_cents: feeCents,
      processing_fee_cents: processingFeeCents,
      status: "pending",
      environment: env,
    })
    .select(
      "id, permit_id, tenant_id, project_value_cents, fee_cents, processing_fee_cents, status, stripe_payment_intent_id, paid_at, created_at, permits:permit_id ( id, project_name, job_address, tenant_id, contractor_company )",
    )
    .single();
  if (error) throw error;
  return rowToInvoice(data);
}

/** List permits for a tenant that can still be invoiced (no unpaid/paid open invoice). */
export async function listInvoiceablePermits(tenantId: string): Promise<
  Array<{ id: string; projectName: string; valueCents: number }>
> {
  const { data: permits, error } = await (supabase.from("permits" as any) as any)
    .select("id, project_name, job_address, total_project_value_cents, construction_value_cents")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const env = environmentFilter();
  let invQ = (supabase.from("service_fee_invoices" as any) as any)
    .select("permit_id, status")
    .eq("tenant_id", tenantId);
  if (env) invQ = invQ.eq("environment", env);
  const { data: invs } = await invQ;
  const blocked = new Set(
    ((invs ?? []) as any[])
      .filter((i) => i.status === "pending" || i.status === "paid")
      .map((i) => i.permit_id as string),
  );

  return ((permits ?? []) as any[])
    .filter((p) => !blocked.has(p.id))
    .map((p) => ({
      id: p.id as string,
      projectName: (p.project_name as string) || (p.job_address as string) || "Permit",
      valueCents: Number(p.total_project_value_cents ?? p.construction_value_cents ?? 0),
    }));
}
