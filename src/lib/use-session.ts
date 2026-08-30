// Client-side session hook: exposes role/tenant + admin impersonation state.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { canHoldAdminRole } from "@/lib/signup-role";

export type AppRole = "admin" | "gc_owner" | "gc_member" | "subcontractor";

const IMPERSONATE_KEY = "cleard_impersonate_tenant";

export type SessionInfo = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: AppRole | null;
  tenantId: string | null;
  tenantName: string | null;
  isAdmin: boolean;
  /** When admin is impersonating a tenant, the tenant id + name; otherwise null. */
  impersonatingTenantId: string | null;
  impersonatingTenantName: string | null;
  /** Effective tenant id for data queries (impersonated when admin has picked one). */
  effectiveTenantId: string | null;
};

const initial: SessionInfo = {
  loading: true,
  userId: null,
  email: null,
  role: null,
  tenantId: null,
  tenantName: null,
  isAdmin: false,
  impersonatingTenantId: null,
  impersonatingTenantName: null,
  effectiveTenantId: null,
};

function readImpersonation(): { id: string; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IMPERSONATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.name === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setImpersonatedTenant(t: { id: string; name: string } | null) {
  if (typeof window === "undefined") return;
  try {
    if (t) localStorage.setItem(IMPERSONATE_KEY, JSON.stringify(t));
    else localStorage.removeItem(IMPERSONATE_KEY);
    window.dispatchEvent(new Event("cleard:impersonation-changed"));
  } catch { /* ignore */ }
}

export function getImpersonatedTenantId(): string | null {
  return readImpersonation()?.id ?? null;
}

async function loadSession(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return { ...initial, loading: false };

  const userId = session.user.id;
  const email = session.user.email ?? null;

  // Cache the real signed-in email so the internal-team UI gates work for every
  // sign-in path (Google included), not just the password form.
  if (email) {
    try {
      localStorage.setItem("cleared_demo_user", email.toLowerCase());
      localStorage.setItem("cleared_demo_user_email", email.toLowerCase());
    } catch {
      /* ignore */
    }
  }

  const { data: roles } = await (supabase.from("user_roles" as any) as any)
    .select("role")
    .eq("user_id", userId);
  const roleSet = new Set((roles ?? []).map((r: any) => r.role as AppRole));
  const role: AppRole | null = roleSet.has("admin")
    ? "admin"
    : roleSet.has("gc_owner")
      ? "gc_owner"
      : roleSet.has("gc_member")
        ? "gc_member"
        : roleSet.has("subcontractor")
          ? "subcontractor"
          : null;

  const { data: member } = await (supabase.from("tenant_members" as any) as any)
    .select("tenant_id, tenants:tenant_id ( id, name )")
    .eq("user_id", userId)
    .maybeSingle();

  const tenantId = (member as any)?.tenant_id ?? null;
  const tenantName = (member as any)?.tenants?.name ?? null;
  // user_roles.admin is not enough: public signUp used to let anyone mint that
  // row. Staff-domain mailbox is the second factor until/after the trigger fix.
  const isAdmin = role === "admin" && canHoldAdminRole(email);
  const impersonation = isAdmin ? readImpersonation() : null;

  return {
    loading: false,
    userId,
    email,
    role,
    tenantId,
    tenantName,
    isAdmin,
    impersonatingTenantId: impersonation?.id ?? null,
    impersonatingTenantName: impersonation?.name ?? null,
    effectiveTenantId: impersonation?.id ?? tenantId,
  };
}

export function useSession(): SessionInfo {
  const [state, setState] = useState<SessionInfo>(initial);

  const reload = useCallback(() => {
    loadSession().then(setState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((s) => { if (!cancelled) setState(s); });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadSession().then((s) => { if (!cancelled) setState(s); });
      }
    });
    const onImp = () => { loadSession().then((s) => { if (!cancelled) setState(s); }); };
    window.addEventListener("cleard:impersonation-changed", onImp);
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      window.removeEventListener("cleard:impersonation-changed", onImp);
    };
  }, [reload]);

  return state;
}

// Route target by role.
export function homePathForRole(role: AppRole | null): string {
  if (role === "admin") return "/dashboard";
  if (role === "subcontractor") return "/sub-portal";
  if (role === "gc_owner" || role === "gc_member") return "/dashboard";
  return "/dashboard";
}
