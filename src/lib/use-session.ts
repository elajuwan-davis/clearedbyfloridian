// Client-side session hook: exposes { user, role, tenant, isAdmin, loading }
// Role and tenant come from Supabase — user_roles + tenant_members + tenants.

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gc_owner" | "gc_member" | "subcontractor";

export type SessionInfo = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  role: AppRole | null;
  tenantId: string | null;
  tenantName: string | null;
  isAdmin: boolean;
};

const initial: SessionInfo = {
  loading: true,
  userId: null,
  email: null,
  role: null,
  tenantId: null,
  tenantName: null,
  isAdmin: false,
};

async function loadSession(): Promise<SessionInfo> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return { ...initial, loading: false };

  const userId = session.user.id;
  const email = session.user.email ?? null;

  // Load role (prefer highest privilege if multiple)
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

  // Load tenant membership
  const { data: member } = await (supabase.from("tenant_members" as any) as any)
    .select("tenant_id, tenants:tenant_id ( id, name )")
    .eq("user_id", userId)
    .maybeSingle();

  const tenantId = (member as any)?.tenant_id ?? null;
  const tenantName = (member as any)?.tenants?.name ?? null;

  return {
    loading: false,
    userId,
    email,
    role,
    tenantId,
    tenantName,
    isAdmin: role === "admin",
  };
}

export function useSession(): SessionInfo {
  const [state, setState] = useState<SessionInfo>(initial);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((s) => {
      if (!cancelled) setState(s);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadSession().then((s) => {
          if (!cancelled) setState(s);
        });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

// Route target by role.
export function homePathForRole(role: AppRole | null): string {
  if (role === "admin") return "/admin";
  if (role === "subcontractor") return "/sub-portal";
  if (role === "gc_owner" || role === "gc_member") return "/portal";
  return "/portal";
}
