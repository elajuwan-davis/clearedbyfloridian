import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Store, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StripeEmbedded } from "@/components/stripe-embedded";
import { createMarketplaceUnlockCheckout } from "@/lib/payments.functions";
import { formatUsd, getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import {
  coverageGaps,
  listMarketplaceRoster,
  marketplaceRosterCount,
  marketplaceUnlocked,
  unlockPriceCents,
  unlockPriceIsPlaceholder,
  type MarketplaceSub,
} from "@/lib/marketplace";

/**
 * Paid access to Cleard's own subcontractor roster. The roster itself is
 * withheld by RLS, not by this component — an unpaid tenant that renders the
 * list anyway simply gets nothing back from the database.
 */
export function MarketplacePanel() {
  const startCheckout = useServerFn(createMarketplaceUnlockCheckout);
  const [unlocked, setUnlocked] = useState(false);
  const [count, setCount] = useState(0);
  const [roster, setRoster] = useState<MarketplaceSub[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [n, open] = await Promise.all([marketplaceRosterCount(), marketplaceUnlocked()]);
      setCount(n);
      setUnlocked(open);
      setRoster(open ? await listMarketplaceRoster() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function fetchClientSecret(): Promise<string> {
    if (!isPaymentsConfigured()) throw new Error("Checkout unavailable");
    const result = await startCheckout({
      data: {
        returnUrl: `${window.location.origin}/portal/subcontractors?marketplace=1`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  }

  if (loading) return null;

  if (unlocked) {
    return (
      <section className="mt-8 rounded-[3px] border border-obsidian/15 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-obsidian/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-[#153157]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-obsidian/70">
              Cleard Marketplace · {roster.length} subcontractor{roster.length === 1 ? "" : "s"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-emerald-50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Unlocked
          </span>
        </div>
        {roster.length === 0 ? (
          <div className="px-5 py-6 text-sm text-obsidian/60">
            No subcontractors are listed on the marketplace yet.
          </div>
        ) : (
          <ul className="divide-y divide-obsidian/10">
            {roster.map((m) => {
              const gaps = coverageGaps(m, { coverageNeededThrough: null, w9Required: true });
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-obsidian">{m.company_name}</div>
                    <div className="text-[12px] text-obsidian/55">
                      {[m.trade, m.qualifier_name, m.license_number].filter(Boolean).join(" · ") ||
                        "—"}
                    </div>
                  </div>
                  {gaps.length ? (
                    <span
                      title={gaps.map((g) => g.message).join("; ")}
                      className="inline-flex items-center gap-1 rounded-[2px] border border-amber-600/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-700"
                    >
                      <AlertTriangle className="h-3 w-3" /> {gaps.length} coverage gap
                      {gaps.length === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-[2px] border border-emerald-600/30 bg-emerald-600/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Documents complete
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-obsidian/10 px-5 py-3 text-[12px] text-obsidian/60">
          Pick any of these on a permit — New Permit → Subcontractor per Trade → “Use a Cleard sub”.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8 rounded-[3px] border border-[#153157]/30 bg-[#B6DAEA]/15 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#153157]">
              <Lock className="h-3.5 w-3.5" /> Cleard Marketplace
            </div>
            <h2 className="display-serif mt-2 text-2xl text-obsidian">
              {count > 0
                ? `${count} vetted subcontractor${count === 1 ? "" : "s"} on Cleard's own roster`
                : "Cleard's own subcontractor roster"}
            </h2>
            <p className="mt-2 text-sm text-obsidian/70">
              One-time unlock. Licences, COIs and W-9s already on file, and you can put them
              straight onto a permit. Your own subcontractors stay free and unaffected.
            </p>
          </div>
          <div className="text-right">
            <div className="display-serif text-3xl text-obsidian">
              {formatUsd(unlockPriceCents())}
            </div>
            {unlockPriceIsPlaceholder() && (
              <div className="text-[11px] text-amber-700">Placeholder price — not yet set</div>
            )}
            <button
              type="button"
              onClick={() => {
                if (!isPaymentsConfigured()) {
                  toast.error("Payments are not configured in this environment");
                  return;
                }
                setCheckoutOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-[3px] bg-obsidian px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90"
            >
              <Store className="h-3.5 w-3.5" /> Unlock Marketplace
            </button>
          </div>
        </div>
      </section>
      {checkoutOpen && (
        <StripeEmbedded
          fetchClientSecret={fetchClientSecret}
          onClose={() => {
            setCheckoutOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
