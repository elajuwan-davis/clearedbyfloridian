// First-login tour state, kept on the tenant so it survives a new device and never
// replays for a company that has already been walked through.
//
// Both functions degrade quietly when 20260827120000_tenants_plan_and_tour.sql has not been
// applied yet: an unknown column means "no tour" rather than an error wall on the dashboard.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function tenantIdFor(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin.from("tenant_members" as any) as any)
    .select("tenant_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as any)?.tenant_id ?? null;
}

export const shouldShowFirstLoginTourFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tenantId = await tenantIdFor(context.userId);
    if (!tenantId) return { show: false };
    const { data, error } = await (supabaseAdmin.from("tenants" as any) as any)
      .select("tour_completed_at")
      .eq("id", tenantId)
      .maybeSingle();
    if (error || !data) return { show: false };
    return { show: (data as any).tour_completed_at === null };
  });

export const completeFirstLoginTourFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tenantId = await tenantIdFor(context.userId);
    if (!tenantId) return { ok: false };
    const { error } = await (supabaseAdmin.from("tenants" as any) as any)
      .update({ tour_completed_at: new Date().toISOString() })
      .eq("id", tenantId);
    return { ok: !error };
  });
