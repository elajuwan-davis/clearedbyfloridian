import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenInput = z.object({ token: z.string().uuid() });

const SubmitInput = z.object({
  token: z.string().uuid(),
  patch: z.object({
    company_name: z.string().optional(),
    trade: z.string().optional().nullable(),
    qualifier_name: z.string().optional().nullable(),
    license_number: z.string().optional().nullable(),
    license_expiration: z.string().optional().nullable(),
    license_file_name: z.string().optional().nullable(),
    contact_first_name: z.string().optional().nullable(),
    contact_last_name: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    company_address: z.string().optional().nullable(),
    insurance_carrier_name: z.string().optional().nullable(),
    insurance_carrier_email: z.string().optional().nullable(),
    coi_file_name: z.string().optional().nullable(),
    coi_expiration: z.string().optional().nullable(),
    w9_file_name: z.string().optional().nullable(),
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
  contact_first_name: string | null;
  contact_last_name: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
  insurance_carrier_name: string | null;
  insurance_carrier_email: string | null;
  coi_file_name: string | null;
  coi_expiration: string | null;
  w9_file_name: string | null;
  status: string;
};

export const getSubByTokenFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }): Promise<PublicSubRecord | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .select("id, company_name, trade, qualifier_name, license_number, license_expiration, license_file_name, contact_first_name, contact_last_name, email, phone, company_address, insurance_carrier_name, insurance_carrier_email, coi_file_name, coi_expiration, w9_file_name, status")
      .eq("completion_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row as PublicSubRecord | null) ?? null;
  });

export const submitSubIntakeFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SubmitInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { ...data.patch, status: "complete" };
    const { data: row, error } = await (supabaseAdmin.from("subcontractors" as any) as any)
      .update(patch)
      .eq("completion_token", data.token)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Invalid or expired intake link");
    return { ok: true };
  });
