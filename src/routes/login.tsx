import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Cleard by Flōridian" },
      { name: "description", content: "Builder portal sign in. By invitation only." },
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
  const [error, setError] = useState<string | null>(null);

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
        navigate({ to: getSafeNext("/dashboard") as never, replace: true });
        return;
      }
      setLoading(false);
      setError(authErr.message);
      return;
    }

    // GC Client tier — external general contractors. Any password accepted in scaffold.
    const { getGCClientByEmail, setGCSession } = await import("@/lib/gc-clients");
    const gc = getGCClientByEmail(emailKey);
    if (gc && password.length > 0) {
      setGCSession(gc.id);
      setLoading(false);
      navigate({ to: "/gc-portal", replace: true });
      return;
    }


    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: getSafeNext("/portal") as never, replace: true });
  }



  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left — obsidian panel with wave */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "var(--obsidian)" }}
      >
        {/* Sky wave pattern */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, color-mix(in oklab, var(--sky) 4%, transparent) 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, transparent 0 19px, color-mix(in oklab, var(--sky) 4%, transparent) 19px 20px)`,
          }}
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full"
          style={{
            background: "radial-gradient(circle, color-mix(in oklab, var(--sky) 12%, transparent), transparent 70%)",
          }}
        />

        <div className="relative">
          <Link to="/" className="inline-block leading-[1]">
            <div className="wordmark text-5xl text-paper">Cleard</div>
            <div
              className="wordmark-subline mt-2"
              style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}
            >
              by Flōridian
            </div>
          </Link>
        </div>

        <div className="relative max-w-md space-y-6">
          <div
            className="label-eyebrow"
            style={{ color: "color-mix(in oklab, var(--sky) 80%, transparent)" }}
          >
            FL Statute 553.791
          </div>
          <p
            className="display-serif text-3xl leading-[1.15] text-paper"
          >
            Private‑provider permitting on a <em>statutory clock</em>.
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "color-mix(in oklab, var(--paper) 65%, transparent)" }}
          >
            Affidavit to permit in 10 business days. Certificate of compliance to CO in 2.
            Broward through the Treasure Coast.
          </p>
        </div>

        <div
          className="relative font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "color-mix(in oklab, var(--paper) 40%, transparent)" }}
        >
          FL Statute 553.791
        </div>
      </aside>

      {/* Right — sign in form */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile wordmark */}
          <Link to="/" className="lg:hidden block leading-[1] mb-10">
            <div className="wordmark text-3xl text-foreground">Cleard</div>
            <div className="wordmark-subline mt-1">by Flōridian</div>
          </Link>

          <div className="space-y-2 mb-8">
            <div className="label-eyebrow">Builder portal</div>
            <h1 className="display-serif text-4xl leading-[1.05]">Sign in.</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Access for licensed Florida general contractors.
            </p>
          </div>

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
                className="rounded-[3px] h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password" className="font-subline text-[11px] tracking-[0.15em] uppercase text-muted-foreground">
                  Password
                </Label>
                <Link
                  to="/login"
                  className="font-subline text-[11px] tracking-wide text-muted-foreground hover:text-foreground"
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
                className="rounded-[3px] h-11"
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
              className="w-full h-11 rounded-[3px] font-subline tracking-wide gap-2"
              style={{ backgroundColor: "var(--obsidian)", color: "var(--paper)" }}
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

          <div className="mt-10 pt-6 border-t hairline">
            <p className="text-xs text-muted-foreground leading-relaxed">
              New here? Contact us at permits@floridianinc.com to set up your firm's portal access.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
