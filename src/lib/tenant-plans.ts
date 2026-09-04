// How the admin Plans tab turns tenant / member / profile rows into the table
// that staff use to switch a company between trial and full. Isolated from
// tenants.functions.ts so the mapping can load under tsx without the service-
// role client.
//
// Fail-open: only the exact token `trial` is trial. Any other plan value
// (including null, before the column exists) reads as full so a paying
// contractor is never shown as locked because of a missing column.

export type TenantPlanRow = {
  id: string;
  name: string;
  plan: "trial" | "full";
  status: string;
  created_at: string;
  member_count: number;
  owner_email: string | null;
};

export type TenantPlanSource = {
  id: string;
  name?: string | null;
  plan?: unknown;
  status?: string | null;
  created_at: string;
};

export type TenantMemberSource = {
  user_id: string;
  tenant_id: string;
  role: string;
};

export type ProfileEmailSource = {
  id: string;
  email?: string | null;
};

export function listedTenantPlan(raw: unknown): "trial" | "full" {
  return raw === "trial" ? "trial" : "full";
}

export function assembleTenantPlanRows(
  tenants: TenantPlanSource[],
  members: TenantMemberSource[],
  profiles: ProfileEmailSource[],
): TenantPlanRow[] {
  const emailById = new Map<string, string | null>(
    profiles.map((p) => [p.id, (p.email ?? null) as string | null]),
  );
  const byTenant = new Map<string, { count: number; owner: string | null }>();
  for (const m of members) {
    const entry = byTenant.get(m.tenant_id) ?? { count: 0, owner: null };
    entry.count += 1;
    if (m.role === "gc_owner" && !entry.owner) entry.owner = emailById.get(m.user_id) ?? null;
    byTenant.set(m.tenant_id, entry);
  }

  return tenants.map((t) => {
    const entry = byTenant.get(t.id);
    return {
      id: t.id,
      name: (t.name ?? "—") as string,
      plan: listedTenantPlan(t.plan),
      status: (t.status ?? "—") as string,
      created_at: t.created_at,
      member_count: entry?.count ?? 0,
      owner_email: entry?.owner ?? null,
    };
  });
}
