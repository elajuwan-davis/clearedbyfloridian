// 3-month free trial → paid subscription, end to end.
//
// The clock starts at sign-up (tenants.trial_started_at), not when the card is added: whatever
// day a contractor gets round to authorizing payment, Stripe is told how many days are LEFT of
// the 90, so the first charge always lands 3 months after they signed up. Stripe owns the
// charge itself (subscription trial), and the existing payments webhook keeps
// public.subscriptions in step — nothing here has to run on a timer.
//
// The card step is skippable exactly once: card_prompt_dismissed_at stops the dialog from
// reappearing, and the dashboard banner carries the ask from then on.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { TRIAL_DAYS, TRIAL_PLANS } from "@/lib/trial-plans";

const MS_PER_DAY = 86_400_000;

export type TrialBillingStatus = {
  /** 'trial' | 'full' — a full (invited/managed) tenant is never asked for a card here. */
  plan: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  /** Whole days left of the free trial; 0 once it has run out. */
  daysLeft: number;
  /** True once Stripe holds a card and a subscription exists for this tenant. */
  cardOnFile: boolean;
  subscriptionStatus: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  /** They chose "add it later" — the dialog is done, the banner takes over. */
  promptDismissed: boolean;
  /** The first-login walkthrough is finished, so the card step is due. */
  tourCompleted: boolean;
};

const ACTIVE_STATUSES = ["trialing", "active", "past_due", "incomplete"];

function daysLeftFrom(trialStartedAt: string | null): { endsAt: string | null; daysLeft: number } {
  if (!trialStartedAt) return { endsAt: null, daysLeft: TRIAL_DAYS };
  const start = new Date(trialStartedAt).getTime();
  if (!Number.isFinite(start)) return { endsAt: null, daysLeft: TRIAL_DAYS };
  const end = start + TRIAL_DAYS * MS_PER_DAY;
  const left = Math.ceil((end - Date.now()) / MS_PER_DAY);
  return { endsAt: new Date(end).toISOString(), daysLeft: Math.max(0, left) };
}

async function tenantFor(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { data: member } = await admin
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  const tenantId = member?.tenant_id as string | undefined;
  if (!tenantId) return { admin, tenantId: null as string | null, tenant: null as any };
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, plan, trial_started_at, card_prompt_dismissed_at, tour_completed_at, created_at")
    .eq("id", tenantId)
    .maybeSingle();
  return { admin, tenantId, tenant };
}

export const getTrialBillingStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: StripeEnv }) => d)
  .handler(async ({ data, context }): Promise<TrialBillingStatus> => {
    const { admin, tenantId, tenant } = await tenantFor(context.userId);

    const started = (tenant?.trial_started_at ?? tenant?.created_at ?? null) as string | null;
    const { endsAt, daysLeft } = daysLeftFrom(started);

    let sub: any = null;
    if (tenantId) {
      const { data: rows } = await admin
        .from("subscriptions")
        .select("status, price_id, current_period_end, created_at")
        .eq("tenant_id", tenantId)
        .eq("environment", data.environment)
        .order("created_at", { ascending: false })
        .limit(1);
      sub = (rows ?? [])[0] ?? null;
    }

    return {
      plan: String(tenant?.plan ?? "trial"),
      trialStartedAt: started,
      trialEndsAt: endsAt,
      daysLeft,
      cardOnFile: !!sub && ACTIVE_STATUSES.includes(String(sub.status)),
      subscriptionStatus: sub ? String(sub.status) : null,
      priceId: sub ? (sub.price_id as string) : null,
      currentPeriodEnd: sub ? (sub.current_period_end as string | null) : null,
      promptDismissed: !!tenant?.card_prompt_dismissed_at,
      tourCompleted: !!tenant?.tour_completed_at,
    };
  });

/**
 * Opens embedded checkout for the chosen tier with the REMAINING trial days attached, so the
 * first invoice falls 3 months after sign-up. No money moves now; the card is only authorized.
 */
export const startTrialSubscriptionCheckoutFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!TRIAL_PLANS.some((p) => p.priceId === d.priceId)) throw new Error("Unknown plan");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const { userId, claims } = context;
      const email = (claims as any)?.email as string | undefined;
      const { tenantId, tenant } = await tenantFor(userId);
      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Plan pricing is not configured yet");
      const price = prices.data[0];

      // Reuse/annotate the Stripe customer so later reads resolve by userId.
      let customerId: string | undefined;
      if (/^[a-zA-Z0-9_-]+$/.test(userId)) {
        const found = await stripe.customers.search({
          query: `metadata['userId']:'${userId}'`,
          limit: 1,
        });
        customerId = found.data[0]?.id;
      }
      if (!customerId && email) {
        const existing = await stripe.customers.list({ email, limit: 1 });
        const hit = existing.data[0];
        if (hit) {
          customerId = hit.id;
          if (hit.metadata?.userId !== userId) {
            await stripe.customers.update(hit.id, { metadata: { ...hit.metadata, userId } });
          }
        }
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          ...(email && { email }),
          metadata: { userId, ...(tenantId ? { tenantId } : {}) },
        });
        customerId = created.id;
      }

      const started = (tenant?.trial_started_at ?? tenant?.created_at ?? null) as string | null;
      const { daysLeft } = daysLeftFrom(started);

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        payment_method_collection: "always",
        metadata: { userId, kind: "trial_subscription", ...(tenantId ? { tenantId } : {}) },
        subscription_data: {
          ...(daysLeft > 0 ? { trial_period_days: daysLeft } : {}),
          metadata: { userId, ...(tenantId ? { tenantId } : {}) },
        },
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** "I'll add it later" — records the skip so the dialog never blocks them twice. */
export const dismissTrialCardPromptFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, tenantId } = await tenantFor(context.userId);
    if (!tenantId) return { ok: false };
    const { error } = await admin
      .from("tenants")
      .update({ card_prompt_dismissed_at: new Date().toISOString() })
      .eq("id", tenantId);
    return { ok: !error };
  });
