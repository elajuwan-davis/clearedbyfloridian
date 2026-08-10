// Cleard's own contractor block, pre-filled on a new permit intake.
// These are editable defaults, not locked values: the intake form lets the GC
// overwrite any of them, and "Using a different qualifier?" clears the lot.

export type ContractorDefaults = {
  contractorQualifier: string;
  companyAddress: string;
  poc: string;
  pocEmail: string;
  pocPhone: string;
  licenseNumber: string;
};

export const CLEARD_CONTRACTOR_DEFAULTS: ContractorDefaults = {
  contractorQualifier: "Elajuwan Davis",
  /** Placeholder — replace with Cleard's real company address. */
  companyAddress: "ABC",
  poc: "Paul Gotera",
  pocEmail: "paul@cleared.com",
  /** Deliberately blank: no phone number has been confirmed. */
  pocPhone: "",
  /** Placeholder — replace with Cleard's real state licence number. */
  licenseNumber: "PLACEHOLDER-0001",
};

/** Fields the "different qualifier" toggle owns, so it can clear exactly them. */
export type ContractorDefaultKey = keyof ContractorDefaults;

export const CLEARD_CONTRACTOR_BLANKS: ContractorDefaults = {
  contractorQualifier: "",
  companyAddress: "",
  poc: "",
  pocEmail: "",
  pocPhone: "",
  licenseNumber: "",
};

/** True when a value is still one of the unverified placeholders above. */
export function isPlaceholderValue(key: ContractorDefaultKey, value: string): boolean {
  if (key !== "companyAddress" && key !== "licenseNumber") return false;
  return value.trim() === CLEARD_CONTRACTOR_DEFAULTS[key];
}
