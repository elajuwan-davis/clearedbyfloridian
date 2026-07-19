import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECTS, fullAddress } from "@/lib/projects-data";
import { inspections } from "@/lib/mock-data";
import { projectStatusMeta, toneClass } from "@/lib/status-badges";
import { ArrowRight, X, AlertTriangle } from "lucide-react";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { AlertsList } from "@/components/alerts-list";

export const Route = createFileRoute("/portal/")({
  component: PortalOverview,
});

function PortalOverview() {
  const CLOSED = new Set(["approved", "permit_issued", "cancelled", "closed", "completed"]);
  const active = PROJECTS.filter((p) => !CLOSED.has(p.status));

  const upcomingInspections = inspections.filter((i) => i.status === "Scheduled").slice(0, 4);
  const inReview = PROJECTS.filter((p) => p.status === "in_review" || p.status === "corrections_required").length;
  const issued = PROJECTS.filter((p) => p.status === "permit_issued").length;
  const alerts = useExpirationAlerts();
  const [dismissed, setDismissed] = useState(false);

  const stats = [
    { k: "Active permits", v: active.length },
    { k: "In review", v: inReview },
    { k: "Upcoming inspections", v: upcomingInspections.length },
    { k: "Issued", v: issued },
  ];

  return (
    <div className="space-y-12 max-w-6xl">
      <div>
        <div className="label-eyebrow">Overview</div>
        <h1 className="mt-4 font-display text-4xl tracking-tight">Good morning.</h1>
        <p className="mt-2 text-muted-foreground">
          Here's where every active Flōridian project sits this morning.
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
          {active.slice(0, 6).map((p) => {
            const meta = projectStatusMeta[p.status];
            return (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                className="p-5 grid md:grid-cols-12 gap-4 items-center hover:bg-secondary/40 transition-colors"
              >
                <div className="md:col-span-2 font-mono text-xs text-muted-foreground">{p.permit_no}</div>
                <div className="md:col-span-5">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{fullAddress(p)}</div>
                </div>
                <div className="md:col-span-2 text-xs text-muted-foreground">{p.client}</div>
                <div className="md:col-span-3 md:text-right">
                  <span className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                    {meta.label}
                  </span>
                </div>
              </Link>
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
  };
  return (
    <span className={`inline-flex items-center border rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone[status] ?? "bg-secondary text-foreground border-border"}`}>
      {status}
    </span>
  );
}

