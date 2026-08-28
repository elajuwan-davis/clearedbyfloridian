import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { FileText, Layers, Loader2, Upload, X } from "lucide-react";
import type { PermitRow } from "@/lib/permits-api";
import {
  BULK_MAX_FILES,
  bulkUploadPermitDocs,
  labelFromFilename,
} from "@/lib/bulk-permit-docs";

type Props = {
  permit: PermitRow;
  onChange: (updated: PermitRow) => void;
  /** Compact variant for panels with less room. */
  compact?: boolean;
};

/**
 * Drop or pick many documents at once. Each file becomes its own document
 * field on the permit, named after the file and stored as-is.
 */
export function BulkDocUpload({ permit, onChange, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(
    null,
  );

  function addFiles(files: File[]) {
    if (files.length === 0) return;
    setQueue((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      for (const f of files) {
        const id = `${f.name}:${f.size}`;
        if (seen.has(id)) continue;
        seen.add(id);
        merged.push(f);
      }
      if (merged.length > BULK_MAX_FILES) {
        toast.error(`Up to ${BULK_MAX_FILES} files at a time`);
        return merged.slice(0, BULK_MAX_FILES);
      }
      return merged;
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  }

  async function handleUpload() {
    if (queue.length === 0 || busy) return;
    setBusy(true);
    try {
      const result = await bulkUploadPermitDocs(permit, queue, (done, total, current) =>
        setProgress({ done, total, current }),
      );
      if (result.uploaded.length > 0) {
        onChange(result.permit);
        toast.success(
          `Uploaded ${result.uploaded.length} document${result.uploaded.length === 1 ? "" : "s"}`,
        );
      }
      if (result.failed.length > 0) {
        toast.error(
          `${result.failed.length} file${result.failed.length === 1 ? "" : "s"} failed: ` +
            result.failed.map((f) => `${f.filename} (${f.message})`).join(", "),
        );
      }
      setQueue(result.failed.length > 0 ? queue.filter((f) => result.failed.some((x) => x.filename === f.name)) : []);
    } catch (e) {
      toast.error("Bulk upload failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="border border-obsidian/15 rounded-[3px] bg-obsidian/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-obsidian/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/70">
            Bulk upload documents
          </span>
        </div>
        <span className="font-mono text-[10px] text-obsidian/45">
          {queue.length}/{BULK_MAX_FILES} selected
        </span>
      </div>

      {!compact && (
        <p className="mt-1.5 text-[12px] text-obsidian/60">
          Select or drop many files at once — each one is filed under its own name, exactly as the
          file is named.
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`mt-3 cursor-pointer border-2 border-dashed rounded-[3px] px-4 py-5 text-center transition-colors ${
          dragOver ? "border-obsidian/50 bg-obsidian/[0.05]" : "border-obsidian/20 hover:border-obsidian/40"
        }`}
      >
        <Upload className="h-4 w-4 mx-auto text-obsidian/45" />
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
          Drop files or click to choose
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <ul className="mt-3 space-y-1 max-h-56 overflow-y-auto">
          {queue.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-2 bg-white border border-obsidian/10 rounded-[3px] px-2 py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 shrink-0 text-obsidian/45" />
                <span className="truncate text-[12px] text-obsidian">{labelFromFilename(f.name)}</span>
                <span className="shrink-0 font-mono text-[10px] text-obsidian/45">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
              </div>
              {!busy && (
                <button
                  type="button"
                  onClick={() => setQueue((prev) => prev.filter((_, j) => j !== i))}
                  className="text-obsidian/40 hover:text-obsidian shrink-0"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {progress && (
        <div className="mt-3">
          <div className="h-1.5 bg-obsidian/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-1 font-mono text-[10px] text-obsidian/55 truncate">
            {progress.done}/{progress.total} · {progress.current}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={busy || queue.length === 0}
          onClick={handleUpload}
          className="inline-flex items-center gap-2 border border-obsidian/20 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? "Uploading…" : `Upload ${queue.length || ""} document${queue.length === 1 ? "" : "s"}`}
        </button>
        {queue.length > 0 && !busy && (
          <button
            type="button"
            onClick={() => setQueue([])}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
