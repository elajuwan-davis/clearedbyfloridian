import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { useCallback } from "react";

type Fetcher = () => Promise<string>;

export function StripeEmbedded({ fetchClientSecret, onClose }: {
  fetchClientSecret: Fetcher;
  onClose: () => void;
}) {
  const options = { fetchClientSecret: useCallback(fetchClientSecret, [fetchClientSecret]) };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-auto p-4">
      <div className="w-full max-w-2xl bg-white rounded-[3px] shadow-2xl mt-8">
        <div className="flex items-center justify-between px-5 py-3 border-b border-obsidian/10">
          <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-obsidian/60">
            Secure checkout · Stripe
          </div>
          <button
            onClick={onClose}
            className="text-obsidian/60 hover:text-obsidian text-sm"
          >
            Close
          </button>
        </div>
        <div className="p-2">
          <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
