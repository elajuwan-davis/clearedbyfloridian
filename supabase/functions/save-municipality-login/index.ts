// Save an encrypted municipality portal login.
// The password is encrypted by a server-side pgcrypto function using the key
// stored in Supabase Vault; the plain text is never persisted.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Supabase not configured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return new Response("Missing authorization token", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const municipality = String(body.municipality ?? "").trim();
  const portalUrl = body.portal_url ? String(body.portal_url) : null;
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const notes = body.notes ? String(body.notes) : null;

  if (!municipality || !username || !password) {
    return new Response("Missing municipality, username, or password", { status: 400 });
  }

  const { data, error } = await supabase.rpc("save_municipality_login", {
    p_tenant_id: user.id,
    p_municipality: municipality,
    p_portal_url: portalUrl,
    p_username: username,
    p_password: password,
    p_notes: notes,
  });

  if (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ id: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
