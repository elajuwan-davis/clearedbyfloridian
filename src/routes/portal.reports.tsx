import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyWeeklyReportFn, type WeeklyReport } from "@/lib/weekly-reports.functions";
import { PortalShell } from "@/components/portal-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { isInternalUser } from "@/lib/is-internal-user";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FileText, AlertTriangle, Building2, Wrench, Calendar, Download, Clock, TrendingUp,
  DollarSign, LayoutGrid, ShieldAlert, Percent, FolderOpen,
} from "lucide-react";
import {
  permitVolumeByMonth, permitVolumeByJurisdiction, permitVolumeByTradeType,
  avgTurnaroundByMunicipality, correctionRateByMunicipality, feeSummaryByMonth,
  openVsClosedOverTime, projectsForGc, gcPermitVolumeByMonth, gcAvgCycleTimeDays,
  platformAvgCycleTimeDays, gcCostSummary, fmtMoney, downloadCsv, fetchReportPermits,
  DEMO_GC_NAME,
  type CountRow, type MunicipalityMetric, type ReportPermit, type GcCostSummary,
} from "@/lib/reports-data";

export const Route = createFileRoute("/portal/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Cleard" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Permit volume, turnaround, correction rate and fee analytics for Cléared staff and GC clients." },
    ],
  }),
  component: ReportsPage,
});

const COLORS = { obsidian: "#153157", sky: "#1B84D4", green: "#12A05C", amber: "#E8861A" };

function ReportsPage() {
  const [internal, setInternal] = useState(false);
  useEffect(() => setInternal(isInternalUser()), []);

  return (
    <PortalShell>
      <div className="mb-8">
        <div className="label-eyebrow mb-3">Reporting &amp; Analytics</div>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]"
          style={{ fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif", color: "#0F1E2E", letterSpacing: "-0.02em" }}
        >
          Reports
        </h1>
        <p className="mt-2 text-sm text-obsidian/60 max-w-2xl">
          Track permit throughput, turnaround, and cost performance across your projects
          {internal ? " and the full Cléared platform." : "."}
        </p>
      </div>

      <Tabs defaultValue="gc" className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap gap-1 bg-secondary/60 p-1">
          <TabsTrigger value="gc" className="min-h-11 px-4 font-subline text-xs tracking-wide uppercase">
            My Reports
          </TabsTrigger>
          {internal && (
            <TabsTrigger value="internal" className="min-h-11 px-4 font-subline text-xs tracking-wide uppercase">
              Cléared Internal
            </TabsTrigger>
          )}
          <TabsTrigger value="weekly" className="min-h-11 px-4 font-subline text-xs tracking-wide uppercase">
            Weekly Digest
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gc">
          <GcReports />
        </TabsContent>

        {internal && (
          <TabsContent value="internal">
            <InternalReports />
          </TabsContent>
        )}

        <TabsContent value="weekly">
          <WeeklyDigest />
        </TabsContent>
      </Tabs>
    </PortalShell>
  );
}

// ============================================================
// Shared UI primitives
// ============================================================

function StatCard({
  label, value, icon: Icon, accent, sub,
}: { label: string; value: string; icon: typeof FolderOpen; accent?: boolean; sub?: string }) {
  const accentColor = accent ? COLORS.sky : COLORS.obsidian;
  return (
    <div
      className="relative overflow-hidden p-5 rounded-lg border bg-white transition-shadow hover:shadow-md"
      style={{ borderColor: "#E2E8F0", borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-center gap-2" style={{ color: "#7890A4" }}>
        <Icon className="h-4 w-4" strokeWidth={1.5} />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div
        className="mt-4 text-3xl font-bold tabular-nums"
        style={{ color: accentColor, fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-obsidian/50">{sub}</div>}
    </div>
  );
}

function ReportSection({
  title, description, onExport, children,
}: { title: string; description?: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <section className="border hairline bg-white rounded-[3px] p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-obsidian" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            {title}
          </h2>
          {description && <p className="mt-1 text-xs text-obsidian/55 max-w-xl">{description}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          className="h-11 min-h-11 px-4 rounded-[3px] font-subline text-xs tracking-wide gap-2 shrink-0"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          Export CSV
        </Button>
      </div>
      {children}
    </section>
  );
}

function BarRow({ data, dataKey = "count", color = COLORS.sky }: { data: CountRow[]; dataKey?: string; color?: string }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="key" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto mt-4 border hairline rounded-[3px]">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="border-b hairline bg-secondary/40">
            {headers.map((h) => (
              <th key={h} className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/60 px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b hairline last:border-0">
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 text-obsidian tabular-nums">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Internal reports
// ============================================================

type Grouping = "month" | "jurisdiction" | "trade";

function InternalReports() {
  const [grouping, setGrouping] = useState<Grouping>("month");
  const [byMonth, setByMonth] = useState<CountRow[]>([]);
  const [byJurisdiction, setByJurisdiction] = useState<CountRow[]>([]);
  const [byTrade, setByTrade] = useState<CountRow[]>([]);
  const [turnaround, setTurnaround] = useState<MunicipalityMetric[]>([]);
  const [correctionRate, setCorrectionRate] = useState<MunicipalityMetric[]>([]);
  const [fees, setFees] = useState<Awaited<ReturnType<typeof feeSummaryByMonth>>>([]);
  const [openClosed, setOpenClosed] = useState<ReturnType<typeof openVsClosedOverTime>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const permits = await fetchReportPermits();
      if (!alive) return;
      setByMonth(permitVolumeByMonth(permits));
      setByJurisdiction(permitVolumeByJurisdiction(permits));
      setByTrade(permitVolumeByTradeType(permits));
      setTurnaround(avgTurnaroundByMunicipality(permits));
      setCorrectionRate(correctionRateByMunicipality(permits));
      setOpenClosed(openVsClosedOverTime(permits));
      setFees(await feeSummaryByMonth());
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const volumeData = grouping === "month" ? byMonth : grouping === "jurisdiction" ? byJurisdiction : byTrade;
  const totalPermits = byMonth.reduce((s, r) => s + r.count, 0);
  const totalFees = fees.reduce((s, r) => s + r.permitFeesCents, 0);
  const totalRevenue = fees.reduce((s, r) => s + r.clearedRevenueCents, 0);
  const avgCorrectionRate = correctionRate.length
    ? Math.round((correctionRate.reduce((s, r) => s + r.value, 0) / correctionRate.length) * 10) / 10
    : 0;

  if (loading) return <div className="py-10 text-obsidian/60">Loading reports…</div>;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Permits" value={String(totalPermits)} icon={FolderOpen} />
        <StatCard label="Avg Correction Rate" value={`${avgCorrectionRate}%`} icon={ShieldAlert} accent />
        <StatCard label="Permit Fees Collected" value={fmtMoney(totalFees)} icon={DollarSign} />
        <StatCard label="Cléared Revenue" value={fmtMoney(totalRevenue)} icon={TrendingUp} accent />
      </div>

      <ReportSection
        title="Permit Volume"
        description="Total permits, toggle grouping by month, jurisdiction, or trade type."
        onExport={() =>
          downloadCsv(
            `permit-volume-by-${grouping}.csv`,
            [grouping === "month" ? "Month" : grouping === "jurisdiction" ? "Jurisdiction" : "Trade Type", "Permits"],
            volumeData.map((r) => [r.key, r.count]),
          )
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ["month", "By Month"],
            ["jurisdiction", "By Jurisdiction"],
            ["trade", "By Trade Type"],
          ] as [Grouping, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setGrouping(val)}
              className="min-h-11 px-3.5 rounded-[3px] border font-subline text-xs uppercase tracking-wide transition-colors"
              style={
                grouping === val
                  ? { backgroundColor: COLORS.obsidian, color: "#fff", borderColor: COLORS.obsidian }
                  : { backgroundColor: "transparent", color: COLORS.obsidian, borderColor: "#E2E8F0" }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <BarRow data={volumeData} color={COLORS.sky} />
        <SimpleTable
          headers={[grouping === "month" ? "Month" : grouping === "jurisdiction" ? "Jurisdiction" : "Trade Type", "Permits"]}
          rows={volumeData.map((r) => [r.key, r.count])}
        />
      </ReportSection>

      <ReportSection
        title="Average Turnaround Time"
        description="Days from submission to issuance, by municipality."
        onExport={() =>
          downloadCsv("avg-turnaround-by-municipality.csv", ["Municipality", "Avg Days", "Permits"], turnaround.map((r) => [r.municipality, r.value, r.count]))
        }
      >
        <MunicipalityBarChart data={turnaround} suffix=" days" color={COLORS.green} />
        <SimpleTable
          headers={["Municipality", "Avg Days", "Permits"]}
          rows={turnaround.map((r) => [r.municipality, `${r.value} days`, r.count])}
        />
      </ReportSection>

      <ReportSection
        title="Correction Rate"
        description="Share of permits receiving one or more correction notices, by municipality."
        onExport={() =>
          downloadCsv("correction-rate-by-municipality.csv", ["Municipality", "Correction Rate %", "Permits"], correctionRate.map((r) => [r.municipality, r.value, r.count]))
        }
      >
        <MunicipalityBarChart data={correctionRate} suffix="%" color={COLORS.amber} />
        <SimpleTable
          headers={["Municipality", "Correction Rate", "Permits"]}
          rows={correctionRate.map((r) => [r.municipality, `${r.value}%`, r.count])}
        />
      </ReportSection>

      <ReportSection
        title="Fee Summary"
        description="Total permit fees collected and Cléared revenue (per-project fees + transaction fees) by month."
        onExport={() =>
          downloadCsv(
            "fee-summary-by-month.csv",
            ["Month", "Permit Fees Collected", "Cléared Revenue"],
            fees.map((r) => [r.month, fmtMoney(r.permitFeesCents), fmtMoney(r.clearedRevenueCents)]),
          )
        }
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fees} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 100000) / 10}k`} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Legend />
              <Bar dataKey="permitFeesCents" name="Permit Fees" fill={COLORS.sky} radius={[3, 3, 0, 0]} />
              <Bar dataKey="clearedRevenueCents" name="Cléared Revenue" fill={COLORS.obsidian} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SimpleTable
          headers={["Month", "Permit Fees Collected", "Cléared Revenue"]}
          rows={fees.map((r) => [r.month, fmtMoney(r.permitFeesCents), fmtMoney(r.clearedRevenueCents)])}
        />
      </ReportSection>

      <ReportSection
        title="Open vs. Closed Projects"
        description="Cumulative open and closed project counts over time."
        onExport={() =>
          downloadCsv("open-vs-closed.csv", ["Month", "Open", "Closed"], openClosed.map((r) => [r.month, r.open, r.closed]))
        }
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={openClosed} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="open" name="Open" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="closed" name="Closed" stroke={COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <SimpleTable headers={["Month", "Open", "Closed"]} rows={openClosed.map((r) => [r.month, r.open, r.closed])} />
      </ReportSection>
    </div>
  );
}

function MunicipalityBarChart({ data, suffix, color }: { data: MunicipalityMetric[]; suffix: string; color: string }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="municipality" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => `${v}${suffix}`} />
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// GC reports
// ============================================================

function GcReports() {
  const [name, setName] = useState(DEMO_GC_NAME);
  const [projects, setProjects] = useState<ReportPermit[]>([]);
  const [volume, setVolume] = useState<CountRow[]>([]);
  const [gcCycle, setGcCycle] = useState(0);
  const [platformCycle, setPlatformCycle] = useState(0);
  const [cost, setCost] = useState<GcCostSummary>({ permitFeesCents: 0, clearedFeesCents: 0, savingsCents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await fetchReportPermits();
      const scoped = await projectsForGc(null);
      if (!alive) return;
      setName(scoped.name);
      setProjects(scoped.projects);
      setVolume(gcPermitVolumeByMonth(scoped.projects));
      setGcCycle(gcAvgCycleTimeDays(scoped.projects));
      setPlatformCycle(platformAvgCycleTimeDays(all));
      setCost(await gcCostSummary(scoped.projects));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const cycleData = [
    { key: name, value: gcCycle },
    { key: "Cléared Platform Avg", value: platformCycle },
  ];

  if (loading) return <div className="py-10 text-obsidian/60">Loading reports…</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-obsidian/60">
        <Building2 className="h-4 w-4" strokeWidth={1.75} />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]">Showing data for {name}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Permits" value={String(projects.length)} icon={FolderOpen} />
        <StatCard label="Avg Cycle Time" value={`${gcCycle}d`} icon={Clock} accent sub={`Platform avg: ${platformCycle}d`} />
        <StatCard label="Permit Fees Paid" value={fmtMoney(cost.permitFeesCents)} icon={DollarSign} />
        <StatCard label="Est. Savings" value={fmtMoney(cost.savingsCents)} icon={TrendingUp} accent />
      </div>

      <ReportSection
        title="Permit Volume by Month"
        description={`Permits submitted by ${name}, by month.`}
        onExport={() => downloadCsv("gc-permit-volume-by-month.csv", ["Month", "Permits"], volume.map((r) => [r.key, r.count]))}
      >
        <BarRow data={volume} color={COLORS.sky} />
        <SimpleTable headers={["Month", "Permits"]} rows={volume.map((r) => [r.key, r.count])} />
      </ReportSection>

      <ReportSection
        title="Average Cycle Time vs. Platform"
        description="Your average submission-to-issuance time compared to the anonymized Cléared platform average."
        onExport={() => downloadCsv("gc-cycle-time.csv", ["Group", "Avg Days"], cycleData.map((r) => [r.key, r.value]))}
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cycleData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="key" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v} days`} />
              <Bar dataKey="value" fill={COLORS.sky} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SimpleTable headers={["Group", "Avg Days"]} rows={cycleData.map((r) => [r.key, `${r.value} days`])} />
      </ReportSection>

      <ReportSection
        title="Cost Summary"
        description="Permit fees, Cléared fees paid, and estimated savings from using a private provider vs. self-permitting."
        onExport={() =>
          downloadCsv(
            "gc-cost-summary.csv",
            ["Metric", "Amount"],
            [
              ["Permit Fees Paid", fmtMoney(cost.permitFeesCents)],
              ["Cléared Fees Paid", fmtMoney(cost.clearedFeesCents)],
              ["Estimated Savings", fmtMoney(cost.savingsCents)],
            ],
          )
        }
      >
        <SimpleTable
          headers={["Metric", "Amount"]}
          rows={[
            ["Permit Fees Paid", fmtMoney(cost.permitFeesCents)],
            ["Cléared Fees Paid", fmtMoney(cost.clearedFeesCents)],
            ["Estimated Savings via Private Provider", fmtMoney(cost.savingsCents)],
          ]}
        />
      </ReportSection>
    </div>
  );
}

// ============================================================
// Weekly digest (existing feature, kept intact)
// ============================================================

function WeeklyDigest() {
  const fetchReport = useServerFn(getMyWeeklyReportFn);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport()
      .then((r) => setReport(r as WeeklyReport | null))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [fetchReport]);

  if (loading) return <div className="py-10 text-obsidian/60">Loading report…</div>;
  if (!report) return <div className="py-10 text-obsidian/60">No team data yet.</div>;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <p className="text-sm text-obsidian/60 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5" /> Week of {today} — mailed every Monday to your team.
      </p>

      <DigestCard
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
      </DigestCard>

      <DigestCard
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
      </DigestCard>

      <DigestCard
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
      </DigestCard>

      <DigestCard
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
      </DigestCard>
    </div>
  );
}

function DigestCard({
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
