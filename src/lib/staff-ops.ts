// Staff assignment / internal ops — Supabase-backed (staff_assignments) + live admin roster.
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "./audit-log";
import { nameFromEmail } from "@/lib/profile-api";

export type StaffMember = {
  id: string;
  name: string;
  /** profiles.job_title — empty string when unset (never invent a title). */
  role: string;
  email: string;
};

/** Mutable cache filled by listStaffAdmins() for sync helpers (getStaffByEmail, etc.). */
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
    // Column may not exist until 20260811120000_profiles_job_title.sql is applied.
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
  permitId: string;
  assigneeEmail: string | null;
  priority: Priority;
  escalated: boolean;
  escalatedAt?: string | null;
};

const EVT = "staff-ops:changed";

function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVT));
}

type AssignmentRow = {
  permit_id: string;
  assignee_email: string | null;
  priority: string;
  escalated: boolean;
  escalated_at: string | null;
};

function mapRow(row: AssignmentRow): ProjectOps {
  const priority = (["normal", "high", "urgent"].includes(row.priority) ? row.priority : "normal") as Priority;
  return {
    permitId: row.permit_id,
    assigneeEmail: row.assignee_email,
    priority,
    escalated: !!row.escalated,
    escalatedAt: row.escalated_at,
  };
}

export function getStaffById(id: string): StaffMember | undefined {
  return CLEARED_STAFF.find((s) => s.id === id);
}

export function getStaffByEmail(email: string | null | undefined): StaffMember | undefined {
  if (!email) return undefined;
  const lower = email.toLowerCase();
  return CLEARED_STAFF.find((s) => s.email.toLowerCase() === lower);
}

function currentActor(): string {
  if (typeof window === "undefined") return "Staff";
  return window.localStorage.getItem("cleared_demo_user") || "Staff";
}

export async function getAllOps(): Promise<ProjectOps[]> {
  const { data, error } = await supabase
    .from("staff_assignments")
    .select("permit_id, assignee_email, priority, escalated, escalated_at");
  if (error || !data) return [];
  return (data as AssignmentRow[]).map(mapRow);
}

export async function getOps(permitId: string): Promise<ProjectOps | null> {
  const { data, error } = await supabase
    .from("staff_assignments")
    .select("permit_id, assignee_email, priority, escalated, escalated_at")
    .eq("permit_id", permitId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as AssignmentRow);
}

/** Default ops shape when no staff_assignments row exists yet. */
export function emptyOps(permitId: string): ProjectOps {
  return {
    permitId,
    assigneeEmail: null,
    priority: "normal",
    escalated: false,
    escalatedAt: null,
  };
}

export async function setAssignee(permitId: string, assigneeEmail: string, projectLabel: string) {
  const existing = await getOps(permitId);
  const { error } = await supabase.from("staff_assignments").upsert(
    {
      permit_id: permitId,
      assignee_email: assigneeEmail,
      priority: existing?.priority ?? "normal",
      escalated: existing?.escalated ?? false,
      escalated_at: existing?.escalatedAt ?? null,
    },
    { onConflict: "permit_id" },
  );
  if (error) throw new Error(error.message);
  const staff = getStaffByEmail(assigneeEmail);
  logAudit(currentActor(), "staff.assigned", {
    projectId: permitId,
    record: projectLabel,
    details: `Assigned to ${staff?.name ?? assigneeEmail}`,
  }).catch(() => {});
  notifyChanged();
}

export async function setPriority(permitId: string, priority: Priority, projectLabel: string) {
  const existing = await getOps(permitId);
  const { error } = await supabase.from("staff_assignments").upsert(
    {
      permit_id: permitId,
      assignee_email: existing?.assigneeEmail ?? null,
      priority,
      escalated: existing?.escalated ?? false,
      escalated_at: existing?.escalatedAt ?? null,
    },
    { onConflict: "permit_id" },
  );
  if (error) throw new Error(error.message);
  logAudit(currentActor(), "staff.assigned", {
    projectId: permitId,
    record: projectLabel,
    details: `Priority set to ${priority}`,
  }).catch(() => {});
  notifyChanged();
}

export async function setEscalated(permitId: string, escalated: boolean, projectLabel: string) {
  const existing = await getOps(permitId);
  const escalatedAt = escalated ? new Date().toISOString() : null;
  const { error } = await supabase.from("staff_assignments").upsert(
    {
      permit_id: permitId,
      assignee_email: existing?.assigneeEmail ?? null,
      priority: existing?.priority ?? "normal",
      escalated,
      escalated_at: escalatedAt,
    },
    { onConflict: "permit_id" },
  );
  if (error) throw new Error(error.message);
  logAudit(currentActor(), escalated ? "escalation.set" : "escalation.cleared", {
    projectId: permitId,
    record: projectLabel,
  }).catch(() => {});
  notifyChanged();
}

/** Permit IDs currently flagged escalated (for list badges). */
export async function listEscalatedPermitIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("staff_assignments")
    .select("permit_id")
    .eq("escalated", true);
  if (error || !data) return new Set();
  return new Set((data as { permit_id: string }[]).map((r) => r.permit_id));
}
