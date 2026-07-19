// Simple localStorage-backed internal notes per project (staff-only surface).

export type ProjectNote = {
  id: string;
  projectId: string;
  author: string;
  body: string;
  createdAt: string; // ISO
};

const KEY = "cleared.projectNotes.v1";

function read(): ProjectNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProjectNote[]) : [];
  } catch {
    return [];
  }
}

function write(list: ProjectNote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("project-notes:changed"));
}

export function listNotes(projectId: string): ProjectNote[] {
  return read()
    .filter((n) => n.projectId === projectId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addNote(projectId: string, author: string, body: string): ProjectNote {
  const note: ProjectNote = {
    id: Math.random().toString(36).slice(2, 10),
    projectId,
    author,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };
  write([note, ...read()]);
  return note;
}

export function deleteNote(id: string) {
  write(read().filter((n) => n.id !== id));
}
