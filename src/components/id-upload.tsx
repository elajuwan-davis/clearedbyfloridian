import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { FileText, Upload, ShieldCheck, Loader2 } from "lucide-react";
import { ID_DOC_TYPES, type IdDocumentType } from "@/lib/id-verification.functions";

export type IdUploadValue = {
  path: string | null;
  filename: string | null;
  documentType: IdDocumentType | null;
};

export const EMPTY_ID_UPLOAD: IdUploadValue = {
  path: null,
  filename: null,
  documentType: null,
};

/** A valid file has been uploaded and confirmed with a document type. */
export function isIdUploadComplete(value: IdUploadValue): boolean {
  return !!value.path && !!value.documentType;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = /\.(jpe?g|png|pdf)$/i;

export type IdUploadMode =
  | { kind: "authenticated" }
  | { kind: "token"; token: string };

type Props = {
  mode: IdUploadMode;
  value: IdUploadValue;
  onChange: (value: IdUploadValue) => void;
  /** Mirrors the component's completion state to the parent. */
  onCompleteChange?: (isComplete: boolean) => void;
  className?: string;
};

export function IdUpload({ mode, value, onChange, onCompleteChange, className }: Props) {
  const [docType, setDocType] = useState<IdDocumentType>(value.documentType ?? "drivers_license");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isComplete = isIdUploadComplete(value);

  useEffect(() => {
    onCompleteChange?.(isComplete);
  }, [isComplete, onCompleteChange]);

  const isImage = !!value.filename && /\.(jpe?g|png)$/i.test(value.filename);

  // Short-lived signed URL for the thumbnail — the storage URL is never exposed.
  useEffect(() => {
    let active = true;
    setPreviewUrl(null);
    if (!value.path || !isImage) return;
    (async () => {
      try {
        let url: string | null = null;
        if (mode.kind === "authenticated") {
          const { getMyIdPreviewUrlFn } = await import("@/lib/id-verification.functions");
          const res = await getMyIdPreviewUrlFn({ data: { path: value.path! } });
          url = res.url;
        } else {
          const body = new FormData();
          body.set("token", mode.token);
          body.set("documentType", docType);
          body.set("action", "preview");
          body.set("path", value.path!);
          const res = await fetch("/api/public/id-upload", { method: "POST", body });
          const json = (await res.json().catch(() => null)) as { url?: string } | null;
          url = json?.url ?? null;
        }
        if (active) setPreviewUrl(url);
      } catch {
        if (active) setPreviewUrl(null);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.path, isImage, mode.kind]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ALLOWED_EXT.test(file.name)) {
      setError("Only JPG, JPEG, PNG, or PDF files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB — please upload a smaller scan or photo.`,
      );
      return;
    }

    setBusy(true);
    try {
      if (mode.kind === "authenticated") {
        const { createMyIdUploadUrlFn, saveMyIdDocumentFn } = await import(
          "@/lib/id-verification.functions"
        );
        const { path, signedUrl } = await createMyIdUploadUrlFn({
          data: { filename: file.name },
        });
        const put = await fetch(signedUrl, {
          method: "PUT",
          headers: { "content-type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) throw new Error("The file did not reach secure storage. Please try again.");
        await saveMyIdDocumentFn({ data: { path, documentType: docType } });
        onChange({ path, filename: file.name, documentType: docType });
      } else {
        const body = new FormData();
        body.set("token", mode.token);
        body.set("documentType", docType);
        body.set("action", "upload");
        body.set("file", file);
        const res = await fetch("/api/public/id-upload", { method: "POST", body });
        const json = (await res.json().catch(() => null)) as
          | { path?: string; name?: string; error?: string }
          | null;
        if (!res.ok || !json?.path) {
          throw new Error(json?.error || "The file did not reach secure storage. Please try again.");
        }
        onChange({ path: json.path, filename: json.name ?? file.name, documentType: docType });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function selectType(next: IdDocumentType) {
    setDocType(next);
    if (value.path) onChange({ ...value, documentType: next });
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
            Document Type <span className="text-oxblood">*</span>
          </div>
          <div className="inline-flex rounded-[3px] border border-obsidian/15 p-0.5">
            {ID_DOC_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => selectType(t.value)}
                aria-pressed={docType === t.value}
                className={`rounded-[2px] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  docType === t.value
                    ? "bg-obsidian text-paper"
                    : "text-obsidian/60 hover:bg-obsidian/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
            Government ID <span className="text-oxblood">*</span>
          </div>

          {!value.path ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-obsidian/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian hover:bg-obsidian/5">
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {busy ? "Uploading…" : "Upload ID"}
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="hidden"
                disabled={busy}
                onChange={handleFile}
              />
            </label>
          ) : (
            <div className="flex flex-wrap items-center gap-4 rounded-[3px] border border-obsidian/12 bg-paper-warm/50 p-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[2px] border border-obsidian/12 bg-white">
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`Preview of uploaded ${docType === "passport" ? "passport" : "driver's license"}`}
                    className="h-full w-full object-cover"
                  />
                ) : isImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-obsidian/40" />
                ) : (
                  <FileText className="h-6 w-6 text-obsidian/45" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm text-obsidian">{value.filename}</div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                  <ShieldCheck className="h-3 w-3 text-sky" />
                  Stored privately · {docType === "passport" ? "Passport" : "Driver's License"}
                </div>
              </div>
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-[3px] border border-obsidian/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian hover:bg-obsidian/5">
                {busy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {busy ? "Uploading…" : "Replace"}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  className="hidden"
                  disabled={busy}
                  onChange={handleFile}
                />
              </label>
            </div>
          )}

          <p className="mt-2 text-xs text-obsidian/50">
            JPG, JPEG, PNG, or PDF · 10MB maximum.
          </p>
          {error && <p className="mt-1.5 text-xs text-oxblood">{error}</p>}
        </div>
      </div>
    </div>
  );
}
