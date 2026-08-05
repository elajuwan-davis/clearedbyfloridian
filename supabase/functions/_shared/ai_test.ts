import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  AiError,
  ANTHROPIC_MESSAGES_URL,
  ANTHROPIC_VERSION,
  aiConfigured,
  anthropicModel,
  chat,
  isRetryable,
  MAX_ATTEMPTS,
  providerFor,
  type AiEnv,
} from "./ai.ts";

type Captured = { url: string; init: RequestInit };

function recorder(response: Response): { calls: Captured[]; fetch: typeof fetch } {
  const calls: Captured[] = [];
  const fetchImpl = ((url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return Promise.resolve(response);
  }) as unknown as typeof fetch;
  return { calls, fetch: fetchImpl };
}

const anthropicOk = () =>
  new Response(
    JSON.stringify({
      model: "claude-sonnet-5",
      content: [
        { type: "thinking", thinking: "ignored" },
        { type: "text", text: "  the scope  " },
      ],
    }),
    { status: 200 },
  );

const ANTHROPIC_ENV: AiEnv = { ANTHROPIC_API_KEY: "sk-ant-test" };
const LOVABLE_ENV: AiEnv = { LOVABLE_API_KEY: "lv-test" };

Deno.test("provider is Anthropic when only an Anthropic key is set, Lovable otherwise", () => {
  assertEquals(providerFor(ANTHROPIC_ENV), "anthropic");
  assertEquals(providerFor(LOVABLE_ENV), "lovable");
  assertEquals(providerFor({}), "lovable");
  // Explicit configuration wins over key presence in both directions.
  assertEquals(providerFor({ ...ANTHROPIC_ENV, AI_PROVIDER: "lovable" }), "lovable");
  assertEquals(providerFor({ ...LOVABLE_ENV, AI_PROVIDER: "Anthropic" }), "anthropic");
  assertThrows(() => providerFor({ AI_PROVIDER: "openai" }), AiError);
});

Deno.test("the local stub-gateway setup still routes to the gateway", () => {
  const harness: AiEnv = { LOVABLE_API_KEY: "stub", AI_GATEWAY_URL: "http://localhost:8788/v1" };
  assertEquals(providerFor(harness), "lovable");
  assertEquals(aiConfigured(harness), true);
  assertEquals(aiConfigured({}), false);
});

Deno.test("Anthropic call uses x-api-key, the version header and the messages shape", async () => {
  const { calls, fetch: f } = recorder(anthropicOk());
  const result = await chat(
    {
      model: "anthropic/claude-sonnet-5",
      system: "sys",
      user: "usr",
      maxTokens: 1024,
      temperature: 0.2,
    },
    ANTHROPIC_ENV,
    f,
  );

  assertEquals(calls.length, 1);
  assertEquals(calls[0].url, ANTHROPIC_MESSAGES_URL);
  const headers = calls[0].init.headers as Record<string, string>;
  assertEquals(headers["x-api-key"], "sk-ant-test");
  assertEquals(headers["anthropic-version"], ANTHROPIC_VERSION);
  assertEquals(headers.Authorization, undefined);

  const body = JSON.parse(calls[0].init.body as string);
  // The vendor prefix the gateway wants is not part of Anthropic's own model ids.
  assertEquals(body.model, "claude-sonnet-5");
  assertEquals(body.max_tokens, 1024);
  assertEquals(body.temperature, 0.2);
  assertEquals(body.system, "sys");
  assertEquals(body.messages, [{ role: "user", content: "usr" }]);

  assertEquals(result.text, "the scope");
  assertEquals(result.model, "claude-sonnet-5");
  assertEquals(result.provider, "anthropic");
});

Deno.test("Lovable call keeps the OpenAI-shaped body and the vendor-prefixed model", async () => {
  const { calls, fetch: f } = recorder(
    new Response(
      JSON.stringify({ model: "google/gemini-2.5-pro", choices: [{ message: { content: "ok" } }] }),
      { status: 200 },
    ),
  );
  const result = await chat(
    { model: "anthropic/claude-sonnet-5", system: "sys", user: "usr", maxTokens: 1024 },
    { ...LOVABLE_ENV, AI_GATEWAY_URL: "http://localhost:8788/v1" },
    f,
  );

  assertEquals(calls[0].url, "http://localhost:8788/v1");
  const headers = calls[0].init.headers as Record<string, string>;
  assertEquals(headers.Authorization, "Bearer lv-test");
  const body = JSON.parse(calls[0].init.body as string);
  assertEquals(body.model, "anthropic/claude-sonnet-5");
  assertEquals(body.max_tokens, undefined);
  assertEquals(body.messages, [
    { role: "system", content: "sys" },
    { role: "user", content: "usr" },
  ]);
  assertEquals(result, { text: "ok", model: "google/gemini-2.5-pro", provider: "lovable" });
});

Deno.test(
  "an Anthropic error surfaces its own type and message, not the raw envelope",
  async () => {
    const { fetch: f } = recorder(
      new Response(
        JSON.stringify({
          type: "error",
          error: { type: "not_found_error", message: "model: claude-sonnet-9" },
          request_id: "req_1",
        }),
        { status: 404 },
      ),
    );
    const err = await assertRejects(
      () =>
        chat({ model: "claude-sonnet-9", system: "s", user: "u", maxTokens: 16 }, ANTHROPIC_ENV, f),
      AiError,
    );
    assertEquals(err.message, "Anthropic returned 404: not_found_error: model: claude-sonnet-9");
    assertEquals(err.status, 404);
    assertEquals(err.provider, "anthropic");
  },
);

Deno.test("a non-JSON Anthropic error body is still reported", async () => {
  const { fetch: f } = recorder(new Response("<html>bad request</html>", { status: 400 }));
  const err = await assertRejects(
    () =>
      chat({ model: "claude-sonnet-5", system: "s", user: "u", maxTokens: 16 }, ANTHROPIC_ENV, f),
    AiError,
  );
  assertEquals(err.message, "Anthropic returned 400: <html>bad request</html>");
});

Deno.test("a missing key fails before any request is made", async () => {
  const { calls, fetch: f } = recorder(anthropicOk());
  await assertRejects(
    () =>
      chat(
        { model: "claude-sonnet-5", system: "s", user: "u", maxTokens: 16 },
        { AI_PROVIDER: "anthropic" },
        f,
      ),
    AiError,
    "ANTHROPIC_API_KEY is not configured",
  );
  await assertRejects(
    () =>
      chat(
        { model: "claude-sonnet-5", system: "s", user: "u", maxTokens: 16 },
        { AI_PROVIDER: "lovable" },
        f,
      ),
    AiError,
    "LOVABLE_API_KEY is not configured",
  );
  assertEquals(calls.length, 0);
});

Deno.test("an empty completion is an error, not an empty draft", async () => {
  const { fetch: f } = recorder(new Response(JSON.stringify({ content: [] }), { status: 200 }));
  await assertRejects(
    () =>
      chat({ model: "claude-sonnet-5", system: "s", user: "u", maxTokens: 16 }, ANTHROPIC_ENV, f),
    AiError,
    "Anthropic returned no text content",
  );
});

Deno.test("only rate limits, overload and 5xx are worth retrying", () => {
  assertEquals([429, 529, 500, 503].map(isRetryable), [true, true, true, true]);
  assertEquals([400, 401, 404, 422].map(isRetryable), [false, false, false, false]);
});

Deno.test("a 529 overload is retried and can succeed", async () => {
  const responses = [
    new Response(JSON.stringify({ error: { message: "overloaded" } }), { status: 529 }),
    anthropicOk(),
  ];
  let calls = 0;
  const slept: number[] = [];
  const f = (() => {
    calls++;
    return Promise.resolve(responses.shift()!);
  }) as unknown as typeof fetch;

  const result = await chat(
    { model: "claude-sonnet-5", system: "s", user: "u", maxTokens: 16 },
    ANTHROPIC_ENV,
    f,
    (ms) => {
      slept.push(ms);
      return Promise.resolve();
    },
  );
  assertEquals(calls, 2);
  assertEquals(slept, [500]);
  assertEquals(result.text, "the scope");
});

Deno.test("a wrong model is not retried \u2014 it fails the same way every time", async () => {
  let calls = 0;
  const f = (() => {
    calls++;
    return Promise.resolve(
      new Response(JSON.stringify({ error: { type: "not_found_error", message: "model" } }), {
        status: 404,
      }),
    );
  }) as unknown as typeof fetch;
  await assertRejects(
    () =>
      chat({ model: "nope", system: "s", user: "u", maxTokens: 16 }, ANTHROPIC_ENV, f, () =>
        Promise.resolve(),
      ),
    AiError,
  );
  assertEquals(calls, 1);
});

Deno.test("persistent 5xx gives up after MAX_ATTEMPTS", async () => {
  let calls = 0;
  const f = (() => {
    calls++;
    return Promise.resolve(new Response("boom", { status: 503 }));
  }) as unknown as typeof fetch;
  await assertRejects(
    () =>
      chat(
        { model: "claude-sonnet-5", system: "s", user: "u", maxTokens: 16 },
        ANTHROPIC_ENV,
        f,
        () => Promise.resolve(),
      ),
    AiError,
  );
  assertEquals(calls, MAX_ATTEMPTS);
});

Deno.test("model ids drop only a leading anthropic/ prefix", () => {
  assertEquals(anthropicModel("anthropic/claude-sonnet-5"), "claude-sonnet-5");
  assertEquals(anthropicModel("claude-haiku-4-5"), "claude-haiku-4-5");
  assertEquals(anthropicModel("google/gemini-2.5-pro"), "google/gemini-2.5-pro");
});
