// Dispatch flood / wind / parcel helpers. Isolated from dispatch.ts so they
// can load under tsx without `import.meta.env`.
//
// The appraiser reports whole dollars; the UI stores cents. Dropping the *100
// would understate a parcel by 100×. HVHZ (Miami-Dade / Broward) drives the
// mock wind speed and exposure category when live flood/parcel calls fail.

export function isHvhzCounty(county: string): boolean {
  return /miami-dade|broward/i.test(county);
}

/** Convert a county-appraiser dollar amount to cents. Null stays null. */
export function assessedValueToCents(assessedValue: number | string | null | undefined): number | null {
  return assessedValue == null ? null : Math.round(Number(assessedValue) * 100);
}
