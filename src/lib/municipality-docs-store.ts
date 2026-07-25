// Track ICI docs uploaded per city. Files go to Supabase Storage (permit-files bucket)
// under `municipality-docs/<citySlug>/<docKey>-...`, and the paths are indexed in localStorage.
import { supabase } from "@/integrations/supabase/client";
import { PERMIT_BUCKET } from "@/lib/permit-storage";
import type { IciDocKey } from "@/lib/municipalities-data";

export type IciDocRecord = {
  path: string;
  filename: string;
  uploadedAt: string;
};

export type CityDocs = Partial<Record<IciDocKey, IciDocRecord>>;

const KEY = "cleared.municipality-docs.v1";
const EVT = "municipality-docs:changed";

type Store = Record<string, CityDocs>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    return {};
  }
}
function write(s: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function getCityDocs(slug: string): CityDocs {
  return read()[slug] || {};
}

export function subscribeCityDocs(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

export async function uploadCityDoc(
  slug: string,
  docKey: IciDocKey,
  file: File,
): Promise<IciDocRecord> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `municipality-docs/${slug}/${docKey}-${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from(PERMIT_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: true });
  if (error) throw error;
  const rec: IciDocRecord = { path, filename: file.name, uploadedAt: new Date().toISOString() };
  const store = read();
  store[slug] = { ...(store[slug] || {}), [docKey]: rec };
  write(store);
  return rec;
}

export async function removeCityDoc(slug: string, docKey: IciDocKey): Promise<void> {
  const store = read();
  const existing = store[slug]?.[docKey];
  if (existing?.path) {
    await supabase.storage.from(PERMIT_BUCKET).remove([existing.path]).catch(() => {});
  }
  if (store[slug]) {
    delete store[slug][docKey];
    write(store);
  }
}

export async function viewCityDoc(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(PERMIT_BUCKET).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
