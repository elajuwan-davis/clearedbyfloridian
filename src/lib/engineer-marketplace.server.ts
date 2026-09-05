// Server-side store for the engineer's letter marketplace.
//
// BLIND ROUTING: engineers must never learn who the job belongs to. Everything
// an engineer can read goes through `blindRequests()`, which selects an explicit
// column allow-list — no project_id, tenant_id, assigned_engineer_id, admin
// notes, or joined permit data. Widening BLIND_COLUMNS leaks the GC.

import { adminDb, ApiError } from "@/lib/api-auth.server";

export type RequestStatus = "open" | "assigned" | "in_review" | "complete" | "cancelled";

/** Photos are stored as object paths in a private bucket, never as caller
 *  supplied URLs: an arbitrary host would see the engineer's IP the moment the
 *  photo rendered, which is exactly the link blind routing is meant to cut.
 *  Readers get a short-lived signed `url` alongside the stored path. */
export const PHOTO_BUCKET = "engineer-letter-photos";
const PHOTO_URL_TTL_SECONDS = 60 * 60;

export type InspectionPhoto = { path: string; caption: string; url?: string };

type PhotoHost = { host: string };

function supabaseHosts(): PhotoHost[] {
  const raw = [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL];
  const hosts: PhotoHost[] = [];
  for (const value of raw) {
    if (!value) continue;
    try {
      hosts.push({ host: new URL(value).host.toLowerCase() });
    } catch {
      // Ignore a malformed env value; a path-only submission still works.
    }
  }
  return hosts;
}

/** Accept either a bare object path or a Storage URL on our own Supabase
 *  project, and return the bare path. Anything else is rejected. */
export function normalizePhotoPath(input: string, tenantId: string): string {
  let path = input.trim();

  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    let url: URL;
    try {
      url = new URL(path);
    } catch {
      throw new ApiError(422, "inspection_photos: not a Supabase Storage path");
    }
    if (
      url.protocol !== "https:" ||
      !supabaseHosts().some((h) => h.host === url.host.toLowerCase())
    ) {
      throw new ApiError(
        422,
        "inspection_photos: only objects in the private engineer-letter-photos bucket are accepted",
      );
    }
    const match = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/(.+)$/.exec(url.pathname);
    if (!match) throw new ApiError(422, "inspection_photos: not a Supabase Storage object URL");
    path = decodeURIComponent(match[1]);
  }

  path = path.replace(/^\/+/, "");
  if (path.startsWith(`${PHOTO_BUCKET}/`)) path = path.slice(PHOTO_BUCKET.length + 1);

  if (!path || path.includes(".."))
    throw new ApiError(422, "inspection_photos: invalid object path");
  // Tenant prefix keeps one contractor from referencing another's upload.
  if (!path.startsWith(`${tenantId}/`)) {
    throw new ApiError(422, `inspection_photos: path must live under ${tenantId}/`);
  }
  return path;
}

/** Attach signed URLs for the stored photo paths. */
export async function signPhotos(photos: InspectionPhoto[]): Promise<InspectionPhoto[]> {
  const paths = photos.map((photo) => photo.path).filter(Boolean);
  if (paths.length === 0) return photos;

  const { data, error } = await adminDb()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrls(paths, PHOTO_URL_TTL_SECONDS);
  if (error) {
    console.error("[engineer-marketplace] could not sign inspection photos", error.message);
    return photos;
  }

  const signed = new Map<string, string>();
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }
  return photos.map((photo) => ({ ...photo, url: signed.get(photo.path) }));
}

export async function withSignedPhotos<T extends { inspection_photos: InspectionPhoto[] }>(
  rows: T[],
): Promise<T[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      inspection_photos: await signPhotos(row.inspection_photos ?? []),
    })),
  );
}

export type EngineerLetterRequest = {
  id: string;
  project_id: string;
  tenant_id: string;
  requested_inspections: string[];
  inspection_photos: InspectionPhoto[];
  scope_description: string;
  status: RequestStatus;
  assigned_engineer_id: string | null;
  final_document_url: string | null;
  admin_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** The only columns an engineer may ever see. */
const BLIND_COLUMNS =
  "id, requested_inspections, inspection_photos, scope_description, status, created_at, updated_at";

export type BlindRequest = {
  id: string;
  requested_inspections: string[];
  inspection_photos: InspectionPhoto[];
  scope_description: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

/** Open requests plus the engineer's own assignments, blind-projected. */
export async function blindRequests(
  engineerId: string,
  requestId?: string,
): Promise<BlindRequest[]> {
  let query = adminDb()
    .from("engineer_letter_requests")
    .select(BLIND_COLUMNS)
    .or(`status.eq.open,assigned_engineer_id.eq.${engineerId}`)
    .order("created_at", { ascending: false });
  if (requestId) query = query.eq("id", requestId);

  const { data, error } = await query;
  if (error) throw new ApiError(500, error.message);
  return withSignedPhotos((data ?? []) as unknown as BlindRequest[]);
}

export async function blindRequest(engineerId: string, requestId: string): Promise<BlindRequest> {
  const [row] = await blindRequests(engineerId, requestId);
  if (!row) throw new ApiError(404, "Request not found");
  return row;
}

export async function loadRequest(requestId: string): Promise<EngineerLetterRequest> {
  const { data, error } = await adminDb()
    .from("engineer_letter_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle<EngineerLetterRequest>();
  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, "Request not found");
  return data;
}

export async function updateRequest(
  requestId: string,
  patch: Partial<EngineerLetterRequest>,
): Promise<EngineerLetterRequest> {
  const { data, error } = await adminDb()
    .from("engineer_letter_requests")
    .update(patch)
    .eq("id", requestId)
    .select("*")
    .single<EngineerLetterRequest>();
  if (error) throw new ApiError(500, error.message);
  return data;
}

/** In-app notification for an engineer. Deliberately says nothing about the
 *  project, the GC, or the trade. */
export async function notifyEngineer(
  engineerId: string,
  title: string,
  body: string,
): Promise<void> {
  const { data: profile } = await adminDb()
    .from("engineer_profiles")
    .select("user_id")
    .eq("id", engineerId)
    .maybeSingle<{ user_id: string }>();
  if (!profile) return;

  const { error } = await adminDb().from("notifications").insert({
    user_id: profile.user_id,
    kind: "engineer_letter_assignment",
    title,
    body,
  });
  if (error) console.error("[engineer-marketplace] notification insert failed", error.message);
}
