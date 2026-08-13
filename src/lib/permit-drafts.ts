// Locally auto-saved permit intake drafts. The intake form writes to this key
// as the GC types; My Permits reads it so half-filled forms surface as a
// "Drafts" stage instead of being invisible until submitted.

export const PERMIT_DRAFT_KEY = "cleard.permit-intake.draft.v1";

export type LocalPermitDraft = {
  savedAt: string | null;
  projectName: string;
  jobAddress: string;
  permitType: string | null;
  municipality: string | null;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function listLocalPermitDrafts(): LocalPermitDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PERMIT_DRAFT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt?: string; form?: Record<string, unknown> };
    const form = parsed?.form;
    if (!form) return [];
    const projectName = str(form.project_name) || str(form.projectName);
    const jobAddress = str(form.job_address) || str(form.jobAddress);
    const permitType = str(form.permit_type) || str(form.permitType);
    const municipality = str(form.municipality);
    // Ignore an untouched draft (defaults only, nothing identifying entered).
    if (!projectName && !jobAddress && !permitType && !municipality) return [];
    return [
      {
        savedAt: parsed.savedAt ?? null,
        projectName: projectName || "Untitled permit",
        jobAddress,
        permitType: permitType || null,
        municipality: municipality || null,
      },
    ];
  } catch {
    return [];
  }
}

export function discardLocalPermitDrafts(): void {
  try {
    window.localStorage.removeItem(PERMIT_DRAFT_KEY);
  } catch {
    /* best-effort */
  }
}
