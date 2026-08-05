// One model call, two possible providers.
//
// Lovable's AI gateway does not serve Anthropic models — asking it for claude-sonnet-5 comes
// back as `400 invalid model: … allowed models: [google/… openai/…]`, which is what left
// Agents 3 and 7 dead in production. So the same call can go straight to Anthropic instead:
//
//   AI_PROVIDER=anthropic   POST https://api.anthropic.com/v1/messages
//                           x-api-key: $ANTHROPIC_API_KEY, anthropic-version: 2023-06-01
//                           { model, max_tokens, system, messages, temperature }
//                           -> { content: [{ type: "text", text }], model }
//   AI_PROVIDER=lovable     POST $AI_GATEWAY_URL (OpenAI-shaped chat completions)
//                           Authorization: Bearer $LOVABLE_API_KEY
//
// The provider is chosen from the environment rather than from the model name, so pointing a
// local harness at a stub gateway still works. Callers pass a system prompt and one user
// message — the only shape any of the agents use — and get plain text back.

export const ANTHROPIC_VERSION = "2023-06-01";
export const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
export const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type Provider = "anthropic" | "lovable";

export type AiEnv = {
  AI_PROVIDER?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_BASE_URL?: string;
  LOVABLE_API_KEY?: string;
  AI_GATEWAY_URL?: string;
};

export type ChatRequest = {
  model: string;
  system: string;
  user: string;
  /** Anthropic requires this; the gateway ignores it. */
  maxTokens: number;
  temperature?: number;
};

export type ChatResult = {
  text: string;
  /** What the provider says it answered with, falling back to what we asked for. */
  model: string;
  provider: Provider;
};

export class AiError extends Error {
  constructor(
    message: string,
    readonly provider: Provider,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}

/**
 * Which provider a given environment selects. Explicit `AI_PROVIDER` wins; otherwise an
 * Anthropic key means Anthropic, and everything else stays on the gateway — so an environment
 * that has only ever had LOVABLE_API_KEY keeps its current behaviour.
 */
export function providerFor(env: AiEnv): Provider {
  const explicit = (env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "lovable") return explicit;
  if (explicit) {
    throw new AiError(`AI_PROVIDER must be "anthropic" or "lovable", not "${explicit}"`, "lovable");
  }
  return env.ANTHROPIC_API_KEY?.trim() ? "anthropic" : "lovable";
}

/**
 * Anthropic's own model ids have no vendor prefix: the gateway wants `anthropic/claude-sonnet-5`
 * where the API itself wants `claude-sonnet-5`. Configuration can therefore carry either form.
 */
export function anthropicModel(model: string): string {
  return model.replace(/^anthropic\//, "");
}

/** Whether a failed attempt is worth repeating: rate limits, overload, and 5xx. */
export function isRetryable(status: number): boolean {
  return status === 429 || status === 529 || status >= 500;
}

/** 500ms, 1s — short, because an edge function's whole budget is seconds, not minutes. */
export const MAX_ATTEMPTS = 3;
export const backoffMs = (attempt: number): number => 500 * 2 ** (attempt - 1);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function chat(
  req: ChatRequest,
  env: AiEnv,
  fetchImpl: typeof fetch = fetch,
  sleepImpl: (ms: number) => Promise<unknown> = sleep,
): Promise<ChatResult> {
  const provider = providerFor(env);
  const call = provider === "anthropic" ? anthropicChat : lovableChat;

  let last: AiError | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await call(req, env, fetchImpl);
    } catch (err) {
      // A wrong model, a bad key or an unparseable answer will fail identically next time.
      if (!(err instanceof AiError) || err.status === undefined || !isRetryable(err.status)) {
        throw err;
      }
      last = err;
      if (attempt < MAX_ATTEMPTS) await sleepImpl(backoffMs(attempt));
    }
  }
  throw last;
}

async function anthropicChat(
  req: ChatRequest,
  env: AiEnv,
  fetchImpl: typeof fetch,
): Promise<ChatResult> {
  const key = env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new AiError("ANTHROPIC_API_KEY is not configured", "anthropic");
  const url = (env.ANTHROPIC_BASE_URL ?? "").trim() || ANTHROPIC_MESSAGES_URL;

  const resp = await fetchImpl(url, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: anthropicModel(req.model),
      max_tokens: req.maxTokens,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
      ...(req.temperature === undefined ? {} : { temperature: req.temperature }),
    }),
  });

  if (!resp.ok) {
    const raw = (await resp.text()).slice(0, 500);
    // { "type": "error", "error": { "type": …, "message": … } }
    let detail = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: { type?: string; message?: string } };
      if (parsed.error?.message) {
        detail = parsed.error.type
          ? `${parsed.error.type}: ${parsed.error.message}`
          : parsed.error.message;
      }
    } catch {
      // not JSON — keep the raw body
    }
    throw new AiError(`Anthropic returned ${resp.status}: ${detail}`, "anthropic", resp.status);
  }

  const body = (await resp.json()) as {
    model?: string;
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = (body.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("")
    .trim();
  if (!text) throw new AiError("Anthropic returned no text content", "anthropic");
  return { text, model: body.model ?? anthropicModel(req.model), provider: "anthropic" };
}

async function lovableChat(
  req: ChatRequest,
  env: AiEnv,
  fetchImpl: typeof fetch,
): Promise<ChatResult> {
  const key = env.LOVABLE_API_KEY?.trim();
  if (!key) throw new AiError("LOVABLE_API_KEY is not configured", "lovable");
  const url = (env.AI_GATEWAY_URL ?? "").trim() || LOVABLE_GATEWAY_URL;

  const resp = await fetchImpl(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model,
      ...(req.temperature === undefined ? {} : { temperature: req.temperature }),
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
    }),
  });

  if (!resp.ok) {
    throw new AiError(
      `AI gateway returned ${resp.status}: ${(await resp.text()).slice(0, 300)}`,
      "lovable",
      resp.status,
    );
  }

  const body = (await resp.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = (body.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new AiError("AI gateway returned an empty response", "lovable");
  return { text, model: body.model ?? req.model, provider: "lovable" };
}

/** The environment as the edge runtime sees it. */
export function envFromDeno(): AiEnv {
  return {
    AI_PROVIDER: Deno.env.get("AI_PROVIDER") ?? undefined,
    ANTHROPIC_API_KEY: Deno.env.get("ANTHROPIC_API_KEY") ?? undefined,
    ANTHROPIC_BASE_URL: Deno.env.get("ANTHROPIC_BASE_URL") ?? undefined,
    LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY") ?? undefined,
    AI_GATEWAY_URL: Deno.env.get("AI_GATEWAY_URL") ?? undefined,
  };
}

/** Whether any provider is configured at all — for the callers that degrade instead of failing. */
export function aiConfigured(env: AiEnv = envFromDeno()): boolean {
  try {
    return providerFor(env) === "anthropic"
      ? Boolean(env.ANTHROPIC_API_KEY?.trim())
      : Boolean(env.LOVABLE_API_KEY?.trim());
  } catch {
    return false;
  }
}
