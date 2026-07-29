// Admin-only invite pipeline: joins access_requests → tenant_invites →
// tenant_members → permits into one row per prospect.

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

export type InvitePipelineRow = {
  request_id: string;
  name: string;
  email: string;
  company: string | null;
  request_status: string;
  requested_at: string;
  tenant_id: string | null;
  tenant_name: string | null;
  invited_by: string | null;
  invited_at: string | null;
  invite_status: "not_invited" | "pending" | "accepted" | "revoked";
  signup_status: "no_account" | "account_created";
  signed_up_at: string | null;
  permit_count: number;
  permits: Array<{ id: string; label: string; created_at: string }>;
  last_activity_at: string;
};

export const listInvitePipelineFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InvitePipelineRow[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;

    const [reqRes, tenantRes, inviteRes, memberRes, permitRes, usersRes] = await Promise.all([
      db.from("access_requests").select("id, name, email, company, status, created_at, approved_tenant_id"),
      db.from("tenants").select("id, name"),
      db.from("tenant_invites").select("id, tenant_id, created_by, created_at, uses, revoked_at"),
      db.from("tenant_members").select("user_id, tenant_id, created_at"),
      db.from("permits").select("id, project_name, permit_number, created_by, tenant_id, created_at"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const tenants = new Map<string, string>(
      (tenantRes.data ?? []).map((t: any) => [t.id, t.name as string]),
    );
    const users = usersRes?.data?.users ?? [];
    const userById = new Map<string, any>(users.map((u: any) => [u.id, u]));
    const userByEmail = new Map<string, any>(
      users.map((u: any) => [String(u.email ?? "").toLowerCase(), u]),
    );

    const invitesByTenant = new Map<string, any[]>();
    for (const inv of inviteRes.data ?? []) {
      const list = invitesByTenant.get(inv.tenant_id) ?? [];
      list.push(inv);
      invitesByTenant.set(inv.tenant_id, list);
    }

    const memberByUser = new Map<string, any>(
      (memberRes.data ?? []).map((m: any) => [m.user_id, m]),
    );

    const permitsByUser = new Map<string, any[]>();
    const permitsByTenant = new Map<string, any[]>();
    for (const p of permitRes.data ?? []) {
      if (p.created_by) {
        const l = permitsByUser.get(p.created_by) ?? [];
        l.push(p);
        permitsByUser.set(p.created_by, l);
      }
      if (p.tenant_id) {
        const l = permitsByTenant.get(p.tenant_id) ?? [];
        l.push(p);
        permitsByTenant.set(p.tenant_id, l);
      }
    }

    const userLabel = (id: string | null | undefined) => {
      if (!id) return null;
      const u = userById.get(id);
      if (!u) return null;
      return (u.user_metadata?.full_name as string) || (u.email as string) || null;
    };

    const rows: InvitePipelineRow[] = (reqRes.data ?? []).map((r: any) => {
      const email = String(r.email ?? "").toLowerCase();
      const user = userByEmail.get(email) ?? null;
      const member = user ? memberByUser.get(user.id) ?? null : null;
      const tenantId: string | null = r.approved_tenant_id ?? member?.tenant_id ?? null;

      const invites = tenantId ? (invitesByTenant.get(tenantId) ?? []).slice() : [];
      invites.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const invite = invites[0] ?? null;

      let invite_status: InvitePipelineRow["invite_status"] = "not_invited";
      if (invite) {
        if (invite.revoked_at) invite_status = "revoked";
        else if (member || (invite.uses ?? 0) > 0) invite_status = "accepted";
        else invite_status = "pending";
      }

      const permitList = user
        ? (permitsByUser.get(user.id) ?? [])
        : tenantId
          ? (permitsByTenant.get(tenantId) ?? [])
          : [];
      const signedUpAt = member?.created_at ?? user?.created_at ?? null;
      const sincePermits = permitList
        .filter((p: any) => !signedUpAt || String(p.created_at) >= String(signedUpAt))
        .sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));

      const activity = [
        r.created_at,
        invite?.created_at ?? null,
        signedUpAt,
        sincePermits[0]?.created_at ?? null,
      ].filter(Boolean) as string[];
      activity.sort();

      return {
        request_id: r.id,
        name: r.name ?? "—",
        email: r.email,
        company: r.company ?? null,
        request_status: r.status ?? "pending",
        requested_at: r.created_at,
        tenant_id: tenantId,
        tenant_name: tenantId ? (tenants.get(tenantId) ?? null) : null,
        invited_by: userLabel(invite?.created_by),
        invited_at: invite?.created_at ?? null,
        invite_status,
        signup_status: member || user ? "account_created" : "no_account",
        signed_up_at: signedUpAt,
        permit_count: sincePermits.length,
        permits: sincePermits.slice(0, 25).map((p: any) => ({
          id: p.id,
          label: p.permit_number || p.project_name || "Untitled permit",
          created_at: p.created_at,
        })),
        last_activity_at: activity[activity.length - 1] ?? r.created_at,
      };
    });

    rows.sort((a, b) => String(b.last_activity_at).localeCompare(String(a.last_activity_at)));
    return rows;
  });
