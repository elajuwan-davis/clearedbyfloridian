import { useState } from "react";
import { Copy, Link2, Loader2, X } from "lucide-react";
import { createDeckInvite, listDeckInvites, revokeDeckInvite } from "@/lib/deck-invites.functions";

const SLATE = "#2F4F4F";
const OAT = "#FAF3E6";

type Invite = {
  id: string;
  token: string;
  passcode: string;
  label: string;
  expires_at: string;
  revoked: boolean;
  view_count: number;
  last_viewed_at: string | null;
};

const SHARE_ORIGIN = "https://cleardinc.com";

function linkFor(token: string) {
  return `${SHARE_ORIGIN}/pitch-deck/${token}`;
}

function copy(text: string) {
  void navigator.clipboard?.writeText(text);
}

export function DeckSharePanel({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [label, setLabel] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(pw: string) {
    setBusy(true);
    setError(null);
    try {
      const rows = (await listDeckInvites({ data: { password: pw } })) as Invite[];
      setInvites(rows);
      setAuthed(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(/unauthorized/i.test(msg) ? "Incorrect password." : `Could not load invites: ${msg || "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    if (!label.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createDeckInvite({ data: { password, label: label.trim() } });
      setLabel("");
      await load(password);
    } catch (e) {
      setError(`Could not create the invite: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    try {
      await revokeDeckInvite({ data: { password, id } });
      await load(password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-6" style={{ background: "rgba(17,17,16,0.6)" }}>
      <div className="w-full max-w-2xl p-6" style={{ background: OAT, color: "#111110" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em]" style={{ color: SLATE }}>
              Investor access
            </div>
            <h2 className="mt-1 text-xl" style={{ fontWeight: 600 }}>
              Share the pitch deck
            </h2>
            <p className="mt-1 text-[13px] opacity-70">
              Each link comes with its own one-time passcode. Both stop working 7 days after they are created.
            </p>
          </div>
          <button type="button" data-plain aria-label="Close" onClick={onClose} className="p-1">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {!authed ? (
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void load(password);
            }}
          >
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="flex-1 px-3 py-2.5 text-sm outline-none"
              style={{ border: "1px solid rgba(47,79,79,0.35)", background: "#fff" }}
            />
            <button type="submit" disabled={busy} className="px-4 py-2.5 text-[13.5px]" style={{ background: SLATE, color: OAT, fontWeight: 600 }}>
              {busy ? "Checking…" : "Continue"}
            </button>
          </form>
        ) : (
          <>
            <form
              className="mt-6 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void generate();
              }}
            >
              <input
                autoFocus
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Who is this for? e.g. Jane Doe, Acme Ventures"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
                style={{ border: "1px solid rgba(47,79,79,0.35)", background: "#fff" }}
              />
              <button
                type="submit"
                disabled={busy || !label.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[13.5px]"
                style={{ background: SLATE, color: OAT, fontWeight: 600 }}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" strokeWidth={1.7} />}
                Generate link
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {invites.length === 0 && <div className="text-[13px] opacity-60">No invites yet.</div>}
              {invites.map((inv) => {
                const expired = new Date(inv.expires_at).getTime() <= Date.now();
                const dead = expired || inv.revoked;
                return (
                  <div key={inv.id} className="p-3" style={{ border: "1px solid rgba(47,79,79,0.25)", opacity: dead ? 0.55 : 1 }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13.5px]" style={{ fontWeight: 600 }}>
                        {inv.label}
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: SLATE }}>
                        {inv.revoked ? "Revoked" : expired ? "Expired" : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        readOnly
                        value={linkFor(inv.token)}
                        className="min-w-[240px] flex-1 px-2 py-1.5 text-[12px]"
                        style={{ border: "1px solid rgba(47,79,79,0.2)", background: "#fff" }}
                      />
                      <button type="button" onClick={() => copy(linkFor(inv.token))} className="inline-flex items-center gap-1 px-2 py-1.5 text-[12px]" style={{ border: "1px solid rgba(47,79,79,0.35)" }}>
                        <Copy className="h-3.5 w-3.5" /> Link
                      </button>
                      <span className="px-2 py-1.5 text-[12px] tracking-[0.18em]" style={{ background: "rgba(47,79,79,0.1)" }}>
                        {inv.passcode}
                      </span>
                      <button type="button" onClick={() => copy(inv.passcode)} className="inline-flex items-center gap-1 px-2 py-1.5 text-[12px]" style={{ border: "1px solid rgba(47,79,79,0.35)" }}>
                        <Copy className="h-3.5 w-3.5" /> Code
                      </button>
                      {!dead && (
                        <button type="button" onClick={() => void revoke(inv.id)} className="px-2 py-1.5 text-[12px]" style={{ border: "1px solid rgba(103,49,71,0.5)", color: "#673147" }}>
                          Revoke
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-[11.5px] opacity-60">
                      {inv.view_count > 0
                        ? `Viewed ${inv.view_count}× · last ${new Date(inv.last_viewed_at ?? inv.expires_at).toLocaleString()}`
                        : "Not opened yet"}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {error && (
          <div className="mt-3 text-[12.5px]" style={{ color: "#673147" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
