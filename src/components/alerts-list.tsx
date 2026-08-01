import { Link } from "@tanstack/react-router";
import type { Alert } from "@/lib/expiration-alerts";
import { ArrowRight } from "lucide-react";

export function AlertRow({ alert, onNavigate }: { alert: Alert; onNavigate?: () => void }) {
  const dot = alert.severity === "red" ? "bg-red-500" : "bg-amber-500";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b hairline last:border-b-0 text-sm">
      <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="text-obsidian truncate">
          <span className="font-medium">{alert.companyName}</span>{" "}
          <span className={alert.severity === "red" ? "text-red-700 font-mono text-[11px] uppercase tracking-wider ml-1" : "text-obsidian/70"}>
            {alert.label}
          </span>
        </div>
      </div>
      <Link
        to="/portal/request-coi"
        search={{ tab: "sub" } as never}
        onClick={onNavigate}
        className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70 hover:text-obsidian inline-flex items-center gap-1 shrink-0"
      >
        Request Update <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function AlertsList({ alerts, onNavigate }: { alerts: Alert[]; onNavigate?: () => void }) {
  if (alerts.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-obsidian/55">
        No expiring licenses or insurance certificates.
      </div>
    );
  }
  return (
    <div>
      {alerts.map((a) => (
        <AlertRow key={a.id} alert={a} onNavigate={onNavigate} />
      ))}
    </div>
  );
}
