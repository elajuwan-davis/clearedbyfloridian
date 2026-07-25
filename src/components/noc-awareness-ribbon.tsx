import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

/**
 * Dismissible info ribbon telling a subcontractor (or GC adding subs) that
 * an NOC is already on file for this project — no duplicate filing needed.
 * Dismissal is per-project in sessionStorage.
 */
export function NocAwarenessRibbon({ scopeKey }: { scopeKey: string }) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const storageKey = `noc-ribbon-dismissed:${scopeKey}`;

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (dismissed !== false) return null;

  return (
    <div className="flex items-start gap-3 border-l-2 border-[#153157] bg-obsidian/[0.04] px-4 py-3 text-[13px] text-obsidian/85 rounded-[3px]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/70" />
      <div className="flex-1">
        <span className="font-medium text-obsidian">Notice of Commencement on file.</span>{" "}
        A Notice of Commencement is already on file for this project. You do not need to file a separate NOC.
      </div>
      <button
        type="button"
        onClick={() => {
          try { sessionStorage.setItem(storageKey, "1"); } catch {}
          setDismissed(true);
        }}
        className="text-obsidian/40 hover:text-obsidian"
        aria-label="Dismiss NOC notice"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
