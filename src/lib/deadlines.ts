// Unified deadline model — synthesizes a demo-worthy calendar of upcoming
// dates (permit expirations, inspections, correction responses, fee due
// dates, NTBO filings) from the canonical PROJECTS list. Deterministic per
// project so the calendar is stable across renders/reloads.

import { PROJECTS, type Project } from "@/lib/projects-data";
import { isInternalUser } from "@/lib/is-internal-user";

export type DeadlineKind =
  | "permit_expiration"
  | "inspection"
  | "correction_response"
  | "fee_due"
  | "ntbo_filing";

export type DeadlineColor = "red" | "blue" | "amber" | "green" | "grey";

export type Deadline = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  kind: DeadlineKind;
  projectId: string;
  projectName: string;
  description: string;
  assignedStaff: string;
  tab: string; // project-detail tab to deep-link to
};

export const DEADLINE_KIND_META: Record<
  DeadlineKind,
  { label: string; color: DeadlineColor; tab: string }
> = {
  permit_expiration: { label: "Permit expiration", color: "red", tab: "overview" },
  inspection: { label: "Inspection", color: "blue", tab: "inspections" },
  correction_response: { label: "Correction response", color: "amber", tab: "revisions" },
  fee_due: { label: "Fee due", color: "green", tab: "fees" },
  ntbo_filing: { label: "NTBO filing", color: "grey", tab: "compliance" },
};

export const DEADLINE_COLOR_CLASSES: Record<
  DeadlineColor,
  { dot: string; badge: string; chip: string }
> = {
  red: {
    dot: "bg-[#C23B2E]",
    badge: "bg-[#C23B2E]/10 text-[#C23B2E] border-[#C23B2E]/25",
    chip: "bg-[#C23B2E]/10 text-[#C23B2E] border-[#C23B2E]/20",
  },
  blue: {
    dot: "bg-[var(--sky)]",
    badge: "bg-[var(--sky)]/10 text-[var(--sky)] border-[var(--sky)]/25",
    chip: "bg-[var(--sky)]/10 text-[var(--sky)] border-[var(--sky)]/20",
  },
  amber: {
    dot: "bg-[var(--amber)]",
    badge: "bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/25",
    chip: "bg-[var(--amber)]/10 text-[var(--amber)] border-[var(--amber)]/20",
  },
  green: {
    dot: "bg-[var(--green)]",
    badge: "bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/25",
    chip: "bg-[var(--green)]/10 text-[var(--green)] border-[var(--green)]/20",
  },
  grey: {
    dot: "bg-obsidian/40",
    badge: "bg-obsidian/5 text-obsidian/60 border-obsidian/15",
    chip: "bg-obsidian/5 text-obsidian/60 border-obsidian/15",
  },
};

const STAFF = ["Maria Alonso", "Derek Pham", "Janelle Ortiz", "Curtis Reyes", "Sam Whitfield"];

const KINDS: DeadlineKind[] = [
  "permit_expiration",
  "inspection",
  "correction_response",
  "fee_due",
  "ntbo_filing",
];

const INSPECTION_NAMES = ["Pool Steel", "Pool Electric Bond", "Pool Deck", "Wet Niche", "Pool Final Building"];

function seeded(n: number, salt: number, min: number, max: number) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min));
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function descriptionFor(kind: DeadlineKind, project: Project, n: number): string {
  switch (kind) {
    case "permit_expiration":
      return `Permit ${project.permit_no} expires without an active inspection (FBC 105.4.1)`;
    case "inspection":
      return `${INSPECTION_NAMES[n % INSPECTION_NAMES.length]} inspection scheduled`;
    case "correction_response":
      return "Response due to plan reviewer comments";
    case "fee_due":
      return "Outstanding permit fee balance due";
    case "ntbo_filing":
      return "Notice to Building Official filing due";
  }
}

/** Every "active" project (not closed/on_hold) seeds a couple of deadlines
 * spread across the next ~60 days, deterministically by project id. */
function buildAll(): Deadline[] {
  const today = new Date(new Date().toDateString());
  const out: Deadline[] = [];

  PROJECTS.forEach((project, idx) => {
    if (project.status === "on_hold") return;
    const n = Number(project.id) || idx + 1;
    const count = seeded(n, 1, 2, 4); // 2-3 deadlines per project
    for (let i = 0; i < count; i++) {
      const kind = KINDS[seeded(n, i + 10, 0, KINDS.length)];
      const offset = seeded(n, i + 20, -10, 60); // some overdue, most upcoming
      const date = toISO(addDays(today, offset));
      const staff = STAFF[seeded(n, i + 30, 0, STAFF.length)];
      out.push({
        id: `${project.id}-${kind}-${i}`,
        date,
        kind,
        projectId: project.id,
        projectName: project.name,
        description: descriptionFor(kind, project, i + n),
        assignedStaff: staff,
        tab: DEADLINE_KIND_META[kind].tab,
      });
    }
  });

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

const ALL_DEADLINES = buildAll();

export type DeadlineScope = "staff" | "gc";

function currentScope(): DeadlineScope {
  return isInternalUser() ? "staff" : "gc";
}

/** GC users only see deadlines for projects whose client name loosely
 * matches their signed-in demo identity; falls back to a stable subset so
 * the demo account always has something to look at. */
function projectsForGc(): Set<string> {
  const keep = new Set<string>();
  let email = "";
  try {
    email = (typeof window !== "undefined" && window.localStorage.getItem("cleared_demo_user")) || "";
  } catch {
    email = "";
  }
  const handle = email.split("@")[0]?.replace(/[._]/g, " ").trim().toLowerCase();
  if (handle) {
    PROJECTS.forEach((p) => {
      if (p.client.toLowerCase().includes(handle) || handle.includes(p.client.toLowerCase().split(" ")[0] || "\0")) {
        keep.add(p.id);
      }
    });
  }
  if (keep.size === 0) {
    // Stable fallback subset so a fresh GC demo login isn't an empty page.
    PROJECTS.forEach((p, i) => {
      if (i % 3 === 0) keep.add(p.id);
    });
  }
  return keep;
}

export function listDeadlines(opts?: { scope?: DeadlineScope }): Deadline[] {
  const scope = opts?.scope ?? currentScope();
  if (scope === "staff") return ALL_DEADLINES;
  const allowed = projectsForGc();
  return ALL_DEADLINES.filter((d) => allowed.has(d.projectId));
}
