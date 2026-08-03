// localStorage-backed revision (correction round) tracking per project.
// A project can have many rounds; each round moves through:
//   corrections_requested -> revised_uploaded -> resubmitted

export type RevisionStatus = "corrections_requested" | "revised_uploaded" | "resubmitted";

export type RevisionFile = {
  name: string;
  path: string | null;
  uploadedAt: string;
};

export type RevisionRound = {
  id: string;
  projectId: string;
  round: number;
  dateReceived: string; // YYYY-MM-DD
  department: string;
  corrections: string;
  status: RevisionStatus;
  files: RevisionFile[];
  resubmittedAt: string | null; // ISO
  createdAt: string;
};

export const REVISION_EVT = "project-revisions:changed";

const KEY = "cleared.projectRevisions.v1";

export const REVISION_STATUS_META: Record<RevisionStatus, { label: string; tone: "red" | "amber" | "blue" }> = {
  corrections_requested: { label: "Corrections Requested", tone: "red" },
  revised_uploaded: { label: "Revised Plans Uploaded", tone: "amber" },
  resubmitted: { label: "Resubmitted", tone: "blue" },
};

export const REVISION_TONE_CLASS: Record<"red" | "amber" | "blue", string> = {
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  blue: "bg-sky-50 text-sky-800 border-sky-200",
};

function read(): RevisionRound[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RevisionRound[]) : [];
  } catch {
    return [];
  }
}

function write(list: RevisionRound[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(REVISION_EVT));
}

export function listRevisions(projectId: string): RevisionRound[] {
  return read()
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.round - a.round);
}

export function nextRound(projectId: string): number {
  return (listRevisions(projectId)[0]?.round ?? 0) + 1;
}

export function addRevision(input: {
  projectId: string;
  dateReceived: string;
  department: string;
  corrections: string;
}): RevisionRound {
  const row: RevisionRound = {
    id: Math.random().toString(36).slice(2, 10),
    projectId: input.projectId,
    round: nextRound(input.projectId),
    dateReceived: input.dateReceived,
    department: input.department.trim(),
    corrections: input.corrections.trim(),
    status: "corrections_requested",
    files: [],
    resubmittedAt: null,
    createdAt: new Date().toISOString(),
  };
  write([row, ...read()]);
  return row;
}

export function attachRevisionFile(id: string, file: RevisionFile) {
  write(
    read().map((r) =>
      r.id === id
        ? { ...r, files: [...r.files, file], status: r.status === "corrections_requested" ? "revised_uploaded" : r.status }
        : r,
    ),
  );
}

export function markResubmitted(id: string) {
  write(
    read().map((r) =>
      r.id === id ? { ...r, status: "resubmitted", resubmittedAt: new Date().toISOString() } : r,
    ),
  );
}

export function deleteRevision(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function currentRevisionStatus(projectId: string): RevisionStatus | null {
  return listRevisions(projectId)[0]?.status ?? null;
}
