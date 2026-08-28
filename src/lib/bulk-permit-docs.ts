// Bulk document upload for permits.
//
// Mirrors the Building Dept Logins bulk importer, but for files: the user picks
// many documents at once and each one becomes its own custom document field on
// the permit, named after the file itself (extension stripped) and stored as-is.

import { uploadPermitFile } from "@/lib/permit-storage";
import { getEffectiveDocs, getPermit, updatePermitDocuments, type PermitDoc, type PermitRow } from "@/lib/permits-api";

export const BULK_MAX_FILES = 40;
export const BULK_MAX_BYTES = 50 * 1024 * 1024;
const BULK_UPLOAD_CONCURRENCY = 6;

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

function appendUniqueDocs(existing: PermitDoc[], additions: PermitDoc[]): PermitDoc[] {
  const taken = new Set(existing.map((d) => d.key));
  const next = [...existing];
  for (const doc of additions) {
    if (taken.has(doc.key)) {
      const key = uniqueDocKey(doc.label, taken);
      next.push({ ...doc, key });
    } else {
      taken.add(doc.key);
      next.push(doc);
    }
  }
  return next;
}

/**
 * Uploads every file and appends one uploaded custom document field per file.
 * Persists once at the end so a partial failure never loses the good uploads.
 */
export async function bulkUploadPermitDocs(
  permit: PermitRow,
  files: File[],
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<BulkUploadResult> {
  const currentPermit = (await getPermit(permit.id)) ?? permit;
  const existing = getEffectiveDocs(currentPermit);
  const taken = new Set(existing.map((d) => d.key));
  const tasks: Array<{ index: number; file: File; key: string; label: string }> = [];
  const failed: { filename: string; message: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    if (file.size > BULK_MAX_BYTES) {
      failed.push({ filename: file.name, message: "Larger than 50MB" });
      continue;
    }
    const label = labelFromFilename(file.name);
    const key = uniqueDocKey(label, taken);
    tasks.push({ index: i, file, key, label });
  }

  const successes: Array<{ index: number; doc: PermitDoc }> = [];
  let cursor = 0;
  let done = files.length - tasks.length;

  async function uploadNext() {
    while (cursor < tasks.length) {
      const task = tasks[cursor];
      cursor += 1;
      if (!task) continue;
      onProgress?.(done, files.length, task.file.name);
      const uploadedAt = new Date().toISOString();
      try {
        const { path, size, mime } = await uploadPermitFile(permit.id, task.key, task.file, task.file.name);
        successes.push({
          index: task.index,
          doc: {
            key: task.key,
            label: task.label,
            required: false,
            custom: true,
            status: "uploaded",
            filename: task.file.name,
            path,
            size,
            mime,
            uploaded_at: uploadedAt,
            external_url: null,
            source: "upload",
          },
        });
      } catch (e) {
        failed.push({ filename: task.file.name, message: e instanceof Error ? e.message : String(e) });
      } finally {
        done += 1;
        onProgress?.(done, files.length, task.file.name);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(BULK_UPLOAD_CONCURRENCY, Math.max(tasks.length, 1)) }, () => uploadNext()),
  );
  onProgress?.(files.length, files.length, "");

  const added = successes.sort((a, b) => a.index - b.index).map((s) => s.doc);
  const uploaded = added.map((d) => d.filename ?? d.label);

  if (added.length === 0) return { permit: currentPermit, uploaded, failed };

  const next = await updatePermitDocuments(permit.id, (docs) => appendUniqueDocs(docs, added));
  return { permit: next, uploaded, failed };
}
