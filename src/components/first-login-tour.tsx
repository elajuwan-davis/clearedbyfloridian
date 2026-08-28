// First-login tour: a real spotlight over real buttons, not a slideshow.
//
// Two steps live on the dashboard; the third is the actual "Generate Intake Link" button on
// /portal/subcontractors, so the tour makes exactly one route hop to get there. The hand-off
// is carried in sessionStorage so the subcontractors page can pick the tour back up on mount.
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
const PENDING_VALUE = "generate-intake-link";
const POPOVER_CLASS = "cleard-tour-popover";

const SUB_STEP_TITLE = "Invite a subcontractor";
const SUB_STEP_BODY =
  "This is how you invite a subcontractor — generate a link and send it to them; they fill in their own info and get registered.";

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
function whenPresent(selector: string, run: () => void, timeoutMs = 6000) {
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
 * Starts the dashboard leg of the tour. `onLeaveForSubcontractors` is called instead of
 * advancing in place, so the caller owns the router navigation.
 */
export function startFirstLoginTour(opts: {
  onLeaveForSubcontractors: () => void;
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
          title: "Start a new permit",
          description: "This is how you file a permit.",
        },
      },
      {
        element: '[data-tour="documents"]',
        popover: {
          title: "Compliance documents",
          description: "This is where your documents live.",
          onNextClick: () => {
            handedOff = true;
            window.sessionStorage.setItem(PENDING_KEY, PENDING_VALUE);
            d.destroy();
            opts.onLeaveForSubcontractors();
          },
        },
      },
    ],
    onDestroyed: () => {
      // Skipping, closing or finishing all end the tour for good — but not the mid-tour
      // teardown we do ourselves to cross into /portal/subcontractors.
      if (!handedOff) opts.onFinished();
    },
  });

  whenPresent('[data-tour="new-permit"]', () => d.drive());
  return d;
}

/** Third step, on /portal/subcontractors, only if the dashboard leg handed off. */
export function resumeFirstLoginTour(opts: { onFinished: () => void }): Driver | null {
  if (typeof window === "undefined") return null;
  if (window.sessionStorage.getItem(PENDING_KEY) !== PENDING_VALUE) return null;
  window.sessionStorage.removeItem(PENDING_KEY);

  const d = driver({
    ...baseOptions(),
    showProgress: false,
    steps: [
      {
        element: '[data-tour="generate-intake-link"]',
        popover: { title: SUB_STEP_TITLE, description: SUB_STEP_BODY },
      },
    ],
    onDestroyed: () => opts.onFinished(),
  });

  whenPresent('[data-tour="generate-intake-link"]', () => d.drive());
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
        onLeaveForSubcontractors: () => void navigate({ to: "/portal/subcontractors" }),
        onFinished: () => void complete().catch(() => {}),
      });
    })();

    return () => tour?.destroy();
  }, [enabled, navigate, shouldShow, complete]);
}

/** Subcontractors-page counterpart: shows the final step and marks the tour complete. */
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
