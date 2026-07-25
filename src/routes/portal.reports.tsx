import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyWeeklyReportFn, type WeeklyReport } from "@/lib/weekly-reports.functions";
import { FileText, AlertTriangle, Building2, Wrench, Calendar } from "lucide-react";

export const Route = createFileRoute("/portal/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const fetchReport = useServerFn(getMyWeeklyReportFn);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport()
      .then((r) => setReport(r as WeeklyReport | null))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [fetchReport]);

  if (loading) return <div className="max-w-5xl py-10 text-obsidian/60">Loading report…</div>;
  if (!report) return <div className="max-w-5xl py-10 text-obsidian/60">No team data yet.</div>;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <div className="label-eyebrow">◇ Weekly Status Report</div>
        <h1 className="mt-4 display-serif text-4xl text-obsidian">{report.tenant_name}</h1>
        <p className="mt-2 text-sm text-obsidian/60 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Week of {today} — mailed every Monday to your team.
        </p>
      </div>

      <Card
        icon={<FileText className="h-4 w-4" />}
        title="Active Permits"
        count={report.active_permits.length}
        empty="No active permits."
      >
        <ul className="divide-y hairline">
          {report.active_permits.map((p) => (
            <li key={p.id} className="py-2 flex items-center gap-3 text-sm">
              <span className="flex-1 text-obsidian truncate">{p.project_name}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60">{p.permit_number ?? "—"}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/80">{p.status}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Compliance Flags"
        count={report.compliance_flags.length}
        empty="All subcontractor docs are current."
      >
        <ul className="divide-y hairline">
          {report.compliance_flags.map((f, i) => (
            <li key={i} className="py-2 flex items-center gap-3 text-sm">
              <span className="flex-1 text-obsidian truncate">{f.subcontractor}</span>
              <span className="text-oxblood font-mono text-[10px] uppercase tracking-[0.12em]">{f.issue}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        icon={<Building2 className="h-4 w-4" />}
        title="HOA Submittals"
        count={report.hoa_status.length}
        empty="No open HOA submittals."
      >
        <ul className="divide-y hairline">
          {report.hoa_status.map((h) => (
            <li key={h.id} className="py-2 flex items-center gap-3 text-sm">
              <span className="flex-1 text-obsidian truncate">{h.community ?? "—"}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/80">{h.status}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        icon={<Wrench className="h-4 w-4" />}
        title="Recent Corrections (Platform-wide, last 7 days)"
        count={report.corrections.length}
        empty="No new corrections logged."
      >
        <ul className="divide-y hairline">
          {report.corrections.map((c, i) => (
            <li key={i} className="py-2 text-sm">
              <div className="text-obsidian">{c.correction_text}</div>
              <div className="mt-0.5 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/50">
                {c.municipality_name ?? "—"}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Card({
  icon, title, count, empty, children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border hairline bg-white rounded-[3px] p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-obsidian">
          {icon}
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">{count}</span>
      </div>
      {count === 0 ? <p className="text-sm text-obsidian/50 italic">{empty}</p> : children}
    </section>
  );
}
