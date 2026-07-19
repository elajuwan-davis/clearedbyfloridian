// Shared subcontractor library used across Permit Intake, Request COI,
// Sub Insurance Request, Subcontractors admin, and the public
// /sub-intake/$token completion flow. Backed by localStorage until wired to Cloud.

export type SubRecord = {
  id: string;
  trade: string;
  companyName: string;
  qualifierName?: string;
  licenseNumber?: string;
  licenseFileName?: string | null;
  contactFirstName?: string;
  contactLastName?: string;
  email?: string;
  phone?: string;
  companyAddress?: string;
  insuranceCarrierName?: string;
  insuranceCarrierEmail?: string;
  coiFileName?: string | null;
  coiExpiration?: string | null; // yyyy-mm-dd
  w9FileName?: string | null;
  completionToken?: string | null;
  // legacy fields tolerated on read
  name?: string;
};

export const LIB_KEY = "cleared.subcontractor-library";

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function loadSubLibrary(): SubRecord[] {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // backfill ids for legacy rows
    return (parsed as SubRecord[]).map((s) => ({ ...s, id: s.id || newId() }));
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

export function upsertSub(sub: Partial<SubRecord> & { companyName: string }): SubRecord {
  const list = loadSubLibrary();
  const idx = sub.id
    ? list.findIndex((s) => s.id === sub.id)
    : list.findIndex(
        (s) =>
          s.companyName.trim().toLowerCase() === sub.companyName.trim().toLowerCase() &&
          (s.licenseNumber ?? "") === (sub.licenseNumber ?? ""),
      );
  let record: SubRecord;
  if (idx >= 0) {
    record = { ...list[idx], ...sub, id: list[idx].id };
    list[idx] = record;
  } else {
    record = { id: newId(), trade: "", ...sub } as SubRecord;
    list.push(record);
  }
  saveSubLibrary(list);
  return record;
}

export function getSubById(id: string): SubRecord | null {
  return loadSubLibrary().find((s) => s.id === id) ?? null;
}

export function getSubByToken(token: string): SubRecord | null {
  return loadSubLibrary().find((s) => s.completionToken === token) ?? null;
}

export function updateSub(id: string, patch: Partial<SubRecord>): SubRecord | null {
  const list = loadSubLibrary();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id: list[idx].id };
  saveSubLibrary(list);
  return list[idx];
}

export type MissingField =
  | "licenseFileName"
  | "coiFileName"
  | "coiExpiration"
  | "w9FileName";

export const MISSING_FIELD_LABELS: Record<MissingField, string> = {
  licenseFileName: "License Upload",
  coiFileName: "COI Upload",
  coiExpiration: "COI Expiration Date",
  w9FileName: "W-9 Upload",
};

export function missingFields(sub: SubRecord): MissingField[] {
  const out: MissingField[] = [];
  if (!sub.licenseFileName) out.push("licenseFileName");
  if (!sub.coiFileName) out.push("coiFileName");
  if (!sub.coiExpiration) out.push("coiExpiration");
  if (!sub.w9FileName) out.push("w9FileName");
  return out;
}

export function isComplete(sub: SubRecord): boolean {
  return missingFields(sub).length === 0;
}

export function coiStatus(sub: SubRecord): "on-file" | "expired" | "missing" {
  if (!sub.coiFileName) return "missing";
  if (sub.coiExpiration) {
    const exp = new Date(sub.coiExpiration);
    if (!isNaN(exp.getTime()) && exp < new Date(new Date().toDateString())) return "expired";
  }
  return "on-file";
}

export function ensureToken(id: string): string {
  const sub = getSubById(id);
  if (!sub) throw new Error("Subcontractor not found");
  if (sub.completionToken) return sub.completionToken;
  const token = newId();
  updateSub(id, { completionToken: token });
  return token;
}
