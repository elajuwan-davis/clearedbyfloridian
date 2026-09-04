import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { evaluatePortalAccessFn } from "@/lib/google-access.functions";
import { isMissingBackendEnvError } from "@/lib/env-error";
import { getMyCrmFn } from "@/lib/crm.functions";
import { CrmCaptureDialog } from "@/components/crm-capture-dialog";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing in — Cleard" },
      { name: "description", content: "Completing sign in to the Cleard builder portal." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

type State =
  | { kind: "working" }
  | { kind: "pending"; email: string | null; filed: boolean }
  | { kind: "unverified"; email: string | null }
  /** Google account that has never answered the CRM question — required before entry. */
  | { kind: "crm"; target: string }
  | { kind: "error"; message: string };

function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "working" });

  const goTo = useCallback(
    (target: string) => {
      if (target === "/onboarding") {
        navigate({ to: "/onboarding", search: { entry: "selfserve" } as never, replace: true });
        return;
      }
      navigate({ to: target as never, replace: true });
    },
    [navigate],
  );


  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Wait briefly for the session set by the OAuth redirect to hydrate.
      let session = null;
      for (let i = 0; i < 20 && !session; i++) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        if (!session) await new Promise((r) => setTimeout(r, 150));
      }
      if (cancelled) return;
      if (!session) {
        setState({ kind: "error", message: "Sign in did not complete. Please try again." });
        return;
      }

      try {
        const decision = await evaluatePortalAccessFn();
        if (cancelled) return;
        if (!decision.allowed) {
          await supabase.auth.signOut();
          setState(
            decision.reason === "unverified"
              ? { kind: "unverified", email: decision.email }
              : { kind: "pending", email: decision.email, filed: decision.reason === "filed" },
          );
          return;
        }
        // A self-serve signup arrives here off its own confirmation link and still owes
        // the PAA signature, so it goes to onboarding rather than straight to a dashboard.
        // A brand-new Google account that just self-provisioned a trial tenant is the same case.
        const target =
          decision.reason === "provisioned" ||
          (typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("entry") === "selfserve")
            ? "/onboarding"
            : decision.role === "subcontractor"
              ? "/sub-portal"
              : "/dashboard";

        // Google accounts never saw the /join form's CRM question — ask it once, here,
        // before the portal opens. A lookup failure must not strand a valid sign-in.
        let answered = true;
        try {
          const crm = await getMyCrmFn();
          answered = Boolean(crm.crm);
        } catch {
          answered = true;
        }
        if (cancelled) return;
        if (!answered) {
          setState({ kind: "crm", target });
          return;
        }
        goTo(target);
      } catch (e) {
        if (cancelled) return;
        // A transient backend-binding hiccup should read as "try again", not as a
        // raw Supabase environment error in front of a signing-in contractor.
        if (isMissingBackendEnvError(e)) {
          setState({
            kind: "error",
            message: "We couldn't reach the portal just now. Please try signing in again.",
          });
          return;
        }
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Could not verify your access.",
        });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, goTo]);

  return (
    <div className="cl-public min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-md space-y-4 text-center">
        {state.kind === "crm" && <CrmCaptureDialog onDone={() => goTo(state.target)} />}

        {state.kind === "working" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Verifying your access…</p>
          </>
        )}

        {state.kind === "pending" && (
          <>
            <div className="label-eyebrow">Access pending</div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "'Unbounded', sans-serif" }}
            >
              We're reviewing your request.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {state.filed
                ? "We've submitted an access request"
                : "Your access request is still under review"}
              {state.email ? ` for ${state.email}` : ""}. Our team will email you as soon as your
              portal access is approved.
            </p>
            <p className="text-xs text-muted-foreground">
              Questions? permits@floridianinc.com
            </p>
            <Link to="/login" className="inline-block text-sm underline">
              Back to sign in
            </Link>
          </>
        )}

        {state.kind === "unverified" && (
          <>
            <div className="label-eyebrow">Email not verified</div>
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: "'Unbounded', sans-serif" }}
            >
              Confirm your email first.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We need to know the address is yours before the portal opens
              {state.email ? ` for ${state.email}` : ""}. Use the confirmation link we emailed
              you, then sign in again.
            </p>
            <Link to="/login" className="inline-block text-sm underline">
              Back to sign in
            </Link>
          </>
        )}

        {state.kind === "error" && (
          <>
            <p className="text-sm" style={{ color: "var(--destructive)" }}>
              {state.message}
            </p>
            <Link to="/login" className="inline-block text-sm underline">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
