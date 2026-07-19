import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { permits, inspections } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, X, AlertTriangle } from "lucide-react";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { AlertsList } from "@/components/alerts-list";

export const Route = createFileRoute("/portal/")({
  component: PortalOverview,
});

function PortalOverview() {
  const active = permits.filter((p) => p.status !== "Closed");
  const upcomingInspections = inspections.filter((i) => i.status === "Scheduled").slice(0, 4);
  const inReview = permits.filter((p) => p.status === "Plan Review" || p.status === "Revisions Required").length;
  const alerts = useExpirationAlerts();
  const [dismissed, setDismissed] = useState(false);

  const stats = [
    { k: "Active permits", v: active.length },
    { k: "In review", v: inReview },
    { k: "Upcoming inspections", v: upcomingInspections.length },
    { k: "Closed YTD", v: 23 },
  ];

  return (
    <div className="space-y-12 max-w-6xl">
      <div>
        <div className="label-eyebrow">Overview</div>
        <h1 className="mt-4 font-display text-4xl tracking-tight">Good morning, Jamie.</h1>
        <p className="mt-2 text-muted-foreground">
          Here's where every Coastline Builders Group project sits this morning.
        </p>
      </div>

      {!dismissed && alerts.length > 0 && (
        <section className="border hairline rounded-[3px] bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b hairline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" strokeWidth={1.75} />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian">
                Expiring Licenses &amp; Insurance
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {alerts.length} item{alerts.length === 1 ? "" : "s"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss alerts"
              className="p-1 rounded-[3px] hover:bg-secondary"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <AlertsList alerts={alerts} />
        </section>
      )}


      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border hairline">
        {stats.map((s) => (
          <div key={s.k} className="bg-background p-6">
            <div className="label-eyebrow">{s.k}</div>
            <div className="mt-3 font-display text-4xl tracking-tight">{s.v}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl tracking-tight">Active projects</h2>
          <Link to="/portal/projects" className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="border hairline divide-y">
          {active.slice(0, 4).map((p) => (
            <div key={p.id} className="p-5 grid md:grid-cols-12 gap-4 items-center hover:bg-secondary/40 transition-colors">
              <div className="md:col-span-1 font-mono text-xs text-muted-foreground">{p.number}</div>
              <div className="md:col-span-4">
                <div className="font-medium">{p.address}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.scope}</div>
              </div>
              <div className="md:col-span-2 font-mono text-xs text-muted-foreground">{p.jurisdiction}</div>
              <div className="md:col-span-3">
                <div className="h-1 bg-secondary overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground">{p.progress}% complete</div>
              </div>
              <div className="md:col-span-2 md:text-right">
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl tracking-tight">Upcoming inspections</h2>
          <Link to="/portal/inspections" className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1">
            Schedule <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="border hairline divide-y">
          {upcomingInspections.map((i) => {
            const d = new Date(i.scheduledFor);
            return (
              <div key={i.id} className="p-5 grid md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-2 font-mono text-xs">
                  {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  <span className="text-muted-foreground"> · {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                </div>
                <div className="md:col-span-4 font-medium">{i.type}</div>
                <div className="md:col-span-4 text-sm text-muted-foreground">{i.address}</div>
                <div className="md:col-span-2 md:text-right font-mono text-xs">{i.inspector}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    "Approved": "bg-emerald-100 text-emerald-900 border-emerald-200",
    "Plan Review": "bg-blue-100 text-blue-900 border-blue-200",
    "Revisions Required": "bg-amber-100 text-amber-900 border-amber-200",
    "Inspections": "bg-violet-100 text-violet-900 border-violet-200",
    "Intake": "bg-secondary text-foreground border-border",
    "Closed": "bg-muted text-muted-foreground border-border",
    "Scheduled": "bg-blue-100 text-blue-900 border-blue-200",
    "Passed": "bg-emerald-100 text-emerald-900 border-emerald-200",
    "Failed": "bg-red-100 text-red-900 border-red-200",
    "Pending Reschedule": "bg-amber-100 text-amber-900 border-amber-200",
  };
  return (
    <Badge variant="outline" className={`rounded-sm font-mono text-[10px] uppercase tracking-wider ${tone[status] ?? ""}`}>
      {status}
    </Badge>
  );
}
