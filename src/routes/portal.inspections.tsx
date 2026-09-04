import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Plus,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { PermitPicker } from "@/components/permit-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/use-session";
import { listPermits, type PermitRow } from "@/lib/permits-api";
import { useActiveTenantId } from "@/lib/view-mode-context";
import {
  listAllInspections,
  createInspection,
  markInspectionResult,
  INSPECTION_TYPES,
  TIME_WINDOWS,
  labelFor,
  labelForTime,
  hasReport,
  isUpcoming,
  type PermitInspection,
  type InspectionType,
} from "@/lib/inspections-api";
import { PageShell, Segmented, StatusChip, type MetricTone } from "@/components/ui-kit";
import {
  CDS,
  CdsCard,
  CdsEmpty,
  Reveal,
  SkeletonCards,
  Tag,
  isoDay,
} from "@/components/cds-kit";

export const Route = createFileRoute("/portal/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections — Cleard" },
      { name: "description", content: "Schedule inspections and review results across your permits." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InspectionsPage,
});

const resultTone: Record<string, MetricTone> = {
  passed: "success",
  failed: "danger",
  cancelled: "neutral",
  reinspect: "warning",
};

function ResultBadge({ result }: { result: string | null }) {
  const tone = resultTone[result ?? ""] ?? "info";
  const label = result === "pending" || !result ? "Scheduled" : result.charAt(0).toUpperCase() + result.slice(1);
  return <StatusChip tone={tone}>{label}</StatusChip>;
}

function InspectionsPage() {
  const session = useSession();
  const [rows, setRows] = useState<PermitInspection[]>([]);
  const [permits, setPermits] = useState<PermitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [requestFor, setRequestFor] = useState<PermitRow | null>(null);
  const [reportFor, setReportFor] = useState<PermitInspection | null>(null);
  const [statusFor, setStatusFor] = useState<PermitInspection | null>(null);
  const activeTenantId = useActiveTenantId();

  const refresh = useCallback(async () => {
    try {
      const [inspections, permitList] = await Promise.all([
        listAllInspections(),
        listPermits(activeTenantId),
      ]);
      setRows(inspections);
      setPermits(permitList);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load inspections");
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  type ResultFilter = "all" | "today" | "scheduled" | "passed" | "failed";
  const [filter, setFilter] = useState<ResultFilter>("all");

  const dayOf = (i: PermitInspection) => i.scheduled_date || i.requested_date || "";
  const isOpen = (r: PermitInspection) => r.result === "pending" || !r.result;
  const isFailed = (r: PermitInspection) => r.result === "failed" || r.result === "reinspect";

  const visible = useMemo(() => {
    const today = isoDay(new Date());
    switch (filter) {
      case "today":
        return rows.filter((r) => dayOf(r) === today);
      case "scheduled":
        return rows.filter(isOpen);
      case "passed":
        return rows.filter((r) => r.result === "passed");
      case "failed":
        return rows.filter(isFailed);
      default:
        return rows;
    }
  }, [rows, filter]);

  const { upcoming, past } = useMemo(() => {
    const up: PermitInspection[] = [];
    const pa: PermitInspection[] = [];
    for (const r of visible) {
      if (isUpcoming(r)) up.push(r);
      else pa.push(r);
    }
    return { upcoming: up, past: pa };
  }, [visible]);

  const stats = useMemo(() => {
    const today = isoDay(new Date());
    return {
      today: rows.filter((r) => dayOf(r) === today).length,
      scheduled: rows.filter(isOpen).length,
      passed: rows.filter((r) => r.result === "passed").length,
      failed: rows.filter(isFailed).length,
    };
  }, [rows]);

  const live = useMemo(() => {
    const today = isoDay(new Date());
    return visible.find((r) => dayOf(r) === today && (r.result === "pending" || !r.result)) ?? null;
  }, [visible]);

  return (
    <>
      <PageShell
        crumbs={[{ label: "Workspace" }, { label: "Inspections" }]}
        title="Inspections"
        meta={loading ? "Loading…" : `${upcoming.length} upcoming · ${past.length} past`}
        actions={
          <button className="p-btn p-btn-primary" onClick={() => setPickerOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Request inspection
          </button>
        }
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Segmented<ResultFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: rows.length },
              { value: "today", label: "Today", count: stats.today },
              { value: "scheduled", label: "Scheduled", count: stats.scheduled },
              { value: "passed", label: "Passed", count: stats.passed },
              { value: "failed", label: "Failed / reinspect", count: stats.failed },
            ]}
          />
        </div>

        {live && <LiveInspectionCard inspection={live} />}

        {loading ? (
          <SkeletonCards count={4} />
        ) : (
          <div className="space-y-4">
            <InspectionGroup
              title="Upcoming"
              empty="No upcoming inspections."
              rows={upcoming}
              isAdmin={session.isAdmin}
              onViewReport={setReportFor}
              onUpdateStatus={setStatusFor}
            />
            <InspectionGroup
              title="Past"
              empty="No past inspections yet."
              rows={past}
              isAdmin={session.isAdmin}
              onViewReport={setReportFor}
              onUpdateStatus={setStatusFor}
            />
          </div>
        )}
      </PageShell>

      {pickerOpen && (
        <PermitPicker
          permits={permits}
          eyebrow="Request Inspection"
          title="Select a Permit"
          onClose={() => setPickerOpen(false)}
          onPick={(p) => {
            setPickerOpen(false);
            setRequestFor(p);
          }}
        />
      )}

      {requestFor && (
        <RequestInspectionDialog
          permit={requestFor}
          onClose={() => setRequestFor(null)}
          onCreated={async () => {
            setRequestFor(null);
            await refresh();
          }}
        />
      )}

      {reportFor && (
        <ReportDialog inspection={reportFor} onClose={() => setReportFor(null)} />
      )}

      {statusFor && (
        <StatusUpdateDialog
          inspection={statusFor}
          onClose={() => setStatusFor(null)}
          onSaved={async () => {
            setStatusFor(null);
            await refresh();
          }}
        />
      )}
    </>
  );
}

const LIVE_STEPS = ["Scheduled", "En Route", "In Progress", "Passed"] as const;

/** Pinned card for an inspection happening today. Progress reflects real state. */
function LiveInspectionCard({ inspection }: { inspection: PermitInspection }) {
  const step = inspection.result === "passed" ? 3 : inspection.scheduled_date ? 1 : 0;
  return (
    <Reveal className="mb-4">
      <div style={{ background: CDS.ink, border: `1px solid ${CDS.ink}`, borderRadius: 8, padding: 20 }}>
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: CDS.teal,
            }}
          >
            Live today
          </span>
          <span className="truncate" style={{ fontSize: 15, fontWeight: 700, color: CDS.white }}>
            {labelFor(inspection.inspection_type)}
          </span>
          <span className="truncate" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>
            {inspection.job_address || inspection.project_name || ""}
          </span>
        </div>
        <div className="mt-3 h-1 w-full" style={{ background: "rgba(255,255,255,0.14)" }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / LIVE_STEPS.length) * 100}%`,
              background: CDS.teal,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {LIVE_STEPS.map((s, i) => (
            <span
              key={s}
              style={{
                fontSize: 11,
                fontWeight: i === step ? 700 : 400,
                color: i <= step ? CDS.white : "rgba(255,255,255,0.4)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 10 }}>
          {labelForTime(inspection.preferred_time)}
          {inspection.inspector_name ? ` · ${inspection.inspector_name}` : ""}
        </div>
      </div>
    </Reveal>
  );
}

const ACCENT: Record<string, string> = {
  pending: CDS.teal,
  passed: CDS.tealText,
  failed: CDS.red,
  reinspect: CDS.red,
  cancelled: CDS.grayLt,
  in_progress: CDS.purple,
};

function InspectionGroup({
  title,
  empty,
  rows,
  isAdmin,
  onViewReport,
  onUpdateStatus,
}: {
  title: string;
  empty: string;
  rows: PermitInspection[];
  isAdmin: boolean;
  onViewReport: (i: PermitInspection) => void;
  onUpdateStatus: (i: PermitInspection) => void;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center gap-2">
        <h2 style={{ fontSize: 13, fontWeight: 700, color: CDS.black }}>{title}</h2>
        <Tag>{rows.length}</Tag>
      </div>
      {rows.length === 0 ? (
        <CdsEmpty
          icon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />}
          title={empty}
          description="Inspections you request appear here with live status and inspector notes."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {rows.map((i, idx) => {
            const dateStr = i.scheduled_date || i.requested_date;
            const d = dateStr ? new Date(dateStr + "T12:00:00") : null;
            const accent = ACCENT[i.result ?? "pending"] ?? CDS.teal;
            const passed = i.result === "passed";
            return (
              <CdsCard
                key={i.id}
                index={idx}
                style={{
                  borderLeft: `3px solid ${accent}`,
                  background: passed ? "rgba(156,107,63,0.06)" : CDS.white,
                  padding: 16,
                }}
              >
                <div className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-2">
                  <div className="min-w-0 flex-1">
                    {i.project_name && (
                      <Link
                        to="/portal/permits/$id"
                        params={{ id: i.permit_id }}
                        className="cds-cell-id block truncate"
                        style={{ color: CDS.teal, fontSize: 11, fontWeight: 600 }}
                      >
                        {i.permit_number ?? i.project_name}
                      </Link>
                    )}
                    <div className="truncate" style={{ fontSize: 14, fontWeight: 700, color: CDS.black }}>
                      {i.job_address || i.project_name || "—"}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Tag tone="neutral">{labelFor(i.inspection_type)}</Tag>
                      <span style={{ fontSize: 11.5, color: CDS.gray }}>
                        {i.permit_number ? `Permit ${i.permit_number}` : i.project_name || ""}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: CDS.gray, marginTop: 6 }}>
                      {d
                        ? `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}${
                            i.preferred_time ? ` · ${labelForTime(i.preferred_time)}` : ""
                          }`
                        : "Unscheduled"}
                      {i.inspector_name ? ` · ${i.inspector_name}` : ""}
                    </div>
                  </div>
                  <ResultBadge result={i.result} />
                </div>
                <div className="cds-card-actions mt-3 flex flex-wrap items-center gap-2">
                  {hasReport(i) && (
                    <button className="p-btn p-btn-ghost p-btn-sm" onClick={() => onViewReport(i)}>
                      View report <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  {isAdmin && i.result === "pending" && (
                    <button className="p-btn p-btn-quiet p-btn-sm" onClick={() => onUpdateStatus(i)}>
                      Update status
                    </button>
                  )}
                </div>
              </CdsCard>
            );
          })}
        </div>
      )}
    </section>
  );
}


function RequestInspectionDialog({
  permit,
  onClose,
  onCreated,
}: {
  permit: PermitRow;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [type, setType] = useState<InspectionType>("rough");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("morning");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      toast.error("Pick a preferred date");
      return;
    }
    setSaving(true);
    try {
      await createInspection({
        permit_id: permit.id,
        tenant_id: permit.tenant_id,
        inspection_type: type,
        requested_date: date,
        scheduled_date: date,
        preferred_time: time || null,
        notes: notes.trim() || null,
      });
      toast.success("Inspection requested");
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request inspection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/50 flex items-start justify-center overflow-y-auto p-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-lg bg-white rounded-[3px] shadow-2xl my-16"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian/10">
          <div>
            <div className="eyebrow text-obsidian/50">Request Inspection</div>
            <h2 className="display-serif text-xl text-obsidian mt-1">{permit.project_name}</h2>
            <p className="text-xs text-obsidian/55 mt-1">{permit.job_address}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-[3px] hover:bg-obsidian/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Inspection type
            </Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InspectionType)}
              className="mt-1.5 w-full border border-obsidian/20 rounded-[3px] px-3 py-2 text-sm"
            >
              {INSPECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Preferred date
              </Label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 rounded-[3px]"
              />
            </div>
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Preferred time
              </Label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5 w-full border border-obsidian/20 rounded-[3px] px-3 py-2 text-sm min-h-11"
              >
                {TIME_WINDOWS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Notes (optional)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1.5 rounded-[3px]"
              placeholder="Access notes, gate codes, etc."
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-obsidian/10 flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-[3px]" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-[3px]" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Submit request
          </Button>
        </div>
      </form>
    </div>
  );
}

function ReportDialog({
  inspection,
  onClose,
}: {
  inspection: PermitInspection;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-obsidian/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-lg bg-white rounded-[3px] shadow-2xl my-16">
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian/10">
          <div>
            <div className="eyebrow text-obsidian/50">Inspection Report</div>
            <h2 className="display-serif text-xl text-obsidian mt-1">
              {labelFor(inspection.inspection_type)}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-[3px] hover:bg-obsidian/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <ResultBadge result={inspection.result} />
            {inspection.result === "passed" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            ) : inspection.result === "failed" ? (
              <XCircle className="h-4 w-4 text-red-700" />
            ) : null}
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-obsidian/55">Project</dt>
              <dd className="text-obsidian text-right">{inspection.project_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-obsidian/55">Address</dt>
              <dd className="text-obsidian text-right">{inspection.job_address ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-obsidian/55">Scheduled</dt>
              <dd className="text-obsidian text-right">
                {inspection.scheduled_date || inspection.requested_date || "—"}
                {inspection.preferred_time ? ` · ${labelForTime(inspection.preferred_time)}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-obsidian/55">Inspector</dt>
              <dd className="text-obsidian text-right">{inspection.inspector_name || "—"}</dd>
            </div>
          </dl>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1.5">
              Inspector notes
            </div>
            <div className="rounded-[3px] border border-obsidian/10 bg-obsidian/[0.02] px-3 py-3 text-obsidian/80 whitespace-pre-wrap">
              {inspection.notes?.trim() || "No notes recorded."}
            </div>
          </div>
          <p className="text-[11px] text-obsidian/40">
            Results are stored on the inspection record (`result` + `notes`). No separate
            attachments table in this MVP.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-obsidian/10 flex justify-end">
          <Button variant="outline" className="rounded-[3px]" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusUpdateDialog({
  inspection,
  onClose,
  onSaved,
}: {
  inspection: PermitInspection;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [result, setResult] = useState<"passed" | "failed">("passed");
  const [notes, setNotes] = useState(inspection.notes ?? "");
  const [inspector, setInspector] = useState(inspection.inspector_name ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await markInspectionResult({
        id: inspection.id,
        result,
        notes: notes.trim() || null,
        inspector_name: inspector.trim() || null,
        permit_id: inspection.permit_id,
        inspection_type: inspection.inspection_type,
      });
      toast.success(
        result === "passed" ? "Marked passed" : "Marked failed — follow-up notification created",
      );
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/50 flex items-start justify-center overflow-y-auto p-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-lg bg-white rounded-[3px] shadow-2xl my-16"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian/10">
          <div>
            <div className="eyebrow text-obsidian/50">Staff · Update Status</div>
            <h2 className="display-serif text-xl text-obsidian mt-1">
              {labelFor(inspection.inspection_type)}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-[3px] hover:bg-obsidian/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Result
            </Label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setResult("passed")}
                className={`flex-1 rounded-[3px] border px-3 py-2 text-sm ${
                  result === "passed"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                    : "border-obsidian/15"
                }`}
              >
                Passed
              </button>
              <button
                type="button"
                onClick={() => setResult("failed")}
                className={`flex-1 rounded-[3px] border px-3 py-2 text-sm ${
                  result === "failed"
                    ? "border-red-600 bg-red-50 text-red-900"
                    : "border-obsidian/15"
                }`}
              >
                Failed
              </button>
            </div>
          </div>
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Inspector name
            </Label>
            <Input
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              className="mt-1.5 rounded-[3px]"
              placeholder="Inspector"
            />
          </div>
          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              Notes / report detail
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-1.5 rounded-[3px]"
              placeholder={
                result === "failed"
                  ? "Describe the failure and required corrections…"
                  : "Inspection notes…"
              }
            />
          </div>
          {result === "failed" && (
            <p className="text-xs text-obsidian/55">
              A follow-up notification (`inspection_failed`) will be created for this permit.
            </p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-obsidian/10 flex justify-end gap-2">
          <Button type="button" variant="outline" className="rounded-[3px]" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-[3px]" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save result
          </Button>
        </div>
      </form>
    </div>
  );
}
