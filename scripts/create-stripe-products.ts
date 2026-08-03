import process from "node:process";
import Stripe from "stripe";

const secretKey =
  process.env.STRIPE_SECRET_KEY ??
  process.env.STRIPE_LIVE_API_KEY ??
  process.env.STRIPE_SANDBOX_API_KEY;

if (!secretKey) {
  throw new Error(
    "Set one of STRIPE_SECRET_KEY, STRIPE_LIVE_API_KEY, or STRIPE_SANDBOX_API_KEY",
  );
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2026-03-25.dahlia",
});

type Tier = {
  name: string;
  unitAmountCents: number | null;
};

const tiers: Tier[] = [
  { name: "Cleard Service Fee - Tier 1", unitAmountCents: 1_000_000 },
  { name: "Cleard Service Fee - Tier 2", unitAmountCents: null },
  { name: "Cleard Service Fee - Tier 3", unitAmountCents: null },
];

for (const tier of tiers) {
  const product = await stripe.products.create({
    name: tier.name,
    description: "Cleard all-in service fee",
  });

  const isFixed = tier.unitAmountCents !== null;
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    ...(isFixed
      ? {
          unit_amount: tier.unitAmountCents,
          billing_scheme: "per_unit" as const,
        }
      : {
          custom_unit_amount: { enabled: true },
          billing_scheme: "per_unit" as const,
        }),
  });

  console.log(`${tier.name}`);
  console.log(`  product: ${product.id}`);
  console.log(`  price:   ${price.id}`);
  console.log(`  type:    ${isFixed ? "fixed $10,000" : "custom amount"}`);
}
