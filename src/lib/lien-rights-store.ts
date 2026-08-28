/**
 * Lien Rights (FL Statute 713) — in-session mock store.
 *
 * UI-only: keeps generated documents, e-recording requests and settings in
 * module state so the four Lien Rights tabs stay in sync while navigating.
 * No network, no database — swap these readers for real APIs later.
 */

export type LienDocType =
  | "Notice of Commencement (NOC)"
  | "Preliminary Notice"
  | "Lien Waiver — Conditional on Progress Payment"
  | "Lien Waiver — Conditional on Final Payment"
  | "Lien Waiver — Unconditional on Progress Payment"
  | "Lien Waiver — Unconditional on Final Payment";

export const LIEN_DOC_TYPES: LienDocType[] = [
  "Notice of Commencement (NOC)",
  "Preliminary Notice",
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

export const LIEN_PROJECTS: LienProject[] = [
  { id: "p-1", name: "Aldrich Residence", address: "418 Seabreeze Ave, Palm Beach, FL 33480", county: "Palm Beach" },
  { id: "p-2", name: "Coastline — Jupiter Ridge", address: "1120 Ridge Rd, Jupiter, FL 33477", county: "Palm Beach" },
  { id: "p-3", name: "Marlow Estate", address: "77 Sewall's Point Rd, Stuart, FL 34996", county: "Martin" },
  { id: "p-4", name: "Vista Bay Villas", address: "3402 Indian River Dr, Fort Pierce, FL 34949", county: "St. Lucie" },
];

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

const today = new Date();
function iso(offsetDays: number) {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

let docs: LienDoc[] = [
  {
    id: "LD-1041",
    type: "Notice of Commencement (NOC)",
    project: "Aldrich Residence",
    address: LIEN_PROJECTS[0]!.address,
    claimant: "Floridian LLC",
    ownerOrGc: "Marion Aldrich",
    contractAmount: "$1,480,000",
    generatedAt: iso(-24),
    status: "Recorded",
  },
  {
    id: "LD-1042",
    type: "Preliminary Notice",
    project: "Coastline — Jupiter Ridge",
    address: LIEN_PROJECTS[1]!.address,
    claimant: "Floridian LLC",
    ownerOrGc: "Coastline Builders Group",
    contractAmount: "$865,000",
    generatedAt: iso(-11),
    status: "Sent",
  },
  {
    id: "LD-1043",
    type: "Lien Waiver — Conditional on Progress Payment",
    project: "Marlow Estate",
    address: LIEN_PROJECTS[2]!.address,
    claimant: "Floridian LLC",
    ownerOrGc: "Dana Marlow",
    contractAmount: "$392,500",
    throughDate: iso(-5),
    generatedAt: iso(-4),
    status: "Draft",
  },
];

let requests: ERecordRequest[] = [
  {
    id: "ER-2071",
    documentId: "LD-1041",
    documentType: "Notice of Commencement (NOC)",
    county: "Palm Beach",
    submittedAt: iso(-22),
    status: "Recorded",
  },
];

let settings: LienSettings = {
  claimant: {
    companyName: "Floridian LLC",
    licenseNumber: "CGC1521884",
    licenseType: "Certified General Contractor",
    mailingAddress: "215 Clematis St, Suite 200, West Palm Beach, FL 33401",
    noticeEmail: "liens@floridianinc.com",
    phone: "(561) 555-0142",
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

export const LIEN_DEADLINES: LienDeadline[] = [
  { project: "Aldrich Residence", milestone: "NOC Recording", deadline: iso(-24), complete: true },
  { project: "Aldrich Residence", milestone: "Preliminary Notice", deadline: iso(9) },
  { project: "Aldrich Residence", milestone: "Claim of Lien", deadline: iso(64) },
  { project: "Coastline — Jupiter Ridge", milestone: "NOC Recording", deadline: iso(-40), complete: true },
  { project: "Coastline — Jupiter Ridge", milestone: "Preliminary Notice", deadline: iso(-3) },
  { project: "Coastline — Jupiter Ridge", milestone: "Claim of Lien", deadline: iso(41) },
  { project: "Marlow Estate", milestone: "Preliminary Notice", deadline: iso(12) },
  { project: "Marlow Estate", milestone: "Claim of Lien", deadline: iso(78) },
  { project: "Marlow Estate", milestone: "Action on Lien", deadline: iso(320) },
  { project: "Vista Bay Villas", milestone: "NOC Recording", deadline: iso(4) },
  { project: "Vista Bay Villas", milestone: "Preliminary Notice", deadline: iso(31) },
  { project: "Vista Bay Villas", milestone: "Action on Lien", deadline: iso(-9) },
];

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
  "Preliminary Notice": "Serve within 45 days of first furnishing",
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
