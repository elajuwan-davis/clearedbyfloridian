// Florida permits are typically valid for 180 days from issue date without
// an active inspection, per FBC 105.4.1. Cleard warns 30 days out.
export const PERMIT_LIFETIME_DAYS = 180;
export const EXPIRATION_WARNING_DAYS = 30;

export function computeExpirationDate(issuedDate: string | null): string | null {
  if (!issuedDate) return null;
  const d = new Date(issuedDate);
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + PERMIT_LIFETIME_DAYS);
  return d.toISOString().slice(0, 10);
}

export function daysUntilExpiration(expirationDate: string | null, now: Date = new Date()): number | null {
  if (!expirationDate) return null;
  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) return null;
  const today = new Date(now.toDateString());
  return Math.floor((exp.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export type ExpirationState = "safe" | "warning" | "expired" | "unknown";

export function expirationState(expirationDate: string | null): ExpirationState {
  const d = daysUntilExpiration(expirationDate);
  if (d === null) return "unknown";
  if (d < 0) return "expired";
  if (d <= EXPIRATION_WARNING_DAYS) return "warning";
  return "safe";
}
