import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Eye, Download, Trash2, Loader2, Check, AlertTriangle, X, FileText, Cloud, Pencil } from "lucide-react";
import { uploadPermitFile, getPermitFileUrl, deletePermitFile } from "@/lib/permit-storage";
import type { PermitDoc, PermitRow } from "@/lib/permits-api";
import { updatePermit, getEffectiveDocs } from "@/lib/permits-api";
import { GoogleDrivePickerDialog } from "@/components/google-drive-picker-dialog";

type Props = {
  permit: PermitRow;
  doc: PermitDoc;
  onChange: (updated: PermitRow) => void;
  readOnly?: boolean;
  onRename?: (label: string) => void | Promise<void>;
  onDeleteField?: () => void | Promise<void>;
};

export function PermitDocUploader({ permit, doc, onChange, readOnly = false }: Props) {

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drivePickerOpen, setDrivePickerOpen] = useState(false);

  const isUploaded = doc.status === "uploaded" && doc.path;

  async function persistDocs(nextDoc: PermitDoc) {
    const current = getEffectiveDocs(permit);
    const nextDocs = current.map((d) => (d.key === nextDoc.key ? nextDoc : d));
    const updated = await updatePermit(permit.id, { documents: nextDocs });
    onChange(updated);
  }

  async function handleFile(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large (max 50MB)");
      return;
    }
    setBusy(true);
    setProgress(20);
    try {
      const { path, size, mime } = await uploadPermitFile(permit.id, doc.key, file, file.name);
      setProgress(90);
      await persistDocs({
        ...doc,
        status: "uploaded",
        filename: file.name,
        path,
        size,
        mime,
        uploaded_at: new Date().toISOString(),
      });
      setProgress(100);
      toast.success(`Uploaded ${file.name}`);
    } catch (e) {
      toast.error("Upload failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 500);
    }
  }

  async function handleView() {
    if (!doc.path) return;
    try {
      const url = await getPermitFileUrl(doc.path, 600);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error("Could not open file: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleDownload() {
    if (!doc.path) return;
    try {
      const url = await getPermitFileUrl(doc.path, 600);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename ?? "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      toast.error("Download failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleRemove() {
    if (!doc.path) return;
    if (!confirm(`Remove ${doc.filename}?`)) return;
    setBusy(true);
    try {
      await deletePermitFile(doc.path);
      await persistDocs({ ...doc, status: "missing", filename: null, path: null, size: null, mime: null, uploaded_at: null });
      toast.success("Removed");
    } catch (e) {
      toast.error("Remove failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleDefer() {
    await persistDocs({ ...doc, status: "pending" });
    toast.success("Marked as pending");
  }

  function handleOneDriveSoon() {
    toast.message("OneDrive import", {
      description: "Per-user OneDrive OAuth is not connected yet. Ask an admin to enable the Microsoft OneDrive App User Connector, then reload this page.",
    });
  }

  async function handleDriveImported(result: { path: string; filename: string; mime: string; size: number }) {
    await persistDocs({
      ...doc,
      status: "uploaded",
      filename: result.filename,
      path: result.path,
      size: result.size,
      mime: result.mime,
      uploaded_at: new Date().toISOString(),
    });
  }


  const statusBadge = () => {
    const map: Record<PermitDoc["status"], string> = {
      uploaded: "bg-emerald-100 text-emerald-800",
      pending: "bg-amber-100 text-amber-800",
      not_applicable: "bg-obsidian/10 text-obsidian/60",
      missing: "bg-red-100 text-red-800",
    };
    return (
      <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${map[doc.status]}`}>
        {doc.status.replace("_", " ")}
      </span>
    );
  };

  const StatusIcon =
    doc.status === "uploaded" ? <Check className="h-4 w-4 text-emerald-600" /> :
    doc.status === "pending" ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
    doc.status === "not_applicable" ? <FileText className="h-4 w-4 text-obsidian/40" /> :
    <X className="h-4 w-4 text-red-600" />;

  return (
    <div className="py-4 border-b border-obsidian/10 last:border-0">
      <div className="flex items-start gap-3">
        {StatusIcon}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm text-obsidian font-medium">{doc.label}</div>
            {doc.required && <span className="text-[10px] font-mono uppercase text-red-700">Required</span>}
            {statusBadge()}
          </div>
          {doc.filename && (
            <div className="mt-1 text-[12px] text-obsidian/60 font-mono truncate">
              {doc.filename}{doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}
            </div>
          )}
        </div>
        {isUploaded && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={handleView} className="inline-flex items-center gap-1 border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
              <Eye className="h-3 w-3" /> View
            </button>
            <button type="button" onClick={handleDownload} className="inline-flex items-center gap-1 border border-obsidian/20 bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
              <Download className="h-3 w-3" />
            </button>
            {!readOnly && (
              <button type="button" onClick={handleRemove} disabled={busy} className="inline-flex items-center gap-1 border border-red-600/30 text-red-700 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] rounded-[3px] hover:bg-red-50 disabled:opacity-60">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

      </div>

      {!isUploaded && !readOnly && (
        <div className="mt-3 ml-7">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`rounded-[3px] border-2 border-dashed p-4 transition-colors ${
              dragOver ? "border-obsidian bg-obsidian/5" : "border-obsidian/20 bg-obsidian/[0.02]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-[12px] text-obsidian/70">
                {busy ? "Uploading…" : "Drag & drop a PDF or image, or"}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 bg-obsidian px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px] disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Browse
                </button>
                <button type="button" onClick={() => setDrivePickerOpen(true)} className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                  <Cloud className="h-3 w-3" /> Google Drive
                </button>
                <button type="button" onClick={handleOneDriveSoon} className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                  <Cloud className="h-3 w-3" /> OneDrive
                </button>
                {doc.status !== "pending" && (
                  <button type="button" onClick={handleDefer} className="inline-flex items-center gap-1.5 border border-obsidian/20 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70 rounded-[3px] hover:bg-obsidian/5">
                    Defer — upload later
                  </button>
                )}
              </div>
            </div>
            {progress > 0 && (
              <div className="mt-3 h-1 bg-obsidian/10 rounded-full overflow-hidden">
                <div className="h-full bg-obsidian transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      )}
      <GoogleDrivePickerDialog
        open={drivePickerOpen}
        onOpenChange={setDrivePickerOpen}
        permitId={permit.id}
        docKey={doc.key}
        onImported={handleDriveImported}
      />
    </div>
  );
}
