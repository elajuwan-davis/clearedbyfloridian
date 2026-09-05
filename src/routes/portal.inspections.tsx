import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Plus,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Camera,
  Share2,
  Upload,
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
  hasPhotos,
  isUpcoming,
  type PermitInspection,
  type InspectionType,
  type InspectionRequestMethod,
} from "@/lib/inspections-api";
import {
  uploadInspectionPhotos,
  getInspectionPhotoUrl,
  INSPECTION_PHOTO_MAX_FILES,
} from "@/lib/inspection-photo-upload";
import { PageShell, Segmented, StatusChip, type MetricTone } from "@/components/ui-kit";
import { CDS, CdsCard, CdsEmpty, Reveal, SkeletonCards, Tag, isoDay } from "@/components/cds-kit";

export const Route = createFileRoute("/portal/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections — Cleard" },
      {
        name: "description",
        content: "Schedule inspections and review results across your permits.",
      },
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
  const label =
    result === "pending" || !result
      ? "Scheduled"
      : result.charAt(0).toUpperCase() + result.slice(1);
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
  const [photosFor, setPhotosFor] = useState<PermitInspection | null>(null);
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
              onViewPhotos={setPhotosFor}
              onUpdateStatus={setStatusFor}
            />
            <InspectionGroup
              title="Past"
              empty="No past inspections yet."
              rows={past}
              isAdmin={session.isAdmin}
              onViewReport={setReportFor}
              onViewPhotos={setPhotosFor}
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

      {reportFor && <ReportDialog inspection={reportFor} onClose={() => setReportFor(null)} />}

      {photosFor && (
        <PhotoGalleryDialog inspection={photosFor} onClose={() => setPhotosFor(null)} />
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
      <div
        style={{
          background: CDS.ink,
          border: `1px solid ${CDS.ink}`,
          borderRadius: 8,
          padding: 20,
        }}
      >
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
  onViewPhotos,
  onUpdateStatus,
}: {
  title: string;
  empty: string;
  rows: PermitInspection[];
  isAdmin: boolean;
  onViewReport: (i: PermitInspection) => void;
  onViewPhotos: (i: PermitInspection) => void;
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
                    <div
                      className="truncate"
                      style={{ fontSize: 14, fontWeight: 700, color: CDS.black }}
                    >
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
                  {hasPhotos(i) && (
                    <button className="p-btn p-btn-ghost p-btn-sm" onClick={() => onViewPhotos(i)}>
                      <Camera className="h-3 w-3" /> View photos ({i.photos.length})
                    </button>
                  )}
                  {isAdmin && i.result === "pending" && (
                    <button
                      className="p-btn p-btn-quiet p-btn-sm"
                      onClick={() => onUpdateStatus(i)}
                    >
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

function MethodOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-2.5 rounded-[3px] border px-3 py-2.5 text-left transition-colors ${
        active
          ? "border-obsidian bg-obsidian/[0.04]"
          : "border-obsidian/15 hover:border-obsidian/35"
      }`}
    >
      <span className={active ? "text-obsidian mt-0.5" : "text-obsidian/45 mt-0.5"}>{icon}</span>
      <span>
        <span className="block text-sm font-medium text-obsidian">{title}</span>
        <span className="block text-[11px] text-obsidian/55">{description}</span>
      </span>
    </button>
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
  const [method, setMethod] = useState<InspectionRequestMethod>("live");
  const [type, setType] = useState<InspectionType>("rough");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("morning");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoQueue, setPhotoQueue] = useState<File[]>([]);
  const [photoProgress, setPhotoProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [engineerName, setEngineerName] = useState("");
  const [engineerLicense, setEngineerLicense] = useState("");
  const [letter, setLetter] = useState<File | null>(null);
  const letterInputRef = useRef<HTMLInputElement>(null);

  // Local thumbnails for the staged photos — released whenever the queue changes.
  const previews = useMemo(() => photoQueue.map((f) => URL.createObjectURL(f)), [photoQueue]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  function addPhotos(files: File[]) {
    const images = files.filter(
      (f) => f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|gif|webp)$/i.test(f.name),
    );
    if (images.length === 0) {
      toast.error("Only photo files are accepted");
      return;
    }
    setPhotoQueue((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      for (const f of images) {
        const id = `${f.name}:${f.size}`;
        if (seen.has(id)) continue;
        seen.add(id);
        merged.push(f);
      }
      if (merged.length > INSPECTION_PHOTO_MAX_FILES) {
        toast.error(`Up to ${INSPECTION_PHOTO_MAX_FILES} photos at a time`);
        return merged.slice(0, INSPECTION_PHOTO_MAX_FILES);
      }
      return merged;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (method === "live" && !date) {
      toast.error("Pick a preferred date");
      return;
    }
    if (method === "photos" && photoQueue.length === 0) {
      toast.error("Add at least one photo");
      return;
    }
    if (method === "engineer") {
      if (!engineerName.trim() || !engineerLicense.trim()) {
        toast.error("Engineer's name and license number are required");
        return;
      }
      if (!letter) {
        toast.error("Attach the engineer's letter (PDF)");
        return;
      }
    }
    setSaving(true);
    try {
      if (method === "live") {
        await createInspection({
          permit_id: permit.id,
          tenant_id: permit.tenant_id,
          inspection_type: type,
          requested_date: date,
          scheduled_date: date,
          preferred_time: time || null,
          notes: notes.trim() || null,
          request_method: "live",
        });
      } else if (method === "engineer" && letter) {
        setPhotoProgress({ done: 0, total: 1 });
        const result = await uploadInspectionPhotos(permit.id, [letter], (done, total) =>
          setPhotoProgress({ done, total }),
        );
        if (result.uploaded.length === 0) {
          throw new Error(
            result.failed[0]?.message
              ? `The engineer's letter could not be uploaded (${result.failed[0].message}).`
              : "The engineer's letter could not be uploaded — please try again.",
          );
        }
        const detail = `Engineer's letter — ${engineerName.trim()} (License ${engineerLicense.trim()})`;
        await createInspection({
          permit_id: permit.id,
          tenant_id: permit.tenant_id,
          inspection_type: type,
          requested_date: new Date().toISOString().slice(0, 10),
          notes: [detail, notes.trim()].filter(Boolean).join("\n\n"),
          request_method: "engineer",
          photos: result.uploaded,
        });
      } else {
        setPhotoProgress({ done: 0, total: photoQueue.length });
        const result = await uploadInspectionPhotos(permit.id, photoQueue, (done, total) =>
          setPhotoProgress({ done, total }),
        );
        if (result.uploaded.length === 0) {
          throw new Error("None of the photos could be uploaded — please try again.");
        }
        if (result.failed.length > 0) {
          toast.error(
            `${result.failed.length} photo${result.failed.length === 1 ? "" : "s"} failed to upload: ` +
              result.failed.map((f) => f.filename).join(", "),
          );
        }
        await createInspection({
          permit_id: permit.id,
          tenant_id: permit.tenant_id,
          inspection_type: type,
          requested_date: new Date().toISOString().slice(0, 10),
          notes: notes.trim() || null,
          request_method: "photos",
          photos: result.uploaded,
        });
      }
      toast.success(
        method === "engineer" ? "Engineer's letter submitted" : "Inspection requested",
      );
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to request inspection");
    } finally {
      setSaving(false);
      setPhotoProgress(null);
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

          <div>
            <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
              How should this be inspected?
            </Label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <MethodOption
                active={method === "live"}
                icon={<CalendarDays className="h-4 w-4" />}
                title="Live Inspection"
                description="An inspector visits the site"
                onClick={() => setMethod("live")}
              />
              <MethodOption
                active={method === "photos"}
                icon={<Camera className="h-4 w-4" />}
                title="Upload Photos"
                description="Reviewed from jobsite photos"
                onClick={() => setMethod("photos")}
              />
              <MethodOption
                active={method === "engineer"}
                icon={<Stamp className="h-4 w-4" />}
                title="Engineer's Letter"
                description="Work was covered before inspection"
                onClick={() => setMethod("engineer")}
              />
            </div>
          </div>

          {method === "engineer" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                    Engineer's name
                  </Label>
                  <Input
                    required
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    className="mt-1.5 rounded-[3px]"
                    placeholder="Jane Doe, P.E."
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                    Engineer's license number
                  </Label>
                  <Input
                    required
                    value={engineerLicense}
                    onChange={(e) => setEngineerLicense(e.target.value)}
                    className="mt-1.5 rounded-[3px]"
                    placeholder="PE 12345"
                  />
                </div>
              </div>
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                  Upload engineer's letter (PDF)
                </Label>
                <div
                  onClick={() => letterInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") letterInputRef.current?.click();
                  }}
                  className="mt-1.5 cursor-pointer border-2 border-dashed border-obsidian/20 hover:border-obsidian/40 rounded-[3px] px-4 py-5 text-center transition-colors"
                >
                  <Upload className="h-4 w-4 mx-auto text-obsidian/45" />
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                    {letter ? letter.name : "Choose a PDF"}
                  </div>
                  <input
                    ref={letterInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      e.target.value = "";
                      if (!f) return;
                      if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
                        toast.error("The engineer's letter must be a PDF");
                        return;
                      }
                      setLetter(f);
                    }}
                  />
                </div>
                {letter && !saving && (
                  <button
                    type="button"
                    onClick={() => setLetter(null)}
                    className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
                  >
                    Remove file
                  </button>
                )}
              </div>
              {photoProgress && (
                <div className="font-mono text-[10px] text-obsidian/55">Uploading letter…</div>
              )}
            </div>
          ) : method === "live" ? (
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
          ) : (
            <div>
              <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">
                Jobsite photos
              </Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addPhotos(Array.from(e.dataTransfer.files ?? []));
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                className={`mt-1.5 cursor-pointer border-2 border-dashed rounded-[3px] px-4 py-5 text-center transition-colors ${
                  dragOver
                    ? "border-obsidian/50 bg-obsidian/[0.05]"
                    : "border-obsidian/20 hover:border-obsidian/40"
                }`}
              >
                <Upload className="h-4 w-4 mx-auto text-obsidian/45" />
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
                  Drop photos or click to choose
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addPhotos(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </div>

              {photoQueue.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {photoQueue.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="relative aspect-square rounded-[3px] overflow-hidden border border-obsidian/10 bg-obsidian/[0.02]"
                    >
                      <img src={previews[i]} alt={f.name} className="h-full w-full object-cover" />
                      {!saving && (
                        <button
                          type="button"
                          onClick={() => setPhotoQueue((q) => q.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 rounded-full bg-obsidian/70 p-0.5 text-white"
                          aria-label={`Remove ${f.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {photoProgress && (
                <div className="mt-3">
                  <div className="h-1.5 bg-obsidian/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${photoProgress.total ? (photoProgress.done / photoProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-obsidian/55">
                    Uploading… {photoProgress.done}/{photoProgress.total}
                  </div>
                </div>
              )}
            </div>
          )}

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
          <Button
            type="button"
            variant="outline"
            className="rounded-[3px]"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-[3px]" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {saving && method === "photos" ? "Uploading…" : "Submit request"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function PhotoGalleryDialog({
  inspection,
  onClose,
}: {
  inspection: PermitInspection;
  onClose: () => void;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(
        inspection.photos.map(async (p) => {
          try {
            const url = await getInspectionPhotoUrl(p.path);
            return [p.path, url] as const;
          } catch {
            return [p.path, ""] as const;
          }
        }),
      );
      if (active) setUrls(Object.fromEntries(entries));
    })();
    return () => {
      active = false;
    };
  }, [inspection]);

  async function share(photo: (typeof inspection.photos)[number]) {
    try {
      const url = await getInspectionPhotoUrl(photo.path, 3600);
      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      if (nav.share) {
        await nav.share({ title: photo.file_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied — paste it anywhere to share.");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return; // share sheet dismissed
      toast.error("Could not create a share link");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-white rounded-[3px] shadow-2xl my-16">
        <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian/10">
          <div>
            <div className="eyebrow text-obsidian/50">Inspection Photos</div>
            <h2 className="display-serif text-xl text-obsidian mt-1">
              {labelFor(inspection.inspection_type)}
            </h2>
            <p className="text-xs text-obsidian/55 mt-1">
              {inspection.job_address || inspection.project_name}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-[3px] hover:bg-obsidian/5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {inspection.photos.map((p) => (
              <div
                key={p.path}
                className="group relative rounded-[3px] overflow-hidden border border-obsidian/10 bg-obsidian/[0.02]"
              >
                {urls[p.path] ? (
                  <a
                    href={urls[p.path]}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square"
                  >
                    <img
                      src={urls[p.path]}
                      alt={p.file_name}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ) : (
                  <div className="aspect-square grid place-items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-obsidian/40" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void share(p)}
                  className="absolute bottom-1 right-1 rounded-[3px] bg-obsidian/70 p-1.5 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  aria-label={`Share ${p.file_name}`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-obsidian/45">
            Click a photo to open it full-size. Tap the share icon to send a link anywhere.
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
            <div className="flex justify-between gap-4">
              <dt className="text-obsidian/55">Method</dt>
              <dd className="text-obsidian text-right">
                {inspection.request_method === "photos" ? "Uploaded photos" : "Live site visit"}
              </dd>
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
          {hasPhotos(inspection) && (
            <p className="text-[11px] text-obsidian/50">
              {inspection.photos.length} jobsite photo{inspection.photos.length === 1 ? "" : "s"} on
              file — use "View photos" on the card to open or share them.
            </p>
          )}
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
          <Button
            type="button"
            variant="outline"
            className="rounded-[3px]"
            onClick={onClose}
            disabled={saving}
          >
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
