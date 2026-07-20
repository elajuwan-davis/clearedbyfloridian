// LocalStorage-backed e-signature request store.
// Wire to Signwell API by replacing `sendToProvider` with a server-fn call.

export type SigStatus = "draft" | "sent" | "viewed" | "signed" | "declined";
export type RecipientRole = "Homeowner" | "General Contractor" | "Subcontractor" | "Other";

export type SignatureRequest = {
  id: string;
  projectId: string;
  docId?: string;              // links to ProjectDoc when applicable
  documentName: string;        // e.g. "NTBO", "Owner Authorization", filename
  recipientEmail: string;
  recipientRole: RecipientRole;
  message?: string;
  status: SigStatus;
  createdAt: string;
  signedAt?: string;
  signedBy?: string;
  signwellId?: string;         // provider id when integrated
};

const KEY = "cleared.signatureRequests.v1";
const EVT = "signature-requests:changed";

function read(): SignatureRequest[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list: SignatureRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listSignatureRequests(projectId?: string): SignatureRequest[] {
  const all = read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return projectId ? all.filter((r) => r.projectId === projectId) : all;
}

export function getSignatureForDoc(docId: string): SignatureRequest | undefined {
  return read().find((r) => r.docId === docId);
}

export function sigStatusForDocument(projectId: string, documentName: string): SignatureRequest | undefined {
  return read().find((r) => r.projectId === projectId && r.documentName === documentName);
}

export async function sendForSignature(input: {
  projectId: string;
  docId?: string;
  documentName: string;
  recipientEmail: string;
  recipientRole: RecipientRole;
  message?: string;
}): Promise<SignatureRequest> {
  // TODO: replace with Signwell API call via server function.
  // await signwell.documents.create({ ... })
  const req: SignatureRequest = {
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: "sent",
    ...input,
  };
  write([req, ...read()]);
  return req;
}

export function updateStatus(id: string, status: SigStatus, signedBy?: string) {
  const list = read().map((r) =>
    r.id === id
      ? { ...r, status, signedAt: status === "signed" ? new Date().toISOString() : r.signedAt, signedBy: signedBy ?? r.signedBy }
      : r
  );
  write(list);
}

export const SIG_EVT = EVT;

export function sigBadge(status: SigStatus): { label: string; className: string } {
  switch (status) {
    case "signed":   return { label: "Signed",              className: "bg-emerald-600 text-white" };
    case "sent":     return { label: "Sent for Signature",  className: "bg-sky-600 text-white" };
    case "viewed":   return { label: "Viewed",              className: "bg-indigo-600 text-white" };
    case "declined": return { label: "Declined",            className: "bg-oxblood text-white" };
    default:         return { label: "Draft",               className: "bg-obsidian/10 text-obsidian" };
  }
}
