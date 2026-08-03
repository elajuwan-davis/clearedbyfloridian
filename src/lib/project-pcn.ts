// PCN (Parcel Control Number) storage.
//
// When a real `permitId` is known, the canonical value lives in `permits.pcn`.
// When only a seed/fake project id is available (e.g. project-detail.tsx), the
// value falls back to localStorage for offline display.

import { supabase } from "@/integrations/supabase/client";

export type ProjectPCN = {
  projectId: string;
  pcn: string;
  updatedAt: string;
};

export type PCNContext = {
  projectId: string;
  permitId?: string;
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

function isUuid(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function getPCN(ctx: PCNContext): Promise<string> {
  if (ctx.permitId && isUuid(ctx.permitId)) {
    const { data, error } = await supabase
      .from("permits")
      .select("pcn")
      .eq("id", ctx.permitId)
      .maybeSingle();
    if (!error && data?.pcn) return data.pcn;
  }
  return read().find((p) => p.projectId === ctx.projectId)?.pcn ?? "";
}

export async function setPCN(ctx: PCNContext, pcn: string) {
  const trimmed = pcn.trim();

  if (ctx.permitId && isUuid(ctx.permitId) && trimmed) {
    const { error } = await supabase
      .from("permits")
      .update({ pcn: trimmed })
      .eq("id", ctx.permitId);
    if (error) throw error;
  }

  const list = read().filter((p) => p.projectId !== ctx.projectId);
  if (trimmed) {
    list.push({ projectId: ctx.projectId, pcn: trimmed, updatedAt: new Date().toISOString() });
  }
  write(list);
}

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
