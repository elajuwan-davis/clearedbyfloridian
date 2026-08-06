// Mock permit status sync — simulates checking municipality portals for
// status changes. In production this would hit each portal's API/scraper.
// For now: deterministic pseudo-random advance for a small subset per run,
// with per-project last-sync timestamps persisted in localStorage.

import { PROJECTS } from "./projects-data";
import { projectStatusMeta, type ProjectStatus } from "./status-badges";
import { addNote } from "./project-notes";
import { triggerForStatusChange } from "./client-notifications";
import { isVendorManaged } from "./project-vendors";



const TS_KEY = "cleared.permitSync.timestamps.v1";
const STATUS_KEY = "cleared.permitSync.statusOverrides.v1";
const LAST_RUN_KEY = "cleared.permitSync.lastRun.v1";

type TimestampMap = Record<string, string>; // projectId -> ISO
type StatusMap = Record<string, ProjectStatus>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLastSync(projectId: string): string | null {
  return read<TimestampMap>(TS_KEY, {})[projectId] ?? null;
}

export function getLastRun(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_RUN_KEY);
}

export function getEffectiveStatus(projectId: string, seedStatus: ProjectStatus): ProjectStatus {
  const overrides = read<StatusMap>(STATUS_KEY, {});
  return overrides[projectId] ?? seedStatus;
}

export function getAllOverrides(): StatusMap {
  return read<StatusMap>(STATUS_KEY, {});
}

// Deterministic status progression for the mock (municipality portal advance).
const NEXT: Partial<Record<ProjectStatus, ProjectStatus>> = {
  submitted: "in_review",
  in_review: "corrections_required",
  corrections_required: "correction_response_under_review",
  correction_response_under_review: "resubmitted_to_county",
  resubmitted_to_county: "approved",
  resubmitted: "approved",
  approved: "permit_issued",
  inspection_scheduled: "inspection_complete",
};

export type SyncResult = {
  updated: number;
  unchanged: number;
  changes: Array<{ projectId: string; projectName: string; from: ProjectStatus; to: ProjectStatus }>;
  ranAt: string;
};

/** Simulate portal check with a small delay. */
export async function syncAllPermits(): Promise<SyncResult> {
  await new Promise((r) => setTimeout(r, 1200));

  const overrides = read<StatusMap>(STATUS_KEY, {});
  const timestamps = read<TimestampMap>(TS_KEY, {});
  const changes: SyncResult["changes"] = [];
  const nowIso = new Date().toISOString();

  // Mock: advance ~15% of eligible projects per run (deterministic per run seed).
  const runSeed = Date.now();
  const eligible = PROJECTS.filter((p) => {
    // Vendor-managed projects are record copies — no automated workflows run on them.
    if (isVendorManaged(p.name)) return false;
    const current = overrides[p.id] ?? p.status;
    return NEXT[current] !== undefined;
  });


  // Pick roughly 2–3 for a visible "updated" result.
  const pickCount = Math.min(eligible.length, Math.max(2, Math.floor(eligible.length * 0.1)));
  const shuffled = [...eligible].sort(
    (a, b) => ((hash(a.id + runSeed) - hash(b.id + runSeed)) as number),
  );
  const picks = new Set(shuffled.slice(0, pickCount).map((p) => p.id));

  let updated = 0;
  let unchanged = 0;
  for (const p of PROJECTS) {
    timestamps[p.id] = nowIso;
    const current = overrides[p.id] ?? p.status;
    const next = NEXT[current];
    if (next && picks.has(p.id)) {
      overrides[p.id] = next;
      updated += 1;
      changes.push({ projectId: p.id, projectName: p.name, from: current, to: next });
      const fromLabel = projectStatusMeta[current]?.label ?? current;
      const toLabel = projectStatusMeta[next]?.label ?? next;
      const date = new Date().toLocaleDateString("en-US");
      addNote(
        p.id,
        "System (Auto-Sync)",
        `Status updated: ${fromLabel} → ${toLabel} (auto-sync ${date})`,
      ).catch(() => {});
      triggerForStatusChange(p.id, current, next);

    } else {
      unchanged += 1;
    }
  }

  write(TS_KEY, timestamps);
  write(STATUS_KEY, overrides);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_RUN_KEY, nowIso);
    window.dispatchEvent(new CustomEvent("permit-sync:changed"));
  }

  return { updated, unchanged, changes, ranAt: nowIso };
}

function hash(s: string | number) {
  const str = String(s);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
