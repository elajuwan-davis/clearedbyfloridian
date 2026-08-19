import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyWeeklyReportFn, type WeeklyReport } from "@/lib/weekly-reports.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell, SectionHeader, TableShell } from "@/components/ui-kit";
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
      { name: "description", content: "Permit volume, turnaround, correction rate and fee analytics for Cleard staff and GC clients." },
    ],
  }),
  component: ReportsPage,
});

const COLORS = { obsidian: "#2F4F4F", sky: "#673147", green: "#4E6B5C", amber: "#9A7B2E" };

function ReportsPage() {
  const [internal, setInternal] = useState(false);
  useEffect(() => setInternal(isInternalUser()), []);

  return (
    <PageShell
      crumbs={[{ label: "Workspace" }, { label: "Reports" }]}
      title="Reports"
      meta={
        internal
          ? "Throughput, turnaround and cost across your projects and the platform"
          : "Throughput, turnaround and cost across your projects"
      }
    >
      <Tabs defaultValue="gc" className="w-full">
        <TabsList className="mb-3 h-auto flex-wrap gap-1 bg-white/[0.04] p-1">
          <TabsTrigger value="gc" className="h-7 px-3 text-[12px]">
            My Reports
          </TabsTrigger>
          {internal && (
            <TabsTrigger value="internal" className="h-7 px-3 text-[12px]">
              Cleard Internal
            </TabsTrigger>
          )}
          <TabsTrigger value="weekly" className="h-7 px-3 text-[12px]">
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
    </PageShell>
  );
}

// ============================================================
// Shared UI primitives
// ============================================================

function StatCard({
  label, value, icon: Icon, accent, sub,
}: { label: string; value: string; icon: typeof FolderOpen; accent?: boolean; sub?: string }) {
  return (
    <div className="p-plate p-hover-plate flex min-w-0 flex-col gap-1.5 px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${
            accent ? "bg-[#673147]/12 text-[#673147]" : "bg-white/[0.06] text-muted-foreground"
          }`}
        >
          <Icon className="h-3 w-3" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="min-w-0">
        <div
          className={`truncate text-[20px] font-semibold leading-none tracking-[-0.03em] ${
            accent ? "text-[#673147]" : "text-foreground"
          }`}
        >
          {value}
        </div>
        {sub && <div className="mt-1 truncate text-[11.5px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function ReportSection({
  title, description, onExport, children,
}: { title: string; description?: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <section className="p-plate mb-3 min-w-0 overflow-hidden">
      <SectionHeader
        title={title}
        meta={description}
        action={
          <button type="button" onClick={onExport} className="p-btn p-btn-ghost p-btn-sm">
            <Download className="h-3 w-3" strokeWidth={1.75} /> CSV
          </button>
        }
      />
      <div className="px-3 pb-3">{children}</div>
    </section>
  );
}

function BarRow({ data, dataKey = "count", color = COLORS.sky }: { data: CountRow[]; dataKey?: string; color?: string }) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis dataKey="key" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="mt-2">
      <TableShell maxHeight={260}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </TableShell>
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

  if (loading) return <div className="py-10 text-[12px] text-muted-foreground">Loading reports…</div>;

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard label="Total Permits" value={String(totalPermits)} icon={FolderOpen} />
        <StatCard label="Avg Correction Rate" value={`${avgCorrectionRate}%`} icon={ShieldAlert} accent />
        <StatCard label="Permit Fees Collected" value={fmtMoney(totalFees)} icon={DollarSign} />
        <StatCard label="Cleard Revenue" value={fmtMoney(totalRevenue)} icon={TrendingUp} accent />
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
        <div className="mb-2 flex flex-wrap gap-1.5">
          {([
            ["month", "By Month"],
            ["jurisdiction", "By Jurisdiction"],
            ["trade", "By Trade Type"],
          ] as [Grouping, string][]).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setGrouping(val)}
              className={`p-btn p-btn-sm ${grouping === val ? "p-btn-primary" : "p-btn-ghost"}`}
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
        description="Total permit fees collected and Cleard revenue (per-project fees + transaction fees) by month."
        onExport={() =>
          downloadCsv(
            "fee-summary-by-month.csv",
            ["Month", "Permit Fees Collected", "Cleard Revenue"],
            fees.map((r) => [r.month, fmtMoney(r.permitFeesCents), fmtMoney(r.clearedRevenueCents)]),
          )
        }
      >
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fees} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} tickFormatter={(v) => `$${Math.round(v / 100000) / 10}k`} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Legend />
              <Bar dataKey="permitFeesCents" name="Permit Fees" fill={COLORS.sky} radius={[3, 3, 0, 0]} />
              <Bar dataKey="clearedRevenueCents" name="Cleard Revenue" fill={COLORS.obsidian} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SimpleTable
          headers={["Month", "Permit Fees Collected", "Cleard Revenue"]}
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
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={openClosed} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} allowDecimals={false} />
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
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
          <XAxis dataKey="municipality" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} interval={0} angle={-20} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} />
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
    { key: "Cleard Platform Avg", value: platformCycle },
  ];

  if (loading) return <div className="py-10 text-[12px] text-muted-foreground">Loading reports…</div>;

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Building2 className="h-3 w-3" strokeWidth={1.75} /> Showing data for {name}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
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
        description="Your average submission-to-issuance time compared to the anonymized Cleard platform average."
        onExport={() => downloadCsv("gc-cycle-time.csv", ["Group", "Avg Days"], cycleData.map((r) => [r.key, r.value]))}
      >
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cycleData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
              <XAxis dataKey="key" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }} />
              <Tooltip formatter={(v: number) => `${v} days`} />
              <Bar dataKey="value" fill={COLORS.sky} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SimpleTable headers={["Group", "Avg Days"]} rows={cycleData.map((r) => [r.key, `${r.value} days`])} />
      </ReportSection>

      <ReportSection
        title="Cost Summary"
        description="Permit fees, Cleard fees paid, and estimated savings from using a private provider vs. self-permitting."
        onExport={() =>
          downloadCsv(
            "gc-cost-summary.csv",
            ["Metric", "Amount"],
            [
              ["Permit Fees Paid", fmtMoney(cost.permitFeesCents)],
              ["Cleard Fees Paid", fmtMoney(cost.clearedFeesCents)],
              ["Estimated Savings", fmtMoney(cost.savingsCents)],
            ],
          )
        }
      >
        <SimpleTable
          headers={["Metric", "Amount"]}
          rows={[
            ["Permit Fees Paid", fmtMoney(cost.permitFeesCents)],
            ["Cleard Fees Paid", fmtMoney(cost.clearedFeesCents)],
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

  if (loading) return <div className="py-10 text-[12px] text-muted-foreground">Loading report…</div>;
  if (!report) return <div className="py-10 text-[12px] text-muted-foreground">No team data yet.</div>;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Calendar className="h-3 w-3" /> Week of {today} — mailed every Monday to your team.
      </p>

      <DigestCard
        icon={<FileText className="h-4 w-4" />}
        title="Active Permits"
        count={report.active_permits.length}
        empty="No active permits."
      >
        <ul className="divide-y divide-white/[0.06]">
          {report.active_permits.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-1.5 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate">{p.project_name}</span>
              <span className="shrink-0 text-[11.5px] text-muted-foreground">{p.permit_number ?? "—"}</span>
              <span className="shrink-0 text-[11.5px]">{p.status}</span>
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
        <ul className="divide-y divide-white/[0.06]">
          {report.compliance_flags.map((f, i) => (
            <li key={i} className="flex items-center gap-3 py-1.5 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate">{f.subcontractor}</span>
              <span className="shrink-0 text-[11.5px] text-[#8C3B3B]">{f.issue}</span>
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
        <ul className="divide-y divide-white/[0.06]">
          {report.hoa_status.map((h) => (
            <li key={h.id} className="flex items-center gap-3 py-1.5 text-[12.5px]">
              <span className="min-w-0 flex-1 truncate">{h.community ?? "—"}</span>
              <span className="shrink-0 text-[11.5px]">{h.status}</span>
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
        <ul className="divide-y divide-white/[0.06]">
          {report.corrections.map((c, i) => (
            <li key={i} className="py-1.5 text-[12.5px]">
              <div>{c.correction_text}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
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
    <section className="p-plate min-w-0 overflow-hidden">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            {icon}
            {title}
          </span>
        }
        meta={String(count)}
      />
      <div className="px-3 pb-3">
        {count === 0 ? (
          <p className="text-[12px] text-muted-foreground">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
