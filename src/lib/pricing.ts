export type CleardPricingTier = 1 | 2 | 3;

const TIER_1_MAX = 2_000_000;
const TIER_2_MAX = 10_000_000;
const TIER_1_FLAT_FEE = 10_000;
const TIER_2_RATE = 0.004;
const TIER_3_RATE = 0.0025;

export function getCleardTier(contractValue: number): CleardPricingTier {
  if (!Number.isFinite(contractValue) || contractValue < 0) return 1;
  if (contractValue <= TIER_1_MAX) return 1;
  if (contractValue < TIER_2_MAX) return 2;
  return 3;
}

export function calculateCleardFee(contractValue: number): number {
  if (!Number.isFinite(contractValue) || contractValue <= 0) return 0;

  const tier = getCleardTier(contractValue);
  if (tier === 1) return TIER_1_FLAT_FEE;

  const rate = tier === 2 ? TIER_2_RATE : TIER_3_RATE;
  return Math.round(contractValue * rate * 100) / 100;
}
