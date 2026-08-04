// deno test -A supabase/functions/_shared/signwell_test.ts
//
// Covers the two things that cannot be verified by hitting the live API: the retry policy
// (429/5xx retried with exponential backoff, other 4xx not retried) and event-hash
// verification, including the document_signed-is-not-completion rule.

import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  backoffMs,
  eventHash,
  isCompletionEvent,
  signwellRequest,
  SignWellError,
  verifyEvent,
} from "./signwell.ts";

const noSleep = { sleep: async () => {} };

function responder(statuses: number[], body = "{}") {
  const calls: string[] = [];
  const fetchLike = ((url: string | URL | Request, init?: RequestInit) => {
    const status = statuses[Math.min(calls.length, statuses.length - 1)];
    calls.push(String(url));
    return Promise.resolve(
      new Response(status === 200 ? body : "err", {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;
  return { fetchLike, calls };
}

Deno.test("backoff is 1s, 2s, 4s, 8s", () => {
  assertEquals([1, 2, 3, 4].map(backoffMs), [1000, 2000, 4000, 8000]);
});

Deno.test("429 is retried and eventually succeeds", async () => {
  const { fetchLike, calls } = responder([429, 429, 200], JSON.stringify({ id: "doc_1" }));
  const slept: number[] = [];
  const out = await signwellRequest<{ id: string }>(
    "/documents",
    { apiKey: "k", body: {} },
    { fetch: fetchLike, sleep: async (ms) => void slept.push(ms) },
  );
  assertEquals(out.id, "doc_1");
  assertEquals(calls.length, 3);
  assertEquals(slept, [1000, 2000]);
});

Deno.test("5xx is retried up to 5 attempts then throws", async () => {
  const { fetchLike, calls } = responder([503]);
  const slept: number[] = [];
  const err = await assertRejects(
    () =>
      signwellRequest(
        "/documents",
        { apiKey: "k", body: {} },
        {
          fetch: fetchLike,
          sleep: async (ms) => void slept.push(ms),
        },
      ),
    SignWellError,
  );
  assertEquals(calls.length, 5);
  assertEquals(slept, [1000, 2000, 4000, 8000]);
  assertEquals(err.attempts, 5);
});

Deno.test("400 is not retried", async () => {
  const { fetchLike, calls } = responder([400]);
  const err = await assertRejects(
    () =>
      signwellRequest("/documents", { apiKey: "k", body: {} }, { fetch: fetchLike, ...noSleep }),
    SignWellError,
  );
  assertEquals(calls.length, 1);
  assertEquals(err.status, 400);
  assert(err.message.includes("not retryable"));
});

Deno.test("401 is not retried", async () => {
  const { fetchLike, calls } = responder([401]);
  await assertRejects(
    () =>
      signwellRequest("/documents", { apiKey: "k", body: {} }, { fetch: fetchLike, ...noSleep }),
    SignWellError,
  );
  assertEquals(calls.length, 1);
});

Deno.test("network failures are retried like 5xx", async () => {
  let calls = 0;
  const fetchLike = (() => {
    calls++;
    return Promise.reject(new Error("connection reset"));
  }) as unknown as typeof fetch;
  await assertRejects(
    () =>
      signwellRequest("/documents", { apiKey: "k", body: {} }, { fetch: fetchLike, ...noSleep }),
    SignWellError,
  );
  assertEquals(calls, 5);
});

Deno.test("event hash matches SignWell's HMAC-SHA256(webhook_id, type@time)", async () => {
  const hash = await eventHash("hook_123", { type: "document_completed", time: 1689332249 });
  // Independently computed with python hmac:
  //   hmac.new(b"hook_123", b"document_completed@1689332249", hashlib.sha256).hexdigest()
  assertEquals(hash, "7331c40e5bbc6ecdc3cd01698d0ee35dbe59aba2bedb3b73ad09eeef505dbd27");
  assert(await verifyEvent({ type: "document_completed", time: 1689332249, hash }, ["hook_123"]));
});

Deno.test("verification fails for a wrong key, tampered type/time, or missing hash", async () => {
  const hash = await eventHash("hook_123", { type: "document_completed", time: 1689332249 });
  assertEquals(
    await verifyEvent({ type: "document_completed", time: 1689332249, hash }, ["other_hook"]),
    false,
  );
  assertEquals(
    await verifyEvent({ type: "document_completed", time: 1689332250, hash }, ["hook_123"]),
    false,
  );
  assertEquals(
    await verifyEvent({ type: "document_signed", time: 1689332249, hash }, ["hook_123"]),
    false,
  );
  assertEquals(await verifyEvent({ type: "x", time: 1, hash: "" }, ["hook_123"]), false);
  assertEquals(await verifyEvent(null, ["hook_123"]), false);
});

Deno.test("verification accepts any registered webhook id (rotation)", async () => {
  const hash = await eventHash("hook_new", { type: "document_completed", time: 42 });
  assert(
    await verifyEvent({ type: "document_completed", time: 42, hash }, ["hook_old", "hook_new"]),
  );
});

Deno.test("only document_completed counts as completion", () => {
  assert(isCompletionEvent("document_completed"));
  for (const t of ["document_signed", "document_viewed", "document_sent", "document_declined"]) {
    assertEquals(isCompletionEvent(t), false);
  }
});
