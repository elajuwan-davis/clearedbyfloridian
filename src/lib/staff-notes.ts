// Internal-only staff notes per project — never surfaced to the GC.
export type StaffNote = {
  id: string;
  projectId: string;
  author: string;
  body: string;
  createdAt: string;
};

const KEY = "cleared.staffNotes.v1";

function read(): StaffNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StaffNote[]) : [];
  } catch {
    return [];
  }
}

function write(list: StaffNote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("staff-notes:changed"));
}

export function listStaffNotes(projectId: string): StaffNote[] {
  return read()
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addStaffNote(projectId: string, author: string, body: string): StaffNote {
  const note: StaffNote = {
    id: Math.random().toString(36).slice(2, 10),
    projectId,
    author,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  write([note, ...read()]);
  return note;
}
