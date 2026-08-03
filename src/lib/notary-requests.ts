// LocalStorage-backed notary request store.
// Cleard performs remote online notarization in-house per FL Stat §117.265.

export type NotaryStatus = "requested" | "scheduled" | "completed" | "failed";

export type NotaryRequest = {
  id: string;
  projectId: string;
  projectName: string;
  clientName?: string;
  docId?: string;
  documentName: string;
  notes?: string;
  status: NotaryStatus;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  notarizedFilename?: string;
  /** Remote Online Notarization session details. */
  sessionAt?: string;
  provider?: string;
  confirmationNumber?: string;
  failureReason?: string;
};


const KEY = "cleared.notaryRequests.v1";
const EVT = "notary-requests:changed";

function read(): NotaryRequest[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list: NotaryRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listNotaryRequests(projectId?: string): NotaryRequest[] {
  const all = read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return projectId ? all.filter((r) => r.projectId === projectId) : all;
}
export function notaryForDoc(docId: string): NotaryRequest | undefined {
  return read().find((r) => r.docId === docId);
}

function notify(subject: string, lines: string[]) {
  try { console.info(`[NOTIFY] ${subject}\n${lines.join("\n")}`); } catch {}
}

export function createNotaryRequest(input: Omit<NotaryRequest, "id" | "createdAt" | "status">): NotaryRequest {
  const req: NotaryRequest = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: "requested",
  };
  write([req, ...read()]);
  notify(`Notary request → info@cleard.com`, [
    `Project: ${input.projectName}`,
    `Client: ${input.clientName ?? input.createdBy}`,
    `Document: ${input.documentName}`,
    input.notes ? `Notes: ${input.notes}` : "",
  ].filter(Boolean));
  return req;
}

export function completeNotary(id: string, notarizedFilename: string) {
  const list = read();
  const r = list.find((x) => x.id === id);
  if (!r) return;
  write(list.map((x) => x.id === id
    ? { ...x, status: "completed", completedAt: new Date().toISOString(), notarizedFilename }
    : x));
  notify(`Notarized document ready — ${r.projectName}`, [
    `Client: ${r.clientName ?? r.createdBy}`,
    `Document: ${r.documentName}`,
    `File: ${notarizedFilename}`,
  ]);
}

export function scheduleNotary(id: string, input: { sessionAt: string; provider: string; confirmationNumber: string }) {
  const list = read();
  const r = list.find((x) => x.id === id);
  if (!r) return;
  write(list.map((x) => (x.id === id ? { ...x, status: "scheduled" as NotaryStatus, ...input } : x)));
  notify(`RON session scheduled — ${r.projectName}`, [
    `Document: ${r.documentName}`,
    `Session: ${input.sessionAt}`,
    `Provider: ${input.provider} · Conf ${input.confirmationNumber}`,
  ]);
}

export function failNotary(id: string, reason: string) {
  write(read().map((x) => (x.id === id ? { ...x, status: "failed" as NotaryStatus, failureReason: reason } : x)));
}

export const NOTARY_EVT = EVT;

export function notaryBadge(status: NotaryStatus): { label: string; className: string; iconSeal?: boolean } {
  switch (status) {
    case "requested": return { label: "Pending Scheduling",     className: "bg-amber-500 text-white" };
    case "scheduled":  return { label: "Scheduled",             className: "bg-sky-600 text-white" };
    case "failed":     return { label: "Failed",                className: "bg-red-600 text-white" };
    case "completed":
    default:           return { label: "Notarized",             className: "bg-[#B8860B] text-white", iconSeal: true };
  }
}

