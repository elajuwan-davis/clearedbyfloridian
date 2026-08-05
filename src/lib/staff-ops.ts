// Staff assignment / internal ops — live admin roster + localStorage-backed assignment map.
import { PROJECTS } from "./projects-data";
import { logAudit } from "./audit-log";
import { supabase } from "@/integrations/supabase/client";
import { nameFromEmail } from "@/lib/profile-api";

export type StaffMember = {
  id: string;
  name: string;
  /** profiles.job_title — empty string when unset (never invent a title). */
  role: string;
  email: string;
};

/** @deprecated Prefer listStaffAdmins() / useStaffAdmins(). Kept as a mutable cache for sync callers. */
export let CLEARED_STAFF: StaffMember[] = [];

type ProfileLite = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  job_title: string | null;
};

function emailLocalPart(email: string): string {
  return (email.split("@")[0] ?? "").toLowerCase();
}

function emailDomain(email: string): string {
  return (email.split("@")[1] ?? "").toLowerCase();
}

function preferClearedDuplicate(a: StaffMember, b: StaffMember): StaffMember {
  const aCleared = emailDomain(a.email) === "cleared.com";
  const bCleared = emailDomain(b.email) === "cleared.com";
  if (aCleared && !bCleared) return a;
  if (bCleared && !aCleared) return b;
  return a;
}

/** Drop @test.invalid and collapse same-local-part duplicates (prefer @cleared.com). */
export function filterStaffAdmins(rows: StaffMember[]): StaffMember[] {
  const usable = rows.filter((s) => {
    const email = (s.email || "").toLowerCase();
    if (!email || !email.includes("@")) return false;
    if (email.endsWith("@test.invalid")) return false;
    return true;
  });

  const byLocal = new Map<string, StaffMember>();
  for (const s of usable) {
    const local = emailLocalPart(s.email);
    const existing = byLocal.get(local);
    if (!existing) {
      byLocal.set(local, s);
      continue;
    }
    byLocal.set(local, preferClearedDuplicate(existing, s));
  }

  return [...byLocal.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

function profileToStaff(p: ProfileLite): StaffMember {
  const email = (p.email ?? "").trim();
  const name =
    (p.display_name || p.full_name || nameFromEmail(email || null) || "Staff").trim() || "Staff";
  const role = (p.job_title ?? "").trim();
  return { id: p.id, name, role, email };
}

/** Live admins from user_roles + profiles. Requires an admin session (RLS). */
export async function listStaffAdmins(): Promise<StaffMember[]> {
  const { data: roles, error: rolesErr } = await (supabase.from("user_roles" as any) as any)
    .select("user_id")
    .eq("role", "admin");
  if (rolesErr) throw new Error(rolesErr.message);
  const ids = [...new Set(((roles ?? []) as Array<{ user_id: string }>).map((r) => r.user_id).filter(Boolean))];
  if (ids.length === 0) {
    CLEARED_STAFF = [];
    return [];
  }

  const { data: profiles, error: profErr } = await (supabase.from("profiles" as any) as any)
    .select("id, email, display_name, full_name, job_title")
    .in("id", ids);

  let profileRows = (profiles ?? []) as ProfileLite[];
  if (profErr) {
    // Column may not exist until 20260808120000_profiles_job_title.sql is applied.
    const missingTitle = /job_title/i.test(profErr.message);
    if (!missingTitle) throw new Error(profErr.message);
    const { data: fallback, error: fallbackErr } = await (supabase.from("profiles" as any) as any)
      .select("id, email, display_name, full_name")
      .in("id", ids);
    if (fallbackErr) throw new Error(fallbackErr.message);
    profileRows = ((fallback ?? []) as ProfileLite[]).map((p) => ({ ...p, job_title: null }));
  }

  const staff = filterStaffAdmins(profileRows.map(profileToStaff));
  CLEARED_STAFF = staff;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("staff-ops:staff-loaded"));
  }
  return staff;
}

export type Priority = "normal" | "high" | "urgent";

export type ProjectOps = {
  projectId: string;
  assigneeId: string;
  priority: Priority;
  escalated: boolean;
  escalatedAt?: string;
};

const KEY = "cleared.staffOps.v1";
const SEED_FLAG = "cleared.staffOps.seeded.v2"; // v2: assignee ids are real admin user UUIDs

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

/** Seed mock project assignments onto the live admin roster (once staff ids are known). */
function ensureSeeded(staff: StaffMember[]) {
  if (typeof window === "undefined") return;
  if (staff.length === 0) return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  const map = read();
  const PRIORITIES: Priority[] = ["normal", "normal", "normal", "high", "urgent"];
  for (const p of PROJECTS) {
    if (map[p.id]) continue;
    const member = staff[seededHash(p.id) % staff.length];
    const priority = PRIORITIES[seededHash(p.id + "p") % PRIORITIES.length];
    const escalated = seededHash(p.id + "e") % 9 === 0 && p.status !== "permit_issued";
    map[p.id] = {
      projectId: p.id,
      assigneeId: member.id,
      priority,
      escalated,
      escalatedAt: escalated ? new Date(Date.now() - (seededHash(p.id + "t") % 5) * 86400000).toISOString() : undefined,
    };
  }
  write(map);
  window.localStorage.setItem(SEED_FLAG, "1");
}

export function getAllOps(): ProjectOps[] {
  if (CLEARED_STAFF.length > 0) ensureSeeded(CLEARED_STAFF);
  return Object.values(read());
}

export function getOps(projectId: string): ProjectOps | null {
  if (CLEARED_STAFF.length > 0) ensureSeeded(CLEARED_STAFF);
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
  if (CLEARED_STAFF.length > 0) ensureSeeded(CLEARED_STAFF);
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
  if (CLEARED_STAFF.length > 0) ensureSeeded(CLEARED_STAFF);
  const map = read();
  const existing = map[projectId];
  if (!existing) return;
  map[projectId] = { ...existing, priority };
  write(map);
  logAudit(currentActor(), "staff.assigned", { projectId, record: projectLabel, details: `Priority set to ${priority}` });
}

export function setEscalated(projectId: string, escalated: boolean, projectLabel: string) {
  if (CLEARED_STAFF.length > 0) ensureSeeded(CLEARED_STAFF);
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
  if (CLEARED_STAFF.length > 0) ensureSeeded(CLEARED_STAFF);
  const map = read();
  const project = PROJECTS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(p.name.toLowerCase()),
  );
  if (!project) return false;
  return map[project.id]?.escalated ?? false;
}
