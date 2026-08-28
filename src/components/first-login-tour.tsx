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
import {
  completeFirstLoginTourFn,
  shouldShowFirstLoginTourFn,
} from "@/lib/first-login-tour.functions";

const PENDING_KEY = "cleard_tour_pending_step";
const PENDING_VALUE = "victoria-permit";
const POPOVER_CLASS = "cleard-tour-popover";

const VICTORIA_TARGET = '[data-tour="victoria-permit"]';
const VICTORIA_STEP_TITLE = "Or just talk it through";
const VICTORIA_STEP_BODY =
  "Tap Victoria and say your answers out loud — the project, the address, the municipality, the value — and she fills each field for you as you speak. Typing works exactly as before.";

function baseOptions() {
  return {
    showProgress: true,
    allowClose: true,
    overlayColor: "#2F4F4F",
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
            "This is the job: file your own permits. Everything else on Cleard hangs off one of these.",
        },
      },
      {
        element: '[data-tour="documents"]',
        popover: {
          title: "Compliance documents",
          description: "This is where your documents live.",
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

/** Last step, on /portal/permits/new, only if the dashboard leg handed off. */
export function resumeFirstLoginTour(opts: { onFinished: () => void }): Driver | null {
  if (typeof window === "undefined") return null;
  if (window.sessionStorage.getItem(PENDING_KEY) !== PENDING_VALUE) return null;
  window.sessionStorage.removeItem(PENDING_KEY);

  const d = driver({
    ...baseOptions(),
    showProgress: false,
    steps: [
      {
        element: VICTORIA_TARGET,
        popover: { title: VICTORIA_STEP_TITLE, description: VICTORIA_STEP_BODY },
      },
    ],
    onDestroyed: () => opts.onFinished(),
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

/** New Permit counterpart: shows the final step and marks the tour complete. */
export function useFirstLoginTourResume() {
  const complete = useServerFn(completeFirstLoginTourFn);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tour = resumeFirstLoginTour({
      onFinished: () => void complete().catch(() => {}),
    });
    return () => tour?.destroy();
  }, [complete]);
}
