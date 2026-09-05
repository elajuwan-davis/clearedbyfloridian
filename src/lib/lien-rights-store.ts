/**
 * Lien Rights (FL Statute 713) — in-session mock store.
 *
 * UI-only: keeps generated documents, e-recording requests and settings in
 * module state so the four Lien Rights tabs stay in sync while navigating.
 * No network, no database — swap these readers for real APIs later.
 */

export type LienDocType =
  | "Notice of Commencement (NOC)"
  | "Notice to Owner"
  | "Lien Waiver — Conditional on Progress Payment"
  | "Lien Waiver — Conditional on Final Payment"
  | "Lien Waiver — Unconditional on Progress Payment"
  | "Lien Waiver — Unconditional on Final Payment";

export const LIEN_DOC_TYPES: LienDocType[] = [
  "Notice of Commencement (NOC)",
  "Notice to Owner",
  "Lien Waiver — Conditional on Progress Payment",
  "Lien Waiver — Conditional on Final Payment",
  "Lien Waiver — Unconditional on Progress Payment",
  "Lien Waiver — Unconditional on Final Payment",
];

export type LienDocStatus = "Draft" | "Sent" | "Recorded";

export type LienDoc = {
  id: string;
  type: LienDocType;
  project: string;
  address: string;
  claimant: string;
  ownerOrGc: string;
  contractAmount: string;
  throughDate?: string;
  generatedAt: string; // YYYY-MM-DD
  status: LienDocStatus;
};

export type LienProject = { id: string; name: string; address: string; county: string };

export const LIEN_PROJECTS: LienProject[] = [];

export const FL_COUNTIES = [
  "Miami-Dade",
  "Broward",
  "Palm Beach",
  "Martin",
  "St. Lucie",
  "Indian River",
  "Collier",
];

export type ERecordStatus = "Pending" | "Submitted to County" | "Recorded" | "Rejected";

export type ERecordRequest = {
  id: string;
  documentId: string;
  documentType: LienDocType;
  county: string;
  submittedAt: string;
  status: ERecordStatus;
};

export type ClaimantProfile = {
  companyName: string;
  licenseNumber: string;
  licenseType: string;
  mailingAddress: string;
  noticeEmail: string;
  phone: string;
};

export type LienSettings = {
  claimant: ClaimantProfile;
  signwellConnected: boolean;
};


let docs: LienDoc[] = [];

let requests: ERecordRequest[] = [];

let settings: LienSettings = {
  claimant: {
    companyName: "",
    licenseNumber: "",
    licenseType: "",
    mailingAddress: "",
    noticeEmail: "",
    phone: "",
  },
  signwellConnected: false,
};

const listeners = new Set<() => void>();

// useSyncExternalStore requires referentially stable snapshots — recompute the
// cached arrays only when the underlying data actually changes.
let docsSnapshot: LienDoc[] = [...docs].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
let requestsSnapshot: ERecordRequest[] = [...requests];

function refreshSnapshots() {
  docsSnapshot = [...docs].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  requestsSnapshot = [...requests];
}

function emit() {
  refreshSnapshots();
  listeners.forEach((l) => l());
}
export function subscribeLienStore(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listLienDocs(): LienDoc[] {
  return docsSnapshot;
}

let seq = 1044;
export function addLienDoc(input: Omit<LienDoc, "id" | "generatedAt" | "status">): LienDoc {
  const doc: LienDoc = {
    ...input,
    id: `LD-${seq++}`,
    generatedAt: new Date().toISOString().slice(0, 10),
    status: "Draft",
  };
  docs = [doc, ...docs];
  emit();
  return doc;
}

export function markLienDocSent(id: string) {
  docs = docs.map((d) => (d.id === id && d.status === "Draft" ? { ...d, status: "Sent" } : d));
  emit();
}

export function listERecordRequests(): ERecordRequest[] {
  return requestsSnapshot;
}

let erSeq = 2072;
export function addERecordRequest(documentId: string, county: string): ERecordRequest {
  const doc = docs.find((d) => d.id === documentId);
  const req: ERecordRequest = {
    id: `ER-${erSeq++}`,
    documentId,
    documentType: doc?.type ?? "Notice of Commencement (NOC)",
    county,
    submittedAt: new Date().toISOString().slice(0, 10),
    status: "Pending",
  };
  requests = [req, ...requests];
  emit();
  return req;
}

export function getLienSettings(): LienSettings {
  return settings;
}

export function saveClaimantProfile(next: ClaimantProfile) {
  settings = { ...settings, claimant: next };
  emit();
}

export function setSignwellConnected(connected: boolean) {
  settings = { ...settings, signwellConnected: connected };
  emit();
}

/* ───────────────── Deadlines (FL Statute 713) ───────────────── */

export type DeadlineStatus = "On Track" | "Due Soon" | "Overdue" | "Complete";

export type LienDeadline = {
  project: string;
  milestone: string;
  deadline: string;
  complete?: boolean;
};

export const LIEN_DEADLINES: LienDeadline[] = [];

export function daysRemaining(deadline: string): number {
  const d = new Date(`${deadline}T00:00:00`);
  const now = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00");
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

export function deadlineStatus(row: LienDeadline): DeadlineStatus {
  if (row.complete) return "Complete";
  const days = daysRemaining(row.deadline);
  if (days < 0) return "Overdue";
  if (days <= 14) return "Due Soon";
  return "On Track";
}

export const MILESTONE_RULE: Record<string, string> = {
  "NOC Recording": "Must be recorded before the first inspection",
  "Notice to Owner": "Serve within 45 days of first furnishing",
  "Claim of Lien": "Serve within 90 days of last furnishing",
  "Action on Lien": "File within 1 year of the claim of lien",
};

/* ───────────────── Document body rendering ───────────────── */

export function renderLienDocText(doc: LienDoc): string {
  const header = `STATE OF FLORIDA — ${doc.type.toUpperCase()}
Pursuant to Florida Statute 713

Document No.:      ${doc.id}
Date Generated:    ${doc.generatedAt}
Status:            ${doc.status}
`;

  const parties = `
PROPERTY
  Project:         ${doc.project}
  Address:         ${doc.address}

PARTIES
  Claimant:        ${doc.claimant}
  Owner / GC:      ${doc.ownerOrGc}

CONTRACT
  Amount:          ${doc.contractAmount}${doc.throughDate ? `\n  Through Date:    ${doc.throughDate}` : ""}
`;

  const body = doc.type.startsWith("Lien Waiver")
    ? `
WAIVER AND RELEASE
  The undersigned lienor, in consideration of the sum stated above, waives and
  releases its lien and right to claim a lien for labor, services, or materials
  furnished to the above-referenced property through ${doc.throughDate ?? "the date stated above"}.
  ${
    doc.type.includes("Conditional")
      ? "This waiver is conditional upon actual receipt and clearance of payment."
      : "This waiver is unconditional and effective upon execution."
  }
`
    : doc.type === "Notice of Commencement (NOC)"
      ? `
NOTICE OF COMMENCEMENT
  The undersigned hereby gives notice that improvements will be made to the
  real property described above. This notice must be recorded and posted on the
  job site before the first inspection.
`
      : `
PRELIMINARY NOTICE TO OWNER
  The undersigned is furnishing labor, services, or materials for the
  improvement of the property described above, and serves this notice to
  preserve lien rights under Florida Statute 713.06.
`;

  return `${header}${parties}${body}
SIGNATURE
  ______________________________        Date: ______________
  ${doc.claimant}

This document is generated for review. Consult a licensed Florida construction
attorney before filing any lien document.`;
}
