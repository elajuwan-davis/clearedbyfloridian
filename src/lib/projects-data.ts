// Canonical active Flōridian projects — 24 real jobs.
// Consumed by /my-permits, /projects, /projects/$id, /portal, /portal/projects.

import type { ProjectStatus } from "./status-badges";

export type Project = {
  id: string;
  permit_no: string;
  name: string;
  client: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip?: string;
  scope?: string;
  status: ProjectStatus;
  value_cents: number;
  permit_types: string[];
  submitted_at: string;
  updated_at: string;
};

// County mapping by city — Palm Beach + Treasure Coast (+ Broward/Miami-Dade edge cases).
const COUNTY_BY_CITY: Record<string, string> = {
  "Palm City": "Martin",
  "Wellington": "Palm Beach",
  "Stuart": "Martin",
  "Port St. Lucie": "St. Lucie",
  "Port Saint Lucie": "St. Lucie",
  "Hobe Sound": "Martin",
  "Jupiter": "Palm Beach",
  "Loxahatchee": "Palm Beach",
  "Loxahatchee Club": "Palm Beach",
  "Fort Pierce": "St. Lucie",
  "Tequesta": "Palm Beach",
  "Weston": "Broward",
  "Vero Beach": "Indian River",
  "Boca Raton": "Palm Beach",
  "Miami Beach": "Miami-Dade",
  "Palm Beach Gardens": "Palm Beach",
  "Lighthouse Point": "Broward",
};

type Seed = {
  n: number;
  name: string;
  client: string;
  street: string;
  city: string;
  state?: string;
  zip?: string;
  scope?: string;
  status?: ProjectStatus;
  permit_no?: string;
};

const SEED: Seed[] = [
  { n: 1, name: "Difede Plaster Warranty", client: "Difede", street: "1924 SW English Garden Dr", city: "Palm City", zip: "34990" },
  { n: 2, name: "Garcia Lussardi", client: "Gonzalo Garcia", street: "3012 Payson Way", city: "Wellington", zip: "33414" },
  { n: 3, name: "Elaine Berg", client: "Elaine Berg", street: "2929 SW Cornell Ave", city: "Palm City", zip: "34990" },
  { n: 4, name: "Palmetto Cove", client: "5 Star Homes LLC", street: "502 SW Halpatokee St", city: "Stuart", zip: "34994" },
  { n: 5, name: "Youngblood", client: "Christian Youngblood", street: "2612 SE Solana Ln", city: "Port St. Lucie", zip: "34952" },
  { n: 6, name: "Bruno", client: "Phil Bruno", street: "2206 SE Seafury Ln", city: "Port St. Lucie", zip: "34952" },
  { n: 7, name: "Hassett", client: "Neal Hassett", street: "9399 SE Delafield Street", city: "Hobe Sound", zip: "33455" },
  { n: 8, name: "7741 SE Loblolly", client: "Watlee Construction", street: "7741 SE Loblolly Bay Dr", city: "Hobe Sound", zip: "33455" },
  { n: 9, name: "Kaler Residence", client: "Patricia Kaler", street: "116 SE Via San Marino", city: "Port Saint Lucie", zip: "34984" },
  { n: 10, name: "Wallace Residence", client: "Nikki & Tom Wallace", street: "8566 SW Felicita Wy", city: "Port St. Lucie", zip: "34987" },
  { n: 11, name: "112 Terrapin (Abboud)", client: "Maxwell Building", street: "112 Terrapin Trail", city: "Jupiter", scope: "Driveway" },
  { n: 12, name: "Stoltenberg Residence", client: "Brent Stoltenberg", street: "17600 Pineapple Ln", city: "Fort Pierce", zip: "34945", scope: "Residential swimming pool" },
  { n: 13, name: "Euell", client: "Euell", street: "15742 78th Pl N", city: "Loxahatchee", zip: "33470" },
  { n: 14, name: "Ramirez Residence", client: "Roberto Ramirez", street: "104 Manor Circle", city: "Jupiter", zip: "33458" },
  { n: 15, name: "Walker Residence", client: "Colin Walker", street: "123 Fairview W", city: "Tequesta", zip: "33469", scope: "16' x 31' pool" },
  { n: 16, name: "Keuning Residence", client: "Dana Keuning", street: "9355 SE Mercury St", city: "Hobe Sound", zip: "33455" },
  { n: 17, name: "Segall Residence", client: "Segall Family", street: "19276 N Hibiscus St", city: "Weston", zip: "33332" },
  { n: 18, name: "Knight Residence", client: "Emma Althea Knight", street: "10142 SW Davanti Drive", city: "Port Saint Lucie", zip: "34987" },
  { n: 19, name: "Manera Residence", client: "Manera", street: "2006 Windward Way", city: "Vero Beach", zip: "32963" },
  { n: 20, name: "Perle Residence", client: "Cannatelli Builders (Perle)", street: "1261 Spanish River Rd", city: "Boca Raton", zip: "33432" },
  { n: 21, name: "Mesmer Residence", client: "Mesmer Family", street: "3153 Royal Palm Ave", city: "Miami Beach", scope: "Natural Gas / Pool, Pergola & ODK", status: "permit_issued", permit_no: "PO-R2601278" },
  { n: 22, name: "Henderson", client: "Arielle Henderson", street: "12923 SW Leopold Wy", city: "Port St. Lucie", zip: "34987" },
  { n: 23, name: "Rocklage Residence", client: "Scott Rocklage", street: "14646 Watermark Way", city: "Palm Beach Gardens", zip: "33410", scope: "Pool Resurfacing" },
  { n: 24, name: "Paul-Hus Residence", client: "Sarah & Andy Paul-Hus", street: "2090 NE 26th St", city: "Lighthouse Point", zip: "33064", scope: "Pergola" },
  { n: 25, name: "Spina Residence", client: "Rudolph Spina", street: "17560 72nd Rd N", city: "Loxahatchee", zip: "33470" },
  { n: 26, name: "Roberts Residence", client: "Julie & Danielle Roberts", street: "8096 Bautista Way", city: "Palm Beach Gardens", zip: "33418", permit_no: "BRES-25-11-06480" },
  { n: 27, name: "Moore Residence", client: "Thomas Moore", street: "200 Bayberry Dr", city: "", scope: "Gas Heater / Gas Grille" },
  { n: 28, name: "Gardiner Residence", client: "Jennifer Gardiner", street: "4563 Citron Way", city: "", permit_no: "PRP02025600199" },
  { n: 29, name: "Abrams Residence", client: "Paul Abrams", street: "19 Sutton Drive", city: "", scope: "Gas Heater", permit_no: "RESP-2026.01.0416" },
];


// Deterministic pseudo-random for stable-but-varied valuations & dates.
function seeded(n: number, min: number, max: number) {
  const x = Math.sin(n * 9973) * 10000;
  const frac = x - Math.floor(x);
  return Math.floor(min + Math.abs(frac) * (max - min));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dateFor(n: number) {
  // Recent 90-day window ending today-ish, deterministic per project.
  const day = seeded(n, 1, 28);
  const monthIdx = seeded(n + 3, 4, 7); // May–Jul 2026 window
  return `${MONTHS[monthIdx]} ${day}, 2026`;
}

export const PROJECTS: Project[] = SEED.map((s) => {
  const county = COUNTY_BY_CITY[s.city] ?? "Palm Beach";
  const value_cents = seeded(s.n, 18_000_000, 68_000_000); // $180k–$680k
  const submitted = dateFor(s.n);
  const permit_types = s.scope?.toLowerCase().includes("pool")
    ? ["Building", "Electrical", "Plumbing"]
    : s.scope?.toLowerCase().includes("driveway") || s.scope?.toLowerCase().includes("pergola")
      ? ["Building"]
      : s.scope?.toLowerCase().includes("gas")
        ? ["Building", "Gas", "Electrical", "Plumbing"]
        : ["Building"];
  return {
    id: String(s.n),
    permit_no: s.permit_no ?? `CLR-2026-${String(1000 + s.n).slice(-4)}`,
    name: s.name,
    client: s.client,
    address: s.street,
    city: s.city,
    county,
    state: s.state ?? "FL",
    zip: s.zip,
    scope: s.scope,
    status: s.status ?? "in_review",
    value_cents,
    permit_types,
    submitted_at: submitted,
    updated_at: submitted,
  };
});

export function getProjectById(id: string): Project | null {
  return PROJECTS.find((p) => p.id === id) ?? null;
}

export function fullAddress(p: Project): string {
  return `${p.address}, ${p.city}, ${p.state}${p.zip ? " " + p.zip : ""}`;
}
