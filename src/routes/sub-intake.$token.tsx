import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { getSubByTokenFn, submitSubIntakeFn, getSubUploadUrlFn, type PublicSubRecord } from "@/lib/sub-intake.functions";
import { createClient } from "@supabase/supabase-js";

const publicStorage = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const Route = createFileRoute("/sub-intake/$token")({
  head: () => ({
    meta: [
      { title: "Complete Your Cleared Profile" },
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
      const { signedUrl, path } = await getSubUploadUrlFn({ data: { token, field: FIELD_MAP[key], filename: f.name, contentType: f.type } });
      const res = await fetch(signedUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type || "application/octet-stream", "x-upsert": "true" } });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      setPatch((p) => ({ ...p, [key]: f.name, [PATH_KEY[key]]: path }));
    } catch (err) {
      alert("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  }

  function set(k: string, v: string | null) { setPatch((p) => ({ ...p, [k]: v })); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitSubIntakeFn({ data: { token, patch } });
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
          <div className="wordmark text-4xl text-obsidian">Cleared</div>
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
          <div className="wordmark text-4xl text-obsidian">Cleared</div>
          <div className="wordmark-subline mt-1 text-obsidian/55">by Flōridian</div>
        </div>

        {done ? (
          <div className="mt-10 bg-white border border-obsidian/10 rounded-[3px] p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" strokeWidth={1.5} />
            <h1 className="display-serif mt-4 text-3xl text-obsidian">Thank you.</h1>
            <p className="mt-3 text-sm text-obsidian/65">Your information has been received by Cleared.</p>
          </div>
        ) : sub && (
          <>
            <div className="mt-10 border-b border-obsidian/10 pb-6">
              <div className="eyebrow text-obsidian/50">Subcontractor Onboarding</div>
              <h1 className="display-serif mt-3 text-3xl sm:text-4xl text-obsidian">
                {isBlankInvite ? "Complete Your Cleared Profile" : `Complete Your Cleared Profile — ${sub.company_name}`}
              </h1>
              <p className="mt-3 text-sm text-obsidian/60">
                Please fill in your company details and upload the required documents.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Company Name *</label>
                  <input required className={inputCls} defaultValue={sub.company_name} onChange={(e) => set("company_name", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Trade</label>
                  <select className={inputCls} defaultValue={sub.trade ?? ""} onChange={(e) => set("trade", e.target.value)}>
                    <option value="">Select…</option>
                    <option>Plumbing</option><option>Electrical</option><option>Gas</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls}>Qualifier Name</label><input className={inputCls} defaultValue={sub.qualifier_name ?? ""} onChange={(e) => set("qualifier_name", e.target.value)} /></div>
                <div><label className={labelCls}>License Number</label><input className={inputCls} defaultValue={sub.license_number ?? ""} onChange={(e) => set("license_number", e.target.value)} /></div>
                <div><label className={labelCls}>License Expiration</label><input type="date" className={inputCls} defaultValue={sub.license_expiration ?? ""} onChange={(e) => set("license_expiration", e.target.value || null)} /></div>
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

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px] disabled:opacity-60">
                  {submitting ? "Submitting…" : "Submit My Information"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
