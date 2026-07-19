// LocalStorage-backed per-project PCN (Parcel Control Number) + address override store.

export type ProjectPCN = {
  projectId: string;
  pcn: string;
  updatedAt: string;
};

const KEY = "cleared.projectPCNs.v1";

function read(): ProjectPCN[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProjectPCN[]) : [];
  } catch {
    return [];
  }
}

function write(list: ProjectPCN[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("project-pcn:changed"));
}

export function getPCN(projectId: string): string {
  return read().find((p) => p.projectId === projectId)?.pcn ?? "";
}

export function setPCN(projectId: string, pcn: string) {
  const list = read().filter((p) => p.projectId !== projectId);
  const trimmed = pcn.trim();
  if (trimmed) {
    list.push({ projectId, pcn: trimmed, updatedAt: new Date().toISOString() });
  }
  write(list);
}

// County property appraiser search URLs.
export const COUNTY_APPRAISER_URLS: Record<string, { name: string; url: string }> = {
  "Palm Beach": {
    name: "Palm Beach County PAPA",
    url: "https://www.pbcgov.org/papa/Asps/PropertySearch/PropertySearch.aspx",
  },
  "St. Lucie": {
    name: "St. Lucie County Property Appraiser",
    url: "https://www.paslc.gov/",
  },
  Martin: {
    name: "Martin County Property Appraiser",
    url: "https://www.pa.martin.fl.us/",
  },
  "Indian River": {
    name: "Indian River County Property Appraiser",
    url: "https://www.ircpa.org/",
  },
  Broward: {
    name: "Broward County Property Appraiser (BCPA)",
    url: "https://www.bcpa.net/",
  },
  "Miami-Dade": {
    name: "Miami-Dade Property Appraiser",
    url: "https://www.miamidade.gov/pa/",
  },
};

export function appraiserForCounty(county: string): { name: string; url: string } | undefined {
  const norm = county.replace(/\s+County$/i, "").trim();
  return COUNTY_APPRAISER_URLS[norm];
}
