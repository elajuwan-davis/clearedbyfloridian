// Estimated permit fee schedules — Palm Beach / Treasure Coast jurisdictions.
// These are simplified, order-of-magnitude schedules for the intake form's
// "Estimated Permit Fee" preview. They are NOT the municipality's official
// fee table; always confirm with the building department at submittal.

export type FeeScheduleKey = "residential" | "commercial";

export type FeeSchedule = {
  /** Base/minimum permit fee. */
  baseFee: number;
  /** Fee per square foot of the project. */
  perSqFt: number;
  /** Fee as a fraction of estimated construction value (e.g. 0.015 = 1.5%). */
  valuationRate: number;
  /** Flat technology / plan-review surcharge added on top. */
  surcharge: number;
};

// Fallback used when the entered municipality doesn't match a known schedule.
const DEFAULT_SCHEDULE: Record<FeeScheduleKey, FeeSchedule> = {
  residential: { baseFee: 125, perSqFt: 0.22, valuationRate: 0.012, surcharge: 45 },
  commercial: { baseFee: 250, perSqFt: 0.35, valuationRate: 0.015, surcharge: 85 },
};

// Small illustrative set of jurisdiction-specific multipliers. Any
// municipality not listed here falls back to DEFAULT_SCHEDULE.
const MUNICIPALITY_SCHEDULES: Record<string, Record<FeeScheduleKey, FeeSchedule>> = {
  "west palm beach": {
    residential: { baseFee: 150, perSqFt: 0.24, valuationRate: 0.013, surcharge: 55 },
    commercial: { baseFee: 300, perSqFt: 0.38, valuationRate: 0.016, surcharge: 95 },
  },
  "boca raton": {
    residential: { baseFee: 175, perSqFt: 0.27, valuationRate: 0.014, surcharge: 60 },
    commercial: { baseFee: 325, perSqFt: 0.4, valuationRate: 0.017, surcharge: 100 },
  },
  "palm beach gardens": {
    residential: { baseFee: 140, perSqFt: 0.23, valuationRate: 0.0125, surcharge: 50 },
    commercial: { baseFee: 280, perSqFt: 0.36, valuationRate: 0.0155, surcharge: 90 },
  },
  "delray beach": {
    residential: { baseFee: 130, perSqFt: 0.21, valuationRate: 0.012, surcharge: 48 },
    commercial: { baseFee: 260, perSqFt: 0.34, valuationRate: 0.0145, surcharge: 88 },
  },
  "jupiter": {
    residential: { baseFee: 120, perSqFt: 0.2, valuationRate: 0.011, surcharge: 42 },
    commercial: { baseFee: 240, perSqFt: 0.32, valuationRate: 0.014, surcharge: 80 },
  },
  "port st. lucie": {
    residential: { baseFee: 110, perSqFt: 0.19, valuationRate: 0.0105, surcharge: 40 },
    commercial: { baseFee: 225, perSqFt: 0.3, valuationRate: 0.0135, surcharge: 75 },
  },
  "stuart": {
    residential: { baseFee: 105, perSqFt: 0.18, valuationRate: 0.01, surcharge: 38 },
    commercial: { baseFee: 210, perSqFt: 0.29, valuationRate: 0.013, surcharge: 70 },
  },
};

export function feeScheduleFor(municipality: string | undefined, category: FeeScheduleKey): FeeSchedule {
  const key = (municipality || "").trim().toLowerCase();
  return MUNICIPALITY_SCHEDULES[key]?.[category] ?? DEFAULT_SCHEDULE[category];
}

export type FeeEstimateInput = {
  municipality: string | undefined;
  category: FeeScheduleKey;
  squareFootage: number;
  constructionValue: number;
};

export function estimatePermitFee({ municipality, category, squareFootage, constructionValue }: FeeEstimateInput): number {
  const s = feeScheduleFor(municipality, category);
  const sqFt = Number.isFinite(squareFootage) && squareFootage > 0 ? squareFootage : 0;
  const value = Number.isFinite(constructionValue) && constructionValue > 0 ? constructionValue : 0;
  const total = s.baseFee + sqFt * s.perSqFt + value * s.valuationRate + s.surcharge;
  return Math.round(total);
}
