import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Returns a short-lived signed URL for a private ID document stored in the
 * `id-verification` bucket (path is kept on the `permits` table). No public
 * URL is ever exposed.
 */
export async function getIdDocumentSignedUrl(
  path: string,
  expiresIn = 300,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from("id-verification")
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
