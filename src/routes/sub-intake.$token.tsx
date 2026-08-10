import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { IdUpload, EMPTY_ID_UPLOAD, type IdUploadValue } from "@/components/id-upload";
import { getSubByTokenFn, submitSubIntakeFn, type PublicSubRecord } from "@/lib/sub-intake.functions";
import { subValidationErrors } from "@/lib/sub-validation";


export const Route = createFileRoute("/sub-intake/$token")({
  head: () => ({
    meta: [
      { title: "Complete Your Cleard Profile" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubIntakeTokenPage,
});

function SubIntakeTokenPage() {
  const { token } = Route.useParams();
  const [sub, setSub] = useState<PublicSubRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [patch, setPatch] = useState<Record<string, string | null>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idDoc, setIdDoc] = useState<IdUploadValue>(EMPTY_ID_UPLOAD);
  const [idComplete, setIdComplete] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);


  useEffect(() => {
    getSubByTokenFn({ data: { token } })
      .then((rec) => { if (!rec) setNotFound(true); else setSub(rec); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const isBlankInvite = useMemo(
    () => !!sub && /^Pending Invite/i.test(sub.company_name) && !sub.license_number && !sub.email,
    [sub],
  );

  const FIELD_MAP: Record<"license_file_name" | "coi_file_name" | "w9_file_name", "license" | "coi" | "w9"> = {
    license_file_name: "license",
    coi_file_name: "coi",
    w9_file_name: "w9",
  };
  const PATH_KEY: Record<"license_file_name" | "coi_file_name" | "w9_file_name", string> = {
    license_file_name: "license_file_path",
    coi_file_name: "coi_file_path",
    w9_file_name: "w9_file_path",
  };
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  async function onFile(key: "license_file_name" | "coi_file_name" | "w9_file_name", e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const body = new FormData();
      body.set("token", token);
      body.set("field", FIELD_MAP[key]);
      body.set("file", f);

      const response = await fetch("/api/public/sub-intake-upload", {
        method: "POST",
        body,
      });
      const result = await response.json().catch(() => null) as { path?: string; name?: string; error?: string } | null;
      const uploadedPath = result?.path;
      const uploadedName = result?.name;
      if (!response.ok || !uploadedPath || !uploadedName) {
        throw new Error(result?.error || "The file did not reach storage. Please try again.");
      }
      setPatch((p) => ({ ...p, [key]: uploadedName, [PATH_KEY[key]]: uploadedPath }));
    } catch (err) {
      alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  }

  function set(k: string, v: string | null) { setPatch((p) => ({ ...p, [k]: v })); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!idComplete || !idDoc.path || !idDoc.documentType) {
      alert("Please upload a valid government ID before submitting.");
      return;
    }
    const problems = subValidationErrors({ ...(sub as Record<string, unknown>), ...patch });
    if (problems.length) {
      setErrors(problems);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      for (const key of Object.keys(PATH_KEY) as Array<keyof typeof PATH_KEY>) {
        if (patch[key] && !patch[PATH_KEY[key]]) {
          throw new Error("One or more documents only has a filename. Please re-upload it before submitting.");
        }
      }
      await submitSubIntakeFn({
        data: {
          token,
          patch: {
            ...patch,
            id_document_url: idDoc.path,
            id_document_type: idDoc.documentType,
          },
        },
      });
      setDone(true);

    } catch (err) {
      alert("Submission failed: " + (err instanceof Error ? err.message : String(err)));
    } finally { setSubmitting(false); }
  }

  const inputCls = "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  function FileRow({ label, keyName }: { label: string; keyName: "license_file_name" | "coi_file_name" | "w9_file_name" }) {
    const name = patch[keyName];
    const busy = uploading[keyName];
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 cursor-pointer border border-obsidian/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
            <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : name ? "Replace" : "Upload"}
            <input type="file" accept="application/pdf,image/*" className="hidden" disabled={busy} onChange={(e) => onFile(keyName, e)} />
          </label>
          {name && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-obsidian/70 bg-obsidian/5 px-2 py-1 rounded-[3px]">
              {name}
              <button type="button" onClick={() => setPatch((p) => ({ ...p, [keyName]: null, [PATH_KEY[keyName]]: null }))}><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      </div>
    );

  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-paper-warm/40 text-obsidian/60">Loading…</div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper-warm/40 px-4">
        <div className="max-w-md text-center">
          <div className="wordmark text-4xl text-obsidian">Cleard</div>
          <p className="mt-6 text-sm text-obsidian/65">
            This completion link is invalid or has expired. Please contact your general contractor for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-warm/40 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="wordmark text-4xl text-obsidian">Cleard</div>
          <div className="wordmark-subline mt-1 text-obsidian/55"></div>
        </div>

        {done ? (
          <div className="mt-10 bg-white border border-obsidian/10 rounded-[3px] p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" strokeWidth={1.5} />
            <h1 className="display-serif mt-4 text-3xl text-obsidian">Thank you.</h1>
            <p className="mt-3 text-sm text-obsidian/65">Your information has been received by Cleard.</p>
          </div>
        ) : sub && (
          <>
            <div className="mt-10 border-b border-obsidian/10 pb-6">
              <div className="eyebrow text-obsidian/50">Subcontractor Onboarding</div>
              <h1 className="display-serif mt-3 text-3xl sm:text-4xl text-obsidian">
                {isBlankInvite ? "Complete Your Cleard Profile" : `Complete Your Cleard Profile — ${sub.company_name}`}
              </h1>
              <p className="mt-3 text-sm text-obsidian/60">
                Please fill in your company details and upload the required documents.
              </p>
            </div>

            {/* noValidate: the styled list reports every missing field at once. */}
            <form noValidate onSubmit={submit} className="mt-6 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Company Name *</label>
                  <input required className={inputCls} defaultValue={sub.company_name} onChange={(e) => set("company_name", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Trade *</label>
                  <select className={inputCls} defaultValue={sub.trade ?? ""} onChange={(e) => set("trade", e.target.value)}>
                    <option value="">Select…</option>
                    <option>Plumbing</option><option>Electrical</option><option>Gas</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls}>Qualifier Name</label><input className={inputCls} defaultValue={sub.qualifier_name ?? ""} onChange={(e) => set("qualifier_name", e.target.value)} /></div>
                <div><label className={labelCls}>License Number *</label><input required className={inputCls} defaultValue={sub.license_number ?? ""} onChange={(e) => set("license_number", e.target.value)} /></div>
                <div><label className={labelCls}>License Expiration *</label><input type="date" required className={inputCls} defaultValue={sub.license_expiration ?? ""} onChange={(e) => set("license_expiration", e.target.value || null)} /></div>
                <div><label className={labelCls}>Contact First Name</label><input className={inputCls} defaultValue={sub.contact_first_name ?? ""} onChange={(e) => set("contact_first_name", e.target.value)} /></div>
                <div><label className={labelCls}>Contact Last Name</label><input className={inputCls} defaultValue={sub.contact_last_name ?? ""} onChange={(e) => set("contact_last_name", e.target.value)} /></div>
                <div><label className={labelCls}>Contact Email *</label><input type="email" required className={inputCls} defaultValue={sub.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
                <div><label className={labelCls}>Contact Phone</label><input className={inputCls} defaultValue={sub.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Company Address</label><input className={inputCls} defaultValue={sub.company_address ?? ""} onChange={(e) => set("company_address", e.target.value)} /></div>
                <div><label className={labelCls}>Insurance Carrier Name</label><input className={inputCls} defaultValue={sub.insurance_carrier_name ?? ""} onChange={(e) => set("insurance_carrier_name", e.target.value)} /></div>
                <div><label className={labelCls}>Insurance Carrier Email</label><input type="email" className={inputCls} defaultValue={sub.insurance_carrier_email ?? ""} onChange={(e) => set("insurance_carrier_email", e.target.value)} /></div>
                <div><label className={labelCls}>COI Expiration</label><input type="date" className={inputCls} defaultValue={sub.coi_expiration ?? ""} onChange={(e) => set("coi_expiration", e.target.value || null)} /></div>
              </div>

              <FileRow label="License Upload" keyName="license_file_name" />
              <FileRow label="Certificate of Insurance (COI)" keyName="coi_file_name" />
              <FileRow label="W-9 Form" keyName="w9_file_name" />

              <div className="border-t border-obsidian/10 pt-5">
                <div className="eyebrow text-obsidian/50">Business &amp; Identity</div>
                <p className="mt-2 mb-4 text-xs text-obsidian/55">
                  A government-issued photo ID is required to complete onboarding.
                </p>
                <IdUpload
                  mode={{ kind: "token", token }}
                  value={idDoc}
                  onChange={setIdDoc}
                  onCompleteChange={setIdComplete}
                />
              </div>

              {errors.length > 0 && (
                <div className="border border-red-300 bg-red-50 rounded-[3px] px-4 py-3 text-[13px] text-red-800">
                  <div className="font-medium">Cannot submit — required fields are missing:</div>
                  <ul className="mt-1 list-disc pl-5 text-[12px]">
                    {errors.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                {!idComplete && (
                  <span className="text-xs text-obsidian/50">
                    Upload a valid government ID to continue.
                  </span>
                )}
                <span title={idComplete ? undefined : "Upload a valid government ID to continue"}>
                  <button type="submit" disabled={submitting || !idComplete} className="inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px] disabled:opacity-60">
                    {submitting ? "Submitting…" : "Submit My Information"}
                  </button>
                </span>
              </div>

            </form>
          </>
        )}
      </div>
    </div>
  );
}
