import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { lookupInviteFn } from "@/lib/tenants.functions";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/public-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/join_/$token")({
  head: () => ({
    meta: [
      { title: "Join your team — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JoinByTokenPage,
});

function JoinByTokenPage() {
  const { token } = Route.useParams();
  const lookup = useServerFn(lookupInviteFn);
  const [state, setState] = useState<{ valid: boolean; tenant_name?: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    lookup({ data: { token } })
      .then((r) => setState(r as any))
      .catch(() => setState({ valid: false }));
  }, [token, lookup]);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            invite_token: token,
            role: "gc_member",
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) throw error;
      toast.success("Check your email to confirm your account.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setBusy(false);
    }
  }

  if (state === null) {
    return <PublicShell><div className="max-w-md mx-auto py-24 text-center text-obsidian/60">Loading invite…</div></PublicShell>;
  }
  if (!state.valid) {
    return (
      <PublicShell>
        <div className="max-w-md mx-auto py-24 text-center">
          <h1 className="display-serif text-3xl text-obsidian">Invite unavailable</h1>
          <p className="mt-3 text-sm text-obsidian/60">This invite link has been revoked or is invalid. Ask your team owner for a new link.</p>
          <Link to="/" className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian underline underline-offset-2">Back to Cleard</Link>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="max-w-md mx-auto py-16">
        <div className="label-eyebrow text-obsidian/60">◇ Team Invite</div>
        <h1 className="mt-3 display-serif text-3xl text-obsidian">Join {state.tenant_name}</h1>
        <p className="mt-2 text-sm text-obsidian/60">
          Create your Cleard account. You&rsquo;ll be added to <span className="font-semibold">{state.tenant_name}</span> automatically.
        </p>
        <form onSubmit={signUp} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label-eyebrow text-obsidian/60">First name</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                className="mt-1.5 w-full border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none" />
            </label>
            <label className="block">
              <span className="label-eyebrow text-obsidian/60">Last name</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required
                className="mt-1.5 w-full border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none" />
            </label>
          </div>
          <label className="block">
            <span className="label-eyebrow text-obsidian/60">Work email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1.5 w-full border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none" />
          </label>
          <label className="block">
            <span className="label-eyebrow text-obsidian/60">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required
              className="mt-1.5 w-full border border-obsidian/15 bg-white px-3 py-2 text-sm rounded-[3px] focus:border-obsidian/40 focus:outline-none" />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-obsidian px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px] disabled:opacity-60"
          >
            {busy ? "Creating account…" : `Join ${state.tenant_name}`}
          </button>
        </form>
      </div>
    </PublicShell>
  );
}
