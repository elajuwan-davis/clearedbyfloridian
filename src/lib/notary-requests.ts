// LocalStorage-backed notary request store.

export type NotaryStatus = "requested" | "scheduled" | "completed";

export type NotaryRequest = {
  id: string;
  projectId: string;
  projectName: string;
  docId?: string;
  documentName: string;
  preferredAt: string;    // ISO date (yyyy-mm-dd) or datetime
  notes?: string;
  status: NotaryStatus;
  createdAt: string;
  createdBy: string;
  scheduledFor?: string;
  completedAt?: string;
  notarizedFilename?: string;
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

export function createNotaryRequest(input: Omit<NotaryRequest, "id" | "createdAt" | "status">): NotaryRequest {
  const req: NotaryRequest = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: "requested",
  };
  write([req, ...read()]);
  // Notification stub — in production, hit /api/notify or an email server fn.
  try {
    console.info(
      `[NOTIFY team@floridianinc.com] Notary request for ${input.projectName} — ${input.documentName} — preferred ${input.preferredAt}`
    );
  } catch {}
  return req;
}

export function scheduleNotary(id: string, scheduledFor: string) {
  write(read().map((r) => r.id === id ? { ...r, status: "scheduled", scheduledFor } : r));
}

export function completeNotary(id: string, notarizedFilename: string) {
  write(read().map((r) => r.id === id
    ? { ...r, status: "completed", completedAt: new Date().toISOString(), notarizedFilename }
    : r));
}

export const NOTARY_EVT = EVT;

export function notaryBadge(status: NotaryStatus): { label: string; className: string; iconSeal?: boolean } {
  switch (status) {
    case "requested": return { label: "Notarization Requested", className: "bg-amber-500 text-white" };
    case "scheduled": return { label: "Notarization Scheduled", className: "bg-sky-600 text-white" };
    case "completed": return { label: "Notarized",              className: "bg-[#B8860B] text-white", iconSeal: true };
  }
}
