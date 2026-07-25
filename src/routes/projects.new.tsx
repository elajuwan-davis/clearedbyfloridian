import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  X,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/projects/new")({
  head: () => ({
    meta: [
      { title: "New Project — Cleard by Flōridian" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewProjectPage,
});

const COUNTIES = ["Broward", "Palm Beach", "Martin", "St. Lucie", "Indian River"];
const LICENSE_TYPES = [
  { value: "CGC", label: "CGC — Certified General Contractor" },
  { value: "CBC", label: "CBC — Certified Building Contractor" },
  { value: "CRC", label: "CRC — Certified Residential Contractor" },
];
const PERMIT_TYPES = [
  { id: "building", label: "Building", note: "Structural, framing, envelope" },
  { id: "electrical", label: "Electrical", note: "Service, branch circuits, low-voltage" },
  { id: "plumbing", label: "Plumbing", note: "Supply, DWV, gas" },
  { id: "mechanical", label: "Mechanical", note: "HVAC, ductwork, ventilation" },
  { id: "roofing", label: "Roofing", note: "Re-roof, new roof systems" },
  { id: "pool", label: "Pool / Spa", note: "Vessel, deck, equipment" },
];

const DOC_SLOTS = [
  { id: "plans", label: "Construction Plans", required: true, hint: "Signed & sealed by FL-licensed architect / engineer (PDF)" },
  { id: "survey", label: "Boundary Survey", required: false, hint: "Recent survey w/ legal description" },
  { id: "noc", label: "Notice of Commencement", required: false, hint: "Recorded NOC if construction value > $5,000" },
  { id: "other", label: "Other Supporting Docs", required: false, hint: "Energy calcs, product approvals, HOA approval, etc." },
] as const;

type DocSlotId = (typeof DOC_SLOTS)[number]["id"];

const fmtUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function NewProjectPage() {
  const navigate = useNavigate();
  const [valueInput, setValueInput] = useState("");
  const [permitTypes, setPermitTypes] = useState<Set<string>>(new Set(["building"]));
  const [docs, setDocs] = useState<Record<DocSlotId, File | null>>({
    plans: null, survey: null, noc: null, other: null,
  });
  const [lpoaAcknowledged, setLpoaAcknowledged] = useState(false);

  const constructionValue = useMemo(() => {
    const n = parseFloat(valueInput.replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : 0;
  }, [valueInput]);

  const permittingFee = constructionValue * 0.015;
  const adminFee = 8856;
  const totalDue = permittingFee + adminFee;

  const togglePermit = (id: string) => {
    setPermitTypes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canSubmit =
    constructionValue >= 1_000_000 &&
    permitTypes.size > 0 &&
    docs.plans !== null &&
    lpoaAcknowledged;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Wire up to createServerFn in a later pass
    navigate({ to: "/projects" });
  };

  return (
    <PortalShell>
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="border-b border-obsidian/10 pb-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55 transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="h-3 w-3" />
            All Projects
          </Link>
          <div className="eyebrow mt-6 text-obsidian/50">FL Statute 553.791 · New Filing</div>
          <h1 className="display-serif mt-3 text-5xl text-obsidian">
            New <em>Project</em>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-obsidian/60">
            Cleard files this permit on your firm's behalf as the private provider of record.
            Fees are auto-invoiced at submittal.
          </p>
        </div>

        {/* Section: Project Info */}
        <Section
          step="01"
          title="Project Information"
          description="Where the work happens and what it's worth."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Project Name" required>
              <Input placeholder="Ocean Ridge Estate" required />
            </Field>
            <Field label="Parcel Control Number">
              <Input placeholder="12-43-46-04-01-000-0140" />
            </Field>
            <Field label="Job Site Address" required className="md:col-span-2">
              <Input placeholder="1247 Banyan Trail" required />
            </Field>
            <Field label="City" required>
              <Input placeholder="Ocean Ridge" required />
            </Field>
            <Field label="County" required>
              <Select required>
                <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white">
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="GC License Type" required>
              <Select required>
                <SelectTrigger className="rounded-[3px] border-obsidian/15 bg-white">
                  <SelectValue placeholder="Select license class" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Construction Value (USD)" required>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-obsidian/40">$</span>
                <Input
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="1,000,000"
                  inputMode="numeric"
                  className="pl-7 font-mono tabular-nums"
                  required
                />
              </div>
              {constructionValue > 0 && constructionValue < 1_000_000 && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-oxblood">
                  Cleard serves $1M+ custom residential only
                </p>
              )}
            </Field>
          </div>

          {/* Live fee preview */}
          <div className="mt-8 border border-obsidian/15 bg-paper-warm">
            <div className="border-b border-obsidian/10 px-6 py-3">
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/55">
                Fee Estimate · Auto-Invoiced at Submittal
              </div>
            </div>
            <div className="divide-y divide-obsidian/5 px-6">
              <FeeRow
                label="Permitting Fee"
                sublabel="Construction value × 1.5%"
                amount={permittingFee}
              />
              <FeeRow
                label="Private Provider & Admin Fee"
                sublabel="Flat statutory administration"
                amount={adminFee}
              />
              <div className="flex items-baseline justify-between py-4">
                <div>
                  <div className="font-medium text-obsidian">Total Due</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
                    Invoiced upon affidavit submission
                  </div>
                </div>
                <div className="display-serif text-3xl text-obsidian tabular-nums">
                  {fmtUSD(totalDue)}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Permit Types */}
        <Section
          step="02"
          title="Permit Types"
          description="Select every discipline this filing covers."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PERMIT_TYPES.map((p) => {
              const checked = permitTypes.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`group flex cursor-pointer items-start gap-4 border bg-white px-5 py-4 transition-colors ${
                    checked
                      ? "border-obsidian bg-paper-warm"
                      : "border-obsidian/15 hover:border-obsidian/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => togglePermit(p.id)}
                    className="mt-0.5 rounded-[2px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-obsidian">{p.label}</div>
                    <div className="mt-0.5 text-xs text-obsidian/55">{p.note}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Section>

        {/* Section: Documents */}
        <Section
          step="03"
          title="Documents"
          description="Plans are required at submittal. Other items can be added later."
        >
          <div className="space-y-3">
            {DOC_SLOTS.map((slot) => (
              <DropZone
                key={slot.id}
                slot={slot}
                file={docs[slot.id]}
                onFile={(f) => setDocs((d) => ({ ...d, [slot.id]: f }))}
                onClear={() => setDocs((d) => ({ ...d, [slot.id]: null }))}
              />
            ))}
          </div>
        </Section>

        {/* Section: LPOA */}
        <Section
          step="04"
          title="Limited Power of Attorney"
          description="Required to act as your private provider under FL Statute 553.791."
        >
          <div className="border border-obsidian/15 bg-white">
            <div className="border-b border-obsidian/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
                  LPOA · Affidavit of Agency
                </span>
              </div>
            </div>
            <div className="px-6 py-5 text-sm leading-relaxed text-obsidian/75">
              <p>
                I, as the qualifying agent for the licensed General Contractor of record,
                authorize <strong className="text-obsidian">Cleard by Flōridian</strong> to act
                as the private provider for this permit application under FL Statute 553.791.
                Cleard is empowered to submit the affidavit of compliance, perform plan review
                and inspections, and issue the certificate of compliance to the authority having
                jurisdiction on this project's behalf.
              </p>
              <p className="mt-3">
                I acknowledge that the affidavit obligates the AHJ to issue the permit or written
                citation within <strong className="text-obsidian">10 business days</strong>, and
                that the certificate of compliance obligates the AHJ to issue the CO within{" "}
                <strong className="text-obsidian">2 business days</strong>.
              </p>
            </div>
            <div className="border-t border-obsidian/10 bg-paper-warm px-6 py-4">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={lpoaAcknowledged}
                  onCheckedChange={(v) => setLpoaAcknowledged(v === true)}
                  className="mt-0.5 rounded-[2px]"
                />
                <span className="text-sm text-obsidian">
                  I am the qualifying agent and authorize Cleard to act as private provider on
                  this project.
                </span>
              </label>
            </div>
          </div>
        </Section>

        {/* Footer actions */}
        <div className="mt-12 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-obsidian/10 pt-8 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" className="rounded-[3px]">
            <Link to="/projects">Cancel</Link>
          </Button>
          <div className="flex flex-col items-end gap-2">
            {!canSubmit && (
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/50">
                <AlertCircle className="h-3 w-3" />
                Complete required fields, attach plans, acknowledge LPOA
              </p>
            )}
            <Button type="submit" variant="dark" disabled={!canSubmit}>
              File Permit Application
            </Button>
          </div>
        </div>
      </form>
    </PortalShell>
  );
}

function Section({
  step, title, description, children,
}: { step: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-obsidian/10 pt-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[180px_1fr]">
        <div>
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-sky">
            {step}
          </div>
          <h2 className="display-serif mt-2 text-2xl text-obsidian">{title}</h2>
          <p className="mt-2 text-xs text-obsidian/55">{description}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Field({
  label, required, className, children,
}: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-obsidian/65">
        {label}
        {required && <span className="ml-1 text-oxblood">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FeeRow({ label, sublabel, amount }: { label: string; sublabel: string; amount: number }) {
  return (
    <div className="flex items-baseline justify-between py-3">
      <div>
        <div className="text-sm text-obsidian">{label}</div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-obsidian/45">
          {sublabel}
        </div>
      </div>
      <div className="font-mono text-sm text-obsidian tabular-nums">{fmtUSD(amount)}</div>
    </div>
  );
}

function DropZone({
  slot, file, onFile, onClear,
}: {
  slot: (typeof DOC_SLOTS)[number];
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex items-center gap-5 border bg-white px-5 py-4 transition-colors ${
        drag ? "border-sky bg-sky/5" : file ? "border-obsidian/30 bg-paper-warm" : "border-dashed border-obsidian/25"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
        file ? "border-obsidian/30 bg-white" : "border-obsidian/15 bg-paper-warm"
      }`}>
        {file ? <FileText className="h-4 w-4 text-obsidian/70" /> : <UploadCloud className="h-4 w-4 text-obsidian/50" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-obsidian">{slot.label}</span>
          {slot.required && (
            <span className="border border-oxblood/30 bg-oxblood/10 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-oxblood">
              Required
            </span>
          )}
        </div>
        {file ? (
          <div className="mt-0.5 font-mono text-xs text-obsidian/65">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </div>
        ) : (
          <div className="mt-0.5 text-xs text-obsidian/55">{slot.hint}</div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="rounded-[3px]">
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="rounded-[3px]"
        >
          Browse
        </Button>
      )}
    </div>
  );
}
