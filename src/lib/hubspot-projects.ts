// HubSpot-sourced projects (mock localStorage store).
// Real webhook lands at /api/public/hubspot/deal-webhook — Eman finalizes wiring
// to the Supabase `projects` table. Until then, this store powers the demo UI.

import type { Project } from "./projects-data";
import type { ProjectStatus } from "./status-badges";

const KEY = "cleared.hubspot.projects.v1";
export const HUBSPOT_EVT = "hubspot-projects:changed";

export type HubSpotDealPayload = {
  hubspot_deal_id: string;
  deal_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  deal_amount?: number; // in dollars
  project_type?: string; // e.g. "pool", "hardscape"
};

export type HubSpotProject = Project & {
  source: "hubspot";
  hubspot_deal_id: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
};

function read(): HubSpotProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: HubSpotProject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(HUBSPOT_EVT));
}

export function listHubspotProjects(): HubSpotProject[] {
  return read();
}

export function getHubspotProject(id: string): HubSpotProject | null {
  return read().find((p) => p.id === id) ?? null;
}

const COUNTY_BY_CITY: Record<string, string> = {
  "West Palm Beach": "Palm Beach",
  "Palm Beach": "Palm Beach",
  "Wellington": "Palm Beach",
  "Jupiter": "Palm Beach",
  "Boca Raton": "Palm Beach",
  "Palm Beach Gardens": "Palm Beach",
  "Stuart": "Martin",
  "Hobe Sound": "Martin",
  "Port St. Lucie": "St. Lucie",
  "Fort Pierce": "St. Lucie",
  "Vero Beach": "Indian River",
};

export function createProjectFromDeal(deal: HubSpotDealPayload): HubSpotProject {
  const list = read();
  const existing = list.find((p) => p.hubspot_deal_id === deal.hubspot_deal_id);
  if (existing) return existing;

  const id = `hs-${deal.hubspot_deal_id}`;
  const city = deal.city ?? "";
  const county = deal.county ?? COUNTY_BY_CITY[city] ?? "Palm Beach";
  const isPool = /pool|spa/i.test(deal.project_type ?? deal.deal_name ?? "");
  const permit_types = isPool ? ["Building", "Electrical", "Plumbing"] : ["Building"];
  const now = new Date();
  const submitted = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const project: HubSpotProject = {
    id,
    permit_no: `CLR-2026-HS${deal.hubspot_deal_id.slice(-4).padStart(4, "0")}`,
    name: deal.deal_name || `HubSpot Deal ${deal.hubspot_deal_id}`,
    client: deal.contact_name || "—",
    address: deal.address || "Address pending",
    city,
    county,
    state: deal.state ?? "FL",
    zip: deal.zip,
    scope: deal.project_type,
    status: "submitted" as ProjectStatus, // maps to "Intake" accordion
    value_cents: Math.round((deal.deal_amount ?? 50000) * 100),
    permit_types,
    submitted_at: submitted,
    updated_at: submitted,
    source: "hubspot",
    hubspot_deal_id: deal.hubspot_deal_id,
    contact_email: deal.contact_email,
    contact_phone: deal.contact_phone,
    created_at: now.toISOString(),
  };

  write([project, ...list]);
  return project;
}

export function deleteHubspotProject(id: string) {
  write(read().filter((p) => p.id !== id));
}
