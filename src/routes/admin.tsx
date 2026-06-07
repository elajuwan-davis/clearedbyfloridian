import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FolderOpen,
  AlertTriangle,
  Stamp,
  DollarSign,
  UserPlus,
  Filter,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · Operations — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

/* ─────────── types ─────────── */
type Tone = "neutral" | "sky" | "warn" | "ok";
const toneClass: Record<Tone, string> = {
  neutral: "bg-paper-warm text-obsidian/70 border-obsidian/15",
  sky: "bg-sky/10 text-sky border-sky/30",
  warn: "bg-oxblood/10 text-oxblood border-oxblood/30",
  ok: "bg-emerald-600/10 text-emerald-700 border-emerald-600/30",
};

type Status =
  | "submitted"
  | "in_review"
  | "corrections_required"
  | "resubmitted"
  | "approved"
  | "permit_issued"
  | "inspection_scheduled";

const statusMeta: Record<Status, { label: string; tone: Tone }> = {
  submitted: { label: "Submitted", tone: "neutral" },
  in_review: { label: "In review", tone: "sky" },
  corrections_required: { label: "Corrections required", tone: "warn" },
  resubmitted: { label: "Resubmitted", tone: "sky" },
  approved: { label: "Approved", tone: "ok" },
  permit_issued: { label: "Permit issued", tone: "ok" },
  inspection_scheduled: { label: "Inspection scheduled", tone: "sky" },
};

type Fee = { kind: "permitting" | "admin"; amount_cents: number; status: "invoiced" | "paid" | "overdue" };

type Row = {
  id: string;
  permit_no: string;
  name: string;
  gc: string;
  county: "Palm Beach" | "Martin" | "St. Lucie" | "Indian River";
  value_cents: number;
  status: Status;
  assignee: string | null;
  submitted_at: string;
  age_days: number;
  fees: Fee[];
};

const STAFF = [
  "M. Calderón (Plan Review)",
  "R. Tan (Plan Review)",
  "D. Whitcomb (Inspections)",
  "P. Vázquez (Inspections)",
  "Unassigned",
];

const ROWS: Row[] = [
  { id: "1", permit_no: "CLR-2026-0142", name: "Ocean Ridge Estate", gc: "Coastline Builders Group", county: "Palm Beach", value_cents: 412_500_000, status: "in_review", assignee: "M. Calderón (Plan Review)", submitted_at: "May 28", age_days: 10, fees: [{ kind: "permitting", amount_cents: 6_187_500, status: "invoiced" }, { kind: "admin", amount_cents: 885_600, status: "invoiced" }] },
  { id: "2", permit_no: "CLR-2026-0138", name: "Jupiter Island Residence", gc: "Coastline Builders Group", county: "Martin", value_cents: 687_200_000, status: "corrections_required", assignee: "R. Tan (Plan Review)", submitted_at: "May 21", age_days: 17, fees: [{ kind: "permitting", amount_cents: 10_308_000, status: "overdue" }, { kind: "admin", amount_cents: 885_600, status: "paid" }] },
  { id: "3", permit_no: "CLR-2026-0131", name: "Manalapan Bayfront", gc: "Coastline Builders Group", county: "Palm Beach", value_cents: 1_240_000_000, status: "permit_issued", assignee: "M. Calderón (Plan Review)", submitted_at: "May 12", age_days: 26, fees: [{ kind: "permitting", amount_cents: 18_600_000, status: "paid" }, { kind: "admin", amount_cents: 885_600, status: "paid" }] },
  { id: "4", permit_no: "CLR-2026-0127", name: "Hobe Sound Compound", gc: "Coastline Builders Group", county: "Martin", value_cents: 298_400_000, status: "approved", assignee: "R. Tan (Plan Review)", submitted_at: "May 06", age_days: 32, fees: [{ kind: "permitting", amount_cents: 4_476_000, status: "invoiced" }, { kind: "admin", amount_cents: 885_600, status: "invoiced" }] },
  { id: "5", permit_no: "CLR-2026-0119", name: "Vero Beach Oceanfront", gc: "Coastline Builders Group", county: "Indian River", value_cents: 524_900_000, status: "submitted", assignee: null, submitted_at: "Apr 29", age_days: 39, fees: [{ kind: "permitting", amount_cents: 7_873_500, status: "invoiced" }, { kind: "admin", amount_cents: 885_600, status: "invoiced" }] },
  { id: "6", permit_no: "CLR-2026-0112", name: "Stuart Riverhouse", gc: "Coastline Builders Group", county: "Martin", value_cents: 186_300_000, status: "inspection_scheduled", assignee: "D. Whitcomb (Inspections)", submitted_at: "Apr 22", age_days: 46, fees: [{ kind: "permitting", amount_cents: 2_794_500, status: "paid" }, { kind: "admin", amount_cents: 885_600, status: "paid" }] },
  { id: "7", permit_no: "CLR-2026-0104", name: "Palm Beach Landmark", gc: "Coastline Builders Group", county: "Palm Beach", value_cents: 2_180_000_000, status: "resubmitted", assignee: "M. Calderón (Plan Review)", submitted_at: "Apr 14", age_days: 54, fees: [{ kind: "permitting", amount_cents: 32_700_000, status: "overdue" }, { kind: "admin", amount_cents: 885_600, status: "invoiced" }] },
  { id: "8", permit_no: "CLR-2026-0098", name: "Tequesta Beach Modern", gc: "Coastline Builders Group", county: "Martin", value_cents: 348_000_000, status: "corrections_required", assignee: "R. Tan (Plan Review)", submitted_at: "Apr 08", age_days: 60, fees: [{ kind: "permitting", amount_cents: 5_220_000, status: "invoiced" }, { kind: "admin", amount_cents: 885_600, status: "invoiced" }] },
];

const fmtMoneyWhole = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/* ─────────── page ─────────── */
function AdminPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [countyFilter, setCountyFilter] = useState<"all" | Row["county"]>("all");
  const [assignTarget, setAssignTarget] = useState<Row | null>(null);
  const [pendingAssignee, setPendingAssignee] = useState<string>("");

  const filtered = useMemo(() => {
    return ROWS.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (countyFilter === "all" || r.county === countyFilter),
    );
  }, [statusFilter, countyFilter]);

  // Stats — computed off the full ROWS dataset (not filtered)
  const activeCount = ROWS.filter((r) => r.status !== "permit_issued").length;
  const correctionsCount = ROWS.filter((r) => r.status === "corrections_required").length;
  const permitsThisMonth = ROWS.filter((r) => r.status === "permit_issued").length;
  const outstandingFeesCents = ROWS.flatMap((r) => r.fees)
    .filter((f) => f.status === "invoiced" || f.status === "overdue")
    .reduce((s, f) => s + f.amount_cents, 0);

  const openAssign = (row: Row) => {
    setAssignTarget(row);
    setPendingAssignee(row.assignee ?? "Unassigned");
  };

  return (
    <PortalShell>
      <div className="mx-auto max-w-7xl px-8 py-12">
        {/* Header */}
        <div className="border-b border-obsidian/10 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-obsidian/50">Cleared Operations</span>
            <span className="border border-oxblood/30 bg-oxblood/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-oxblood">
              Admin · Staff Only
            </span>
          </div>
          <h1 className="display-serif mt-3 text-5xl text-obsidian">
            Operations <em>Desk</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-obsidian/60">
            Portfolio-wide queue across Palm Beach + Treasure Coast. Triage corrections, assign
            reviewers, monitor float on invoiced fees.
          </p>
        </div>

        {/* Stat cards — obsidian */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Projects" value={String(activeCount)} icon={<FolderOpen className="h-4 w-4" />} />
          <StatCard
            label="Corrections Pending"
            value={String(correctionsCount)}
            icon={<AlertTriangle className="h-4 w-4" />}
            accent="warn"
          />
          <StatCard
            label="Permits Issued · Jun"
            value={String(permitsThisMonth)}
            icon={<Stamp className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            label="Outstanding Fees"
            value={fmtMoneyWhole(outstandingFeesCents)}
            sublabel="Invoiced + overdue"
            icon={<DollarSign className="h-4 w-4" />}
            mono
          />
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-wrap items-end gap-4 border-b border-obsidian/10 pb-5">
          <div className="inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
            <Filter className="h-3.5 w-3.5" />
            Filter Queue
          </div>
          <div className="min-w-[200px]">
            <Label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(statusMeta) as Status[]).map((s) => (
                  <SelectItem key={s} value={s}>{statusMeta[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <Label className="mb-1.5 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
              County
            </Label>
            <Select value={countyFilter} onValueChange={(v) => setCountyFilter(v as typeof countyFilter)}>
              <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All counties</SelectItem>
                {(["Palm Beach", "Martin", "St. Lucie", "Indian River"] as const).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">
            {filtered.length} of {ROWS.length} projects
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden border border-obsidian/15 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "var(--obsidian)" }}>
                <tr>
                  <Th>Project</Th>
                  <Th>County</Th>
                  <Th align="right">Value</Th>
                  <Th>Status</Th>
                  <Th>Assignee</Th>
                  <Th>Age</Th>
                  <Th align="right"> </Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-obsidian/55">
                      No projects match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const meta = statusMeta[r.status];
                    return (
                      <tr key={r.id} className="border-b border-obsidian/5 transition-colors hover:bg-paper-warm/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-obsidian">{r.name}</div>
                          <div className="mt-0.5 text-xs text-obsidian/55">{r.gc}</div>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/40">
                            {r.permit_no} · filed {r.submitted_at}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-obsidian/75">{r.county}</td>
                        <td className="px-6 py-4 text-right font-mono tabular-nums text-obsidian">
                          {fmtMoneyWhole(r.value_cents)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${toneClass[meta.tone]}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {r.assignee ? (
                            <span className="text-sm text-obsidian/85">{r.assignee}</span>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-oxblood">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs tabular-nums text-obsidian/65">
                          {r.age_days}d
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openAssign(r)}
                              className="rounded-[3px]"
                            >
                              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                              Assign
                            </Button>
                            <a
                              href={`/projects/${r.id}`}
                              className="inline-flex items-center gap-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-sky transition-opacity hover:opacity-70"
                            >
                              View
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <Dialog open={assignTarget !== null} onOpenChange={(o) => !o && setAssignTarget(null)}>
        <DialogContent className="rounded-[3px] border-obsidian/15 bg-white sm:max-w-md">
          <DialogHeader>
            <div className="eyebrow text-obsidian/50">Assign Reviewer</div>
            <DialogTitle className="display-serif text-2xl text-obsidian">
              {assignTarget?.name ?? ""}
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
              {assignTarget?.permit_no} · {assignTarget?.county} County
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <Label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
              Staff Member
            </Label>
            <Select value={pendingAssignee} onValueChange={setPendingAssignee}>
              <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
              Assignment is logged in status history.
            </p>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="ghost" className="rounded-[3px]" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="dark" onClick={() => setAssignTarget(null)}>
              Confirm assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalShell>
  );
}

/* ─────────── building blocks ─────────── */
function StatCard({
  label, value, sublabel, icon, accent, mono,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: "sky" | "warn";
  mono?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden p-5 text-paper"
      style={{ backgroundColor: "var(--obsidian)" }}
    >
      {/* corner accent */}
      {accent && (
        <span
          aria-hidden
          className="absolute right-0 top-0 h-12 w-12"
          style={{
            background: accent === "sky"
              ? "linear-gradient(225deg, color-mix(in oklab, var(--sky) 35%, transparent), transparent 60%)"
              : "linear-gradient(225deg, color-mix(in oklab, var(--oxblood) 40%, transparent), transparent 60%)",
          }}
        />
      )}
      <div className="flex items-center gap-2 text-paper/55">
        <span className="text-paper/60">{icon}</span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <div
        className={`mt-4 text-paper ${mono ? "font-mono text-3xl tabular-nums" : "display-serif text-4xl"}`}
        style={accent === "sky" ? { color: "var(--sky)" } : undefined}
      >
        {value}
      </div>
      {sublabel && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/45">
          {sublabel}
        </div>
      )}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`px-6 py-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${
        align === "right" ? "text-right" : "text-left"
      }`}
      style={{ color: "var(--sky)" }}
    >
      {children}
    </th>
  );
}
