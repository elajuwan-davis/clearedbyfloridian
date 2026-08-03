// Municipal contact directory — localStorage-backed, seeded with real-world
// style contacts for the jurisdictions Cleard files in most often.

export type ContactRole =
  | "Chief Building Official (CBO)"
  | "Deputy / Assistant Building Official"
  | "Plan Review Supervisor"
  | "Plan Reviewer — Structural"
  | "Plan Reviewer — Electrical"
  | "Plan Reviewer — Plumbing"
  | "Plan Reviewer — Mechanical"
  | "Plan Reviewer — Fire"
  | "Permit Clerk / Front Desk"
  | "Inspection Coordinator"
  | "Zoning Contact";

export const CONTACT_ROLES: ContactRole[] = [
  "Chief Building Official (CBO)",
  "Deputy / Assistant Building Official",
  "Plan Review Supervisor",
  "Plan Reviewer — Structural",
  "Plan Reviewer — Electrical",
  "Plan Reviewer — Plumbing",
  "Plan Reviewer — Mechanical",
  "Plan Reviewer — Fire",
  "Permit Clerk / Front Desk",
  "Inspection Coordinator",
  "Zoning Contact",
];

export type Standing = "good" | "neutral" | "attention";

export const STANDING_META: Record<Standing, { label: string; className: string }> = {
  good: { label: "Good Standing", className: "border-emerald-600/30 bg-emerald-50 text-emerald-800" },
  neutral: { label: "Neutral", className: "border-obsidian/20 bg-paper-warm text-obsidian/70" },
  attention: { label: "Needs Attention", className: "border-amber-600/30 bg-amber-50 text-amber-800" },
};

export type MunicipalContact = {
  id: string;
  /** Jurisdiction key — municipality name as shown in Building Dept Logins. */
  muni: string;
  name: string;
  role: ContactRole | string;
  phone: string;
  email: string;
  notes: string;
  lastContacted: string; // YYYY-MM-DD or ""
  standing: Standing;
};

export const MUNI_CONTACT_EVT = "municipal-contacts:changed";
const KEY = "cleared.municipalContacts.v1";

function mk(
  muni: string,
  name: string,
  role: ContactRole,
  phone: string,
  email: string,
  lastContacted: string,
  standing: Standing,
  notes: string,
): MunicipalContact {
  return { id: `${muni}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), muni, name, role, phone, email, notes, lastContacted, standing };
}

const SEED: MunicipalContact[] = [
  // ---- Palm Beach County ----
  mk("Palm Beach County", "Douglas Wise", "Chief Building Official (CBO)", "(561) 233-5100", "dwise@pbcgov.org", "2026-05-28", "good",
    "Prefers private provider affidavits emailed ahead of the ePZB upload. Responsive same business day."),
  mk("Palm Beach County", "Renata Ortiz", "Plan Review Supervisor", "(561) 233-5142", "rortiz@pbcgov.org", "2026-06-02", "good",
    "Routes private provider packages directly to trade reviewers — copy her on every resubmittal."),
  mk("Palm Beach County", "Marcus Delaney", "Plan Reviewer — Structural", "(561) 233-5188", "mdelaney@pbcgov.org", "2026-05-19", "neutral",
    "Wants signed/sealed truss packet uploaded as a separate PDF, not bundled with plans."),
  mk("Palm Beach County", "Sandra Whitfield", "Plan Reviewer — Electrical", "(561) 233-5191", "swhitfield@pbcgov.org", "2026-04-30", "neutral",
    "Flags bonding details on pool equipment pads — include NEC 680 notes on the E sheets."),
  mk("Palm Beach County", "Terrence Blake", "Inspection Coordinator", "(561) 233-5240", "tblake@pbcgov.org", "2026-06-05", "good",
    "Books same-day inspections when requested before 7:30 AM."),
  mk("Palm Beach County", "Alicia Nguyen", "Permit Clerk / Front Desk", "(561) 233-5000", "anguyen@pbcgov.org", "2026-05-11", "good",
    "Best contact for fee invoices and permit card reprints."),
  mk("Palm Beach County", "Hector Ramos", "Zoning Contact", "(561) 233-5200", "hramos@pbcgov.org", "2026-03-24", "neutral",
    "Confirms setback/lot coverage before structural review releases."),

  // ---- St. Lucie County ----
  mk("St. Lucie County", "Barbara Keene", "Chief Building Official (CBO)", "(772) 462-1553", "keeneb@stlucieco.org", "2026-05-21", "neutral",
    "Requires the contractor authorization letter on firm letterhead for every agent submittal."),
  mk("St. Lucie County", "Devon Pritchard", "Deputy / Assistant Building Official", "(772) 462-1561", "pritchardd@stlucieco.org", "2026-05-06", "neutral",
    "Handles private provider plan review deferrals."),
  mk("St. Lucie County", "Lena Voss", "Plan Reviewer — Structural", "(772) 462-1570", "vossl@stlucieco.org", "2026-04-18", "attention",
    "Two open corrections aging past 10 days — escalate through Barbara Keene."),
  mk("St. Lucie County", "Omar Salazar", "Inspection Coordinator", "(772) 462-1600", "salazaro@stlucieco.org", "2026-06-01", "good",
    "Virtual inspection links sent by email the night before."),
  mk("St. Lucie County", "Grace Tolliver", "Permit Clerk / Front Desk", "(772) 462-1553", "tolliverg@stlucieco.org", "2026-05-29", "good",
    "Processes NTBO recordings and returns stamped copies within two days."),

  // ---- City of Port St. Lucie ----
  mk("Port St. Lucie", "Ronald Kessler", "Chief Building Official (CBO)", "(772) 871-5132", "rkessler@cityofpsl.com", "2026-05-27", "good",
    "Signs off on private provider compliance certificates within the 2-day plan review window."),
  mk("Port St. Lucie", "Priya Nandan", "Plan Review Supervisor", "(772) 871-5148", "pnandan@cityofpsl.com", "2026-06-03", "good",
    "Assigns reviewers at 8 AM daily — submit before 4 PM for next-morning routing."),
  mk("Port St. Lucie", "Cliff Boyette", "Plan Reviewer — Plumbing", "(772) 871-5151", "cboyette@cityofpsl.com", "2026-05-14", "neutral",
    "Asks for backflow device model numbers on the riser diagram."),
  mk("Port St. Lucie", "Yvette Cordero", "Plan Reviewer — Mechanical", "(772) 871-5155", "ycordero@cityofpsl.com", "2026-04-22", "neutral",
    "Energy calcs must match equipment schedule tonnage exactly."),
  mk("Port St. Lucie", "Angela Moss", "Inspection Coordinator", "(772) 871-5160", "amoss@cityofpsl.com", "2026-06-04", "good",
    "Same-day inspections confirmed by text to the field super."),
  mk("Port St. Lucie", "Trent Whitaker", "Zoning Contact", "(772) 871-5212", "twhitaker@cityofpsl.com", "2026-03-30", "neutral",
    "Reviews screen enclosure and pool setbacks on the Sandpiper corridor."),

  // ---- Martin County ----
  mk("Martin County", "Elaine Carrothers", "Chief Building Official (CBO)", "(772) 288-5916", "ecarrothers@martin.fl.us", "2026-05-25", "good",
    "Long-standing relationship — accepts our private provider affidavits without a pre-meeting."),
  mk("Martin County", "Justin Ferrell", "Plan Reviewer — Structural", "(772) 288-5922", "jferrell@martin.fl.us", "2026-05-08", "good",
    "Wind load calcs referenced to ASCE 7-22, 170 mph Exp. C for coastal parcels."),
  mk("Martin County", "Bridget Alvarado", "Plan Reviewer — Fire", "(772) 288-5930", "balvarado@martin.fl.us", "2026-04-27", "neutral",
    "Coordinates with Martin County Fire Rescue on gate access and hydrant flow."),
  mk("Martin County", "Kurt Hollander", "Inspection Coordinator", "(772) 288-5940", "khollander@martin.fl.us", "2026-06-02", "good",
    "Correction re-inspections booked within the 48-hour statutory window."),
  mk("Martin County", "Nadine Frost", "Permit Clerk / Front Desk", "(772) 288-5916", "nfrost@martin.fl.us", "2026-05-30", "good",
    "Handles fee payment authorizations and permit issuance packets."),

  // ---- City of Fort Pierce ----
  mk("Fort Pierce", "Wallace Dumont", "Chief Building Official (CBO)", "(772) 460-2200", "wdumont@cityoffortpierce.com", "2026-05-12", "attention",
    "Short-staffed this quarter; confirm receipt of every submittal by phone the same afternoon."),
  mk("Fort Pierce", "Camille Reyes", "Plan Review Supervisor", "(772) 460-2214", "creyes@cityoffortpierce.com", "2026-05-20", "neutral",
    "Paper set still required for historic district parcels north of Orange Ave."),
  mk("Fort Pierce", "Stephen Ige", "Plan Reviewer — Electrical", "(772) 460-2219", "sige@cityoffortpierce.com", "2026-04-15", "neutral",
    "Requires service load calculation sheet on all pool/spa equipment upgrades."),
  mk("Fort Pierce", "Monica Duplessis", "Inspection Coordinator", "(772) 460-2230", "mduplessis@cityoffortpierce.com", "2026-05-31", "good",
    "Same-day inspections available Tuesday through Friday."),
  mk("Fort Pierce", "Ray Bostwick", "Zoning Contact", "(772) 460-2240", "rbostwick@cityoffortpierce.com", "2026-02-26", "attention",
    "Historic preservation review adds a week — start zoning early on downtown work."),
];

function read(): MunicipalContact[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as MunicipalContact[];
  } catch {
    return SEED;
  }
}

function write(list: MunicipalContact[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(MUNI_CONTACT_EVT));
}

export function listMunicipalContacts(muni?: string): MunicipalContact[] {
  const all = read();
  const rows = muni ? all.filter((c) => matches(c.muni, muni)) : all;
  return rows.slice().sort((a, b) => CONTACT_ROLES.indexOf(a.role as ContactRole) - CONTACT_ROLES.indexOf(b.role as ContactRole));
}

function norm(s: string) {
  return s.toLowerCase().replace(/\b(city|town|village) of\b/g, "").replace(/\bcounty\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function matches(a: string, b: string) {
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Find the jurisdiction key that best matches a project's city/county. */
export function resolveJurisdiction(city?: string | null, county?: string | null): string | null {
  const keys = Array.from(new Set(read().map((c) => c.muni)));
  if (city) {
    const hit = keys.find((k) => matches(k, city));
    if (hit) return hit;
  }
  if (county) {
    const hit = keys.find((k) => matches(k, county) || matches(k, `${county} County`));
    if (hit) return hit;
  }
  return null;
}

export function addMunicipalContact(input: Omit<MunicipalContact, "id">): MunicipalContact {
  const row: MunicipalContact = { ...input, id: Math.random().toString(36).slice(2, 10) };
  write([...read(), row]);
  return row;
}

export function updateMunicipalContact(id: string, patch: Partial<Omit<MunicipalContact, "id">>) {
  write(read().map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function deleteMunicipalContact(id: string) {
  write(read().filter((c) => c.id !== id));
}
