// Which features a tenant's plan includes. The rules live in plan-gating.ts so they can
// be unit-tested without pulling in the Vite/Supabase client. This file is the React
// hook that reads `tenants.plan` and applies those rules.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import {
  normalizePlan,
  planIncludes,
  type GatedFeature,
  type PlanTier,
} from "@/lib/plan-gating";

export type { FeatureCopy, GatedFeature, PlanTier } from "@/lib/plan-gating";
export { FEATURE_COPY, TRIAL_PATHS, planIncludes, trialPathAllowed } from "@/lib/plan-gating";

export type PlanAccess = {
  loading: boolean;
  plan: PlanTier | null;
  /** Resolved to the trial tier — false while loading, so nothing hides early. */
  isTrial: boolean;
  /** True when the feature is available to this tenant. */
  allows: (feature: GatedFeature) => boolean;
  /** Inverse of `allows`, for the common `locked && …` read. */
  locked: (feature: GatedFeature) => boolean;
};

/**
 * Reads the signed-in tenant's plan. Staff/admins are never gated — they run Cleard's own
 * permits from the same portal and are the ones granting access in the first place.
 */
export function usePlanAccess(): PlanAccess {
  const session = useSession();
  const [plan, setPlan] = useState<PlanTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.loading) return;
    const tenantId = session.effectiveTenantId;
    if (session.isAdmin || !tenantId) {
      setPlan("full");
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      // `tenants.plan` is newer than the generated Supabase types.
      const { data, error } = await supabase
        .from("tenants" as never)
        .select("plan")
        .eq("id", tenantId)
        .maybeSingle<{ plan?: unknown }>();
      if (cancelled) return;
      setPlan(error || !data ? "full" : normalizePlan(data.plan));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.loading, session.isAdmin, session.effectiveTenantId]);

  return {
    loading,
    plan,
    isTrial: !loading && plan === "trial",
    allows: (feature) => planIncludes(plan, feature),
    locked: (feature) => !loading && !planIncludes(plan, feature),
  };
}
