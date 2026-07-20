import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, X, AlertTriangle } from "lucide-react";
import { useExpirationAlerts } from "@/hooks/use-expiration-alerts";
import { AlertsList } from "@/components/alerts-list";
import { CoiAlertsWidget } from "@/components/coi-alerts-widget";
import { listPermits, missingRequiredDocs, type PermitRow } from "@/lib/permits-api";
import { listSubs, subIsComplete, type SubRow } from "@/lib/subs-api";

export const Route = createFileRoute("/portal/")({
  component: PortalOverview,
});

const CLOSED = new Set(["approved", "permit_issued", "cancelled"]);

function PortalOverview() {
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const alerts = useExpirationAlerts();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    listPermits().then(setPermits).catch(() => {});
    listSubs().then(setSubs).catch(() => {});
  }, []);

  const active = permits.filter((p) => !CLOSED.has(p.status));
  const inReview = permits.filter((p) => p.status === "in_review" || p.status === "corrections_required").length;
  const issued = permits.filter((p) => p.status === "permit_issued").length;
  const submittedCount = permits.filter((p) => p.status === "submitted").length;
  const totalDocs = permits.reduce((n, p) => n + (p.documents?.length ?? 0), 0);
  const missingDocs = permits.reduce((n, p) => n + missingRequiredDocs(p).length, 0);
  const completeSubs = subs.filter(subIsComplete).length;

  const stats = [
    { k: "Active permits", v: active.length },
    { k: "Submitted", v: submittedCount },
    { k: "In review", v: inReview },
    { k: "Issued", v: issued },
  ];

  return (
    <div className="space-y-12 max-w-6xl">
      <div>
        <div className="label-eyebrow">Overview</div>
        <h1 className="mt-4 font-display text-4xl tracking-tight">Good morning.</h1>
        <p className="mt-2 text-muted-foreground">Live status of your Cleared permits and subcontractors.</p>
      </div>

      {!dismissed && alerts.length > 0 && (
        <section className="border hairline rounded-[3px] bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b hairline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" strokeWidth={1.75} />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian">Expiring Licenses & Insurance</div>
              <span className="font-mono text-[10px] text-muted-foreground">{alerts.length} item{alerts.length === 1 ? "" : "s"}</span>
            </div>
            <button type="button" onClick={() => setDismissed(true)} className="p-1 rounded-[3px] hover:bg-secondary"><X className="h-4 w-4" strokeWidth={1.5} /></button>
          </div>
          <AlertsList alerts={alerts} />
        </section>
      )}

      <CoiAlertsWidget />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border hairline">
        {stats.map((s) => (
          <div key={s.k} className="bg-background p-6">
            <div className="label-eyebrow">{s.k}</div>
            <div className="mt-3 font-display text-4xl tracking-tight">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="border hairline rounded-[3px] bg-background p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl">Permit progress</h2>
            <Link to="/my-permits" className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1">Open <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {permits.length} permit{permits.length === 1 ? "" : "s"} · {missingDocs} missing required doc{missingDocs === 1 ? "" : "s"} across {totalDocs} tracked.
          </div>
          <div className="mt-3 h-2 bg-obsidian/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${permits.length ? Math.round((issued / permits.length) * 100) : 0}%` }} />
          </div>
          <div className="mt-2 font-mono text-[11px] text-obsidian/50">{issued} issued of {permits.length}</div>
        </section>
        <section className="border hairline rounded-[3px] bg-background p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl">Subcontractor onboarding</h2>
            <Link to="/portal/subcontractors" className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1">Open <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            {subs.length} sub{subs.length === 1 ? "" : "s"} · {completeSubs} complete · {subs.length - completeSubs} pending info.
          </div>
          <div className="mt-3 h-2 bg-obsidian/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${subs.length ? Math.round((completeSubs / subs.length) * 100) : 0}%` }} />
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl tracking-tight">Recent permits</h2>
          <Link to="/my-permits" className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="border hairline divide-y">
          {active.slice(0, 6).map((p) => (
            <Link key={p.id} to="/portal/permits/$id" params={{ id: p.id }} className="p-5 grid md:grid-cols-12 gap-4 items-center hover:bg-secondary/40 transition-colors">
              <div className="md:col-span-2 font-mono text-xs text-muted-foreground">{p.permit_number ?? "—"}</div>
              <div className="md:col-span-6">
                <div className="font-medium">{p.project_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.job_address}</div>
              </div>
              <div className="md:col-span-2 text-xs text-muted-foreground">{p.municipality ?? p.county ?? "—"}</div>
              <div className="md:col-span-2 md:text-right">
                <span className="inline-flex items-center border border-obsidian/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]">{p.status.replace(/_/g, " ")}</span>
              </div>
            </Link>
          ))}
          {active.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active permits yet. <Link to="/portal/permits/new" className="underline">Create one</Link>.
            </div>
          )}
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

