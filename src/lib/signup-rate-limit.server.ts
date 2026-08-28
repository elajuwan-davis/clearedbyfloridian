// Abuse protection for the public /join endpoint: /join is the one server function anyone
// on the internet can call, so it is counted per network and per email before it creates
// anything. Backed by public.signup_attempts (service-role only).
//
// Deliberately simple and DB-backed rather than in-memory: the app runs serverless, so an
// in-process counter resets on every cold start and is trivially bypassed.

import { createHash } from "node:crypto";
import { getRequestIP } from "@tanstack/react-start/server";

/** Per-IP cap: enough for a shared office NAT, low enough to stop a script. */
const IP_LIMIT = 5;
const IP_WINDOW_MINUTES = 60;

/** Per-email cap: a legitimate person needs one, maybe a couple of retries. */
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MINUTES = 60 * 24;

export class RateLimitError extends Error {}

/** Salted so the ledger cannot be used to confirm that a given address signed up. */
function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "cleard-signup";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 64);
}

/** The caller's IP, trusting the proxy header (the app always runs behind one). */
export function clientIpHash(): string | null {
  try {
    const ip = getRequestIP({ xForwardedFor: true });
    return ip ? hashIp(ip) : null;
  } catch {
    // No request context (or no usable header) — fall back to the per-email limit alone.
    return null;
  }
}

/**
 * The slice of the service-role client this module needs. signup_attempts is not in the
 * generated Database types, so it is described structurally rather than cast to `any`.
 */
type CountQuery = PromiseLike<{ count: number | null; error: unknown }> & {
  gte(column: string, value: string): CountQuery;
  eq(column: string, value: string): CountQuery;
  ilike(column: string, value: string): CountQuery;
};

export type SignupAttemptsClient = {
  from(table: "signup_attempts"): {
    select(columns: string, opts: { count: "exact"; head: true }): CountQuery;
    insert(row: {
      email: string;
      ip_hash: string | null;
      outcome: string;
    }): PromiseLike<{ error: unknown }>;
  };
};

async function countSince(
  admin: SignupAttemptsClient,
  column: "ip_hash" | "email",
  value: string,
  minutes: number,
): Promise<number> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  let q = admin
    .from("signup_attempts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  q = column === "email" ? q.ilike("email", value) : q.eq("ip_hash", value);
  const { count, error } = await q;
  // A missing table (migration not applied yet) must not take signup down.
  if (error) return 0;
  return count ?? 0;
}

/**
 * Throws RateLimitError when this caller has attempted too often. Records the attempt so
 * repeats count even when the signup itself later fails.
 */
export async function enforceSignupRateLimit(
  admin: SignupAttemptsClient,
  email: string,
): Promise<void> {
  const ipHash = clientIpHash();

  if (ipHash) {
    const recent = await countSince(admin, "ip_hash", ipHash, IP_WINDOW_MINUTES);
    if (recent >= IP_LIMIT) {
      throw new RateLimitError(
        "Too many signup attempts from this network. Try again in an hour, or email support@cleardinc.com.",
      );
    }
  }

  const perEmail = await countSince(admin, "email", email, EMAIL_WINDOW_MINUTES);
  if (perEmail >= EMAIL_LIMIT) {
    throw new RateLimitError(
      "This email has already been used to sign up several times today. Check your inbox for the verification link, or sign in instead.",
    );
  }

  await admin.from("signup_attempts").insert({ email, ip_hash: ipHash, outcome: "attempted" });
}
