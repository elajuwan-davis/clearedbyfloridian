// Staff assignment / internal ops — Supabase-backed (staff_assignments).
import { supabase } from "@/integrations/supabase/client";
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
