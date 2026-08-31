// Single source of truth for municipalities — loaded from public.municipalities.

import { listMunicipalityRows, type MunicipalityRow } from "@/lib/municipalities-store";
import { matchPortalForAddress } from "@/lib/address-portal";

export type Municipality = {
  name: string;
  url?: string;
  deptName?: string;
  county?: string;
  region?: string;
  note?: string;
  phone?: string;
  readiness_score?: number | null;
  submittal_method?: string | null;
  turnaround_notes?: string | null;
  quirks?: string | null;
};

let cache: Municipality[] = [];
let loaded = false;

function mapRow(row: MunicipalityRow): Municipality {
  return {
    name: row.name,
    url: row.portal_url ?? undefined,
    deptName: row.department ?? undefined,
    county: row.county,
    readiness_score: row.readiness_score,
    submittal_method: row.submittal_method,
    turnaround_notes: row.turnaround_notes,
    quirks: row.quirks ?? undefined,
  };
}

export async function loadMunicipalities(): Promise<Municipality[]> {
  const rows = await listMunicipalityRows();
  cache = rows.map(mapRow).sort((a, b) => a.name.localeCompare(b.name));
  loaded = true;
  return cache;
}

/** Sync accessor — prefer loadMunicipalities() then read this. */
export function getMunicipalities(): Municipality[] {
  return cache;
}

/** @deprecated Prefer loadMunicipalities(); kept for gradual migration of sync call sites. */
export const MUNICIPALITIES: Municipality[] = new Proxy([] as Municipality[], {
  get(_target, prop, receiver) {
    if (!loaded && prop !== "length" && prop !== Symbol.iterator) {
      void loadMunicipalities();
    }
    const value = Reflect.get(cache, prop, receiver);
    return typeof value === "function" ? value.bind(cache) : value;
  },
  ownKeys() {
    return Reflect.ownKeys(cache);
  },
  getOwnPropertyDescriptor(_t, prop) {
    return Object.getOwnPropertyDescriptor(cache, prop);
  },
});

export function findPortalForAddress(address: string): Municipality | undefined {
  const list = cache.length ? cache : [];
  return matchPortalForAddress(address, list);
}

/** Async portal lookup that ensures the directory is loaded. */
export async function findPortalForAddressAsync(address: string): Promise<Municipality | undefined> {
  if (!loaded) await loadMunicipalities();
  return findPortalForAddress(address);
}

// Eager load in browser so typeaheads have data soon after boot.
if (typeof window !== "undefined") {
  void loadMunicipalities();
}
