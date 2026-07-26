// GC company compliance documents (COI-GL, COI-WC, DBPR License, BTR).
// LocalStorage-backed until wired to Cloud so the Municipality Readiness
// panel can render real green/yellow/red status inside permit intake.
//
// Each entry stores an expiration date (yyyy-mm-dd) and an "onFile" flag.
// Traffic-light rules match SubDocBadge: <0d expired (red), <=30d warning
// (yellow), >30d valid (green), missing (red).

export type GcDocKey = "coi_gl" | "coi_wc" | "license_dbpr" | "btr";

export type GcDocRecord = {
  key: GcDocKey;
  label: string;
  onFile: boolean;
  expiration: string | null; // yyyy-mm-dd
  fileName?: string | null;
  updatedAt?: string;
};

const KEY = "cleard.gc-compliance";

const DEFAULTS: Record<GcDocKey, { label: string }> = {
  coi_gl: { label: "Certificate of Insurance (General Liability)" },
  coi_wc: { label: "Certificate of Insurance (Workers Comp)" },
  license_dbpr: { label: "Contractor License (DBPR)" },
  btr: { label: "Business Tax Receipt" },
};

// Municipalities where a Business Tax Receipt is filed with the permit
// package. Anything else → BTR row is hidden.
const BTR_REQUIRED = new Set<string>([
  "miami-dade-county",
  "miami",
  "coral-gables",
  "hialeah",
  "homestead",
  "aventura",
  "doral",
  "miami-beach",
  "north-miami",
  "north-miami-beach",
  "broward-county",
  "fort-lauderdale",
  "ft-lauderdale",
  "hollywood",
  "pembroke-pines",
  "coral-springs",
  "sunrise",
  "davie",
  "plantation",
  "palm-beach-county",
  "west-palm-beach",
  "palm-beach-gardens",
  "boca-raton",
  "delray-beach",
  "wellington",
  "jupiter",
]);

export function btrRequiredForSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return BTR_REQUIRED.has(slug);
}

export function loadGcCompliance(): GcDocRecord[] {
  const empty: GcDocRecord[] = (Object.keys(DEFAULTS) as GcDocKey[]).map((k) => ({
    key: k,
    label: DEFAULTS[k].label,
    onFile: false,
    expiration: null,
  }));
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as GcDocRecord[];
    if (!Array.isArray(parsed)) return empty;
    // merge defaults so new keys added later render even if the store is old
    return empty.map((d) => parsed.find((p) => p.key === d.key) ?? d);
  } catch {
    return empty;
  }
}

export function saveGcCompliance(list: GcDocRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("cleard:gc-compliance-updated"));
  } catch {
    /* ignore */
  }
}

export function upsertGcDoc(patch: Partial<GcDocRecord> & { key: GcDocKey }): GcDocRecord {
  const list = loadGcCompliance();
  const idx = list.findIndex((d) => d.key === patch.key);
  const merged: GcDocRecord = {
    ...(idx >= 0 ? list[idx] : { key: patch.key, label: DEFAULTS[patch.key].label, onFile: false, expiration: null }),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) list[idx] = merged;
  else list.push(merged);
  saveGcCompliance(list);
  return merged;
}

export type DocStatus = "valid" | "warning" | "expired" | "missing";

export function docStatus(rec: GcDocRecord): DocStatus {
  if (!rec.onFile || !rec.expiration) return "missing";
  const d = new Date(rec.expiration);
  if (isNaN(d.getTime())) return "missing";
  const days = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "warning";
  return "valid";
}
