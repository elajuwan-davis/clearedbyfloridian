// GC Company Profile — license & insurance tracking.
// LocalStorage-backed store used by /portal/company (GC-facing) and
// /admin/gc-compliance (staff dashboard).

import { listGCClients } from "@/lib/gc-clients";

export type DbprStatus = "active" | "inactive" | "expired";

export type Qualifier = {
  name: string;
  licenseNumber: string;
  licenseType: string; // e.g. "Certified General Contractor (CGC)"
  expiration: string; // yyyy-mm-dd
  dbprStatus: DbprStatus;
  verified: boolean;
};

export type InsurancePolicy = {
  carrier: string;
  policyNumber: string;
  coverageAmountCents: number;
  expiration: string; // yyyy-mm-dd
  certificateFileName?: string | null;
};

export type BondInfo = {
  surety: string;
  bondNumber: string;
  amountCents: number;
  expiration: string; // yyyy-mm-dd
};

export type GcCompanyProfile = {
  id: string; // matches GCClient id where applicable
  legalName: string;
  dba: string;
  entityType: string; // e.g. "Florida LLC", "Florida Corporation"
  primaryQualifier: Qualifier;
  secondaryQualifier?: Qualifier | null;
  generalLiability: InsurancePolicy;
  workersComp: InsurancePolicy;
  bond?: BondInfo | null;
  updatedAt: string;
};

const KEY = "cleared.gcCompanyProfiles.v1";
const CURRENT_KEY = "cleared.gcCompanyProfiles.currentId";
const EVENT = "gc-company:changed";

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return -Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -Infinity;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seedFor(id: string, firmName: string, licenseNumber: string, kind: "clean" | "expiring" | "expired"): GcCompanyProfile {
  const licenseExp =
    kind === "expired" ? isoInDays(-14) : kind === "expiring" ? isoInDays(38) : isoInDays(420);
  const glExp = kind === "expiring" ? isoInDays(45) : isoInDays(310);
  const wcExp = kind === "expired" ? isoInDays(-5) : isoInDays(280);

  return {
    id,
    legalName: firmName,
    dba: firmName.replace(/ Group| LLC| Inc\.?/gi, "").trim(),
    entityType: "Florida Limited Liability Company (LLC)",
    primaryQualifier: {
      name: "Marcus Coastline",
      licenseNumber,
      licenseType: "Certified General Contractor (CGC)",
      expiration: licenseExp,
      dbprStatus: kind === "expired" ? "expired" : "active",
      verified: kind !== "expired",
    },
    secondaryQualifier: null,
    generalLiability: {
      carrier: "Florida Builders Mutual Insurance",
      policyNumber: `GL-${licenseNumber}-24`,
      coverageAmountCents: 200_000_00,
      expiration: glExp,
      certificateFileName: "coi-general-liability-2024.pdf",
    },
    workersComp: {
      carrier: "SouthGuard Casualty Co.",
      policyNumber: `WC-${licenseNumber}-24`,
      coverageAmountCents: 500_000_00,
      expiration: wcExp,
      certificateFileName: "coi-workers-comp-2024.pdf",
    },
    bond: {
      surety: "Gulfstream Surety & Bond",
      bondNumber: `BND-${licenseNumber}`,
      amountCents: 25_000_00,
      expiration: isoInDays(365),
    },
    updatedAt: new Date().toISOString(),
  };
}

function seedProfiles(): GcCompanyProfile[] {
  const clients = listGCClients();
  const kinds: Array<"clean" | "expiring" | "expired"> = ["clean", "expiring", "expired"];
  if (clients.length === 0) {
    return [seedFor("gc-coastline", "Coastline Builders Group", "CGC1523401", "clean")];
  }
  return clients.map((c, i) =>
    seedFor(c.id, c.firmName, c.licenseNumber || `CGC15${23400 + i}`, kinds[i % kinds.length]),
  );
}

function read(): GcCompanyProfile[] {
  if (typeof window === "undefined") return seedProfiles();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedProfiles();
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as GcCompanyProfile[];
  } catch {
    return seedProfiles();
  }
}

function write(list: GcCompanyProfile[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function listGcCompanyProfiles(): GcCompanyProfile[] {
  return read();
}

export function getGcCompanyProfile(id: string): GcCompanyProfile | null {
  return read().find((p) => p.id === id) ?? null;
}

export function saveGcCompanyProfile(profile: GcCompanyProfile) {
  const list = read();
  const idx = list.findIndex((p) => p.id === profile.id);
  const merged = { ...profile, updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = merged;
  else list.push(merged);
  write(list);
}

// The "current" GC user's profile — falls back to the first seeded profile.
export function getCurrentGcCompanyProfile(): GcCompanyProfile {
  const list = read();
  if (typeof window !== "undefined") {
    const currentId = window.localStorage.getItem(CURRENT_KEY);
    const found = currentId ? list.find((p) => p.id === currentId) : null;
    if (found) return found;
  }
  return list[0] ?? seedFor("gc-coastline", "Coastline Builders Group", "CGC1523401", "clean");
}

export function saveCurrentGcCompanyProfile(profile: GcCompanyProfile) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CURRENT_KEY, profile.id);
  }
  saveGcCompanyProfile(profile);
}

export type ComplianceFlag = { level: "warn" | "blocked"; label: string };

export function complianceFlags(profile: GcCompanyProfile): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];

  function checkExpiration(label: string, expiration: string, extra?: DbprStatus) {
    if (extra === "expired") {
      flags.push({ level: "blocked", label: `${label} expired` });
      return;
    }
    const days = daysUntil(expiration);
    if (days < 0) flags.push({ level: "blocked", label: `${label} expired` });
    else if (days <= 60) flags.push({ level: "warn", label: `${label} expires in ${days} day${days === 1 ? "" : "s"}` });
  }

  checkExpiration(
    `${profile.primaryQualifier.licenseType} license (${profile.primaryQualifier.name})`,
    profile.primaryQualifier.expiration,
    profile.primaryQualifier.dbprStatus,
  );
  if (profile.secondaryQualifier) {
    checkExpiration(
      `${profile.secondaryQualifier.licenseType} license (${profile.secondaryQualifier.name})`,
      profile.secondaryQualifier.expiration,
      profile.secondaryQualifier.dbprStatus,
    );
  }
  checkExpiration("General liability insurance", profile.generalLiability.expiration);
  checkExpiration("Workers compensation insurance", profile.workersComp.expiration);
  if (profile.bond) checkExpiration("Surety bond", profile.bond.expiration);

  return flags;
}

export function canSubmitNewPermits(profile: GcCompanyProfile): { ok: boolean; message?: string } {
  const flags = complianceFlags(profile);
  const blocked = flags.some((f) => f.level === "blocked");
  if (blocked) {
    return { ok: false, message: "License expired — update before submitting new permits" };
  }
  return { ok: true };
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
