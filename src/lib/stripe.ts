import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Stripe payments are not configured for this build. Complete Stripe go-live in your Cleard project to enable production checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

export function isPaymentsConfigured(): boolean {
  return (
    !!clientToken &&
    (clientToken.startsWith("pk_test_") || clientToken.startsWith("pk_live_"))
  );
}

/**
 * Cleard service fee model:
 * - Under $1M project value → 1%
 * - $1M and above → 0.5%
 * Returns cents.
 */
export function calculateServiceFeeCents(projectValueUsd: number): number {
  if (!projectValueUsd || projectValueUsd <= 0) return 0;
  const rate = projectValueUsd >= 1_000_000 ? 0.005 : 0.01;
  return Math.round(projectValueUsd * rate * 100);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Stripe processing fee pass-through: 2.9% + $0.30.
 * Returns cents given a base amount in cents.
 */
export function stripeProcessingFeeCents(baseCents: number): number {
  if (baseCents <= 0) return 0;
  return Math.round(baseCents * 0.029 + 30);
}
