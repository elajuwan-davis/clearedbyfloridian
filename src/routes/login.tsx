import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";
import { isPermitsOnlyEmail, PERMITS_ONLY_HOME } from "@/lib/permits-only";


export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Cleard" },
      { name: "description", content: "Builder portal sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setResetNotice(new URLSearchParams(window.location.search).has("reset"));
  }, []);

  function getSafeNext(fallback: string) {
    if (typeof window === "undefined") return fallback;
    const next = new URLSearchParams(window.location.search).get("next");
    if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const emailKey = email.trim().toLowerCase();

    // Real Supabase auth for @cleared.com and @floridianinc.com internal team.
    // On success, ALSO set demo localStorage keys so existing role/UI checks continue to work.
    if (/@(cleared|floridianinc)\.com$/.test(emailKey)) {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: emailKey, password });
      if (!authErr) {
        try {
          localStorage.setItem("cleared_demo_session", "1");
          localStorage.setItem("cleared_demo_user", emailKey);
          localStorage.setItem("cleared_demo_user_email", emailKey);
        } catch {
          /* ignore */
        }
        setLoading(false);
        const target = isPermitsOnlyEmail(emailKey)
          ? PERMITS_ONLY_HOME
          : getSafeNext("/dashboard");
        navigate({ to: target as never, replace: true });
        return;
      }
      setLoading(false);
      setError(authErr.message);
      return;
    }

    const { error, data: signIn } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // A self-serve account exists before its address is proved; it must not reach the portal
    // on the password alone. (Supabase also refuses this when email confirmation is enabled
    // project-side — this holds either way.)
    if (signIn.user && !signIn.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(
        "Confirm your email first — check your inbox for the verification link we sent when you signed up.",
      );
      return;
    }

    // Route by role
    const userId = signIn.user?.id;
    let target = getSafeNext("/portal");
    if (userId) {
      const { data: roles } = await (supabase.from("user_roles" as any) as any)
        .select("role")
        .eq("user_id", userId);
      const set = new Set((roles ?? []).map((r: any) => r.role));
      if (set.has("admin")) target = "/admin";
      else if (set.has("subcontractor")) target = "/sub-portal";
      else target = getSafeNext("/portal");
    }
    setLoading(false);
    navigate({ to: target as never, replace: true });
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setGoogleLoading(false);
      setError(result.error.message);
      return;
    }
    if (result.redirected) return; // browser is navigating to Google
    // Popup flow (editor preview): session is set — verify approval here.
    navigate({ to: "/auth/callback" as never, replace: true });
  }





  return (
    <div className="cl-public min-h-screen grid grid-cols-1 lg:grid-cols-2" style={{ background: "#FFFFFF" }}>
      {/* Left — obsidian panel with wave */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid rgba(0,0,0,0.10)" }}
      >
        {/* Sky wave pattern */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, rgba(156,107,63,0.10) 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, transparent 0 19px, rgba(156,107,63,0.10) 19px 20px)`,
          }}
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(156,107,63,0.10), transparent 70%)",
          }}
        />

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-base"
              style={{ background: "var(--copper-soft)", color: "var(--copper)", fontFamily: "'Instrument Sans', sans-serif" }}
            >
              C
            </div>
            <span
              className="font-semibold text-[20px]"
              style={{ fontFamily: "'Instrument Sans', sans-serif", color: "#000000" }}
            >
              Cleard
            </span>
          </Link>
        </div>

        <div className="relative max-w-md space-y-6">
          <div
            className="label-eyebrow"
            style={{ color: "rgba(0,0,0,0.55)" }}
          >
            FL Statute 553.791
          </div>
          <p
            className="text-3xl leading-[1.15] font-bold"
            style={{ fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.02em", color: "#000000" }}
          >
            Private‑provider permitting on a statutory clock.
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(0,0,0,0.55)" }}
          >
            Affidavit to permit in 10 business days. Certificate of compliance to CO in 2.
            Broward through the Treasure Coast.
          </p>
        </div>

        <div
          className="relative font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(0,0,0,0.45)" }}
        >
          FL Statute 553.791
        </div>
      </aside>

      {/* Right — sign in form */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto p-8" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.10)", boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}>
          {/* Mobile wordmark */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--copper-soft)", color: "var(--copper)", fontFamily: "'Instrument Sans', sans-serif" }}
            >
              C
            </div>
            <span
              className="font-semibold text-[17px]"
              style={{ fontFamily: "'Instrument Sans', sans-serif", color: "var(--foreground)" }}
            >
              Cleard
            </span>
          </Link>

          <div className="space-y-2 mb-8">
            <div className="label-eyebrow" style={{ color: "rgba(0,0,0,0.55)", textTransform: "uppercase", letterSpacing: "0.18em" }}>Builder portal</div>
            <h1
              className="text-4xl leading-[1.05] font-bold"
              style={{ fontFamily: "'Instrument Sans', sans-serif", letterSpacing: "-0.02em", color: "#000000" }}
            >
              Sign in.
            </h1>
            <p className="text-sm mt-2" style={{ color: "rgba(0,0,0,0.55)" }}>
              Access for licensed Florida general contractors.
            </p>
          </div>

          {resetNotice && (
            <div
              className="text-sm px-4 py-3 border mb-5 leading-relaxed"
              style={{ borderColor: "var(--border)", borderRadius: "3px" }}
            >
              Password updated. Sign in with your new password.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-subline text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-[3px] h-11" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.18)", color: "#000000" }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password" className="font-subline text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
                  Password
                </Label>
                <Link
                  to="/reset-password"
                  className="font-subline text-[11px] tracking-wide underline"
                  style={{ color: "#000000", textDecorationColor: "var(--copper)" }}
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-[3px] h-11" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.18)", color: "#000000" }}
              />
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2 border"
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

            <Button
              type="submit"
              disabled={loading}
              className="p-btn p-btn-primary cl-glass w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 hairline border-t" />
            <span className="font-subline text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              or
            </span>
            <div className="h-px flex-1 hairline border-t" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full h-11 rounded-[3px] font-subline tracking-wide gap-2"
            style={{ background: "#FFFFFF", border: "1px solid #000000", color: "#000000" }}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.1 24.6c0-1.6-.2-3.2-.5-4.6H24v9h12.4c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5Z" />
                <path fill="#FBBC05" d="M10.4 28.3a14.6 14.6 0 0 1 0-8.6l-7.8-6.1a24 24 0 0 0 0 20.8l7.8-6.1Z" />
                <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.2-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.6 2.3-6.4 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.2 14.6 47.5 24 47.5Z" />
              </svg>
            )}
            Continue with Google
          </Button>



          <div className="mt-8 pt-6 border-t hairline space-y-3">
            <p className="text-sm">
              New here?{" "}
              <Link
                to="/signup"
                className="underline font-medium"
                style={{ color: "#000000", textDecorationColor: "var(--copper)" }}
              >
                Create an account
              </Link>{" "}
              or continue with Google.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Questions? info@cleardinc.com
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
