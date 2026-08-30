// Whether a Permit Agent Authorization counts as signed. Isolated from paa.ts so
// the rule can load under tsx without the Supabase client or PDF generator.
//
// Signed means SignWell said so. The one exception is a row created before the
// integration existed — it has no SignWell document to confirm, and the validator
// has always counted it, so revoking it here would lock out accounts that are
// legitimately authorized.

export type PaaSignedInput = {
  status?: string | null;
  statusSource?: string | null;
  envelopeId?: string | null;
} | null | undefined;

export function isPaaSigned(rec: PaaSignedInput): boolean {
  if (rec?.status !== "signed") return false;
  return rec.statusSource === "provider_confirmed" || rec.envelopeId === null;
}
