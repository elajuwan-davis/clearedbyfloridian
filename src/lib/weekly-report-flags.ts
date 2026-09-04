// Compliance flags on the Monday weekly report. Isolated from
// weekly-reports.functions.ts so the 60-day window can load under tsx without
// the service-role client.
//
// A COI or license that expires inside this window is emailed to the GC. A
// widened window spams; a narrowed one hides an expired qualifier.

export const COMPLIANCE_FLAG_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

export type WeeklyComplianceSub = {
  company_name: string;
  coi_expiration?: string | null;
  license_expiration?: string | null;
};

export type WeeklyComplianceFlag = { subcontractor: string; issue: string };

export function complianceFlagsFromSubs(
  subs: WeeklyComplianceSub[] | null | undefined,
  now: Date = new Date(),
): WeeklyComplianceFlag[] {
  const soon = new Date(now.getTime() + COMPLIANCE_FLAG_WINDOW_MS);
  const flags: WeeklyComplianceFlag[] = [];
  for (const s of subs ?? []) {
    if (s.coi_expiration && new Date(s.coi_expiration) < soon) {
      flags.push({ subcontractor: s.company_name, issue: `COI expires ${s.coi_expiration}` });
    }
    if (s.license_expiration && new Date(s.license_expiration) < soon) {
      flags.push({ subcontractor: s.company_name, issue: `License expires ${s.license_expiration}` });
    }
  }
  return flags;
}
