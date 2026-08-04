import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Save, AlertTriangle, FileText, Pencil, X, Lock, Plus, Search, Loader2, Eye, EyeOff, Download, Share2, RotateCcw, Cloud, Package, Scale } from "lucide-react";
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
import type { DispatchResult } from "@/lib/dispatch";


import { getPermit, updatePermit, deletePermit, permitCompleteness, getEffectiveDocs, getHiddenFieldKeys, withHiddenFieldKeys, ensureSubTokens, type PermitRow, type PermitStatus, type PermitDoc, type PermitSub } from "@/lib/permits-api";
import { PermitDocUploader } from "@/components/permit-doc-uploader";
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

  if (loading) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Loading…</div>;
  if (!row) return <div className="mx-auto max-w-5xl px-6 py-12 text-obsidian/60">Permit not found.</div>;

  const c = permitCompleteness(row);
  const missingFieldKeys = new Set(c.missingFields.map((f) => f.key));
  const hiddenFieldSet = new Set(getHiddenFieldKeys(row));
  const barColor = c.percent === 100 ? "#16a34a" : c.percent >= 60 ? "#153157" : c.percent >= 30 ? "#d97706" : "#dc2626";
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


  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/my-permits" className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Permits
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-obsidian/10 pb-6">
        <div>
          <div className="eyebrow text-obsidian/50">Permit</div>
          <h1 className="display-serif mt-2 text-4xl text-obsidian">{row.project_name}</h1>
          <div className="mt-2 text-sm text-obsidian/60">{row.job_address}</div>
          {(() => {
            const ip = (row.intake_payload ?? {}) as Record<string, unknown>;
            const le = typeof ip.last_edited_at === "string" ? ip.last_edited_at : null;
            if (!le) return null;
            return (
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-700">
                Last edited {new Date(le).toLocaleString()}
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              {getBundle(row)?.enabled && (
                <Link
                  to="/portal/permits/$id/bundle"
                  params={{ id: row.id }}
                  className="inline-flex items-center gap-2 border border-obsidian/20 bg-obsidian/[0.03] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/[0.06]"
                >
                  <Package className="h-3.5 w-3.5" /> Bundle
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
                <Lock className="h-3 w-3" /> Read only
              </span>
              <button onClick={openExport} className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <Link to="/portal/bid-review" className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                <Scale className="h-3.5 w-3.5" /> Bid Review
              </Link>
              <Link
                to="/portal/permits/new"
                search={{ edit: row.id }}
                className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Submission
              </Link>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]">
                <Pencil className="h-3.5 w-3.5" /> Quick Edit
              </button>
              <button onClick={remove} className="inline-flex items-center gap-2 border border-red-600/30 text-red-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={openExport} className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <button onClick={cancelEdit} disabled={saving} className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] disabled:opacity-60">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-60">
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={remove} className="inline-flex items-center gap-2 border border-red-600/30 text-red-700 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>

      </div>

      <AdminPermitReviewActions permit={row} onUpdated={(r) => { setRow(r); setEdit(r); }} />

      {/* Completeness panel */}
      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Permit Completeness</div>
            <div className="mt-1 text-sm text-obsidian/70">
              <span className="font-medium text-obsidian">{c.done}/{c.total}</span> items complete — {c.percent}%
            </div>
          </div>
          <div className="flex gap-4 text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/60">
            <span>Fields: <span className="text-obsidian font-medium tabular-nums">{c.fieldsDone}/{c.fieldsTotal}</span></span>
            <span>Docs: <span className="text-obsidian font-medium tabular-nums">{c.docsDone}/{c.docsTotal}</span></span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-obsidian/10 rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${c.percent}%`, background: barColor }} />
        </div>

        {(c.missingFields.length > 0 || c.missingDocs.length > 0) && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {c.missingFields.length > 0 && (
              <div className="border border-red-500/30 bg-red-50 rounded-[3px] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <AlertTriangle className="h-4 w-4" /> {c.missingFields.length} missing field{c.missingFields.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-2 text-[12px] text-red-900/80 space-y-1">
                  {c.missingFields.map((f) => (
                    <li key={f.key}>• {f.label}</li>
                  ))}
                </ul>
              </div>
            )}
            {c.missingDocs.length > 0 && (
              <div className="border border-amber-500/40 bg-amber-50 rounded-[3px] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                  <FileText className="h-4 w-4" /> {c.missingDocs.length} missing document{c.missingDocs.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-2 text-[12px] text-amber-900/80 space-y-1">
                  {c.missingDocs.map((d) => (
                    <li key={d.key} className="flex items-center justify-between gap-2">
                      <span>• {d.label}{d.required && <span className="ml-1.5 text-[10px] font-mono uppercase text-red-700">Required</span>}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`doc-${d.key}`);
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
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
        )}
      </div>

      <fieldset disabled={!editing} className="mt-6 grid gap-6 md:grid-cols-2 disabled:opacity-90">
        <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Project</div>
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

        <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Contractor & Owner</div>
          <div><label className={labelCls("contractor_company")}>Contractor Company {flag("contractor_company")}{fieldDelBtn("contractor_company")}</label><input className={inputCls("contractor_company")} value={e.contractor_company ?? ""} onChange={(ev) => set("contractor_company", ev.target.value)} /></div>
          <div><label className={labelCls("contractor_qualifier")}>Qualifier {flag("contractor_qualifier")}{fieldDelBtn("contractor_qualifier")}</label><input className={inputCls("contractor_qualifier")} value={e.contractor_qualifier ?? ""} onChange={(ev) => set("contractor_qualifier", ev.target.value)} /></div>
          <div><label className={labelCls("company_address")}>Company Address {flag("company_address")}{fieldDelBtn("company_address")}</label><input className={inputCls("company_address")} value={e.company_address ?? ""} onChange={(ev) => set("company_address", ev.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls("poc")}>POC {flag("poc")}{fieldDelBtn("poc")}</label><input className={inputCls("poc")} value={e.poc ?? ""} onChange={(ev) => set("poc", ev.target.value)} /></div>
            <div><label className={labelCls("poc_phone")}>POC Phone {flag("poc_phone")}{fieldDelBtn("poc_phone")}</label><input className={inputCls("poc_phone")} value={e.poc_phone ?? ""} onChange={(ev) => set("poc_phone", ev.target.value)} /></div>
          </div>
          <div><label className={labelCls("poc_email")}>POC Email {flag("poc_email")}{fieldDelBtn("poc_email")}</label><input className={inputCls("poc_email")} value={e.poc_email ?? ""} onChange={(ev) => set("poc_email", ev.target.value)} /></div>
          <div><label className={labelCls("license_number")}>License # {flag("license_number")}{fieldDelBtn("license_number")}</label><input className={inputCls("license_number")} value={e.license_number ?? ""} onChange={(ev) => set("license_number", ev.target.value)} /></div>
          <div className="pt-2 border-t border-obsidian/10">
            <label className={labelCls("owner_name")}>Owner Name {flag("owner_name")}{fieldDelBtn("owner_name")}</label><input className={inputCls("owner_name")} value={e.owner_name ?? ""} onChange={(ev) => set("owner_name", ev.target.value)} />
          </div>
          <div><label className={labelCls("owner_entity")}>Owner Entity {fieldDelBtn("owner_entity")}</label><input className={inputCls("owner_entity")} value={e.owner_entity ?? ""} onChange={(ev) => set("owner_entity", ev.target.value)} /></div>
        </div>
      </fieldset>



      <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Documents</div>
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
          </div>
        )}
      </div>

      <SubmittalPackageSection row={row} onChange={(r) => { setRow(r); setEdit(r); }} />

      {/* Pre-submission completeness gate */}
      <section id="pre-submission" className="mt-10">
        <div className="eyebrow text-obsidian/50 mb-3">Pre-Submission</div>
        <PreSubmissionGate permit={row} />
        <div className="mt-4">
          <MunicipalitySubmissionGate
            permitId={row.id}
            preSubmissionPassed={(row as any).pre_submission_status === "pass"}
          />
        </div>
      </section>

      <div className="mt-6">
        <ServiceFeeInvoicePanel
          permitId={row.id}
          projectAddress={row.job_address ?? row.project_name ?? ""}
          totalProjectValueCents={(row as any).total_project_value_cents ?? null}
          permitStatus={row.status}
        />
      </div>



      {row.subs && row.subs.length > 0 && (
        <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-6">
          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75">Subcontractors on this Permit</div>
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
                    <div className="max-w-md text-center bg-white border border-obsidian/10 rounded-[3px] p-6">
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

      {/* CO Checklist */}
      <section id="co-checklist" className="mt-10">
        <div className="eyebrow text-obsidian/50 mb-3">Certificate of Occupancy</div>
        <CoChecklistPanel permitId={row.id} projectName={row.project_name} tenantId={row.tenant_id ?? null} />
      </section>

      {/* Lien Releases */}
      <section id="lien-releases" className="mt-10">
        <div className="eyebrow text-obsidian/50 mb-3">Lien Releases</div>
        <LienReleasesPanel permit={row} />
      </section>

      {/* Victoria Alerts (this permit) */}
      <section id="victoria-alerts" className="mt-10 mb-4">
        <div className="eyebrow text-obsidian/50 mb-3">Victoria Alerts</div>
        <PermitAlertsInline permitId={row.id} />
      </section>

      {/* Expiration Banner */}
      <section className="mt-6">
        <ExpirationBanner
          permitId={row.id}
          expirationDate={(row as any).expiration_date ?? null}
          extensionRequestedAt={(row as any).extension_requested_at ?? null}
          onChange={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>

      {/* Inspections */}
      <section id="inspections" className="mt-10">
        <div className="eyebrow text-obsidian/50 mb-3">Inspections</div>
        <InspectionsPanel permitId={row.id} tenantId={row.tenant_id ?? null} permitStatus={row.status} />
      </section>

      {/* Resubmittal Workflow */}
      <section id="resubmittal" className="mt-10">
        <div className="eyebrow text-obsidian/50 mb-3">Resubmittal Workflow</div>
        <ResubmittalPanel
          permitId={row.id}
          tenantId={row.tenant_id ?? null}
          permitStatus={row.status}
          onResubmitted={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>

      {/* Permit Fees */}
      <section id="fees" className="mt-10">
        <div className="eyebrow text-obsidian/50 mb-3">Permit Fees</div>
        <PermitFeesPanel
          permitId={row.id}
          estimatedCents={(row as any).estimated_fee_cents ?? null}
          actualCents={(row as any).actual_fee_cents ?? null}
          paidDate={(row as any).fee_paid_date ?? null}
          paymentMethod={(row as any).fee_payment_method ?? null}
          onChanged={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>

      {/* Homeowner Share */}
      <section id="homeowner-share" className="mt-10 mb-10">
        <div className="eyebrow text-obsidian/50 mb-3">Homeowner Status</div>
        <HomeownerShareDialog
          permitId={row.id}
          existingToken={(row as any).homeowner_share_token ?? null}
          onToken={() => getPermit(row.id).then((r) => r && setRow(r))}
        />
      </section>

      {(() => {
        const ip = (row.intake_payload ?? {}) as Record<string, unknown>;
        const d = ip.dispatch as DispatchResult | undefined;
        if (!d) return null;
        return (
          <section id="dispatch" className="mt-10 mb-10">
            <div className="eyebrow text-obsidian/50 mb-3">Dispatch — Property Intelligence</div>
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
    </div>
  );
}

