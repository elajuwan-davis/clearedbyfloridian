// Shared subcontractor library used across Permit Intake, Request COI,
// Request Sub Insurance Update, and the Subcontractor Intake form.
// Backed by localStorage until wired to Cloud.

export type SubRecord = {
  companyName: string;
  trade: string;
  qualifierName?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  companyAddress?: string;
  insuranceCarrierEmail?: string;
};

export const LIB_KEY = "cleared.subcontractor-library";

export function loadSubLibrary(): SubRecord[] {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SubRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveSubLibrary(list: SubRecord[]) {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function upsertSub(sub: SubRecord) {
  if (!sub.companyName?.trim()) return;
  const list = loadSubLibrary();
  const idx = list.findIndex(
    (s) =>
      s.companyName.trim().toLowerCase() === sub.companyName.trim().toLowerCase() &&
      (s.licenseNumber ?? "") === (sub.licenseNumber ?? ""),
  );
  if (idx >= 0) list[idx] = { ...list[idx], ...sub };
  else list.push(sub);
  saveSubLibrary(list);
}
