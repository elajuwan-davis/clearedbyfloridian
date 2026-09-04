// First-login tour: a real spotlight over real buttons, not a slideshow.
//
// The dashboard leg points at New Permit and at Documents, then hands off to
// /portal/permits/new, where the last step spotlights the Victoria mic in the corner — so a
// brand-new self-serve account is walked into the one thing it can do end to end: file its
// own permit. (It used to end on "Generate Intake Link", which is now a paid feature and
// would have taught a trial account to click a lock.) The hand-off is carried in
// sessionStorage so the permit page can pick the tour back up on mount.
//
// Targets are `data-tour` attributes, never class names, so restyling can't break the tour.

import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { supabase } from "@/integrations/supabase/client";
import {
  completeFirstLoginTourFn,
  shouldShowFirstLoginTourFn,
} from "@/lib/first-login-tour.functions";


const PENDING_KEY = "cleard_tour_pending_step";
const PENDING_VALUE = "victoria-permit";
const PENDING_VAULT_VALUE = "portal-logins";
const POPOVER_CLASS = "cleard-tour-popover";

const VICTORIA_TARGET = '[data-tour="victoria-permit"]';
const VICTORIA_STEP_TITLE = "Let Victoria fill the form for you";
const VICTORIA_STEP_BODY =
  "Did you know you never have to type this form? Click here and Victoria asks for each field — project, address, municipality, value, scope of work, subcontractors — you answer out loud, and she writes it in. Say “skip” to leave a field for later. Click here to give it a go.";

function baseOptions() {
  return {
    showProgress: true,
    allowClose: true,
    overlayColor: "#000000",
    overlayOpacity: 0.6,
    popoverClass: POPOVER_CLASS,
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
  } as const;
}

/** Wait for a target to exist before driving to it — pages mount their own content. */
function whenPresent(selector: string, run: () => void, timeoutMs = 8000) {
  if (typeof document === "undefined") return;
  if (document.querySelector(selector)) {
    run();
    return;
  }
  const started = Date.now();
  const timer = window.setInterval(() => {
    if (document.querySelector(selector)) {
      window.clearInterval(timer);
      run();
    } else if (Date.now() - started > timeoutMs) {
      window.clearInterval(timer);
    }
  }, 120);
}

/**
 * Starts the dashboard leg of the tour. `onLeaveForNewPermit` is called instead of advancing
 * in place, so the caller owns the router navigation.
 */
export function startFirstLoginTour(opts: {
  onLeaveForNewPermit: () => void;
  onFinished: () => void;
}): Driver | null {
  if (typeof window === "undefined") return null;
  let handedOff = false;

  const d = driver({
    ...baseOptions(),
    steps: [
      {
        element: '[data-tour="new-permit"]',
        popover: {
          title: "Start with a permit",
          description:
            "This is the job: file your own permits. Everything else on Cleard hangs off one of these — and you can fill the whole intake by voice instead of typing it.",
        },
      },
      {
        element: '[data-tour="messages"]',
        popover: {
          title: "Talk to the permit desk",
          description:
            "Questions, county comments, anything you need from us — it all runs through here, tied to the permit it belongs to.",
        },
      },
      {
        element: '[data-tour="ask-victoria"]',
        popover: {
          title: "Ask Victoria, any time",
          description:
            "Victoria is the AI that oversees your permits and helps at every step to get them cleared. Ask her what's outstanding, what a county comment means, or what to do next.",
        },
      },
      {
        element: 'a[href="/building-dept-logins"]',
        popover: {
          title: "Your building-department vault",
          description:
            "Every county and city portal login you use lives here — encrypted, in one place, and yours. Save a municipality's username and password once and you can copy them and jump straight into that portal from Cleard, instead of hunting through a spreadsheet. It's the same vault our own permit desk works out of.",
        },
      },
      {
        element: '[data-tour="documents"]',
        popover: {
          title: "Compliance documents",
          description:
            "This is where your documents live — licenses, insurance, plans. Next, let's create a permit together.",
          nextBtnText: "Create a permit",
          onNextClick: () => {
            handedOff = true;
            window.sessionStorage.setItem(PENDING_KEY, PENDING_VALUE);
            d.destroy();
            opts.onLeaveForNewPermit();
          },
        },
      },

    ],
    onDestroyed: () => {
      // Skipping, closing or finishing all end the tour for good — but not the mid-tour
      // teardown we do ourselves to cross into /portal/permits/new.
      if (!handedOff) opts.onFinished();
    },
  });

  whenPresent('[data-tour="new-permit"]', () => d.drive());
  return d;
}

/**
 * Victoria step on /portal/permits/new. Whether they finish it or skip out of creating the
 * permit, the tour hands off to the Portal Logins vault rather than just ending.
 */
export function resumeFirstLoginTour(opts: {
  onLeaveForVault: () => void;
}): Driver | null {
  if (typeof window === "undefined") return null;
  if (window.sessionStorage.getItem(PENDING_KEY) !== PENDING_VALUE) return null;
  window.sessionStorage.removeItem(PENDING_KEY);

  const d = driver({
    ...baseOptions(),
    showProgress: false,
    steps: [
      {
        element: VICTORIA_TARGET,
        popover: {
          title: VICTORIA_STEP_TITLE,
          description: VICTORIA_STEP_BODY,
          doneBtnText: "Next: your vault",
        },
      },
    ],
    onDestroyed: () => {
      window.sessionStorage.setItem(PENDING_KEY, PENDING_VAULT_VALUE);
      opts.onLeaveForVault();
    },
  });

  // The mic renders only where the browser has speech recognition; if it never appears the
  // tour simply ends here rather than spotlighting nothing.
  whenPresent(VICTORIA_TARGET, () => d.drive());
  return d;
}

/**
 * Dashboard hook: runs the tour once per tenant, gated on `tenants.tour_completed_at`.
 * Finishing or skipping marks it complete, so it never returns.
 */
export function useFirstLoginTour(enabled: boolean) {
  const navigate = useNavigate();
  const shouldShow = useServerFn(shouldShowFirstLoginTourFn);
  const complete = useServerFn(completeFirstLoginTourFn);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    let tour: Driver | null = null;

    void (async () => {
      try {
        const res = await shouldShow();
        if (!res?.show) return;
      } catch {
        // Tour state unavailable (e.g. migration not applied yet) — skip it silently.
        return;
      }
      tour = startFirstLoginTour({
        onLeaveForNewPermit: () => void navigate({ to: "/portal/permits/new" }),
        onFinished: () => void complete().catch(() => {}),
      });
    })();

    return () => tour?.destroy();
  }, [enabled, navigate, shouldShow, complete]);
}

/**
 * Vault leg, on /building-dept-logins — the last stop of the tour. Runs only if the New Permit
 * leg handed off (finished or skipped), then marks the whole tour complete.
 */
export function resumeVaultTour(opts: { onFinished: () => void }): Driver | null {
  if (typeof window === "undefined") return null;
  if (window.sessionStorage.getItem(PENDING_KEY) !== PENDING_VAULT_VALUE) return null;
  window.sessionStorage.removeItem(PENDING_KEY);

  const d = driver({
    ...baseOptions(),
    showProgress: false,
    steps: [
      {
        element: '[data-tour="add-portal-login"]',
        popover: {
          title: "This vault is yours",
          description:
            "No permit yet? Start here instead. Save a county or city ePermitting login once — portal link, username, password — and it is encrypted and kept in your own vault. From then on you copy the credentials and jump straight into that portal from Cleard, instead of digging through a spreadsheet.",
          doneBtnText: "Got it",
        },
      },
    ],
    onDestroyed: () => opts.onFinished(),
  });

  whenPresent('[data-tour="add-portal-login"]', () => d.drive());
  return d;
}

/** New Permit counterpart: shows the Victoria step, then walks them to the vault. */
export function useFirstLoginTourResume() {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tour = resumeFirstLoginTour({
      onLeaveForVault: () => void navigate({ to: "/building-dept-logins" }),
    });
    return () => tour?.destroy();
  }, [navigate]);
}

/** Portal Logins counterpart: final step, and marks the tour complete. */
export function useFirstLoginTourVault() {
  const complete = useServerFn(completeFirstLoginTourFn);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tour = resumeVaultTour({
      onFinished: () => void complete().catch(() => {}),
    });
    return () => tour?.destroy();
  }, [complete]);
}
