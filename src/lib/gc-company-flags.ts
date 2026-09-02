// GC company license/insurance expiration flags. Isolated from gc-company.ts so
// the rules can load under tsx without the Supabase client or DBPR verifier.

export type ComplianceFlag = { level: "warn" | "blocked"; label: string };

export type QualifierExpiration = {
  name: string;
  licenseType: string;
  expiration: string;
  dbprStatus?: "active" | "inactive" | "expired" | string;
};

export type GcCompanyFlagsInput = {
  primaryQualifier: QualifierExpiration;
  secondaryQualifier?: QualifierExpiration | null;
  generalLiability: { expiration: string };
  workersComp: { expiration: string };
  bond?: { expiration: string } | null;
};

function daysUntil(dateStr: string | null | undefined, now: Date): number {
  if (!dateStr) return -Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -Infinity;
  return Math.floor((d.getTime() - now.getTime()) / 86400000);
}

export function complianceFlags(profile: GcCompanyFlagsInput, now = new Date()): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];

  function checkExpiration(
    label: string,
    expiration: string,
    extra?: QualifierExpiration["dbprStatus"],
  ) {
    if (extra === "expired") {
      flags.push({ level: "blocked", label: `${label} expired` });
      return;
    }
    // Skip blank dates so an unsaved / empty profile does not look "expired".
    if (!expiration?.trim()) return;
    const days = daysUntil(expiration, now);
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

export function canSubmitNewPermits(
  profile: GcCompanyFlagsInput,
  now = new Date(),
): { ok: boolean; message?: string } {
  const flags = complianceFlags(profile, now);
  const blocked = flags.some((f) => f.level === "blocked");
  if (blocked) {
    return { ok: false, message: "License expired — update before submitting new permits" };
  }
  return { ok: true };
}
