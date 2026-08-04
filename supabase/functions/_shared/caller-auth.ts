// Caller authorization for edge functions that act under the service role.
//
// Every function here reads and writes with a service-role client, which bypasses RLS, so
// the function itself has to decide who is allowed to ask. Two callers are legitimate:
//
//   'service' — another Cleard component presenting the service-role key (a pg_net trigger,
//               a cron dispatch, or another edge function calling inward).
//   'staff'   — a signed-in admin user, which is what the portal UI sends.
//
// A GC's own JWT is not enough for these functions: they either mutate a gate verdict or
// reach a municipality, both of which are staff actions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

export type Caller = { kind: "service"; userId: null } | { kind: "staff"; userId: string };

export class CallerAuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function bearer(req: Request): string | null {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/** Constant-time-ish comparison; the tokens are short and this avoids an early-exit compare. */
function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Resolves the caller or throws CallerAuthError. */
export async function requireStaffCaller(
  req: Request,
  env: { supabaseUrl: string; serviceKey: string },
): Promise<Caller> {
  const token = bearer(req);
  if (!token) throw new CallerAuthError("authorization required", 401);
  if (env.serviceKey && sameToken(token, env.serviceKey)) return { kind: "service", userId: null };

  const client = createClient(env.supabaseUrl, env.serviceKey, {
    auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser(token).catch(() => ({ data: { user: null } }));
  const user = data?.user ?? null;
  if (!user) throw new CallerAuthError("invalid credentials", 401);

  const { data: role } = await client
    .from("user_roles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new CallerAuthError("staff role required", 403);

  return { kind: "staff", userId: user.id };
}
