import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Link2, Copy } from "lucide-react";
import { getSub, createSub, updateSubApi, type SubRow, type SubInsert } from "@/lib/subs-api";

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

function NewSubcontractorPage() {
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/portal/subcontractors/new" });
  const [form, setForm] = useState<Partial<SubInsert>>({ trade: "Plumbing" });
  const [saved, setSaved] = useState<SubRow | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getSub(id).then((rec) => {
      if (rec) { setSaved(rec); setForm(rec); }
    }).catch(() => toast.error("Failed to load subcontractor"));
  }, [id]);

  function set<K extends keyof SubInsert>(k: K, v: SubInsert[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function onFile(k: "license_file_name" | "coi_file_name" | "w9_file_name", e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) set(k, f.name);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.company_name?.trim()) return toast.error("Company Name is required");
    try {
      let rec: SubRow;
      if (saved) rec = await updateSubApi(saved.id, form);
      else rec = await createSub(form as SubInsert);
      setSaved(rec);
      setForm(rec);
      toast.success("Saved");
    } catch (err) {
      toast.error("Save failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  async function generateBlankInviteLink() {
    try {
      const rec = await createSub({ company_name: `Pending Invite ${new Date().toLocaleDateString()}`, status: "invited" });
      const url = `${window.location.origin}/sub-intake/${rec.completion_token}`;
      setShareUrl(url);
      toast.success("Intake link generated");
    } catch (e) {
      toast.error("Failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  function copyShare() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copied"));
  }

  function copySavedLink() {
    if (!saved) return;
    const url = `${window.location.origin}/sub-intake/${saved.completion_token}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Intake link copied"));
  }

  const inputCls = "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";

  function FileRow({ label, name, keyName }: { label: string; name: string | null | undefined; keyName: "license_file_name" | "coi_file_name" | "w9_file_name" }) {
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
      <h1 className="display-serif mt-4 text-4xl sm:text-5xl text-obsidian">{saved ? "Edit Subcontractor" : "Add Subcontractor"}</h1>

      {!saved && (
        <div className="mt-8 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
          <div className="eyebrow text-obsidian/50">Fastest path</div>
          <h2 className="display-serif mt-2 text-2xl text-obsidian">Generate Intake Link</h2>
          <p className="mt-2 text-sm text-obsidian/65">Send this link to the subcontractor to fill out their own profile — saved directly to the database.</p>
          {!shareUrl ? (
            <button type="button" onClick={generateBlankInviteLink} className="mt-4 inline-flex items-center gap-2 bg-obsidian px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
              <Link2 className="h-3.5 w-3.5" /> Generate Intake Link
            </button>
          ) : (
            <div className="mt-4 flex items-stretch gap-2">
              <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} className={`${inputCls} font-mono text-[12px]`} />
              <button type="button" onClick={copyShare} className="inline-flex items-center gap-1.5 bg-obsidian px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-paper rounded-[3px]">
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
            </div>
          )}
        </div>
      )}

      {saved && (
        <div className="mt-6 bg-white border border-obsidian/10 rounded-[3px] p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[12px] text-obsidian/70">
            Intake link: <span className="font-mono">{`${typeof window !== "undefined" ? window.location.origin : ""}/sub-intake/${saved.completion_token}`}</span>
          </div>
          <button onClick={copySavedLink} className="inline-flex items-center gap-1.5 border border-obsidian/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px]">
            <Copy className="h-3.5 w-3.5" /> Copy link
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Trade</label>
            <select className={inputCls} value={form.trade ?? "Plumbing"} onChange={(e) => set("trade", e.target.value)}>
              {TRADES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Company Name *</label><input required className={inputCls} value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} /></div>
          <div><label className={labelCls}>Qualifier Name</label><input className={inputCls} value={form.qualifier_name ?? ""} onChange={(e) => set("qualifier_name", e.target.value)} /></div>
          <div><label className={labelCls}>License Number</label><input className={inputCls} value={form.license_number ?? ""} onChange={(e) => set("license_number", e.target.value)} /></div>
          <div><label className={labelCls}>License Expiration</label><input type="date" className={inputCls} value={form.license_expiration ?? ""} onChange={(e) => set("license_expiration", e.target.value || null)} /></div>
          <div className="sm:col-span-2"><FileRow label="License Upload" name={form.license_file_name} keyName="license_file_name" /></div>
          <div><label className={labelCls}>Contact First Name</label><input className={inputCls} value={form.contact_first_name ?? ""} onChange={(e) => set("contact_first_name", e.target.value)} /></div>
          <div><label className={labelCls}>Contact Last Name</label><input className={inputCls} value={form.contact_last_name ?? ""} onChange={(e) => set("contact_last_name", e.target.value)} /></div>
          <div><label className={labelCls}>Contact Email</label><input type="email" className={inputCls} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className={labelCls}>Contact Phone</label><input className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Company Address</label><input className={inputCls} value={form.company_address ?? ""} onChange={(e) => set("company_address", e.target.value)} /></div>
          <div><label className={labelCls}>Insurance Carrier Name</label><input className={inputCls} value={form.insurance_carrier_name ?? ""} onChange={(e) => set("insurance_carrier_name", e.target.value)} /></div>
          <div><label className={labelCls}>Insurance Carrier Email</label><input type="email" className={inputCls} value={form.insurance_carrier_email ?? ""} onChange={(e) => set("insurance_carrier_email", e.target.value)} /></div>
          <div className="sm:col-span-2"><FileRow label="COI Upload" name={form.coi_file_name} keyName="coi_file_name" /></div>
          <div><label className={labelCls}>COI Expiration</label><input type="date" className={inputCls} value={form.coi_expiration ?? ""} onChange={(e) => set("coi_expiration", e.target.value || null)} /></div>
          <div className="sm:col-span-2"><FileRow label="W-9 Upload" name={form.w9_file_name} keyName="w9_file_name" /></div>
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
    </div>
  );
}
