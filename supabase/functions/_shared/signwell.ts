// SignWell API client shared by the signwell-* edge functions.
//
// Verified against SignWell's own docs (developers.signwell.com):
//   base           https://www.signwell.com/api/v1
//   auth           X-Api-Key: <key>          (not Bearer, not Basic)
//   create doc     POST /documents           → { id, recipients: [{ id, embedded_signing_url }] }
//   create hook    POST /hooks               → { id, callback_url }   (id is the HMAC key)
//   event hash     HMAC-SHA256(webhook_id, `${event.type}@${event.time}`), hex
//   completion     document_completed only — document_signed is per-signer

export const SIGNWELL_BASE = Deno.env.get("SIGNWELL_BASE_URL") ?? "https://www.signwell.com/api/v1";

export class SignWellError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
    readonly attempts: number,
  ) {
    super(message);
    this.name = "SignWellError";
  }
}

export type Recipient = {
  id: string;
  name: string;
  email: string;
  embedded_signing_url?: string | null;
  signing_url?: string | null;
  status?: string | null;
};

export type SignWellDocument = {
  id: string;
  name?: string;
  status?: string;
  test_mode?: boolean;
  embedded_signing?: boolean;
  metadata?: Record<string, string>;
  recipients?: Recipient[];
};

const RETRY_STATUSES = (s: number) => s === 429 || s >= 500;
const MAX_ATTEMPTS = 5;

/** 1s, 2s, 4s, 8s — exported so the backoff schedule is testable. */
export const backoffMs = (attempt: number): number => 1000 * 2 ** (attempt - 1);

export type FetchLike = typeof fetch;

/**
 * POST/GET the SignWell API with the documented retry policy: retry 429 and 5xx with
 * exponential backoff up to 5 attempts total; never retry other 4xx — a 400/401/404 means
 * the request itself is wrong and retrying only burns rate limit.
 */
export async function signwellRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; apiKey: string },
  deps: { fetch?: FetchLike; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  const doFetch = deps.fetch ?? fetch;
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const url = `${SIGNWELL_BASE}${path}`;

  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let resp: Response;
    try {
      resp = await doFetch(url, {
        method: init.method ?? "POST",
        headers: {
          "X-Api-Key": init.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch (err) {
      // Transport failure: same class of problem as a 5xx.
      lastStatus = 0;
      lastBody = String(err);
      if (attempt === MAX_ATTEMPTS) break;
      await sleep(backoffMs(attempt));
      continue;
    }

    if (resp.ok) return (await resp.json()) as T;

    lastStatus = resp.status;
    lastBody = await resp.text().catch(() => "");

    if (!RETRY_STATUSES(resp.status)) {
      throw new SignWellError(
        `SignWell ${init.method ?? "POST"} ${path} failed with ${resp.status} (not retryable)`,
        resp.status,
        lastBody,
        attempt,
      );
    }
    if (attempt === MAX_ATTEMPTS) break;
    await sleep(backoffMs(attempt));
  }

  throw new SignWellError(
    `SignWell ${init.method ?? "POST"} ${path} failed after ${MAX_ATTEMPTS} attempts (last status ${lastStatus})`,
    lastStatus,
    lastBody,
    MAX_ATTEMPTS,
  );
}

// --- documents --------------------------------------------------------------

export type CreateDocumentInput = {
  name: string;
  subject?: string;
  message?: string;
  /** Publicly reachable URL (a Storage signed URL) or base64 file contents. */
  files: Array<{ name: string; file_url?: string; file_base64?: string }>;
  recipients: Array<{ id: string; name: string; email: string; send_email?: boolean }>;
  fields?: unknown[][];
  metadata?: Record<string, string>;
  testMode?: boolean;
};

/**
 * Creates and sends a document with embedded signing enabled, so signing happens in an
 * iframe inside our own portal instead of redirecting the signer to signwell.com.
 */
export async function createEmbeddedDocument(
  apiKey: string,
  input: CreateDocumentInput,
  deps: { fetch?: FetchLike; sleep?: (ms: number) => Promise<void> } = {},
): Promise<SignWellDocument> {
  return await signwellRequest<SignWellDocument>(
    "/documents",
    {
      apiKey,
      body: {
        test_mode: input.testMode ?? false,
        draft: false,
        embedded_signing: true,
        // Owner still gets the completed notification with embedded signing.
        embedded_signing_notifications: true,
        name: input.name,
        subject: input.subject,
        message: input.message,
        files: input.files,
        recipients: input.recipients,
        fields: input.fields ?? defaultSignatureFields(input.recipients),
        metadata: input.metadata,
      },
    },
    deps,
  );
}

/**
 * One signature plus a date-signed stamp per recipient, bottom-left of page 1. SignWell
 * requires at least one field per signer; permit forms are signed on their own signature
 * block, so field placement is intentionally conservative rather than form-specific.
 */
export function defaultSignatureFields(recipients: Array<{ id: string }>): unknown[][] {
  return recipients.map((r, i) => [
    {
      api_id: `Signature_${i + 1}`,
      recipient_id: r.id,
      type: "signature",
      page: 1,
      x: 60,
      y: 640,
      width: 180,
      height: 32,
      required: true,
    },
    {
      api_id: `DateSigned_${i + 1}`,
      recipient_id: r.id,
      type: "autofill_date_signed",
      page: 1,
      x: 260,
      y: 640,
      width: 100,
      height: 19,
      required: true,
    },
  ]);
}

export const embeddedUrlFor = (doc: SignWellDocument, email: string): string | null => {
  const r = (doc.recipients ?? []).find(
    (x) => (x.email ?? "").toLowerCase() === email.toLowerCase(),
  );
  return r?.embedded_signing_url ?? null;
};

// --- webhooks ---------------------------------------------------------------

export async function createWebhook(
  apiKey: string,
  callbackUrl: string,
  deps: { fetch?: FetchLike; sleep?: (ms: number) => Promise<void> } = {},
): Promise<{ id: string; callback_url: string }> {
  return await signwellRequest<{ id: string; callback_url: string }>(
    "/hooks",
    { apiKey, body: { callback_url: callbackUrl } },
    deps,
  );
}

export async function listWebhooks(
  apiKey: string,
  deps: { fetch?: FetchLike; sleep?: (ms: number) => Promise<void> } = {},
): Promise<Array<{ id: string; callback_url: string }>> {
  return await signwellRequest<Array<{ id: string; callback_url: string }>>(
    "/hooks",
    { apiKey, method: "GET" },
    deps,
  );
}

export type SignWellEvent = {
  type: string;
  time: number | string;
  hash: string;
  related_signer?: { email?: string; name?: string };
};

/**
 * HMAC-SHA256(webhook_id, `${type}@${time}`) as lowercase hex — SignWell's documented
 * event-hash scheme. The webhook id is the key.
 */
export async function eventHash(webhookId: string, event: Pick<SignWellEvent, "type" | "time">) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookId),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${event.type}@${event.time}`),
  );
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison so a mismatch does not leak where it diverged. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** True only when the event's hash matches one of the registered webhook ids. */
export async function verifyEvent(
  event: SignWellEvent | undefined | null,
  webhookIds: string[],
): Promise<boolean> {
  if (!event?.hash || !event.type || event.time === undefined || event.time === null) return false;
  for (const id of webhookIds) {
    if (!id) continue;
    if (timingSafeEqual(await eventHash(id, event), event.hash.toLowerCase())) return true;
  }
  return false;
}

/**
 * document_completed is the only event meaning every signer is done. document_signed fires
 * per signer and must never be treated as completion.
 */
export const isCompletionEvent = (type: string): boolean => type === "document_completed";
