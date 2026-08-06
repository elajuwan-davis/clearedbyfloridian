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
} from "lucide-react";
import { PermitPicker } from "@/components/permit-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/use-session";
import { listPermits, type PermitRow } from "@/lib/permits-api";
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
import { PageShell, Panel, StatusChip, EmptyState, type MetricTone } from "@/components/ui-kit";

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

  const refresh = useCallback(async () => {
    try {
      const [inspections, permitList] = await Promise.all([
        listAllInspections(),
        listPermits(),
      ]);
      setRows(inspections);
      setPermits(permitList);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load inspections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const { upcoming, past } = useMemo(() => {
    const up: PermitInspection[] = [];
    const pa: PermitInspection[] = [];
    for (const r of rows) {
      if (isUpcoming(r)) up.push(r);
      else pa.push(r);
    }
    return { upcoming: up, past: pa };
  }, [rows]);

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
        {loading ? (
          <div className="px-1 py-6 text-[12.5px] text-muted-foreground">Loading inspections…</div>
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
    <Panel title={title} meta={rows.length} padded={rows.length === 0}>
      {rows.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <div className="p-divide -mx-3">
          {rows.map((i) => {
            const dateStr = i.scheduled_date || i.requested_date;
            const d = dateStr ? new Date(dateStr + "T12:00:00") : null;
            return (
              <div key={i.id} className="flex flex-wrap items-center gap-4 px-3 py-2.5">
                <div className="w-[92px] shrink-0">
                  {d ? (
                    <>
                      <div className="text-[12.5px] font-semibold tabular-nums">
                        {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {d.toLocaleDateString("en-US", { year: "numeric" })}
                        {i.preferred_time ? ` · ${labelForTime(i.preferred_time)}` : ""}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">Unscheduled</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">{labelFor(i.inspection_type)}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {i.job_address || i.project_name || "—"}
                  </div>
                  {i.project_name && (
                    <Link
                      to="/portal/permits/$id"
                      params={{ id: i.permit_id }}
                      className="mt-0.5 inline-block truncate text-[11.5px] text-[var(--p-info)] hover:underline"
                    >
                      {i.project_name}
                      {i.permit_number ? ` · ${i.permit_number}` : ""}
                    </Link>
                  )}
                </div>
                <ResultBadge result={i.result} />
                <div className="flex shrink-0 items-center gap-2">
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
              </div>
            );
          })}
        </div>
      )}
    </Panel>
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
