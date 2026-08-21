import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Lock, ShieldCheck } from "lucide-react";
import { peekDeckInvite, verifyDeckInvite } from "@/lib/deck-invites.functions";
import { DeckViewer, OAT, SLATE } from "@/components/pitch-deck-viewer";

export const Route = createFileRoute("/pitch-deck_/$token")({
  head: () => ({
    meta: [
      { title: "Private Pitch Deck — Cleard" },
      { name: "description", content: "Invitation-only Cleard investor pitch deck. Link and passcode expire in 7 days." },
      { property: "og:title", content: "Private Pitch Deck — Cleard" },
      { property: "og:description", content: "Invitation-only Cleard investor pitch deck." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InvitePitchDeck,
});

type State =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "revoked" }
  | { status: "expired"; expiresAt: string }
  | { status: "active"; passcode: string; expiresAt: string; label: string };

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

function InvitePitchDeck() {
  const { token } = Route.useParams();
  const [state, setState] = useState<State>({ status: "loading" });
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    peekDeckInvite({ data: { token } })
      .then((r) => {
        if (!cancelled) setState(r as State);
      })
      .catch(() => {
        if (!cancelled) setState({ status: "invalid" });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (unlocked && state.status === "active") {
    return (
      <DeckViewer
        footer={<span>Expires in {daysLeft(state.expiresAt)}d</span>}
      />
    );
  }

  return (
    <div className="cl-public flex min-h-screen items-center justify-center px-6" style={{ background: OAT }}>
      {state.status === "loading" && (
        <div className="text-sm" style={{ color: "rgba(47,79,79,0.7)" }}>
          Checking your invitation…
        </div>
      )}
      {(state.status === "invalid" || state.status === "revoked" || state.status === "expired") && (
        <Dead state={state} />
      )}
      {state.status === "active" && <Unlock token={token} invite={state} onPass={() => setUnlocked(true)} />}
    </div>
  );
}

function Dead({ state }: { state: Extract<State, { status: "invalid" | "revoked" | "expired" }> }) {
  const copy =
    state.status === "expired"
      ? "This invitation expired. Links and passcodes are valid for 7 days only."
      : state.status === "revoked"
        ? "Access to this invitation has been revoked."
        : "This invitation link is not valid.";
  return (
    <div className="w-full max-w-sm text-center">
      <Lock className="mx-auto h-5 w-5" strokeWidth={1.5} style={{ color: SLATE }} />
      <h1 className="mt-4 text-2xl" style={{ color: SLATE, fontWeight: 500 }}>
        Access closed
      </h1>
      <p className="mt-2 text-sm" style={{ color: "rgba(47,79,79,0.7)" }}>
        {copy} Please request a new link from the Cleard team.
      </p>
      <Link to="/" className="mt-6 inline-block px-4 py-2.5 text-[13.5px]" style={{ background: "#673147", color: OAT, fontWeight: 600 }}>
        Back to cleardinc.com
      </Link>
    </div>
  );
}

function Unlock({
  token,
  invite,
  onPass,
}: {
  token: string;
  invite: Extract<State, { status: "active" }>;
  onPass: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await verifyDeckInvite({ data: { token, passcode: code } });
      if (r.ok) onPass();
      else setError(r.reason ?? "Incorrect passcode.");
    } catch {
      setError("Could not verify the passcode. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md p-7" style={{ background: "#F3EAD9", border: "1px solid #E0D3BC", color: SLATE }}>
      <div className="flex items-center gap-2" style={{ color: SLATE }}>
        <ShieldCheck className="h-4 w-4" strokeWidth={1.6} />
        <span className="text-[11px] uppercase tracking-[0.22em]">Your one-time password</span>
      </div>
      <h1 className="mt-3 text-2xl" style={{ fontWeight: 600 }}>
        Welcome{invite.label ? `, ${invite.label}` : ""}
      </h1>
      <p className="mt-2 text-[13.5px] opacity-75">
        Copy the passcode below and paste it in to open the Cleard investor deck. This link and passcode both expire in{" "}
        {daysLeft(invite.expiresAt)} day{daysLeft(invite.expiresAt) === 1 ? "" : "s"} (on{" "}
        {new Date(invite.expiresAt).toLocaleDateString()}) and will stop working after that.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <div
          className="flex-1 px-3 py-3 text-center text-lg tracking-[0.32em]"
          style={{ background: "rgba(47,79,79,0.1)", fontWeight: 600 }}
        >
          {invite.passcode}
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(invite.passcode);
            setCopied(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-3 text-[13px]"
          style={{ border: `1px solid ${SLATE}`, color: SLATE, fontWeight: 600 }}
        >
          <Copy className="h-4 w-4" strokeWidth={1.7} /> {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <form onSubmit={submit} className="mt-5">
        <label className="text-[11px] uppercase tracking-[0.18em]" style={{ color: SLATE }}>
          Paste passcode
        </label>
        <input
          value={code}
          autoFocus
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Passcode"
          className="mt-2 w-full px-3 py-2.5 text-sm tracking-[0.2em] outline-none"
          style={{ border: "1px solid rgba(47,79,79,0.35)", background: "#fff" }}
        />
        {error && (
          <div className="mt-2 text-[12.5px]" style={{ color: "#673147" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="mt-4 w-full px-4 py-2.5 text-[13.5px]"
          style={{ background: "#673147", color: OAT, fontWeight: 600, opacity: busy || !code.trim() ? 0.6 : 1 }}
        >
          {busy ? "Verifying…" : "Open the deck"}
        </button>
      </form>

      <p className="mt-4 text-[11.5px] opacity-55">
        This deck is confidential and shared by invitation only. Please do not forward this link.
      </p>
    </div>
  );
}
