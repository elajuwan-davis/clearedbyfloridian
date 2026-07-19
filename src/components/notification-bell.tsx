import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { AlertsList } from "./alerts-list";

export function NotificationBell() {
  const alerts = useExpirationAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const count = alerts.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${count ? ` (${count})` : ""}`}
        className="relative p-2 rounded-[3px] hover:bg-secondary transition-colors"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        {count > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-red-600 text-white font-mono text-[9px] leading-none"
            aria-hidden
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-1rem)] bg-background border hairline rounded-[3px] shadow-2xl z-50">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Notifications
            </div>
            {count > 0 && (
              <div className="font-mono text-[10px] text-muted-foreground">{count} item{count === 1 ? "" : "s"}</div>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <AlertsList alerts={alerts} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
