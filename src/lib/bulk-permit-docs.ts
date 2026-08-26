// Bulk document upload for permits.
//
// Mirrors the Building Dept Logins bulk importer, but for files: the user picks
// many documents at once and each one becomes its own custom document field on
// the permit, named after the file itself (extension stripped) and stored as-is.

import { uploadPermitFile } from "@/lib/permit-storage";
import { getEffectiveDocs, updatePermit, type PermitDoc, type PermitRow } from "@/lib/permits-api";

export const BULK_MAX_FILES = 40;
export const BULK_MAX_BYTES = 50 * 1024 * 1024;

/** "Truss Packet - Rev 3.pdf" -> "Truss Packet - Rev 3" */
export function labelFromFilename(filename: string): string {
  const base = filename.replace(/\.[a-z0-9]{1,6}$/i, "").trim();
  return base || filename;
}

function slugKey(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "")
      .slice(0, 48) || "document"
  );
}

/** Unique doc key that never collides with an existing field. */
export function uniqueDocKey(label: string, taken: Set<string>): string {
  const base = slugKey(label);
  let key = base;
  let n = 2;
  while (taken.has(key)) key = `${base}_${n++}`;
  taken.add(key);
  return key;
}

export type BulkUploadResult = {
  permit: PermitRow;
  uploaded: string[];
  failed: { filename: string; message: string }[];
};

/**
 * Uploads every file and appends one uploaded custom document field per file.
 * Persists once at the end so a partial failure never loses the good uploads.
 */
export async function bulkUploadPermitDocs(
  permit: PermitRow,
  files: File[],
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<BulkUploadResult> {
  const existing = getEffectiveDocs(permit);
  const taken = new Set(existing.map((d) => d.key));
  const added: PermitDoc[] = [];
  const uploaded: string[] = [];
  const failed: { filename: string; message: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i, files.length, file.name);
    if (file.size > BULK_MAX_BYTES) {
      failed.push({ filename: file.name, message: "Larger than 50MB" });
      continue;
    }
    const label = labelFromFilename(file.name);
    const key = uniqueDocKey(label, taken);
    try {
      const { path, size, mime } = await uploadPermitFile(permit.id, key, file, file.name);
      added.push({
        key,
        label,
        required: false,
        custom: true,
        status: "uploaded",
        filename: file.name,
        path,
        size,
        mime,
        uploaded_at: new Date().toISOString(),
        external_url: null,
        source: "upload",
      });
      uploaded.push(file.name);
    } catch (e) {
      failed.push({ filename: file.name, message: e instanceof Error ? e.message : String(e) });
    }
  }
  onProgress?.(files.length, files.length, "");

  if (added.length === 0) return { permit, uploaded, failed };

  const next = await updatePermit(permit.id, { documents: [...existing, ...added] });
  return { permit: next, uploaded, failed };
}
