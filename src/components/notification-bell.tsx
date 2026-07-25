import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { AlertsList } from "./alerts-list";
import { listNotifications, markAllRead, type NotifRow } from "@/lib/notifications-api";

export function NotificationBell() {
  const alerts = useExpirationAlerts();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    listNotifications(20)
      .then((rows) => { if (!cancelled) setNotifs(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unreadDb = notifs.filter((n) => !n.read_at).length;
  const count = alerts.length + unreadDb;

  async function onOpen() {
    setOpen((v) => !v);
    if (!open && unreadDb > 0) {
      try { await markAllRead(); } catch { /* ignore */ }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onOpen}
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
        <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-1rem)] bg-background border hairline rounded-[3px] shadow-2xl z-50">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Notifications
            </div>
            {count > 0 && (
              <div className="font-mono text-[10px] text-muted-foreground">{count} item{count === 1 ? "" : "s"}</div>
            )}
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            {notifs.length > 0 && (
              <div>
                <div className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground bg-muted/30">
                  Status Alerts
                </div>
                <ul className="divide-y divide-obsidian/10">
                  {notifs.slice(0, 8).map((n) => {
                    const body = (
                      <div className="px-4 py-3">
                        <div className="text-sm text-obsidian">{n.title}</div>
                        {n.body && <div className="text-xs text-obsidian/60 mt-0.5">{n.body}</div>}
                        <div className="text-[10px] font-mono text-obsidian/40 mt-1 uppercase tracking-[0.14em]">
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                    );
                    return (
                      <li key={n.id} className="hover:bg-muted/40">
                        {n.permit_id ? (
                          <Link
                            to="/portal/permits/$id"
                            params={{ id: n.permit_id }}
                            onClick={() => setOpen(false)}
                          >
                            {body}
                          </Link>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {alerts.length > 0 && (
              <div>
                <div className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground bg-muted/30 border-t border-obsidian/10">
                  Expiration Alerts
                </div>
                <AlertsList alerts={alerts} onNavigate={() => setOpen(false)} />
              </div>
            )}
            {notifs.length === 0 && alerts.length === 0 && (
              <div className="px-4 py-8 text-center text-obsidian/45 text-sm">All caught up.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
