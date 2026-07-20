// Florida lien waiver store (client-side mock).
// Wire to Signwell + PDF generation on the backend later.

export type WaiverType =
  | "conditional_progress"
  | "unconditional_progress"
  | "conditional_final"
  | "unconditional_final";

export const WAIVER_TYPE_LABEL: Record<WaiverType, string> = {
  conditional_progress: "Conditional Waiver on Progress Payment",
  unconditional_progress: "Unconditional Waiver on Progress Payment",
  conditional_final: "Conditional Waiver on Final Payment",
  unconditional_final: "Unconditional Waiver on Final Payment",
};

export type WaiverStatus = "sent" | "signed" | "stored";

export type LienWaiver = {
  id: string;
  projectId: string;
  subId: string;
  subCompany: string;
  subEmail?: string;
  waiverType: WaiverType;
  amount: number;
  paymentDate: string; // yyyy-mm-dd
  throughDate?: string; // yyyy-mm-dd (conditional only)
  propertyAddress: string;
  status: WaiverStatus;
  createdAt: string;
  signedAt?: string;
  signwellId?: string;
};

const KEY = "cleared.lienWaivers.v1";
const EVT = "lien-waivers:changed";

function read(): LienWaiver[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list: LienWaiver[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listWaivers(projectId?: string): LienWaiver[] {
  const all = read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return projectId ? all.filter((w) => w.projectId === projectId) : all;
}

export function createWaiver(input: Omit<LienWaiver, "id" | "createdAt" | "status">): LienWaiver {
  const w: LienWaiver = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: "sent",
  };
  write([w, ...read()]);
  return w;
}

export function markSigned(id: string) {
  write(read().map((w) => (w.id === id ? { ...w, status: "signed", signedAt: new Date().toISOString() } : w)));
}

export const LIEN_WAIVER_EVT = EVT;

export function isConditional(t: WaiverType) {
  return t === "conditional_progress" || t === "conditional_final";
}

export function waiverBadge(status: WaiverStatus): { label: string; className: string } {
  switch (status) {
    case "sent":
      return { label: "Sent", className: "border-blue-600/40 bg-blue-50 text-blue-800" };
    case "signed":
      return { label: "Signed", className: "border-emerald-600/40 bg-emerald-50 text-emerald-800" };
    case "stored":
      return { label: "Lien Waiver — Signed", className: "border-emerald-600/40 bg-emerald-50 text-emerald-800" };
  }
}
