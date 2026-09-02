// Payment authorization for the 3-month free trial.
//
// Two surfaces, one data source (getTrialBillingStatusFn):
//   • TrialBillingPrompt — the dialog. Appears once, after the first-login walkthrough is
//     finished, for a trial tenant with no card on file. Skippable exactly once.
//   • TrialBillingBanner — the persistent dashboard ask: days left, first charge date, and
//     "Authorize payment". Turns into a quiet confirmation once a card is on file.
//
// Stripe holds the trial clock (trial_period_days = days LEFT of the 90 from sign-up), so the
// first charge lands 3 months after sign-up regardless of when the card was added.

import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, Check, Loader2, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { StripeEmbedded } from "@/components/stripe-embedded";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { usePlanAccess } from "@/lib/plan-access";
import {
  dismissTrialCardPromptFn,
  getTrialBillingStatusFn,
  startTrialSubscriptionCheckoutFn,
  type TrialBillingStatus,
} from "@/lib/trial-billing.functions";
import { TRIAL_PLANS, formatMonthly, planForPriceId } from "@/lib/trial-plans";

const SESSION_SHOWN_KEY = "cleard_trial_card_prompt_shown";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";
}

function useTrialBilling() {
  const load = useServerFn(getTrialBillingStatusFn);
  const [status, setStatus] = useState<TrialBillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isPaymentsConfigured()) {
      setLoading(false);
      return;
    }
    try {
      const res = await load({ data: { environment: getStripeEnvironment() } });
      setStatus(res);
    } catch {
      // Fail quiet: billing state is never allowed to break the portal.
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, refresh };
}

/* ───────────────────────── tier picker + embedded checkout ───────────────────────── */

function TierPicker({
  status,
  onDone,
  onSkip,
  skipLabel,
}: {
  status: TrialBillingStatus;
  onDone: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const startCheckout = useServerFn(startTrialSubscriptionCheckoutFn);
  const [selected, setSelected] = useState(TRIAL_PLANS[1]!.priceId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    const res = await startCheckout({
      data: {
        priceId: selected,
        returnUrl: `${window.location.origin}/portal/billing?trial=authorized`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in res) throw new Error(res.error);
    if (!res.clientSecret) throw new Error("Stripe did not return a checkout session");
    return res.clientSecret;
  }, [selected, startCheckout]);

  return (
    <>
      <div className="space-y-2">
        {TRIAL_PLANS.map((p) => {
          const active = p.priceId === selected;
          return (
            <button
              key={p.priceId}
              type="button"
              onClick={() => setSelected(p.priceId)}
              className="w-full rounded-xl border p-3 text-left transition-colors"
              style={{
                borderColor: active ? "var(--p-accent, var(--primary))" : "var(--p-border)",
                backgroundColor: active ? "var(--rail-item-active-bg)" : "var(--card)",
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-foreground">
                  {p.name}
                  {p.popular && <span className="p-chip p-chip-info ml-2">Most chosen</span>}
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-foreground">
                  {formatMonthly(p.monthlyCents)}
                </span>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">{p.tagline}</div>
              <ul className="mt-2 space-y-1">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[12px] text-muted-foreground">
                    <Check className="mt-[3px] h-3 w-3 shrink-0" strokeWidth={2} />
                    {h}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-[2px] h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        Your card is authorized now and <strong className="font-semibold">not charged</strong>{" "}
        during the free trial. Your first payment is{" "}
        {formatMonthly(TRIAL_PLANS.find((p) => p.priceId === selected)!.monthlyCents)} on{" "}
        {fmtDate(status.trialEndsAt)} — {status.daysLeft} day
        {status.daysLeft === 1 ? "" : "s"} from today. Cancel any time before then and nothing is
        taken.
      </p>

      {error && <div className="mt-2 text-[12px] text-red-600">{error}</div>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="p-btn p-btn-primary"
          onClick={() => {
            setError(null);
            setCheckoutOpen(true);
          }}
        >
          <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
          Add card & start trial
        </button>
        {onSkip && (
          <button type="button" className="p-btn" onClick={onSkip}>
            {skipLabel ?? "I'll add it later"}
          </button>
        )}
      </div>

      {checkoutOpen && (
        <StripeEmbedded
          fetchClientSecret={async () => {
            try {
              return await fetchClientSecret();
            } catch (e) {
              setCheckoutOpen(false);
              setError(e instanceof Error ? e.message : "Could not open checkout");
              throw e;
            }
          }}
          onClose={() => {
            setCheckoutOpen(false);
            onDone();
          }}
        />
      )}
    </>
  );
}

/* ───────────────────────────────── the one-time dialog ───────────────────────────────── */

export function TrialBillingPrompt() {
  const plan = usePlanAccess();
  const { status, refresh } = useTrialBilling();
  const dismiss = useServerFn(dismissTrialCardPromptFn);
  const [closed, setClosed] = useState(false);

  const eligible =
    !!status &&
    plan.isTrial &&
    status.plan === "trial" &&
    status.tourCompleted &&
    !status.cardOnFile &&
    !status.promptDismissed;

  useEffect(() => {
    if (eligible && typeof window !== "undefined") {
      if (window.sessionStorage.getItem(SESSION_SHOWN_KEY) === "1") setClosed(true);
      else window.sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
    }
  }, [eligible]);

  if (!eligible || closed || !status) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-auto bg-black/70 p-4">
      <div
        className="mt-10 w-full max-w-lg rounded-2xl border p-5"
        style={{ borderColor: "var(--p-border)", backgroundColor: "var(--card)" }}
      >
        <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          3 months free
        </div>
        <h2 className="mt-1 text-[18px] font-semibold text-foreground">
          Authorize payment to start your free trial.
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Pick the plan you want to be on when the trial ends. Nothing is charged for the next{" "}
          {status.daysLeft} days — your card is only kept on file so the account keeps running
          without a gap.
        </p>

        <div className="mt-4">
          <TierPicker
            status={status}
            onDone={() => {
              setClosed(true);
              void refresh();
            }}
            onSkip={() => {
              setClosed(true);
              void dismiss().catch(() => {});
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── persistent dashboard ask ─────────────────────────────── */

export function TrialBillingBanner() {
  const plan = usePlanAccess();
  const { status, refresh } = useTrialBilling();
  const [open, setOpen] = useState(false);

  if (!plan.isTrial || !status || status.plan !== "trial") return null;

  if (status.cardOnFile) {
    const picked = planForPriceId(status.priceId);
    return (
      <div
        className="mb-3 rounded-xl border p-4"
        style={{ borderColor: "var(--p-border)", backgroundColor: "var(--card)" }}
      >
        <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
          Free trial active{picked ? ` · ${picked.name}` : ""}
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          {status.daysLeft} day{status.daysLeft === 1 ? "" : "s"} left. Your first payment
          {picked ? ` of ${formatMonthly(picked.monthlyCents)}` : ""} is on{" "}
          {fmtDate(status.currentPeriodEnd ?? status.trialEndsAt)}. Manage or cancel any time in{" "}
          <Link to="/portal/billing" className="underline">
            Billing
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className="mb-3 rounded-xl border p-4"
      style={{ borderColor: "var(--p-border)", backgroundColor: "var(--card)" }}
    >
      <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
        <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
        {status.daysLeft > 0
          ? `${status.daysLeft} days left of your free trial`
          : "Your free trial has ended"}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        {status.daysLeft > 0
          ? `Add a card to keep the account running when the trial ends on ${fmtDate(status.trialEndsAt)}. Nothing is charged until then.`
          : "Add a card to keep filing permits with Cleard."}
      </p>
      {open ? (
        <div className="mt-3">
          <TrialBillingBannerPicker status={status} onDone={() => void refresh()} />
        </div>
      ) : (
        <button type="button" className="p-btn p-btn-primary mt-3" onClick={() => setOpen(true)}>
          <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />
          Authorize payment
        </button>
      )}
    </div>
  );
}

function TrialBillingBannerPicker({
  status,
  onDone,
}: {
  status: TrialBillingStatus;
  onDone: () => void;
}) {
  return <TierPicker status={status} onDone={onDone} />;
}

/* ───────────────────── hard gate: a card is required to file a permit ───────────────────── */

/**
 * Blocks a trial account with no card on file from creating a permit. Fails open: if payments
 * aren't configured, the status can't be read, or the tenant is on a full plan, it renders the
 * page as normal — nobody is locked out by a billing lookup.
 */
export function TrialCardRequiredGate({ children }: { children: React.ReactNode }) {
  const plan = usePlanAccess();
  const { status, loading, refresh } = useTrialBilling();

  if (!isPaymentsConfigured() || loading) return <>{children}</>;
  if (!status || !plan.isTrial || status.plan !== "trial" || status.cardOnFile) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg py-8">
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--p-border)", backgroundColor: "var(--card)" }}
      >
        <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Payment authorization required
        </div>
        <h2 className="mt-1 text-[18px] font-semibold text-foreground">
          Add your card to file a permit.
        </h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Your 3-month free trial is running
          {status.daysLeft > 0 ? ` — ${status.daysLeft} days left` : ""}. Filing permits needs a
          card on file first. Nothing is charged until{" "}
          {fmtDate(status.trialEndsAt)}.
        </p>
        <div className="mt-4">
          <TierPicker status={status} onDone={() => void refresh()} />
        </div>
      </div>
    </div>
  );
}

/** Small inline spinner used while billing state resolves on the Billing page. */
export function TrialBillingLoading() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking your trial…
    </div>
  );
}
