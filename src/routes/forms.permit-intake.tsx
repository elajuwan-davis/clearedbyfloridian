import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";
import { CompanyComplianceBanner } from "@/components/company-compliance-banner";
import { getCurrentGcCompanyProfile } from "@/lib/gc-company";

export const Route = createFileRoute("/forms/permit-intake")({
  head: () => ({ meta: [{ title: "Permit Intake — Cleard" }, { name: "robots", content: "noindex" }] }),
  component: PermitIntakePage,
});

const SUBTRADES = ["Mechanical", "Electrical", "Plumbing", "Gas", "Roofing"] as const;
const REQUIRED_DOCS_RES = ["Signed & Sealed Plans", "Notice of Commencement", "Property Survey", "Energy Calculations"];
const REQUIRED_DOCS_COM = ["Signed & Sealed Plans", "Notice of Commencement", "Property Survey", "Energy Calculations", "Asbestos Survey"];
const DRAFT_KEY = "cleared.draft.permit-intake";

type Step1 = {
  category: "Residential" | "Commercial";
  projectName: string;
  address: string;
  privateProvider: string;
  existingPermit: string;
  municipality: string;
  subtrades: string[];
  scope: string;
  valuation: string;
};

type Step2 = {
  companyName: string;
  qualifierName: string;
  companyAddress: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  licenses: string[];
  ownerName: string;
  ownerEntity: string;
  signorPhone: string;
  signorEmail: string;
  notes: string;
};

function defaultStep1(): Step1 {
  return {
    category: "Residential",
    projectName: "",
    address: "",
    privateProvider: "Cleard",
    existingPermit: "",
    municipality: "",
    subtrades: [],
    scope: "",
    valuation: "",
  };
}

function defaultStep2(): Step2 {
  return {
    companyName: "Coastline Builders Group",
    qualifierName: "Javier Mendez",
    companyAddress: "",
    pocName: "Javier Mendez",
    pocPhone: "(561) 555-0144",
    pocEmail: "jmendez@coastlinebg.com",
    licenses: ["CGC1521884"],
    ownerName: "",
    ownerEntity: "",
    signorPhone: "",
    signorEmail: "",
    notes: "",
  };
}

function PermitIntakePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [s1, setS1] = useState<Step1>(defaultStep1);
  const [s2, setS2] = useState<Step2>(defaultStep2);
  const [files, setFiles] = useState<File[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<Record<string, File | null>>({});

  function toggleSubtrade(name: string) {
    setS1((s) => ({
      ...s,
      subtrades: s.subtrades.includes(name) ? s.subtrades.filter((x) => x !== name) : [...s.subtrades, name],
    }));
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ s1, s2 }));
    toast.success("Draft saved");
  }

  function goNext() {
    if (!s1.address.trim()) return toast.error("Project Address is required");
    if (!s1.scope.trim()) return toast.error("Scope of Work is required");
    if (!s1.valuation.trim()) return toast.error("Project Valuation is required");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitForm() {
    if (!s2.ownerName.trim()) return toast.error("Property Owner name is required");
    const required = s1.category === "Commercial" ? REQUIRED_DOCS_COM : REQUIRED_DOCS_RES;
    const missing = required.filter((d) => !requiredDocs[d]);
    if (missing.length) return toast.error(`Missing required documents: ${missing.join(", ")}`);
    localStorage.removeItem(DRAFT_KEY);
    toast.success("Permit intake submitted. We'll confirm scope within 4 business hours.");
    navigate({ to: "/my-permits" });
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    if (files.length + incoming.length > 50) return toast.error("Maximum 50 additional files");
    setFiles((f) => [...f, ...incoming]);
  }

  const requiredDocList = s1.category === "Commercial" ? REQUIRED_DOCS_COM : REQUIRED_DOCS_RES;

  return (
    <PortalShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <button onClick={() => navigate({ to: "/portal/permits" })} className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-obsidian/55 hover:text-obsidian mb-6">
          <ArrowLeft className="h-3 w-3" /> My Permits
        </button>

        <div className="border-b border-obsidian/10 pb-6">
          <div className="eyebrow text-obsidian/50">Form / 01 — Permit Intake</div>
          <h1 className="display-serif mt-3 text-4xl text-obsidian">{step === 1 ? "Project Details" : "Contact & Documents"}</h1>
          <Steps current={step} />
        </div>

        <div className="mt-6">
          <CompanyComplianceBanner profile={getCurrentGcCompanyProfile()} />
        </div>

        {step === 1 ? (
          <div className="mt-10 space-y-8">
            <Field label="Project Category">
              <div className="inline-flex border border-obsidian/15 rounded-[3px] overflow-hidden">
                {(["Residential", "Commercial"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setS1({ ...s1, category: c })}
                    className="px-5 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: s1.category === c ? "var(--obsidian)" : "transparent",
                      color: s1.category === c ? "var(--paper)" : "var(--obsidian)",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Project Name (optional)">
              <Input className="rounded-[3px]" value={s1.projectName} onChange={(e) => setS1({ ...s1, projectName: e.target.value })} />
            </Field>

            <Field label="Project Address" required>
              <Input className="rounded-[3px]" value={s1.address} onChange={(e) => setS1({ ...s1, address: e.target.value })} placeholder="1247 Banyan Trail, Ocean Ridge, FL" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Private Provider">
                <Select value={s1.privateProvider} onValueChange={(v) => setS1({ ...s1, privateProvider: v })}>
                  <SelectTrigger className="rounded-[3px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cleard">Cleard</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Existing Permit Number (optional)">
                <Input className="rounded-[3px]" value={s1.existingPermit} onChange={(e) => setS1({ ...s1, existingPermit: e.target.value })} />
              </Field>
            </div>

            <Field label="Municipality" required>
              <Input className="rounded-[3px]" value={s1.municipality} onChange={(e) => setS1({ ...s1, municipality: e.target.value })} placeholder="Search jurisdiction…" />
            </Field>

            <Field label="Subtrades">
              <div className="flex flex-wrap gap-2">
                {SUBTRADES.map((t) => {
                  const active = s1.subtrades.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleSubtrade(t)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs font-medium rounded-[3px] transition-colors"
                      style={{
                        borderColor: active ? "var(--obsidian)" : "color-mix(in oklab, var(--obsidian) 18%, transparent)",
                        backgroundColor: active ? "var(--obsidian)" : "transparent",
                        color: active ? "var(--paper)" : "var(--obsidian)",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Detailed Scope of Work" required>
              <Textarea className="rounded-[3px] min-h-[140px]" value={s1.scope} onChange={(e) => setS1({ ...s1, scope: e.target.value })} placeholder="Describe the work, materials, square footage, and any HVHZ or oceanfront details." />
            </Field>

            <Field label="Valuation of Project ($)" required>
              <Input type="number" min={0} className="rounded-[3px] tabular-nums" value={s1.valuation} onChange={(e) => setS1({ ...s1, valuation: e.target.value })} placeholder="4125000" />
            </Field>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-obsidian/10">
              <Button variant="outline" className="rounded-[3px]" onClick={saveDraft}>Save draft</Button>
              <Button variant="dark" className="rounded-[3px] sm:ml-auto" onClick={goNext}>
                Next: Contact Information
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            <Group title="Contractor Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Company Name"><Input className="rounded-[3px]" value={s2.companyName} onChange={(e) => setS2({ ...s2, companyName: e.target.value })} /></Field>
                <Field label="Qualifier Name"><Input className="rounded-[3px]" value={s2.qualifierName} onChange={(e) => setS2({ ...s2, qualifierName: e.target.value })} /></Field>
              </div>
              <Field label="Company Address"><Input className="rounded-[3px]" value={s2.companyAddress} onChange={(e) => setS2({ ...s2, companyAddress: e.target.value })} /></Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Point of Contact"><Input className="rounded-[3px]" value={s2.pocName} onChange={(e) => setS2({ ...s2, pocName: e.target.value })} /></Field>
                <Field label="POC Phone"><Input className="rounded-[3px]" value={s2.pocPhone} onChange={(e) => setS2({ ...s2, pocPhone: e.target.value })} /></Field>
                <Field label="POC Email"><Input className="rounded-[3px]" type="email" value={s2.pocEmail} onChange={(e) => setS2({ ...s2, pocEmail: e.target.value })} /></Field>
              </div>
              <Field label="License Number(s)">
                <div className="space-y-2">
                  {s2.licenses.map((lic, i) => (
                    <div key={i} className="flex gap-2">
                      <Input className="rounded-[3px] font-mono" value={lic} onChange={(e) => {
                        const next = [...s2.licenses]; next[i] = e.target.value; setS2({ ...s2, licenses: next });
                      }} />
                      {s2.licenses.length > 1 && (
                        <button type="button" onClick={() => setS2({ ...s2, licenses: s2.licenses.filter((_, j) => j !== i) })} className="p-2 text-obsidian/40 hover:text-oxblood">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setS2({ ...s2, licenses: [...s2.licenses, ""] })} className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.14em] text-obsidian/65 hover:text-obsidian">
                    <Plus className="h-3 w-3" /> Add another license
                  </button>
                </div>
              </Field>
            </Group>

            <Group title="Property Owner Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name of Owner" required><Input className="rounded-[3px]" value={s2.ownerName} onChange={(e) => setS2({ ...s2, ownerName: e.target.value })} /></Field>
                <Field label="Trust / Corp / LLC (if applicable)"><Input className="rounded-[3px]" value={s2.ownerEntity} onChange={(e) => setS2({ ...s2, ownerEntity: e.target.value })} /></Field>
                <Field label="Signor Phone"><Input className="rounded-[3px]" value={s2.signorPhone} onChange={(e) => setS2({ ...s2, signorPhone: e.target.value })} /></Field>
                <Field label="Signor Email"><Input className="rounded-[3px]" type="email" value={s2.signorEmail} onChange={(e) => setS2({ ...s2, signorEmail: e.target.value })} /></Field>
              </div>
            </Group>

            <Group title="Upload Documents" subtitle={`Required for ${s1.category} projects, plus up to 50 additional PDFs.`}>
              <div className="space-y-2">
                {requiredDocList.map((doc) => (
                  <DocSlot key={doc} label={doc} file={requiredDocs[doc] ?? null} onChange={(f) => setRequiredDocs((r) => ({ ...r, [doc]: f }))} />
                ))}
              </div>
              <div className="mt-6">
                <label className="block border border-dashed border-obsidian/25 bg-paper-warm hover:bg-paper-warm/70 px-5 py-8 text-center cursor-pointer rounded-[3px]">
                  <Upload className="h-5 w-5 mx-auto text-obsidian/55" strokeWidth={1.5} />
                  <div className="mt-3 text-sm text-obsidian">Add additional PDFs</div>
                  <div className="mt-1 text-xs text-obsidian/45">{files.length}/50 attached</div>
                  <input type="file" multiple accept="application/pdf" className="hidden" onChange={onFiles} />
                </label>
                <CloudUploadButtons />
                {files.length > 0 && (
                  <ul className="mt-3 divide-y divide-obsidian/10 border border-obsidian/15 rounded-[3px]">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="truncate text-obsidian">{f.name}</span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-obsidian/40 hover:text-oxblood"><X className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Group>

            <Field label="Additional Notes">
              <Textarea className="rounded-[3px] min-h-[100px]" value={s2.notes} onChange={(e) => setS2({ ...s2, notes: e.target.value })} />
            </Field>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-obsidian/10">
              <Button variant="outline" className="rounded-[3px]" onClick={() => setStep(1)}>Back</Button>
              <Button variant="outline" className="rounded-[3px]" onClick={saveDraft}>Save draft</Button>
              <Button variant="dark" className="rounded-[3px] sm:ml-auto" onClick={submitForm}>Submit Permit Intake</Button>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function Steps({ current }: { current: 1 | 2 }) {
  return (
    <ol className="mt-4 flex gap-6 text-xs font-mono uppercase tracking-[0.14em]">
      {[1, 2].map((n) => (
        <li key={n} className="flex items-center gap-2" style={{ color: current === n ? "var(--obsidian)" : "color-mix(in oklab, var(--obsidian) 35%, transparent)" }}>
          <span className="h-5 w-5 grid place-items-center border" style={{ borderColor: "currentColor", borderRadius: "3px" }}>{n}</span>
          {n === 1 ? "Project" : "Contact & Docs"}
        </li>
      ))}
    </ol>
  );
}

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="display-serif text-2xl text-obsidian">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-obsidian/55">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/65">
        {label}{required && <span className="text-oxblood ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function DocSlot({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 border border-obsidian/15 bg-white rounded-[3px] cursor-pointer hover:border-obsidian/40">
      <Checkbox checked={!!file} className="rounded-[3px] pointer-events-none" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-obsidian">{label}</div>
        {file && <div className="text-xs text-obsidian/55 truncate">{file.name}</div>}
      </div>
      <span className="text-xs font-mono uppercase tracking-[0.14em] text-obsidian/55">{file ? "Replace" : "Upload"}</span>
      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}
