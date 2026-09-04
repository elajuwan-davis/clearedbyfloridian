// Weekly status report generator. Queried live for the portal Reports page
// and dispatched via email each Monday morning by the /api/public/weekly-reports
// cron endpoint.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { complianceFlagsFromSubs } from "./weekly-report-flags";

export type WeeklyReport = {
  tenant_id: string;
  tenant_name: string;
  window_start: string;
  active_permits: Array<{ id: string; project_name: string; status: string; permit_number: string | null }>;
  compliance_flags: Array<{ subcontractor: string; issue: string }>;
  hoa_status: Array<{ id: string; community: string | null; status: string }>;
  corrections: Array<{ correction_text: string; municipality_name: string | null; last_seen_at: string }>;
};

export const getMyWeeklyReportFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WeeklyReport | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await (supabaseAdmin.from("tenant_members" as any) as any)
      .select("tenant_id").eq("user_id", context.userId).maybeSingle();
    if (!me) return null;
    return buildTenantReport(me.tenant_id);
  });

export async function buildTenantReport(tenantId: string): Promise<WeeklyReport> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: tenant }, { data: permits }, { data: subs }, { data: hoas }, { data: corrections }] = await Promise.all([
    (supabaseAdmin.from("tenants" as any) as any).select("name").eq("id", tenantId).maybeSingle(),
    (supabaseAdmin.from("permits" as any) as any)
      .select("id, project_name, status, permit_number")
      .eq("tenant_id", tenantId)
      .not("status", "in", "(closed,cancelled)"),
    (supabaseAdmin.from("subcontractors" as any) as any)
      .select("company_name, coi_expiration, license_expiration, coi_status, license_status")
      .eq("tenant_id", tenantId),
    (supabaseAdmin.from("hoa_submittals" as any) as any)
      .select("id, community_name, hoa_name, status")
      .eq("tenant_id", tenantId)
      .neq("status", "closed"),
    (supabaseAdmin.from("submittal_corrections" as any) as any)
      .select("correction_text, municipality_name, last_seen_at")
      .gte("last_seen_at", weekAgo)
      .order("last_seen_at", { ascending: false })
      .limit(10),
  ]);

  const complianceFlags = complianceFlagsFromSubs(subs);

  return {
    tenant_id: tenantId,
    tenant_name: tenant?.name ?? "Team",
    window_start: weekAgo,
    active_permits: ((permits ?? []) as any[]).map((p) => ({
      id: p.id, project_name: p.project_name, status: p.status, permit_number: p.permit_number ?? null,
    })),
    compliance_flags: complianceFlags,
    hoa_status: ((hoas ?? []) as any[]).map((h) => ({
      id: h.id,
      community: h.community_name ?? h.hoa_name ?? null,
      status: h.status,
    })),
    corrections: ((corrections ?? []) as any[]).map((c) => ({
      correction_text: c.correction_text,
      municipality_name: c.municipality_name ?? null,
      last_seen_at: c.last_seen_at,
    })),
  };
}
