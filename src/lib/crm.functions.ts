// Current CRM / project-management tool capture.
//
// One field pair on public.profiles (current_crm / current_crm_other) is written by either
// signup path — the /join form or the post-Google modal — and read by the admin CRMs tab.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveInput = z.object({
  crm: z.string().min(1).max(120),
  crm_other: z.string().max(200).optional().nullable(),
  source: z.enum(["signup_form", "google"]).default("google"),
});

/** Has the signed-in user already answered the CRM question? */
export const getMyCrmFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase.from("profiles" as never) as any)
      .select("current_crm, current_crm_other")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      crm: (data?.current_crm as string | null) ?? null,
      crm_other: (data?.current_crm_other as string | null) ?? null,
    };
  });

export const saveMyCrmFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase.from("profiles" as never) as any).upsert(
      {
        id: context.userId,
        current_crm: data.crm,
        current_crm_other: data.crm_other?.trim() || null,
        crm_source: data.source,
        crm_captured_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type CrmProfileRow = {
  user_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  crm: string | null;
  crm_other: string | null;
  source: string | null;
  signed_up_at: string | null;
};

/** Admin-only roster of every account and the tool it reported. */
export const listCrmProfilesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CrmProfileRow[]> => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin" as never);
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin.from("profiles" as never) as any)
      .select(
        "id, email, display_name, full_name, company_name, current_crm, current_crm_other, crm_source, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return ((data ?? []) as any[]).map((r) => ({
      user_id: r.id as string,
      name: (r.display_name || r.full_name || null) as string | null,
      email: (r.email ?? null) as string | null,
      company: (r.company_name ?? null) as string | null,
      crm: (r.current_crm ?? null) as string | null,
      crm_other: (r.current_crm_other ?? null) as string | null,
      source: (r.crm_source ?? null) as string | null,
      signed_up_at: (r.created_at ?? null) as string | null,
    }));
  });
