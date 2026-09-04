// Uploads jobsite photos for a "photos" style inspection request. Rides the
// same permit-files bucket every other permit document uses (path
// "{permit_id}/inspection-photos/...") so the existing storage RLS already
// covers it — no new bucket needed.

import { uploadPermitFile, getPermitFileUrl } from "@/lib/permit-storage";
import type { InspectionPhoto } from "@/lib/inspections-api";

export const INSPECTION_PHOTO_MAX_FILES = 20;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB per photo
const CONCURRENCY = 3;

export type InspectionPhotoUploadResult = {
  uploaded: InspectionPhoto[];
  failed: { filename: string; message: string }[];
};

export async function uploadInspectionPhotos(
  permitId: string,
  files: File[],
  onProgress?: (done: number, total: number, current: string) => void,
): Promise<InspectionPhotoUploadResult> {
  const queue = files.slice(0, INSPECTION_PHOTO_MAX_FILES);
  const uploaded: InspectionPhoto[] = [];
  const failed: { filename: string; message: string }[] = [];
  let done = 0;

  async function uploadOne(file: File) {
    if (file.size > MAX_BYTES) {
      failed.push({ filename: file.name, message: "larger than 15MB" });
      done += 1;
      onProgress?.(done, queue.length, file.name);
      return;
    }
    try {
      const { path, size, mime } = await uploadPermitFile(
        permitId,
        "inspection-photos",
        file,
        file.name,
      );
      uploaded.push({
        path,
        file_name: file.name,
        size,
        mime,
        uploaded_at: new Date().toISOString(),
      });
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

/** Short-lived signed URL for viewing or sharing one photo. */
export async function getInspectionPhotoUrl(path: string, expiresIn = 600): Promise<string> {
  return getPermitFileUrl(path, expiresIn);
}
