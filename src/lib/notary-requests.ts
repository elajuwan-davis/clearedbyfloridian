// LocalStorage-backed notary request store.
// Flōridian performs remote online notarization in-house per FL Stat §117.265.

export type NotaryStatus = "requested" | "scheduled" | "in_session" | "completed";

export type NotaryRequest = {
  id: string;
  projectId: string;
  projectName: string;
  clientName?: string;
  docId?: string;
  documentName: string;
  preferredAt: string;    // client's preferred datetime-local
  notes?: string;
  status: NotaryStatus;
  createdAt: string;
  createdBy: string;
  scheduledFor?: string;
  sessionLink?: string;
  completedAt?: string;
  notarizedFilename?: string;
  sealDate?: string;
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
  // Notification stub — server email wiring goes here (Resend/Mailgun/Lovable Emails).
  try {
    console.info(`[NOTIFY] ${subject}\n${lines.join("\n")}`);
  } catch {}
}

export function createNotaryRequest(input: Omit<NotaryRequest, "id" | "createdAt" | "status">): NotaryRequest {
  const req: NotaryRequest = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: "requested",
  };
  write([req, ...read()]);
  notify(`Notary request → team@floridianinc.com`, [
    `Project: ${input.projectName}`,
    `Client: ${input.clientName ?? input.createdBy}`,
    `Document: ${input.documentName}`,
    `Preferred: ${input.preferredAt}`,
    input.notes ? `Notes: ${input.notes}` : "",
  ].filter(Boolean));
  return req;
}

export function scheduleNotary(id: string, scheduledFor: string, sessionLink: string) {
  const list = read();
  const r = list.find((x) => x.id === id);
  if (!r) return;
  write(list.map((x) => x.id === id ? { ...x, status: "scheduled", scheduledFor, sessionLink } : x));
  notify(`Notary scheduled for ${r.projectName}`, [
    `Client: ${r.clientName ?? r.createdBy}`,
    `Document: ${r.documentName}`,
    `When: ${scheduledFor}`,
    `Session link: ${sessionLink}`,
  ]);
}

export function markInSession(id: string) {
  write(read().map((r) => r.id === id ? { ...r, status: "in_session" } : r));
}

export function completeNotary(id: string, notarizedFilename: string, sealDate?: string) {
  const list = read();
  const r = list.find((x) => x.id === id);
  if (!r) return;
  write(list.map((x) => x.id === id
    ? { ...x, status: "completed", completedAt: new Date().toISOString(), notarizedFilename, sealDate }
    : x));
  notify(`Notarized document ready — ${r.projectName}`, [
    `Client: ${r.clientName ?? r.createdBy}`,
    `Document: ${r.documentName}`,
    `File: ${notarizedFilename}`,
    sealDate ? `Seal date: ${sealDate}` : "",
  ].filter(Boolean));
}

export const NOTARY_EVT = EVT;

export function notaryBadge(status: NotaryStatus): { label: string; className: string; iconSeal?: boolean; pulse?: boolean } {
  switch (status) {
    case "requested":  return { label: "Notarization Requested", className: "bg-amber-500 text-white" };
    case "scheduled":  return { label: "Notarization Scheduled", className: "bg-sky-600 text-white" };
    case "in_session": return { label: "In Session",             className: "bg-emerald-600 text-white", pulse: true };
    case "completed":  return { label: "Notarized",              className: "bg-[#B8860B] text-white", iconSeal: true };
  }
}
