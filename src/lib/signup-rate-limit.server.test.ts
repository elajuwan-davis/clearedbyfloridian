import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RateLimitError,
  enforceSignupRateLimit,
  type SignupAttemptsClient,
} from "./signup-rate-limit.server.ts";

type AttemptRow = { email: string; ip_hash: string | null; outcome: string };

function stubAttempts(opts: {
  countByKey?: Record<string, number>;
  countError?: unknown;
}): { admin: SignupAttemptsClient; inserts: AttemptRow[] } {
  const inserts: AttemptRow[] = [];
  const admin: SignupAttemptsClient = {
    from(table) {
      assert.equal(table, "signup_attempts");
      return {
        select() {
          const chain: {
            _key?: string;
            gte: () => typeof chain;
            eq: (column: string, value: string) => typeof chain;
            ilike: (column: string, value: string) => typeof chain;
            then: (
              resolve: (value: { count: number | null; error: unknown }) => unknown,
            ) => Promise<unknown>;
          } = {
            gte() {
              return chain;
            },
            eq(column, value) {
              chain._key = `eq:${column}:${value}`;
              return chain;
            },
            ilike(column, value) {
              chain._key = `ilike:${column}:${value}`;
              return chain;
            },
            then(resolve) {
              if (opts.countError) {
                return Promise.resolve({ count: null, error: opts.countError }).then(resolve);
              }
              const count = opts.countByKey?.[chain._key ?? ""] ?? 0;
              return Promise.resolve({ count, error: null }).then(resolve);
            },
          };
          return chain;
        },
        insert(row) {
          inserts.push(row);
          return Promise.resolve({ error: null });
        },
      };
    },
  };
  return { admin, inserts };
}

describe("enforceSignupRateLimit", () => {
  it("records an attempt when both caps have headroom", async () => {
    const { admin, inserts } = stubAttempts({});
    await enforceSignupRateLimit(admin, "gc@example.com", "ip-1");
    assert.deepEqual(inserts, [
      { email: "gc@example.com", ip_hash: "ip-1", outcome: "attempted" },
    ]);
  });

  it("stops a fifth attempt from the same network before writing another row", async () => {
    const { admin, inserts } = stubAttempts({ countByKey: { "eq:ip_hash:ip-1": 5 } });
    await assert.rejects(
      () => enforceSignupRateLimit(admin, "gc@example.com", "ip-1"),
      (err: unknown) => {
        assert.ok(err instanceof RateLimitError);
        assert.match(err.message, /this network/);
        return true;
      },
    );
    assert.equal(inserts.length, 0);
  });

  it("stops a fourth attempt for the same email in the window", async () => {
    const { admin, inserts } = stubAttempts({
      countByKey: { "ilike:email:gc@example.com": 3 },
    });
    await assert.rejects(
      () => enforceSignupRateLimit(admin, "gc@example.com", "ip-1"),
      (err: unknown) => {
        assert.ok(err instanceof RateLimitError);
        assert.match(err.message, /This email has already been used/);
        return true;
      },
    );
    assert.equal(inserts.length, 0);
  });

  it("skips the per-network cap when there is no IP (email cap still applies)", async () => {
    const { admin, inserts } = stubAttempts({
      countByKey: { "eq:ip_hash:ignored": 99 },
    });
    await enforceSignupRateLimit(admin, "gc@example.com", null);
    assert.equal(inserts[0]?.ip_hash, null);
  });

  it("fails open when the attempts table is missing, so signup still works", async () => {
    const { admin, inserts } = stubAttempts({ countError: { message: "relation does not exist" } });
    await enforceSignupRateLimit(admin, "gc@example.com", "ip-1");
    assert.equal(inserts.length, 1);
  });
});
