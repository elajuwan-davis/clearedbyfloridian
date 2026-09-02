// The one canonical CRM / project-management option list.
// Used by the /join sign-up select, the Google post-auth modal, and the admin CRMs tab
// so the stored values never drift between capture paths.

export const CRM_OPTIONS = [
  "ServiceTitan",
  "Procore",
  "JobTread",
  "Avoca",
  "Buildertrend",
  "CoConstruct",
  "Netic.ai",
  "Podium",
  "Craftflow",
  "monday.com",
  "None / We don't use one",
  "Other (please specify)",
] as const;

export type CrmOption = (typeof CRM_OPTIONS)[number];

export const CRM_OTHER = "Other (please specify)";
export const CRM_NONE = "None / We don't use one";

export const CRM_QUESTION =
  "Which project management or CRM software do you currently use?";

/** A CRM answer is complete only when "Other" carries a typed value. */
export function isCrmAnswerComplete(crm: string, other: string): boolean {
  if (!crm) return false;
  if (crm === CRM_OTHER) return other.trim().length > 0;
  return true;
}

export type CrmSource = "signup_form" | "google";

export const CRM_SOURCE_LABEL: Record<string, string> = {
  signup_form: "Standard form",
  google: "Google",
};
