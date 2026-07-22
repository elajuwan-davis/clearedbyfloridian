import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenInput = z.object({ token: z.string().uuid() });

const UploadUrlInput = z.object({
  token: z.string().uuid(),
  field: z.enum(["license", "coi", "w9"]),
  filename: z.string().min(1).max(200),
  contentType: z.string().max(200).optional(),
});

const FileUrlInput = z.object({
  token: z.string().uuid(),
  path: z.string().min(1),
});

const SubmitInput = z.object({
  token: z.string().uuid(),
  patch: z.object({
    company_name: z.string().optional(),
    trade: z.string().optional().nullable(),
    qualifier_name: z.string().optional().nullable(),
    license_number: z.string().optional().nullable(),
    license_expiration: z.string().optional().nullable(),
    license_file_name: z.string().optional().nullable(),
    license_file_path: z.string().optional().nullable(),
    contact_first_name: z.string().optional().nullable(),
    contact_last_name: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    company_address: z.string().optional().nullable(),
    insurance_carrier_name: z.string().optional().nullable(),
    insurance_carrier_email: z.string().optional().nullable(),
    coi_file_name: z.string().optional().nullable(),
    coi_file_path: z.string().optional().nullable(),
    coi_expiration: z.string().optional().nullable(),
    w9_file_name: z.string().optional().nullable(),
    w9_file_path: z.string().optional().nullable(),
  }),
});

export type PublicSubRecord = {
  id: string;
  company_name: string;
  trade: string | null;
  qualifier_name: string | null;
  license_number: string | null;
  license_expiration: string | null;
  license_file_name: string | null;
  license_file_path: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
  insurance_carrier_name: string | null;
  insurance_carrier_email: string | null;
  coi_file_name: string | null;
  coi_file_path: string | null;
  coi_expiration: string | null;
  w9_file_name: string | null;
  w9_file_path: string | null;
  status: string;
};

const BUCKET = "permit-files";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

async function verifyToken(token: string): Promise<{ id: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin.from("subcontractors" as any) as any)
    .select("id")
    .eq("completion_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Invalid or expired intake link");
  return data as { id: string };
}

export const getSubByTokenFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }): Promise<PublicSubRecord | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .select("id, company_name, trade, qualifier_name, license_number, license_expiration, license_file_name, license_file_path, contact_first_name, contact_last_name, email, phone, company_address, insurance_carrier_name, insurance_carrier_email, coi_file_name, coi_file_path, coi_expiration, w9_file_name, w9_file_path, status")
      .eq("completion_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as PublicSubRecord | null) ?? null;
  });

export const getSubUploadUrlFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UploadUrlInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await verifyToken(data.token);
    const path = `subs/${data.token}/${data.field}/${Date.now()}-${safeName(data.filename)}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, signedUrl: signed.signedUrl, token: signed.token };
  });

export const getSubFileUrlFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FileUrlInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Path must start with subs/<token>/ — prevents peeking at unrelated files
    if (!data.path.startsWith(`subs/${data.token}/`)) throw new Error("Forbidden");
    await verifyToken(data.token);
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const submitSubIntakeFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = (supabaseAdmin.from("subcontractors" as any) as any);

    const filePairs = [
      ["license_file_name", "license_file_path"],
      ["coi_file_name", "coi_file_path"],
      ["w9_file_name", "w9_file_path"],
    ] as const;
    for (const [nameKey, pathKey] of filePairs) {
      if (data.patch[nameKey] && !data.patch[pathKey]) {
        throw new Error("Document uploads must finish before submitting. Please re-upload the file.");
      }
    }

    const { data: inviteRow, error: lookupErr } = await table
      .select("id, company_name")
      .eq("completion_token", data.token)
      .maybeSingle();
    if (lookupErr) throw new Error(lookupErr.message);
    if (!inviteRow) throw new Error("Invalid or expired intake link");

    const isReusableInvite = /^Pending Invite/i.test(inviteRow.company_name ?? "");

    if (isReusableInvite) {
      const insertPayload: Record<string, unknown> = { ...data.patch, status: "complete" };
      const { data: newRow, error: insertErr } = await table
        .insert(insertPayload)
        .select("id")
        .single();
      if (insertErr) throw new Error(insertErr.message);
      return { ok: true, id: newRow.id };
    }

    const patch: Record<string, unknown> = { ...data.patch, status: "complete" };
    const { data: row, error } = await table
      .update(patch)
      .eq("completion_token", data.token)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Invalid or expired intake link");
    return { ok: true, id: row.id };
  });
