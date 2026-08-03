import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";
import { calculateCleardFee, getCleardTier } from "@/lib/pricing.ts";

type CheckoutResult = { clientSecret: string } | { error: string };
type PortalResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

function getTierProductId(tier: 1 | 2 | 3): string {
  const envKey = `STRIPE_TIER_${tier}_PRODUCT_ID`;
  const id = process.env[envKey];
  if (!id) throw new Error(`${envKey} is not configured`);
  return id;
}

function getTier1PriceId(): string {
  const id = process.env.STRIPE_TIER_1_PRICE_ID;
  if (!id) throw new Error("STRIPE_TIER_1_PRICE_ID is not configured");
  return id;
}

/**
 * Subscription checkout — Cleard Solo / Pro / Firm.
 */
export const createSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceId: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, claims } = context;
      const email = (claims as any)?.email as string | undefined;
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Cleard per-project service fee checkout.
 * Three fixed/variable pricing tiers based on project contract value.
 * Processing fee (2.9% + $0.30) added as a second line item.
 */
export const createServiceFeeCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    permitId: string;
    projectAddress: string;
    projectValueUsd: number;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-f0-9-]{36}$/i.test(data.permitId)) throw new Error("Invalid permitId");
    if (!data.projectValueUsd || data.projectValueUsd <= 0) {
      throw new Error("Project value must be greater than zero");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, claims, supabase } = context;
      const email = (claims as any)?.email as string | undefined;
      const stripe = createStripeClient(data.environment);

      const tier = getCleardTier(data.projectValueUsd);
      const feeDollars = calculateCleardFee(data.projectValueUsd);
      const feeCents = Math.round(feeDollars * 100);
      const processingCents = Math.round(feeCents * 0.029 + 30);

      const tierProductId = getTierProductId(tier);
      const serviceFeeLineItem =
        tier === 1
          ? {
              price: getTier1PriceId(),
              quantity: 1,
            }
          : {
              price_data: {
                currency: "usd",
                product: tierProductId,
                unit_amount: feeCents,
              },
              quantity: 1,
            };

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const { data: permitRow } = await (supabase.from("permits" as any) as any)
        .select("tenant_id")
        .eq("id", data.permitId)
        .maybeSingle();
      const tenantId = (permitRow as any)?.tenant_id ?? null;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          serviceFeeLineItem,
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Payment processing fee (2.9% + $0.30)" },
              unit_amount: processingCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: {
          description: `Cleard Service Fee — ${data.projectAddress}`,
          metadata: { permitId: data.permitId, userId },
        },
        metadata: { permitId: data.permitId, userId, kind: "service_fee" },
      });

      // Record pending invoice row (idempotent by session).
      await supabase.from("service_fee_invoices" as any).insert({
        permit_id: data.permitId,
        tenant_id: tenantId,
        project_value_cents: Math.round(data.projectValueUsd * 100),
        fee_cents: feeCents,
        processing_fee_cents: processingCents,
        status: "pending",
        stripe_checkout_session_id: session.id,
        environment: data.environment,
      } as any);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Stripe billing portal — subscription management.
 */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;
    const { data: sub } = await (supabase.from("subscriptions" as any) as any)
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found" };

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Payment Authorization — Stripe native "setup mode" checkout.
 * Collects and vaults a card / US bank account on Stripe. No card data
 * ever touches Cleard servers or this codebase.
 */
export const createPaymentAuthSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const { userId, claims } = context;
      const email = (claims as any)?.email as string | undefined;
      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        currency: "usd",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId, kind: "payment_auth" },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type SavedMethod = {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
};

/**
 * Payment methods currently vaulted on Stripe for the signed-in user.
 */
export const listSavedPaymentMethods = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<{ methods: SavedMethod[] } | { error: string }> => {
    try {
      const { userId, claims } = context;
      const email = (claims as any)?.email as string | undefined;
      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const list = await stripe.paymentMethods.list({ customer: customerId, limit: 10 });
      return {
        methods: list.data.map((pm) => ({
          id: pm.id,
          type: pm.type,
          brand: pm.card?.brand ?? (pm.type === "us_bank_account" ? "ACH" : pm.type),
          last4: pm.card?.last4 ?? pm.us_bank_account?.last4 ?? "",
          expMonth: pm.card?.exp_month ?? null,
          expYear: pm.card?.exp_year ?? null,
        })),
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type ChargeResult =
  | { ok: true; paymentIntentId: string; amountCents: number; methodLabel: string }
  | { error: string };

/**
 * Charge a pending service_fee_invoices row using a payment method already
 * vaulted via Payment Authorization (setup-mode Checkout).
 * Staff "Mark Paid" on /portal/billing uses this instead of a manual toggle.
 */
export const chargeServiceFeeWithSavedMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    invoiceId: string;
    environment: StripeEnv;
    paymentMethodId?: string;
  }) => {
    if (!/^[a-f0-9-]{36}$/i.test(data.invoiceId)) throw new Error("Invalid invoiceId");
    return data;
  })
  .handler(async ({ data, context }): Promise<ChargeResult> => {
    try {
      const { userId, claims, supabase } = context;
      const email = (claims as any)?.email as string | undefined;
      const stripe = createStripeClient(data.environment);

      const { data: invoice, error: invErr } = await (supabase.from("service_fee_invoices" as any) as any)
        .select("id, permit_id, tenant_id, fee_cents, processing_fee_cents, status, environment")
        .eq("id", data.invoiceId)
        .maybeSingle();
      if (invErr) return { error: invErr.message };
      if (!invoice) return { error: "Invoice not found" };
      if (invoice.status === "paid") return { error: "Invoice is already paid" };
      if (invoice.status === "refunded") return { error: "Invoice was refunded" };

      const amountCents =
        Number(invoice.fee_cents ?? 0) + Number(invoice.processing_fee_cents ?? 0);
      if (amountCents <= 0) return { error: "Invoice has no chargeable amount" };

      // Prefer the tenant's Stripe customer from subscriptions; fall back to caller.
      let customerId: string | null = null;
      if (invoice.tenant_id) {
        const { data: sub } = await (supabase.from("subscriptions" as any) as any)
          .select("stripe_customer_id, user_id")
          .eq("tenant_id", invoice.tenant_id)
          .eq("environment", data.environment)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (sub?.stripe_customer_id) customerId = sub.stripe_customer_id as string;
      }
      if (!customerId) {
        customerId = await resolveOrCreateCustomer(stripe, { email, userId });
      }

      const methods = await stripe.paymentMethods.list({ customer: customerId, limit: 10 });
      if (!methods.data.length) {
        return {
          error:
            "No saved payment method on file. Have the GC complete Payment Authorization first.",
        };
      }

      const pm =
        (data.paymentMethodId
          ? methods.data.find((m) => m.id === data.paymentMethodId)
          : undefined) ?? methods.data[0];

      const methodLabel =
        pm.card
          ? `Card ending ${pm.card.last4}`
          : pm.us_bank_account
            ? `ACH ending ${pm.us_bank_account.last4}`
            : pm.type;

      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        customer: customerId,
        payment_method: pm.id,
        confirm: true,
        off_session: true,
        description: `Cleard Service Fee — invoice ${invoice.id}`,
        metadata: {
          kind: "service_fee",
          invoiceId: invoice.id,
          permitId: invoice.permit_id,
          chargedBy: userId,
        },
      });

      if (intent.status !== "succeeded" && intent.status !== "processing") {
        return {
          error: `Payment did not succeed (status: ${intent.status}).`,
        };
      }

      const paidAt = new Date().toISOString();
      const { error: updErr } = await (supabase.from("service_fee_invoices" as any) as any)
        .update({
          status: "paid",
          paid_at: paidAt,
          stripe_payment_intent_id: intent.id,
          updated_at: paidAt,
        })
        .eq("id", invoice.id);
      if (updErr) return { error: updErr.message };

      return {
        ok: true,
        paymentIntentId: intent.id,
        amountCents,
        methodLabel,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
