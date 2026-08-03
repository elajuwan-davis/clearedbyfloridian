// Staff assignment / internal ops — localStorage-backed mock persistence.
import { PROJECTS } from "./projects-data";
import { logAudit } from "./audit-log";

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  email: string;
};

export const CLEARED_STAFF: StaffMember[] = [
  { id: "elajuwan", name: "Elajuwan Wallace", role: "Senior Permit Runner", email: "elajuwan@floridianinc.com" },
  { id: "eman", name: "Eman Youssef", role: "Permit Expediter", email: "eman@floridianinc.com" },
  { id: "jose", name: "Jose Ramirez", role: "Plan Review Coordinator", email: "jose@floridianinc.com" },
  { id: "paul", name: "Paul Sifford", role: "Operations Manager", email: "paul@floridianinc.com" },
  { id: "briana", name: "Briana Torres", role: "Permit Expediter", email: "briana@floridianinc.com" },
  { id: "marcus", name: "Marcus Odom", role: "Inspections Coordinator", email: "marcus@floridianinc.com" },
];

export type Priority = "normal" | "high" | "urgent";

export type ProjectOps = {
  projectId: string;
  assigneeId: string;
  priority: Priority;
  escalated: boolean;
  escalatedAt?: string;
};

const KEY = "cleared.staffOps.v1";
const SEED_FLAG = "cleared.staffOps.seeded.v1";

function read(): Record<string, ProjectOps> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProjectOps>) : {};
  } catch {
    return {};
  }
}

function write(map: Record<string, ProjectOps>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("staff-ops:changed"));
}

function seededHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  const map = read();
  const PRIORITIES: Priority[] = ["normal", "normal", "normal", "high", "urgent"];
  for (const p of PROJECTS) {
    if (map[p.id]) continue;
    const staff = CLEARED_STAFF[seededHash(p.id) % CLEARED_STAFF.length];
    const priority = PRIORITIES[seededHash(p.id + "p") % PRIORITIES.length];
    const escalated = seededHash(p.id + "e") % 9 === 0 && p.status !== "permit_issued";
    map[p.id] = {
      projectId: p.id,
      assigneeId: staff.id,
      priority,
      escalated,
      escalatedAt: escalated ? new Date(Date.now() - (seededHash(p.id + "t") % 5) * 86400000).toISOString() : undefined,
    };
  }
  write(map);
  window.localStorage.setItem(SEED_FLAG, "1");
}

export function getAllOps(): ProjectOps[] {
  ensureSeeded();
  return Object.values(read());
}

export function getOps(projectId: string): ProjectOps | null {
  ensureSeeded();
  return read()[projectId] ?? null;
}

export function getStaffById(id: string): StaffMember | undefined {
  return CLEARED_STAFF.find((s) => s.id === id);
}

function currentActor(): string {
  if (typeof window === "undefined") return "Staff";
  return window.localStorage.getItem("cleared_demo_user") || "Staff";
}

export function setAssignee(projectId: string, assigneeId: string, projectLabel: string) {
  ensureSeeded();
  const map = read();
  const existing = map[projectId];
  map[projectId] = {
    projectId,
    assigneeId,
    priority: existing?.priority ?? "normal",
    escalated: existing?.escalated ?? false,
    escalatedAt: existing?.escalatedAt,
  };
  write(map);
  const staff = getStaffById(assigneeId);
  logAudit(currentActor(), "staff.assigned", {
    projectId,
    record: projectLabel,
    details: `Assigned to ${staff?.name ?? assigneeId}`,
  });
}

export function setPriority(projectId: string, priority: Priority, projectLabel: string) {
  ensureSeeded();
  const map = read();
  const existing = map[projectId];
  if (!existing) return;
  map[projectId] = { ...existing, priority };
  write(map);
  logAudit(currentActor(), "staff.assigned", { projectId, record: projectLabel, details: `Priority set to ${priority}` });
}

export function setEscalated(projectId: string, escalated: boolean, projectLabel: string) {
  ensureSeeded();
  const map = read();
  const existing = map[projectId];
  if (!existing) return;
  map[projectId] = {
    ...existing,
    escalated,
    escalatedAt: escalated ? new Date().toISOString() : undefined,
  };
  write(map);
  logAudit(currentActor(), escalated ? "escalation.set" : "escalation.cleared", {
    projectId,
    record: projectLabel,
  });
}

/** Best-effort match for surfaces that don't carry a projects-data id (e.g. the
 *  Supabase-backed permits table) — matches by project name substring. */
export function isEscalatedByName(name: string): boolean {
  ensureSeeded();
  const map = read();
  const project = PROJECTS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(p.name.toLowerCase()),
  );
  if (!project) return false;
  return map[project.id]?.escalated ?? false;
}
