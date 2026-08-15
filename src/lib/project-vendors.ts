// Outsourced permit vendor assignments.
// Keyed by project name (works for both seeded projects and permit rows),
// with localStorage overrides so staff can reassign going forward.

export const VENDORS = ["Contractor Solutions", "VEPermits"] as const;
export type Vendor = (typeof VENDORS)[number];

const KEY = "cleared.projectVendors.v1";

/** Default vendor assignments, matched loosely on project name. */
const DEFAULTS: Array<{ match: string; vendor: Vendor }> = [
  { match: "youngblood", vendor: "Contractor Solutions" },
  { match: "bruno", vendor: "Contractor Solutions" },
  { match: "keuning", vendor: "Contractor Solutions" },
  { match: "ramirez", vendor: "Contractor Solutions" },
  { match: "hazel", vendor: "Contractor Solutions" },
  { match: "paul-hus", vendor: "Contractor Solutions" },
  { match: "paul hus", vendor: "Contractor Solutions" },
  { match: "garcia lussardi", vendor: "VEPermits" },
  { match: "gabay", vendor: "VEPermits" },
  { match: "jaar", vendor: "VEPermits" },
  { match: "cuason", vendor: "VEPermits" },
  { match: "perle", vendor: "VEPermits" },
];

export function defaultVendorFor(projectName: string | null | undefined): Vendor | null {
  const n = (projectName ?? "").toLowerCase();
  if (!n) return null;
  const hit = DEFAULTS.find((d) => n.includes(d.match));
  return hit ? hit.vendor : null;
}

function readOverrides(): Record<string, Vendor | ""> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, Vendor | "">) : {};
  } catch {
    return {};
  }
}

function normKey(projectName: string) {
  return projectName.trim().toLowerCase();
}

/** Effective vendor for a project (override wins over default). */
export function getVendor(projectName: string | null | undefined): Vendor | null {
  if (!projectName) return null;
  const overrides = readOverrides();
  const o = overrides[normKey(projectName)];
  if (o === "") return null;
  if (o) return o;
  return defaultVendorFor(projectName);
}

export function setVendor(projectName: string, vendor: Vendor | null) {
  if (typeof window === "undefined") return;
  const overrides = readOverrides();
  overrides[normKey(projectName)] = vendor ?? "";
  window.localStorage.setItem(KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent("project-vendors:changed"));
}

export const VENDOR_PLACEHOLDER = "—";

/**
 * Vendor-managed projects are fully handled by the external vendor.
 * Cleard keeps a record copy only — they must never enter internal work
 * queues and no automated workflows may run against them.
 */
export function isVendorManaged(projectName: string | null | undefined): boolean {
  return getVendor(projectName) !== null;
}
