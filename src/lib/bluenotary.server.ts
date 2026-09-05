// BlueNotary remote online notarization (RON) client.
//
// The API key is read from BLUENOTARY_API_KEY at call time and never persisted
// or returned to a client. Webhook payloads are matched back to a release by
// the session id we store when the session is created.

const SESSIONS_URL = "https://app.bluenotary.us/api/integrationsv2/sessions";

export type BlueNotarySigner = {
  first_name: string;
  last_name: string;
  email: string;
};

export type BlueNotarySessionResult = {
  sessionId: string;
  signerUrl: string | null;
  raw: unknown;
};

function apiKey(): string {
  const key = process.env.BLUENOTARY_API_KEY;
  if (!key) {
    throw new Error("BLUENOTARY_API_KEY is not configured");
  }
  return key;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

/** Create a notarize-now RON session for an already generated document. */
export async function createNotarySession(input: {
  documentUrl: string;
  documentName: string;
  signer: BlueNotarySigner;
}): Promise<BlueNotarySessionResult> {
  const response = await fetch(SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signing_type: "gnw",
      notarize_now: true,
      documents: [{ url: input.documentUrl, name: input.documentName }],
      signers: [
        {
          first_name: input.signer.first_name,
          last_name: input.signer.last_name,
          email: input.signer.email,
        },
      ],
    }),
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      `BlueNotary session failed (${response.status}): ${typeof payload === "string" ? payload : JSON.stringify(payload)}`,
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;
  const nested = (body.data ?? body.session ?? {}) as Record<string, unknown>;
  const sessionId =
    pickString(body, ["session_id", "sessionId", "id"]) ??
    pickString(nested, ["session_id", "sessionId", "id"]);
  if (!sessionId) {
    throw new Error("BlueNotary session response did not include a session id");
  }

  return {
    sessionId,
    signerUrl:
      pickString(body, ["signer_url", "signerUrl", "url", "session_url"]) ??
      pickString(nested, ["signer_url", "signerUrl", "url", "session_url"]),
    raw: payload,
  };
}

export type BlueNotaryWebhook = {
  sessionId: string | null;
  status: string | null;
  signedDocumentUrl: string | null;
};

/** Normalize the completion webhook body — BlueNotary nests the payload
 *  differently across event types, so read both the root and `data`. */
export function parseWebhook(payload: unknown): BlueNotaryWebhook {
  const body = (payload ?? {}) as Record<string, unknown>;
  const nested = (body.data ?? body.session ?? {}) as Record<string, unknown>;
  const documents = Array.isArray(body.documents)
    ? (body.documents as Record<string, unknown>[])
    : Array.isArray(nested.documents)
      ? (nested.documents as Record<string, unknown>[])
      : [];
  const firstDoc = documents[0] ?? {};

  return {
    sessionId:
      pickString(body, ["session_id", "sessionId"]) ??
      pickString(nested, ["session_id", "sessionId", "id"]),
    status: pickString(body, ["status", "event", "event_type"]) ?? pickString(nested, ["status"]),
    signedDocumentUrl:
      pickString(body, ["signed_document_url", "completed_document_url", "document_url"]) ??
      pickString(nested, ["signed_document_url", "completed_document_url", "document_url"]) ??
      pickString(firstDoc, ["signed_url", "signed_document_url", "url"]),
  };
}
