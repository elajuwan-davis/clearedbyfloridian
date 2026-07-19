// User-added municipalities for the Building Dept page.
// localStorage-backed until wired to Supabase.

export const FL_COUNTIES = [
  "Alachua","Baker","Bay","Bradford","Brevard","Broward","Calhoun","Charlotte","Citrus","Clay",
  "Collier","Columbia","DeSoto","Dixie","Duval","Escambia","Flagler","Franklin","Gadsden","Gilchrist",
  "Glades","Gulf","Hamilton","Hardee","Hendry","Hernando","Highlands","Hillsborough","Holmes","Indian River",
  "Jackson","Jefferson","Lafayette","Lake","Lee","Leon","Levy","Liberty","Madison","Manatee",
  "Marion","Martin","Miami-Dade","Monroe","Nassau","Okaloosa","Okeechobee","Orange","Osceola","Palm Beach",
  "Pasco","Pinellas","Polk","Putnam","St. Johns","St. Lucie","Santa Rosa","Sarasota","Seminole","Sumter",
  "Suwannee","Taylor","Union","Volusia","Wakulla","Walton","Washington",
] as const;

export const PORTAL_PLATFORMS = [
  "EnerGov","Accela","CSS","Tyler Technologies","OpenGov","Custom","None/No Portal",
] as const;

export type PortalPlatform = (typeof PORTAL_PLATFORMS)[number];

export type CustomMunicipality = {
  id: string;
  municipality_name: string;
  county: string;
  portal_url: string;
  platform: PortalPlatform;
  username?: string;
  password?: string;
  phone?: string;
  email?: string;
  notes?: string;
  verified: boolean;
  created_at: string;
};

const KEY = "cleared.municipalities.v1";
const EVT = "municipalities:changed";

function read(): CustomMunicipality[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomMunicipality[]) : [];
  } catch { return []; }
}
function write(list: CustomMunicipality[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listMunicipalities(): CustomMunicipality[] {
  return read().sort((a, b) => a.municipality_name.localeCompare(b.municipality_name));
}

export function addMunicipality(input: Omit<CustomMunicipality, "id" | "created_at">): CustomMunicipality {
  const rec: CustomMunicipality = {
    ...input,
    id: Math.random().toString(36).slice(2, 10),
    created_at: new Date().toISOString(),
  };
  write([rec, ...read()]);
  return rec;
}

export function updateMunicipality(id: string, patch: Partial<CustomMunicipality>) {
  write(read().map((m) => (m.id === id ? { ...m, ...patch } : m)));
}

export function deleteMunicipality(id: string) {
  write(read().filter((m) => m.id !== id));
}

export function subscribeMunicipalities(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
