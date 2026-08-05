// One-time (idempotent) registration of the SignWell webhook.
//
// SignWell's webhook id is the HMAC key used to verify every event, so registration has to
// happen through the API and the returned id has to be stored — signwell_webhooks is
// service-role only for that reason. Re-running this is safe: if a webhook already points
// at our callback URL it is recorded rather than duplicated.
//
// Only staff (or the service role) may call it, and the callback always points at this
// project's own signwell-webhook: pointing SignWell at an attacker's URL would hand them
// every signature event, so the URL is not caller-controlled.
//
// Deploy, then call once:
//   curl -X POST "$FUNCTIONS_URL/signwell-register-webhook" -H "Authorization: Bearer $SERVICE_KEY"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { createWebhook, listWebhooks, SignWellError } from "../_shared/signwell.ts";
import { CallerAuthError, requireStaffCaller } from "../_shared/caller-auth.ts";
import { errorMessage } from "../_shared/errors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SIGNWELL_API_KEY = Deno.env.get("SIGNWELL_API_KEY") ?? "";
const FUNCTIONS_BASE = (
  Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? `${SUPABASE_URL}/functions/v1`
).replace(/\/$/, "");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  if (!SIGNWELL_API_KEY) return json({ error: "SIGNWELL_API_KEY is not configured" }, 503);

  try {
    await requireStaffCaller(req, { supabaseUrl: SUPABASE_URL, serviceKey: SERVICE_KEY });

    // Fixed by this project's own functions base — never taken from the request.
    const callbackUrl = `${FUNCTIONS_BASE}/signwell-webhook`;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    let hook: { id: string; callback_url: string } | undefined;

    const existing = await listWebhooks(SIGNWELL_API_KEY).catch((err) => {
      if (err instanceof SignWellError) return [];
      throw err;
    });
    hook = existing.find((h) => h.callback_url === callbackUrl);

    if (!hook) hook = await createWebhook(SIGNWELL_API_KEY, callbackUrl);

    const { error } = await admin
      .from("signwell_webhooks")
      .upsert({ id: hook.id, callback_url: hook.callback_url, active: true }, { onConflict: "id" });
    if (error) throw error;

    // The id is a verification secret — report that it is stored, not what it is.
    return json({
      registered: true,
      callback_url: hook.callback_url,
      reused_existing: Boolean(existing.find((h) => h.id === hook!.id)),
    });
  } catch (err) {
    if (err instanceof CallerAuthError) return json({ error: err.message }, err.status);
    if (err instanceof SignWellError) {
      console.error("signwell webhook registration failed", err.status, err.body);
      return json({ error: err.message, signwell_status: err.status }, 502);
    }
    console.error("signwell-register-webhook failed", err);
    return json({ error: errorMessage(err) }, 500);
  }
});
