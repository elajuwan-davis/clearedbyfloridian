import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password-confirm")({
  head: () => ({
    meta: [
      { title: "Set a new password — Cleard" },
      {
        name: "description",
        content: "Choose a new password for your Cleard builder portal account.",
      },
      { property: "og:title", content: "Set a new password — Cleard" },
      {
        property: "og:description",
        content: "Choose a new password for your Cleard builder portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordConfirmPage,
});

const LABEL_CLASS = "font-subline text-[11px] tracking-[0.15em] uppercase text-muted-foreground";

type Phase = "checking" | "ready" | "invalid" | "done";

function ResetPasswordConfirmPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) setPhase("ready");
    });

    (async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const search = new URLSearchParams(window.location.search);

      // Error handed back by Supabase (expired / already used link).
      if (hash.get("error") || search.get("error")) {
        if (!cancelled) setPhase("invalid");
        return;
      }

      // PKCE style link: ?code=...
      const code = search.get("code");
      if (code) {
        const { error: err } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) setPhase(err ? "invalid" : "ready");
        return;
      }

      // Implicit style link: #access_token=...&type=recovery
      if (hash.get("access_token") && hash.get("refresh_token")) {
        const { error: err } = await supabase.auth.setSession({
          access_token: hash.get("access_token")!,
          refresh_token: hash.get("refresh_token")!,
        });
        if (!cancelled) setPhase(err ? "invalid" : "ready");
        return;
      }

      // Otherwise: only allow the form if a session already exists (recovery session).
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setPhase(data.session ? "ready" : "invalid");
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPhase("done");
    await supabase.auth.signOut().catch(() => undefined);
    setTimeout(() => navigate({ to: "/login", search: { reset: 1 } as never, replace: true }), 1500);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="space-y-2 mb-8">
          <div className="label-eyebrow">Builder portal</div>
          <h1
            className="text-4xl leading-[1.05] font-bold"
            style={{
              fontFamily: "'Unbounded', sans-serif",
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            {phase === "invalid" ? "Link expired." : "Set a new password."}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {phase === "invalid"
              ? "This password reset link is invalid or has expired."
              : "Choose a new password for your account."}
          </p>
        </div>

        {error && (
          <div
            className="text-sm px-3 py-2 border mb-5"
            style={{
              borderColor: "color-mix(in oklab, var(--destructive) 40%, transparent)",
              backgroundColor: "color-mix(in oklab, var(--destructive) 6%, transparent)",
              color: "var(--destructive)",
              borderRadius: "3px",
            }}
          >
            {error}
          </div>
        )}

        {phase === "checking" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying your reset link…
          </div>
        )}

        {phase === "invalid" && (
          <div className="space-y-5">
            <div
              className="text-sm px-4 py-3 border leading-relaxed"
              style={{ borderColor: "var(--border)", borderRadius: "3px" }}
            >
              Reset links expire shortly after they're sent and can only be used once. Request a
              fresh link to continue.
            </div>
            <Link to="/reset-password">
              <Button
                className="w-full h-11 rounded-[3px] font-subline tracking-wide gap-2"
                style={{ backgroundColor: "#4E6B5C", color: "#FAF3E6" }}
              >
                Request a new link <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
        )}

        {phase === "done" && (
          <div
            className="text-sm px-4 py-3 border leading-relaxed"
            style={{ borderColor: "var(--border)", borderRadius: "3px" }}
          >
            Password updated. Redirecting you to sign in…
          </div>
        )}

        {phase === "ready" && (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className={LABEL_CLASS}>
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[3px] h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className={LABEL_CLASS}>
                Confirm password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-[3px] h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[3px] font-subline tracking-wide gap-2"
              style={{ backgroundColor: "#4E6B5C", color: "#FAF3E6" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating
                </>
              ) : (
                <>
                  Update password <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="mt-10 pt-6 border-t hairline">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
