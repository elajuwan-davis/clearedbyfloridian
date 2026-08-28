// The lock a trial (self-serve) tenant sees where a paid feature would be.
//
// Two shapes, same copy and same request path:
//   <LockedFeatureNotice>  — replaces a whole page (Lien Rights, COI requests)
//   <LockedFeatureButton>  — sits where a single control was (Generate Intake Link, Verify)
//
// Both explain what the feature *does* first, then that it isn't on the plan, then offer to
// ask for it. The request is a real row (feature_requests, the same queue staff already work
// in /admin/feature-requests) — not a mailto and not a toast that goes nowhere.

import { useState, type ReactNode } from "react";
import { Lock, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { createRequest } from "@/lib/feature-requests-api";
import { FEATURE_COPY, usePlanAccess, type GatedFeature } from "@/lib/plan-access";

type LockCopy = { title: string; does: string; area: string };

function useAccessRequest(copy: LockCopy) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  async function request() {
    if (state !== "idle") return;
    setState("sending");
    try {
      await createRequest({
        request_type: "Other",
        title: `Access request: ${copy.title}`,
        areas: [copy.area],
        description: `Requested access to ${copy.title} from the in-app lock. This feature is not included in the tenant's current plan.`,
        workflow_impact: "Needs this feature to run jobs on Cleard.",
        priority: "Would use regularly",
      });
      setState("sent");
      toast.success("Access requested — our team will be in touch.");
    } catch (e) {
      setState("idle");
      toast.error("Could not send that request: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return { state, request, copy };
}

const BTN =
  "inline-flex items-center gap-2 rounded-[3px] bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 disabled:cursor-default disabled:opacity-60";

function RequestButton({
  state,
  onClick,
  className,
}: {
  state: "idle" | "sending" | "sent";
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== "idle"}
      className={className ?? BTN}
    >
      {state === "sending" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === "sent" ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      )}
      {state === "sent" ? "Access requested" : "Request access"}
    </button>
  );
}

/** Full-page lock: what it does, that it's locked, and how to ask for it. */
export function LockedFeatureNotice({
  feature,
  children,
}: {
  feature: GatedFeature;
  /** Optional extra context under the copy (e.g. what the GC can do meanwhile). */
  children?: ReactNode;
}) {
  return <LockedPageNotice copy={FEATURE_COPY[feature]}>{children}</LockedPageNotice>;
}

/**
 * Same full-page lock for a page that isn't one of the four named features — every other
 * portal section a trial plan doesn't include. `copy.title` is the page's own name, so the
 * request that reaches staff says which page was wanted.
 */
export function LockedPageNotice({ copy, children }: { copy: LockCopy; children?: ReactNode }) {
  const { state, request } = useAccessRequest(copy);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="rounded-[3px] border border-obsidian/15 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">
          <Lock className="h-3.5 w-3.5" /> Not on your plan
        </div>
        <h1 className="display-serif mt-3 text-3xl text-obsidian sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-obsidian/70">{copy.does}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-obsidian/70">
          It isn't included in your plan right now, so it's locked. Request access and our team will
          turn it on for your company.
        </p>
        {children}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <RequestButton state={state} onClick={request} />
          <span className="text-[12px] text-obsidian/50">
            Filing your own permits stays fully available.
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps a whole page: renders it for a tenant whose plan includes the feature, and the lock
 * for one whose doesn't. Renders nothing while the plan is still loading, so a paid page
 * never flashes a lock at the tenant who owns it.
 */
export function PlanGate({ feature, children }: { feature: GatedFeature; children: ReactNode }) {
  const plan = usePlanAccess();
  if (plan.loading) return null;
  if (plan.allows(feature)) return <>{children}</>;
  return <LockedFeatureNotice feature={feature} />;
}

/**
 * Inline lock for a single control. Renders the button as locked; clicking opens the same
 * explanation in a small panel instead of running the feature.
 */
export function LockedFeatureButton({
  feature,
  label,
  icon,
  className,
}: {
  feature: GatedFeature;
  label: string;
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const copy = FEATURE_COPY[feature];
  const { state, request } = useAccessRequest(copy);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`${copy.title} isn't on your plan`}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-[3px] border border-obsidian/20 bg-obsidian/[0.03] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55"
        }
      >
        <Lock className="h-3.5 w-3.5" />
        {icon}
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-[3px] border border-obsidian/15 bg-white p-4 shadow-[0_24px_60px_-24px_rgba(47,79,79,0.45)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian/55">
            Locked
          </div>
          <div className="display-serif mt-1.5 text-lg text-obsidian">{copy.title}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-obsidian/70">{copy.does}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-obsidian/70">
            It isn't on your plan yet.
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <RequestButton state={state} onClick={request} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 hover:text-obsidian"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
