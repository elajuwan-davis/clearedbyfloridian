import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Cleard" },
      {
        name: "description",
        content: "Request a password reset link for your Cleard builder portal account.",
      },
      { property: "og:title", content: "Reset password — Cleard" },
      {
        property: "og:description",
        content: "Request a password reset link for your Cleard builder portal account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const LABEL_CLASS =
  "font-subline text-[11px] tracking-[0.15em] uppercase text-muted-foreground";

function ResetPasswordPage() {
  const navigate = useNavigate();
  // "recovery" once Supabase has established a recovery session from the emailed link.
  const [mode, setMode] = useState<"request" | "recovery">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.slice(1);
    const search = window.location.search.slice(1);
    const isRecovery =
      new URLSearchParams(hash).get("type") === "recovery" ||
      new URLSearchParams(search).get("type") === "recovery" ||
      new URLSearchParams(search).has("code");
    if (isRecovery) setMode("recovery");

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Intentionally ignore the result: never reveal whether the address matched an account.
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password-confirm`,
    });

    setLoading(false);
    setSent(true);
  }

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
    setDone(true);
    setTimeout(() => navigate({ to: "/login", replace: true }), 1800);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="space-y-2 mb-8">
          <div className="label-eyebrow">Builder portal</div>
          <h1
            className="text-4xl leading-[1.05] font-bold"
            style={{
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            {mode === "recovery" ? "Set a new password." : "Reset password."}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "recovery"
              ? "Choose a new password for your account."
              : "Enter your email and we'll send a reset link."}
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

        {mode === "request" ? (
          sent ? (
            <div
              className="text-sm px-4 py-3 border leading-relaxed"
              style={{ borderColor: "var(--border)", borderRadius: "3px" }}
            >
              If an account exists for that email, a reset link was sent. The link expires
              shortly — check your inbox and spam folder.
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className={LABEL_CLASS}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-[3px] h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[3px] font-subline tracking-wide gap-2"
                style={{ backgroundColor: "#12A05C", color: "#FFFFFF" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    Send reset link <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            </form>
          )
        ) : done ? (
          <div
            className="text-sm px-4 py-3 border leading-relaxed"
            style={{ borderColor: "var(--border)", borderRadius: "3px" }}
          >
            Password updated. Redirecting you to sign in…
          </div>
        ) : (
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
              style={{ backgroundColor: "#12A05C", color: "#FFFFFF" }}
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
