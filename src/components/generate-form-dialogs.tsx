import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/projects-data";
import { fullAddress } from "@/lib/projects-data";
import { getPCN } from "@/lib/project-pcn";
import { listContractors, getContractor, type Contractor } from "@/lib/contractors-store";
import {
  generateNTBO,
  generateOwnerAuth,
  downloadPdf,
} from "@/lib/private-provider-forms";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitAddress(address: string): { line1: string; line2: string } {
  // Best-effort split at first comma: "1000 Pine Island Rd, Suite 155, Plantation, FL 33324"
  const idx = address.indexOf(",");
  if (idx === -1) return { line1: address, line2: "" };
  return { line1: address.slice(0, idx).trim(), line2: address.slice(idx + 1).trim() };
}

// ---------- NTBO ----------

export function GenerateNTBODialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
}) {
  const contractors = useMemo(() => (open ? listContractors(true) : []), [open]);
  const [contractorId, setContractorId] = useState<string>("");

  const [projectName, setProjectName] = useState("");
  const [parcelTaxId, setParcelTaxId] = useState("");
  const [plansReview, setPlansReview] = useState(true);
  const [inspections, setInspections] = useState(true);

  const [firmName, setFirmName] = useState("");
  const [privateProvider, setPrivateProvider] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [printNameCorporation, setPrintNameCorporation] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset project fields when dialog opens
  useEffect(() => {
    if (open) {
      setProjectName(project.name);
      void getPCN({ projectId: project.id }).then((v) => setParcelTaxId(v));
      setContractorId("");
    }
  }, [open, project]);

  // Auto-fill contractor fields when selected
  useEffect(() => {
    if (!contractorId) return;
    const c = getContractor(contractorId);
    if (!c) return;
    const { line1, line2 } = splitAddress(c.address);
    setFirmName(c.firm_name);
    setPrivateProvider(c.contact_name);
    setAddressLine1(line1);
    setAddressLine2(line2);
    setTelephone(c.phone);
    setEmail(c.email);
    setLicenseNumber(c.license_number);
    setPrintNameCorporation(c.firm_name);
    setRepresentativeName(c.contact_name);
  }, [contractorId]);

  async function generate() {
    setBusy(true);
    try {
      const bytes = await generateNTBO({
        projectName,
        parcelTaxId,
        services: { plansReview, inspections },
        signatoryType: "Corporation",
        firmName,
        privateProvider,
        addressLine1,
        addressLine2,
        telephone,
        email,
        licenseNumber,
        printNameCorporation,
        representativeName,
      });
      downloadPdf(bytes, `NTBO_${slugify(project.name)}.pdf`);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const noContractors = contractors.length === 0;
  const canGenerate = !!contractorId && !!firmName && !!licenseNumber && !busy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Generate NTBO</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Notice to Building Official — Use of Private Provider. Select the contractor, review fields, and generate the PDF.
        </DialogDescription>

        <div className="mt-5 space-y-5">
          <Section title="Select Contractor">
            {noContractors ? (
              <NoContractorsBanner />
            ) : (
              <>
                <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1 block">
                  Registered Contractor
                </Label>
                <Select value={contractorId} onValueChange={setContractorId}>
                  <SelectTrigger className="rounded-[3px]">
                    <SelectValue placeholder="Choose a contractor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.firm_name} — {c.license_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[11px] text-obsidian/55">
                  Fields below auto-fill from the selected contractor and can be edited before generating.
                </p>
              </>
            )}
          </Section>

          <Section title="Project">
            <Field label="Project Name" value={projectName} onChange={setProjectName} />
            <Field label="Parcel Tax ID (PCN)" value={parcelTaxId} onChange={setParcelTaxId} mono placeholder="Run PCN lookup on project header if empty" />
          </Section>

          <Section title="Services">
            <div className="flex flex-wrap gap-6 mt-1">
              <label className="flex items-center gap-2 text-sm text-obsidian cursor-pointer">
                <Checkbox checked={plansReview} onCheckedChange={(v) => setPlansReview(!!v)} />
                Plans Review
              </label>
              <label className="flex items-center gap-2 text-sm text-obsidian cursor-pointer">
                <Checkbox checked={inspections} onCheckedChange={(v) => setInspections(!!v)} />
                Inspections
              </label>
            </div>
          </Section>

          <Section title="Contractor / Private Provider">
            <Field label="Firm Name" value={firmName} onChange={setFirmName} />
            <Field label="Contact / Private Provider" value={privateProvider} onChange={setPrivateProvider} />
            <Field label="Address Line 1" value={addressLine1} onChange={setAddressLine1} />
            <Field label="Address Line 2" value={addressLine2} onChange={setAddressLine2} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telephone" value={telephone} onChange={setTelephone} />
              <Field label="Florida License #" value={licenseNumber} onChange={setLicenseNumber} mono />
            </div>
            <Field label="Email" value={email} onChange={setEmail} />
            <Field label="Print Name (Corporation)" value={printNameCorporation} onChange={setPrintNameCorporation} />
            <Field label="Representative Name" value={representativeName} onChange={setRepresentativeName} />
          </Section>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={generate} disabled={!canGenerate}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Owner Auth ----------

export function GenerateOwnerAuthDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
}) {
  const contractors = useMemo(() => (open ? listContractors(true) : []), [open]);
  const [contractorId, setContractorId] = useState<string>("");

  const [propertyAddress, setPropertyAddress] = useState("");
  const [permitProjectNo, setPermitProjectNo] = useState("");

  const [firmName, setFirmName] = useState("");
  const [privateProvider, setPrivateProvider] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPropertyAddress(fullAddress(project));
      setPermitProjectNo(project.permit_no || "");
      setContractorId("");
    }
  }, [open, project]);

  useEffect(() => {
    if (!contractorId) return;
    const c = getContractor(contractorId);
    if (!c) return;
    setFirmName(c.firm_name);
    setPrivateProvider(c.contact_name);
    setTelephone(c.phone);
    setEmail(c.email);
    setLicenseNumber(c.license_number);
  }, [contractorId]);

  async function generate() {
    setBusy(true);
    try {
      const bytes = await generateOwnerAuth({
        propertyAddress,
        permitProjectNo,
        firmName,
        privateProvider,
        telephone,
        email,
        licenseNumber,
      });
      downloadPdf(bytes, `OwnerAuth_${slugify(project.name)}.pdf`);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const noContractors = contractors.length === 0;
  const canGenerate = !!contractorId && !!firmName && !!licenseNumber && !busy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Generate Owner Authorization</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Private Provider Owner Authorization & Indemnification. Select contractor and review fields.
        </DialogDescription>

        <div className="mt-5 space-y-5">
          <Section title="Select Contractor">
            {noContractors ? (
              <NoContractorsBanner />
            ) : (
              <Select value={contractorId} onValueChange={setContractorId}>
                <SelectTrigger className="rounded-[3px]">
                  <SelectValue placeholder="Choose a contractor…" />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firm_name} — {c.license_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Section>

          <Section title="Property">
            <Field label="Property Address" value={propertyAddress} onChange={setPropertyAddress} />
            <Field label="Permit / Project No." value={permitProjectNo} onChange={setPermitProjectNo} mono placeholder="Blank if not yet assigned" />
          </Section>

          <Section title="Contractor / Private Provider">
            <Field label="Firm Name" value={firmName} onChange={setFirmName} />
            <Field label="Contact / Private Provider" value={privateProvider} onChange={setPrivateProvider} />
            <Field label="Telephone" value={telephone} onChange={setTelephone} />
            <Field label="Email" value={email} onChange={setEmail} />
            <Field label="Florida License #" value={licenseNumber} onChange={setLicenseNumber} mono />
          </Section>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={generate} disabled={!canGenerate}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- shared bits ----

function NoContractorsBanner() {
  return (
    <div className="flex items-start gap-3 border border-oxblood/25 bg-oxblood/5 rounded-[3px] p-3">
      <AlertCircle className="h-4 w-4 mt-0.5 text-oxblood shrink-0" />
      <div className="text-xs text-obsidian/80 leading-relaxed">
        No active contractors registered.{" "}
        <Link to="/admin/contractors" className="underline font-medium">
          Add one in Admin → Contractors
        </Link>{" "}
        to enable form generation.
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/55 mb-2 pb-1.5 border-b border-obsidian/10">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/55 mb-1 block">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`rounded-[3px] ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
