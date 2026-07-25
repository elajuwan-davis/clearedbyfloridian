// GC Client tier — external general contractor accounts (not Cleard staff).
// Managed by admin; persisted in localStorage for the scaffold.

export type GCClient = {
  id: string;
  firmName: string;
  contactName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  projectIds: string[]; // assigned project ids
  createdAt: string;
};

const STORE_KEY = "cleared_gc_clients";
const SESSION_KEY = "cleared_gc_client_id";

const SEED: GCClient[] = [
  {
    id: "gc-coastline",
    firmName: "Coastline Builders Group",
    contactName: "Marcus Coastline",
    email: "marcus@coastlinebuilders.com",
    phone: "(561) 555-0142",
    licenseNumber: "CGC1523401",
    projectIds: [],
    createdAt: new Date().toISOString(),
  },
];

function read(): GCClient[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as GCClient[];
  } catch {
    return SEED;
  }
}

function write(clients: GCClient[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(clients));
  window.dispatchEvent(new CustomEvent("gc-clients:changed"));
}

export function listGCClients(): GCClient[] {
  return read();
}

export function getGCClientByEmail(email: string): GCClient | null {
  const norm = email.trim().toLowerCase();
  return read().find((c) => c.email.toLowerCase() === norm) ?? null;
}

export function getGCClientById(id: string): GCClient | null {
  return read().find((c) => c.id === id) ?? null;
}

export function addGCClient(input: Omit<GCClient, "id" | "createdAt">): GCClient {
  const client: GCClient = {
    ...input,
    id: `gc-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  write([client, ...read()]);
  return client;
}

export function updateGCClient(id: string, patch: Partial<GCClient>): void {
  write(read().map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c)));
}

export function deleteGCClient(id: string): void {
  write(read().filter((c) => c.id !== id));
}

// Session helpers
export function setGCSession(clientId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, clientId);
}

export function getGCSession(): GCClient | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getGCClientById(id);
}

export function clearGCSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
