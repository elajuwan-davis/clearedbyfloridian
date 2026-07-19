import type { Project } from "@/lib/projects-data";

const COMPLETE_STATUSES = new Set(["permit_issued", "inspection_complete", "approved"]);

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Deterministic completion state per (project, permit type) for the mock
 * dataset. Projects in a terminal-complete status are fully green; every
 * other project has at least one incomplete permit type so red badges are
 * visible for the list-scan workflow.
 */
export function isPermitTypeComplete(project: Pick<Project, "id" | "status">, permitType: string): boolean {
  if (COMPLETE_STATUSES.has(project.status)) return true;
  // Deterministically flip ~35% of permit types complete for in-progress projects.
  return hash(`${project.id}:${permitType}`) % 100 < 35;
}

export function permitTypeAnchor(permitType: string): string {
  return permitType.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
