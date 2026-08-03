// GC email intake — SendGrid/Postmark Inbound Parse → real permit record.
// Matches the recipient alias to a tenant, inserts into `permits`, and saves
// attachments to the `intake-docs` bucket. Unmatched aliases are logged.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SENDGRID_WEBHOOK_SECRET = Deno.env.get("SENDGRID_WEBHOOK_SECRET");

function badRequest(message: string) {
  return new Response(message, { status: 400 });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (SENDGRID_WEBHOOK_SECRET) {
    const secret = req.headers.get("x-cleard-webhook-secret") ?? "";
    if (secret !== SENDGRID_WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return badRequest("Supabase not configured");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Invalid form data");
  }

  const to = String(form.get("to") ?? "").trim().toLowerCase();
  const from = String(form.get("from") ?? "").trim();
  const subject = String(form.get("subject") ?? "").trim();
  const text = String(form.get("text") ?? "").trim() || String(form.get("body") ?? "").trim();

  const alias = to.split("@")[0];
  if (!alias) {
    return badRequest("Missing recipient alias");
  }

  const { data: matches, error: lookupError } = await supabase
    .from("gc_email_addresses")
    .select("id, tenant_id")
    .eq("alias", alias)
    .limit(1);

  if (lookupError || !matches || matches.length === 0) {
    await supabase.from("inbound_email_errors").insert({
      alias,
      to_email: to,
      from_email: from,
      subject,
      reason: "alias_not_found",
    });
    return badRequest("Unmatched alias");
  }

  const { tenant_id: tenantId } = matches[0];

  const { data: permit, error: permitError } = await supabase
    .from("permits")
    .insert({
      tenant_id: tenantId,
      project_name: subject,
      poc_email: from,
      status: "submitted",
      // The permit requires a job_address, but the email itself doesn't include
      // a property address. GCs fill this in during follow-up.
      job_address: "TBD",
      description: text.slice(0, 500) || null,
      intake_payload: { from, to, subject, body: text },
    })
    .select("id")
    .single();

  if (permitError || !permit) {
    console.error(permitError);
    return new Response("Failed to create permit", { status: 500 });
  }

  const bucket = supabase.storage.from("intake-docs");
  let attachmentCount = 0;

  for (const [key, value] of form.entries()) {
    if (!key.startsWith("attachment")) continue;
    const file = value as File;
    if (!(file instanceof File) || file.size === 0) continue;

    const name = file.name || `attachment-${++attachmentCount}`;
    const path = `intake-docs/${tenantId}/${permit.id}/${name}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await bucket.upload(path, bytes, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

    if (uploadError) {
      console.error(uploadError);
    }
  }

  return new Response(
    JSON.stringify({ permitId: permit.id, tenantId, status: "created" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
