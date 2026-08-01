// Admin-only staff review queue: permits a client submitted themselves that
// are still sitting in draft, awaiting staff acceptance.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles" as any)
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden — admin only");
}

export type ReviewQueueRow = {
  id: string;
  project_name: string;
  job_address: string | null;
  municipality: string | null;
  city: string | null;
  permit_type: string | null;
  contractor_company: string | null;
  tenant_name: string | null;
  submitted_by: string | null;
  created_at: string;
};

export const listReviewQueueFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReviewQueueRow[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const [permitRes, tenantRes, profileRes] = await Promise.all([
      db
        .from("permits")
        .select(
          "id, project_name, job_address, municipality, city, permit_type, contractor_company, tenant_id, created_by, created_at",
        )
        .eq("submission_source", "self_service")
        .eq("status", "draft")
        .order("created_at", { ascending: false }),
      db.from("tenants").select("id, name"),
      db.from("profiles").select("id, email, display_name"),
    ]);

    if (permitRes.error) throw new Error(permitRes.error.message);

    const tenants = new Map<string, string>(
      (tenantRes.data ?? []).map((t: any) => [t.id, t.name as string]),
    );
    const users = new Map<string, any>(
      (profileRes.data ?? []).map((p: any) => [p.id, p]),
    );


    return (permitRes.data ?? []).map((p: any) => ({
      id: p.id,
      project_name: p.project_name,
      job_address: p.job_address ?? null,
      municipality: p.municipality ?? null,
      city: p.city ?? null,
      permit_type: p.permit_type ?? null,
      contractor_company: p.contractor_company ?? null,
      tenant_name: p.tenant_id ? (tenants.get(p.tenant_id) ?? null) : null,
      submitted_by: p.created_by ? (users.get(p.created_by)?.email ?? null) : null,
      created_at: p.created_at,
    }));
  });
