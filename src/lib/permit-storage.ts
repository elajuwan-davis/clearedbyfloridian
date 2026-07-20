import { supabase } from "@/integrations/supabase/client";

export const PERMIT_BUCKET = "permit-files";

export function buildPermitPath(permitId: string, docKey: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${permitId}/${docKey}/${Date.now()}-${safe}`;
}

export async function uploadPermitFile(
  permitId: string,
  docKey: string,
  file: File | Blob,
  filename: string,
  contentType?: string,
): Promise<{ path: string; size: number; mime: string }> {
  const path = buildPermitPath(permitId, docKey, filename);
  const { error } = await supabase.storage.from(PERMIT_BUCKET).upload(path, file, {
    contentType: contentType || (file as File).type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return {
    path,
    size: (file as File).size ?? (file as Blob).size ?? 0,
    mime: contentType || (file as File).type || "application/octet-stream",
  };
}

export async function getPermitFileUrl(path: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(PERMIT_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deletePermitFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PERMIT_BUCKET).remove([path]);
  if (error) throw error;
}

export async function downloadPermitFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(PERMIT_BUCKET).download(path);
  if (error) throw error;
  return data;
}
