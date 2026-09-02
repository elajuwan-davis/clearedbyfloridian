// Which features a tenant's plan includes.
//
// A self-serve /join signup lands on the 'trial' tier: it can run its own permits end to
// end, and everything Cleard does *for* a contractor — subcontractor onboarding, licence
// verification, insurance chasing, lien rights — is locked behind a request for access.
// Invited/managed tenants are 'full' and see no locks at all (see
// supabase/migrations/20260829120000_plan_gating.sql, which moves every pre-existing tenant
// onto 'full').
//
// Fail-open is deliberate: if the plan can't be read — column not migrated yet, RLS hiccup,
// offline — the answer is "unlocked". A paying contractor must never be locked out of a
// feature because a lookup failed; the worst case of the other direction is a trial account
// briefly seeing something it shouldn't, which the data itself still gates.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

export type PlanTier = "trial" | "full";

export type GatedFeature = "sub_invites" | "license_verification" | "coi_requests" | "lien_rights";

/** Everything the trial tier does not include. */
const TRIAL_LOCKED: GatedFeature[] = [
  "sub_invites",
  "license_verification",
  "coi_requests",
  "lien_rights",
];

export type FeatureCopy = {
  /** What the feature is, in the GC's terms — shown before the lock, not instead of it. */
  title: string;
  does: string;
  /** Platform area recorded on the access request so staff can route it. */
  area: string;
};

export const FEATURE_COPY: Record<GatedFeature, FeatureCopy> = {
  sub_invites: {
    title: "Subcontractor invites",
    does: "Generates an intake link you send to a subcontractor — they fill in their own company details, licence and insurance, and land in your roster already registered.",
    area: "Subcontractor Management",
  },
  license_verification: {
    title: "Licence verification",
    does: "Checks a subcontractor's licence against DBPR and keeps its status and expiry on the row, so an expired qualifier surfaces before a municipality catches it.",
    area: "Compliance & Documents",
  },
  coi_requests: {
    title: "COI & insurance requests",
    does: "Requests certificates of insurance from your subs and their carriers, tracks who has replied, and flags coverage that lapses or falls short of the job.",
    area: "Compliance & Documents",
  },
  lien_rights: {
    title: "Lien rights",
    does: "Tracks the statutory clock on every job — Notice to Owner, Notice of Commencement, 90-day lien deadlines — prepares the documents and e-records them.",
    area: "Compliance & Documents",
  },
};

/**
 * The only portal paths a trial plan can open: its own permits, its own portal
 * credentials, messages to Cleard, and its account. Prefix match, so
 * /portal/permits/new and /portal/permits/<id> come along with My Permits.
 *
 * Billing is included because trial checkout (startTrialSubscriptionCheckoutFn)
 * returns to /portal/billing and the dashboard banner tells the contractor to
 * manage/cancel there. Locking it left a paid-up trial account on a dead page.
 *
 * Everything else in the portal is gated — the nav hides it
 * (trialNavSections in src/lib/portal-nav.ts) and PortalShell shows a lock if
 * the path is typed in anyway.
 */
export const TRIAL_PATHS: string[] = [
  "/dashboard",
  "/portal", // the portal index redirects to the dashboard
  "/portal/permits",
  "/portal/billing",
  "/building-dept-logins",
  "/messages",
  "/profile",
  "/portal/company",
  // Onboarding/authorization a self-serve account still has to be able to finish.
  "/onboarding",
  "/forms/permit-agent-authorization",
  "/sign",
];

export function trialPathAllowed(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return TRIAL_PATHS.some((p) => {
    // /portal is only the index redirect. Treating it as a prefix would unlock
    // every paid /portal/* route for a trial tenant.
    if (p === "/portal") return path === p;
    return path === p || path.startsWith(p + "/");
  });
}

export function planIncludes(plan: PlanTier | null, feature: GatedFeature): boolean {
  if (plan !== "trial") return true;
  return !TRIAL_LOCKED.includes(feature);
}

function normalizePlan(raw: unknown): PlanTier {
  return String(raw ?? "").toLowerCase() === "trial" ? "trial" : "full";
}

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
