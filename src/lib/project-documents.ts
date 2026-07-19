// LocalStorage-backed document metadata store for the project detail page.
// Files themselves aren't persisted — this tracks the checklist and upload state.

export const DOC_TYPES = [
  "Stamped Construction Plans",
  "Site/Spot Survey",
  "Product Approvals / NOA",
  "Truss Packet",
  "Energy Calcs",
  "Civil / Other",
  "COI (Certificate of Insurance)",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export type ProjectDoc = {
  id: string;
  projectId: string;
  type: DocType;
  filename: string;
  uploadedBy: string;
  uploadedAt: string; // ISO date
  status: "uploaded" | "pending";
};

const KEY = "cleared.projectDocs.v1";

function read(): ProjectDoc[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProjectDoc[]) : [];
  } catch {
    return [];
  }
}

function write(list: ProjectDoc[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("project-docs:changed"));
}

export function listDocs(projectId: string): ProjectDoc[] {
  return read()
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export function addDoc(input: Omit<ProjectDoc, "id" | "uploadedAt" | "status"> & { status?: ProjectDoc["status"] }) {
  const doc: ProjectDoc = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    uploadedAt: new Date().toISOString().slice(0, 10),
    status: input.status ?? "uploaded",
  };
  write([doc, ...read()]);
  return doc;
}

export function deleteDoc(id: string) {
  write(read().filter((d) => d.id !== id));
}
