import { RefreshCw } from "lucide-react";

/**
 * Shown ONLY for the missing-backend-env-var case (see src/lib/env-error.ts).
 * Every other error still renders as a normal hard error so real bugs stay visible.
 */
export function BackendReconnecting({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mt-8 rounded-[3px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800">
        Reconnecting
      </div>
      <p className="mt-2">
        The backend connection is re-establishing. No data was lost — this clears on its own
        within a few seconds.
      </p>
      <button
        type="button"
        onClick={() => (onRetry ? onRetry() : window.location.reload())}
        className="mt-3 inline-flex items-center gap-2 rounded-[3px] border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Retry
      </button>
    </div>
  );
}
