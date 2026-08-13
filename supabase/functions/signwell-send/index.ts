// Creates a real SignWell document for embedded signing and records it in the
// signature_requests ledger.
//
// The browser never sees SIGNWELL_API_KEY: src/lib/signature-requests.ts invokes this
// function, which resolves the document to sign (a stored permit file or the Agent 2
// bundle), hands SignWell a short-lived Storage signed URL for it, and stores the returned
// document id + embedded_signing_url on the ledger row so signing happens inside our
// portal rather than on signwell.com.
//
// The row is created with status 'sent' / status_source 'staff_attested'. Only the
// signwell-webhook function promotes it to 'provider_confirmed', and only on
// document_completed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { createEmbeddedDocument, embeddedUrlFor, SignWellError } from "../_shared/signwell.ts";
import { errorMessage } from "../_shared/errors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SIGNWELL_API_KEY = Deno.env.get("SIGNWELL_API_KEY") ?? "";
const SIGNWELL_TEST_MODE = (Deno.env.get("SIGNWELL_TEST_MODE") ?? "false").toLowerCase() === "true";
const BUCKET = "permit-files";
const SIGNED_URL_TTL = 60 * 60; // SignWell fetches the file during document creation.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

type Body = {
  permit_id?: string;
  document_key?: string | null;
  document_name?: string;
  /** Storage path to sign; defaults to the permit's Agent 2 bundle. */
  document_path?: string | null;
  recipient_name?: string;
  recipient_email?: string;
  recipient_role?: string;
  subject?: string;
  message?: string;
  /** External signers (subs) get an emailed link as well as the embedded session. */
  send_email?: boolean;
};

type PermitDoc = {
  key: string;
  label: string;
  status: string;
  path?: string | null;
  filename?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!SIGNWELL_API_KEY) return json({ error: "SIGNWELL_API_KEY is not configured" }, 503);

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const permitId = body.permit_id;
    const email = (body.recipient_email ?? "").trim();
    if (!permitId || !email)
      return json({ error: "permit_id and recipient_email are required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: permit, error: pErr } = await admin
      .from("permits")
      .select("id, tenant_id, project_name, job_address, documents, document_bundle_path")
      .eq("id", permitId)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!permit) return json({ error: "permit not found" }, 404);

    // Resolve what gets signed.
    const docs = (permit.documents ?? []) as PermitDoc[];
    const fromKey = body.document_key ? docs.find((d) => d.key === body.document_key) : undefined;
    const path = body.document_path ?? fromKey?.path ?? permit.document_bundle_path;
    if (!path) {
      return json(
        {
          error:
            "Nothing to sign: no document_path given and the permit has no generated bundle yet.",
        },
        409,
      );
    }
    const documentName =
      body.document_name ??
      fromKey?.label ??
      `${permit.project_name ?? "Permit"} — submittal package`;

    const { data: signed, error: sErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (sErr || !signed?.signedUrl) {
      return json({ error: `could not sign ${path}: ${sErr?.message ?? "no url"}` }, 500);
    }
    const fileUrl = signed.signedUrl.startsWith("http")
      ? signed.signedUrl
      : `${SUPABASE_URL}/storage/v1${signed.signedUrl}`;

    const recipientId = "1";
    let doc;
    try {
      doc = await createEmbeddedDocument(SIGNWELL_API_KEY, {
        name: documentName,
        subject: body.subject ?? `Signature required — ${documentName}`,
        message:
          body.message ??
          "Please review and sign this permit document. Signing happens inside the Cleard portal.",
        files: [{ name: path.split("/").pop() ?? "document.pdf", file_url: fileUrl }],
        recipients: [
          {
            id: recipientId,
            name: body.recipient_name ?? email,
            email,
            // Portal users are handed the iframe; signers outside the portal (subs) would
            // otherwise have no way to reach the document, so they are emailed a link.
            send_email: body.send_email === true,
          },
        ],
        metadata: { permit_id: permitId, document_key: body.document_key ?? "" },
        testMode: SIGNWELL_TEST_MODE,
      });
    } catch (err) {
      if (err instanceof SignWellError) {
        console.error("signwell create document failed", err.status, err.body, err.attempts);
        return json(
          { error: err.message, signwell_status: err.status, attempts: err.attempts },
          err.status === 429 || err.status >= 500 ? 502 : 400,
        );
      }
      throw err;
    }

    const embeddedUrl =
      embeddedUrlFor(doc, email) ?? doc.recipients?.[0]?.embedded_signing_url ?? null;

    const { data: row, error: iErr } = await admin
      .from("signature_requests")
      .insert({
        tenant_id: permit.tenant_id ?? null,
        permit_id: permitId,
        document_key: body.document_key ?? fromKey?.key ?? null,
        document_name: documentName,
        recipient_email: email,
        recipient_role: body.recipient_role ?? "General Contractor",
        status: "sent",
        // Not provider truth yet — only document_completed makes it that.
        status_source: "staff_attested",
        provider: "SignWell",
        provider_envelope_id: doc.id,
        signwell_document_id: doc.id,
        signwell_recipient_id: doc.recipients?.[0]?.id ?? recipientId,
        embedded_signing_url: embeddedUrl,
        test_mode: doc.test_mode ?? SIGNWELL_TEST_MODE,
        sent_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (iErr) throw iErr;

    await admin.from("activity_events").insert({
      tenant_id: permit.tenant_id ?? null,
      permit_id: permitId,
      event_type: "signature_requested",
      actor_label: "Cleard automation",
      summary: `Sent "${documentName}" to ${email} for signature via SignWell`,
      details: {
        signwell_document_id: doc.id,
        test_mode: doc.test_mode ?? SIGNWELL_TEST_MODE,
        embedded: Boolean(embeddedUrl),
      },
    });

    return json({
      signature_request: row,
      signwell_document_id: doc.id,
      embedded_signing_url: embeddedUrl,
      test_mode: doc.test_mode ?? SIGNWELL_TEST_MODE,
    });
  } catch (err) {
    console.error("signwell-send failed", err);
    return json({ error: errorMessage(err) }, 500);
  }
});
