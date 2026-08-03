// Internal legal document library + NTBO templates. LocalStorage-backed so staff
// can add versions without a migration; seeded with the current document set.

export type LegalDocType =
  | "Permit Agent Authorization"
  | "Signed PAA"
  | "NTBO Template"
  | "Terms of Service"
  | "Privacy Policy"
  | "Indemnification Agreement"
  | "Contractor Authorization Letter";

export type LegalDocStatus = "active" | "draft" | "pending_review";

export const LEGAL_STATUS_META: Record<LegalDocStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "border-emerald-600/30 bg-emerald-50 text-emerald-800" },
  draft: { label: "Draft", className: "border-obsidian/20 bg-paper-warm text-obsidian/70" },
  pending_review: { label: "Pending Review", className: "border-amber-600/30 bg-amber-50 text-amber-800" },
};

export type LegalDoc = {
  id: string;
  name: string;
  type: LegalDocType;
  version: string;
  updatedAt: string; // YYYY-MM-DD
  status: LegalDocStatus;
  /** Populated for executed GC copies. */
  gcName?: string;
  signedAt?: string;
  notes?: string;
};

export const LEGAL_EVT = "legal-docs:changed";
const KEY = "cleared.legalDocs.v1";

const SEED: LegalDoc[] = [
  { id: "paa-master", name: "Permit Agent Authorization — Master Template", type: "Permit Agent Authorization", version: "v0.9", updatedAt: "2026-07-28", status: "pending_review", notes: "Placeholder language circulated to counsel 7/28." },
  { id: "paa-coastline", name: "PAA — Coastline Builders Group (executed)", type: "Signed PAA", version: "v0.9", updatedAt: "2026-06-11", status: "active", gcName: "Coastline Builders Group", signedAt: "2026-06-11" },
  { id: "paa-harborline", name: "PAA — Harborline Residential (executed)", type: "Signed PAA", version: "v0.9", updatedAt: "2026-05-02", status: "active", gcName: "Harborline Residential LLC", signedAt: "2026-05-02" },
  { id: "paa-atlantic", name: "PAA — Atlantic Ridge Custom Homes (executed)", type: "Signed PAA", version: "v0.8", updatedAt: "2026-03-19", status: "active", gcName: "Atlantic Ridge Custom Homes", signedAt: "2026-03-19" },

  { id: "ntbo-pbc", name: "NTBO Template — Palm Beach County", type: "NTBO Template", version: "v2.1", updatedAt: "2026-06-02", status: "active" },
  { id: "ntbo-slc", name: "NTBO Template — St. Lucie County", type: "NTBO Template", version: "v1.8", updatedAt: "2026-05-14", status: "active" },
  { id: "ntbo-psl", name: "NTBO Template — City of Port St. Lucie", type: "NTBO Template", version: "v1.6", updatedAt: "2026-05-27", status: "active" },
  { id: "ntbo-martin", name: "NTBO Template — Martin County", type: "NTBO Template", version: "v2.0", updatedAt: "2026-04-30", status: "active" },
  { id: "ntbo-fp", name: "NTBO Template — City of Fort Pierce", type: "NTBO Template", version: "v1.2", updatedAt: "2026-05-20", status: "pending_review", notes: "Historic district recording language still under review." },

  { id: "tos", name: "Terms of Service", type: "Terms of Service", version: "v1.3", updatedAt: "2026-04-08", status: "active" },
  { id: "privacy", name: "Privacy Policy", type: "Privacy Policy", version: "v1.2", updatedAt: "2026-04-08", status: "active" },
  { id: "indemnification", name: "Indemnification Agreement", type: "Indemnification Agreement", version: "v0.4", updatedAt: "2026-07-21", status: "pending_review", notes: "Placeholder indemnity caps pending attorney review." },
  { id: "auth-letter-county", name: "Contractor Authorization Letter — County Submittals", type: "Contractor Authorization Letter", version: "v1.5", updatedAt: "2026-06-18", status: "active" },
  { id: "auth-letter-city", name: "Contractor Authorization Letter — Municipal Submittals", type: "Contractor Authorization Letter", version: "v1.1", updatedAt: "2026-05-05", status: "draft" },
];

function read(): LegalDoc[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as LegalDoc[];
  } catch {
    return SEED;
  }
}

function write(list: LegalDoc[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(LEGAL_EVT));
}

export function listLegalDocs(): LegalDoc[] {
  return read().slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function addLegalDoc(input: Omit<LegalDoc, "id">): LegalDoc {
  const row: LegalDoc = { ...input, id: Math.random().toString(36).slice(2, 10) };
  write([row, ...read()]);
  return row;
}

/** Bump a document to the next version and mark it pending review. */
export function newLegalVersion(id: string, version: string, notes?: string) {
  write(read().map((d) => (
    d.id === id
      ? { ...d, version, updatedAt: new Date().toISOString().slice(0, 10), status: "pending_review" as LegalDocStatus, notes: notes ?? d.notes }
      : d
  )));
}

export function downloadLegalDoc(doc: LegalDoc) {
  if (typeof window === "undefined") return;
  const text = [
    `CLÉARED — ${doc.name}`,
    `Type: ${doc.type}`,
    `Version: ${doc.version}`,
    `Last updated: ${doc.updatedAt}`,
    `Status: ${LEGAL_STATUS_META[doc.status].label}`,
    doc.gcName ? `Executed by: ${doc.gcName} on ${doc.signedAt}` : "",
    "",
    doc.status === "pending_review" ? "DRAFT — PENDING ATTORNEY REVIEW" : "",
    "",
    doc.notes ?? "",
  ].filter(Boolean).join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
