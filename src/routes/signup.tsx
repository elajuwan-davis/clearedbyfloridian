import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { selfServeSignupFn } from "@/lib/self-serve-signup.functions";
import { CRM_OPTIONS, CRM_OTHER, CRM_QUESTION, isCrmAnswerComplete } from "@/lib/crm-options";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Cleard account" },
      {
        name: "description",
        content:
          "Create a Cleard account to file and track your own permits. Trial access starts immediately.",
      },
      { property: "og:title", content: "Create your Cleard account" },
      {
        property: "og:description",
        content: "File and track your own permits from day one. Trial access starts immediately.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

const OBSIDIAN = "#2F4F4F";

function SignupPage() {
  const navigate = useNavigate();
  const signUp = useServerFn(selfServeSignupFn);
  const [state, setState] = useState<"idle" | "submitting" | "verify">("idle");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [form, setForm] = useState({
    name: "",
    company: "",
    license_number: "",
    email: "",
    phone: "",
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [crm, setCrm] = useState("");
  const [crmOther, setCrmOther] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function sendVerificationEmail() {
    await supabase.auth.resend({
      type: "signup",
      email: form.email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?entry=selfserve`,
      },
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (!isCrmAnswerComplete(crm, crmOther)) {
      setError("Tell us which CRM you use.");
      return;
    }
    setState("submitting");
    try {
      await signUp({
        data: {
          name: form.name.trim(),
          company: form.company.trim(),
          license_number: form.license_number.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password,
          crm,
          crm_other: crm === CRM_OTHER ? crmOther.trim() : null,
        },
      });
      await sendVerificationEmail();
      setState("verify");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function onResend() {
    setResent("sending");
    try {
      await sendVerificationEmail();
      setResent("sent");
    } catch {
      setResent("failed");
    }
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
    if (result.redirected) return;
    navigate({ to: "/auth/callback" as never, replace: true });
  }

  return (
    <div className="cl-public min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left — obsidian panel */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "var(--obsidian)" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, color-mix(in oklab, var(--sky) 4%, transparent) 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, transparent 0 19px, color-mix(in oklab, var(--sky) 4%, transparent) 19px 20px)`,
          }}
        />
        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
              style={{
                background: "linear-gradient(135deg, #673147 0%, #4E6B5C 100%)",
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              C
            </div>
            <span
              className="font-semibold text-[20px]"
              style={{
                fontFamily: "'Instrument Sans', sans-serif",
                color: "var(--paper)",
              }}
            >
              Cleard
            </span>
          </Link>
        </div>

        <div className="relative max-w-md space-y-6">
          <div className="label-eyebrow" style={{ color: "var(--nl-lavender)" }}>
            Create Account
          </div>
          <p
            className="text-3xl leading-[1.15] text-paper font-bold"
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Start filing your own permits today.
          </p>
          <ul
            className="space-y-2 text-sm leading-relaxed"
            style={{ color: "color-mix(in oklab, var(--paper) 65%, transparent)" }}
          >
            <li>Your own permits, documents, and messages — unlocked immediately.</li>
            <li>2-day plan review and same-day inspections on managed accounts.</li>
            <li>Premium features unlock once our team upgrades your firm.</li>
          </ul>
        </div>

        <div
          className="relative font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "color-mix(in oklab, var(--nl-oat) 55%, transparent)" }}
        >
          Trial access · Gated features
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md" style={{ color: OBSIDIAN }}>
          {state === "verify" ? (
            <div className="space-y-5">
              <h1
                className="text-3xl font-bold"
                style={{ fontFamily: "'Instrument Sans', sans-serif" }}
              >
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We sent a verification link to <strong>{form.email.trim()}</strong>. Confirm the
                address to activate your account — you'll land on the permit agent authorization
                step, then your portal.
              </p>
              <button
                type="button"
                onClick={onResend}
                disabled={resent === "sending"}
                className="font-mono text-[10px] uppercase tracking-[0.2em] underline disabled:opacity-50"
              >
                {resent === "sending"
                  ? "Sending…"
                  : resent === "sent"
                    ? "Sent again — check your inbox"
                    : resent === "failed"
                      ? "Couldn't resend — try again"
                      : "Didn't get it? Resend"}
              </button>
              <p className="text-sm">
                <Link to="/login" className="underline font-medium">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: "'Instrument Sans', sans-serif" }}
              >
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground mb-8">
                Trial access: your own permits are unlocked, premium features stay gated until our
                team upgrades you.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full gap-2 mb-6"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.1 24.6c0-1.6-.2-3.2-.5-4.6H24v9h12.4c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.4 28.3a14.6 14.6 0 0 1 0-8.6l-7.8-6.1a24 24 0 0 0 0 20.8l7.8-6.1Z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 47.5c6.2 0 11.5-2 15.2-5.5l-7.6-5.9c-2.1 1.4-4.8 2.3-7.6 2.3-6.4 0-11.7-4.1-13.6-9.9l-7.8 6.1C6.5 42.2 14.6 47.5 24 47.5Z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-6">
                <span className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                {(
                  [
                    { k: "name", label: "Full name", type: "text", required: true },
                    { k: "company", label: "Company name", type: "text", required: true },
                    {
                      k: "license_number",
                      label: "Contractor license number",
                      type: "text",
                      required: true,
                    },
                    { k: "email", label: "Work email", type: "email", required: true },
                    { k: "phone", label: "Phone", type: "tel", required: true },
                  ] as const
                ).map((f) => (
                  <div key={f.k} className="space-y-1.5">
                    <Label htmlFor={`su-${f.k}`}>{f.label}</Label>
                    <Input
                      id={`su-${f.k}`}
                      type={f.type}
                      required={f.required}
                      value={form[f.k]}
                      onChange={(e) => set(f.k, e.target.value)}
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label htmlFor="su-crm">{CRM_QUESTION}</Label>
                  <select
                    id="su-crm"
                    required
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Select one…</option>
                    {CRM_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {crm === CRM_OTHER && (
                    <Input
                      required
                      aria-label="Which CRM do you use?"
                      placeholder="Which tool do you use?"
                      value={crmOther}
                      onChange={(e) => setCrmOther(e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-confirm">Confirm password</Label>
                  <Input
                    id="su-confirm"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>

                {error && (
                  <p className="text-[12px]" style={{ color: "#8c3b3b" }}>
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={state === "submitting"} className="w-full">
                  {state === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating your account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <p className="mt-8 pt-6 border-t text-sm">
                Already have an account?{" "}
                <Link to="/login" className="underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
