// Cleard's own contractor block, pre-filled on a new permit intake.
// These are editable defaults, not locked values: the intake form lets the GC
// overwrite any of them, and "Using a different qualifier?" clears the lot.

export type ContractorDefaults = {
  contractorCompany: string;
  contractorQualifier: string;
  companyAddress: string;
  poc: string;
  pocEmail: string;
  pocPhone: string;
  licenseNumber: string;
};

export const CLEARD_CONTRACTOR_DEFAULTS: ContractorDefaults = {
  contractorCompany: "The Hopeful Group Inc.",
  contractorQualifier: "Elajuwan Davis",
  companyAddress: "2253 Vista Pkwy",
  poc: "Elajuwan Davis",
  pocEmail: "team@floridianinc.com",
  pocPhone: "(561) 639-7931",
  licenseNumber: "CPC1459161",
};

/** Fields the "different qualifier" toggle owns, so it can clear exactly them. */
export type ContractorDefaultKey = keyof ContractorDefaults;

export const CLEARD_CONTRACTOR_BLANKS: ContractorDefaults = {
  contractorCompany: "",
  contractorQualifier: "",
  companyAddress: "",
  poc: "",
  pocEmail: "",
  pocPhone: "",
  licenseNumber: "",
};

/** True when a value is still one of the unverified placeholders above. */
export function isPlaceholderValue(_key: ContractorDefaultKey, _value: string): boolean {
  return false;
}
