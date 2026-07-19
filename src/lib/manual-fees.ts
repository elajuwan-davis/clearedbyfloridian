// Manual permit fee entries — localStorage-backed until Supabase is wired.

export type ManualFeeType =
  | "Building Permit Fee"
  | "Electrical Permit Fee"
  | "Plumbing Permit Fee"
  | "Mechanical Permit Fee"
  | "Other";

export const FEE_TYPES: ManualFeeType[] = [
  "Building Permit Fee",
  "Electrical Permit Fee",
  "Plumbing Permit Fee",
  "Mechanical Permit Fee",
  "Other",
];

export type ManualFee = {
  id: string;
  projectId: string;
  feeType: ManualFeeType;
  amountCents: number;
  notes?: string;
  datePaid: string; // ISO yyyy-mm-dd
  createdAt: string;
};

const KEY = "cleared.manualFees.v1";

function read(): ManualFee[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ManualFee[]) : [];
  } catch {
    return [];
  }
}

function write(list: ManualFee[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("manual-fees:changed"));
}

export function listAllFees(): ManualFee[] {
  return read();
}

export function listFeesForProject(projectId: string): ManualFee[] {
  return read()
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => (a.datePaid < b.datePaid ? 1 : -1));
}

export function totalForProject(projectId: string): number {
  return listFeesForProject(projectId).reduce((s, f) => s + f.amountCents, 0);
}

export function addFee(fee: Omit<ManualFee, "id" | "createdAt">): ManualFee {
  const record: ManualFee = {
    ...fee,
    id: Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
  };
  write([record, ...read()]);
  return record;
}

export function updateFee(id: string, patch: Partial<Omit<ManualFee, "id" | "createdAt">>) {
  write(read().map((f) => (f.id === id ? { ...f, ...patch } : f)));
}

export function deleteFee(id: string) {
  write(read().filter((f) => f.id !== id));
}

export function fmtUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function parseDollarsToCents(v: string): number {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  if (!isFinite(n)) return 0;
  return Math.round(n * 100);
}
