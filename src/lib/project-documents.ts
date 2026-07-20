// Supabase Storage-backed project documents (replaces the old localStorage stub).
// Files live in the "permit-files" bucket under: project-docs/<projectId>/<typeSlug>/<ts>-<name>

import { supabase } from "@/integrations/supabase/client";

export const DOC_TYPES = [
  "Stamped Construction Plans",
  "Site/Spot Survey",
  "Product Approvals / NOA",
  "Truss Packet",
  "Energy Calcs",
  "Civil / Other",
  "COI (Certificate of Insurance)",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export type ProjectDoc = {
  id: string;               // storage path (unique)
  projectId: string;
  type: DocType;
  filename: string;
  uploadedBy: string;       // encoded in filename prefix
  uploadedAt: string;       // ISO
  status: "uploaded" | "pending";
  path: string;             // full storage path
  size: number | null;
  mime: string | null;
};

const BUCKET = "permit-files";
const ROOT = "project-docs";

function slug(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function unslug(s: string): DocType {
  const match = DOC_TYPES.find((t) => slug(t) === s);
  return match ?? "Civil / Other";
}
function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("project-docs:changed"));
  }
}

export async function listDocs(projectId: string): Promise<ProjectDoc[]> {
  const base = `${ROOT}/${projectId}`;
  // List each type folder in parallel.
  const results = await Promise.all(
    DOC_TYPES.map(async (type) => {
      const folder = `${base}/${slug(type)}`;
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error || !data) return [] as ProjectDoc[];
      return data
        .filter((o) => o.name && !o.name.endsWith("/"))
        .map<ProjectDoc>((o) => {
          const meta = o.metadata as { size?: number; mimetype?: string } | undefined;
          // Filename layout: <ts>__<by>__<original>
          const parts = o.name.split("__");
          const originalName = parts.length >= 3 ? parts.slice(2).join("__") : o.name;
          const uploadedBy = parts.length >= 3 ? decodeURIComponent(parts[1] ?? "Team") : "Team";
          return {
            id: `${folder}/${o.name}`,
            projectId,
            type,
            filename: originalName,
            uploadedBy,
            uploadedAt: (o.created_at ?? new Date().toISOString()).slice(0, 10),
            status: "uploaded",
            path: `${folder}/${o.name}`,
            size: meta?.size ?? null,
            mime: meta?.mimetype ?? null,
          };
        });
    }),
  );
  return results.flat().sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function addDocFile(input: {
  projectId: string;
  type: DocType;
  file: File;
  uploadedBy: string;
}): Promise<ProjectDoc> {
  const ts = Date.now();
  const nameOnDisk = `${ts}__${encodeURIComponent(input.uploadedBy)}__${safeName(input.file.name)}`;
  const path = `${ROOT}/${input.projectId}/${slug(input.type)}/${nameOnDisk}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, { contentType: input.file.type || undefined, upsert: false });
  if (error) throw error;
  emitChange();
  return {
    id: path,
    projectId: input.projectId,
    type: input.type,
    filename: input.file.name,
    uploadedBy: input.uploadedBy,
    uploadedAt: new Date().toISOString().slice(0, 10),
    status: "uploaded",
    path,
    size: input.file.size,
    mime: input.file.type || null,
  };
}

// Metadata-only marker (deferred / pending) — write a zero-byte placeholder so it lists.
export async function addDocPlaceholder(input: {
  projectId: string;
  type: DocType;
  filename: string;
  uploadedBy: string;
}): Promise<ProjectDoc> {
  const ts = Date.now();
  const nameOnDisk = `${ts}__${encodeURIComponent(input.uploadedBy)}__${safeName(input.filename)}`;
  const path = `${ROOT}/${input.projectId}/${slug(input.type)}/${nameOnDisk}`;
  const blob = new Blob([""], { type: "text/plain" });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "text/plain", upsert: false });
  if (error) throw error;
  emitChange();
  return {
    id: path,
    projectId: input.projectId,
    type: input.type,
    filename: input.filename,
    uploadedBy: input.uploadedBy,
    uploadedAt: new Date().toISOString().slice(0, 10),
    status: "pending",
    path,
    size: 0,
    mime: null,
  };
}

// Backwards-compatible name for callers that had no File (notary flow).
export async function addDoc(input: {
  projectId: string;
  type: DocType;
  filename: string;
  uploadedBy: string;
  status?: "uploaded" | "pending";
}): Promise<ProjectDoc> {
  return addDocPlaceholder(input);
}

export async function deleteDoc(id: string): Promise<void> {
  // id === path
  const { error } = await supabase.storage.from(BUCKET).remove([id]);
  if (error) throw error;
  emitChange();
}

export async function getDocViewUrl(path: string, expiresIn = 600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not sign URL");
  return data.signedUrl;
}

export async function getDocDownloadUrl(path: string, filename: string, expiresIn = 600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn, { download: filename });
  if (error || !data?.signedUrl) throw error ?? new Error("Could not sign URL");
  return data.signedUrl;
}
