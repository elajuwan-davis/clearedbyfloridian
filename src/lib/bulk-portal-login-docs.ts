// Bulk-attach documents to a building department login. Each file keeps its
// own original filename as the doc label — there is no per-document field to
// fill in, unlike the county-compliance-style single-doc-with-expiration
// flow. Upload is best-effort and never blocks saving the login credentials:
// call this after the login itself has already been saved.

import {
  createPortalLoginDocUploadUrlFn,
  insertPortalLoginDocumentFn,
  type PortalLoginDocument,
} from "@/lib/portal-login-docs";

export const BULK_LOGIN_DOC_MAX_FILES = 40;
const BULK_LOGIN_DOC_MAX_BYTES = 50 * 1024 * 1024; // 50MB
const CONCURRENCY = 4;

export type BulkPortalLoginDocResult = {
  uploaded: PortalLoginDocument[];
  failed: { filename: string; message: string }[];
};

export async function bulkUploadPortalLoginDocs(
  ctx: { municipalitySlug: string; municipality: string; tenantId: string | null },
  files: File[],
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<BulkPortalLoginDocResult> {
  const queue = files.slice(0, BULK_LOGIN_DOC_MAX_FILES);
  const uploaded: PortalLoginDocument[] = [];
  const failed: { filename: string; message: string }[] = [];
  let done = 0;

  async function uploadOne(file: File) {
    if (file.size > BULK_LOGIN_DOC_MAX_BYTES) {
      failed.push({ filename: file.name, message: "larger than 50MB" });
      return;
    }
    try {
      const { path, signedUrl } = await createPortalLoginDocUploadUrlFn({
        data: { municipalitySlug: ctx.municipalitySlug, filename: file.name },
      });
      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`upload failed (${put.status})`);
      const row = await insertPortalLoginDocumentFn({
        data: {
          municipality_slug: ctx.municipalitySlug,
          municipality: ctx.municipality,
          doc_label: file.name,
          file_path: path,
          file_name: file.name,
          expiration_date: null,
          tenant_id: ctx.tenantId,
        },
      });
      uploaded.push(row);
    } catch (e) {
      failed.push({
        filename: file.name,
        message: e instanceof Error ? e.message : "upload failed",
      });
    } finally {
      done += 1;
      onProgress?.(done, queue.length, file.name);
    }
  }

  let next = 0;
  async function worker() {
    while (next < queue.length) {
      const file = queue[next++];
      await uploadOne(file);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

  return { uploaded, failed };
}
