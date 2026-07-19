import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";
import type { Project } from "@/lib/projects-data";
import { fullAddress } from "@/lib/projects-data";
import { getPCN } from "@/lib/project-pcn";
import { FLORIDIAN_FIRM } from "@/lib/floridian-firm";
import {
  generateNTBO,
  generateOwnerAuth,
  downloadPdf,
} from "@/lib/private-provider-forms";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function GenerateNTBODialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
}) {
  const [projectName, setProjectName] = useState("");
  const [parcelTaxId, setParcelTaxId] = useState("");
  const [plansReview, setPlansReview] = useState(true);
  const [inspections, setInspections] = useState(true);
  const [firmName, setFirmName] = useState(FLORIDIAN_FIRM.firmName);
  const [privateProvider, setPrivateProvider] = useState(FLORIDIAN_FIRM.privateProvider);
  const [addressLine1, setAddressLine1] = useState(FLORIDIAN_FIRM.addressLine1);
  const [addressLine2, setAddressLine2] = useState(FLORIDIAN_FIRM.addressLine2);
  const [telephone, setTelephone] = useState(FLORIDIAN_FIRM.telephone);
  const [email, setEmail] = useState(FLORIDIAN_FIRM.email);
  const [licenseNumber, setLicenseNumber] = useState(FLORIDIAN_FIRM.licenseNumber);
  const [printNameCorporation, setPrintNameCorporation] = useState(FLORIDIAN_FIRM.printNameCorporation);
  const [representativeName, setRepresentativeName] = useState(FLORIDIAN_FIRM.representativeName);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setProjectName(project.name);
      setParcelTaxId(getPCN(project.id));
    }
  }, [open, project]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Generate NTBO</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Notice to Building Official — Use of Private Provider. Review the pre-filled fields and generate the PDF.
        </DialogDescription>

        <div className="mt-5 space-y-5">
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

          <Section title="Private Provider">
            <Field label="Signatory Type" value="Corporation" onChange={() => {}} disabled />
            <Field label="Private Provider Firm" value={firmName} onChange={setFirmName} />
            <Field label="Private Provider" value={privateProvider} onChange={setPrivateProvider} />
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
          <Button variant="dark" className="rounded-[3px]" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateOwnerAuthDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project;
}) {
  const [propertyAddress, setPropertyAddress] = useState("");
  const [permitProjectNo, setPermitProjectNo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPropertyAddress(fullAddress(project));
      setPermitProjectNo(project.permit_no || "");
    }
  }, [open, project]);

  async function generate() {
    setBusy(true);
    try {
      const bytes = await generateOwnerAuth({
        propertyAddress,
        permitProjectNo,
        firmName: FLORIDIAN_FIRM.firmName,
        privateProvider: FLORIDIAN_FIRM.privateProvider,
        telephone: FLORIDIAN_FIRM.telephone,
        email: FLORIDIAN_FIRM.email,
        licenseNumber: FLORIDIAN_FIRM.licenseNumber,
      });
      downloadPdf(bytes, `OwnerAuth_${slugify(project.name)}.pdf`);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-[3px]">
        <DialogTitle className="display-serif text-2xl text-obsidian">Generate Owner Authorization</DialogTitle>
        <DialogDescription className="text-sm text-obsidian/70">
          Private Provider Owner Authorization & Indemnification. Review and generate.
        </DialogDescription>

        <div className="mt-5 space-y-4">
          <Field label="Property Address" value={propertyAddress} onChange={setPropertyAddress} />
          <Field label="Permit / Project No." value={permitProjectNo} onChange={setPermitProjectNo} mono placeholder="Blank if not yet assigned" />

          <div className="border border-obsidian/12 rounded-[3px] p-3 bg-paper-warm text-xs text-obsidian/70 leading-relaxed">
            Firm details (Flōridian · Elajuwan Davis · CPC1459161) are attached automatically from the firm profile.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-[3px]" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="dark" className="rounded-[3px]" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- small subcomponents ----

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
