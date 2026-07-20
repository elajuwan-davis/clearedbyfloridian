// Registered contractors — used to pre-fill NTBO / Owner Auth forms.
// localStorage-backed until wired to Supabase (table: registered_contractors).

export type Contractor = {
  id: string;
  firm_name: string;
  contact_name: string;
  address: string;
  phone: string;
  email: string;
  license_number: string;
  license_type: string; // e.g. CPC, CGC, EC, CFC, CAC
  active: boolean;
  created_at: string;
};

const KEY = "cleared.contractors.v1";
const EVT = "contractors:changed";

const SEED: Contractor[] = [
  {
    id: "seed-floridian",
    firm_name: "Flōridian",
    contact_name: "Elajuwan Davis",
    address: "1000 S Pine Island Rd, Suite 155, Plantation, FL 33324",
    phone: "(561) 555-0100",
    email: "team@floridianinc.com",
    license_number: "CPC1459161",
    license_type: "CPC",
    active: true,
    created_at: new Date("2026-01-01").toISOString(),
  },
];

function read(): Contractor[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Contractor[];
  } catch {
    return SEED;
  }
}

function write(list: Contractor[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listContractors(activeOnly = false): Contractor[] {
  const list = read().sort((a, b) => a.firm_name.localeCompare(b.firm_name));
  return activeOnly ? list.filter((c) => c.active) : list;
}

export function getContractor(id: string): Contractor | undefined {
  return read().find((c) => c.id === id);
}

export function addContractor(
  input: Omit<Contractor, "id" | "created_at">,
): Contractor {
  const rec: Contractor = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    created_at: new Date().toISOString(),
  };
  write([rec, ...read()]);
  return rec;
}

export function updateContractor(id: string, patch: Partial<Contractor>) {
  write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function deleteContractor(id: string) {
  write(read().filter((c) => c.id !== id));
}

export function subscribeContractors(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

export const LICENSE_TYPES = ["CPC", "CGC", "CBC", "CRC", "EC", "CFC", "CAC", "SI", "Other"] as const;
