// GC Company Profile — license & insurance tracking.
// Backed by public.gc_company_profiles (one row per tenant).
// Used by /portal/company (GC-facing) and /admin/gc-compliance (staff).

import { supabase } from "@/integrations/supabase/client";
import { verifyDbprLicense, type DbprResult } from "@/lib/dbpr-api";

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
  /** Storage path in company-compliance-docs bucket (signed URL retrieval). */
  certificateFilePath?: string | null;
};

export type BondInfo = {
  surety: string;
  bondNumber: string;
  amountCents: number;
  expiration: string; // yyyy-mm-dd
};

export type GcCompanyProfile = {
  id: string; // tenant_id (stable one-row-per-tenant key)
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

export const GC_COMPANY_EVT = "gc-company:changed";

function emptyQualifier(): Qualifier {
  return {
    name: "",
    licenseNumber: "",
    licenseType: "Certified General Contractor (CGC)",
    expiration: "",
    dbprStatus: "inactive",
    verified: false,
  };
}

function emptyPolicy(): InsurancePolicy {
  return {
    carrier: "",
    policyNumber: "",
    coverageAmountCents: 0,
    expiration: "",
    certificateFileName: null,
    certificateFilePath: null,
  };
}

export function emptyGcCompanyProfile(tenantId: string, legalName = ""): GcCompanyProfile {
  return {
    id: tenantId,
    legalName,
    dba: "",
    entityType: "Florida Limited Liability Company (LLC)",
    primaryQualifier: emptyQualifier(),
    secondaryQualifier: null,
    generalLiability: emptyPolicy(),
    workersComp: emptyPolicy(),
    bond: null,
    updatedAt: new Date().toISOString(),
  };
}

function asQualifier(raw: unknown): Qualifier {
  const q = (raw ?? {}) as Partial<Qualifier>;
  return {
    name: q.name ?? "",
    licenseNumber: q.licenseNumber ?? "",
    licenseType: q.licenseType ?? "Certified General Contractor (CGC)",
    expiration: q.expiration ?? "",
    dbprStatus: (q.dbprStatus as DbprStatus) ?? "inactive",
    verified: Boolean(q.verified),
  };
}

function asPolicy(raw: unknown): InsurancePolicy {
  const p = (raw ?? {}) as Partial<InsurancePolicy>;
  return {
    carrier: p.carrier ?? "",
    policyNumber: p.policyNumber ?? "",
    coverageAmountCents: Number(p.coverageAmountCents ?? 0),
    expiration: p.expiration ?? "",
    certificateFileName: p.certificateFileName ?? null,
    certificateFilePath: p.certificateFilePath ?? null,
  };
}

function asBond(raw: unknown): BondInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Partial<BondInfo>;
  return {
    surety: b.surety ?? "",
    bondNumber: b.bondNumber ?? "",
    amountCents: Number(b.amountCents ?? 0),
    expiration: b.expiration ?? "",
  };
}

function mapRow(row: any): GcCompanyProfile {
  return {
    id: row.tenant_id as string,
    legalName: (row.legal_name as string) ?? "",
    dba: (row.dba as string) ?? "",
    entityType: (row.entity_type as string) ?? "",
    primaryQualifier: asQualifier(row.primary_qualifier),
    secondaryQualifier: row.secondary_qualifier
      ? asQualifier(row.secondary_qualifier)
      : null,
    generalLiability: asPolicy(row.general_liability),
    workersComp: asPolicy(row.workers_comp),
    bond: asBond(row.bond),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function notifyChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GC_COMPANY_EVT));
  }
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return -Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -Infinity;
  return Math.floor((d.getTime() - Date.now()) / 86400000);
}

export async function listGcCompanyProfiles(): Promise<GcCompanyProfile[]> {
  const { data, error } = await supabase
    .from("gc_company_profiles")
    .select("*")
    .order("legal_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getGcCompanyProfile(tenantId: string): Promise<GcCompanyProfile | null> {
  const { data, error } = await supabase
    .from("gc_company_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

/** Load profile for the current tenant; returns an empty scaffold if none exists yet. */
export async function getCurrentGcCompanyProfile(
  tenantId: string,
  tenantName?: string | null,
): Promise<GcCompanyProfile> {
  const existing = await getGcCompanyProfile(tenantId);
  if (existing) return existing;
  return emptyGcCompanyProfile(tenantId, tenantName ?? "");
}

export async function saveGcCompanyProfile(profile: GcCompanyProfile): Promise<GcCompanyProfile> {
  const tenantId = profile.id;
  if (!tenantId || !/^[a-f0-9-]{36}$/i.test(tenantId)) {
    throw new Error("A valid tenant id is required to save the company profile.");
  }

  const payload = {
    tenant_id: tenantId,
    legal_name: profile.legalName,
    dba: profile.dba,
    entity_type: profile.entityType,
    primary_qualifier: profile.primaryQualifier,
    secondary_qualifier: profile.secondaryQualifier ?? null,
    general_liability: profile.generalLiability,
    workers_comp: profile.workersComp,
    bond: profile.bond ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("gc_company_profiles")
    .upsert(payload, { onConflict: "tenant_id" })
    .select("*")
    .single();
  if (error) throw error;

  // Keep tenants.name / license_number loosely in sync for onboarding surfaces.
  try {
    await supabase
      .from("tenants")
      .update({
        name: profile.legalName || undefined,
        license_number: profile.primaryQualifier.licenseNumber || null,
        primary_coi_path: profile.generalLiability.certificateFilePath ?? null,
        primary_license_path: null,
      })
      .eq("id", tenantId);
  } catch {
    /* best-effort */
  }

  notifyChanged();
  return mapRow(data);
}

/** Alias kept for existing call sites — same as saveGcCompanyProfile. */
export async function saveCurrentGcCompanyProfile(
  profile: GcCompanyProfile,
): Promise<GcCompanyProfile> {
  return saveGcCompanyProfile(profile);
}

function mapDbprToQualifierStatus(status: DbprResult["status"]): DbprStatus {
  if (status === "active") return "active";
  if (status === "expired") return "expired";
  return "inactive";
}

/** Run live DBPR verification against a qualifier and return the updated qualifier. */
export async function autoValidateQualifier(qualifier: Qualifier): Promise<Qualifier> {
  const ln = qualifier.licenseNumber.trim();
  if (!ln) {
    return { ...qualifier, verified: false, dbprStatus: "inactive" };
  }
  const result = await verifyDbprLicense(ln);
  const dbprStatus = mapDbprToQualifierStatus(result.status);
  const verified = result.status === "active";
  return {
    ...qualifier,
    dbprStatus,
    verified,
    name: result.holder_name?.trim() || qualifier.name,
    licenseType: result.license_type?.trim() || qualifier.licenseType,
    expiration: result.expiration || qualifier.expiration,
  };
}

/**
 * Auto-validate primary (and secondary, if present) qualifiers via the same
 * verifyDbprLicense() path used on the Compliance page, then save.
 */
export async function saveCurrentGcCompanyProfileWithDbpr(
  profile: GcCompanyProfile,
): Promise<GcCompanyProfile> {
  const primaryQualifier = await autoValidateQualifier(profile.primaryQualifier);
  let secondaryQualifier = profile.secondaryQualifier ?? null;
  if (secondaryQualifier?.licenseNumber?.trim()) {
    secondaryQualifier = await autoValidateQualifier(secondaryQualifier);
  }
  return saveGcCompanyProfile({
    ...profile,
    primaryQualifier,
    secondaryQualifier,
  });
}

export type ComplianceFlag = { level: "warn" | "blocked"; label: string };

export function complianceFlags(profile: GcCompanyProfile): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];

  function checkExpiration(label: string, expiration: string, extra?: DbprStatus) {
    if (extra === "expired") {
      flags.push({ level: "blocked", label: `${label} expired` });
      return;
    }
    // Skip blank dates so an unsaved / empty profile does not look "expired".
    if (!expiration?.trim()) return;
    const days = daysUntil(expiration);
    if (days < 0) flags.push({ level: "blocked", label: `${label} expired` });
    else if (days <= 60)
      flags.push({
        level: "warn",
        label: `${label} expires in ${days} day${days === 1 ? "" : "s"}`,
      });
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
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
