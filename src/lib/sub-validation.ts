// One definition of "this subcontractor record is filled in", shared by every
// intake path: the internal form, the public form and the tokenised link. The
// token path re-checks it on the server, so a crafted request cannot skip it.

export type SubValidationInput = {
  company_name?: string | null;
  trade?: string | null;
  license_number?: string | null;
  license_expiration?: string | null;
  email?: string | null;
  insurance_carrier_email?: string | null;
  coi_file_name?: string | null;
  coi_expiration?: string | null;
};

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

/** ISO yyyy-mm-dd that the calendar actually has (rejects 2026-02-31). */
export function isIsoDate(v: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/**
 * Fields a completed subcontractor must carry. Blank "invited" placeholder rows
 * are deliberately exempt — they exist only to mint an intake link.
 */
export function subValidationErrors(s: SubValidationInput): string[] {
  const out: string[] = [];
  const text = (v: string | null | undefined) => (v ?? "").trim();

  if (!text(s.company_name)) out.push("Company Name is required");
  if (!text(s.trade)) out.push("Trade is required");
  if (!text(s.license_number)) out.push("License Number is required");

  const licExp = text(s.license_expiration);
  if (!licExp) out.push("License Expiration is required");
  else if (!isIsoDate(licExp)) out.push("License Expiration is not a valid date");

  const email = text(s.email);
  if (!email) out.push("Contact Email is required");
  else if (!isEmail(email)) out.push("Contact Email is not a valid email address");

  const carrier = text(s.insurance_carrier_email);
  if (carrier && !isEmail(carrier))
    out.push("Insurance Carrier Email is not a valid email address");

  const coiExp = text(s.coi_expiration);
  if (text(s.coi_file_name) && !coiExp)
    out.push("COI Expiration is required when a COI is attached");
  if (coiExp && !isIsoDate(coiExp)) out.push("COI Expiration is not a valid date");

  return out;
}
