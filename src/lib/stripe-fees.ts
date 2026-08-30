// Cleard service-fee and Stripe processing-fee math. Isolated from stripe.ts so
// the amounts can be tested without Vite `import.meta.env` (the Stripe client
// module throws when the publishable key is missing).

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

/**
 * Stripe processing fee pass-through: 2.9% + $0.30.
 * Returns cents given a base amount in cents.
 */
export function stripeProcessingFeeCents(baseCents: number): number {
  if (baseCents <= 0) return 0;
  return Math.round(baseCents * 0.029 + 30);
}
