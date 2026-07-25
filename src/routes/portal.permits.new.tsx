import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload, Check, FileText, ArrowLeft, Send, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";
import { createPermit, type PermitDoc } from "@/lib/permits-api";
import { listSubs, createSub, type SubRow } from "@/lib/subs-api";
import { MUNICIPALITIES } from "@/lib/municipalities";
import { getChecklist, DEFAULT_CHECKLIST } from "@/lib/permit-checklists";

export const Route = createFileRoute("/portal/permits/new")({
  head: () => ({
    meta: [
      { title: "New Permit Intake — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPermitPage,
});

const PERMIT_TYPES = [
  "Swimming Pool",
  "New Construction of Pool w/ Deck",
  "Pool Renovation",
  "Pool + Spa",
  "Full Hardscape",
  "Other",
];

type DocState = { uploaded: string | null; na: boolean; deferred: boolean };

type SubIntake = {
  companyName: string;
  qualifierName: string;
  licenseNumber: string;
  contactEmail: string;
  insuranceCarrierEmail: string;
};

const emptySub: SubIntake = { companyName: "", qualifierName: "", licenseNumber: "", contactEmail: "", insuranceCarrierEmail: "" };

function NewPermitPage() {
  const navigate = useNavigate();
  const [savedSubs, setSavedSubs] = useState<SubRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    step: 1 as 1 | 2,
    projectName: "",
    address: "",
    municipality: "",
    permitType: PERMIT_TYPES[0],
    description: "",
    subPlumbing: { ...emptySub },
    subElectrical: { ...emptySub },
    subGas: { ...emptySub },
    submittedDate: new Date().toISOString().slice(0, 10),
    contractorCompany: "",
    contractorQualifier: "",
    companyAddress: "",
    poc: "José Maceda Gutiérrez",
    pocPhone: "(772) 675-3274",
    pocEmail: "team@floridianinc.com",
    licenseNumber: "",
    ownerName: "",
    ownerEntity: "",
    signerPhone: "",
    signerEmail: "",
    additionalNotes: "",
    docs: emptyDocs,
    extraDocs: [] as string[],
  });

  useEffect(() => { listSubs().then(setSavedSubs).catch(() => {}); }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateDoc(key: string, patch: Partial<DocState>) {
    setForm((f) => ({ ...f, docs: { ...f.docs, [key]: { ...f.docs[key], ...patch } } }));
  }

  const docsComplete = useMemo(
    () => REQUIRED_DOCS.filter((d) => { const s = form.docs[d.key]; return s && (s.uploaded || s.na || s.deferred); }).length,
    [form.docs],
  );

  function handleFile(key: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) updateDoc(key, { uploaded: file.name, na: false, deferred: false });
  }
  function handleDrop(key: string, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) updateDoc(key, { uploaded: file.name, na: false, deferred: false });
  }
  function handleExtraFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 30 - form.extraDocs.length);
    if (files.length) update("extraDocs", [...form.extraDocs, ...files.map((f) => f.name)]);
  }

  async function submit() {
    if (!form.projectName.trim() || !form.address.trim()) {
      toast.error("Project name and address are required");
      return;
    }
    setSaving(true);
    try {
      // Persist referenced subs to DB so they're centrally available
      for (const s of [form.subPlumbing, form.subElectrical, form.subGas]) {
        if (!s.companyName.trim()) continue;
        // Only create when the company isn't already saved
        const exists = savedSubs.find((x) => x.company_name.trim().toLowerCase() === s.companyName.trim().toLowerCase());
        if (!exists) {
          await createSub({
            company_name: s.companyName,
            qualifier_name: s.qualifierName || null,
            license_number: s.licenseNumber || null,
            email: s.contactEmail || null,
            insurance_carrier_email: s.insuranceCarrierEmail || null,
          }).catch(() => {});
        }
      }

      const documents: PermitDoc[] = REQUIRED_DOCS.map((d) => {
        const s = form.docs[d.key];
        const status: PermitDoc["status"] = s.uploaded ? "uploaded" : s.deferred ? "pending" : s.na ? "not_applicable" : "missing";
        return { key: d.key, label: d.label, required: d.required, status, filename: s.uploaded };
      });

      const row = await createPermit({
        project_name: form.projectName,
        job_address: form.address,
        municipality: form.municipality || null,
        permit_type: form.permitType,
        description: form.description || null,
        additional_notes: form.additionalNotes || null,
        owner_name: form.ownerName || null,
        owner_entity: form.ownerEntity || null,
        contractor_company: form.contractorCompany || null,
        contractor_qualifier: form.contractorQualifier || null,
        company_address: form.companyAddress || null,
        poc: form.poc || null,
        poc_phone: form.pocPhone || null,
        poc_email: form.pocEmail || null,
        license_number: form.licenseNumber || null,
        signer_phone: form.signerPhone || null,
        signer_email: form.signerEmail || null,
        submitted_date: form.submittedDate || null,
        status: "submitted",
        subs: [
          { trade: "Plumbing", companyName: form.subPlumbing.companyName, qualifierName: form.subPlumbing.qualifierName, licenseNumber: form.subPlumbing.licenseNumber, contactEmail: form.subPlumbing.contactEmail, insuranceCarrierEmail: form.subPlumbing.insuranceCarrierEmail },
          { trade: "Electrical", companyName: form.subElectrical.companyName, qualifierName: form.subElectrical.qualifierName, licenseNumber: form.subElectrical.licenseNumber, contactEmail: form.subElectrical.contactEmail, insuranceCarrierEmail: form.subElectrical.insuranceCarrierEmail },
          { trade: "Gas", companyName: form.subGas.companyName, qualifierName: form.subGas.qualifierName, licenseNumber: form.subGas.licenseNumber, contactEmail: form.subGas.contactEmail, insuranceCarrierEmail: form.subGas.insuranceCarrierEmail },
        ].filter((s) => s.companyName.trim()),
        documents,
        extra_docs: form.extraDocs,
      });

      toast.success("Permit created");
      navigate({ to: "/portal/permits/$id", params: { id: row.id } });
    } catch (e) {
      toast.error("Failed to create permit: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "block w-full border border-obsidian/15 bg-white px-3 py-2 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none rounded-[3px]";
  const labelCls = "block text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 mb-1.5";
  const sectionCls = "text-[11px] font-mono uppercase tracking-[0.18em] text-obsidian/75";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="border-b border-obsidian/10 pb-6">
        <div className="eyebrow text-obsidian/50">Permit Intake</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="display-serif text-4xl sm:text-5xl text-obsidian">New Permit</h1>
          <Link to="/my-permits" className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian">Cancel</Link>
        </div>
        <div className="mt-6 flex items-center gap-3">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`h-7 w-7 grid place-items-center rounded-full font-mono text-[11px] ${form.step >= n ? "bg-obsidian text-paper" : "bg-obsidian/10 text-obsidian/50"}`}>{n}</div>
              <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${form.step === n ? "text-obsidian" : "text-obsidian/45"}`}>
                {n === 1 ? "Project Details" : "Contact & Documents"}
              </span>
              {n === 1 && <div className="w-8 h-px bg-obsidian/15" />}
            </div>
          ))}
        </div>
      </div>

      {form.step === 1 ? (
        <div className="mt-6 space-y-6 bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label className={labelCls}>Project Name *</label><input required className={inputCls} value={form.projectName} onChange={(e) => update("projectName", e.target.value)} /></div>
            <div><label className={labelCls}>Property Address *</label><input required className={inputCls} value={form.address} onChange={(e) => update("address", e.target.value)} /></div>
            <div><label className={labelCls}>Municipality / City *</label><input required className={inputCls} value={form.municipality} onChange={(e) => update("municipality", e.target.value)} /></div>
            <div>
              <label className={labelCls}>Permit Type</label>
              <select className={inputCls} value={form.permitType} onChange={(e) => update("permitType", e.target.value)}>
                {PERMIT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
          </div>

          <div className="pt-2 space-y-5">
            <div className={sectionCls}>Subcontractors</div>
            {(["subPlumbing", "subElectrical", "subGas"] as const).map((k) => {
              const trade = k === "subPlumbing" ? "Plumbing" : k === "subElectrical" ? "Electrical" : "Gas";
              const s = form[k];
              const set = (patch: Partial<SubIntake>) => update(k, { ...s, ...patch });
              return (
                <div key={k} className="border border-obsidian/12 rounded-[3px] p-4">
                  <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian">{trade} Sub</div>
                    {savedSubs.length > 0 && (
                      <select
                        className="text-[12px] border border-obsidian/20 rounded-[3px] px-2 py-1 bg-white"
                        defaultValue=""
                        onChange={(e) => {
                          const rec = savedSubs.find((x) => x.id === e.target.value);
                          if (rec) set({
                            companyName: rec.company_name,
                            qualifierName: rec.qualifier_name ?? "",
                            licenseNumber: rec.license_number ?? "",
                            contactEmail: rec.email ?? "",
                            insuranceCarrierEmail: rec.insurance_carrier_email ?? "",
                          });
                          e.target.value = "";
                        }}
                      >
                        <option value="">Select saved sub…</option>
                        {savedSubs.map((x) => <option key={x.id} value={x.id}>{x.company_name}{x.trade ? ` — ${x.trade}` : ""}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className={labelCls}>Company Name</label><input className={inputCls} value={s.companyName} onChange={(e) => set({ companyName: e.target.value })} /></div>
                    <div><label className={labelCls}>Qualifier Name</label><input className={inputCls} value={s.qualifierName} onChange={(e) => set({ qualifierName: e.target.value })} /></div>
                    <div><label className={labelCls}>License Number</label><input className={inputCls} value={s.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} /></div>
                    <div><label className={labelCls}>Contact Email</label><input type="email" className={inputCls} value={s.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} /></div>
                    <div className="sm:col-span-2"><label className={labelCls}>Insurance Carrier Contact Email</label><input type="email" className={inputCls} value={s.insuranceCarrierEmail} onChange={(e) => set({ insuranceCarrierEmail: e.target.value })} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label className={labelCls}>Submitted Date</label>
            <input type="date" className={`${inputCls} max-w-xs`} value={form.submittedDate} onChange={(e) => update("submittedDate", e.target.value)} />
          </div>

          <div className="flex justify-end pt-2 border-t border-obsidian/10">
            <button type="button" onClick={() => update("step", 2)} className="inline-flex items-center gap-2 bg-obsidian px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]">
              Next: Contact & Documents
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8 space-y-5">
            <div className={sectionCls}>Contractor Information</div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className={labelCls}>Contractor Company Name *</label><input required className={inputCls} value={form.contractorCompany} onChange={(e) => update("contractorCompany", e.target.value)} /></div>
              <div><label className={labelCls}>Contractor Qualifier Name *</label><input required className={inputCls} value={form.contractorQualifier} onChange={(e) => update("contractorQualifier", e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Company Address</label><input className={inputCls} value={form.companyAddress} onChange={(e) => update("companyAddress", e.target.value)} /></div>
              <div><label className={labelCls}>Point of Contact *</label><input required className={inputCls} value={form.poc} onChange={(e) => update("poc", e.target.value)} /></div>
              <div><label className={labelCls}>POC Phone *</label><input required className={inputCls} value={form.pocPhone} onChange={(e) => update("pocPhone", e.target.value)} /></div>
              <div><label className={labelCls}>POC Email *</label><input type="email" required className={inputCls} value={form.pocEmail} onChange={(e) => update("pocEmail", e.target.value)} /></div>
              <div><label className={labelCls}>License Number *</label><input required className={inputCls} value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} /></div>
            </div>
          </div>

          <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8 space-y-5">
            <div className={sectionCls}>Property Owner Information</div>
            <div>
              <label className={labelCls}>Name of Owner</label>
              <input className={inputCls} value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Name of Trust / Corp / LLC</label>
              <input className={inputCls} value={form.ownerEntity} onChange={(e) => update("ownerEntity", e.target.value)} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label className={labelCls}>Signer Phone</label><input className={inputCls} value={form.signerPhone} onChange={(e) => update("signerPhone", e.target.value)} /></div>
              <div><label className={labelCls}>Signer Email</label><input type="email" className={inputCls} value={form.signerEmail} onChange={(e) => update("signerEmail", e.target.value)} /></div>
            </div>
          </div>

          <div className="bg-white border border-obsidian/10 rounded-[3px] p-6 sm:p-8 space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className={sectionCls}>Upload Documents</div>
                <p className="mt-1 text-[12px] text-obsidian/60">Required document checklist.</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">{docsComplete} of {REQUIRED_DOCS.length} complete</div>
                <div className="mt-1.5 h-1.5 w-40 bg-obsidian/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(docsComplete / REQUIRED_DOCS.length) * 100}%` }} />
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              {REQUIRED_DOCS.map((d) => {
                const s = form.docs[d.key];
                const done = s.uploaded || s.na || s.deferred;
                return (
                  <li key={d.key} className="border border-obsidian/10 rounded-[3px] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {done ? <Check className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-obsidian/40" />}
                          <span className="text-sm font-medium text-obsidian">{d.label}</span>
                          <span className={`font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded ${d.required ? "bg-red-50 text-red-700" : "bg-obsidian/8 text-obsidian/60"}`}>
                            {d.required ? "Required" : "Optional"}
                          </span>
                          {s.deferred && <span className="font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Pending — upload later</span>}
                        </div>
                        <p className="mt-1 text-[12px] text-obsidian/60">{d.desc}</p>
                      </div>
                    </div>

                    {s.uploaded ? (
                      <div className="flex items-center justify-between gap-2 text-[12px] text-obsidian/80 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-[3px]">
                        <div className="flex items-center gap-2 min-w-0"><FileText className="h-3.5 w-3.5 shrink-0 text-emerald-700" /><span className="truncate">{s.uploaded}</span></div>
                        <button type="button" onClick={() => updateDoc(d.key, { uploaded: null })} className="text-obsidian/50 hover:text-obsidian shrink-0"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : s.deferred ? (
                      <div className="flex items-center justify-between gap-2 text-[12px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-[3px]">
                        <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-amber-700" />Marked as pending — you'll upload later.</div>
                        <button type="button" onClick={() => updateDoc(d.key, { deferred: false })} className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-800 hover:text-amber-900">Undo</button>
                      </div>
                    ) : (
                      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(d.key, e)} className="border-2 border-dashed border-obsidian/20 hover:border-obsidian/40 bg-obsidian/[0.02] rounded-[3px] px-4 py-5 text-center transition-colors">
                        <Upload className="mx-auto h-5 w-5 text-obsidian/40" strokeWidth={1.5} />
                        <p className="mt-2 text-[12px] text-obsidian/65">
                          Drag & drop a PDF here, or{" "}
                          <label className="text-obsidian font-medium underline cursor-pointer">
                            browse
                            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(d.key, e)} />
                          </label>
                        </p>
                        <CloudUploadButtons />
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-4 flex-wrap">
                      {!d.required && !s.uploaded && (
                        <label className="flex items-center gap-1.5 text-[11px] text-obsidian/70">
                          <input type="checkbox" checked={s.na} onChange={(e) => updateDoc(d.key, { na: e.target.checked, uploaded: null, deferred: false })} />
                          Does not apply
                        </label>
                      )}
                      {d.canDefer && !s.uploaded && (
                        <label className="flex items-center gap-1.5 text-[11px] text-amber-800">
                          <input type="checkbox" checked={s.deferred} onChange={(e) => updateDoc(d.key, { deferred: e.target.checked, na: false, uploaded: null })} />
                          I'll upload this later
                        </label>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="pt-2">
              <div className={sectionCls}>Additional Documents</div>
              <label className="mt-3 inline-flex items-center gap-2 cursor-pointer border border-obsidian/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] hover:bg-obsidian/5">
                <Upload className="h-3.5 w-3.5" /> Add PDFs ({form.extraDocs.length}/30)
                <input type="file" accept="application/pdf" multiple className="hidden" onChange={handleExtraFiles} />
              </label>
              {form.extraDocs.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {form.extraDocs.map((name, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-[12px] text-obsidian/70 bg-obsidian/5 px-2 py-1 rounded-[3px]">
                      <span className="truncate">{name}</span>
                      <button type="button" onClick={() => update("extraDocs", form.extraDocs.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className={labelCls}>Additional Notes</label>
              <textarea rows={3} className={inputCls} value={form.additionalNotes} onChange={(e) => update("additionalNotes", e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <button type="button" onClick={() => update("step", 1)} className="inline-flex items-center gap-2 border border-obsidian/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button type="button" disabled={saving} onClick={submit} className="inline-flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian rounded-[3px] disabled:opacity-60" style={{ backgroundColor: "#E4B93B" }}>
              <Send className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Submit Permit Intake"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
