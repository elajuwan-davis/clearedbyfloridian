import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Upload, X, Plus, ArrowLeft, MapPin, Sparkles, AlertTriangle, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { CloudUploadButtons } from "@/components/cloud-upload-buttons";
import { CompanyComplianceBanner } from "@/components/company-compliance-banner";
import { getCurrentGcCompanyProfile } from "@/lib/gc-company";
import { AddressLookupField } from "@/components/address-lookup-field";
import type { ResolvedAddress } from "@/lib/address-lookup";
import { estimatePermitFee } from "@/lib/fee-schedules";

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
  county: string;
  folio: string;
  squareFootage: string;
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

type LicenseCheck = {
  status: "pending" | "found" | "expired" | "not-found";
  qualifierName?: string;
  licenseType?: string;
  expiration?: string;
};

function defaultStep1(): Step1 {
  return {
    category: "Residential",
    projectName: "",
    address: "",
    privateProvider: "Cleard",
    existingPermit: "",
    municipality: "",
    county: "",
    folio: "",
    squareFootage: "",
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

/** Deterministic scope-of-work narrative, built from the intake fields so far. */
function draftScopeNarrative(s1: Step1): string {
  const trades = s1.subtrades.length > 0 ? s1.subtrades.join(", ") : "no additional subtrades identified";
  const municipality = s1.municipality.trim() || "the governing jurisdiction";
  const sqFt = s1.squareFootage.trim();
  const valuation = s1.valuation.trim();
  const category = s1.category.toLowerCase();

  const lines: string[] = [];
  lines.push(
    `This application requests a ${category} building permit for the property located at ${s1.address.trim() || "[project address]"}, within ${municipality}.`,
  );
  lines.push(
    `The scope of work consists of ${category} construction${sqFt ? ` totaling approximately ${sqFt} square feet` : ""}${
      valuation ? ` with an estimated construction value of $${Number(valuation).toLocaleString("en-US")}` : ""
    }. Work will be performed in accordance with the Florida Building Code and all applicable local amendments enforced by ${municipality}.`,
  );
  lines.push(`Subtrades involved in this permit: ${trades}.`);
  lines.push(
    "All work will be completed by state-licensed contractors under the supervision of the qualifying agent listed on this application. Required inspections will be scheduled at each applicable phase, and signed/sealed plans, energy calculations, and supporting documentation will be submitted with this package.",
  );
  return lines.join("\n\n");
}

function PermitIntakePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [s1, setS1] = useState<Step1>(defaultStep1);
  const [s2, setS2] = useState<Step2>(defaultStep2);
  const [files, setFiles] = useState<File[]>([]);
  const [requiredDocs, setRequiredDocs] = useState<Record<string, File | null>>({});
  const [licenseChecks, setLicenseChecks] = useState<Record<number, LicenseCheck>>({});
  const [victoriaOpen, setVictoriaOpen] = useState(false);
  const [victoriaDrafting, setVictoriaDrafting] = useState(false);
  const [victoriaDraft, setVictoriaDraft] = useState("");

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

  function onAddressResolved(r: ResolvedAddress) {
    setS1((s) => ({
      ...s,
      address: r.formatted || s.address,
      municipality: r.incorporated ? r.city : s.municipality,
      county: r.county || s.county,
      // Folio/parcel lookup isn't wired to a data source yet.
      folio: "lookup pending",
    }));
  }

  function checkLicense(index: number) {
    const raw = s2.licenses[index]?.trim();
    if (!raw) {
      setLicenseChecks((c) => ({ ...c, [index]: undefined as unknown as LicenseCheck }));
      return;
    }
    const profile = getCurrentGcCompanyProfile();
    const normalize = (v: string) => v.replace(/[^a-z0-9]/gi, "").toUpperCase();
    const candidates = [profile.primaryQualifier, profile.secondaryQualifier].filter(Boolean) as Array<{
      name: string;
      licenseNumber: string;
      licenseType: string;
      expiration: string;
      dbprStatus: string;
    }>;
    const match = candidates.find((q) => normalize(q.licenseNumber) === normalize(raw));
    if (!match) {
      setLicenseChecks((c) => ({ ...c, [index]: { status: "not-found" } }));
      return;
    }
    const expired = match.dbprStatus === "expired" || new Date(match.expiration).getTime() < Date.now();
    setLicenseChecks((c) => ({
      ...c,
      [index]: {
        status: expired ? "expired" : "found",
        qualifierName: match.name,
        licenseType: match.licenseType,
        expiration: match.expiration,
      },
    }));
  }

  function openVictoria() {
    setVictoriaOpen(true);
    setVictoriaDrafting(true);
    setVictoriaDraft("");
    // Deterministic local generation — no external Victoria/AI wiring found for
    // scope narratives yet, so this produces a well-formed template from the
    // intake data already entered.
    window.setTimeout(() => {
      setVictoriaDraft(draftScopeNarrative(s1));
      setVictoriaDrafting(false);
    }, 700);
  }

  function acceptVictoriaDraft() {
    setS1((s) => ({ ...s, scope: victoriaDraft }));
    setVictoriaOpen(false);
    toast.success("Scope of work updated from Victoria's draft");
  }

  const requiredDocList = s1.category === "Commercial" ? REQUIRED_DOCS_COM : REQUIRED_DOCS_RES;

  const feeCategory = s1.category === "Commercial" ? "commercial" : "residential";
  const feeEstimate = useMemo(
    () =>
      estimatePermitFee({
        municipality: s1.municipality,
        category: feeCategory,
        squareFootage: Number(s1.squareFootage) || 0,
        constructionValue: Number(s1.valuation) || 0,
      }),
    [s1.municipality, feeCategory, s1.squareFootage, s1.valuation],
  );
  const showFeeEstimate = Number(s1.squareFootage) > 0 || Number(s1.valuation) > 0;

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
              <AddressLookupField
                className="flex-1 h-10 rounded-[3px] border border-obsidian/15 bg-white px-3 text-sm text-obsidian placeholder:text-obsidian/40 focus:border-obsidian/40 focus:outline-none"
                value={s1.address}
                onChange={(v) => setS1((s) => ({ ...s, address: v }))}
                onResolved={onAddressResolved}
              />
              {(s1.municipality || s1.county || s1.folio) && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.1em] text-obsidian/60">
                  <MapPin className="h-3 w-3 text-obsidian/40" />
                  {s1.municipality && <span className="border border-obsidian/15 bg-paper-warm px-2 py-1 rounded-[2px]">{s1.municipality}</span>}
                  {s1.county && <span className="border border-obsidian/15 bg-paper-warm px-2 py-1 rounded-[2px]">{s1.county}</span>}
                  <span className="border border-dashed border-obsidian/25 px-2 py-1 rounded-[2px] text-obsidian/45">
                    Folio: {s1.folio || "lookup pending"}
                  </span>
                </div>
              )}
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
              <Input className="rounded-[3px]" value={s1.municipality} onChange={(e) => setS1({ ...s1, municipality: e.target.value })} placeholder="Search jurisdiction… (auto-fills from address)" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Square Footage">
                <Input type="number" min={0} className="rounded-[3px] tabular-nums" value={s1.squareFootage} onChange={(e) => setS1({ ...s1, squareFootage: e.target.value })} placeholder="2400" />
              </Field>
              <Field label="Valuation of Project ($)" required>
                <Input type="number" min={0} className="rounded-[3px] tabular-nums" value={s1.valuation} onChange={(e) => setS1({ ...s1, valuation: e.target.value })} placeholder="4125000" />
              </Field>
            </div>

            {showFeeEstimate && (
              <div className="border border-sky/40 bg-sky/10 rounded-[3px] px-4 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">Estimated Permit Fee</span>
                  <span className="display-serif text-2xl text-obsidian tabular-nums">${feeEstimate.toLocaleString("en-US")}</span>
                </div>
                <p className="mt-1 text-[11px] text-obsidian/55">
                  Estimate only — based on {s1.municipality || "a default"} fee schedule, square footage, and construction value. Final fees are set by the building department at submittal.
                </p>
              </div>
            )}

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
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="sr-only">Scope of Work</span>
                <button
                  type="button"
                  onClick={openVictoria}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.12em] text-sky hover:text-obsidian"
                >
                  <Wand2 className="h-3.5 w-3.5" /> Draft with Victoria
                </button>
              </div>
              <Textarea className="rounded-[3px] min-h-[140px]" value={s1.scope} onChange={(e) => setS1({ ...s1, scope: e.target.value })} placeholder="Describe the work, materials, square footage, and any HVHZ or oceanfront details." />
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
                  {s2.licenses.map((lic, i) => {
                    const check = licenseChecks[i];
                    return (
                      <div key={i}>
                        <div className="flex gap-2">
                          <Input
                            className="rounded-[3px] font-mono"
                            value={lic}
                            onChange={(e) => {
                              const next = [...s2.licenses]; next[i] = e.target.value; setS2({ ...s2, licenses: next });
                              setLicenseChecks((c) => { const nc = { ...c }; delete nc[i]; return nc; });
                            }}
                            onBlur={() => checkLicense(i)}
                          />
                          {s2.licenses.length > 1 && (
                            <button type="button" onClick={() => setS2({ ...s2, licenses: s2.licenses.filter((_, j) => j !== i) })} className="p-2 text-obsidian/40 hover:text-oxblood">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {check?.status === "found" && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-[12px] text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{check.qualifierName} — {check.licenseType} — active through {check.expiration}</span>
                          </div>
                        )}
                        {check?.status === "expired" && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-[12px] text-oxblood">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{check.qualifierName ?? "Qualifier"} — license expired {check.expiration ? `on ${check.expiration}` : ""}. Update before submitting.</span>
                          </div>
                        )}
                        {check?.status === "not-found" && (
                          <div className="mt-1.5 text-[12px] text-obsidian/50">Qualifier lookup pending — license not found on file.</div>
                        )}
                      </div>
                    );
                  })}
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

      <Sheet open={victoriaOpen} onOpenChange={setVictoriaOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b border-obsidian/10">
            <div className="eyebrow text-obsidian/50 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Victoria
            </div>
            <SheetTitle className="display-serif text-2xl text-obsidian">Draft scope of work</SheetTitle>
            <SheetDescription className="text-sm text-obsidian/55">
              Generated from the project details entered so far. Review, edit, and accept to fill in the field.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {victoriaDrafting ? (
              <div className="flex items-center gap-2 text-sm text-obsidian/55">
                <Loader2 className="h-4 w-4 animate-spin" /> Drafting a narrative for {s1.municipality || "this jurisdiction"}…
              </div>
            ) : (
              <Textarea
                value={victoriaDraft}
                onChange={(e) => setVictoriaDraft(e.target.value)}
                className="rounded-[3px] min-h-[280px] text-sm leading-relaxed"
              />
            )}
          </div>
          <SheetFooter className="p-6 pt-4 border-t border-obsidian/10 flex-row gap-2">
            <Button type="button" variant="ghost" className="rounded-[3px]" onClick={() => setVictoriaOpen(false)}>
              Dismiss
            </Button>
            <Button type="button" variant="outline" className="rounded-[3px] ml-auto" onClick={openVictoria} disabled={victoriaDrafting}>
              Regenerate
            </Button>
            <Button type="button" variant="dark" className="rounded-[3px]" onClick={acceptVictoriaDraft} disabled={victoriaDrafting || !victoriaDraft}>
              Accept
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
