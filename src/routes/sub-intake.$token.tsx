import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
import {
  getSubByToken,
  updateSub,
  missingFields,
  type SubRecord,
} from "@/lib/subcontractor-library";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";

export const Route = createFileRoute("/sub-intake/$token")({
  head: () => ({
    meta: [
      { title: "Complete Your Cleared Profile" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubIntakeTokenPage,
  notFoundComponent: NotFound,
});

function NotFound() {
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

function SubIntakeTokenPage() {
  const { token } = Route.useParams();
  const initial = useMemo(() => getSubByToken(token), [token]);
  if (!initial) throw notFound();

  const [sub] = useState<SubRecord>(initial);
  const [patch, setPatch] = useState<Partial<SubRecord>>({});
  const [done, setDone] = useState(false);

  const isBlankInvite = /^Pending Invite/i.test(sub.companyName) && !sub.licenseNumber && !sub.email;
  const missing = missingFields(sub);

  function onFile(key: "licenseFileName" | "coiFileName" | "w9FileName", e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPatch((p) => ({ ...p, [key]: f.name }));
  }

  function set<K extends keyof SubRecord>(k: K, v: SubRecord[K]) {
    setPatch((p) => ({ ...p, [k]: v }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (isBlankInvite) {
      const cn = (patch.companyName ?? "").trim();
      if (!cn) return;
    }
    updateSub(sub.id, patch);
    setDone(true);
  }

  const inputCls =
    "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  function FileRow({ label, keyName }: { label: string; keyName: "licenseFileName" | "coiFileName" | "w9FileName" }) {
    const name = patch[keyName] as string | null | undefined;
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 cursor-pointer border border-obsidian/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
            <Upload className="h-3.5 w-3.5" /> {name ? "Replace" : "Upload PDF"}
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => onFile(keyName, e)} required={!name} />
          </label>
          {name && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-obsidian/70 bg-obsidian/5 px-2 py-1 rounded-[3px]">
              {name}
              <button type="button" onClick={() => setPatch((p) => ({ ...p, [keyName]: null }))}><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
        <CloudUploadButtons />
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
            <p className="mt-3 text-sm text-obsidian/65">
              Your information has been received by Cleared.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 border-b border-obsidian/10 pb-6">
              <div className="eyebrow text-obsidian/50">Subcontractor Onboarding</div>
              <h1 className="display-serif mt-3 text-3xl sm:text-4xl text-obsidian">
                {isBlankInvite ? "Complete Your Cleared Profile" : `Complete Your Cleared Profile — ${sub.companyName}`}
              </h1>
              <p className="mt-3 text-sm text-obsidian/60">
                {isBlankInvite
                  ? "Please fill in your company details and upload the required documents."
                  : "We're missing a few items from your file. Please provide the following:"}
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
              {!isBlankInvite && missing.length === 0 && (
                <p className="text-sm text-obsidian/70">
                  Your profile is already complete. You may re-submit any updated documents below.
                </p>
              )}

              {isBlankInvite && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Company Name *</label>
                    <input required className={inputCls} value={(patch.companyName as string) ?? ""} onChange={(e) => set("companyName", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Trade *</label>
                    <select required className={inputCls} value={(patch.trade as string) ?? ""} onChange={(e) => set("trade", e.target.value)}>
                      <option value="">Select…</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Gas</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Qualifier Name *</label>
                    <input required className={inputCls} value={(patch.qualifierName as string) ?? ""} onChange={(e) => set("qualifierName", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>License Number *</label>
                    <input required className={inputCls} value={(patch.licenseNumber as string) ?? ""} onChange={(e) => set("licenseNumber", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact First Name</label>
                    <input className={inputCls} value={(patch.contactFirstName as string) ?? ""} onChange={(e) => set("contactFirstName", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Last Name</label>
                    <input className={inputCls} value={(patch.contactLastName as string) ?? ""} onChange={(e) => set("contactLastName", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Email *</label>
                    <input type="email" required className={inputCls} value={(patch.email as string) ?? ""} onChange={(e) => set("email", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Phone</label>
                    <input className={inputCls} value={(patch.phone as string) ?? ""} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Company Address</label>
                    <input className={inputCls} value={(patch.companyAddress as string) ?? ""} onChange={(e) => set("companyAddress", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Insurance Carrier Name</label>
                    <input className={inputCls} value={(patch.insuranceCarrierName as string) ?? ""} onChange={(e) => set("insuranceCarrierName", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Insurance Carrier Email</label>
                    <input type="email" className={inputCls} value={(patch.insuranceCarrierEmail as string) ?? ""} onChange={(e) => set("insuranceCarrierEmail", e.target.value)} />
                  </div>
                </div>
              )}

              {(isBlankInvite || missing.includes("licenseFileName")) && (
                <FileRow label="License Upload" keyName="licenseFileName" />
              )}
              {(isBlankInvite || missing.includes("licenseExpiration")) && (
                <div>
                  <label className={labelCls}>License Expiration Date</label>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={(patch.licenseExpiration as string) ?? ""}
                    onChange={(e) => set("licenseExpiration", e.target.value || null)}
                  />
                </div>
              )}
              {(isBlankInvite || missing.includes("coiFileName")) && (
                <FileRow label="Certificate of Insurance (COI)" keyName="coiFileName" />
              )}
              {(isBlankInvite || missing.includes("coiExpiration")) && (
                <div>
                  <label className={labelCls}>COI Expiration Date</label>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={(patch.coiExpiration as string) ?? ""}
                    onChange={(e) => set("coiExpiration", e.target.value || null)}
                  />
                </div>
              )}
              {(isBlankInvite || missing.includes("w9FileName")) && (
                <FileRow label="W-9 Form" keyName="w9FileName" />
              )}

              <div className="pt-2 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
                  Submit My Information
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
