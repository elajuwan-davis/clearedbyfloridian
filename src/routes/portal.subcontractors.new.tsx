import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Link2, Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getSubById,
  upsertSub,
  ensureToken,
  missingFields,
  MISSING_FIELD_LABELS,
  type SubRecord,
} from "@/lib/subcontractor-library";

type Search = { id?: string };

export const Route = createFileRoute("/portal/subcontractors/new")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Add Subcontractor — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewSubcontractorPage,
});

const TRADES = ["Plumbing", "Electrical", "Gas", "Other"] as const;

const emptyForm: SubRecord = {
  id: "",
  trade: "Plumbing",
  companyName: "",
  qualifierName: "",
  licenseNumber: "",
  licenseExpiration: null,
  licenseFileName: null,
  contactFirstName: "",
  contactLastName: "",
  email: "",
  phone: "",
  companyAddress: "",
  insuranceCarrierName: "",
  insuranceCarrierEmail: "",
  coiFileName: null,
  coiExpiration: null,
  w9FileName: null,
};

function NewSubcontractorPage() {
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/portal/subcontractors/new" });
  const [form, setForm] = useState<SubRecord>(emptyForm);
  const [saved, setSaved] = useState<SubRecord | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const rec = getSubById(id);
      if (rec) {
        setForm(rec);
        setSaved(rec);
      }
    }
  }, [id]);

  function set<K extends keyof SubRecord>(key: K, value: SubRecord[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onFile(key: "licenseFileName" | "coiFileName" | "w9FileName", e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) set(key, f.name);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.companyName.trim()) return toast.error("Company Name is required");
    if (!form.qualifierName?.trim()) return toast.error("Qualifier Name is required");
    if (!form.licenseNumber?.trim()) return toast.error("License Number is required");
    if (!form.email?.trim()) return toast.error("Contact Email is required");
    const rec = upsertSub(form);
    setSaved(rec);
    setForm(rec);
    toast.success("Subcontractor saved");
  }

  function sendLink() {
    if (!saved) return;
    const token = ensureToken(saved.id);
    const url = `${window.location.origin}/sub-intake/${token}`;
    setShareUrl(url);
    toast.success(`Completion link ready for ${saved.email || saved.companyName}`);
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copied"));
  }

  const missing = useMemo(() => (saved ? missingFields(saved) : []), [saved]);

  const inputCls =
    "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  function FileRow({ label, name, keyName }: { label: string; name: string | null | undefined; keyName: "licenseFileName" | "coiFileName" | "w9FileName" }) {
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 cursor-pointer border border-obsidian/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
            <Upload className="h-3.5 w-3.5" /> {name ? "Replace" : "Upload"}
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => onFile(keyName, e)} />
          </label>
          {name && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-obsidian/70 bg-obsidian/5 px-2 py-1 rounded-[3px]">
              {name}
              <button type="button" onClick={() => set(keyName, null)}><X className="h-3 w-3" /></button>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Link to="/portal/subcontractors" className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-obsidian/60 hover:text-obsidian">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Subcontractors
      </Link>
      <h1 className="display-serif mt-4 text-4xl sm:text-5xl text-obsidian">
        {saved ? "Edit Subcontractor" : "Add Subcontractor"}
      </h1>

      {saved && missing.length > 0 && (
        <div className="mt-6 border border-amber-600/40 bg-amber-500/5 rounded-[3px] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <div className="text-sm text-obsidian">
                This profile is incomplete. Generate a link for <span className="font-medium">{saved.companyName}</span> to complete it.
              </div>
              <div className="mt-1 text-[12px] text-obsidian/60">
                Missing: {missing.map((m) => MISSING_FIELD_LABELS[m]).join(", ")}
              </div>
              <button
                type="button"
                onClick={sendLink}
                className="mt-3 inline-flex items-center gap-2 bg-obsidian px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]"
              >
                <Link2 className="h-3.5 w-3.5" /> Generate Link
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && missing.length === 0 && (
        <div className="mt-6 border border-emerald-600/30 bg-emerald-600/5 rounded-[3px] p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" strokeWidth={1.5} />
          <div className="text-sm text-obsidian">Profile complete.</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Trade *</label>
            <select className={inputCls} value={form.trade} onChange={(e) => set("trade", e.target.value)}>
              {TRADES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Company Name *</label><input required className={inputCls} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} /></div>
          <div><label className={labelCls}>Qualifier Name *</label><input required className={inputCls} value={form.qualifierName ?? ""} onChange={(e) => set("qualifierName", e.target.value)} /></div>
          <div><label className={labelCls}>License Number *</label><input required className={inputCls} value={form.licenseNumber ?? ""} onChange={(e) => set("licenseNumber", e.target.value)} /></div>
          <div><label className={labelCls}>License Expiration Date</label><input type="date" className={inputCls} value={form.licenseExpiration ?? ""} onChange={(e) => set("licenseExpiration", e.target.value || null)} /></div>
          <div className="sm:col-span-2">
            <FileRow label="License Upload" name={form.licenseFileName} keyName="licenseFileName" />
          </div>
          <div><label className={labelCls}>Contact First Name</label><input className={inputCls} value={form.contactFirstName ?? ""} onChange={(e) => set("contactFirstName", e.target.value)} /></div>
          <div><label className={labelCls}>Contact Last Name</label><input className={inputCls} value={form.contactLastName ?? ""} onChange={(e) => set("contactLastName", e.target.value)} /></div>
          <div><label className={labelCls}>Contact Email *</label><input type="email" required className={inputCls} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className={labelCls}>Contact Phone</label><input className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Company Address</label><input className={inputCls} value={form.companyAddress ?? ""} onChange={(e) => set("companyAddress", e.target.value)} /></div>
          <div><label className={labelCls}>Insurance Carrier Name</label><input className={inputCls} value={form.insuranceCarrierName ?? ""} onChange={(e) => set("insuranceCarrierName", e.target.value)} /></div>
          <div><label className={labelCls}>Insurance Carrier Contact Email</label><input type="email" className={inputCls} value={form.insuranceCarrierEmail ?? ""} onChange={(e) => set("insuranceCarrierEmail", e.target.value)} /></div>
          <div className="sm:col-span-2">
            <FileRow label="COI Upload" name={form.coiFileName} keyName="coiFileName" />
          </div>
          <div><label className={labelCls}>COI Expiration Date</label><input type="date" className={inputCls} value={form.coiExpiration ?? ""} onChange={(e) => set("coiExpiration", e.target.value || null)} /></div>
          <div className="sm:col-span-2">
            <FileRow label="W-9 Upload" name={form.w9FileName} keyName="w9FileName" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-obsidian/10">
          <button type="button" onClick={() => navigate({ to: "/portal/subcontractors" })} className="inline-flex items-center gap-2 border border-obsidian/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px]">
            Cancel
          </button>
          <button type="submit" className="inline-flex items-center gap-2 bg-obsidian px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
            {saved ? "Save Changes" : "Save Subcontractor"}
          </button>
        </div>
      </form>

      {shareUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-obsidian/40 p-4" onClick={() => setShareUrl(null)}>
          <div className="w-full max-w-lg bg-white rounded-[3px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-display text-xl text-obsidian">Completion Link Ready</div>
              <button onClick={() => setShareUrl(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-sm text-obsidian/65">
              Share this link with your subcontractor:
            </p>
            <div className="mt-3 flex items-stretch gap-2">
              <input readOnly value={shareUrl} className={`${inputCls} font-mono text-[12px]`} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 bg-obsidian px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <p className="mt-3 text-[11px] text-obsidian/50">
              Sub sees only the fields still missing from their profile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
