import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, Share2 } from "lucide-react";
import { INVESTOR_PASSCODE } from "@/lib/investor-access";
import { DeckViewer, OAT, SLATE } from "@/components/pitch-deck-viewer";
import { DeckSharePanel } from "@/components/deck-share-panel";

export const Route = createFileRoute("/pitch-deck")({
  head: () => ({
    meta: [
      { title: "Pitch Deck — Cleard" },
      { name: "description", content: "Private investor pitch deck for Cleard. Passcode required." },
      { property: "og:title", content: "Pitch Deck — Cleard" },
      { property: "og:description", content: "Private investor pitch deck for Cleard. Passcode required." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PitchDeckPage,
});

function PitchDeckPage() {
  /* Deliberately not persisted: the passcode is required on every visit. */
  const [unlocked, setUnlocked] = useState(false);
  const [share, setShare] = useState(false);

  if (!unlocked) return <Gate onPass={() => setUnlocked(true)} />;

  return (
    <>
      <DeckViewer
        footer={
          <button
            type="button"
            data-plain
            onClick={() => setShare(true)}
            className="inline-flex items-center gap-1.5 opacity-70 hover:opacity-100"
          >
            <Share2 className="h-4 w-4" strokeWidth={1.6} /> Share
          </button>
        }
      />
      {share && <DeckSharePanel onClose={() => setShare(false)} />}
    </>
  );
}

function Gate({ onPass }: { onPass: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  return (
    <div className="cl-public flex min-h-screen items-center justify-center px-6" style={{ background: SLATE }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim() === INVESTOR_PASSCODE) onPass();
          else setError(true);
        }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-2" style={{ color: OAT }}>
          <Lock className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-[0.22em]">Private</span>
        </div>
        <h1 className="mt-4 text-2xl" style={{ color: OAT, fontWeight: 500 }}>
          Pitch deck
        </h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(250,243,230,0.7)" }}>
          Enter the passcode to view the deck.
        </p>
        <input
          type="password"
          value={code}
          autoFocus
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          className="mt-6 w-full px-3 py-2.5 text-sm outline-none"
          style={{
            border: "1px solid rgba(250,243,230,0.35)",
            background: OAT,
            color: "#111110",
            caretColor: "#111110",
          }}
        />
        {error && (
          <div className="mt-2 text-[12.5px]" style={{ color: "#E9A0A0" }}>
            Incorrect passcode.
          </div>
        )}
        <button type="submit" className="mt-4 w-full px-4 py-2.5 text-[13.5px]" style={{ background: OAT, color: SLATE, fontWeight: 600 }}>
          View deck
        </button>
      </form>
    </div>
  );
}
