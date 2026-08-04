// SignWell webhook receiver.
//
// Every request is HMAC-verified before anything is read out of it: the hash is
// HMAC-SHA256(webhook_id, `${event.type}@${event.time}`) and the key is the id of the
// webhook registered via signwell-register-webhook (stored in signwell_webhooks; also
// accepted from SIGNWELL_WEBHOOK_ID). An unverified payload is answered 401 and never
// touches the ledger.
//
// Only document_completed promotes a ledger row to status_source='provider_confirmed' —
// document_signed fires once per signer and does not mean the document is done, so it is
// recorded as progress only.
//
// Events are logged unprocessed and only marked processed_at once the ledger write for that
// event succeeded, so a retry after a failed write (or before signwell-send has inserted the
// ledger row) is replayed instead of being swallowed as a duplicate.
//
// This function must be deployed with JWT verification disabled (SignWell cannot send a
// Supabase JWT); the HMAC check is the authentication.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.3";
import { isCompletionEvent, verifyEvent, type SignWellEvent } from "../_shared/signwell.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ENV_WEBHOOK_ID = Deno.env.get("SIGNWELL_WEBHOOK_ID") ?? "";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Payload = {
  event?: SignWellEvent;
  data?: {
    object?: {
      id?: string;
      status?: string;
      name?: string;
      recipients?: Array<{ id?: string; email?: string; name?: string; status?: string }>;
    };
    account_id?: string;
  };
};

/** sent → viewed → signed, mapped from SignWell's per-signer events. */
const PROGRESS_STATUS: Record<string, "viewed" | "sent" | "declined"> = {
  document_viewed: "viewed",
  document_sent: "sent",
  document_declined: "declined",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const event = payload.event;

  // --- authenticate before doing anything with the body ---------------------
  const { data: hooks } = await admin.from("signwell_webhooks").select("id").eq("active", true);
  const webhookIds = [
    ...((hooks ?? []) as Array<{ id: string }>).map((h) => h.id),
    ENV_WEBHOOK_ID,
  ].filter(Boolean);

  if (webhookIds.length === 0) {
    console.error("signwell-webhook: no registered webhook id — cannot verify, rejecting");
    return json({ error: "webhook not registered" }, 401);
  }
  if (!(await verifyEvent(event, webhookIds))) {
    console.error("signwell-webhook: HMAC verification failed", {
      type: event?.type,
      time: event?.time,
    });
    return json({ error: "invalid event hash" }, 401);
  }

  const verified = event as SignWellEvent;
  const object = payload.data?.object ?? {};
  const documentId = object.id ?? null;

  // The event is recorded unprocessed first and only marked processed once the ledger work
  // below succeeds, so a provider retry after a failed ledger write is replayed instead of
  // being dismissed as a duplicate. Uniqueness is per (hash, document).
  const { data: inserted, error: logErr } = await admin
    .from("signwell_events")
    .insert({
      event_type: verified.type,
      event_time: typeof verified.time === "string" ? Number(verified.time) : verified.time,
      event_hash: verified.hash,
      signwell_document_id: documentId,
      payload,
    })
    .select("id")
    .maybeSingle();

  let eventRowId = (inserted as { id: string } | null)?.id ?? null;

  if (logErr && /duplicate key/i.test(logErr.message)) {
    const lookup = admin
      .from("signwell_events")
      .select("id, processed_at")
      .eq("event_hash", verified.hash);
    const { data: existing } = await (
      documentId
        ? lookup.eq("signwell_document_id", documentId)
        : lookup.is("signwell_document_id", null)
    ).maybeSingle();
    const prior = existing as { id: string; processed_at: string | null } | null;
    // Already fully applied — replaying is a no-op.
    if (prior?.processed_at) {
      return json({ ok: true, duplicate: true, event: verified.type });
    }
    eventRowId = prior?.id ?? null;
  } else if (logErr) {
    console.error("signwell-webhook: event log insert failed", logErr.message);
  }

  const markProcessed = async () => {
    if (!eventRowId) return;
    await admin
      .from("signwell_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", eventRowId);
  };

  await admin
    .from("signwell_webhooks")
    .update({ last_event_at: new Date().toISOString(), last_event_type: verified.type })
    .in("id", webhookIds);

  if (!documentId) {
    await markProcessed();
    return json({ ok: true, event: verified.type, note: "no document id in payload" });
  }

  const { data: rows } = await admin
    .from("signature_requests")
    .select("id, permit_id, tenant_id, document_name, recipient_email, status, status_source")
    .eq("signwell_document_id", documentId);
  const ledger = (rows ?? []) as Array<{
    id: string;
    permit_id: string;
    tenant_id: string | null;
    document_name: string;
    recipient_email: string;
    status: string;
    status_source: string;
  }>;

  if (ledger.length === 0) {
    // signwell-send may not have written the ledger row yet. The event stays unprocessed and
    // a non-2xx answer asks SignWell to retry, so completion is not lost to a race.
    console.warn(`signwell-webhook: no signature_requests row for document ${documentId}`);
    return json(
      { error: "no ledger row for document yet — retry", event: verified.type, matched: 0 },
      409,
    );
  }

  const now = new Date().toISOString();

  if (isCompletionEvent(verified.type)) {
    const signerNames = (object.recipients ?? [])
      .map((r) => r.name ?? r.email)
      .filter(Boolean)
      .join(", ");
    const { error: upErr } = await admin
      .from("signature_requests")
      .update({
        status: "signed",
        status_source: "provider_confirmed",
        signed_at: now,
        completed_at: now,
        signed_by_name: signerNames || null,
        last_event_type: verified.type,
        last_event_at: now,
      })
      .eq("signwell_document_id", documentId);
    if (upErr) throw upErr;

    for (const row of ledger) {
      await admin.from("activity_events").insert({
        tenant_id: row.tenant_id,
        permit_id: row.permit_id,
        event_type: "signature_completed",
        actor_label: "SignWell",
        summary: `SignWell confirmed "${row.document_name}" completed by ${signerNames || row.recipient_email}`,
        details: {
          signwell_document_id: documentId,
          event: verified.type,
          event_time: verified.time,
          document_status: object.status ?? null,
          status_source: "provider_confirmed",
        },
      });
    }

    await markProcessed();
    return json({
      ok: true,
      event: verified.type,
      matched: ledger.length,
      provider_confirmed: true,
    });
  }

  // Progress-only events. document_signed is explicitly one of these: it fires per signer,
  // so it never sets 'signed'/'provider_confirmed'.
  // The event itself is always recorded; only the status is conditional, so a completed row
  // keeps its provider-confirmed status while still showing the latest event.
  const { error: eErr } = await admin
    .from("signature_requests")
    .update({ last_event_type: verified.type, last_event_at: now })
    .eq("signwell_document_id", documentId);
  if (eErr) throw eErr;

  const progress = PROGRESS_STATUS[verified.type];
  if (progress) {
    const update: Record<string, unknown> = { status: progress };
    if (verified.type === "document_declined") update.declined_at = now;
    const { error: pErr } = await admin
      .from("signature_requests")
      .update(update)
      .eq("signwell_document_id", documentId)
      .neq("status_source", "provider_confirmed")
      .neq("status", "signed");
    if (pErr) throw pErr;
  }

  for (const row of ledger) {
    await admin.from("activity_events").insert({
      tenant_id: row.tenant_id,
      permit_id: row.permit_id,
      event_type: "signature_event",
      actor_label: "SignWell",
      summary: `SignWell ${verified.type.replace("document_", "")} — "${row.document_name}" (${row.recipient_email})`,
      details: {
        signwell_document_id: documentId,
        event: verified.type,
        event_time: verified.time,
        related_signer: verified.related_signer ?? null,
        note:
          verified.type === "document_signed"
            ? "per-signer event; document is not complete until document_completed"
            : undefined,
      },
    });
  }

  await markProcessed();
  return json({
    ok: true,
    event: verified.type,
    matched: ledger.length,
    provider_confirmed: false,
  });
});
