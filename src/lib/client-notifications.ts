// Client notification scaffold. Mock-sends by logging into project notes and
// a localStorage outbox; Eman wires SendGrid/Resend later via edge fn.

import { addNote } from "./project-notes";
import { PROJECTS, type Project, fullAddress } from "./projects-data";
import { findPortalForAddress } from "./municipalities";

const PREFS_KEY = "cleared.client-notifications.prefs";
const OUTBOX_KEY = "cleared.client-notifications.outbox";
const RELAY_EMAIL = "info@cleard.com";

type Prefs = Record<string, boolean>; // projectId -> enabled

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/** Default ON for every project unless explicitly turned off. */
export function notificationsEnabled(projectId: string): boolean {
  const prefs = read<Prefs>(PREFS_KEY, {});
  return prefs[projectId] !== false;
}

export function setNotificationsEnabled(projectId: string, enabled: boolean) {
  const prefs = read<Prefs>(PREFS_KEY, {});
  prefs[projectId] = enabled;
  write(PREFS_KEY, prefs);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("client-notifications:changed"));
  }
}

export type NotificationKind =
  | "submitted"
  | "permit_issued"
  | "inspection_passed"
  | "inspection_corrections"
  | "project_complete";

export type NotificationPayload = {
  inspectionName?: string;
  inspectionDate?: string;
  correctionNotes?: string;
  passedCount?: number; // for inspection_passed
  totalCount?: number;
};

const KIND_LABEL: Record<NotificationKind, string> = {
  submitted: "Cleared for Takeoff",
  permit_issued: "En Route",
  inspection_passed: "Inspection Passed",
  inspection_corrections: "Delayed",
  project_complete: "Arrival",
};

/** Owner display; we don't yet persist owner_email/owner_name on Project. */
export type ProjectOwner = { name: string; email: string };
export function resolveOwner(project: Project): ProjectOwner {
  // Client string doubles as owner display until owner_email/owner_name are wired.
  const nameSlug = project.client.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
  return { name: project.client, email: `${nameSlug || "owner"}@example.com` };
}

function buildEmail(
  project: Project,
  kind: NotificationKind,
  payload: NotificationPayload = {},
): { subject: string; body: string } {
  const addr = fullAddress(project);
  const muni = findPortalForAddress(fullAddress(project))?.name ?? "your municipality";
  switch (kind) {
    case "submitted":
      return {
        subject: `Cleared for Takeoff — ${addr}`,
        body: `Your permit application for ${addr} has been submitted to ${muni} (Cleared for Takeoff). We'll notify you when it's En Route.`,
      };
    case "permit_issued":
      return {
        subject: `En Route — ${addr}`,
        body: `Great news — your permit is now En Route for ${addr}. Permit #${project.permit_no}. Construction can begin per your approved plans.`,
      };
    case "inspection_passed": {
      const name = payload.inspectionName ?? "Inspection";
      const date = payload.inspectionDate ?? new Date().toLocaleDateString();
      const passed = payload.passedCount ?? 0;
      const total = payload.totalCount ?? 9;
      return {
        subject: `Inspection passed — ${name} — ${addr}`,
        body: `Inspection passed: ${name} at ${addr} on ${date}. ${passed} of ${total} inspections complete.`,
      };
    }
    case "inspection_corrections": {
      const name = payload.inspectionName ?? "Inspection";
      const notes = payload.correctionNotes ?? "See attached correction notes.";
      return {
        subject: `Delayed — ${name} — ${addr}`,
        body: `Delayed: ${name} at ${addr} requires corrections. Notes: ${notes}. Contact us to reschedule.`,
      };
    }
    case "project_complete":
      return {
        subject: `Arrival — ${addr}`,
        body: `Arrival: your project at ${addr} is complete. Certificate of Occupancy is attached. Thank you for choosing Cleard.`,
      };
  }
}

export type OutboxEntry = {
  id: string;
  projectId: string;
  kind: NotificationKind;
  to: string;
  cc: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "queued" | "sent" | "skipped";
};

function pushOutbox(entry: OutboxEntry) {
  const list = read<OutboxEntry[]>(OUTBOX_KEY, []);
  list.unshift(entry);
  write(OUTBOX_KEY, list.slice(0, 200));
}

export function loadOutbox(): OutboxEntry[] {
  return read<OutboxEntry[]>(OUTBOX_KEY, []);
}

/**
 * Fire a milestone notification. No-op if the project has notifications off.
 * Real send (SendGrid/Resend) is wired later — this scaffold logs to the
 * project Messages/Notes tab and a local outbox.
 */
export function triggerNotification(
  projectId: string,
  kind: NotificationKind,
  payload: NotificationPayload = {},
): OutboxEntry | null {
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) return null;
  if (!notificationsEnabled(projectId)) return null;

  const owner = resolveOwner(project);
  const { subject, body } = buildEmail(project, kind, payload);
  const entry: OutboxEntry = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    kind,
    to: owner.email,
    cc: RELAY_EMAIL,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: "sent",
  };
  pushOutbox(entry);
  addNote(
    projectId,
    "System (Client Notifications)",
    `Auto-notification sent to ${owner.email}: ${KIND_LABEL[kind]}`,
  );
  return entry;
}

/** Fire the right template when a status transitions (submitted/permit_issued). */
export function triggerForStatusChange(projectId: string, from: string, to: string) {
  if (from === to) return;
  if (to === "submitted" || to === "in_review") {
    triggerNotification(projectId, "submitted");
  }
  if (to === "permit_issued") {
    triggerNotification(projectId, "permit_issued");
  }
}
