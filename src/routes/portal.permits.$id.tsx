import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Save, AlertTriangle, FileText, Pencil, X, Lock, Plus, Search, Loader2, Eye, EyeOff, Download, Share2, RotateCcw, Cloud, Package, Scale, QrCode } from "lucide-react";
import { NtoSection } from "@/components/nto-section";
import { getBundle } from "@/lib/bundle";
import { CoChecklistPanel } from "@/components/co-checklist-panel";
import { LienReleasesPanel } from "@/components/lien-releases-panel";
import { PermitAlertsInline } from "@/components/permit-alerts-inline";
import { InspectionsPanel } from "@/components/inspections-panel";
import { PermitFeesPanel } from "@/components/permit-fees-panel";
import { ResubmittalPanel } from "@/components/resubmittal-panel";
import { ExpirationBanner } from "@/components/expiration-banner";
import { HomeownerShareDialog } from "@/components/homeowner-share-dialog";
import { DispatchCard } from "@/components/dispatch-card";
import { SubmittalPackageSection } from "@/components/submittal-package-section";
import { AdminPermitReviewActions } from "@/components/admin-permit-review-actions";
import { ServiceFeeInvoicePanel } from "@/components/service-fee-invoice-panel";
import { PreSubmissionGate } from "@/components/pre-submission-gate";
import { MunicipalitySubmissionGate } from "@/components/municipality-submission-gate";
import { CorrectionReviewGate } from "@/components/correction-review-gate";
import { ProjectAuditTab } from "@/components/project-audit-tab";
import { PermitNotesPanel } from "@/components/permit-notes-panel";
import { ProjectInternalOps } from "@/components/project-internal-ops";
import { isInternalUser } from "@/lib/is-internal-user";
import type { DispatchResult } from "@/lib/dispatch";
import { PageShell, Panel } from "@/components/ui-kit";


import { getPermit, updatePermit, deletePermit, permitCompleteness, getEffectiveDocs, getHiddenFieldKeys, withHiddenFieldKeys, ensureSubTokens, type PermitRow, type PermitStatus, type PermitDoc, type PermitSub } from "@/lib/permits-api";
import { PermitDocUploader } from "@/components/permit-doc-uploader";
import { BulkDocUpload } from "@/components/bulk-doc-upload";
import { deletePermitFile } from "@/lib/permit-storage";
import { supabase } from "@/integrations/supabase/client";
import { generatePermitExportPdf, suggestExportFilename } from "@/lib/permit-export";
import { uploadFileToGoogleDrive, getGoogleDriveStatus, startGoogleDriveConnect, saveGoogleDriveConnection } from "@/lib/google-drive.functions";
import { connectAppUser, getTopLevelAppUrl, isEmbeddedAppView, openAppInTopLevelTab } from "@/integrations/lovable/appUserConnectorClient";


export const Route = createFileRoute("/portal/permits/$id")({
  head: () => ({
    meta: [
      { title: "Permit — Cleard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PermitDetailPage,
});

const STATUSES: PermitStatus[] = [
  "submitted", "in_review", "corrections_required", "approved", "permit_issued", "on_hold", "outsourced_permitting", "cancelled",
];

type TabKey = "overview" | "details" | "documents" | "submission" | "compliance" | "money" | "share";
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "details", label: "Details" },
  { key: "documents", label: "Documents" },
  { key: "submission", label: "Submission" },
  { key: "compliance", label: "Compliance" },
  { key: "money", label: "Fees & Invoices" },
  { key: "share", label: "Sharing" },
];

function PermitDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<PermitRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<Partial<PermitRow>>({});
  const [pcnLoading, setPcnLoading] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mergingAttachments, setMergingAttachments] = useState(false);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [driveUploading, setDriveUploading] = useState(false);
  // Live verdict from the pre-submission gate; the permit row's copy is only the seed, and
  // goes stale the moment staff re-run the check.
  const [presubStatus, setPresubStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  



  useEffect(() => {
    getPermit(id)
      .then(async (r) => {
        if (!r) throw notFound();
        // Backfill accessTokens for legacy subs (created before per-sub
        // portal tokens existed). Best-effort — never blocks render.
        const { subs: withTokens, mutated } = ensureSubTokens(r.subs);
        if (mutated) {
          try {
            const updated = await updatePermit(r.id, { subs: withTokens });
            setRow(updated); setEdit(updated);
            return;
          } catch { /* fall through to raw row */ }
        }
        setRow(r); setEdit(r);
      })
      .catch(() => toast.error("Could not load permit"))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleSubConfirmed(idx: number) {
    if (!row) return;
    const current = row.subs?.[idx];
    if (!current) return;
    const nextSubs: PermitSub[] = (row.subs ?? []).map((s, i) =>
      i === idx
        ? { ...s, confirmed: !s.confirmed, confirmedAt: !s.confirmed ? new Date().toISOString() : s.confirmedAt }
        : s,
    );
    try {
      const updated = await updatePermit(row.id, { subs: nextSubs });
      setRow(updated); setEdit(updated);
      toast.success(nextSubs[idx].confirmed ? `Confirmed ${current.companyName}` : `Unconfirmed ${current.companyName}`);
    } catch (e) {
      toast.error("Could not update: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function copySubPortalLink(sub: PermitSub) {
    if (!sub.accessToken) { toast.error("No access token — save the permit first."); return; }
    const url = `${window.location.origin}/sub-portal/${sub.accessToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Sub portal link copied");
    } catch {
      window.prompt("Copy sub portal link:", url);
    }
  }

  async function save() {
    if (!row) return;
    setSaving(true);
    try {
      const updated = await updatePermit(row.id, edit);
      setRow(updated);
      setEdit(updated);
      setEditing(false);
      toast.success("Saved");
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (row) setEdit(row);
    setEditing(false);
  }


  async function remove() {
    if (!row) return;
    if (!confirm(`Delete permit "${row.project_name}"? This cannot be undone.`)) return;
    try {
      await deletePermit(row.id);
      toast.success("Deleted");
      navigate({ to: "/my-permits" });
    } catch (e) {
      toast.error("Delete failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function toggleFieldHidden(k: string) {
    if (!row) return;
    const current = getHiddenFieldKeys(row);
    const next = current.includes(k) ? current.filter((x) => x !== k) : [...current, k];
    const payload = withHiddenFieldKeys(row, next);
    try {
      const updated = await updatePermit(row.id, { intake_payload: payload });
      setRow(updated);
      setEdit((p) => ({ ...p, intake_payload: updated.intake_payload }));
    } catch (err) {
      toast.error("Update failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  async function openExport() {
    if (!row) return;
    setExportOpen(true);
    setExporting(true);
    setExportBlob(null);
    if (exportUrl) { URL.revokeObjectURL(exportUrl); setExportUrl(null); }
    try {
      // Phase 1: fast summary-only PDF for immediate preview
      const summary = await generatePermitExportPdf(row, { includeAttachments: false });
      setExportBlob(summary);
      setExportUrl(URL.createObjectURL(summary));
      setExporting(false);
      // Phase 2: merge attachments in background
      const hasAttachments = (row.documents ?? []).some((d) => d.status === "uploaded" && d.path);
      if (hasAttachments) {
        setMergingAttachments(true);
        try {
          const full = await generatePermitExportPdf(row, { includeAttachments: true });
          setExportBlob(full);
          setExportUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(full); });
        } catch (err) {
          toast.error("Attachments merge failed: " + (err instanceof Error ? err.message : String(err)));
        } finally {
          setMergingAttachments(false);
        }
      }
    } catch (err) {
      toast.error("Export failed: " + (err instanceof Error ? err.message : String(err)));
      setExportOpen(false);
      setExporting(false);
    }
  }

  function closeExport() {
    setExportOpen(false);
    if (exportUrl) { URL.revokeObjectURL(exportUrl); setExportUrl(null); }
    setExportBlob(null);
  }

  function downloadExport() {
    if (!exportBlob || !row) return;
    const url = URL.createObjectURL(exportBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestExportFilename(row);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareExport() {
    if (!exportBlob || !row) return;
    const filename = suggestExportFilename(row);
    const file = new File([exportBlob], filename, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: row.project_name, text: `Permit export: ${row.project_name}` });
      } catch (err) {
        if ((err as Error).name !== "AbortError") toast.error("Share failed: " + (err as Error).message);
      }
    } else {
      downloadExport();
      toast.info("Native sharing unavailable — file downloaded instead");
    }
  }

  async function uploadToDrive() {
    if (!exportBlob || !row) return;
    if (isEmbeddedAppView()) {
      if (openAppInTopLevelTab()) {
        toast.info("Google blocks sign-in inside the embedded preview. Continue from the full preview tab to upload to Drive.");
      } else {
        toast.error("Google blocks sign-in inside the embedded preview. Allow popups or open the full preview link manually.");
      }
      return;
    }
    setDriveUploading(true);
    try {
      // Ensure Google Drive is connected before attempting upload.
      const status = await getGoogleDriveStatus();
      if (!status.connected) {
        toast.info("Connect your Google Drive to continue…");
        const result = await connectAppUser({
          connectorId: "google_drive",
          gatewayBaseUrl: "https://connector-gateway.lovable.dev",
          start: async (targetOrigin) => startGoogleDriveConnect({ data: targetOrigin }),
        });
        if (!result.success) {
          if (result.requiresTopLevel) toast.info(result.error ?? "Open the portal in a new tab to connect Google Drive");
          else toast.error(result.error ?? "Google sign-in failed");
          return;
        }
        if (!result.connectionAPIKey) {
          toast.error("Google returned no offline access — cannot upload");
          return;
        }
        await saveGoogleDriveConnection({ data: { connectionAPIKey: result.connectionAPIKey } });
        toast.success("Google Drive connected");
      }

      const buf = new Uint8Array(await exportBlob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      const base64 = btoa(bin);
      const out = await uploadFileToGoogleDrive({
        data: { filename: suggestExportFilename(row), mime: "application/pdf", base64 },
      });
      toast.success("Uploaded to Google Drive");
      if (out?.webViewLink) window.open(out.webViewLink, "_blank", "noopener");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("403") || msg.toLowerCase().includes("scope")) {
        toast.error("Reconnect Google Drive to grant upload permission");
      } else {
        toast.error("Drive upload failed: " + msg);
      }
    } finally {
      setDriveUploading(false);
    }
  }

  if (loading) return <div className="px-6 py-12 text-muted-foreground">Loading…</div>;
  if (!row) return <div className="px-6 py-12 text-muted-foreground">Permit not found.</div>;

  const c = permitCompleteness(row);
  const missingFieldKeys = new Set(c.missingFields.map((f) => f.key));
  const hiddenFieldSet = new Set(getHiddenFieldKeys(row));
  const barColor = c.percent === 100 ? "#3f5749" : c.percent >= 60 ? "#2F4F4F" : c.percent >= 30 ? "#d97706" : "#8c3b3b";
  const inputBase = "block w-full border bg-white px-3 py-2 text-sm text-obsidian rounded-[3px] focus:outline-none";
  const isHidden = (k: string) => hiddenFieldSet.has(k);
  const inputCls = (k: string) => `${inputBase} ${isHidden(k) ? "border-obsidian/10 bg-obsidian/[0.03] text-obsidian/40 line-through" : missingFieldKeys.has(k) ? "border-red-500/60 focus:border-red-600" : "border-obsidian/15 focus:border-obsidian/40"}`;
  const labelCls = (k: string) => `flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] mb-1.5 ${isHidden(k) ? "text-obsidian/40 line-through" : missingFieldKeys.has(k) ? "text-red-700" : "text-obsidian/60"}`;
  const flag = (k: string) => (!isHidden(k) && missingFieldKeys.has(k)) ? <AlertTriangle className="h-3 w-3 text-red-600" /> : null;
  const fieldDelBtn = (k: string) => editing ? (
    <button
      type="button"
      onClick={() => toggleFieldHidden(k)}
      title={isHidden(k) ? "Restore field" : "Remove this field from this permit"}
      className={`ml-auto inline-flex items-center rounded-[3px] p-0.5 ${isHidden(k) ? "text-obsidian/50 hover:text-obsidian" : "text-obsidian/30 hover:text-red-600"}`}
    >
      {isHidden(k) ? <RotateCcw className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
    </button>
  ) : null;

  function set<K extends keyof PermitRow>(k: K, v: PermitRow[K]) { setEdit((p) => ({ ...p, [k]: v })); }
  const e = edit as PermitRow;
  const docs = getEffectiveDocs(row);


  const lastEditedAt = (() => {
    const ip = (row.intake_payload ?? {}) as Record<string, unknown>;
    return typeof ip.last_edited_at === "string" ? ip.last_edited_at : null;
  })();

  return (
    <PageShell
      crumbs={[{ label: "My Permits", to: "/my-permits" }, { label: row.project_name }]}
      title={row.project_name}
      meta={
        <>
          {row.job_address}
          {lastEditedAt && <span className="text-[var(--p-warning)]"> · Last edited {new Date(lastEditedAt).toLocaleString()}</span>}
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {!editing ? (
            <>
              {getBundle(row)?.enabled && (
                <Link
                  to="/portal/permits/$id/bundle"
                  params={{ id: row.id }}
                  className="p-btn p-btn-ghost"
                >
                  <Package className="h-3.5 w-3.5" /> Bundle
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Read only
              </span>
              <button onClick={openExport} className="p-btn p-btn-ghost">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <Link to="/portal/bid-review" className="p-btn p-btn-ghost">
                <Scale className="h-3.5 w-3.5" /> Bid Review
              </Link>
              <Link
                to="/permit-card/$id"
                params={{ id: row.id }}
                target="_blank"
                className="p-btn p-btn-ghost"
              >
                <QrCode className="h-3.5 w-3.5" /> Permit Card
              </Link>
              <Link
                to="/portal/permits/new"
                search={{ edit: row.id }}
                className="p-btn p-btn-ghost"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Submission
              </Link>
              <button onClick={() => setEditing(true)} className="p-btn p-btn-primary">
                <Pencil className="h-3.5 w-3.5" /> Quick Edit
              </button>
              <button onClick={remove} className="p-btn p-btn-danger">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={openExport} className="p-btn p-btn-ghost">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button onClick={cancelEdit} disabled={saving} className="p-btn p-btn-ghost disabled:opacity-60">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button onClick={save} disabled={saving} className="p-btn p-btn-primary disabled:opacity-60">
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={remove} className="p-btn p-btn-danger">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      }
    >
      <AdminPermitReviewActions permit={row} onUpdated={(r) => { setRow(r); setEdit(r); }} />

      {/* Tab bar — keeps the whole record one screen tall */}
      <div className="mt-3 flex items-center gap-1 overflow-x-auto border-b border-obsidian/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              tab === t.key
                ? "border-obsidian text-obsidian"
                : "border-transparent text-obsidian/55 hover:text-obsidian"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-3 space-y-3">
          {/* Compact completeness strip */}
          <div className="p-plate flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5">
            <div className="flex min-w-[200px] flex-1 items-center gap-2.5">
              <span className="shrink-0 text-[12.5px] font-medium text-obsidian">
                {c.done}/{c.total} complete
              </span>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-obsidian/10">
                <div className="h-full transition-all" style={{ width: `${c.percent}%`, background: barColor }} />
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-obsidian/60">{c.percent}%</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-obsidian/60">
              <span>Fields <span className="font-medium tabular-nums text-obsidian">{c.fieldsDone}/{c.fieldsTotal}</span></span>
              <span>Docs <span className="font-medium tabular-nums text-obsidian">{c.docsDone}/{c.docsTotal}</span></span>
              {c.missingFields.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTab("details")}
                  className="inline-flex items-center gap-1 rounded-[3px] bg-red-50 px-1.5 py-0.5 text-red-700"
                >
                  <AlertTriangle className="h-3 w-3" /> {c.missingFields.length} fields
                </button>
              )}
              {c.missingDocs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTab("documents")}
                  className="inline-flex items-center gap-1 rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-amber-800"
                >
                  <FileText className="h-3 w-3" /> {c.missingDocs.length} docs
                </button>
              )}
            </div>
          </div>

          {(c.missingFields.length > 0 || c.missingDocs.length > 0) && (
            <details className="p-plate px-3 py-2">
              <summary className="cursor-pointer text-[12.5px] font-medium text-obsidian/80">
                Outstanding items ({c.missingFields.length + c.missingDocs.length})
              </summary>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {c.missingFields.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-red-800">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missing fields
                    </div>
                    <ul className="mt-1 space-y-0.5 text-[12px] text-obsidian/70">
                      {c.missingFields.map((f) => <li key={f.key}>• {f.label}</li>)}
                    </ul>
                  </div>
                )}
                {c.missingDocs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-amber-900">
                      <FileText className="h-3.5 w-3.5" /> Missing documents
                    </div>
                    <ul className="mt-1 space-y-0.5 text-[12px] text-obsidian/70">
                      {c.missingDocs.map((d) => (
                        <li key={d.key} className="flex items-center justify-between gap-2">
                          <span>
                            • {d.label}
                            {d.required && <span className="ml-1.5 font-mono text-[10px] uppercase text-red-700">Required</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTab("documents");
                              setTimeout(() => {
                                document.getElementById(`doc-${d.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }, 60);
                            }}
                            className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800 hover:underline"
                          >
                            Upload →
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="grid min-w-0 gap-3 xl:grid-cols-2">
            <div className="min-w-0 space-y-3">
              {isInternalUser() && <ProjectInternalOps permitId={row.id} label={row.project_name} />}
              <PermitNotesPanel permitId={row.id} />
            </div>
            <div className="min-w-0">
              <ProjectAuditTab permitId={row.id} />
            </div>
          </div>
        </div>
      )}

      {tab === "details" && (
      <fieldset disabled={!editing} className="mt-3 grid gap-3 md:grid-cols-2 disabled:opacity-90">
        <div className="p-plate p-4 space-y-4">
          <div className="p-eyebrow">Project</div>
          <div><label className={labelCls("project_name")}>Project Name {flag("project_name")}{fieldDelBtn("project_name")}</label><input className={inputCls("project_name")} value={e.project_name ?? ""} onChange={(ev) => set("project_name", ev.target.value)} /></div>
          <div><label className={labelCls("job_address")}>Address {flag("job_address")}{fieldDelBtn("job_address")}</label><input className={inputCls("job_address")} value={e.job_address ?? ""} onChange={(ev) => set("job_address", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls("city")}>City {flag("city")}{fieldDelBtn("city")}</label><input className={inputCls("city")} value={e.city ?? ""} onChange={(ev) => set("city", ev.target.value)} /></div>
            <div><label className={labelCls("county")}>County {flag("county")}{fieldDelBtn("county")}</label><input className={inputCls("county")} value={e.county ?? ""} onChange={(ev) => set("county", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls("municipality")}>Municipality {flag("municipality")}{fieldDelBtn("municipality")}</label><input className={inputCls("municipality")} value={e.municipality ?? ""} onChange={(ev) => set("municipality", ev.target.value)} /></div>
          <div><label className={labelCls("permit_type")}>Permit Type {flag("permit_type")}{fieldDelBtn("permit_type")}</label><input className={inputCls("permit_type")} value={e.permit_type ?? ""} onChange={(ev) => set("permit_type", ev.target.value)} /></div>
          <div><label className={labelCls("permit_number")}>Permit # {flag("permit_number")}{fieldDelBtn("permit_number")}</label><input className={inputCls("permit_number")} value={e.permit_number ?? ""} onChange={(ev) => set("permit_number", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls("construction_value_cents")}>Construction Value (USD) {flag("construction_value_cents")}{fieldDelBtn("construction_value_cents")}</label>
              <input type="number" className={inputCls("construction_value_cents")} value={e.construction_value_cents ? Math.round(e.construction_value_cents / 100) : ""} onChange={(ev) => set("construction_value_cents", ev.target.value ? Math.round(Number(ev.target.value) * 100) : 0)} />
            </div>
            <div>
              <label className={labelCls("pcn")}>PCN {flag("pcn")}{fieldDelBtn("pcn")}</label>
              <div className="flex gap-1.5">
                <input className={inputCls("pcn") + " flex-1"} value={e.pcn ?? ""} onChange={(ev) => set("pcn", ev.target.value)} />
                <button
                  type="button"
                  disabled={!editing || pcnLoading || !e.job_address || !e.county}
                  title={!e.job_address || !e.county ? "Address and county required" : "Look up PCN from dispatch cache"}
                  onClick={async () => {
                    if (!e.job_address || !e.county) return;
                    setPcnLoading(true);
                    try {
                      const { data } = await supabase
                        .from("dispatch_results")
                        .select("parcel_id, parcel_source, fetched_at")
                        .eq("permit_id", e.id)
                        .order("fetched_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();
                      if (data?.parcel_id) {
                        set("pcn", data.parcel_id);
                        toast.success(`PCN found from ${data.parcel_source ?? "dispatch"}`);
                      } else {
                        toast.error("Not found — run Dispatch or enter manually");
                      }
                    } catch {
                      toast.error("Not found — enter manually");
                    } finally {
                      setPcnLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-1 border border-obsidian/20 bg-white px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-50"
                >
                  {pcnLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />} Lookup
                </button>
              </div>
            </div>
          </div>


          <div><label className={labelCls("submitted_date")}>Submitted Date {flag("submitted_date")}{fieldDelBtn("submitted_date")}</label><input type="date" className={inputCls("submitted_date")} value={e.submitted_date ?? ""} onChange={(ev) => set("submitted_date", ev.target.value)} /></div>
          <div>
            <label className={labelCls("status")}>Status</label>
            <select className={inputCls("status")} value={e.status ?? "submitted"} onChange={(ev) => set("status", ev.target.value as PermitStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div><label className={labelCls("description")}>Description {flag("description")}{fieldDelBtn("description")}</label><textarea rows={3} className={inputCls("description")} value={e.description ?? ""} onChange={(ev) => set("description", ev.target.value)} /></div>
        </div>

        <div className="p-plate p-4 space-y-4">
          <div className="p-eyebrow">Contractor & Owner</div>
          <div><label className={labelCls("contractor_company")}>Contractor Company {flag("contractor_company")}{fieldDelBtn("contractor_company")}</label><input className={inputCls("contractor_company")} value={e.contractor_company ?? ""} onChange={(ev) => set("contractor_company", ev.target.value)} /></div>
          <div><label className={labelCls("contractor_qualifier")}>Qualifier {flag("contractor_qualifier")}{fieldDelBtn("contractor_qualifier")}</label><input className={inputCls("contractor_qualifier")} value={e.contractor_qualifier ?? ""} onChange={(ev) => set("contractor_qualifier", ev.target.value)} /></div>
          <div><label className={labelCls("company_address")}>Company Address {flag("company_address")}{fieldDelBtn("company_address")}</label><input className={inputCls("company_address")} value={e.company_address ?? ""} onChange={(ev) => set("company_address", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls("poc")}>POC {flag("poc")}{fieldDelBtn("poc")}</label><input className={inputCls("poc")} value={e.poc ?? ""} onChange={(ev) => set("poc", ev.target.value)} /></div>
            <div><label className={labelCls("poc_phone")}>POC Phone {flag("poc_phone")}{fieldDelBtn("poc_phone")}</label><input className={inputCls("poc_phone")} value={e.poc_phone ?? ""} onChange={(ev) => set("poc_phone", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls("poc_email")}>POC Email {flag("poc_email")}{fieldDelBtn("poc_email")}</label><input className={inputCls("poc_email")} value={e.poc_email ?? ""} onChange={(ev) => set("poc_email", ev.target.value)} /></div>
          <div><label className={labelCls("license_number")}>License # {flag("license_number")}{fieldDelBtn("license_number")}</label><input className={inputCls("license_number")} value={e.license_number ?? ""} onChange={(ev) => set("license_number", ev.target.value)} /></div>
          <div>
            <label className={labelCls("correction_reply_email")}>Correction Reply Email {flag("correction_reply_email")}{fieldDelBtn("correction_reply_email")}</label>
            <input type="email" className={inputCls("correction_reply_email")} value={e.correction_reply_email ?? ""} onChange={(ev) => set("correction_reply_email", ev.target.value)} />
            <p className="mt-1 font-mono text-[10px] text-obsidian/50">Reviewer who issues correction letters on this job. Used ahead of the municipality's general intake address; a correction acknowledgment cannot be approved unless one of those two is set, and Plantation currently has no intake address.</p>
          </div>
          <div className="pt-2 border-t border-obsidian/10">
            <label className={labelCls("owner_name")}>Owner Name {flag("owner_name")}{fieldDelBtn("owner_name")}</label><input className={inputCls("owner_name")} value={e.owner_name ?? ""} onChange={(ev) => set("owner_name", ev.target.value)} />
          </div>
          <div><label className={labelCls("owner_entity")}>Owner Entity {fieldDelBtn("owner_entity")}</label><input className={inputCls("owner_entity")} value={e.owner_entity ?? ""} onChange={(ev) => set("owner_entity", ev.target.value)} /></div>
        </div>
      </fieldset>
      )}




      {tab === "documents" && (
      <>
      <div className="mt-3 p-plate p-4">

        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <div className="p-eyebrow">Documents</div>
          <div className="flex items-center gap-3">
            {docs.some((d) => d.status === "not_applicable") && (
              <button
                type="button"
                onClick={() => setShowHidden((v) => !v)}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian"
              >
                {showHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showHidden ? "Hide" : "Show"} not-required ({docs.filter((d) => d.status === "not_applicable").length})
              </button>
            )}
            <span className="font-mono text-[11px] tabular-nums text-obsidian/60">{c.docsDone}/{c.docsTotal} complete</span>
          </div>
        </div>
        <div className="text-[12px] text-obsidian/55 mb-2">
          Files upload to secure cloud storage. Google Drive & OneDrive import requires the App User Connector to be enabled in workspace settings.
        </div>
        <div>
          {docs.filter((d) => showHidden || d.status !== "not_applicable").map((d) => (
            <div key={d.key} id={`doc-${d.key}`}>
              <PermitDocUploader
                permit={row}
                doc={d}
                readOnly={!editing}
                onChange={(u) => { setRow(u); setEdit(u); }}
                onRename={d.custom ? async (label) => {
                  const next = docs.map((x) => x.key === d.key ? { ...x, label } : x);
                  const updated = await updatePermit(row.id, { documents: next });
                  setRow(updated); setEdit(updated);
                } : undefined}
                onDeleteField={d.custom ? async () => {
                  if (!confirm(`Delete field "${d.label}"? Any uploaded file will also be removed.`)) return;
                  if (d.path) { try { await deletePermitFile(d.path); } catch { /* ignore */ } }
                  const next = docs.filter((x) => x.key !== d.key);
                  const updated = await updatePermit(row.id, { documents: next });
                  setRow(updated); setEdit(updated);
                  toast.success("Field removed");
                } : undefined}
              />
            </div>
          ))}
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-obsidian/10">
            <button
              type="button"
              onClick={async () => {
                const label = window.prompt("Name this document field (e.g. Soil Report)");
                if (!label || !label.trim()) return;
                const newDoc: PermitDoc = {
                  key: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  label: label.trim(),
                  required: false,
                  status: "missing",
                  filename: null,
                  custom: true,
                };
                const next = [...docs, newDoc];
                try {
                  const updated = await updatePermit(row.id, { documents: next });
                  setRow(updated); setEdit(updated);
                  toast.success("Field added");
                } catch (e) {
                  toast.error("Add failed: " + (e instanceof Error ? e.message : String(e)));
                }
              }}
              className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
            >
              <Plus className="h-3.5 w-3.5" /> Add custom document field
            </button>
            <div className="mt-4">
              <BulkDocUpload permit={row} onChange={(u) => { setRow(u); setEdit(u); }} />
            </div>
          </div>
        )}
      </div>

      <SubmittalPackageSection row={row} onChange={(r) => { setRow(r); setEdit(r); }} />
      </>
      )}

      {tab === "submission" && (
      <section id="pre-submission" className="mt-3">
        <div className="p-eyebrow mb-2">Pre-Submission</div>
        <PreSubmissionGate permit={row} onVerdict={setPresubStatus} />
        <div className="mt-3">
          <MunicipalitySubmissionGate
            permitId={row.id}
            preSubmissionPassed={presubStatus === "pass"}
          />
        </div>
        {/* Agent 7: renders itself only once a correction notice has been parsed. */}
        <div className="mt-3">
          <CorrectionReviewGate permitId={row.id} />
        </div>
      </section>
      )}

      {tab === "money" && (
      <div className="mt-3">
        <ServiceFeeInvoicePanel
          permitId={row.id}
          projectAddress={row.job_address ?? row.project_name ?? ""}
          totalProjectValueCents={(row as any).total_project_value_cents ?? null}
          permitStatus={row.status}
        />
      </div>
      )}



      {tab === "details" && (
      <>
      {row.subs && row.subs.length > 0 && (
        <div className="mt-6 p-plate p-4">
          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
            <div className="p-eyebrow">Subcontractors on this Permit</div>
            <div className="text-[10px] font-mono text-obsidian/45">Confirm a sub to grant them read-only project-doc access.</div>
          </div>
          <ul className="divide-y divide-obsidian/10">
            {row.subs.map((s, i) => (
              <li key={i} className="py-3 text-sm flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-obsidian font-medium">{s.companyName}</span>
                    <span className="text-obsidian/50 text-[12px]">— {s.trade}</span>
                    {s.confirmed ? (
                      <span className="inline-flex items-center border border-emerald-600/40 bg-emerald-50 text-emerald-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] rounded-[3px]">
                        Confirmed on job
                      </span>
                    ) : (
                      <span className="inline-flex items-center border border-obsidian/20 bg-obsidian/[0.03] text-obsidian/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] rounded-[3px]">
                        Not confirmed
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-obsidian/60 mt-0.5">
                    {[s.qualifierName, s.licenseNumber && `Lic ${s.licenseNumber}`, s.contactEmail].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSubConfirmed(i)}
                    className="inline-flex items-center border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
                  >
                    {s.confirmed ? "Unconfirm" : "Confirm on job"}
                  </button>
                  {s.confirmed && (
                    <button
                      type="button"
                      onClick={() => copySubPortalLink(s)}
                      className="inline-flex items-center gap-1.5 border border-obsidian bg-obsidian px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] hover:bg-obsidian/90"
                    >
                      <Share2 className="h-3 w-3" /> Copy portal link
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <NtoSection
          permitId={row.id}
          propertyAddress={row.job_address}
          ownerName={row.owner_name}
          contractorCompany={row.contractor_company}
        />
      </div>



      <div className="mt-6 text-[11px] font-mono text-obsidian/45">
        Created {new Date(row.created_at).toLocaleString()} · Updated {new Date(row.updated_at).toLocaleString()}
      </div>
      </>
      )}

      {exportOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-obsidian/70">
          <div className="flex items-center justify-between gap-3 bg-white border-b border-obsidian/10 px-4 py-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-obsidian/60">Export Preview</div>
              <div className="text-sm font-medium text-obsidian truncate">{row.project_name}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {mergingAttachments && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-obsidian/60">
                  <Loader2 className="h-3 w-3 animate-spin" /> Merging attachments…
              </span>
              )}
              <button
                onClick={() => exportUrl && window.open(exportUrl, "_blank", "noopener")}
                disabled={!exportUrl}
                className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-50"
              >
                Open in tab
              </button>
              <button
                onClick={downloadExport}
                disabled={!exportBlob}
                className="inline-flex items-center gap-2 bg-obsidian px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] hover:bg-obsidian/90 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                onClick={shareExport}
                disabled={!exportBlob}
                className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-50"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button
                onClick={uploadToDrive}
                disabled={!exportBlob || driveUploading}
                title={isEmbeddedAppView() ? "Google sign-in opens in a top-level tab from preview" : "Upload export to Google Drive"}
                className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-50"
              >
                {driveUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cloud className="h-3.5 w-3.5" />}
                Drive
              </button>
              {isEmbeddedAppView() && (
                <button
                  onClick={() => {
                    if (!openAppInTopLevelTab()) toast.error("Popup blocked. Use the full preview link shown below.");
                  }}
                  className="inline-flex items-center gap-2 border border-sky/50 bg-sky/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-sky/25"
                >
                  Open full preview
                </button>
              )}
              <button
                onClick={closeExport}
                aria-label="Close"
                className="ml-1 inline-flex h-8 w-8 items-center justify-center border border-obsidian/20 bg-white text-obsidian rounded-[3px] hover:bg-obsidian/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-obsidian/10 min-h-0 relative">
            {exporting || !exportUrl ? (
              <div className="h-full flex items-center justify-center text-paper/90">
                <div className="inline-flex items-center gap-3 bg-white text-obsidian px-4 py-3 rounded-[3px] shadow">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Building preview…</span>
                </div>
              </div>
            ) : (
              <>
                <object
                  key={exportUrl}
                  data={exportUrl}
                  type="application/pdf"
                  className="w-full h-full bg-white"
                >
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="max-w-md text-center p-plate p-4">
                      <div className="text-sm text-obsidian mb-3">
                        Your browser blocked the inline PDF preview. Open it in a new tab or download the file.
                      </div>
                      {isEmbeddedAppView() && (
                        <div className="mb-3 break-all font-mono text-[10px] text-obsidian/50">{getTopLevelAppUrl()}</div>
                      )}
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => window.open(exportUrl!, "_blank", "noopener")}
                          className="inline-flex items-center gap-2 bg-obsidian px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
                        >
                          Open in new tab
                        </button>
                        <button
                          onClick={downloadExport}
                          className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px]"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                </object>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "compliance" && (
      <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-2">
        <section id="co-checklist" className="min-w-0">
          <div className="p-eyebrow mb-2">Certificate of Occupancy</div>
          <CoChecklistPanel permitId={row.id} projectName={row.project_name} tenantId={row.tenant_id ?? null} />
        </section>
        <section id="lien-releases" className="min-w-0">
          <div className="p-eyebrow mb-2">Lien Releases</div>
          <LienReleasesPanel permit={row} />
        </section>
      </div>
      )}

      {tab === "overview" && (
      <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-2">
        <section id="victoria-alerts" className="min-w-0">
          <div className="p-eyebrow mb-2">Victoria Alerts</div>
          <PermitAlertsInline permitId={row.id} />
        </section>
        <section className="min-w-0">
          <ExpirationBanner
            permitId={row.id}
            expirationDate={(row as any).expiration_date ?? null}
            extensionRequestedAt={(row as any).extension_requested_at ?? null}
            onChange={() => getPermit(row.id).then((r) => r && setRow(r))}
          />
        </section>
      </div>
      )}

      {tab === "compliance" && (
      <section id="inspections" className="mt-3">
        <div className="p-eyebrow mb-2">Inspections</div>
        <InspectionsPanel permitId={row.id} tenantId={row.tenant_id ?? null} permitStatus={row.status} />
      </section>
      )}

      {tab === "submission" && (
      <>
      {/* Resubmittal Workflow */}
      <section id="resubmittal" className="mt-4">
        <div className="p-eyebrow mb-2">Resubmittal Workflow</div>
        <ResubmittalPanel
          permitId={row.id}
          tenantId={row.tenant_id ?? null}
          permitStatus={row.status}
          onResubmitted={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>
      </>
      )}

      {tab === "money" && (
      <>
      {/* Permit Fees */}
      <section id="fees" className="mt-3">
        <div className="p-eyebrow mb-2">Permit Fees</div>
        <PermitFeesPanel
          permitId={row.id}
          estimatedCents={(row as any).estimated_fee_cents ?? null}
          actualCents={(row as any).actual_fee_cents ?? null}
          paidDate={(row as any).fee_paid_date ?? null}
          paymentMethod={(row as any).fee_payment_method ?? null}
          onChanged={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>
      </>
      )}

      {tab === "share" && (
      <>
      {/* Homeowner Share */}
      <section id="homeowner-share" className="mt-3 mb-4">
        <div className="p-eyebrow mb-2">Homeowner Status</div>
        <HomeownerShareDialog
          permitId={row.id}
          existingToken={(row as any).homeowner_share_token ?? null}
          onToken={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>
      </>
      )}

      {tab === "details" && (
      <>
      {(() => {
        const ip = (row.intake_payload ?? {}) as Record<string, unknown>;
        const d = ip.dispatch as DispatchResult | undefined;
        if (!d) return null;
        return (
          <section id="dispatch" className="mt-10 mb-10">
            <div className="p-eyebrow mb-2">Dispatch — Property Intelligence</div>
            <DispatchCard data={d} />
          </section>
        );
      })()}

      {(() => {
        const ip = (row.intake_payload ?? {}) as Record<string, unknown>;
        const awarded = ip.awarded_bid as { company_name?: string; trade?: string; bid_cents?: number | null; awarded_at?: string } | undefined;
        if (!awarded) return null;
        return (
          <section className="mt-6 mb-10">
            <div className="rounded-[3px] border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-center gap-3">
              <Scale className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">Awarded to {awarded.company_name}</div>
                <div className="text-xs text-emerald-800/80">
                  {awarded.trade ?? ""}{awarded.bid_cents != null ? ` · $${(awarded.bid_cents / 100).toLocaleString()}` : ""}
                  {awarded.awarded_at ? ` · ${new Date(awarded.awarded_at).toLocaleDateString()}` : ""}
                </div>
              </div>
              <Link to="/portal/bid-review" className="border border-emerald-700/30 rounded-[3px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
                Open Bid Review
              </Link>
            </div>
          </section>
        );
      })()}
      </>
      )}
    </PageShell>
  );
}

