// Bearer-token identity resolution for the REST routes under src/routes/api.
//
// The portal's own reads go through RLS with the user's Supabase client; these
// routes instead run as service role (they cross tenant boundaries for admins
// and must strip identifying columns for engineers), so every handler resolves
// the caller here first and scopes the query itself.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Service-role client without generated table types — the tables added for
 *  lien releases and the engineer marketplace are not in Database yet. */
export function adminDb(): SupabaseClient {
  return supabaseAdmin as unknown as SupabaseClient;
}

export type Caller = {
  userId: string;
  email: string | null;
  tenantId: string | null;
  isAdmin: boolean;
};

export type EngineerCaller = Caller & {
  engineerId: string;
  engineerName: string;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("[api]", err);
  return Response.json({ error: "Internal error" }, { status: 500 });
}

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new ApiError(401, "Unauthorized");
  return token;
}

export async function requireCaller(request: Request): Promise<Caller> {
  const token = bearerToken(request);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new ApiError(401, "Unauthorized");
  const userId = data.user.id;

  const [{ data: member }, { data: roles }] = await Promise.all([
    supabaseAdmin.from("tenant_members").select("tenant_id").eq("user_id", userId).maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  return {
    userId,
    email: data.user.email ?? null,
    tenantId: (member?.tenant_id as string | undefined) ?? null,
    isAdmin: (roles ?? []).some((r) => r.role === "admin"),
  };
}

export async function requireTenant(request: Request): Promise<Caller & { tenantId: string }> {
  const caller = await requireCaller(request);
  if (!caller.tenantId) throw new ApiError(403, "No tenant for this account");
  return caller as Caller & { tenantId: string };
}

export async function requireAdmin(request: Request): Promise<Caller> {
  const caller = await requireCaller(request);
  if (!caller.isAdmin) throw new ApiError(403, "Admin only");
  return caller;
}

export async function requireEngineer(request: Request): Promise<EngineerCaller> {
  const caller = await requireCaller(request);
  const { data } = await adminDb()
    .from("engineer_profiles")
    .select("id, name, is_active")
    .eq("user_id", caller.userId)
    .maybeSingle<{ id: string; name: string; is_active: boolean }>();
  if (!data || !data.is_active) throw new ApiError(403, "Engineer access required");
  return { ...caller, engineerId: data.id, engineerName: data.name };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuid(value: string | undefined, label = "id"): string {
  if (!value || !UUID_RE.test(value)) throw new ApiError(400, `Invalid ${label}`);
  return value;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON");
  }
}
