// Computes expiring/expired COI + License alerts from the subcontractor library.
import { loadSubLibrary, type SubRecord } from "./subcontractor-library";

export type AlertKind = "coi-expired" | "coi-expiring" | "license-expiring";
export type Alert = {
  id: string;
  kind: AlertKind;
  companyName: string;
  subId: string;
  daysRemaining: number; // negative if expired
  label: string; // e.g. "COI EXPIRED" or "COI expires in 12 days"
  severity: "red" | "amber";
};

const WARN_WINDOW_DAYS = 60;

function daysBetween(target: Date, from: Date) {
  const ms = target.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function parseDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export function computeAlertsFrom(subs: SubRecord[], now: Date = new Date()): Alert[] {
  const today = new Date(now.toDateString());
  const alerts: Alert[] = [];

  for (const s of subs) {
    // COI
    const coi = parseDate(s.coiExpiration);
    if (coi) {
      const d = daysBetween(coi, today);
      if (d < 0) {
        alerts.push({
          id: `${s.id}:coi-expired`,
          kind: "coi-expired",
          companyName: s.companyName,
          subId: s.id,
          daysRemaining: d,
          label: "COI EXPIRED",
          severity: "red",
        });
      } else if (d <= WARN_WINDOW_DAYS) {
        alerts.push({
          id: `${s.id}:coi-expiring`,
          kind: "coi-expiring",
          companyName: s.companyName,
          subId: s.id,
          daysRemaining: d,
          label: `COI expires in ${d} day${d === 1 ? "" : "s"}`,
          severity: "amber",
        });
      }
    }

    // License — SubRecord doesn't currently store a license expiration date,
    // but tolerate one on read for future-proofing.
    const lic = parseDate(s.licenseExpiration);
    if (lic) {
      const d = daysBetween(lic, today);
      if (d >= 0 && d <= WARN_WINDOW_DAYS) {
        alerts.push({
          id: `${s.id}:license-expiring`,
          kind: "license-expiring",
          companyName: s.companyName,
          subId: s.id,
          daysRemaining: d,
          label: `License expires in ${d} day${d === 1 ? "" : "s"}`,
          severity: "amber",
        });
      }
    }
  }

  // Sort: expired first, then soonest expiration.
  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function computeAlerts(now: Date = new Date()): Alert[] {
  return computeAlertsFrom(loadSubLibrary(), now);
}

export function alertCounts(alerts: Alert[]) {
  return {
    total: alerts.length,
    coiExpired: alerts.filter((a) => a.kind === "coi-expired").length,
    coiExpiring: alerts.filter((a) => a.kind === "coi-expiring").length,
    licenseExpiring: alerts.filter((a) => a.kind === "license-expiring").length,
  };
}
