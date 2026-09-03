// Whether an LPOA counts as signed. Isolated from lpoa.ts so the rule can load
// under tsx without the Supabase client or PDF generator.
//
// Unlike the PAA grandfather (pre-SignWell rows with no envelope), LPOA has
// always required SignWell confirmation. A staff-attested "signed" row is not
// enough to treat the affidavit as executed.

export type LpoaSignedInput = {
  status?: string | null;
  statusSource?: string | null;
} | null | undefined;

export function isLpoaSigned(rec: LpoaSignedInput): boolean {
  return rec?.status === "signed" && rec?.statusSource === "provider_confirmed";
}
