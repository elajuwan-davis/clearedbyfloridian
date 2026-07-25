import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload, Check, FileText, ArrowLeft, Send, X, AlertCircle, Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";
import { ComboboxInput } from "@/components/combobox-input";
import { createPermit, updatePermit, getPermit, type PermitDoc, type PermitRow, type PermitSub } from "@/lib/permits-api";
import { listSubs, createSub, type SubRow } from "@/lib/subs-api";
import { listDesignPros, createDesignPro, type DesignProRow, type DesignProRole } from "@/lib/design-pros-api";
import { triggerNotification } from "@/lib/notifications-api";
import { MUNICIPALITIES } from "@/lib/municipalities";
import { getChecklist } from "@/lib/permit-checklists";
import { bundleFromSubs } from "@/lib/bundle";
import { NocAwarenessRibbon } from "@/components/noc-awareness-ribbon";
import { TradesOnJobPanel } from "@/components/trades-on-job-panel";


export const Route = createFileRoute("/portal/permits/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New Permit Intake — Cleared by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPermitPage,
});


const SCOPE_OPTIONS = [
  "Pool / Spa",
  "Hardscape / Pavers",
  "Electrical",
  "Plumbing",
  "Gas",
  "Mechanical / HVAC",
  "Structural",
  "Roofing",
  "Fence",
  "Demolition",
  "Other",
] as const;

const SUB_TRADES = [
  "Electrical",
  "Plumbing",
  "Gas / LP",
  "Pool / Spa",
  "Fence",
  "Mechanical / HVAC",
  "Structural",
  "Roofing",
  "Other",
] as const;

type DocState = { uploaded: string | null; na: boolean; deferred: boolean };

type SubIntake = {
  trade: string;
  companyName: string;
  licenseNumber: string;
  contactName: string;
  contactEmail: string;
};

const emptySub = (trade: string): SubIntake => ({
  trade,
  companyName: "",
  licenseNumber: "",
  contactName: "",
  contactEmail: "",
});

function NewPermitPage() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const isEditing = !!editId;
  const [savedSubs, setSavedSubs] = useState<SubRow[]>([]);
  const [savedPros, setSavedPros] = useState<DesignProRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);
  const [originalRow, setOriginalRow] = useState<PermitRow | null>(null);
  const [subsSkipped, setSubsSkipped] = useState(false);
  const [docsSkipped, setDocsSkipped] = useState(false);
  const [saveArchitectToContacts, setSaveArchitectToContacts] = useState(false);
  const [saveEngineerToContacts, setSaveEngineerToContacts] = useState(false);
  const [form, setForm] = useState({
    step: 1 as 1 | 2,
    projectName: "",
    address: "",
    municipality: "",
    scopes: [] as string[],
    description: "",
    subs: [] as SubIntake[],
    submittedDate: new Date().toISOString().slice(0, 10),
    architectFirm: "",
    architectContact: "",
    architectLicense: "",
    architectEmail: "",
    engineerFirm: "",
    engineerContact: "",
    engineerLicense: "",
    engineerEmail: "",
    contractorCompany: "",
    contractorQualifier: "",
    companyAddress: "",
    poc: "José Maceda Gutiérrez",
    pocPhone: "(551) 830-6606",
    pocEmail: "team@floridianinc.com",
    licenseNumber: "",
    ownerName: "",
    ownerEntity: "",
    signerPhone: "",
    signerEmail: "",
    additionalNotes: "",
    docs: {} as Record<string, DocState>,
    extraDocs: [] as string[],
  });

  useEffect(() => { listSubs().then(setSavedSubs).catch(() => {}); }, []);
  useEffect(() => { listDesignPros().then(setSavedPros).catch(() => {}); }, []);

  // Load existing permit for editing
  useEffect(() => {
    if (!editId) return;
    getPermit(editId)
      .then((r) => {
        if (!r) { toast.error("Permit not found"); return; }
        setOriginalRow(r);
        const ip = (r.intake_payload ?? {}) as Record<string, any>;
        const architect = (ip.architect ?? {}) as Record<string, string>;
        const engineer = (ip.engineer ?? {}) as Record<string, string>;
        const docsMap: Record<string, DocState> = {};
        for (const d of r.documents ?? []) {
          docsMap[d.key] = {
            uploaded: d.status === "uploaded" ? d.filename : null,
            na: d.status === "not_applicable",
            deferred: d.status === "pending",
          };
        }
        setForm((f) => ({
          ...f,
          projectName: r.project_name ?? "",
          address: r.job_address ?? "",
          municipality: r.municipality ?? "",
          scopes: r.permit_type ? r.permit_type.split(" · ").filter(Boolean) : [],
          description: r.description ?? "",
          subs: (r.subs ?? []).map((s) => ({
            trade: s.trade ?? "Other",
            companyName: s.companyName ?? "",
            licenseNumber: s.licenseNumber ?? "",
            contactName: s.qualifierName ?? "",
            contactEmail: s.contactEmail ?? "",
          })),
          submittedDate: r.submitted_date ?? f.submittedDate,
          architectFirm: architect.firm ?? "",
          architectContact: architect.contact ?? "",
          architectLicense: architect.license ?? "",
          architectEmail: architect.email ?? "",
          engineerFirm: engineer.firm ?? "",
          engineerContact: engineer.contact ?? "",
          engineerLicense: engineer.license ?? "",
          engineerEmail: engineer.email ?? "",
          contractorCompany: r.contractor_company ?? "",
          contractorQualifier: r.contractor_qualifier ?? "",
          companyAddress: r.company_address ?? "",
          poc: r.poc ?? f.poc,
          pocPhone: r.poc_phone ?? f.pocPhone,
          pocEmail: r.poc_email ?? f.pocEmail,
          licenseNumber: r.license_number ?? "",
          ownerName: r.owner_name ?? "",
          ownerEntity: r.owner_entity ?? "",
          signerPhone: r.signer_phone ?? "",
          signerEmail: r.signer_email ?? "",
          additionalNotes: r.additional_notes ?? "",
          docs: docsMap,
          extraDocs: r.extra_docs ?? [],
        }));
      })
      .catch(() => toast.error("Could not load permit for editing"))
      .finally(() => setLoadingEdit(false));
  }, [editId]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateDoc(key: string, patch: Partial<DocState>) {
    setForm((f) => ({ ...f, docs: { ...f.docs, [key]: { ...f.docs[key], ...patch } } }));
  }


  function toggleScope(scope: string) {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter((s) => s !== scope) : [...f.scopes, scope],
    }));
  }

  function addSub(trade: string) {
    setSubsSkipped(false);
    setForm((f) => ({ ...f, subs: [...f.subs, emptySub(trade)] }));
  }
  function updateSub(idx: number, patch: Partial<SubIntake>) {
    setForm((f) => ({ ...f, subs: f.subs.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));
  }
  function removeSub(idx: number) {
    setForm((f) => ({ ...f, subs: f.subs.filter((_, i) => i !== idx) }));
  }

  const primaryType = form.scopes[0] || "Other";
  const checklist = useMemo(() => getChecklist(form.municipality, primaryType), [form.municipality, primaryType]);

  const docsComplete = useMemo(
    () => checklist.filter((d) => { const s = form.docs[d.key]; return s && (s.uploaded || s.na || s.deferred); }).length,
    [form.docs, checklist],
  );

  const filledSubs = form.subs.filter((s) => s.companyName.trim());
  const wantBundle = filledSubs.length >= 2;

  // True once this permit exists AND has an auto-generated NOC on file.
  const hasNoc = useMemo(
    () => (originalRow?.documents ?? []).some(
      (d) => d.key === "notice_of_commencement_review" && d.status === "uploaded",
    ),
    [originalRow],
  );

  // Trades already added to this permit (edit mode) or being added right
  // now (new mode) — feeds the "Trades on this Job" panel and the reuse
  // suggestion logic.
  const jobTrades = useMemo(
    () => filledSubs.map((s) => ({ trade: s.trade, companyName: s.companyName })),
    [filledSubs],
  );

  const [dismissedReuse, setDismissedReuse] = useState<Set<number>>(new Set());
  function dismissReuse(idx: number) {
    setDismissedReuse((prev) => { const n = new Set(prev); n.add(idx); return n; });
  }

  /** For an empty sub row of a given trade, find an already-filled sub on
   *  the same job with the same trade — that's the reuse candidate. */
  function reuseCandidateFor(idx: number): SubIntake | null {
    if (dismissedReuse.has(idx)) return null;
    const row = form.subs[idx];
    if (!row || row.companyName.trim()) return null;
    const match = form.subs.find((s, i) => i !== idx && s.trade === row.trade && s.companyName.trim());
    return match ?? null;
  }

  function applyReuse(idx: number, source: SubIntake) {
    setForm((f) => ({
      ...f,
      subs: f.subs.map((s, i) => (i === idx ? { ...source, trade: s.trade } : s)),
    }));
  }


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



  async function maybeSaveDesignPro(
    role: DesignProRole,
    save: boolean,
    firm: string,
    contact: string,
    license: string,
    email: string,
  ) {
    if (!save || !firm.trim()) return;
    const exists = savedPros.find(
      (p) => p.role === role && p.firm_name.trim().toLowerCase() === firm.trim().toLowerCase(),
    );
    if (exists) return;
    try {
      await createDesignPro({
        role,
        firm_name: firm.trim(),
        contact_name: contact || null,
        license_number: license || null,
        email: email || null,
      });
    } catch { /* best-effort */ }
  }

  async function submit() {
    if (!form.projectName.trim() || !form.address.trim()) {
      toast.error("Project name and address are required");
      return;
    }


    setSaving(true);
    try {
      for (const s of filledSubs) {
        const exists = savedSubs.find((x) => x.company_name.trim().toLowerCase() === s.companyName.trim().toLowerCase());
        if (!exists) {
          await createSub({
            company_name: s.companyName,
            trade: s.trade,
            qualifier_name: s.contactName || null,
            license_number: s.licenseNumber || null,
            email: s.contactEmail || null,
          }).catch(() => {});
        }
      }

      await maybeSaveDesignPro("architect", saveArchitectToContacts, form.architectFirm, form.architectContact, form.architectLicense, form.architectEmail);
      await maybeSaveDesignPro("engineer", saveEngineerToContacts, form.engineerFirm, form.engineerContact, form.engineerLicense, form.engineerEmail);

      const documents: PermitDoc[] = checklist.map((d) => {
        const s = form.docs[d.key] ?? { uploaded: null, na: false, deferred: false };
        const status: PermitDoc["status"] = s.uploaded ? "uploaded" : s.deferred ? "pending" : s.na ? "not_applicable" : "missing";
        return { key: d.key, label: d.label, required: d.required, status, filename: s.uploaded };
      });

      const priorSubs = (originalRow?.subs ?? []) as PermitSub[];
      const subs: PermitSub[] = filledSubs.map((s) => {
        // Preserve existing per-sub state (accessToken, confirmed) when
        // this permit is being edited and the same company reappears.
        const prior = priorSubs.find(
          (p) => (p.companyName ?? "").trim().toLowerCase() === s.companyName.trim().toLowerCase(),
        );
        return {
          trade: s.trade,
          companyName: s.companyName,
          qualifierName: s.contactName,
          licenseNumber: s.licenseNumber,
          contactEmail: s.contactEmail,
          accessToken: prior?.accessToken ?? crypto.randomUUID(),
          confirmed: prior?.confirmed ?? false,
          confirmedAt: prior?.confirmedAt,
        };
      });

      const priorPayload = (originalRow?.intake_payload ?? {}) as Record<string, unknown>;
      const intake_payload: Record<string, unknown> = {
        ...priorPayload,
        architect: {
          firm: form.architectFirm || "",
          contact: form.architectContact || "",
          license: form.architectLicense || "",
          email: form.architectEmail || "",
        },
        engineer: {
          firm: form.engineerFirm || "",
          contact: form.engineerContact || "",
          license: form.engineerLicense || "",
          email: form.engineerEmail || "",
        },
      };
      if (wantBundle) intake_payload.bundle = bundleFromSubs(subs);
      if (isEditing) intake_payload.last_edited_at = new Date().toISOString();

      const permitPatch = {
        project_name: form.projectName,
        job_address: form.address,
        municipality: form.municipality || null,
        permit_type: form.scopes.join(" · ") || "Other",
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
        subs,
        documents,
        extra_docs: form.extraDocs,
        intake_payload,
      };

      let rowId: string;
      if (isEditing && editId) {
        const updated = await updatePermit(editId, permitPatch);
        rowId = updated.id;
        try {
          await triggerNotification({
            kind: "submission_received",
            title: `Permit submission updated — ${updated.project_name}`,
            body: `${form.contractorCompany || "GC"} updated permit submission on ${new Date().toLocaleDateString()}. Review changes.`,
            permit_id: updated.id,
          });
        } catch { /* best-effort */ }
        toast.success("Submission updated");
        navigate({ to: "/portal/permits/$id", params: { id: rowId } });
      } else {
        const row = await createPermit({ ...permitPatch, status: "submitted" });
        rowId = row.id;
        // Auto-generate internal NTBO (hidden from GC). Best-effort.
        void import("@/lib/ntbo-auto").then((m) => m.autoGenerateNTBOForPermit(row));
        // Auto-generate NOC (Palm Beach County std form) pre-filled from
        // permit data — surfaces in the permit detail as "Review & Sign".
        void import("@/lib/noc-auto").then((m) => m.autoGenerateNOCForPermit(row));

        toast.success(wantBundle ? "Bundle permit created" : "Permit created");
        if (wantBundle) navigate({ to: "/portal/permits/$id/bundle", params: { id: rowId } });
        else navigate({ to: "/portal/permits/$id", params: { id: rowId } });
      }
    } catch (e) {
      toast.error((isEditing ? "Failed to update permit: " : "Failed to create permit: ") + (e instanceof Error ? e.message : String(e)));
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
          <h1 className="display-serif text-4xl sm:text-5xl text-obsidian">{isEditing ? "Edit Submission" : "New Permit"}</h1>
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
            <div className="sm:col-span-2">
              <label className={labelCls}>Municipality / City *</label>
              <ComboboxInput
                value={form.municipality}
                onChange={(v) => update("municipality", v)}
                options={MUNICIPALITIES.map((m) => ({ value: m.name, label: m.name, sublabel: m.note }))}
                placeholder="Type to search or enter freeform…"
                allowFreeform
              />
            </div>
          </div>

          {/* Scope multi-select */}
          <div className="pt-2 space-y-3">
            <label className={labelCls}>Scope of Work (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {SCOPE_OPTIONS.map((s) => {
                const selected = form.scopes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleScope(s)}
                    className={`px-3 py-1.5 rounded-[3px] text-[12px] border transition-colors ${
                      selected
                        ? "bg-obsidian text-white border-obsidian"
                        : "bg-white text-obsidian/70 border-obsidian/20 hover:border-obsidian/40"
                    }`}
                  >
                    {selected && <Check className="inline h-3 w-3 mr-1" />}
                    {s}
                  </button>
                );
              })}
            </div>
            {form.scopes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.scopes.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 bg-[#153157] text-white px-2.5 py-1 rounded-[3px] text-[11px] font-medium">
                    {s}
                    <button type="button" onClick={() => toggleScope(s)} className="text-white/70 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Scope Narrative</label>
            <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the work in more detail…" />
          </div>

          {/* Architect / Engineer — from shared contacts */}
          <div className="grid gap-5 sm:grid-cols-2 pt-2">
            <ProContactBlock
              role="architect"
              label="Architect of Record"
              options={savedPros.filter((p) => p.role === "architect")}
              firm={form.architectFirm}
              contact={form.architectContact}
              license={form.architectLicense}
              email={form.architectEmail}
              onFirm={(v) => update("architectFirm", v)}
              onContact={(v) => update("architectContact", v)}
              onLicense={(v) => update("architectLicense", v)}
              onEmail={(v) => update("architectEmail", v)}
              onPick={(p) => setForm((f) => ({
                ...f,
                architectFirm: p.firm_name,
                architectContact: p.contact_name ?? "",
                architectLicense: p.license_number ?? "",
                architectEmail: p.email ?? "",
              }))}
              saveNew={saveArchitectToContacts}
              onSaveNew={setSaveArchitectToContacts}
              inputCls={inputCls}
              labelCls={labelCls}
            />
            <ProContactBlock
              role="engineer"
              label="Engineer"
              options={savedPros.filter((p) => p.role === "engineer")}
              firm={form.engineerFirm}
              contact={form.engineerContact}
              license={form.engineerLicense}
              email={form.engineerEmail}
              onFirm={(v) => update("engineerFirm", v)}
              onContact={(v) => update("engineerContact", v)}
              onLicense={(v) => update("engineerLicense", v)}
              onEmail={(v) => update("engineerEmail", v)}
              onPick={(p) => setForm((f) => ({
                ...f,
                engineerFirm: p.firm_name,
                engineerContact: p.contact_name ?? "",
                engineerLicense: p.license_number ?? "",
                engineerEmail: p.email ?? "",
              }))}
              saveNew={saveEngineerToContacts}
              onSaveNew={setSaveEngineerToContacts}
              inputCls={inputCls}
              labelCls={labelCls}
            />
          </div>


          {hasNoc && (
            <NocAwarenessRibbon scopeKey={`permits:${editId ?? "new"}`} />
          )}

          {jobTrades.length > 0 && (
            <TradesOnJobPanel
              trades={jobTrades}
              title="Trades on this Job"
              emptyLabel="No trades added yet."
            />
          )}

          {/* Subcontractors */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className={sectionCls}>Subcontractors</div>
                <p className="mt-1 text-[12px] text-obsidian/60">Add subs by trade — all optional. Multiple subs per trade OK.</p>
              </div>
              <button
                type="button"
                onClick={() => { setSubsSkipped(true); update("subs", []); }}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian underline underline-offset-2"
              >
                Skip for now
              </button>
            </div>

            {!subsSkipped && form.subs.length === 0 && (
              <div className="text-[12px] text-obsidian/50 border border-dashed border-obsidian/15 rounded-[3px] p-4 text-center">
                No subs added yet. Choose a trade below to begin.
              </div>
            )}

            {subsSkipped && (
              <div className="text-[12px] text-obsidian/60 bg-obsidian/[0.03] border border-obsidian/10 rounded-[3px] p-3">
                Skipped — you can add subs later from the project dashboard.
              </div>
            )}

            {form.subs.map((s, i) => {
              const reuse = reuseCandidateFor(i);
              return (
              <div key={i} className="space-y-2">
                {reuse && (
                  <div className="flex items-start gap-3 border border-[#153157]/30 bg-[#B6DAEA]/15 rounded-[3px] px-4 py-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#153157]" />
                    <div className="flex-1 text-[13px] text-obsidian/85">
                      <div className="text-obsidian font-medium">Save on this job — {s.trade} is already on file with {reuse.companyName}.</div>
                      <div className="mt-0.5 text-obsidian/60 text-[12px]">Reuse an existing trade instead of pulling a redundant permit.</div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => applyReuse(i, reuse)}
                        className="inline-flex items-center justify-center bg-obsidian px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-paper hover:bg-obsidian/90 rounded-[3px]"
                      >
                        Use {reuse.companyName.length > 22 ? reuse.companyName.slice(0, 20) + "…" : reuse.companyName}
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissReuse(i)}
                        className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 hover:text-obsidian"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
                <div className="border border-obsidian/12 rounded-[3px] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={s.trade}
                      onChange={(e) => updateSub(i, { trade: e.target.value })}
                      className="border border-obsidian/20 rounded-[3px] px-2 py-1.5 text-[12px] font-mono uppercase tracking-[0.12em] bg-white"
                    >
                      {SUB_TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSub(i)}
                      className="text-obsidian/40 hover:text-oxblood"
                      aria-label="Remove sub"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className={labelCls}>Company Name</label><input className={inputCls} value={s.companyName} onChange={(e) => updateSub(i, { companyName: e.target.value })} /></div>
                    <div><label className={labelCls}>License #</label><input className={inputCls} value={s.licenseNumber} onChange={(e) => updateSub(i, { licenseNumber: e.target.value })} /></div>
                    <div><label className={labelCls}>Contact Name</label><input className={inputCls} value={s.contactName} onChange={(e) => updateSub(i, { contactName: e.target.value })} /></div>
                    <div><label className={labelCls}>Contact Email</label><input type="email" className={inputCls} value={s.contactEmail} onChange={(e) => updateSub(i, { contactEmail: e.target.value })} /></div>
                  </div>
                </div>
              </div>
              );
            })}

            {!subsSkipped && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUB_TRADES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addSub(t)}
                    className="inline-flex items-center gap-1.5 border border-obsidian/20 hover:border-obsidian/40 px-3 py-1.5 rounded-[3px] text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/75 hover:text-obsidian"
                  >
                    <Plus className="h-3 w-3" /> {t}
                  </button>
                ))}
              </div>
            )}

            {filledSubs.length > 0 && (
              <div className="border-l-2 border-[#153157] bg-obsidian/[0.03] px-4 py-3 text-[12px] text-obsidian/80">
                {wantBundle
                  ? <>This submission will cover <strong>{filledSubs.length} trades</strong> under one GC permit.</>
                  : <>1 trade added — add more to bundle under a single GC permit.</>}
              </div>
            )}
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
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className={sectionCls}>Upload Documents</div>
                <p className="mt-1 text-[12px] text-obsidian/60">Drawings can be uploaded after intake.</p>
              </div>
              <div className="flex items-center gap-4">
                {!docsSkipped && (
                  <div className="text-right">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55">{docsComplete} of {checklist.length} complete</div>
                    <div className="mt-1.5 h-1.5 w-40 bg-obsidian/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${checklist.length ? (docsComplete / checklist.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setDocsSkipped((v) => !v)}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian underline underline-offset-2"
                >
                  {docsSkipped ? "Undo skip" : "Skip for now"}
                </button>
              </div>
            </div>

            {docsSkipped ? (
              <div className="text-[12px] text-obsidian/60 bg-obsidian/[0.03] border border-obsidian/10 rounded-[3px] p-3">
                Skipped — you can upload documents later from the project dashboard.
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {checklist.map((d) => {
                    const s = form.docs[d.key] ?? { uploaded: null, na: false, deferred: false };
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
              </>
            )}

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
              <Send className="h-3.5 w-3.5" /> {saving ? "Saving…" : isEditing ? "Save Changes" : "Submit Permit Intake"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProContactBlock(props: {
  role: DesignProRole;
  label: string;
  options: DesignProRow[];
  firm: string;
  contact: string;
  license: string;
  email: string;
  onFirm: (v: string) => void;
  onContact: (v: string) => void;
  onLicense: (v: string) => void;
  onEmail: (v: string) => void;
  onPick: (p: DesignProRow) => void;
  saveNew: boolean;
  onSaveNew: (v: boolean) => void;
  inputCls: string;
  labelCls: string;
}) {
  const { options, inputCls, labelCls } = props;
  const knownMatch = options.find((p) => p.firm_name.trim().toLowerCase() === props.firm.trim().toLowerCase());
  return (
    <div className="space-y-2 border border-obsidian/10 rounded-[3px] p-3">
      <label className={labelCls}>{props.label}</label>
      <ComboboxInput
        value={props.firm}
        onChange={(v, opt) => {
          props.onFirm(v);
          if (opt) {
            const picked = options.find((p) => p.firm_name === opt.value);
            if (picked) props.onPick(picked);
          }
        }}
        options={options.map((p) => ({
          value: p.firm_name,
          label: p.firm_name,
          sublabel: [p.contact_name, p.license_number].filter(Boolean).join(" · ") || undefined,
        }))}
        placeholder="Search firm or enter new…"
        allowFreeform
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} value={props.contact} onChange={(e) => props.onContact(e.target.value)} placeholder="Contact name" />
        <input className={inputCls} value={props.license} onChange={(e) => props.onLicense(e.target.value)} placeholder="License #" />
        <input className={`${inputCls} sm:col-span-2`} type="email" value={props.email} onChange={(e) => props.onEmail(e.target.value)} placeholder="Email" />
      </div>
      {props.firm.trim() && !knownMatch && (
        <label className="flex items-center gap-2 text-[11px] text-obsidian/70 pt-1">
          <input type="checkbox" checked={props.saveNew} onChange={(e) => props.onSaveNew(e.target.checked)} />
          Save to contacts for future permits
        </label>
      )}
    </div>
  );
}

