// Property Appraiser lookup — mock adapter that mimics county appraiser sites.
// Real integration lives on the server (PAPA REST for Palm Beach, scraper
// for PSL, etc.); this returns deterministic data based on address + county.

export type AppraiserRecord = {
  owner_of_record: string;
  pcn: string;
  legal_description: string;
  lot_size: string;
  flood_zone: string;
  year_built: string;
  source: string;
  fetched_at: string;
};

export const COUNTY_APPRAISERS: Record<string, { name: string; host: string; url: string }> = {
  "Palm Beach":   { name: "Palm Beach County (PAPA)",       host: "pbcgov.org/papa",  url: "https://www.pbcgov.org/papa/" },
  "St. Lucie":    { name: "St. Lucie County Appraiser",     host: "paslc.gov",        url: "https://www.paslc.gov/" },
  Martin:         { name: "Martin County Appraiser",        host: "pa.martin.fl.us",  url: "https://www.pa.martin.fl.us/" },
  "Indian River": { name: "Indian River County Appraiser",  host: "ircpa.org",        url: "https://www.ircpa.org/" },
  Broward:        { name: "Broward County Appraiser (BCPA)",host: "bcpa.net",         url: "https://www.bcpa.net/" },
  "Miami-Dade":   { name: "Miami-Dade County Appraiser",    host: "miamidade.gov/pa", url: "https://www.miamidade.gov/pa/" },
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function formatPCN(county: string, seed: number): string {
  if (county === "Palm Beach") {
    // 00-42-43-01-01-000-0000
    const p = (n: number, len: number) => String(seed).padStart(len, "0").slice(-len);
    return `${p(seed, 2)}-${p(seed >> 2, 2)}-${p(seed >> 4, 2)}-${p(seed >> 6, 2)}-${p(seed >> 8, 2)}-${p(seed >> 10, 3)}-${p(seed >> 12, 4)}`;
  }
  if (county === "St. Lucie") return `${String(seed).padStart(4, "0").slice(-4)}-${String(seed >> 4).padStart(3, "0").slice(-3)}-${String(seed >> 7).padStart(4, "0").slice(-4)}-000-8`;
  if (county === "Broward") return String(seed).padStart(14, "0").slice(-14).match(/.{1,4}/g)!.join(" ");
  if (county === "Miami-Dade") return `${String(seed).padStart(2,"0").slice(-2)}-${String(seed>>2).padStart(4,"0").slice(-4)}-${String(seed>>6).padStart(3,"0").slice(-3)}-${String(seed>>9).padStart(4,"0").slice(-4)}`;
  return String(seed).padStart(12, "0").slice(-12);
}

const FLOOD_ZONES = ["X", "AE", "X (shaded)", "AH", "VE"];

/** Simulate the network round-trip against the county appraiser. */
export async function fetchAppraiserRecord(
  address: string,
  city: string,
  county: string,
  ownerHint: string,
): Promise<AppraiserRecord> {
  const adapter = COUNTY_APPRAISERS[county];
  await new Promise((r) => setTimeout(r, 900));
  const seed = hash(`${address}|${city}|${county}`);
  const yr = 1968 + (seed % 55);
  const lot = 6500 + (seed % 18500);
  return {
    owner_of_record: (ownerHint || "").toUpperCase() || `PARCEL OWNER ${seed % 999}`,
    pcn: formatPCN(county, seed),
    legal_description: `LOT ${(seed % 40) + 1}, BLK ${(seed % 12) + 1}, ${city.toUpperCase()} PLAT NO. ${(seed % 90) + 1}, PB ${(seed % 120) + 5}, PG ${(seed % 200) + 1}`,
    lot_size: `${lot.toLocaleString()} sq ft (${(lot / 43560).toFixed(2)} ac)`,
    flood_zone: FLOOD_ZONES[seed % FLOOD_ZONES.length],
    year_built: String(yr),
    source: adapter?.host ?? "manual",
    fetched_at: new Date().toISOString(),
  };
}

// ---- Per-project storage ------------------------------------------------
const KEY = "cleared.appraiserRecords.v1";
type Store = Record<string, AppraiserRecord>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store; }
  catch { return {}; }
}
function write(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("appraiser:changed"));
}

export function getAppraiser(projectId: string): AppraiserRecord | null {
  return read()[projectId] ?? null;
}
export function saveAppraiser(projectId: string, r: AppraiserRecord) {
  const s = read();
  s[projectId] = r;
  write(s);
}
export function clearAppraiser(projectId: string) {
  const s = read();
  delete s[projectId];
  write(s);
}
