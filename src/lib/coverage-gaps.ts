// Marketplace / own-sub insurance disclosure. Isolated from marketplace.ts so
// the rules can load under tsx without Vite `import.meta.env` or Supabase.

export type CoverageGap = {
  field: "coi" | "coi_expiration" | "license" | "license_expiration" | "w9";
  message: string;
};

export type CoverageGapSub = {
  coi_expiration: string | null | undefined;
  license_expiration: string | null | undefined;
  has_coi: boolean;
  has_license: boolean;
  has_w9: boolean;
};

export type ProjectInsuranceRequirements = {
  /** Cover has to still be in force on this date for this project. */
  coverageNeededThrough: string | null;
  w9Required: boolean;
};

function isExpiredBy(date: string | null | undefined, by: string): boolean {
  if (!date) return false;
  return date < by;
}

/**
 * Compare one sub's insurance/licensing against a project's requirements.
 * Returns every gap found; an empty array means nothing to disclose.
 */
export function coverageGaps(
  sub: CoverageGapSub,
  req: ProjectInsuranceRequirements,
  today = new Date().toISOString().slice(0, 10),
): CoverageGap[] {
  const through = req.coverageNeededThrough || today;
  const gaps: CoverageGap[] = [];

  if (!sub.has_coi) {
    gaps.push({ field: "coi", message: "No certificate of insurance on file" });
  }
  if (!sub.coi_expiration) {
    gaps.push({ field: "coi_expiration", message: "COI expiration date unknown" });
  } else if (isExpiredBy(sub.coi_expiration, today)) {
    gaps.push({ field: "coi_expiration", message: `COI expired ${sub.coi_expiration}` });
  } else if (isExpiredBy(sub.coi_expiration, through)) {
    gaps.push({
      field: "coi_expiration",
      message: `COI expires ${sub.coi_expiration}, before this project needs cover through ${through}`,
    });
  }

  if (!sub.has_license) {
    gaps.push({ field: "license", message: "No license document on file" });
  }
  if (!sub.license_expiration) {
    gaps.push({ field: "license_expiration", message: "License expiration date unknown" });
  } else if (isExpiredBy(sub.license_expiration, today)) {
    gaps.push({
      field: "license_expiration",
      message: `License expired ${sub.license_expiration}`,
    });
  }

  if (req.w9Required && !sub.has_w9) {
    gaps.push({ field: "w9", message: "No W-9 on file" });
  }

  return gaps;
}
