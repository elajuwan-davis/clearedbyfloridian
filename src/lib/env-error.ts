// Narrow detector for ONE specific transient failure: the platform-injected
// backend env vars (SUPABASE_URL / keys) going stale in a running server
// process. That error is thrown verbatim by the generated Supabase clients:
//
//   "Missing Supabase environment variable(s): SUPABASE_URL, ... Connect Supabase in Lovable Cloud."
//
// Nothing else matches. A real query error, a permissions/RLS denial, a 403,
// a validation failure — none of those contain this string, so they keep
// surfacing as normal hard errors. Do NOT widen this matcher.

const MISSING_ENV_RE = /Missing Supabase environment variable\(s\)/i;

export function isMissingBackendEnvError(err: unknown): boolean {
  const message =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : typeof (err as { message?: unknown })?.message === "string"
          ? ((err as { message: string }).message)
          : "";
  return MISSING_ENV_RE.test(message);
}
